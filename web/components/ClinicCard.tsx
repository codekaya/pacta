import { formatDate } from '@/lib/money';
import type { Clinic } from '@/lib/deals';

export function ClinicCard({ clinic }: { clinic: Clinic }) {
  return (
    <header>
      <p className="font-serif text-[1.65rem] leading-tight tracking-[-0.02em] text-ink">{clinic.name}</p>
      <p className="mt-1.5 text-sm text-muted">{clinic.city}</p>
      {clinic.verified && (
        <p className="mt-4 font-mono text-[11px] leading-relaxed text-muted">
          Health tourism licence {clinic.licenseNo}
          <span className="text-ink/25"> · </span>
          checked {formatDate(new Date(clinic.verifiedAt * 1000))}
        </p>
      )}
    </header>
  );
}
