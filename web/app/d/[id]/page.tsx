import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ClinicCard } from '@/components/ClinicCard';
import { Frame, Wordmark } from '@/components/Frame';
import { PolicyTable } from '@/components/PolicyTable';
import { SubmitButton } from '@/components/SubmitButton';
import { fundDeal, resetDeal, settleCancellation } from '@/lib/actions';
import { dealStore, type Deal } from '@/lib/deals';
import { formatDate, formatDateLong, formatEur, formatUsdcDisplay, parseUsdc } from '@/lib/money';
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
    <Frame>
      <div className="mx-auto max-w-5xl px-6 md:px-10">
        <div className="flex items-baseline justify-between py-6">
          <Wordmark />
          <span className="font-mono text-[11px] text-muted">Stellar testnet</span>
        </div>

        <div className="grid gap-12 border-t border-rule py-10 lg:grid-cols-12 lg:gap-16 lg:py-14">
          <div className="flex flex-col gap-12 lg:col-span-7">
            <ClinicCard clinic={deal.clinic} />

            <dl className="space-y-3 text-[15px]">
              <Row label="Procedure">{deal.procedure}</Row>
              <Row label="Date">{formatDateLong(procedureDate)}</Row>
              {deal.agencyName && <Row label="Agency">{deal.agencyName}</Row>}
            </dl>

            <PolicyTable policy={deal.policy} depositEurCents={deal.depositEurCents} at={at} />
          </div>

          <aside className="lg:col-span-5">
            <div className="lg:sticky lg:top-10">
              <p className="text-sm text-muted">Deposit due</p>
              <p className="mt-1 font-serif text-5xl tracking-[-0.03em] tabular-nums">
                {formatEur(deal.depositEurCents)}
              </p>
              <p className="mt-2 font-mono text-[11px] text-muted">
                {formatUsdcDisplay(deal.escrowAmount)} USDC in escrow
              </p>

              {deal.status === 'created' && (
                <p className="mt-6 text-[15px] leading-relaxed text-muted">
                  Cancel {atParam ? `on ${formatDate(at)}` : 'today'} and you would receive{' '}
                  <span className="text-ink">
                    {owed.patientBps === 0 ? 'nothing.' : `${formatEur(refundNow)}.`}
                  </span>
                </p>
              )}

              <div className="mt-8">
                <Actions deal={deal} atIso={atParam} />
              </div>
            </div>
          </aside>
        </div>

        <DemoControls deal={deal} />
      </div>
    </Frame>
  );
}

function Actions({ deal, atIso }: { deal: Deal; atIso?: string }) {
  if (deal.status === 'created') {
    return (
      <section className="flex flex-col gap-3">
        <form action={fundDeal.bind(null, deal.id)}>
          <SubmitButton pendingLabel="Holding…">
            Pay {formatEur(deal.depositEurCents)}
          </SubmitButton>
        </form>
        <p className="text-sm leading-relaxed text-muted">
          Pacta does not take custody. The deposit is locked in a Trustless Work escrow until you
          confirm arrival. Cancel and the schedule above is what settles.
        </p>
      </section>
    );
  }

  if (deal.status === 'funded') {
    return (
      <section className="flex flex-col gap-3">
        <p className="border-y border-rule py-4 font-serif text-xl italic tracking-[-0.02em] text-forest">
          Held in escrow.
        </p>
        <p className="text-sm leading-relaxed text-muted">
          The clinic can see the amount. It cannot spend it.
          {deal.escrowContractId ? (
            <>
              {' '}
              Contract{' '}
              <a
                className="font-mono text-ink underline decoration-rule underline-offset-4 hover:decoration-oxblood focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                href={`https://stellar.expert/explorer/testnet/contract/${deal.escrowContractId}`}
                target="_blank"
                rel="noreferrer"
              >
                {deal.escrowContractId.slice(0, 8)}…
              </a>
            </>
          ) : (
            ' Escrow wiring is not live yet — this step is simulated.'
          )}
        </p>
        <form action={settleCancellation.bind(null, deal.id, 'arrival', atIso)}>
          <SubmitButton pendingLabel="Releasing…">I have arrived</SubmitButton>
        </form>
        <form action={settleCancellation.bind(null, deal.id, 'patient-cancel', atIso)}>
          <SubmitButton pendingLabel="Settling…" variant="ghost">
            Cancel this booking
          </SubmitButton>
        </form>
      </section>
    );
  }

  return <SettlementPanel deal={deal} />;
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
    <section>
      <p className="font-serif text-xl italic tracking-[-0.02em] text-ink">
        {refunded ? 'Cancelled. Policy applied.' : 'Confirmed. Deposit released.'}
      </p>
      <p className="mt-2 text-sm text-muted">
        {formatDateLong(new Date(settlement.at * 1000))}
        {' · '}
        refund {settlement.patientBps === 0 ? 'none' : `${settlement.patientBps / 100}%`}
      </p>
      <ul className="mt-6 border-t border-rule">
        {settlement.distributions.map((row) => (
          <li
            key={row.address}
            className="flex items-baseline justify-between gap-3 border-b border-rule py-3"
          >
            <span className="min-w-0 text-sm text-muted">{label(row.address)}</span>
            <span className="font-mono text-sm tabular-nums">
              {formatUsdcDisplay(parseUsdc(row.amount))} USDC
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-sm leading-relaxed text-muted">
        Amounts come from the schedule written before payment. They sum to the escrow balance.
      </p>
    </section>
  );
}

function DemoControls({ deal }: { deal: Deal }) {
  const jumps = [20, 10, 3].map((days) => ({
    days,
    iso: new Date((deal.policy.procedureDate - days * DAY_SECONDS) * 1000).toISOString(),
  }));

  return (
    <footer className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-rule py-6 text-sm">
      <span className="font-mono text-[11px] tracking-[0.14em] text-muted uppercase">Preview as of</span>
      {jumps.map(({ days, iso }) => (
        <Link
          key={days}
          href={`/d/${deal.id}?at=${encodeURIComponent(iso)}`}
          className="min-h-10 text-muted underline decoration-rule underline-offset-4 hover:text-ink hover:decoration-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
        >
          {days} days out
        </Link>
      ))}
      <Link
        href={`/d/${deal.id}`}
        className="min-h-10 text-muted underline decoration-rule underline-offset-4 hover:text-ink hover:decoration-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
      >
        Today
      </Link>
      <form action={resetDeal.bind(null, deal.id)} className="ml-auto">
        <button
          type="submit"
          className="min-h-10 text-muted underline decoration-rule underline-offset-4 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
        >
          Reset
        </button>
      </form>
    </footer>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 border-b border-rule pb-3 sm:flex-row sm:items-baseline sm:justify-between sm:gap-8">
      <dt className="shrink-0 text-muted">{label}</dt>
      <dd className="min-w-0 break-words sm:text-right">{children}</dd>
    </div>
  );
}

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function parseInstant(value: string | undefined): Date | undefined {
  if (!value) return undefined;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}
