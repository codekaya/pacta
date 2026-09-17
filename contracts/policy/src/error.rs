use soroban_sdk::contracterror;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    /// A policy needs at least one tier.
    NoTiers = 1,
    /// More than `MAX_TIERS` tiers.
    TooManyTiers = 2,
    /// A tier's `refund_bps`, or `agency_bps`, exceeds 10_000.
    BpsOutOfRange = 3,
    /// Two tiers share the same `min_days_before`.
    DuplicateTier = 4,
    /// The procedure date is not in the future.
    ProcedureInPast = 5,
    /// Patient, clinic and agency must be distinct addresses.
    PartiesOverlap = 6,
    /// Terms for this deal id were already committed. Policies are immutable.
    AlreadyCommitted = 7,
    /// The escrow already has a committed policy.
    EscrowAlreadyBound = 8,
    /// No policy exists under this deal id or escrow.
    PolicyNotFound = 9,
    /// A settlement was already recorded for this deal.
    AlreadySettled = 10,
    /// Balance to distribute must be positive.
    InvalidBalance = 11,
    /// Evaluation time is before commitment or after the current ledger.
    InvalidTime = 12,
}
