use soroban_sdk::{contracttype, BytesN, Env};

use crate::types::Lock;

/// Longest validity window the contract accepts. Bounding it keeps every
/// storage TTL comfortably below the network's `max_entry_ttl` and limits how
/// long a payer's funds can sit escrowed.
pub const MAX_VALIDITY_WINDOW_SECONDS: u64 = 7 * 24 * 60 * 60;

/// Nominal ledger close time, used to translate a validity window in seconds
/// into a TTL in ledgers. Ledgers close slightly faster than this in practice,
/// so the conversion errs on the side of a longer-lived entry.
const SECONDS_PER_LEDGER: u64 = 5;

/// Slack kept on top of the validity window so no entry is ever evicted while
/// it is still actionable, even if ledger close times drift.
const TTL_SLACK_LEDGERS: u32 = 17_280;

#[contracttype]
#[derive(Clone)]
enum DataKey {
    /// Authorization ids that have been consumed. Temporary storage is
    /// sufficient: an id only needs to be remembered until its validity window
    /// closes, after which the window check rejects it anyway.
    Consumed(BytesN<32>),
    /// Escrowed authorizations awaiting settlement. Persistent, because real
    /// funds are held against these entries.
    Lock(BytesN<32>),
}

fn ttl_ledgers(valid_before: u64, now: u64) -> u32 {
    let remaining = valid_before.saturating_sub(now);
    let ledgers = (remaining / SECONDS_PER_LEDGER) as u32;
    ledgers.saturating_add(TTL_SLACK_LEDGERS)
}

/// True if the id can no longer be used, either because it was consumed or
/// because an escrow is still open against it.
pub fn is_consumed(env: &Env, id: &BytesN<32>) -> bool {
    env.storage()
        .temporary()
        .has(&DataKey::Consumed(id.clone()))
        || env.storage().persistent().has(&DataKey::Lock(id.clone()))
}

pub fn mark_consumed(env: &Env, id: &BytesN<32>, valid_before: u64) {
    let key = DataKey::Consumed(id.clone());
    let ttl = ttl_ledgers(valid_before, env.ledger().timestamp());
    env.storage().temporary().set(&key, &true);
    env.storage().temporary().extend_ttl(&key, ttl, ttl);
}

pub fn save_lock(env: &Env, id: &BytesN<32>, lock: &Lock) {
    let key = DataKey::Lock(id.clone());
    let ttl = ttl_ledgers(lock.authorization.valid_before, env.ledger().timestamp());
    env.storage().persistent().set(&key, lock);
    env.storage().persistent().extend_ttl(&key, ttl, ttl);
}

pub fn load_lock(env: &Env, id: &BytesN<32>) -> Option<Lock> {
    env.storage().persistent().get(&DataKey::Lock(id.clone()))
}

/// Removes the escrow entry and reclaims its rent. Called on settlement and on
/// reclaim, so a completed authorization leaves no persistent footprint beyond
/// the temporary replay marker.
pub fn close_lock(env: &Env, id: &BytesN<32>) {
    env.storage()
        .persistent()
        .remove(&DataKey::Lock(id.clone()));
}
