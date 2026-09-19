import Link from 'next/link';
import { notFound } from 'next/navigation';
import { DepositForm } from '@/components/DepositForm';
import { Frame, Wordmark } from '@/components/Frame';
import { clinics } from '@/lib/deals';

export const dynamic = 'force-dynamic';

export default function NewDeposit() {
  // Klinik girişi gelene kadar kütükteki tek klinik. Oturum, kliniği buradan seçecek.
  const clinic = clinics()[0];
  if (!clinic) notFound();

  return (
    <Frame>
      <div className="mx-auto max-w-6xl px-6 md:px-10">
        <div className="flex items-baseline justify-between py-6">
          <Wordmark />
          <Link
            href="/clinic"
            className="text-sm text-muted underline decoration-rule underline-offset-4 hover:text-ink"
          >
            ← Front desk
          </Link>
        </div>

        <header className="border-t border-rule py-10">
          <p className="font-mono text-[11px] tracking-[0.16em] text-muted uppercase">New deposit</p>
          <h1 className="mt-3 font-serif text-4xl tracking-[-0.03em]">Write the notice</h1>
          <p className="mt-4 max-w-[58ch] text-[15px] leading-relaxed text-muted">
            The patient reads this before paying, and pays against it. What you write here is what
            the policy contract commits — so it is worth being exact about the dates.
          </p>
        </header>

        <div className="border-t border-rule py-10 lg:py-14">
          <DepositForm clinic={clinic} />
        </div>
      </div>
    </Frame>
  );
}
