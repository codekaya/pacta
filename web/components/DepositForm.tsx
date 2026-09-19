'use client';

import { useActionState, useId, useState } from 'react';
import { createDeal, type CreateDealState } from '@/lib/actions';
import { Beneficiary, Entry, FinePrint, Principal } from '@/components/Instrument';
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
    <form action={action} className="grid gap-10 lg:grid-cols-12 lg:gap-14">
      <input type="hidden" name="clinicId" value={clinic.id} />

      <div className="flex flex-col gap-8 lg:col-span-7">
        <Issues state={state} />

        <fieldset>
          <Legend>Particulars</Legend>
          <div className="mt-4 flex flex-col gap-4">
            <Field
              label="Instrument"
              name="procedure"
              value={procedure}
              onChange={setProcedure}
              placeholder="Six implants, zirconia crowns"
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Maturity" name="procedureDate" type="date" value={date} onChange={setDate} />
              <Field
                label="Principal, EUR"
                name="deposit"
                value={deposit}
                onChange={setDeposit}
                placeholder="800"
                inputMode="decimal"
              />
            </div>
          </div>
        </fieldset>

        <fieldset>
          <Legend>Schedule of redemption</Legend>

          <div className="mt-3">
            <FinePrint>
              Each row is a cutoff: cancel that many days before the maturity date or earlier, and the
              patient redeems that share. The patient reads these as calendar dates and euro amounts,
              not percentages. Once the deposit is funded the schedule is committed and nobody can
              amend it — including you.
            </FinePrint>
          </div>

          <div className="mt-4">
            <p className="font-mono text-[11px] tracking-[0.04em] text-muted uppercase">Start from</p>
            <div className="mt-2 grid gap-px bg-rule sm:grid-cols-3">
              {TEMPLATES.map((template) => (
                <button
                  key={template.name}
                  type="button"
                  onClick={() => setTiers(template.tiers)}
                  className="bg-paper px-3 py-2.5 text-left transition-colors duration-150 hover:bg-panel focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ink"
                >
                  <span className="block font-mono text-[13px] text-ink">{template.name}</span>
                  <span className="mt-0.5 block text-[12px] leading-snug text-faint">{template.note}</span>
                </button>
              ))}
            </div>
          </div>

          <table className="mt-5 w-full border-collapse font-mono text-[13px]">
            <thead>
              <tr className="border-b border-rule text-left text-[11px] tracking-[0.04em] text-muted uppercase">
                <th className="w-12 py-2 pr-3 text-right font-normal">№</th>
                <th className="py-2 font-normal">Days before, or more</th>
                <th className="py-2 font-normal">Redeems</th>
                <th className="w-10 py-2" />
              </tr>
            </thead>
            <tbody>
              {tiers.map((tier, index) => (
                <tr key={index} className="border-b border-rule">
                  <td className="w-12 border-r border-rule py-2 pr-3 text-right text-[11px] text-faint tabular-nums">
                    {String(index + 1).padStart(2, '0')}
                  </td>
                  <td className="py-2 pl-3">
                    <Cell
                      name="tierDays"
                      value={tier.days}
                      onChange={(days) => setTier(index, { days })}
                      aria-label={`Row ${index + 1}, days before the procedure`}
                      suffix="days"
                    />
                  </td>
                  <td className="py-2">
                    <Cell
                      name="tierPct"
                      value={tier.pct}
                      onChange={(pct) => setTier(index, { pct })}
                      aria-label={`Row ${index + 1}, percent refunded`}
                      suffix="%"
                    />
                  </td>
                  <td className="py-2 text-right">
                    {tiers.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setTiers((rows) => rows.filter((_, i) => i !== index))}
                        aria-label={`Remove row ${index + 1}`}
                        className="size-9 text-faint hover:text-oxblood focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                      >
                        ×
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              <tr className="border-b border-rule">
                <td className="w-12 border-r border-rule py-2 pr-3 text-right text-[11px] text-faint">
                  {'——'}
                </td>
                <td className="py-2 pl-3 text-muted">Clinic cancels, or the licence lapses</td>
                <td className="py-2 text-muted tabular-nums">100%</td>
                <td />
              </tr>
            </tbody>
          </table>

          {tiers.length < MAX_TIERS && (
            <button
              type="button"
              onClick={() => setTiers((rows) => [...rows, { days: '', pct: '' }])}
              className="mt-3 min-h-9 font-mono text-[12px] text-muted underline decoration-rule underline-offset-4 hover:text-ink hover:decoration-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
            >
              + Add a row
            </button>
          )}
        </fieldset>

        <fieldset>
          <Legend>Introducing agency</Legend>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field
              label="Agency"
              name="agencyName"
              value={agencyName}
              onChange={setAgencyName}
              placeholder="Blank for a direct booking"
            />
            {agencyName && (
              <Field
                label="Share of what the clinic keeps, %"
                name="agencyPct"
                value={agencyPct}
                onChange={setAgencyPct}
                inputMode="decimal"
              />
            )}
          </div>
        </fieldset>

        <div className="flex flex-col gap-3 border-t border-rule pt-6">
          <SubmitButton pendingLabel="Drawing up the undertaking…">Issue the notice</SubmitButton>
          <FinePrint>
            Nothing touches the chain yet. The escrow is deployed and the schedule committed when the
            patient funds the deposit, in that order.
          </FinePrint>
        </div>
      </div>

      <aside className="lg:col-span-5">
        <div className="lg:sticky lg:top-6">
          <p className="font-mono text-[11px] tracking-[0.04em] text-muted uppercase">
            As the patient will read it
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
 * Hastanın göreceği belgenin aynısı, aynı bileşenlerle. Klinik yüzde giriyor ama
 * hasta takvim tarihi ve avro görüyor — aradaki çeviriyi yazarken görmek,
 * kademeleri yanlış kurmanın önündeki tek gerçek engel.
 */
function Preview({ clinic, procedure, date, deposit, agencyName, agencyPct, tiers }: PreviewProps) {
  const policy = draftPolicy(date, tiers, agencyName ? agencyPct : '0');
  const cents = /^\d+(\.\d{1,2})?$/.test(deposit) ? Math.round(Number(deposit) * 100) : undefined;

  return (
    <article className="mt-2 border border-rule bg-panel p-5">
      <Beneficiary name={clinic.name} city={clinic.city} />
      <p className="mt-2 font-mono text-[11px] text-faint">
        Health tourism licence {clinic.licenseNo}
      </p>

      <dl className="mt-5">
        <Entry label="Instrument">{procedure || <Blank>unstated</Blank>}</Entry>
        <Entry label="Maturity">
          {policy ? formatDateLong(new Date(policy.procedureDate * 1000)) : <Blank>unstated</Blank>}
        </Entry>
        {agencyName && <Entry label="Introduced by">{agencyName}</Entry>}
      </dl>

      {cents !== undefined ? (
        <Principal label="Principal due" amount={formatEur(cents)} />
      ) : (
        <div className="border-b border-rule py-3">
          <p className="font-mono text-[11px] tracking-[0.04em] text-muted uppercase">Principal due</p>
          <p className="mt-1 font-mono text-[2rem] leading-none text-faint">—</p>
        </div>
      )}

      <div className="mt-5">
        {policy && cents !== undefined ? (
          <>
            <p className="mb-2 font-mono text-[11px] tracking-[0.04em] text-muted uppercase">
              Schedule of redemption
            </p>
            <PolicyTable policy={policy} depositEurCents={cents} at={new Date()} />
          </>
        ) : (
          <FinePrint>
            Enter the maturity date and the principal, and the schedule appears here exactly as the
            patient will read it — calendar dates and euro amounts, not percentages.
          </FinePrint>
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
    <div role="alert" className="border-l-2 border-oxblood bg-oxblood/[0.07] px-4 py-3">
      <p className="font-mono text-[11px] tracking-[0.04em] text-oxblood uppercase">
        Cannot be issued
      </p>
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
    <legend className="rule-major w-full pt-3 font-mono text-[11px] tracking-[0.04em] text-muted uppercase">
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
      <label htmlFor={id} className="font-mono text-[11px] tracking-[0.04em] text-muted uppercase">
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
        className="min-h-11 border border-ink/25 bg-transparent px-3 font-mono text-[14px] text-ink placeholder:text-faint focus-visible:border-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
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
        className="min-h-10 w-16 border border-ink/25 bg-transparent px-2 text-right font-mono text-[14px] tabular-nums text-ink focus-visible:border-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
      />
      <span className="font-mono text-[11px] text-faint">{suffix}</span>
    </span>
  );
}

function Blank({ children }: { children: React.ReactNode }) {
  return <span className="text-faint">{children}</span>;
}
