#![no_std]
//! Pacta Policy Commitment Contract.
//!
//! Trustless Work holds the deposit; this contract holds the promise. It never
//! touches funds. For each escrow it stores the cancellation terms the patient
//! saw before paying, makes them immutable, and computes — for anyone, at any
//! time — exactly what each party is owed.
//!
//! Trustless Work refunds go through a dispute resolver who picks the amounts.
//! Pacta is that resolver, so the policy is not *enforced* by the escrow. What
//! this contract adds is that any deviation is *provable*: [`PolicyContract::settle`]
//! records the split Pacta computed before it signs `resolve-dispute`, and the
//! stateless [`PolicyContract::distribute`] lets anyone recompute it.
//!
//! The arithmetic mirrors `web/lib/policy.ts` line for line. The two must agree;
//! the parity vectors in `test.rs` are copied from `policy.test.ts`.

mod error;
mod events;
mod storage;
mod types;

#[cfg(test)]
mod test;

pub use error::Error;
pub use types::{Distribution, Entitlement, Policy, Reason, Settlement, Terms, Tier};

use soroban_sdk::{contract, contractimpl, vec, xdr::ToXdr, Address, Bytes, BytesN, Env, Vec};

/// Domain separator for deal ids — same derivation as `x402-upto`. Bump the
/// suffix whenever `Terms` or the derivation changes.
const POLICY_DOMAIN: &[u8] = b"pacta-policy-v1";

pub const BPS: u32 = 10_000;
pub const DAY_SECONDS: u64 = 86_400;
pub const MAX_TIERS: u32 = 8;

#[contract]
pub struct PolicyContract;

#[contractimpl]
impl PolicyContract {
    /// `operator` is Pacta: the only account that may commit terms and record settlements.
    pub fn __constructor(env: Env, operator: Address) {
        storage::set_operator(&env, &operator);
    }

    pub fn operator(env: Env) -> Address {
        storage::operator(&env)
    }

    /// `sha256(domain || contract || terms)`. Clients should call this rather
    /// than reimplementing the hash.
    pub fn deal_id(env: Env, terms: Terms) -> BytesN<32> {
        let mut preimage = Bytes::from_slice(&env, POLICY_DOMAIN);
        preimage.append(&env.current_contract_address().to_xdr(&env));
        preimage.append(&terms.to_xdr(&env));
        env.crypto().sha256(&preimage).to_bytes()
    }

    /// Makes `terms` immutable. One policy per escrow, one commitment per id.
    pub fn commit(env: Env, terms: Terms) -> Result<BytesN<32>, Error> {
        storage::operator(&env).require_auth();
        check_terms(&env, &terms)?;

        let id = Self::deal_id(env.clone(), terms.clone());
        if storage::has_policy(&env, &id) {
            return Err(Error::AlreadyCommitted);
        }
        if storage::deal_of_escrow(&env, &terms.escrow).is_some() {
            return Err(Error::EscrowAlreadyBound);
        }

        let policy = Policy {
            terms: terms.clone(),
            committed_at: env.ledger().timestamp(),
        };
        storage::save_policy(&env, &id, &policy);

        events::Committed {
            deal_id: id.clone(),
            escrow: terms.escrow,
            procedure_date: terms.procedure_date,
        }
        .publish(&env);

        Ok(id)
    }

    pub fn policy(env: Env, deal_id: BytesN<32>) -> Result<Policy, Error> {
        storage::load_policy(&env, &deal_id).ok_or(Error::PolicyNotFound)
    }

    /// Lookup for verifiers who start from the Trustless Work escrow address.
    pub fn deal_of(env: Env, escrow: Address) -> Result<BytesN<32>, Error> {
        storage::deal_of_escrow(&env, &escrow).ok_or(Error::PolicyNotFound)
    }

    /// Basis points owed if the deal settles for `reason` at `at`.
    pub fn entitlement(
        env: Env,
        deal_id: BytesN<32>,
        reason: Reason,
        at: u64,
    ) -> Result<Entitlement, Error> {
        let policy = Self::policy(env, deal_id)?;
        Ok(entitlement(&policy.terms, reason, at))
    }

    /// The exact `resolve-dispute` list for `balance`. Read-only; anyone can call it.
    pub fn distribute(
        env: Env,
        deal_id: BytesN<32>,
        reason: Reason,
        at: u64,
        balance: i128,
    ) -> Result<Vec<Distribution>, Error> {
        let policy = Self::policy(env.clone(), deal_id)?;
        distribute(&env, &policy.terms, reason, at, balance)
    }

    /// Records, once, the split Pacta is about to send to Trustless Work.
    ///
    /// `at` must fall between commitment and the current ledger, so a
    /// cancellation cannot be back-dated to before the patient paid or
    /// post-dated to a cheaper tier.
    pub fn settle(
        env: Env,
        deal_id: BytesN<32>,
        reason: Reason,
        at: u64,
        balance: i128,
    ) -> Result<Settlement, Error> {
        storage::operator(&env).require_auth();

        let policy = Self::policy(env.clone(), deal_id.clone())?;
        if storage::has_settlement(&env, &deal_id) {
            return Err(Error::AlreadySettled);
        }
        let now = env.ledger().timestamp();
        if at < policy.committed_at || at > now {
            return Err(Error::InvalidTime);
        }

        let distributions = distribute(&env, &policy.terms, reason, at, balance)?;
        let settlement = Settlement {
            reason,
            at,
            balance,
            distributions: distributions.clone(),
            recorded_at: now,
        };
        storage::save_settlement(&env, &deal_id, &settlement);

        events::Settled {
            deal_id,
            escrow: policy.terms.escrow,
            reason,
            at,
            balance,
            distributions,
        }
        .publish(&env);

        Ok(settlement)
    }

    pub fn settlement(env: Env, deal_id: BytesN<32>) -> Result<Settlement, Error> {
        storage::load_settlement(&env, &deal_id).ok_or(Error::PolicyNotFound)
    }
}

// ---------------------------------------------------------------- policy math

fn check_terms(env: &Env, terms: &Terms) -> Result<(), Error> {
    let count = terms.tiers.len();
    if count == 0 {
        return Err(Error::NoTiers);
    }
    if count > MAX_TIERS {
        return Err(Error::TooManyTiers);
    }
    if terms.agency_bps > BPS {
        return Err(Error::BpsOutOfRange);
    }
    for (i, tier) in terms.tiers.iter().enumerate() {
        if tier.refund_bps > BPS {
            return Err(Error::BpsOutOfRange);
        }
        for other in terms.tiers.iter().skip(i + 1) {
            if other.min_days_before == tier.min_days_before {
                return Err(Error::DuplicateTier);
            }
        }
    }
    if terms.procedure_date <= env.ledger().timestamp() {
        return Err(Error::ProcedureInPast);
    }
    if terms.patient == terms.clinic
        || terms
            .agency
            .as_ref()
            .is_some_and(|a| *a == terms.patient || *a == terms.clinic)
    {
        return Err(Error::PartiesOverlap);
    }
    Ok(())
}

/// Mirrors `entitlement` / `clinicCancelEntitlement` in policy.ts.
fn entitlement(terms: &Terms, reason: Reason, at: u64) -> Entitlement {
    let refund_bps = match reason {
        Reason::Arrival => 0,
        Reason::ClinicCancel => BPS,
        Reason::PatientCancel => {
            // Widest tier first; a tier applies up to and including its cutoff.
            // Past every cutoff, the narrowest tier applies.
            let mut matched: Option<Tier> = None;
            let mut narrowest: Option<Tier> = None;
            for tier in terms.tiers.iter() {
                let cutoff = terms.procedure_date as i128
                    - tier.min_days_before as i128 * DAY_SECONDS as i128;
                if (at as i128) <= cutoff
                    && matched
                        .as_ref()
                        .is_none_or(|m| tier.min_days_before > m.min_days_before)
                {
                    matched = Some(tier.clone());
                }
                if narrowest
                    .as_ref()
                    .is_none_or(|n| tier.min_days_before < n.min_days_before)
                {
                    narrowest = Some(tier.clone());
                }
            }
            matched
                .or(narrowest)
                .map(|t| t.refund_bps)
                .unwrap_or_default()
        }
    };

    let retained = BPS - refund_bps;
    // Floor, remainder to the clinic, so the three shares sum to exactly 10_000.
    let agency_bps = retained * terms.agency_bps / BPS;
    Entitlement {
        patient_bps: refund_bps,
        clinic_bps: retained - agency_bps,
        agency_bps,
    }
}

/// Mirrors `distribute` in policy.ts: positive amounts only, summing to `balance`.
fn distribute(
    env: &Env,
    terms: &Terms,
    reason: Reason,
    at: u64,
    balance: i128,
) -> Result<Vec<Distribution>, Error> {
    if balance <= 0 {
        return Err(Error::InvalidBalance);
    }
    let e = entitlement(terms, reason, at);
    let bps = BPS as i128;

    let (agency_bps, clinic_bps) = match terms.agency {
        Some(_) => (e.agency_bps as i128, e.clinic_bps as i128),
        None => (0, (e.clinic_bps + e.agency_bps) as i128),
    };

    let agency = balance * agency_bps / bps;
    let (patient, clinic) = if e.patient_bps > 0 {
        let clinic = balance * clinic_bps / bps;
        // Rounding remainder favours the patient (FR-4).
        (balance - agency - clinic, clinic)
    } else {
        (0, balance - agency)
    };

    let mut rows = vec![env];
    for (address, amount) in [
        (Some(terms.patient.clone()), patient),
        (Some(terms.clinic.clone()), clinic),
        (terms.agency.clone(), agency),
    ] {
        if let Some(address) = address {
            if amount > 0 {
                rows.push_back(Distribution { address, amount });
            }
        }
    }
    Ok(rows)
}
