import Link from 'next/link';
import { headers } from 'next/headers';
import QRCode from 'qrcode';
import { CopyLink } from '@/components/CopyLink';
import {
  Beneficiary,
  Body,
  Colophon,
  FinePrint,
  Note,
  Section,
  Sheet,
} from '@/components/Instrument';
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
  const clinic = deals[0]?.clinic;

  return (
    <Sheet
      kind="Front desk register"
      reference={escrowMode() === 'live' ? 'Live on Stellar testnet' : 'Simulated escrow'}
    >
      <Body wide>
        <header className="flex flex-wrap items-end justify-between gap-6 pt-10 pb-6">
          <div>
            <Beneficiary name={clinic?.name ?? 'Clinic'} city={clinic?.city} />
            {clinic?.verified && (
              <p className="mt-2 font-mono text-[11px] text-faint">
                Health tourism licence {clinic.licenseNo}
              </p>
            )}
          </div>
          <Link
            href="/clinic/new"
            className="inline-flex min-h-11 items-center justify-center bg-ink px-5 font-mono text-[12px] tracking-[0.04em] text-paper uppercase transition-colors duration-150 hover:bg-oxblood focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          >
            New deposit notice
          </Link>
        </header>

        {/* Defterin üst şeridi: üç rakam, aralarında çizgi. */}
        <dl className="grid divide-rule border-y border-rule sm:grid-cols-3 sm:divide-x">
          <Figure label="Held in escrow">
            {held.length === 0 ? '—' : formatEur(held.reduce((sum, d) => sum + d.depositEurCents, 0))}
          </Figure>
          <Figure label="Wallet, spendable">
            {balance === null ? '—' : `${formatUsdcDisplay(toBase(balance))} USDC`}
          </Figure>
          <Figure label="Today's rate">{quote ? `${quote.rate} TL / USDC` : '—'}</Figure>
        </dl>

        {justCreated && deals.some((d) => d.id === justCreated) && (
          <section className="mt-8 border-l-2 border-forest bg-forest/[0.05] px-4 py-4">
            <p className="font-mono text-[11px] tracking-[0.04em] text-forest uppercase">Notice ready</p>
            <p className="mt-2 mb-3 max-w-[62ch] text-sm leading-relaxed text-muted">
              Send this to the patient. Opening it is all they need to do — no account, no wallet.
              Anyone with the link can pay it, so send it the way you already send the appointment.
            </p>
            <CopyLink url={`${origin}/d/${justCreated}`} />
          </section>
        )}

        <div className="mt-8">
          <Section
            title="Register of deposits"
            aside={
              <span className="font-mono text-[11px] text-faint">
                {deals.length} {deals.length === 1 ? 'entry' : 'entries'}
              </span>
            }
          >
            <ul>
              {deals.map((deal, index) => (
                <DealRow key={deal.id} deal={deal} origin={origin} ordinal={index + 1} />
              ))}
            </ul>
            <div className="mt-4">
              <FinePrint>
                A held deposit is visible to the clinic and not spendable by it. Release requires both
                the front desk check-in and the patient&rsquo;s own confirmation; neither side can
                release alone. A clinic cancellation redeems the deposit in full.
              </FinePrint>
            </div>
          </Section>
        </div>

        <Section title="Withdraw to Turkish lira">
          <div className="grid gap-8 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <Note>
                Released USDC goes to {quote?.anchor ?? 'the anchor'} and arrives as TRY by bank
                transfer. The rate is locked with a firm quote before anything moves.
              </Note>
              {quote && (
                <p className="mt-4 border-y border-rule py-2 font-mono text-[12px] text-muted tabular-nums">
                  {quote.usdc} USDC → {Number(quote.tl).toLocaleString('en-GB', { maximumFractionDigits: 2 })} TL today
                </p>
              )}
            </div>
            <form action={withdrawTry} className="flex flex-col gap-4 lg:col-span-7">
              <Field
                label="Amount, USDC"
                name="amount"
                defaultValue={balance && Number(balance) > 0 ? trimUsdc(balance) : '5'}
                inputMode="decimal"
              />
              <Field
                label="IBAN — blank uses the anchor sandbox account"
                name="iban"
                placeholder="TR00 0000 0000 0000 0000 0000 00"
              />
              <SubmitButton pendingLabel="Quoting, paying, waiting for the bank…">
                Withdraw to TL
              </SubmitButton>
              {!wallets && (
                <p className="font-mono text-[11px] text-oxblood">
                  No demo wallets. Run: npm run tw -- wallets
                </p>
              )}
            </form>
          </div>
          <Withdrawals rows={withdrawals} />
        </Section>

        <Colophon contractId={process.env.PACTA_POLICY_CONTRACT} />
        {clinicAddress && (
          <p className="pb-8 font-mono text-[11px] text-faint">
            Clinic account{' '}
            <a
              className="underline decoration-rule underline-offset-2 hover:text-muted"
              href={`https://stellar.expert/explorer/testnet/account/${clinicAddress}`}
              target="_blank"
              rel="noreferrer"
            >
              {clinicAddress.slice(0, 6)}…{clinicAddress.slice(-4)}
            </a>
          </p>
        )}
      </Body>
    </Sheet>
  );
}

/**
 * Defter satırı. Kart değil satır: numarası var, hizası sabit, rakamları
 * tabular. Eylemler sağ uçta, sırası geldiğinde.
 */
async function DealRow({ deal, origin, ordinal }: { deal: Deal; origin: string; ordinal: number }) {
  const noticeUrl = `${origin}/d/${deal.id}`;
  const qr =
    deal.status === 'arrived'
      ? await QRCode.toString(noticeUrl, {
          type: 'svg',
          margin: 0,
          color: { dark: '#1a1612', light: '#00000000' },
        })
      : null;
  const holding = deal.status === 'funded' || deal.status === 'arrived';

  return (
    <li className="grid gap-4 border-b border-rule py-4 md:grid-cols-12 md:items-start">
      <span className="font-mono text-[11px] text-faint tabular-nums md:col-span-1 md:pt-1">
        {String(ordinal).padStart(2, '0')}
      </span>

      <div className="md:col-span-5">
        <Link
          href={`/d/${deal.id}`}
          className="text-[15px] text-ink underline decoration-rule underline-offset-4 hover:decoration-oxblood focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          {deal.procedure}
        </Link>
        <p className="mt-1 font-mono text-[11px] text-faint">
          {formatDate(new Date(deal.policy.procedureDate * 1000))}
          {deal.agencyName && ` · ${deal.agencyName}`}
          {deal.escrowContractId && (
            <>
              {' · '}
              <a
                className="underline decoration-rule underline-offset-2 hover:text-muted"
                href={`https://stellar.expert/explorer/testnet/contract/${deal.escrowContractId}`}
                target="_blank"
                rel="noreferrer"
              >
                escrow {deal.escrowContractId.slice(0, 6)}… 1:{LIVE_SCALE}
              </a>
            </>
          )}
        </p>
      </div>

      <div className="md:col-span-2">
        <p className="font-mono text-[15px] tabular-nums">{formatEur(deal.depositEurCents)}</p>
        <p className={`mt-1 font-mono text-[11px] ${holding ? 'text-forest' : 'text-faint'}`}>
          {STATUS[deal.status]}
        </p>
      </div>

      <div className="flex flex-col gap-3 md:col-span-4">
        {deal.error && (
          <p className="border-l-2 border-oxblood bg-oxblood/[0.07] px-3 py-2 font-mono text-[11px] leading-relaxed text-oxblood">
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
            <div className="size-24 shrink-0" dangerouslySetInnerHTML={{ __html: qr }} />
            <figcaption className="font-mono text-[11px] leading-relaxed text-muted">
              Patient scans to confirm.
              <br />
              <Link
                href={`/d/${deal.id}`}
                className="text-ink underline decoration-rule underline-offset-2 hover:decoration-oxblood"
              >
                Open on this device
              </Link>
            </figcaption>
          </figure>
        )}
        {deal.status === 'created' && <CopyLink url={noticeUrl} />}
      </div>
    </li>
  );
}

function Withdrawals({ rows }: { rows: Withdrawal[] }) {
  if (rows.length === 0) return null;
  return (
    <table className="mt-8 w-full border-collapse font-mono text-[12px]">
      <caption className="sr-only">Withdrawals</caption>
      <thead>
        <tr className="border-b border-rule text-left text-[11px] tracking-[0.04em] text-muted uppercase">
          <th className="py-2 font-normal">When</th>
          <th className="py-2 text-right font-normal">USDC</th>
          <th className="py-2 text-right font-normal">TL paid</th>
          <th className="py-2 text-right font-normal">Status</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((w) => (
          <tr key={w.id} className="border-b border-rule">
            <td className="py-2 text-muted">{formatDateTime(new Date(w.at * 1000))}</td>
            <td className="py-2 text-right tabular-nums">
              {w.stellarTx ? (
                <a
                  className="underline decoration-rule underline-offset-2 hover:decoration-oxblood"
                  href={`https://stellar.expert/explorer/testnet/tx/${w.stellarTx}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  {w.usdc}
                </a>
              ) : (
                w.usdc
              )}
            </td>
            <td className="py-2 text-right tabular-nums">
              {Number(w.tl).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </td>
            <td className="py-2 text-right text-muted">
              {w.status}
              {w.bankRef && <span className="block text-[11px] text-faint">{w.bankRef}</span>}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Figure({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="px-0 py-4 sm:px-5 sm:first:pl-0">
      <dt className="font-mono text-[11px] tracking-[0.04em] text-muted uppercase">{label}</dt>
      <dd className="mt-1.5 font-mono text-[1.5rem] leading-none tabular-nums">{children}</dd>
    </div>
  );
}

function Field(props: {
  label: string;
  name: string;
  defaultValue?: string;
  placeholder?: string;
  inputMode?: 'decimal';
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-mono text-[11px] tracking-[0.04em] text-muted uppercase">{props.label}</span>
      <input
        name={props.name}
        defaultValue={props.defaultValue}
        placeholder={props.placeholder}
        inputMode={props.inputMode}
        className="min-h-11 border border-ink/25 bg-transparent px-3 font-mono text-[14px] text-ink placeholder:text-faint focus-visible:border-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
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
