import Link from 'next/link';
import { Frame, Wordmark } from '@/components/Frame';
import { formatDate, formatEur } from '@/lib/money';
import { DEMO_DEAL_ID, dealStore } from '@/lib/deals';

export default async function Home() {
  const deal = await dealStore.get(DEMO_DEAL_ID);
  if (!deal) return null;

  const procedure = new Date(deal.policy.procedureDate * 1000);

  return (
    <Frame>
      <div className="mx-auto max-w-5xl">
        <div className="flex items-baseline justify-between px-6 py-6 md:px-10 lg:hidden">
          <Wordmark />
          <span className="font-mono text-[11px] text-muted">Stellar testnet</span>
        </div>

        <main className="grid grid-cols-1 lg:min-h-[calc(100dvh-8px)] lg:grid-cols-12">
          <section className="order-2 border-t border-rule px-6 py-10 md:px-10 lg:order-1 lg:col-span-5 lg:flex lg:flex-col lg:justify-between lg:border-t-0 lg:border-r lg:py-12">
            <div className="hidden lg:block">
              <Wordmark />
            </div>
            <div className="lg:mt-0">
              <p className="font-serif text-3xl leading-[1.15] tracking-[-0.03em] text-ink md:text-4xl">
                The deposit is held until you walk in.
              </p>
              <p className="mt-5 max-w-[34ch] text-[15px] leading-relaxed text-muted">
                Cancellation terms are printed on the notice and cannot be rewritten after you pay.
              </p>
            </div>
            <p className="mt-10 hidden font-mono text-[11px] text-muted lg:block">Stellar testnet</p>
          </section>

          <section className="order-1 px-6 py-8 md:px-10 lg:order-2 lg:col-span-7 lg:flex lg:items-center lg:py-12">
            <article className="w-full max-w-md">
              <p className="font-mono text-[11px] tracking-[0.16em] text-muted uppercase">Open notice</p>
              <h1 className="mt-3 font-serif text-2xl tracking-[-0.02em]">{deal.clinic.name}</h1>
              <p className="mt-2 text-sm text-muted">{deal.procedure}</p>
              <dl className="mt-8 space-y-3 border-t border-rule pt-6 text-[15px]">
                <div className="flex items-baseline justify-between gap-4">
                  <dt className="text-muted">Deposit</dt>
                  <dd className="font-serif text-2xl tabular-nums">{formatEur(deal.depositEurCents)}</dd>
                </div>
                <div className="flex items-baseline justify-between gap-4">
                  <dt className="text-muted">Procedure</dt>
                  <dd>{formatDate(procedure)}</dd>
                </div>
              </dl>
              <Link
                href={`/d/${deal.id}`}
                className="mt-8 inline-flex min-h-11 w-full items-center justify-center bg-ink px-5 text-[15px] tracking-wide text-paper transition-colors duration-150 hover:bg-oxblood focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
              >
                Open deposit notice
              </Link>
            </article>
          </section>
        </main>
      </div>
    </Frame>
  );
}
