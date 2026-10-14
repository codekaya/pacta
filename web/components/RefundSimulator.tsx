'use client';

import { useId, useState } from 'react';
import { eur } from '@/content/format';
import { copy, type Locale } from '@/content/site';
import { SCHEDULE_TIERS } from '@/lib/clinics';
import { applyBps, DAY_SECONDS, entitlement, type Policy, type Tier } from '@/lib/policy';

/** Klinik formundaki üç şablon; adları içerik dosyasında, kademeler katalogda. */
const TIERS: Tier[][] = [SCHEDULE_TIERS.standard, SCHEDULE_TIERS.strict, SCHEDULE_TIERS.generous];

const DEPOSIT_CENTS = 80_000;
const AGENCY_BPS = 1_000;
const SPAN_DAYS = 45;
// Herhangi bir an; hesap yalnızca işlem tarihine olan farka bakar.
const PROCEDURE = SPAN_DAYS * 10 * DAY_SECONDS;

export function RefundSimulator({ locale }: { locale: Locale }) {
  const t = copy[locale].simulator;
  const id = useId();
  const [scheduleIndex, setScheduleIndex] = useState(0);
  const [viaAgency, setViaAgency] = useState(true);
  const [daysBefore, setDaysBefore] = useState(10);

  const tiers = TIERS[scheduleIndex]!;
  const policy: Policy = { procedureDate: PROCEDURE, tiers, agencyBps: viaAgency ? AGENCY_BPS : 0 };
  const owed = entitlement(policy, new Date((PROCEDURE - daysBefore * DAY_SECONDS) * 1000));

  const patient = applyBps(DEPOSIT_CENTS, owed.patientBps);
  const agency = applyBps(DEPOSIT_CENTS, owed.agencyBps);
  const clinic = DEPOSIT_CENTS - patient - agency;

  const bands = [...tiers]
    .sort((a, b) => b.minDaysBefore - a.minDaysBefore)
    .map((tier, i, all) => ({ tier, from: i === 0 ? SPAN_DAYS : all[i - 1]!.minDaysBefore, to: tier.minDaysBefore }));

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <div className="rounded-[28px] bg-paper p-6 ring-1 ring-rule sm:p-8 lg:col-span-3">
        <fieldset>
          <legend className="text-[13px] font-medium text-muted">{t.schedule}</legend>
          <div className="mt-3 grid grid-cols-3 gap-1 rounded-2xl bg-mist p-1">
            {t.schedules.map((s, i) => {
              const checked = i === scheduleIndex;
              return (
                <label
                  key={s.name}
                  className={`cursor-pointer rounded-xl px-3 py-2.5 text-center transition-colors duration-150 has-focus-visible:outline-2 has-focus-visible:outline-teal ${
                    checked ? 'bg-paper text-ink shadow-sm' : 'text-muted hover:text-ink'
                  }`}
                >
                  <input
                    type="radio"
                    name={`${id}-schedule`}
                    className="sr-only"
                    checked={checked}
                    onChange={() => setScheduleIndex(i)}
                  />
                  <span className="block text-[15px] font-medium">{s.name}</span>
                  <span className="mt-0.5 hidden text-[12px] leading-snug text-muted sm:block">{s.note}</span>
                </label>
              );
            })}
          </div>
        </fieldset>

        <div className="mt-9 flex items-baseline justify-between gap-4">
          <label htmlFor={`${id}-days`} className="text-[13px] font-medium text-muted">
            {t.cancels}
          </label>
          <span className="font-serif text-2xl tabular-nums">{daysBefore === 0 ? t.onTheDay : t.daysBefore(daysBefore)}</span>
        </div>

        <div aria-hidden className="mt-4 flex gap-1">
          {bands.map(({ tier, from, to }) => {
            const active = tier.minDaysBefore === owed.tier.minDaysBefore;
            return (
              <div
                key={tier.minDaysBefore}
                style={{ flexGrow: Math.max(from - to, 1) }}
                className={`min-w-0 basis-0 truncate rounded-lg px-2 py-1.5 text-center text-[12px] font-medium transition-colors duration-200 ${
                  active ? 'bg-teal text-paper' : 'bg-canvas text-muted ring-1 ring-rule'
                }`}
              >
                {locale === 'tr' ? `%${tier.refundBps / 100}` : `${tier.refundBps / 100}%`}
              </div>
            );
          })}
        </div>

        <input
          id={`${id}-days`}
          type="range"
          min={0}
          max={SPAN_DAYS}
          step={1}
          value={SPAN_DAYS - daysBefore}
          onChange={(e) => setDaysBefore(SPAN_DAYS - Number(e.target.value))}
          aria-valuetext={daysBefore === 0 ? t.onTheDay : t.daysBefore(daysBefore)}
          className="schedule-range mt-2"
        />
        <div aria-hidden className="flex justify-between text-[12px] text-muted">
          <span>{t.spanStart}</span>
          <span>{t.spanEnd}</span>
        </div>

        <label className="mt-8 flex cursor-pointer items-center gap-3 text-[15px]">
          <input
            type="checkbox"
            checked={viaAgency}
            onChange={(e) => setViaAgency(e.target.checked)}
            className="size-5 shrink-0 cursor-pointer accent-teal"
          />
          <span>
            {t.agency} <span className="text-muted">· {t.agencyNote}</span>
          </span>
        </label>
      </div>

      <div className="flex flex-col rounded-[28px] bg-deep p-6 text-paper sm:p-8 lg:col-span-2">
        <p className="text-[13px] text-sky">{t.onDeposit(eur(locale, DEPOSIT_CENTS))}</p>
        <p aria-live="polite" className="mt-2 font-serif text-[2rem] leading-tight">
          {owed.patientBps === 10_000 ? t.full : owed.patientBps === 0 ? t.none : t.partial(eur(locale, patient))}
        </p>

        <div aria-hidden className="mt-7 flex h-2.5 gap-1 overflow-hidden rounded-full">
          {patient > 0 && <div className="rounded-full bg-mint transition-[flex-grow] duration-300" style={{ flexGrow: patient }} />}
          {clinic > 0 && <div className="rounded-full bg-aqua transition-[flex-grow] duration-300" style={{ flexGrow: clinic }} />}
          {agency > 0 && <div className="rounded-full bg-sky transition-[flex-grow] duration-300" style={{ flexGrow: agency }} />}
        </div>

        <dl className="mt-6 space-y-3 text-[15px]">
          <Line swatch="bg-mint" label={t.patient} value={patient === 0 ? '—' : eur(locale, patient)} />
          <Line swatch="bg-aqua" label={t.clinic} value={clinic === 0 ? '—' : eur(locale, clinic)} />
          {viaAgency && <Line swatch="bg-sky" label={t.agencyRow} value={agency === 0 ? '—' : eur(locale, agency)} />}
        </dl>

        <p className="mt-auto pt-8 text-[13px] leading-relaxed text-sky">{t.footnote}</p>
      </div>
    </div>
  );
}

function Line({ swatch, label, value }: { swatch: string; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="flex items-center gap-2.5">
        <span aria-hidden className={`size-2.5 rounded-full ${swatch}`} />
        {label}
      </dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  );
}
