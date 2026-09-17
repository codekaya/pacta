#![no_std]
//! Reference implementation of the x402 `upto` payment scheme for Stellar.
//!
//! The `upto` scheme covers payments whose price is unknown when the payer
//! commits: an AI agent calling a metered API knows its budget, not its bill.
//! The payer authorizes a ceiling, the resource server settles the amount
//! actually consumed, and the difference goes back to the payer.
//!
//! SEP-41 allowances cannot express this safely. An allowance names a spender,
//! not a destination, so the spender may send the funds anywhere; and it stays
//! drainable up to its limit until it is explicitly reduced, so nothing
//! confines a session to a single settlement. This contract supplies the three
//! guarantees the scheme needs on top of a plain SEP-41 token:
//!
//! * **recipient binding** — settled funds can only reach `payee`;
//! * **single settlement** — an authorization id settles at most once;
//! * **replay protection** — a consumed id cannot be revived within its window.
//!
//! Two settlement paths are exposed, sharing one payload type and one id
//! derivation:
//!
//! * [`UptoContract::settle_signed`] is the HTTP path. The payer signs the
//!   payload offline, it travels in the `X-PAYMENT` header, and a facilitator
//!   submits the only transaction. Escrow and payout happen atomically.
//! * [`UptoContract::lock`] / [`UptoContract::settle`] is the session path. The
//!   payer escrows a cap up front and the server settles later, which suits an
//!   agent making many metered calls against one budget.

mod error;
mod events;
mod storage;
mod types;

#[cfg(test)]
mod test;

pub use error::Error;
pub use types::{Lock, Settlement, UptoAuthorization};

use soroban_sdk::{
    contract, contractimpl, token, vec, xdr::ToXdr, Address, Bytes, BytesN, Env, IntoVal,
};

use storage::MAX_VALIDITY_WINDOW_SECONDS;

/// Domain separator for authorization ids. Bump the suffix whenever the payload
/// layout or the id derivation changes, so ids from different scheme versions
/// can never collide.
const SCHEME_DOMAIN: &[u8] = b"x402-upto-stellar-v1";

#[contract]
pub struct UptoContract;

#[contractimpl]
impl UptoContract {
    /// Derives the authorization id: `sha256(domain || contract || payload)`.
    ///
    /// Binding the contract address means an id is meaningless against any
    /// other deployment, and the payer's Soroban authorization entry already
    /// commits to the network passphrase, so ids do not cross networks either.
    /// Clients should call this rather than reimplementing the hash.
    pub fn authorization_id(env: Env, authorization: UptoAuthorization) -> BytesN<32> {
        let mut preimage = Bytes::from_slice(&env, SCHEME_DOMAIN);
        preimage.append(&env.current_contract_address().to_xdr(&env));
        preimage.append(&authorization.to_xdr(&env));
        env.crypto().sha256(&preimage).to_bytes()
    }

    /// Escrows `max_amount` and opens an authorization for later settlement.
    ///
    /// Requires the payer's authorization. The cap leaves the payer's balance
    /// immediately, which is what lets a resource server treat the
    /// authorization as funded without trusting the payer to stay solvent.
    pub fn lock(env: Env, authorization: UptoAuthorization) -> Result<BytesN<32>, Error> {
        check_payload(&env, &authorization)?;
        authorization.payer.require_auth();

        let id = Self::authorization_id(env.clone(), authorization.clone());
        if storage::is_consumed(&env, &id) {
            return Err(Error::AlreadyConsumed);
        }

        storage::save_lock(
            &env,
            &id,
            &Lock {
                authorization: authorization.clone(),
                locked_at: env.ledger().timestamp(),
            },
        );

        let escrow = escrow_address(&env);
        token::TokenClient::new(&env, &authorization.token).transfer(
            &authorization.payer,
            &escrow,
            &authorization.max_amount,
        );

        events::Locked {
            id: id.clone(),
            payer: authorization.payer.clone(),
            payee: authorization.payee.clone(),
            token: authorization.token.clone(),
            max_amount: authorization.max_amount,
            valid_before: authorization.valid_before,
        }
        .publish(&env);

        Ok(id)
    }

    /// Settles a locked authorization: `settled` to the payee, the rest back to
    /// the payer.
    ///
    /// Requires the settler's authorization, since the settler is the party
    /// that measured the usage. Closing the lock first makes a second call fail
    /// with [`Error::LockNotFound`], which is the single-settlement guarantee.
    /// Settlement must happen inside the validity window; afterwards the payer
    /// gets the cap back via [`UptoContract::reclaim`].
    pub fn settle(env: Env, id: BytesN<32>, settled: i128) -> Result<Settlement, Error> {
        let authorization = storage::load_lock(&env, &id)
            .ok_or(Error::LockNotFound)?
            .authorization;

        check_window(&env, &authorization)?;
        check_settled_amount(&authorization, settled)?;
        authorization.settler.require_auth();

        storage::close_lock(&env, &id);
        storage::mark_consumed(&env, &id, authorization.valid_before);

        Ok(disburse(&env, &authorization, &id, settled))
    }

    /// Escrows and settles in one transaction, from a payload the payer signed
    /// offline.
    ///
    /// This is the path x402 is built around: the payer never submits a
    /// transaction, it only signs. The payer's authorization covers the payload
    /// alone — `settled` is excluded on purpose, so one signature remains valid
    /// for any amount within the cap. The settler authorizes the full call
    /// including `settled`, which is what pins the final number.
    ///
    /// The cap is routed through the contract rather than sent straight to the
    /// payee because the payer's nested token authorization has to be
    /// deterministic at signing time, and only `max_amount` is known then. The
    /// cost is two extra token calls; the payout is that no signature ever
    /// commits the payer to more than a ceiling.
    pub fn settle_signed(
        env: Env,
        authorization: UptoAuthorization,
        settled: i128,
    ) -> Result<Settlement, Error> {
        check_payload(&env, &authorization)?;
        check_settled_amount(&authorization, settled)?;

        authorization
            .payer
            .require_auth_for_args(vec![&env, authorization.clone().into_val(&env)]);
        authorization.settler.require_auth();

        let id = Self::authorization_id(env.clone(), authorization.clone());
        if storage::is_consumed(&env, &id) {
            return Err(Error::AlreadyConsumed);
        }
        storage::mark_consumed(&env, &id, authorization.valid_before);

        let escrow = escrow_address(&env);
        token::TokenClient::new(&env, &authorization.token).transfer(
            &authorization.payer,
            &escrow,
            &authorization.max_amount,
        );

        Ok(disburse(&env, &authorization, &id, settled))
    }

    /// Returns an unsettled cap to the payer once the validity window has
    /// closed.
    ///
    /// Deliberately permissionless: the funds can only go back to the payer, so
    /// letting anyone — a keeper, the payee, a block explorer user — trigger it
    /// removes the payer's dependence on a cooperative counterparty.
    pub fn reclaim(env: Env, id: BytesN<32>) -> Result<i128, Error> {
        let authorization = storage::load_lock(&env, &id)
            .ok_or(Error::LockNotFound)?
            .authorization;

        if env.ledger().timestamp() < authorization.valid_before {
            return Err(Error::NotExpiredYet);
        }

        storage::close_lock(&env, &id);
        let escrow = escrow_address(&env);
        token::TokenClient::new(&env, &authorization.token).transfer(
            &escrow,
            &authorization.payer,
            &authorization.max_amount,
        );

        events::Reclaimed {
            id: id.clone(),
            payer: authorization.payer.clone(),
            token: authorization.token.clone(),
            amount: authorization.max_amount,
        }
        .publish(&env);

        Ok(authorization.max_amount)
    }

    /// The open escrow under `id`, if any.
    pub fn lock_of(env: Env, id: BytesN<32>) -> Option<Lock> {
        storage::load_lock(&env, &id)
    }

    /// Whether `id` can still be used. True once it has been settled, or while
    /// an escrow is open against it.
    pub fn is_consumed(env: Env, id: BytesN<32>) -> bool {
        storage::is_consumed(&env, &id)
    }
}

/// The contract's own address, which is where escrowed caps are held.
fn escrow_address(env: &Env) -> Address {
    env.current_contract_address()
}

/// Structural and liveness checks applied before a payload is acted on.
fn check_payload(env: &Env, authorization: &UptoAuthorization) -> Result<(), Error> {
    if authorization.max_amount <= 0 {
        return Err(Error::InvalidMaxAmount);
    }
    if authorization.valid_after >= authorization.valid_before {
        return Err(Error::InvalidValidityWindow);
    }
    if authorization.valid_before - authorization.valid_after > MAX_VALIDITY_WINDOW_SECONDS {
        return Err(Error::ValidityWindowTooLong);
    }
    if authorization.payer == authorization.payee {
        return Err(Error::PayerIsPayee);
    }
    check_window(env, authorization)
}

fn check_window(env: &Env, authorization: &UptoAuthorization) -> Result<(), Error> {
    let now = env.ledger().timestamp();
    if now < authorization.valid_after {
        return Err(Error::NotYetValid);
    }
    if now >= authorization.valid_before {
        return Err(Error::Expired);
    }
    Ok(())
}

/// Zero is a legitimate settlement: a metered call that returned nothing owes
/// nothing, and the payer is made whole.
fn check_settled_amount(authorization: &UptoAuthorization, settled: i128) -> Result<(), Error> {
    if settled < 0 || settled > authorization.max_amount {
        return Err(Error::AmountOutOfRange);
    }
    Ok(())
}

/// Splits an escrowed cap between payee and payer. Assumes the caller has
/// already consumed the id, so this can never run twice for one authorization.
fn disburse(
    env: &Env,
    authorization: &UptoAuthorization,
    id: &BytesN<32>,
    settled: i128,
) -> Settlement {
    let token = token::TokenClient::new(env, &authorization.token);
    let escrow = escrow_address(env);
    let refunded = authorization.max_amount - settled;

    if settled > 0 {
        token.transfer(&escrow, &authorization.payee, &settled);
    }
    if refunded > 0 {
        token.transfer(&escrow, &authorization.payer, &refunded);
    }

    events::Settled {
        id: id.clone(),
        payer: authorization.payer.clone(),
        payee: authorization.payee.clone(),
        token: authorization.token.clone(),
        settled,
        refunded,
    }
    .publish(env);

    Settlement {
        id: id.clone(),
        payer: authorization.payer.clone(),
        payee: authorization.payee.clone(),
        token: authorization.token.clone(),
        settled,
        refunded,
    }
}
