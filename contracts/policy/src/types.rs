use soroban_sdk::{contracttype, Address, Vec};

/// One cancellation tier: cancelling at least `min_days_before` days before the
/// procedure refunds `refund_bps` of the deposit to the patient.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Tier {
    pub min_days_before: u32,
    /// Basis points, 10_000 = 100%.
    pub refund_bps: u32,
}

/// Everything the patient saw before paying. Its hash is the deal id, so the
/// id alone is a complete commitment to the terms.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Terms {
    /// Trustless Work escrow contract holding the deposit. One policy per escrow.
    pub escrow: Address,
    pub patient: Address,
    pub clinic: Address,
    /// When absent, the agency share is paid to the clinic.
    pub agency: Option<Address>,
    /// Unix seconds.
    pub procedure_date: u64,
    /// Order is irrelevant; evaluation always runs widest tier first.
    pub tiers: Vec<Tier>,
    /// Agency cut of whatever the patient does not get back, basis points.
    pub agency_bps: u32,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Policy {
    pub terms: Terms,
    pub committed_at: u64,
}

/// Basis-point split owed at a given moment. Always sums to exactly 10_000.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Entitlement {
    pub patient_bps: u32,
    pub clinic_bps: u32,
    pub agency_bps: u32,
}

#[contracttype]
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum Reason {
    /// Patient arrived; the deposit goes to clinic (and agency).
    Arrival,
    /// Patient cancelled; tiers apply at the cancellation time.
    PatientCancel,
    /// Clinic cancelled or lost its licence; full refund regardless of tiers.
    ClinicCancel,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Distribution {
    pub address: Address,
    pub amount: i128,
}

/// What Pacta declared it would send to Trustless Work, computed by the contract.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Settlement {
    pub reason: Reason,
    /// Cancellation or arrival time the tiers were evaluated at.
    pub at: u64,
    /// Escrow balance the split was computed against.
    pub balance: i128,
    pub distributions: Vec<Distribution>,
    pub recorded_at: u64,
}
