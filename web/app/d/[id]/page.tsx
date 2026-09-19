import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  Beneficiary,
  Body,
  Colophon,
  Entry,
  FinePrint,
  Note,
  Principal,
  Seal,
  Section,
  Sheet,
} from '@/components/Instrument';
import { PolicyTable } from '@/components/PolicyTable';
import { SubmitButton } from '@/components/SubmitButton';
import { cancelDeal, confirmArrival, fundDeal, resetDeal } from '@/lib/actions';
import { Receipts } from '@/components/Receipts';
import { escrowMode, LIVE_SCALE } from '@/lib/escrow';
import { DEMO_DEAL_ID, dealStore, type Deal } from '@/lib/deals';
import { formatDate, formatDateLong, formatEur, formatUsdc, formatUsdcDisplay, parseUsdc } from '@/lib/money';
import { applyBps, entitlement, DAY_SECONDS } from '@/lib/policy';

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function DealPage({ params, searchParams }: Props) {
  const { id } = await params;
  const deal = await dealStore.get(id);
  if (!deal) notFound();

  const atParam = firstValue((await searchParams).at);
  const at = parseInstant(atParam) ?? new Date();
  const owed = entitlement(deal.policy, at);
  const procedureDate = new Date(deal.policy.procedureDate * 1000);
  const refundNow = applyBps(deal.depositEurCents, owed.patientBps);

  return (
    <Sheet kind="Deposit undertaking" reference={`Ref ${reference(deal.id)} · Stellar testnet`}>
      <Body>
        <div className="grid gap-10 pt-10 lg:grid-cols-12 lg:gap-14">
          {/* Belge gövdesi: kim, ne, ne zaman, hangi cetvelle. */}
          <div className="flex flex-col gap-8 lg:col-span-7">
            <header>
              <Beneficiary name={deal.clinic.name} city={deal.clinic.city} />
              <dl className="mt-6">
                {deal.clinic.verified && (
                  <Entry label="Licence">
                    <span className="font-mono text-[13px]">{deal.clinic.licenseNo}</span>
                    <span className="ml-3 font-mono text-[11px] text-faint">
                      checked {formatDate(new Date(deal.clinic.verifiedAt * 1000))}
                    </span>
                  </Entry>
                )}
                <Entry label="Instrument">{deal.procedure}</Entry>
                <Entry label="Maturity">{formatDateLong(procedureDate)}</Entry>
                {deal.agencyName && <Entry label="Introduced by">{deal.agencyName}</Entry>}
              </dl>
            </header>

            <Section title="Schedule of redemption">
              <PolicyTable policy={deal.policy} depositEurCents={deal.depositEurCents} at={at} />
              <div className="mt-4">
                <FinePrint>
                  The schedule above is committed to the Pacta Policy Commitment Contract before the
                  deposit is funded and cannot be amended afterwards, by the clinic or by Pacta. Each
                  row applies up to and including its cutoff. A cancellation by the clinic, or lapse
                  of the licence shown above, redeems in full irrespective of the schedule. Amounts
                  are computed from the escrow balance at the ledger time of settlement; rounding
                  remainders accrue to the patient.
                </FinePrint>
              </div>
            </Section>
          </div>

          {/* Uygulama bloğu: belgenin üzerindeki şerh. Yoğunluk farkı kasıtlı. */}
          <aside className="lg:col-span-5">
            <div className="border border-rule bg-panel p-5 lg:sticky lg:top-6">
              <Principal
                label={deal.status === 'created' ? 'Principal due' : 'Principal held'}
                amount={formatEur(deal.depositEurCents)}
                under={
                  <>
                    {formatUsdcDisplay(deal.lockedAmount ?? deal.escrowAmount)} USDC
                    {deal.lockedAmount !== undefined && ` · testnet 1:${LIVE_SCALE}`}
                  </>
                }
              />

              {deal.status === 'created' && (
                <p className="border-b border-rule py-3 font-mono text-[12px] leading-relaxed text-muted">
                  Redeemable {atParam ? `on ${formatDate(at)}` : 'today'}:{' '}
                  <span className="text-ink tabular-nums">
                    {owed.patientBps === 0 ? 'nil' : formatEur(refundNow)}
                  </span>
                </p>
              )}

              <div className="mt-5">
                <Actions deal={deal} atIso={atParam} />
              </div>
            </div>
          </aside>
        </div>

        <DemoControls deal={deal} />
        <Colophon contractId={process.env.PACTA_POLICY_CONTRACT} />
      </Body>
    </Sheet>
  );
}

function StepError({ deal }: { deal: Deal }) {
  if (!deal.error) return null;
  return (
    <p className="border-l-2 border-oxblood bg-oxblood/[0.07] px-3 py-2 font-mono text-[12px] leading-relaxed text-oxblood">
      Step refused. {deal.error}
    </p>
  );
}

function Actions({ deal, atIso }: { deal: Deal; atIso?: string }) {
  const live = (deal.mode ?? escrowMode()) === 'live';

  if (deal.status === 'created') {
    return (
      <section className="flex flex-col gap-3">
        <StepError deal={deal} />
        <form action={fundDeal.bind(null, deal.id)}>
          <SubmitButton pendingLabel={live ? 'Locking on Stellar…' : 'Holding…'}>
            Pay {formatEur(deal.depositEurCents)}
          </SubmitButton>
        </form>
        <FinePrint>
          Pacta takes no custody. On payment the deposit is locked in a Trustless Work escrow and the
          schedule above is written to the policy contract, in that order — the undertaking is older
          than the money.
        </FinePrint>
        <ModeNote live={live} />
      </section>
    );
  }

  if (deal.status === 'funded') {
    return (
      <section className="flex flex-col gap-4">
        <StepError deal={deal} />
        <Seal
          state="held"
          caption="Held in escrow"
          href={
            deal.escrowContractId
              ? `https://stellar.expert/explorer/testnet/contract/${deal.escrowContractId}`
              : undefined
          }
        />
        <Note>
          The clinic can see the amount and cannot spend it. On arrival the front desk checks you in
          and you confirm here; both are required.
        </Note>
        <form action={cancelDeal.bind(null, deal.id, 'patient-cancel', live ? undefined : atIso)}>
          <SubmitButton pendingLabel="Settling…" variant="ghost">
            Cancel this booking
          </SubmitButton>
        </form>
        <ModeNote live={live} />
        <Receipts receipts={deal.receipts} />
      </section>
    );
  }

  if (deal.status === 'arrived') {
    return (
      <section className="flex flex-col gap-4">
        <StepError deal={deal} />
        <p className="border-y border-rule py-3 font-mono text-[12px] tracking-[0.04em] text-ink uppercase">
          {deal.clinic.name} checked you in
        </p>
        <Note>
          Confirm you are at the clinic. The deposit is then released under the schedule you paid
          against — no refund applies on arrival.
        </Note>
        <form action={confirmArrival.bind(null, deal.id)}>
          <SubmitButton pendingLabel={live ? 'Releasing on Stellar…' : 'Releasing…'}>
            I am at the clinic
          </SubmitButton>
        </form>
        <Receipts receipts={deal.receipts} />
      </section>
    );
  }

  return <SettlementPanel deal={deal} />;
}

function ModeNote({ live }: { live: boolean }) {
  return (
    <p className="font-mono text-[11px] leading-relaxed text-faint">
      {live
        ? `Live on Stellar testnet. Demo keys sign for each party; escrow runs at 1:${LIVE_SCALE}.`
        : 'Simulated. Set TW_API_KEY to lock this on Stellar testnet.'}
    </p>
  );
}

function SettlementPanel({ deal }: { deal: Deal }) {
  const settlement = deal.settlement;
  if (!settlement) return null;

  const refunded = settlement.reason !== 'arrival';
  const label = (address: string): string => {
    if (address === deal.parties.patient) return 'Returned to you';
    if (address === deal.parties.clinic) return deal.clinic.name;
    if (address === deal.parties.agency) return deal.agencyName ?? 'Agency';
    return address;
  };

  return (
    <section className="flex flex-col gap-4">
      <Seal
        state={refunded ? 'refunded' : 'released'}
        caption={refunded ? 'Cancelled — policy applied' : 'Released to the clinic'}
      />
      <dl>
        <Entry label="Settled">{formatDateLong(new Date(settlement.at * 1000))}</Entry>
        <Entry label="Refund">
          <span className="font-mono tabular-nums">
            {settlement.patientBps === 0 ? 'nil' : `${settlement.patientBps / 100}%`}
          </span>
        </Entry>
      </dl>

      <table className="w-full border-collapse font-mono text-[13px]">
        <caption className="sr-only">Distribution</caption>
        <tbody>
          {settlement.distributions.map((row) => (
            <tr key={row.address} className="border-b border-rule">
              <th scope="row" className="py-2 pr-4 text-left font-normal text-muted">
                {label(row.address)}
              </th>
              <td className="py-2 text-right tabular-nums">
                {formatUsdc(parseUsdc(row.amount))} USDC
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <FinePrint>
        Amounts are those the policy contract recorded before the payout was signed, and sum exactly
        to the escrow balance.
        {!refunded && deal.parties.agency && ' The escrow pays the clinic; the agency share is owed by the clinic.'}
        {deal.mode === 'live' && ' Trustless Work deducts a 0.3% protocol fee from each payout.'}
      </FinePrint>
      <Receipts receipts={deal.receipts} />
    </section>
  );
}

/**
 * Sahne kontrolleri, yalnızca demo fikstüründe.
 *
 * `resetDeal` başka bir anlaşmayı zaten reddediyor; kliniğin kendi yazdığı bir
 * bildirimde bu düğmeleri göstermek çalışmayan bir şey göstermek olurdu.
 */
function DemoControls({ deal }: { deal: Deal }) {
  const isFixture = deal.id === DEMO_DEAL_ID;
  // Live settlements use ledger time, so previewing another date would mislead.
  const live = (deal.mode ?? escrowMode()) === 'live';
  const jumps =
    live || !isFixture
      ? []
      : [20, 10, 3].map((days) => ({
          days,
          iso: new Date((deal.policy.procedureDate - days * DAY_SECONDS) * 1000).toISOString(),
        }));

  return (
    <footer className="rule-major mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 py-4 font-mono text-[11px] tracking-[0.04em] uppercase">
      {jumps.length > 0 && <span className="text-faint">As of</span>}
      {jumps.map(({ days, iso }) => (
        <Link key={days} href={`/d/${deal.id}?at=${encodeURIComponent(iso)}`} className={demoLink}>
          {days}d
        </Link>
      ))}
      {jumps.length > 0 && (
        <Link href={`/d/${deal.id}`} className={demoLink}>
          Today
        </Link>
      )}
      {isFixture && (
        <>
          <span className="ml-auto text-faint">Restart at</span>
          {[20, 10, 3].map((days) => (
            <form key={days} action={resetDeal.bind(null, deal.id, days)}>
              <button type="submit" className={demoLink}>
                {days}d
              </button>
            </form>
          ))}
        </>
      )}
      <Link href="/clinic" className={`${demoLink} ${isFixture ? '' : 'ml-auto'}`}>
        Clinic desk →
      </Link>
    </footer>
  );
}

const demoLink =
  'min-h-8 text-muted underline decoration-rule underline-offset-4 hover:text-ink hover:decoration-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink';

/** Belge referansı: id'nin kuyruğu, belgede göründüğü biçimde. */
function reference(id: string): string {
  return id.replace(/^d-/, '').slice(0, 8).toUpperCase();
}

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function parseInstant(value: string | undefined): Date | undefined {
  if (!value) return undefined;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}
