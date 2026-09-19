'use client';

import { useActionState, useId, useState } from 'react';
import { createDeal, type CreateDealState } from '@/lib/actions';
import { PolicyTable } from '@/components/PolicyTable';
import { SubmitButton } from '@/components/SubmitButton';
import type { Clinic } from '@/lib/deals';
import { formatDateLong, formatEur } from '@/lib/money';
import { MAX_TIERS, type Policy } from '@/lib/policy';

/** Kliniğin formda tuttuğu kademe — sayı değil metin, çünkü alan boş olabilir. */
type TierDraft = { days: string; pct: string };

/**
 * Kliniklerin gerçekten kullandığı üç takvim. Sıfırdan kademe yazmak yerine
 * birini seçip oynatmak, formu dakikalar yerine saniyeler meselesi yapıyor.
 */
const TEMPLATES: { name: string; note: string; tiers: TierDraft[] }[] = [
  {
    name: 'Standard',
    note: 'Two weeks out, then a week',
    tiers: [
      { days: '14', pct: '100' },
      { days: '7', pct: '50' },
      { days: '0', pct: '0' },
    ],
  },
  {
    name: 'Strict',
    note: 'For theatre time booked a month ahead',
    tiers: [
      { days: '30', pct: '100' },
      { days: '14', pct: '50' },
      { days: '0', pct: '0' },
    ],
  },
  {
    name: 'Generous',
    note: 'Competes on flexibility',
    tiers: [
      { days: '7', pct: '100' },
      { days: '2', pct: '50' },
      { days: '0', pct: '0' },
    ],
  },
];

export function DepositForm({ clinic }: { clinic: Clinic }) {
  const [state, action] = useActionState<CreateDealState, FormData>(createDeal, undefined);

  const [procedure, setProcedure] = useState('');
  const [date, setDate] = useState('');
  const [deposit, setDeposit] = useState('');
  const [agencyName, setAgencyName] = useState('');
  const [agencyPct, setAgencyPct] = useState('10');
  const [tiers, setTiers] = useState<TierDraft[]>(TEMPLATES[0]!.tiers);

  const setTier = (index: number, patch: Partial<TierDraft>) =>
    setTiers((rows) => rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));

  return (
    <form action={action} className="grid gap-12 lg:grid-cols-12 lg:gap-16">
      <input type="hidden" name="clinicId" value={clinic.id} />

      <div className="flex flex-col gap-10 lg:col-span-7">
        <Issues state={state} />

        <fieldset className="flex flex-col gap-5">
          <Legend>The booking</Legend>
          <Field
            label="Procedure"
            name="procedure"
            value={procedure}
            onChange={setProcedure}
            placeholder="Six implants, zirconia crowns"
          />
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Procedure date" name="procedureDate" type="date" value={date} onChange={setDate} />
            <Field
              label="Deposit, EUR"
              name="deposit"
              value={deposit}
              onChange={setDeposit}
              placeholder="800"
              inputMode="decimal"
            />
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-5">
          <Legend>If the patient cancels</Legend>
          <p className="-mt-2 max-w-[56ch] text-sm leading-relaxed text-muted">
            Each row is a cutoff: cancel that many days before the procedure or earlier, and the
            patient gets back that share. The patient sees these as calendar dates, not percentages.
            Once the deposit is paid, nobody can edit them — including you.
          </p>

          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {TEMPLATES.map((template) => (
              <button
                key={template.name}
                type="button"
                onClick={() => setTiers(template.tiers)}
                className="min-h-10 text-left text-sm text-muted underline decoration-rule underline-offset-4 hover:text-ink hover:decoration-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
              >
                {template.name}
                <span className="ml-2 font-mono text-[11px] text-muted/80">{template.note}</span>
              </button>
            ))}
          </div>

          <table className="w-full text-sm">
            <thead>
              <tr className="text-left font-mono text-[11px] tracking-[0.12em] text-muted uppercase">
                <th className="py-2 font-normal">Days before, or more</th>
                <th className="py-2 font-normal">Patient gets back</th>
                <th className="w-10 py-2" />
              </tr>
            </thead>
            <tbody>
              {tiers.map((tier, index) => (
                <tr key={index} className="border-t border-rule">
                  <td className="py-2 pr-3">
                    <Cell
                      name="tierDays"
                      value={tier.days}
                      onChange={(days) => setTier(index, { days })}
                      aria-label={`Row ${index + 1}, days before the procedure`}
                      suffix="days"
                    />
                  </td>
                  <td className="py-2 pr-3">
                    <Cell
                      name="tierPct"
                      value={tier.pct}
                      onChange={(pct) => setTier(index, { pct })}
                      aria-label={`Row ${index + 1}, percent refunded`}
                      suffix="%"
                    />
                  </td>
                  <td className="py-2">
                    {tiers.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setTiers((rows) => rows.filter((_, i) => i !== index))}
                        aria-label={`Remove row ${index + 1}`}
                        className="size-10 text-muted hover:text-oxblood focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                      >
                        ×
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {tiers.length < MAX_TIERS && (
            <button
              type="button"
              onClick={() => setTiers((rows) => [...rows, { days: '', pct: '' }])}
              className="self-start min-h-10 text-sm text-muted underline decoration-rule underline-offset-4 hover:text-ink hover:decoration-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
            >
              Add a row
            </button>
          )}

          <p className="font-mono text-[11px] leading-relaxed text-muted">
            A clinic cancellation always refunds in full. That row is not editable — it is what makes
            the schedule fair enough to show.
          </p>
        </fieldset>

        <fieldset className="flex flex-col gap-5">
          <Legend>Agency, if the booking came through one</Legend>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              label="Agency name"
              name="agencyName"
              value={agencyName}
              onChange={setAgencyName}
              placeholder="Leave blank for a direct booking"
            />
            {agencyName && (
              <Field
                label="Agency share of what the clinic keeps, %"
                name="agencyPct"
                value={agencyPct}
                onChange={setAgencyPct}
                inputMode="decimal"
              />
            )}
          </div>
        </fieldset>

        <div className="flex flex-col gap-3 border-t border-rule pt-8">
          <SubmitButton pendingLabel="Writing the notice…">Create the notice</SubmitButton>
          <p className="text-sm leading-relaxed text-muted">
            Nothing touches the chain yet. The escrow is deployed and the schedule is committed when
            the patient pays.
          </p>
        </div>
      </div>

      <aside className="lg:col-span-5">
        <div className="lg:sticky lg:top-10">
          <p className="font-mono text-[11px] tracking-[0.16em] text-muted uppercase">
            What the patient sees
          </p>
          <Preview
            clinic={clinic}
            procedure={procedure}
            date={date}
            deposit={deposit}
            agencyName={agencyName}
            agencyPct={agencyPct}
            tiers={tiers}
          />
        </div>
      </aside>
    </form>
  );
}

// ---------------------------------------------------------------- önizleme

type PreviewProps = {
  clinic: Clinic;
  procedure: string;
  date: string;
  deposit: string;
  agencyName: string;
  agencyPct: string;
  tiers: TierDraft[];
};

/**
 * Hastanın göreceği bildirimin aynısı, aynı bileşenle. Klinik yüzde giriyor ama
 * hasta takvim tarihi ve avro görüyor — aradaki çeviriyi yazarken görmek,
 * kademeleri yanlış kurmanın önündeki tek gerçek engel.
 */
function Preview({ clinic, procedure, date, deposit, agencyName, agencyPct, tiers }: PreviewProps) {
  const policy = draftPolicy(date, tiers, agencyName ? agencyPct : '0');
  const cents = /^\d+(\.\d{1,2})?$/.test(deposit) ? Math.round(Number(deposit) * 100) : undefined;

  return (
    <article className="mt-4 border-t border-ink pt-6">
      <p className="font-serif text-[1.65rem] leading-tight tracking-[-0.02em]">{clinic.name}</p>
      <p className="mt-1.5 text-sm text-muted">{clinic.city}</p>
      <p className="mt-3 font-mono text-[11px] text-muted">Health tourism licence {clinic.licenseNo}</p>

      <dl className="mt-8 space-y-3 text-[15px]">
        <PreviewRow label="Procedure">{procedure || <Blank>Not named yet</Blank>}</PreviewRow>
        <PreviewRow label="Date">
          {policy ? formatDateLong(new Date(policy.procedureDate * 1000)) : <Blank>No date yet</Blank>}
        </PreviewRow>
        <PreviewRow label="Deposit">
          {cents !== undefined ? (
            <span className="font-serif text-2xl tabular-nums">{formatEur(cents)}</span>
          ) : (
            <Blank>No amount yet</Blank>
          )}
        </PreviewRow>
        {agencyName && <PreviewRow label="Agency">{agencyName}</PreviewRow>}
      </dl>

      <div className="mt-8">
        {policy && cents !== undefined ? (
          <PolicyTable policy={policy} depositEurCents={cents} at={new Date()} />
        ) : (
          <p className="border-t border-rule pt-6 text-sm leading-relaxed text-muted">
            Fill in the date and the deposit, and the cancellation schedule appears here exactly as
            the patient will read it — calendar dates and euro amounts.
          </p>
        )}
      </div>
    </article>
  );
}

/** Önizleme yalnızca tam ve sayısal bir taslakta çizilir; yarım veri yanıltır. */
function draftPolicy(date: string, tiers: TierDraft[], agencyPct: string): Policy | undefined {
  const procedureDate = Date.parse(`${date}T09:00:00+03:00`) / 1000;
  if (Number.isNaN(procedureDate)) return undefined;

  const parsed = tiers
    .filter((tier) => tier.days.trim() !== '' && tier.pct.trim() !== '')
    .map((tier) => ({ minDaysBefore: Number(tier.days), refundBps: Math.round(Number(tier.pct) * 100) }));

  if (parsed.length === 0 || parsed.some((t) => !Number.isFinite(t.minDaysBefore) || !Number.isFinite(t.refundBps))) {
    return undefined;
  }
  // Aynı gün sınırı iki kez girilmişse önizleme çizmek yanıltıcı olur; form zaten reddedecek.
  if (new Set(parsed.map((t) => t.minDaysBefore)).size !== parsed.length) return undefined;

  return { procedureDate, tiers: parsed, agencyBps: Math.round(Number(agencyPct || '0') * 100) };
}

// ---------------------------------------------------------------- parçalar

function Issues({ state }: { state: CreateDealState }) {
  if (!state || state.issues.length === 0) return null;
  return (
    <div role="alert" className="border-l-2 border-oxblood bg-oxblood/[0.06] px-4 py-3">
      <p className="text-sm text-oxblood">This notice cannot be written yet:</p>
      <ul className="mt-2 flex flex-col gap-1">
        {state.issues.map((issue, i) => (
          <li key={i} className="text-sm leading-relaxed text-oxblood">
            {issue.message}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Legend({ children }: { children: React.ReactNode }) {
  return (
    <legend className="w-full border-b border-rule pb-3 font-serif text-xl tracking-[-0.02em] text-ink">
      {children}
    </legend>
  );
}

type FieldProps = {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'date';
  placeholder?: string;
  inputMode?: 'decimal';
};

function Field({ label, name, value, onChange, type = 'text', placeholder, inputMode }: FieldProps) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm text-muted">
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
        className="min-h-11 border border-ink/25 bg-transparent px-3 font-mono text-[15px] text-ink placeholder:text-muted/60 focus-visible:border-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
      />
    </div>
  );
}

function Cell({
  name,
  value,
  onChange,
  suffix,
  ...rest
}: {
  name: string;
  value: string;
  onChange: (value: string) => void;
  suffix: string;
  'aria-label': string;
}) {
  return (
    <span className="flex items-center gap-2">
      <input
        {...rest}
        name={name}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        inputMode="numeric"
        className="min-h-11 w-20 border border-ink/25 bg-transparent px-3 text-right font-mono text-[15px] tabular-nums text-ink focus-visible:border-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
      />
      <span className="font-mono text-[11px] text-muted">{suffix}</span>
    </span>
  );
}

function PreviewRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-6 border-b border-rule pb-3">
      <dt className="shrink-0 text-muted">{label}</dt>
      <dd className="min-w-0 text-right break-words">{children}</dd>
    </div>
  );
}

function Blank({ children }: { children: React.ReactNode }) {
  return <span className="text-muted/60 italic">{children}</span>;
}
