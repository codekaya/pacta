use soroban_sdk::{contracttype, Address, BytesN};

/// The payload a payer authorizes. It is the on-chain form of the `upto`
/// scheme's `X-PAYMENT` payload: every field the payer commits to lives here,
/// so the authorization id (its hash) is a complete description of the intent.
///
/// Field order is irrelevant to the id: `#[contracttype]` structs encode as an
/// XDR map with symbol keys in a canonical order.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct UptoAuthorization {
    /// Account funding the payment.
    pub payer: Address,
    /// Sole account that can receive the settled funds (recipient binding).
    pub payee: Address,
    /// Account allowed to name the settled amount, i.e. the resource server or
    /// the facilitator acting on its behalf.
    pub settler: Address,
    /// SEP-41 token the payment is denominated in.
    pub token: Address,
    /// Ceiling the payer is exposed to. Settlement may land anywhere in
    /// `0..=max_amount`; the remainder always returns to the payer.
    pub max_amount: i128,
    /// Unix seconds; settlement is rejected before this time.
    pub valid_after: u64,
    /// Unix seconds; settlement is rejected at or after this time.
    pub valid_before: u64,
    /// Payer-chosen uniqueness salt. Distinct nonces yield distinct ids.
    pub nonce: BytesN<32>,
    /// Opaque commitment to what is being paid for, typically a hash of the
    /// x402 payment requirements. The contract does not interpret it; it only
    /// guarantees the payer and the settler agreed on the same value.
    pub resource: BytesN<32>,
}

/// An authorization whose cap has been escrowed and is awaiting settlement.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Lock {
    pub authorization: UptoAuthorization,
    /// Ledger timestamp at which the cap was escrowed.
    pub locked_at: u64,
}

/// Outcome of a settlement, emitted as event data and returned to the caller.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Settlement {
    pub id: BytesN<32>,
    pub payer: Address,
    pub payee: Address,
    pub token: Address,
    /// Amount transferred to the payee.
    pub settled: i128,
    /// Amount returned to the payer (`max_amount - settled`).
    pub refunded: i128,
}
