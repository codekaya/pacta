import type { Receipt } from '@/lib/deals';

/**
 * Anlaşmanın zincirdeki izi — belgenin arkasındaki işlem dökümü. Mono ve sıkı:
 * bu bir özet değil, bir kayıt.
 */
export function Receipts({ receipts }: { receipts?: Receipt[] }) {
  if (!receipts?.length) return null;
  return (
    <ol className="border-t border-rule font-mono text-[12px]">
      {receipts.map((r, i) => (
        <li
          key={`${r.at}-${i}`}
          className="flex items-baseline justify-between gap-3 border-b border-rule py-2"
        >
          <span className="min-w-0 text-muted">
            <span className="mr-2 text-faint tabular-nums">{String(i + 1).padStart(2, '0')}</span>
            {r.label}
          </span>
          {r.hash ? (
            <a
              className="shrink-0 text-ink underline decoration-rule underline-offset-2 hover:decoration-oxblood focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
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
