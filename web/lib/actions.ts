'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { cancel, lock, markArrived, release } from './escrow';
import { dealStore, demoDealTemplate, withdrawalStore, type Deal } from './deals';
import { parseUsdc } from './money';
import { withdrawToTry } from './offramp';
import { DAY_SECONDS, validatePolicy, type Policy, type PolicyIssue, type Tier } from './policy';
import { demoWallets } from './wallets';

async function mustGet(id: string): Promise<Deal> {
  const deal = await dealStore.get(id);
  if (!deal) throw new Error(`Deal not found: ${id}`);
  return deal;
}

/**
 * Runs one escrow step. A live call can fail mid-demo — a short patient wallet,
 * a slow anchor — and a thrown server action shows a stack trace on stage. The
 * message lands on the page instead, and the deal stays where it was.
 */
async function step(id: string, from: Deal['status'], run: (deal: Deal) => Promise<Deal>): Promise<void> {
  const deal = await mustGet(id);
  if (deal.status !== from) return;
  const { error: _cleared, ...pending } = deal;
  try {
    await dealStore.save(await run(pending));
  } catch (err) {
    await dealStore.save({ ...pending, error: err instanceof Error ? err.message : String(err) });
  }
  refresh(id);
}

function refresh(id: string) {
  revalidatePath(`/d/${id}`);
  revalidatePath('/clinic');
}

/** Patient pays. Live: TW deploy → PTK commit → fund. */
export async function fundDeal(id: string): Promise<void> {
  await step(id, 'created', lock);
}

/** Clinic front desk checks the patient in. First half of the dual confirmation. */
export async function checkIn(id: string): Promise<void> {
  await step(id, 'funded', markArrived);
}

/** Patient confirms from the QR. Second half; Pacta then releases. */
export async function confirmArrival(id: string): Promise<void> {
  await step(id, 'arrived', release);
}

/** Cancellation settled against the committed policy. `atIso` is honoured only in simulated mode. */
export async function cancelDeal(id: string, reason: 'patient-cancel' | 'clinic-cancel', atIso?: string): Promise<void> {
  await step(id, 'funded', (deal) => cancel(deal, reason, atIso ? new Date(atIso) : undefined));
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

// ---------------------------------------------------------------- kapora oluşturma

/**
 * EUR → USDC. Üründe bu bir SEP-38 teklifi olacak: klinik tutarı avro yazar,
 * escrow'a kilitlenen USDC o anki kurla belirlenir ve teklif referansı anlaşmaya
 * yazılır. v1'de sabit — demo fikstürünün kuru (€800 = 869.5652174 USDC).
 */
const EUR_PER_USDC = 0.92;

export type CreateDealState = { issues: PolicyIssue[] } | undefined;

/**
 * Kliniğin kapora bildirimi oluşturması.
 *
 * Politika buradan geçmeden hiçbir yere yazılmaz: aynı kurallar zincirde
 * `commit` tarafından da uygulanıyor ve orada reddedilmesi, kliniğin hastaya
 * çoktan fiyat söylemiş olması demek.
 */
export async function createDeal(_prev: CreateDealState, formData: FormData): Promise<CreateDealState> {
  const wallets = demoWallets();
  const text = (name: string) => String(formData.get(name) ?? '').trim();

  const issues: PolicyIssue[] = [];
  const procedure = text('procedure');
  if (!procedure) issues.push({ field: 'procedure', message: 'Name the procedure.' });

  const depositEurCents = parseEurCents(text('deposit'));
  if (depositEurCents === undefined || depositEurCents <= 0) {
    issues.push({ field: 'deposit', message: 'Enter the deposit in euros, for example 800.' });
  }

  // Klinik saat seçmiyor; işlem günü yerel saatle 09:00 kabul edilir.
  const procedureDate = Date.parse(`${text('procedureDate')}T09:00:00+03:00`) / 1000;
  if (Number.isNaN(procedureDate)) {
    issues.push({ field: 'procedureDate', message: 'Pick the procedure date.' });
  }

  const agencyName = text('agencyName') || undefined;
  const agencyBps = agencyName ? Math.round(Number(text('agencyPct') || '0') * 100) : 0;

  const tiers = readTiers(formData);
  const policy: Policy = { procedureDate, tiers, agencyBps };

  const parties = {
    // Üründe hasta kendi cüzdanıyla imzalar; bu satır o cüzdanın bağlanacağı yer.
    patient: wallets?.patient.publicKey() ?? 'PATIENT',
    clinic: wallets?.clinic.publicKey() ?? 'CLINIC',
    ...(agencyName ? { agency: wallets?.agency.publicKey() ?? 'AGENCY' } : {}),
  };

  if (!Number.isNaN(procedureDate)) {
    issues.push(...validatePolicy(policy, parties, new Date()));
  }
  if (issues.length > 0) return { issues };

  const deal = await dealStore.create({
    clinicId: text('clinicId'),
    procedure,
    depositEurCents: depositEurCents!,
    escrowAmount: parseUsdc((depositEurCents! / 100 / EUR_PER_USDC).toFixed(7)),
    policy,
    parties,
    agencyName,
  });

  revalidatePath('/clinic');
  redirect(`/clinic?new=${deal.id}`);
}

/** "800" veya "1.250,50" değil — "800" / "800.50". Cent'e çevirir. */
function parseEurCents(value: string): number | undefined {
  if (!/^\d+(\.\d{1,2})?$/.test(value)) return undefined;
  return Math.round(Number(value) * 100);
}

/** Form satırları: tierDays[] ve tierPct[] eşleşerek gelir; boş satırlar atılır. */
function readTiers(formData: FormData): Tier[] {
  const days = formData.getAll('tierDays').map(String);
  const pcts = formData.getAll('tierPct').map(String);
  const tiers: Tier[] = [];
  for (let i = 0; i < days.length; i += 1) {
    if (days[i]!.trim() === '' && pcts[i]!.trim() === '') continue;
    tiers.push({
      minDaysBefore: Math.trunc(Number(days[i])),
      refundBps: Math.round(Number(pcts[i]) * 100),
    });
  }
  return tiers;
}
