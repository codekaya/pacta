import type { Receipt } from '@/lib/deals';

/** On-chain trail of a deal. Rows without a hash were simulated or had none returned. */
export function Receipts({ receipts }: { receipts?: Receipt[] }) {
  if (!receipts?.length) return null;
  return (
    <ol className="mt-6 border-t border-rule">
      {receipts.map((r, i) => (
        <li key={`${r.at}-${i}`} className="flex items-baseline justify-between gap-3 border-b border-rule py-2.5 text-sm">
          <span className="min-w-0 text-muted">{r.label}</span>
          {r.hash ? (
            <a
              className="shrink-0 font-mono text-[12px] text-ink underline decoration-rule underline-offset-4 hover:decoration-oxblood focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
              href={`https://stellar.expert/explorer/testnet/tx/${r.hash}`}
              target="_blank"
              rel="noreferrer"
            >
              {r.hash.slice(0, 8)}…
            </a>
          ) : null}
        </li>
      ))}
    </ol>
  );
}
