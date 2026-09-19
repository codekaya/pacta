import Link from 'next/link';
import { Body, Sheet } from '@/components/Instrument';

export default function NotFound() {
  return (
    <Sheet kind="Deposit undertaking" reference="No such reference">
      <Body>
        <main className="pt-20">
          <p className="font-mono text-[11px] tracking-[0.04em] text-muted uppercase">Not on file</p>
          <p className="mt-3 font-serif text-[2rem] leading-tight tracking-[-0.03em]">
            No undertaking under that reference.
          </p>
          <Link
            href="/"
            className="mt-8 inline-flex min-h-10 font-mono text-[12px] text-muted underline decoration-rule underline-offset-4 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
          >
            ← Back
          </Link>
        </main>
      </Body>
    </Sheet>
  );
}
