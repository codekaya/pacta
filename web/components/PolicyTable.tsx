import { formatDate, formatEur } from '@/lib/money';
import { applyBps, entitlement, policyRows, type Policy, type PolicyRow } from '@/lib/policy';

type Props = {
  policy: Policy;
  depositEurCents: number;
  at: Date;
};

/**
 * İade cetveli.
 *
 * Belgedeki en teknik blok, o yüzden en yoğun olanı: numaralı satırlar, dikey
 * bir çizgi, tabular rakamlar. Yürürlükteki kademe oxblood bir kenarlık ve bir
 * işaretle ayrılıyor — hastanın sayfada ilk bulması gereken satır o.
 */
export function PolicyTable({ policy, depositEurCents, at }: Props) {
  const active = entitlement(policy, at);
  const rows = policyRows(policy);

  return (
    // Cetvel dar bir sütuna sıkışabilir (formun önizleme paneli); sayfanın
    // kendisi yatay kaymasın diye taşma burada, tablonun kendi kabında.
    <div className="-mx-1 overflow-x-auto px-1">
    <table className="w-full border-collapse font-mono text-[13px]">
      <caption className="sr-only">Refund due if you cancel, by date</caption>
      <tbody>
        {rows.map((row, index) => {
          const isActive = row.tier.minDaysBefore === active.tier.minDaysBefore;
          const refund = applyBps(depositEurCents, row.refundBps);
          return (
            <tr key={row.tier.minDaysBefore} className="border-b border-rule">
              <Ordinal isActive={isActive}>{String(index + 1).padStart(2, '0')}</Ordinal>
              <th
                scope="row"
                className={`py-2 pr-4 text-left font-normal whitespace-nowrap ${isActive ? 'text-ink' : 'text-muted'}`}
              >
                {rowLabel(row)}
              </th>
              <td className={`py-2 pr-4 text-right tabular-nums ${isActive ? 'text-ink' : 'text-muted'}`}>
                {row.refundBps / 100}%
              </td>
              <td
                className={`py-2 text-right tabular-nums ${isActive ? 'text-ink' : 'text-muted'}`}
              >
                {row.refundBps === 0 ? '—' : formatEur(refund)}
              </td>
              <td className="w-14 py-2 pl-3 text-[11px] tracking-[0.04em] text-oxblood uppercase">
                {isActive && '◀ now'}
              </td>
            </tr>
          );
        })}
        <tr>
          <Ordinal isActive={false}>{'——'}</Ordinal>
          <th scope="row" className="py-2 pr-4 text-left font-normal text-muted">
            Clinic cancels, or the licence lapses
          </th>
          <td className="py-2 pr-4 text-right text-muted tabular-nums">100%</td>
          <td className="py-2 text-right text-muted tabular-nums">{formatEur(depositEurCents)}</td>
          <td className="w-14" />
        </tr>
      </tbody>
    </table>
    </div>
  );
}

/** Satır numarası ve onu cetvelden ayıran dikey çizgi. */
function Ordinal({ children, isActive }: { children: React.ReactNode; isActive: boolean }) {
  return (
    <td
      className={`w-12 border-r py-2 pr-3 text-right text-[11px] tabular-nums ${
        isActive ? 'border-oxblood text-oxblood' : 'border-rule text-faint'
      }`}
    >
      {children}
    </td>
  );
}

function rowLabel(row: PolicyRow): string {
  if (row.from && row.until) return range(row.from, row.until);
  if (row.until) return `Until ${formatDate(row.until)}`;
  if (row.from) return `From ${formatDate(row.from)}`;
  return 'Always';
}

/**
 * Aralığı belgenin yazacağı gibi kısaltır: tekrarlayan yıl, sonra tekrarlayan ay
 * düşer. "14 Oct 2026 – 21 Oct 2026" telefonda iki satıra kırılıyordu;
 * "14 – 21 Oct 2026" kırılmıyor ve okunması daha kolay.
 */
function range(from: Date, until: Date): string {
  const sameYear = from.getFullYear() === until.getFullYear();
  const sameMonth = sameYear && from.getMonth() === until.getMonth();
  if (sameMonth) return `${from.getDate()} – ${formatDate(until)}`;
  if (sameYear) {
    return `${formatDate(from).replace(/ \d{4}$/, '')} – ${formatDate(until)}`;
  }
  return `${formatDate(from)} – ${formatDate(until)}`;
}
