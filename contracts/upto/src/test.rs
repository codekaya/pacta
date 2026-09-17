#![cfg(test)]

use soroban_sdk::{
    testutils::{Address as _, AuthorizedFunction, Ledger, MockAuth, MockAuthInvoke},
    token, vec, Address, BytesN, Env, IntoVal, Symbol, TryFromVal,
};

use crate::{Error, UptoAuthorization, UptoContract, UptoContractClient};

const START_TIME: u64 = 1_700_000_000;
const WINDOW: u64 = 3_600;
const FUNDING: i128 = 1_000_000;
const CAP: i128 = 1_000;

struct Harness<'a> {
    env: Env,
    client: UptoContractClient<'a>,
    escrow: Address,
    token: Address,
    payer: Address,
    payee: Address,
    settler: Address,
}

impl Harness<'_> {
    fn new() -> Self {
        let env = Env::default();
        env.mock_all_auths();
        env.ledger()
            .with_mut(|ledger| ledger.timestamp = START_TIME);

        let token_admin = Address::generate(&env);
        let token = env
            .register_stellar_asset_contract_v2(token_admin)
            .address();
        let payer = Address::generate(&env);

        token::StellarAssetClient::new(&env, &token).mint(&payer, &FUNDING);

        let escrow = env.register(UptoContract, ());
        Self {
            client: UptoContractClient::new(&env, &escrow),
            escrow,
            token,
            payer,
            payee: Address::generate(&env),
            settler: Address::generate(&env),
            env,
        }
    }

    fn authorization(&self, nonce: u8) -> UptoAuthorization {
        UptoAuthorization {
            payer: self.payer.clone(),
            payee: self.payee.clone(),
            settler: self.settler.clone(),
            token: self.token.clone(),
            max_amount: CAP,
            valid_after: START_TIME,
            valid_before: START_TIME + WINDOW,
            nonce: BytesN::from_array(&self.env, &[nonce; 32]),
            resource: BytesN::from_array(&self.env, &[0xAB; 32]),
        }
    }

    fn balance(&self, address: &Address) -> i128 {
        token::TokenClient::new(&self.env, &self.token).balance(address)
    }

    fn advance_to(&self, timestamp: u64) {
        self.env
            .ledger()
            .with_mut(|ledger| ledger.timestamp = timestamp);
    }
}

// --- one-shot path (the x402 HTTP flow) ---------------------------------

#[test]
fn settle_signed_pays_payee_and_refunds_the_difference() {
    let h = Harness::new();
    let authorization = h.authorization(1);

    let settlement = h.client.settle_signed(&authorization, &300);

    assert_eq!(settlement.settled, 300);
    assert_eq!(settlement.refunded, CAP - 300);
    assert_eq!(h.balance(&h.payee), 300);
    assert_eq!(h.balance(&h.payer), FUNDING - 300);
    // Nothing is left behind in the contract: escrow is transient.
    assert_eq!(h.balance(&h.escrow), 0);
}

#[test]
fn settling_the_full_cap_leaves_no_refund() {
    let h = Harness::new();

    let settlement = h.client.settle_signed(&h.authorization(1), &CAP);

    assert_eq!(settlement.refunded, 0);
    assert_eq!(h.balance(&h.payee), CAP);
    assert_eq!(h.balance(&h.payer), FUNDING - CAP);
}

#[test]
fn settling_zero_makes_the_payer_whole() {
    let h = Harness::new();

    let settlement = h.client.settle_signed(&h.authorization(1), &0);

    assert_eq!(settlement.settled, 0);
    assert_eq!(h.balance(&h.payee), 0);
    assert_eq!(h.balance(&h.payer), FUNDING);
}

#[test]
fn an_authorization_cannot_be_settled_twice() {
    let h = Harness::new();
    let authorization = h.authorization(1);

    h.client.settle_signed(&authorization, &100);

    assert_eq!(
        h.client.try_settle_signed(&authorization, &100),
        Err(Ok(Error::AlreadyConsumed))
    );
    assert_eq!(h.balance(&h.payee), 100);
}

#[test]
fn a_fresh_nonce_yields_an_independent_authorization() {
    let h = Harness::new();

    h.client.settle_signed(&h.authorization(1), &100);
    h.client.settle_signed(&h.authorization(2), &250);

    assert_eq!(h.balance(&h.payee), 350);
}

#[test]
fn settlement_above_the_cap_is_rejected() {
    let h = Harness::new();

    assert_eq!(
        h.client.try_settle_signed(&h.authorization(1), &(CAP + 1)),
        Err(Ok(Error::AmountOutOfRange))
    );
    assert_eq!(h.balance(&h.payer), FUNDING);
}

#[test]
fn negative_settlement_is_rejected() {
    let h = Harness::new();

    assert_eq!(
        h.client.try_settle_signed(&h.authorization(1), &-1),
        Err(Ok(Error::AmountOutOfRange))
    );
}

#[test]
fn an_expired_payload_cannot_be_settled() {
    let h = Harness::new();
    let authorization = h.authorization(1);
    h.advance_to(authorization.valid_before);

    assert_eq!(
        h.client.try_settle_signed(&authorization, &100),
        Err(Ok(Error::Expired))
    );
}

#[test]
fn a_payload_is_not_settleable_before_its_window_opens() {
    let h = Harness::new();
    let mut authorization = h.authorization(1);
    authorization.valid_after = START_TIME + 60;

    assert_eq!(
        h.client.try_settle_signed(&authorization, &100),
        Err(Ok(Error::NotYetValid))
    );
}

// --- payload validation -------------------------------------------------

#[test]
fn a_non_positive_cap_is_rejected() {
    let h = Harness::new();
    let mut authorization = h.authorization(1);
    authorization.max_amount = 0;

    assert_eq!(
        h.client.try_settle_signed(&authorization, &0),
        Err(Ok(Error::InvalidMaxAmount))
    );
}

#[test]
fn an_inverted_window_is_rejected() {
    let h = Harness::new();
    let mut authorization = h.authorization(1);
    authorization.valid_after = authorization.valid_before;

    assert_eq!(
        h.client.try_settle_signed(&authorization, &0),
        Err(Ok(Error::InvalidValidityWindow))
    );
}

#[test]
fn an_overlong_window_is_rejected() {
    let h = Harness::new();
    let mut authorization = h.authorization(1);
    authorization.valid_before = authorization.valid_after + 30 * 24 * 60 * 60;

    assert_eq!(
        h.client.try_settle_signed(&authorization, &0),
        Err(Ok(Error::ValidityWindowTooLong))
    );
}

#[test]
fn paying_yourself_is_rejected() {
    let h = Harness::new();
    let mut authorization = h.authorization(1);
    authorization.payee = authorization.payer.clone();

    assert_eq!(
        h.client.try_settle_signed(&authorization, &0),
        Err(Ok(Error::PayerIsPayee))
    );
}

// --- what the payer's signature actually covers -------------------------

/// The payer signs the payload and the cap transfer, and nothing else. Keeping
/// `settled` out of the signed args is what makes one offline signature usable
/// for any amount within the cap; this test pins that shape down, because the
/// spec depends on it.
#[test]
fn the_payer_authorizes_the_payload_but_not_the_settled_amount() {
    let h = Harness::new();
    let authorization = h.authorization(1);

    h.client.settle_signed(&authorization, &777);

    let auths = h.env.auths();
    let (_, payer_invocation) = auths
        .iter()
        .find(|(address, _)| *address == h.payer)
        .expect("payer must be asked to authorize");

    let AuthorizedFunction::Contract((contract, function, args)) = &payer_invocation.function
    else {
        panic!("expected a contract invocation");
    };
    assert_eq!(*contract, h.escrow);
    assert_eq!(*function, Symbol::new(&h.env, "settle_signed"));
    assert_eq!(args.len(), 1, "only the payload is signed, not the amount");
    assert_eq!(
        UptoAuthorization::try_from_val(&h.env, &args.get_unchecked(0)).unwrap(),
        authorization
    );

    let AuthorizedFunction::Contract((token, transfer, transfer_args)) =
        &payer_invocation.sub_invocations[0].function
    else {
        panic!("expected a nested token transfer");
    };
    assert_eq!(*token, h.token);
    assert_eq!(*transfer, Symbol::new(&h.env, "transfer"));
    assert_eq!(
        i128::try_from_val(&h.env, &transfer_args.get_unchecked(2)).unwrap(),
        CAP,
        "the payer's nested transfer commits to the cap, never to the outcome"
    );
}

/// Recipient binding: a signature obtained for one payee is worthless against
/// another. A facilitator that swaps the payee cannot satisfy the payer's
/// authorization.
#[test]
#[should_panic(expected = "Unauthorized")]
fn a_payload_signed_for_one_payee_cannot_be_redirected() {
    let h = Harness::new();
    let signed = h.authorization(1);
    let mut redirected = signed.clone();
    redirected.payee = Address::generate(&h.env);

    h.env.mock_auths(&[
        MockAuth {
            address: &h.payer,
            invoke: &MockAuthInvoke {
                contract: &h.escrow,
                fn_name: "settle_signed",
                args: vec![&h.env, signed.clone().into_val(&h.env)],
                sub_invokes: &[MockAuthInvoke {
                    contract: &h.token,
                    fn_name: "transfer",
                    args: (h.payer.clone(), h.escrow.clone(), CAP).into_val(&h.env),
                    sub_invokes: &[],
                }],
            },
        },
        MockAuth {
            address: &h.settler,
            invoke: &MockAuthInvoke {
                contract: &h.escrow,
                fn_name: "settle_signed",
                args: (redirected.clone(), 100i128).into_val(&h.env),
                sub_invokes: &[],
            },
        },
    ]);

    h.client.settle_signed(&redirected, &100);
}

/// The settler, not the payer, names the amount — so the payer alone cannot
/// push a settlement through.
#[test]
#[should_panic(expected = "Unauthorized")]
fn the_settler_must_authorize_the_settlement() {
    let h = Harness::new();
    let authorization = h.authorization(1);

    h.env.mock_auths(&[MockAuth {
        address: &h.payer,
        invoke: &MockAuthInvoke {
            contract: &h.escrow,
            fn_name: "settle_signed",
            args: vec![&h.env, authorization.clone().into_val(&h.env)],
            sub_invokes: &[MockAuthInvoke {
                contract: &h.token,
                fn_name: "transfer",
                args: (h.payer.clone(), h.escrow.clone(), CAP).into_val(&h.env),
                sub_invokes: &[],
            }],
        },
    }]);

    h.client.settle_signed(&authorization, &100);
}

// --- session path (lock, then settle) -----------------------------------

#[test]
fn locking_moves_the_cap_into_escrow() {
    let h = Harness::new();
    let authorization = h.authorization(1);

    let id = h.client.lock(&authorization);

    assert_eq!(h.balance(&h.escrow), CAP);
    assert_eq!(h.balance(&h.payer), FUNDING - CAP);
    assert_eq!(h.client.lock_of(&id).unwrap().authorization, authorization);
    assert!(h.client.is_consumed(&id));
}

#[test]
fn the_id_is_derived_from_the_payload_alone() {
    let h = Harness::new();
    let authorization = h.authorization(1);

    let derived = h.client.authorization_id(&authorization);

    assert_eq!(h.client.lock(&authorization), derived);
}

#[test]
fn settling_a_lock_splits_the_escrow() {
    let h = Harness::new();
    let id = h.client.lock(&h.authorization(1));

    let settlement = h.client.settle(&id, &400);

    assert_eq!(settlement.settled, 400);
    assert_eq!(settlement.refunded, CAP - 400);
    assert_eq!(h.balance(&h.payee), 400);
    assert_eq!(h.balance(&h.payer), FUNDING - 400);
    assert_eq!(h.balance(&h.escrow), 0);
    assert!(h.client.lock_of(&id).is_none());
}

#[test]
fn a_settled_lock_is_gone_and_stays_consumed() {
    let h = Harness::new();
    let id = h.client.lock(&h.authorization(1));
    h.client.settle(&id, &400);

    assert_eq!(h.client.try_settle(&id, &1), Err(Ok(Error::LockNotFound)));
    assert!(h.client.is_consumed(&id));
}

#[test]
fn a_lock_cannot_be_reopened_after_settlement() {
    let h = Harness::new();
    let authorization = h.authorization(1);
    let id = h.client.lock(&authorization);
    h.client.settle(&id, &400);

    assert_eq!(
        h.client.try_lock(&authorization),
        Err(Ok(Error::AlreadyConsumed))
    );
}

#[test]
fn settling_after_the_window_closes_is_rejected() {
    let h = Harness::new();
    let authorization = h.authorization(1);
    let id = h.client.lock(&authorization);
    h.advance_to(authorization.valid_before);

    assert_eq!(h.client.try_settle(&id, &400), Err(Ok(Error::Expired)));
    assert_eq!(h.balance(&h.escrow), CAP);
}

#[test]
fn settling_an_unknown_id_is_rejected() {
    let h = Harness::new();
    let unknown = BytesN::from_array(&h.env, &[9u8; 32]);

    assert_eq!(
        h.client.try_settle(&unknown, &1),
        Err(Ok(Error::LockNotFound))
    );
}

// --- reclaiming an unsettled cap ----------------------------------------

#[test]
fn an_expired_lock_returns_the_cap_to_the_payer() {
    let h = Harness::new();
    let authorization = h.authorization(1);
    let id = h.client.lock(&authorization);
    h.advance_to(authorization.valid_before);

    assert_eq!(h.client.reclaim(&id), CAP);
    assert_eq!(h.balance(&h.payer), FUNDING);
    assert_eq!(h.balance(&h.escrow), 0);
    assert!(h.client.lock_of(&id).is_none());
}

#[test]
fn a_live_lock_cannot_be_reclaimed() {
    let h = Harness::new();
    let id = h.client.lock(&h.authorization(1));

    assert_eq!(h.client.try_reclaim(&id), Err(Ok(Error::NotExpiredYet)));
    assert_eq!(h.balance(&h.escrow), CAP);
}

/// Reclaim is permissionless on purpose: it can only return funds to the payer,
/// so the payer never needs a cooperative counterparty to get the cap back.
#[test]
fn anyone_may_trigger_a_reclaim() {
    let h = Harness::new();
    let authorization = h.authorization(1);
    let id = h.client.lock(&authorization);
    h.advance_to(authorization.valid_before);

    h.env.mock_auths(&[]);
    h.client.reclaim(&id);

    assert_eq!(h.balance(&h.payer), FUNDING);
}

#[test]
fn a_reclaimed_lock_cannot_be_reclaimed_again() {
    let h = Harness::new();
    let authorization = h.authorization(1);
    let id = h.client.lock(&authorization);
    h.advance_to(authorization.valid_before);
    h.client.reclaim(&id);

    assert_eq!(h.client.try_reclaim(&id), Err(Ok(Error::LockNotFound)));
}
