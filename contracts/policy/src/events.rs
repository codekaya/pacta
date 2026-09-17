use soroban_sdk::{contractevent, Address, BytesN, Vec};

use crate::types::{Distribution, Reason};

/// Published once per deal when its terms become immutable.
#[contractevent(topics = ["pacta", "committed"])]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Committed {
    #[topic]
    pub deal_id: BytesN<32>,
    #[topic]
    pub escrow: Address,
    pub procedure_date: u64,
}

/// Published once per deal. Anyone can compare `distributions` with the
/// Trustless Work release or resolve-dispute that follows it.
#[contractevent(topics = ["pacta", "settled"])]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Settled {
    #[topic]
    pub deal_id: BytesN<32>,
    #[topic]
    pub escrow: Address,
    pub reason: Reason,
    pub at: u64,
    pub balance: i128,
    pub distributions: Vec<Distribution>,
}
