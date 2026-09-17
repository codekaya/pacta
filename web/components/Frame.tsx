import Link from 'next/link';

export function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh">
      <div aria-hidden className="h-2 bg-ink" />
      {children}
    </div>
  );
}

export function Wordmark({ href = '/' }: { href?: string }) {
  return (
    <Link
      href={href}
      className="font-serif text-[1.35rem] tracking-[-0.03em] text-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
    >
      Pacta
    </Link>
  );
}
