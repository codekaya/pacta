import Link from 'next/link';
import { Logo } from '@/components/Logo';

export function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh">
      <div aria-hidden className="h-1 bg-linear-to-r from-mint via-teal to-deep" />
      {children}
    </div>
  );
}

export function Wordmark({ href = '/' }: { href?: string }) {
  return (
    <Link
      href={href}
      aria-label="Pacta"
      className="rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal"
    >
      <Logo />
    </Link>
  );
}
