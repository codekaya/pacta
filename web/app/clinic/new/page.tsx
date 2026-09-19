import Link from 'next/link';
import { notFound } from 'next/navigation';
import { DepositForm } from '@/components/DepositForm';
import { Body, Colophon, Note, Sheet } from '@/components/Instrument';
import { clinics } from '@/lib/deals';

export const dynamic = 'force-dynamic';

export default function NewDeposit() {
  // Klinik girişi gelene kadar kütükteki tek klinik. Oturum, kliniği buradan seçecek.
  const clinic = clinics()[0];
  if (!clinic) notFound();

  return (
    <Sheet kind="Deposit undertaking · draft" reference="Unissued">
      <Body wide>
        <header className="flex flex-wrap items-end justify-between gap-6 border-b border-rule pt-10 pb-6">
          <div>
            <h1 className="font-serif text-[1.75rem] leading-tight tracking-[-0.02em]">
              Draw up the undertaking
            </h1>
            <div className="mt-3">
              <Note>
                The patient reads this before paying and pays against it. What you enter here is what
                the policy contract commits, so the dates are worth being exact about.
              </Note>
            </div>
          </div>
          <Link
            href="/clinic"
            className="font-mono text-[11px] tracking-[0.04em] text-muted uppercase underline decoration-rule underline-offset-4 hover:text-ink"
          >
            ← Register
          </Link>
        </header>

        <div className="py-8">
          <DepositForm clinic={clinic} />
        </div>

        <Colophon contractId={process.env.PACTA_POLICY_CONTRACT} />
      </Body>
    </Sheet>
  );
}
