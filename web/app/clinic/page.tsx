import Link from 'next/link';
import { headers } from 'next/headers';
import QRCode from 'qrcode';
import { CopyLink } from '@/components/CopyLink';
import { Frame, Wordmark } from '@/components/Frame';
import { SubmitButton } from '@/components/SubmitButton';
import { cancelDeal, checkIn, withdrawTry } from '@/lib/actions';
import { dealStore, withdrawalStore, type Deal, type Withdrawal } from '@/lib/deals';
import { escrowMode, LIVE_SCALE } from '@/lib/escrow';
import { formatDate, formatDateTime, formatEur, formatUsdcDisplay } from '@/lib/money';
import { quoteTry, usdcBalance, type TryQuote } from '@/lib/offramp';
import { demoWallets } from '@/lib/wallets';

export const dynamic = 'force-dynamic';

const STATUS: Record<Deal['status'], string> = {
  created: 'Awaiting payment',
  funded: 'Held — not spendable',
  arrived: 'Checked in — awaiting patient',
  released: 'Released to clinic',
  refunded: 'Cancelled — policy applied',
};

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function ClinicDesk({ searchParams }: Props) {
  const justCreated = firstValue((await searchParams).new);
  const deals = await dealStore.list();
  const withdrawals = await withdrawalStore.list();
  const wallets = demoWallets();
  const clinicAddress = wallets?.clinic.publicKey();
  const host = (await headers()).get('host') ?? 'localhost:3000';
  const origin = `${host.startsWith('localhost') ? 'http' : 'https'}://${host}`;

  const [balance, quote] = await Promise.all([
    clinicAddress ? usdcBalance(clinicAddress).catch(() => null) : Promise.resolve(null),
    quoteTry('10').catch(() => null),
  ]);

  const held = deals.filter((d) => d.status === 'funded' || d.status === 'arrived');
  const clinicName = deals[0]?.clinic.name ?? 'Clinic';

  return (
    <Frame>
      <div className="mx-auto max-w-5xl px-6 md:px-10">
        <div className="flex items-baseline justify-between py-6">
          <Wordmark />
          <span className="font-mono text-[11px] text-muted">
            Clinic desk · {escrowMode() === 'live' ? 'live on testnet' : 'simulated escrow'}
          </span>
        </div>

        <header className="border-t border-rule py-10">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <p className="font-mono text-[11px] tracking-[0.16em] text-muted uppercase">Front desk</p>
              <h1 className="mt-3 font-serif text-4xl tracking-[-0.03em]">{clinicName}</h1>
            </div>
            <Link
              href="/clinic/new"
              className="inline-flex min-h-11 items-center justify-center bg-ink px-5 text-[15px] tracking-wide text-paper transition-colors duration-150 hover:bg-oxblood focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            >
              New deposit notice
            </Link>
          </div>
          <dl className="mt-8 grid gap-6 sm:grid-cols-3">
            <Figure label="Held in escrow">
              {held.length === 0 ? '—' : formatEur(held.reduce((sum, d) => sum + d.depositEurCents, 0))}
            </Figure>
            <Figure label="Wallet, spendable">{balance === null ? '—' : `${formatUsdcDisplay(toBase(balance))} USDC`}</Figure>
            <Figure label="Today’s rate">{quote ? `${quote.rate} TL / USDC` : '—'}</Figure>
          </dl>
        </header>

        {justCreated && deals.some((d) => d.id === justCreated) && (
          <section className="border-t border-rule py-8">
            <p className="font-serif text-xl tracking-[-0.02em] text-forest">Notice ready.</p>
            <p className="mt-2 mb-4 max-w-[58ch] text-sm leading-relaxed text-muted">
              Send this to the patient. Opening it is all they need to do — no account, no wallet.
              Anyone with the link can pay it, so send it the way you already send the appointment.
            </p>
            <CopyLink url={`${origin}/d/${justCreated}`} />
          </section>
        )}

        <section className="border-t border-rule py-10">
          <h2 className="font-serif text-2xl tracking-[-0.02em]">Deposits</h2>
          <p className="mt-2 max-w-[60ch] text-sm leading-relaxed text-muted">
            Held deposits are visible but locked. Check a patient in when they arrive; they confirm
            from their phone and the escrow releases.
          </p>
          <ul className="mt-6 border-t border-rule">
            {deals.map((deal) => (
              <DealRow key={deal.id} deal={deal} origin={origin} />
            ))}
          </ul>
        </section>

        <section className="grid gap-10 border-t border-rule py-10 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <h2 className="font-serif text-2xl tracking-[-0.02em]">Withdraw to TL</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Released USDC goes to {quote?.anchor ?? 'the anchor'} and arrives as TRY by bank
              transfer. The rate is locked with a firm quote before anything moves.
            </p>
            {quote && <QuoteLine quote={quote} />}
          </div>
          <form action={withdrawTry} className="flex flex-col gap-4 lg:col-span-7">
            <Field label="Amount, USDC" name="amount" defaultValue={balance && Number(balance) > 0 ? trimUsdc(balance) : '5'} inputMode="decimal" />
            <Field label="IBAN (blank uses the anchor sandbox account)" name="iban" placeholder="TR00 0000 0000 0000 0000 0000 00" />
            <SubmitButton pendingLabel="Quoting, paying, waiting for the bank…">Withdraw to TL</SubmitButton>
            {!wallets && (
              <p className="font-mono text-[11px] text-oxblood">No demo wallets. Run: npm run tw -- wallets</p>
            )}
          </form>
          <div className="lg:col-span-12">
            <Withdrawals rows={withdrawals} />
          </div>
        </section>

        <footer className="flex flex-wrap gap-x-5 border-t border-rule py-6 text-sm">
          {clinicAddress && (
            <a
              className="font-mono text-[11px] text-muted underline decoration-rule underline-offset-4 hover:text-ink"
              href={`https://stellar.expert/explorer/testnet/account/${clinicAddress}`}
              target="_blank"
              rel="noreferrer"
            >
              {clinicAddress.slice(0, 6)}…{clinicAddress.slice(-4)}
            </a>
          )}
          <Link href="/" className="ml-auto text-muted underline decoration-rule underline-offset-4 hover:text-ink">
            ← Patient side
          </Link>
        </footer>
      </div>
    </Frame>
  );
}

async function DealRow({ deal, origin }: { deal: Deal; origin: string }) {
  const noticeUrl = `${origin}/d/${deal.id}`;
  const qr = deal.status === 'arrived' ? await QRCode.toString(noticeUrl, { type: 'svg', margin: 0, color: { dark: '#1a1612', light: '#00000000' } }) : null;

  return (
    <li className="grid gap-4 border-b border-rule py-6 md:grid-cols-12 md:items-start">
      <div className="md:col-span-5">
        <Link href={`/d/${deal.id}`} className="font-serif text-xl tracking-[-0.02em] underline decoration-rule underline-offset-4 hover:decoration-oxblood">
          {deal.procedure}
        </Link>
        <p className="mt-1 text-sm text-muted">
          {formatDate(new Date(deal.policy.procedureDate * 1000))}
          {deal.agencyName && ` · via ${deal.agencyName}`}
        </p>
      </div>
      <div className="md:col-span-3">
        <p className="font-serif text-2xl tabular-nums">{formatEur(deal.depositEurCents)}</p>
        <p className={`mt-1 text-sm ${deal.status === 'funded' || deal.status === 'arrived' ? 'text-forest' : 'text-muted'}`}>
          {STATUS[deal.status]}
        </p>
        {deal.escrowContractId && (
          <a
            className="mt-1 inline-block font-mono text-[11px] text-muted underline decoration-rule underline-offset-4 hover:text-ink"
            href={`https://stellar.expert/explorer/testnet/contract/${deal.escrowContractId}`}
            target="_blank"
            rel="noreferrer"
          >
            escrow {deal.escrowContractId.slice(0, 6)}… · 1:{LIVE_SCALE}
          </a>
        )}
      </div>
      <div className="flex flex-col gap-3 md:col-span-4">
        {deal.error && (
          <p className="border-l-2 border-oxblood bg-oxblood/[0.06] px-3 py-2 text-sm leading-relaxed text-oxblood">
            {deal.error}
          </p>
        )}
        {deal.status === 'funded' && (
          <>
            <form action={checkIn.bind(null, deal.id)}>
              <SubmitButton pendingLabel="Checking in…">Patient has arrived</SubmitButton>
            </form>
            <form action={cancelDeal.bind(null, deal.id, 'clinic-cancel', undefined)}>
              <SubmitButton pendingLabel="Refunding…" variant="ghost">
                Clinic cancels — full refund
              </SubmitButton>
            </form>
          </>
        )}
        {deal.status === 'arrived' && qr && (
          <figure className="flex items-start gap-4">
            <div className="size-28 shrink-0" dangerouslySetInnerHTML={{ __html: qr }} />
            <figcaption className="text-sm leading-relaxed text-muted">
              Patient scans to confirm.
              <br />
              <Link href={`/d/${deal.id}`} className="text-ink underline decoration-rule underline-offset-4 hover:decoration-oxblood">
                Open on this device
              </Link>
            </figcaption>
          </figure>
        )}
        {deal.status === 'created' && (
          <div className="flex flex-col gap-2">
            <p className="text-sm text-muted">Awaiting payment. Resend the link if it went astray.</p>
            <CopyLink url={noticeUrl} />
          </div>
        )}
      </div>
    </li>
  );
}

function Withdrawals({ rows }: { rows: Withdrawal[] }) {
  if (rows.length === 0) return null;
  return (
    <table className="w-full border-t border-rule text-sm">
      <caption className="sr-only">Withdrawals</caption>
      <thead>
        <tr className="text-left font-mono text-[11px] tracking-[0.12em] text-muted uppercase">
          <th className="py-3 font-normal">When</th>
          <th className="py-3 text-right font-normal">USDC</th>
          <th className="py-3 text-right font-normal">TL paid</th>
          <th className="py-3 text-right font-normal">Status</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((w) => (
          <tr key={w.id} className="border-t border-rule">
            <td className="py-3 text-muted">{formatDateTime(new Date(w.at * 1000))}</td>
            <td className="py-3 text-right font-mono tabular-nums">
              {w.stellarTx ? (
                <a className="underline decoration-rule underline-offset-4 hover:decoration-oxblood" href={`https://stellar.expert/explorer/testnet/tx/${w.stellarTx}`} target="_blank" rel="noreferrer">
                  {w.usdc}
                </a>
              ) : (
                w.usdc
              )}
            </td>
            <td className="py-3 text-right font-mono tabular-nums">{Number(w.tl).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td className="py-3 text-right text-muted">
              {w.status}
              {w.bankRef && <span className="block font-mono text-[11px]">{w.bankRef}</span>}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function QuoteLine({ quote }: { quote: TryQuote }) {
  return (
    <p className="mt-6 border-y border-rule py-3 font-mono text-[12px] text-muted">
      {quote.usdc} USDC → {Number(quote.tl).toLocaleString('en-GB', { maximumFractionDigits: 2 })} TL today
    </p>
  );
}

function Figure({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-rule pt-3">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="mt-1 font-serif text-2xl tabular-nums tracking-[-0.02em]">{children}</dd>
    </div>
  );
}

function Field(props: { label: string; name: string; defaultValue?: string; placeholder?: string; inputMode?: 'decimal' }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm text-muted">
      {props.label}
      <input
        name={props.name}
        defaultValue={props.defaultValue}
        placeholder={props.placeholder}
        inputMode={props.inputMode}
        className="min-h-11 border border-ink/25 bg-transparent px-3 font-mono text-[15px] text-ink placeholder:text-muted/60 focus-visible:border-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
      />
    </label>
  );
}

/** Horizon balance string "12.3400000" → base units for display. */
function toBase(balance: string): bigint {
  const [whole = '0', frac = ''] = balance.split('.');
  return BigInt(whole) * 10_000_000n + BigInt(frac.padEnd(7, '0').slice(0, 7) || '0');
}

function trimUsdc(balance: string): string {
  return balance.replace(/\.?0+$/, '');
}

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}
