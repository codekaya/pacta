use soroban_sdk::contracterror;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    /// `max_amount` must be strictly positive.
    InvalidMaxAmount = 1,
    /// `valid_after` must be strictly before `valid_before`.
    InvalidValidityWindow = 2,
    /// The validity window exceeds `MAX_VALIDITY_WINDOW_SECONDS`.
    ValidityWindowTooLong = 3,
    /// `payer` and `payee` must differ.
    PayerIsPayee = 4,
    /// The ledger timestamp has not reached `valid_after` yet.
    NotYetValid = 5,
    /// The ledger timestamp is at or past `valid_before`.
    Expired = 6,
    /// This authorization id was already consumed (replay attempt).
    AlreadyConsumed = 7,
    /// No locked authorization exists under this id.
    LockNotFound = 8,
    /// `actual_amount` is negative or greater than the authorized cap.
    AmountOutOfRange = 9,
    /// A lock can only be reclaimed once its validity window has closed.
    NotExpiredYet = 10,
}
