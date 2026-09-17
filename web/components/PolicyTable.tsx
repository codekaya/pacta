import { formatDate, formatEur } from '@/lib/money';
import { applyBps, entitlement, policyRows, type Policy, type PolicyRow } from '@/lib/policy';

type Props = {
  policy: Policy;
  depositEurCents: number;
  at: Date;
};

export function PolicyTable({ policy, depositEurCents, at }: Props) {
  const active = entitlement(policy, at);
  const rows = policyRows(policy);

  return (
    <section>
      <h2 className="font-serif text-xl tracking-[-0.02em] text-ink">If you cancel</h2>
      <p className="mt-1 max-w-prose text-sm leading-relaxed text-muted">
        Written before payment. The schedule cannot be edited after the deposit is held.
      </p>

      <table className="mt-6 w-full text-[15px]">
        <caption className="sr-only">Refund due if you cancel, by date</caption>
        <tbody>
          {rows.map((row) => {
            const isActive = row.tier.minDaysBefore === active.tier.minDaysBefore;
            const refund = applyBps(depositEurCents, row.refundBps);
            return (
              <tr key={row.tier.minDaysBefore} className="border-t border-rule">
                <th
                  scope="row"
                  className={`py-3 pr-4 text-left font-normal ${isActive ? 'text-ink' : 'text-muted'}`}
                >
                  {rowLabel(row)}
                  {isActive && (
                    <span className="ml-2 font-mono text-[10px] tracking-[0.14em] text-oxblood uppercase">
                      · now
                    </span>
                  )}
                </th>
                <td
                  className={`py-3 text-right tabular-nums ${isActive ? 'font-medium text-ink' : 'text-muted'}`}
                >
                  {row.refundBps === 0 ? 'No refund' : formatEur(refund)}
                </td>
              </tr>
            );
          })}
          <tr className="border-t border-rule">
            <th scope="row" className="py-3 pr-4 text-left font-normal text-muted">
              Clinic cancels, or the licence lapses
            </th>
            <td className="py-3 text-right tabular-nums text-muted">{formatEur(depositEurCents)}</td>
          </tr>
        </tbody>
      </table>
    </section>
  );
}

function rowLabel(row: PolicyRow): string {
  if (row.from && row.until) return `${formatDate(row.from)} – ${formatDate(row.until)}`;
  if (row.until) return `Until ${formatDate(row.until)}`;
  if (row.from) return `From ${formatDate(row.from)}`;
  return 'Always';
}
