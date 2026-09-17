use soroban_sdk::{contracttype, Address, BytesN, Env};

use crate::types::{Policy, Settlement};

/// Slack kept past the procedure date so a policy stays readable while any
/// dispute around it is still being argued: ~30 days of 5-second ledgers.
const TTL_SLACK_LEDGERS: u32 = 518_400;
const SECONDS_PER_LEDGER: u64 = 5;

#[contracttype]
#[derive(Clone)]
enum DataKey {
    Operator,
    Policy(BytesN<32>),
    EscrowDeal(Address),
    Settlement(BytesN<32>),
}

fn ttl(env: &Env, until: u64) -> u32 {
    let remaining = until.saturating_sub(env.ledger().timestamp()) / SECONDS_PER_LEDGER;
    let wanted = u32::try_from(remaining)
        .unwrap_or(u32::MAX)
        .saturating_add(TTL_SLACK_LEDGERS);
    wanted.min(env.storage().max_ttl())
}

pub fn set_operator(env: &Env, operator: &Address) {
    env.storage().instance().set(&DataKey::Operator, operator);
}

pub fn operator(env: &Env) -> Address {
    env.storage()
        .instance()
        .get(&DataKey::Operator)
        .expect("operator is set in the constructor")
}

pub fn has_policy(env: &Env, id: &BytesN<32>) -> bool {
    env.storage().persistent().has(&DataKey::Policy(id.clone()))
}

pub fn deal_of_escrow(env: &Env, escrow: &Address) -> Option<BytesN<32>> {
    env.storage()
        .persistent()
        .get(&DataKey::EscrowDeal(escrow.clone()))
}

pub fn save_policy(env: &Env, id: &BytesN<32>, policy: &Policy) {
    let live = ttl(env, policy.terms.procedure_date);
    let policy_key = DataKey::Policy(id.clone());
    let escrow_key = DataKey::EscrowDeal(policy.terms.escrow.clone());
    let storage = env.storage().persistent();
    storage.set(&policy_key, policy);
    storage.extend_ttl(&policy_key, live, live);
    storage.set(&escrow_key, id);
    storage.extend_ttl(&escrow_key, live, live);
    env.storage().instance().extend_ttl(live, live);
}

pub fn load_policy(env: &Env, id: &BytesN<32>) -> Option<Policy> {
    env.storage().persistent().get(&DataKey::Policy(id.clone()))
}

pub fn has_settlement(env: &Env, id: &BytesN<32>) -> bool {
    env.storage()
        .persistent()
        .has(&DataKey::Settlement(id.clone()))
}

pub fn save_settlement(env: &Env, id: &BytesN<32>, settlement: &Settlement) {
    let key = DataKey::Settlement(id.clone());
    let live = ttl(env, env.ledger().timestamp());
    env.storage().persistent().set(&key, settlement);
    env.storage().persistent().extend_ttl(&key, live, live);
}

pub fn load_settlement(env: &Env, id: &BytesN<32>) -> Option<Settlement> {
    env.storage()
        .persistent()
        .get(&DataKey::Settlement(id.clone()))
}
