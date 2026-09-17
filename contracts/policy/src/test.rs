#![cfg(test)]
extern crate std;

use soroban_sdk::{
    testutils::{Address as _, Events as _, Ledger},
    vec, Address, Env, Vec,
};

use crate::{
    Distribution, Error, PolicyContract, PolicyContractClient, Reason, Terms, Tier, DAY_SECONDS,
};

/// 2026-10-28T09:00:00+03:00 — same procedure date as web/lib/policy.test.ts.
const PROCEDURE: u64 = 1_793_167_200;
const COMMITTED: u64 = PROCEDURE - 40 * DAY_SECONDS;
/// 869.5652174 USDC in base units — the demo deal's escrow balance.
const BALANCE: i128 = 8_695_652_174;

struct Harness<'a> {
    env: Env,
    client: PolicyContractClient<'a>,
    terms: Terms,
}

impl Harness<'_> {
    fn new() -> Self {
        Self::with_agency(true)
    }

    fn with_agency(agency: bool) -> Self {
        let env = Env::default();
        env.mock_all_auths();
        env.ledger().with_mut(|l| l.timestamp = COMMITTED);

        let operator = Address::generate(&env);
        let id = env.register(PolicyContract, (&operator,));
        let client = PolicyContractClient::new(&env, &id);

        let terms = Terms {
            escrow: Address::generate(&env),
            patient: Address::generate(&env),
            clinic: Address::generate(&env),
            agency: agency.then(|| Address::generate(&env)),
            procedure_date: PROCEDURE,
            tiers: vec![
                &env,
                Tier {
                    min_days_before: 14,
                    refund_bps: 10_000,
                },
                Tier {
                    min_days_before: 7,
                    refund_bps: 5_000,
                },
                Tier {
                    min_days_before: 0,
                    refund_bps: 0,
                },
            ],
            agency_bps: 1_000,
        };
        Harness { env, client, terms }
    }

    fn committed(self) -> (Self, soroban_sdk::BytesN<32>) {
        let id = self.client.commit(&self.terms);
        (self, id)
    }

    fn at(seconds_before: i64) -> u64 {
        (PROCEDURE as i64 - seconds_before) as u64
    }

    fn refund_bps(&self, id: &soroban_sdk::BytesN<32>, seconds_before: i64) -> u32 {
        self.client
            .entitlement(id, &Reason::PatientCancel, &Self::at(seconds_before))
            .patient_bps
    }
}

fn day(n: i64) -> i64 {
    n * DAY_SECONDS as i64
}

fn total(rows: &Vec<Distribution>) -> i128 {
    rows.iter().map(|r| r.amount).sum()
}

// ---------------------------------------------------------------- commitment

#[test]
fn commit_returns_the_derived_id_and_stores_terms() {
    let h = Harness::new();
    let expected = h.client.deal_id(&h.terms);
    let (h, id) = h.committed();
    // Events reflect the last invocation only, so check before any read.
    assert_eq!(h.env.events().all().events().len(), 1);

    assert_eq!(id, expected);
    assert_eq!(h.client.policy(&id).terms, h.terms);
    assert_eq!(h.client.policy(&id).committed_at, COMMITTED);
    assert_eq!(h.client.deal_of(&h.terms.escrow), id);
}

#[test]
fn committed_terms_cannot_be_written_twice() {
    let (h, _) = Harness::new().committed();
    assert_eq!(
        h.client.try_commit(&h.terms),
        Err(Ok(Error::AlreadyCommitted))
    );
}

#[test]
fn an_escrow_binds_to_one_policy_only() {
    let (h, _) = Harness::new().committed();
    let mut kinder = h.terms.clone();
    kinder.tiers = vec![
        &h.env,
        Tier {
            min_days_before: 0,
            refund_bps: 10_000,
        },
    ];
    assert_eq!(
        h.client.try_commit(&kinder),
        Err(Ok(Error::EscrowAlreadyBound))
    );
}

#[test]
fn commit_requires_the_operator() {
    let h = Harness::new();
    h.client.commit(&h.terms);
    let auths = h.env.auths();
    assert_eq!(auths.len(), 1);
    assert_eq!(auths[0].0, h.client.operator());
}

#[test]
fn invalid_terms_are_rejected() {
    let h = Harness::new();
    let env = &h.env;

    let mut t = h.terms.clone();
    t.tiers = vec![env];
    assert_eq!(h.client.try_commit(&t), Err(Ok(Error::NoTiers)));

    let mut t = h.terms.clone();
    t.tiers.push_back(Tier {
        min_days_before: 3,
        refund_bps: 10_001,
    });
    assert_eq!(h.client.try_commit(&t), Err(Ok(Error::BpsOutOfRange)));

    let mut t = h.terms.clone();
    t.agency_bps = 10_001;
    assert_eq!(h.client.try_commit(&t), Err(Ok(Error::BpsOutOfRange)));

    let mut t = h.terms.clone();
    t.tiers.push_back(Tier {
        min_days_before: 7,
        refund_bps: 2_500,
    });
    assert_eq!(h.client.try_commit(&t), Err(Ok(Error::DuplicateTier)));

    let mut t = h.terms.clone();
    t.procedure_date = COMMITTED;
    assert_eq!(h.client.try_commit(&t), Err(Ok(Error::ProcedureInPast)));

    let mut t = h.terms.clone();
    t.clinic = t.patient.clone();
    assert_eq!(h.client.try_commit(&t), Err(Ok(Error::PartiesOverlap)));

    let mut t = h.terms.clone();
    t.tiers = Vec::new(env);
    for d in 0..9 {
        t.tiers.push_back(Tier {
            min_days_before: d,
            refund_bps: 0,
        });
    }
    assert_eq!(h.client.try_commit(&t), Err(Ok(Error::TooManyTiers)));
}

// ---------------------------------------------------------------- tiers (parity with policy.test.ts)

#[test]
fn tier_cutoff_is_inclusive() {
    let (h, id) = Harness::new().committed();
    assert_eq!(h.refund_bps(&id, day(14)), 10_000);
    assert_eq!(h.refund_bps(&id, day(14) - 1), 5_000);
    assert_eq!(h.refund_bps(&id, day(7)), 5_000);
    assert_eq!(h.refund_bps(&id, day(7) - 1), 0);
}

#[test]
fn after_the_procedure_the_narrowest_tier_applies() {
    let (h, id) = Harness::new().committed();
    assert_eq!(h.refund_bps(&id, -day(30)), 0);
}

#[test]
fn tier_order_in_terms_does_not_matter() {
    let mut h = Harness::new();
    h.terms.tiers = vec![
        &h.env,
        Tier {
            min_days_before: 0,
            refund_bps: 0,
        },
        Tier {
            min_days_before: 14,
            refund_bps: 10_000,
        },
        Tier {
            min_days_before: 7,
            refund_bps: 5_000,
        },
    ];
    let (h, id) = h.committed();
    assert_eq!(h.refund_bps(&id, day(20)), 10_000);
    assert_eq!(h.refund_bps(&id, day(10)), 5_000);
    assert_eq!(h.refund_bps(&id, day(3)), 0);
}

#[test]
fn clinic_cancel_ignores_tiers_and_arrival_refunds_nothing() {
    let (h, id) = Harness::new().committed();
    let late = Harness::at(day(1));
    assert_eq!(
        h.client
            .entitlement(&id, &Reason::ClinicCancel, &late)
            .patient_bps,
        10_000
    );
    let arrival = h.client.entitlement(&id, &Reason::Arrival, &late);
    assert_eq!(
        (arrival.patient_bps, arrival.clinic_bps, arrival.agency_bps),
        (0, 9_000, 1_000)
    );
}

#[test]
fn shares_always_sum_to_10000() {
    let (h, id) = Harness::new().committed();
    for s in [day(60), day(14), day(10), 0, -day(1)] {
        let e = h
            .client
            .entitlement(&id, &Reason::PatientCancel, &Harness::at(s));
        assert_eq!(e.patient_bps + e.clinic_bps + e.agency_bps, 10_000);
    }
}

// ---------------------------------------------------------------- distributions

#[test]
fn distributions_sum_to_balance_with_no_zero_rows() {
    let (h, id) = Harness::new().committed();
    for balance in [
        BALANCE,
        1,
        10_000_000,
        10_000_000_000,
        333_333_333,
        77_777_777,
    ] {
        for s in [day(20), day(10), day(1)] {
            let rows = h
                .client
                .distribute(&id, &Reason::PatientCancel, &Harness::at(s), &balance);
            assert_eq!(total(&rows), balance);
            assert!(rows.iter().all(|r| r.amount > 0));
        }
    }
}

#[test]
fn full_refund_lists_only_the_patient() {
    let (h, id) = Harness::new().committed();
    let rows = h
        .client
        .distribute(&id, &Reason::PatientCancel, &Harness::at(day(20)), &BALANCE);
    assert_eq!(
        rows,
        vec![
            &h.env,
            Distribution {
                address: h.terms.patient.clone(),
                amount: BALANCE
            }
        ]
    );
}

#[test]
fn half_refund_matches_policy_ts_exactly() {
    // policy.ts on 8695652174n @ 10 days: agency 434782608, clinic 3913043478, patient 4347826088.
    let (h, id) = Harness::new().committed();
    let rows = h
        .client
        .distribute(&id, &Reason::PatientCancel, &Harness::at(day(10)), &BALANCE);
    let agency = h.terms.agency.clone().unwrap();
    assert_eq!(
        rows,
        vec![
            &h.env,
            Distribution {
                address: h.terms.patient.clone(),
                amount: 4_347_826_088
            },
            Distribution {
                address: h.terms.clinic.clone(),
                amount: 3_913_043_478
            },
            Distribution {
                address: agency,
                amount: 434_782_608
            },
        ]
    );
}

#[test]
fn no_refund_leaves_the_patient_off_the_list() {
    let (h, id) = Harness::new().committed();
    let rows = h
        .client
        .distribute(&id, &Reason::PatientCancel, &Harness::at(day(1)), &BALANCE);
    let addresses: std::vec::Vec<Address> = rows.iter().map(|r| r.address).collect();
    assert_eq!(
        addresses,
        [h.terms.clinic.clone(), h.terms.agency.clone().unwrap()]
    );
}

#[test]
fn without_an_agency_its_share_goes_to_the_clinic() {
    let (h, id) = Harness::with_agency(false).committed();
    let rows = h.client.distribute(
        &id,
        &Reason::PatientCancel,
        &Harness::at(day(1)),
        &1_000_000_000,
    );
    assert_eq!(
        rows,
        vec![
            &h.env,
            Distribution {
                address: h.terms.clinic.clone(),
                amount: 1_000_000_000
            }
        ]
    );
}

#[test]
fn zero_balance_is_rejected() {
    let (h, id) = Harness::new().committed();
    assert_eq!(
        h.client
            .try_distribute(&id, &Reason::PatientCancel, &Harness::at(day(1)), &0),
        Err(Ok(Error::InvalidBalance))
    );
}

// ---------------------------------------------------------------- settlement record

#[test]
fn settle_records_once_and_emits_the_split() {
    let (h, id) = Harness::new().committed();
    let at = Harness::at(day(10));
    h.env.ledger().with_mut(|l| l.timestamp = at + 60);

    let settlement = h.client.settle(&id, &Reason::PatientCancel, &at, &BALANCE);
    assert_eq!(h.env.events().all().events().len(), 1);
    assert_eq!(settlement.distributions.len(), 3);
    assert_eq!(h.client.settlement(&id), settlement);

    assert_eq!(
        h.client
            .try_settle(&id, &Reason::ClinicCancel, &at, &BALANCE),
        Err(Ok(Error::AlreadySettled))
    );
}

#[test]
fn settle_rejects_back_dated_and_future_times() {
    let (h, id) = Harness::new().committed();
    let now = Harness::at(day(10));
    h.env.ledger().with_mut(|l| l.timestamp = now);

    // Post-dating to a cheaper tier is impossible; so is claiming a time before payment.
    assert_eq!(
        h.client
            .try_settle(&id, &Reason::PatientCancel, &(now + 1), &BALANCE),
        Err(Ok(Error::InvalidTime))
    );
    assert_eq!(
        h.client
            .try_settle(&id, &Reason::PatientCancel, &(COMMITTED - 1), &BALANCE),
        Err(Ok(Error::InvalidTime))
    );
}

#[test]
fn unknown_deal_is_not_found() {
    let (h, _) = Harness::new().committed();
    let mut terms = h.terms.clone();
    terms.escrow = Address::generate(&h.env);
    let other = h.client.deal_id(&terms);
    assert_eq!(h.client.try_policy(&other), Err(Ok(Error::PolicyNotFound)));
}
