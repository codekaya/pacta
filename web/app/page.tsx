import Link from 'next/link';
import { Body, Colophon, Entry, FinePrint, Sheet } from '@/components/Instrument';
import { formatDate, formatEur } from '@/lib/money';
import { DEMO_DEAL_ID, dealStore } from '@/lib/deals';

// The notice moves with every demo run; a prerendered snapshot would go stale.
export const dynamic = 'force-dynamic';

export default async function Home() {
  const deal = await dealStore.get(DEMO_DEAL_ID);
  if (!deal) return null;

  const procedure = new Date(deal.policy.procedureDate * 1000);

  return (
    <Sheet kind="Deposit undertakings" reference="Stellar testnet">
      <Body>
        <div className="grid gap-12 pt-14 pb-10 lg:grid-cols-12 lg:gap-16">
          <section className="lg:col-span-6">
            <h1 className="font-serif text-[2.5rem] leading-[1.08] tracking-[-0.03em] md:text-[3rem]">
              The deposit is held
              <br />
              until you walk in.
            </h1>
            <p className="mt-6 max-w-[38ch] text-[15px] leading-relaxed text-muted">
              Cancellation terms are printed on the notice and committed on chain before the patient
              pays. Neither the clinic nor Pacta can rewrite them afterwards.
            </p>
            <div className="mt-8">
              <FinePrint>
                Custody sits with a Trustless Work escrow. The schedule sits in the Pacta Policy
                Commitment Contract, which publishes the exact split before any payout is signed, so a
                deviation is provable by anyone. The clinic settles in Turkish lira through a SEP-6
                anchor.
              </FinePrint>
            </div>
          </section>

          {/* Açık bildirim, defterdeki bir kayıt gibi. */}
          <section className="lg:col-span-6">
            <div className="border border-rule bg-panel p-5">
              <p className="font-mono text-[11px] tracking-[0.04em] text-muted uppercase">
                Open notice
              </p>
              <p className="mt-3 font-serif text-[1.5rem] leading-tight tracking-[-0.02em]">
                {deal.clinic.name}
              </p>
              <dl className="mt-5">
                <Entry label="Instrument">{deal.procedure}</Entry>
                <Entry label="Maturity">{formatDate(procedure)}</Entry>
                <Entry label="Principal">
                  <span className="font-mono tabular-nums">{formatEur(deal.depositEurCents)}</span>
                </Entry>
              </dl>
              <Link
                href={`/d/${deal.id}`}
                className="mt-6 inline-flex min-h-11 w-full items-center justify-center bg-ink px-5 font-mono text-[12px] tracking-[0.04em] text-paper uppercase transition-colors duration-150 hover:bg-oxblood focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
              >
                Open the undertaking
              </Link>
            </div>
            <p className="mt-3 text-right font-mono text-[11px] text-faint">
              <Link
                href="/clinic"
                className="underline decoration-rule underline-offset-2 hover:text-muted"
              >
                Front desk register →
              </Link>
            </p>
          </section>
        </div>

        <Colophon contractId={process.env.PACTA_POLICY_CONTRACT} />
      </Body>
    </Sheet>
  );
}
