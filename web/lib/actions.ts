'use server';

import { revalidatePath } from 'next/cache';
import { formatUsdc } from './money';
import { clinicCancelEntitlement, distribute, entitlement } from './policy';
import { dealStore, type SettlementReason } from './deals';

/**
 * Locks the deposit in escrow.
 *
 * When Trustless Work is wired, this becomes
 * `/deployer/single-release` → `/helper/set-trustline` → `/escrow/single-release/fund-escrow`.
 * Until then the status flip is simulated and `escrowContractId` stays empty.
 */
export async function fundDeal(id: string): Promise<void> {
  const deal = await dealStore.get(id);
  if (!deal) throw new Error(`Deal not found: ${id}`);
  if (deal.status !== 'created') return;

  await dealStore.save({ ...deal, status: 'funded', fundedAt: Math.floor(Date.now() / 1000) });
  revalidatePath(`/d/${id}`);
}

/**
 * Settles a cancellation against the published policy.
 * Maps to Trustless Work `dispute-escrow` + `resolve-dispute`; distributions must
 * sum to the live escrow balance.
 */
export async function settleCancellation(
  id: string,
  reason: SettlementReason,
  atIso?: string,
): Promise<void> {
  const deal = await dealStore.get(id);
  if (!deal) throw new Error(`Deal not found: ${id}`);
  if (deal.status !== 'funded') return;

  const at = atIso ? new Date(atIso) : new Date();
  const owed =
    reason === 'clinic-cancel'
      ? clinicCancelEntitlement(deal.policy)
      : entitlement(deal.policy, at);

  const rows = distribute(deal.escrowAmount, owed, deal.parties);

  await dealStore.save({
    ...deal,
    status: reason === 'arrival' ? 'released' : 'refunded',
    settlement: {
      at: Math.floor(at.getTime() / 1000),
      reason,
      patientBps: owed.patientBps,
      distributions: rows.map((row) => ({ address: row.address, amount: formatUsdc(row.amount) })),
    },
  });
  revalidatePath(`/d/${id}`);
}

/** Replay the demo from the unpaid state. */
export async function resetDeal(id: string): Promise<void> {
  const deal = await dealStore.get(id);
  if (!deal) return;
  const { fundedAt: _fundedAt, settlement: _settlement, ...rest } = deal;
  await dealStore.save({ ...rest, status: 'created' });
  revalidatePath(`/d/${id}`);
}
