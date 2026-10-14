import { PactaMark } from '@/components/Logo';
import { formatEur } from '@/lib/money';

/**
 * Landing'deki klinik ekranı maketi — ürünün kendisi İngilizce olduğu için iki dilde de
 * İngilizce kalır. Kart etkileşimsizdir; canlısı /clinic'te.
 */

const DAY_MONTH = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' });
const day = (at: Date) => DAY_MONTH.format(at);

export const card = 'rounded-[28px] bg-paper shadow-[0_30px_80px_-30px_rgb(0_69_91_/_0.35)] ring-1 ring-deep/5';

export function Pill({ tone, children }: { tone: 'held' | 'done' | 'wait'; children: React.ReactNode }) {
  const skin = {
    held: 'bg-foam/60 text-held',
    done: 'bg-deep text-paper',
    wait: 'bg-mist text-muted',
  }[tone];
  return <span className={`inline-flex items-center rounded-full px-3 py-1 text-[12px] font-medium ${skin}`}>{children}</span>;
}


// ---------------------------------------------------------------- klinik

export type DeskDeal = {
  procedure: string;
  date: Date;
  agency?: string;
  eurCents: number;
  status: 'created' | 'funded' | 'arrived';
};

/** The clinic's front desk: what is held, who is at the desk, what lands in lira. */
export function DeskCard({ clinicName, deals, qr }: { clinicName: string; deals: DeskDeal[]; qr: string }) {
  const held = deals.filter((d) => d.status !== 'created').reduce((sum, d) => sum + d.eurCents, 0);

  return (
    <div className={`${card} overflow-hidden`}>
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-rule px-6 py-5 sm:px-8">
        <div className="flex items-center gap-3">
          <PactaMark className="h-7 w-auto" />
          <div>
            <p className="text-[12px] text-muted">Front desk</p>
            <p className="font-serif text-xl leading-tight">{clinicName}</p>
          </div>
        </div>
        <span className="inline-flex h-10 items-center rounded-full bg-deep px-4 text-[13px] font-medium text-paper">
          + New deposit notice
        </span>
      </div>

      <div className="@container px-6 py-6 sm:px-8">
        <dl className="grid grid-cols-3 gap-2 @md:gap-3">
          <Tile label="Held in escrow" value={formatEur(held)} />
          <Tile label="Arriving today" value="1 patient" />
          <Tile label="Today’s rate" value="48.43 TL" />
        </dl>

        <ul className="mt-6 divide-y divide-rule">
          {deals.map((deal) => (
            <li key={deal.procedure} className="grid items-center gap-3 py-4 @lg:grid-cols-[minmax(0,1fr)_4.5rem_13.5rem] @lg:gap-5">
              <div className="min-w-0">
                <p className="truncate font-medium">{deal.procedure}</p>
                <p className="mt-0.5 text-[13px] text-muted">
                  {day(deal.date)}
                  {deal.agency && ` · via ${deal.agency}`}
                </p>
              </div>
              <p className="font-serif text-xl tabular-nums">{formatEur(deal.eurCents)}</p>
              <div className="flex items-center gap-3 @lg:justify-end">
                {deal.status === 'arrived' && (
                  <>
                    <Pill tone="done">Checked in</Pill>
                    <span className="size-11 shrink-0 rounded-md bg-paper p-1 ring-1 ring-rule" dangerouslySetInnerHTML={{ __html: qr }} />
                  </>
                )}
                {deal.status === 'funded' && (
                  <>
                    <Pill tone="held">Held</Pill>
                    <span className="inline-flex h-9 items-center rounded-full px-3.5 text-[13px] font-medium text-deep ring-1 ring-deep/20">
                      Patient arrived
                    </span>
                  </>
                )}
                {deal.status === 'created' && (
                  <>
                    <Pill tone="wait">Awaiting payment</Pill>
                    <span className="text-[13px] font-medium text-held">Copy link</span>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-2xl bg-canvas px-3 py-3 ring-1 ring-rule/70 @md:px-4 @md:py-3.5">
      <dt className="truncate text-[11px] text-muted @md:text-[12px]">{label}</dt>
      <dd className="mt-1 font-serif text-[1.05rem] leading-tight tabular-nums @md:text-[1.4rem]">{value}</dd>
    </div>
  );
}
