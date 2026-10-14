import Link from 'next/link';
import { Frame, Wordmark } from '@/components/Frame';

export default function NotFound() {
  return (
    <Frame>
      <main className="mx-auto max-w-5xl px-6 py-8 md:px-10">
        <Wordmark />
        <p className="mt-24 font-serif text-3xl tracking-[-0.03em]">No notice with that id.</p>
        <Link
          href="/"
          className="mt-8 inline-flex min-h-11 items-center text-[15px] text-muted underline decoration-rule underline-offset-4 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
        >
          Back
        </Link>
      </main>
    </Frame>
  );
}
