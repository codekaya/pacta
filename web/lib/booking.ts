'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { catalogClinic, SCHEDULE_TIERS } from './clinics';
import { dealStore } from './deals';
import { EUR_PER_USDC, parseUsdc } from './money';
import { validatePolicy, type Policy } from './policy';
import { demoWallets } from './wallets';

/**
 * Hasta tarafındaki demo rezervasyonu: katalogdan klinik + paket + tarih + kapora oranı
 * seçilir, kliniğin kendi takvimiyle bir bildirim yazılır ve hasta bildirime gider.
 * Ödeme oradaki mevcut akış: escrow → politika taahhüdü → kilit.
 */

export type BookingState = { error: 'clinic' | 'package' | 'date' | 'rate' | 'policy' } | undefined;

const DAY = 86_400;

export async function bookDemo(_prev: BookingState, form: FormData): Promise<BookingState> {
  const text = (key: string) => String(form.get(key) ?? '').trim();

  const clinic = catalogClinic(text('clinic'));
  if (!clinic) return { error: 'clinic' };

  const pkg = clinic.packages.find((p) => p.id === text('package'));
  if (!pkg) return { error: 'package' };

  // Saat seçilmiyor; işlem günü İstanbul saatiyle 09:00 (klinik formuyla aynı kabul).
  const date = text('date');
  const procedureDate = /^\d{4}-\d{2}-\d{2}$/.test(date) ? Date.parse(`${date}T09:00:00+03:00`) / 1000 : Number.NaN;
  const now = Math.floor(Date.now() / 1000);
  if (Number.isNaN(procedureDate) || procedureDate < now + DAY || procedureDate > now + 365 * DAY) {
    return { error: 'date' };
  }

  const rate = Number(text('rate'));
  if (!clinic.depositRates.includes(rate)) return { error: 'rate' };

  const wallets = demoWallets();
  const parties = {
    patient: wallets?.patient.publicKey() ?? 'PATIENT',
    clinic: wallets?.clinic.publicKey() ?? 'CLINIC',
  };
  const policy: Policy = { procedureDate, tiers: SCHEDULE_TIERS[clinic.schedule], agencyBps: 0 };
  if (validatePolicy(policy, parties, new Date()).length > 0) return { error: 'policy' };

  const depositEurCents = Math.round((pkg.priceEurCents * rate) / 100);
  const deal = await dealStore.create({
    clinicId: clinic.id,
    procedure: pkg.name.en,
    depositEurCents,
    escrowAmount: parseUsdc((depositEurCents / 100 / EUR_PER_USDC).toFixed(7)),
    policy,
    parties,
  });

  revalidatePath('/clinic');
  redirect(`/d/${deal.id}`);
}
