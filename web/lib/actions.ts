'use server';

import { revalidatePath } from 'next/cache';
import { cancel, lock, markArrived, release } from './escrow';
import { dealStore, demoDealTemplate, withdrawalStore, type Deal } from './deals';
import { withdrawToTry } from './offramp';
import { DAY_SECONDS } from './policy';
import { demoWallets } from './wallets';

async function mustGet(id: string): Promise<Deal> {
  const deal = await dealStore.get(id);
  if (!deal) throw new Error(`Deal not found: ${id}`);
  return deal;
}

function refresh(id: string) {
  revalidatePath(`/d/${id}`);
  revalidatePath('/clinic');
}

/** Patient pays. Live: TW deploy → PTK commit → fund. */
export async function fundDeal(id: string): Promise<void> {
  const deal = await mustGet(id);
  if (deal.status !== 'created') return;
  await dealStore.save(await lock(deal));
  refresh(id);
}

/** Clinic front desk checks the patient in. First half of the dual confirmation. */
export async function checkIn(id: string): Promise<void> {
  const deal = await mustGet(id);
  if (deal.status !== 'funded') return;
  await dealStore.save(await markArrived(deal));
  refresh(id);
}

/** Patient confirms from the QR. Second half; Pacta then releases. */
export async function confirmArrival(id: string): Promise<void> {
  const deal = await mustGet(id);
  if (deal.status !== 'arrived') return;
  await dealStore.save(await release(deal));
  refresh(id);
}

/** Cancellation settled against the committed policy. `atIso` is honoured only in simulated mode. */
export async function cancelDeal(id: string, reason: 'patient-cancel' | 'clinic-cancel', atIso?: string): Promise<void> {
  const deal = await mustGet(id);
  if (deal.status !== 'funded') return;
  await dealStore.save(await cancel(deal, reason, atIso ? new Date(atIso) : undefined));
  refresh(id);
}

/**
 * Replay the demo. With `daysOut`, the procedure is moved that many days from
 * now — the only way to show a lower tier on a live escrow, where settlement
 * time is the ledger's.
 */
export async function resetDeal(id: string, daysOut?: number): Promise<void> {
  const template = demoDealTemplate();
  if (template.id !== id) return;
  if (daysOut !== undefined) {
    template.policy.procedureDate = Math.floor(Date.now() / 1000) + daysOut * DAY_SECONDS;
  }
  await dealStore.save(template);
  refresh(id);
}

/** Clinic cashes out released USDC to its TRY bank account through the anchor. */
export async function withdrawTry(formData: FormData): Promise<void> {
  const w = demoWallets();
  if (!w) throw new Error('Demo wallets missing — run: npm run tw -- wallets');
  const amount = String(formData.get('amount') ?? '').trim();
  if (!/^\d+(\.\d{1,7})?$/.test(amount) || Number(amount) <= 0) throw new Error(`Invalid amount: ${amount}`);
  const iban = String(formData.get('iban') ?? '').trim() || process.env.CLINIC_IBAN || undefined;

  await withdrawalStore.add(await withdrawToTry(w.clinic, amount, iban));
  revalidatePath('/clinic');
}
