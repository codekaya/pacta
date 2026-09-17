use soroban_sdk::{contractevent, Address, BytesN};

/// Published when a cap is escrowed and an authorization becomes settleable.
/// Facilitators index this to learn a payment is live without simulating.
#[contractevent(topics = ["upto", "locked"])]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Locked {
    #[topic]
    pub id: BytesN<32>,
    pub payer: Address,
    pub payee: Address,
    pub token: Address,
    pub max_amount: i128,
    pub valid_before: u64,
}

/// Published exactly once per authorization id that reaches settlement.
#[contractevent(topics = ["upto", "settled"])]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Settled {
    #[topic]
    pub id: BytesN<32>,
    pub payer: Address,
    pub payee: Address,
    pub token: Address,
    pub settled: i128,
    pub refunded: i128,
}

/// Published when an unsettled cap is returned to the payer after expiry.
#[contractevent(topics = ["upto", "reclaimed"])]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Reclaimed {
    #[topic]
    pub id: BytesN<32>,
    pub payer: Address,
    pub token: Address,
    pub amount: i128,
}
