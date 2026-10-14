'use client';

import { useActionState, useMemo, useState } from 'react';
import { Arrow, Check, focus, primary } from '@/components/site/ui';
import { dayMonth, eur } from '@/content/format';
import { copy, type Locale } from '@/content/site';
import { bookDemo, type BookingState } from '@/lib/booking';
import { SCHEDULE_TIERS, type CatalogClinic } from '@/lib/clinics';
import { applyBps, entitlement, policyRows, type Policy } from '@/lib/policy';

const DAY_MS = 86_400_000;

/** yyyy-mm-dd, the patient's own calendar day. */
function isoDay(at: Date): string {
  const local = new Date(at.getTime() - at.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

export function BookingForm({ locale, clinic }: { locale: Locale; clinic: CatalogClinic }) {
  const t = copy[locale].booking;
  const [state, action, pending] = useActionState<BookingState, FormData>(bookDemo, undefined);
  const [packageId, setPackageId] = useState(clinic.packages[0]!.id);
  const [date, setDate] = useState(() => isoDay(new Date(Date.now() + 30 * DAY_MS)));
  const [rate, setRate] = useState(clinic.depositRates[Math.floor(clinic.depositRates.length / 2)]!);

  const pkg = clinic.packages.find((p) => p.id === packageId)!;
  const deposit = Math.round((pkg.priceEurCents * rate) / 100);
  const rest = pkg.priceEurCents - deposit;
  const pct = (n: number) => (locale === 'tr' ? `%${n}` : `${n}%`);

  const schedule = useMemo(() => {
    const procedureDate = Date.parse(`${date}T09:00:00+03:00`) / 1000;
    if (Number.isNaN(procedureDate)) return null;
    const policy: Policy = { procedureDate, tiers: SCHEDULE_TIERS[clinic.schedule], agencyBps: 0 };
    const now = entitlement(policy, new Date());
    return policyRows(policy).map((row) => ({
      label:
        row.from && row.until
          ? `${dayMonth(locale, row.from)} – ${dayMonth(locale, row.until)}`
          : row.until
            ? t.until(dayMonth(locale, row.until))
            : t.after(row.from ? dayMonth(locale, row.from) : ''),
      amount: row.refundBps === 0 ? t.noRefund : eur(locale, applyBps(deposit, row.refundBps)),
      now: row.tier.minDaysBefore === now.tier.minDaysBefore,
    }));
  }, [date, deposit, clinic.schedule, locale, t]);

  const min = isoDay(new Date(Date.now() + DAY_MS * 2));
  const max = isoDay(new Date(Date.now() + DAY_MS * 364));
  const procedureDay = Number.isNaN(Date.parse(date)) ? '' : dayMonth(locale, new Date(`${date}T12:00:00`));

  return (
    <form action={action} className="grid gap-8 lg:grid-cols-12 lg:gap-10">
      <input type="hidden" name="clinic" value={clinic.slug} />

      <div className="space-y-10 lg:col-span-7">
        <fieldset>
          <Step n={1} title={t.step1} />
          <div className="mt-4 space-y-3">
            {clinic.packages.map((p) => (
              <label
                key={p.id}
                className="flex cursor-pointer items-start gap-4 rounded-3xl bg-paper p-5 ring-1 ring-rule transition-shadow duration-150 hover:ring-teal/50 has-checked:ring-2 has-checked:ring-teal has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-teal"
              >
                <input
                  type="radio"
                  name="package"
                  value={p.id}
                  checked={p.id === packageId}
                  onChange={() => setPackageId(p.id)}
                  className="mt-1 size-4 shrink-0 accent-teal"
                />
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <span className="text-[16px] font-medium">{p.name[locale]}</span>
                    <span className="font-serif text-xl tabular-nums">{eur(locale, p.priceEurCents)}</span>
                  </span>
                  <span className="mt-1 block text-[13px] text-muted">{t.stay(p.stayNights, clinic.city)}</span>
                  <span className="mt-3 flex flex-wrap gap-1.5">
                    {p.includes[locale].map((item) => (
                      <span key={item} className="rounded-full bg-mist px-2.5 py-1 text-[12px] text-deep">
                        {item}
                      </span>
                    ))}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <Step n={2} title={t.step2} />
          <label htmlFor="booking-date" className="sr-only">
            {t.step2}
          </label>
          <input
            id="booking-date"
            type="date"
            name="date"
            value={date}
            min={min}
            max={max}
            onChange={(e) => setDate(e.target.value)}
            className={`mt-4 h-12 w-full max-w-xs rounded-2xl bg-paper px-4 text-[15px] ring-1 ring-rule ${focus}`}
          />
          <p className="mt-2 text-[13px] text-muted">{t.dateHint}</p>
        </fieldset>

        <fieldset>
          <Step n={3} title={t.step3} />
          <div className="mt-4 flex flex-wrap gap-2">
            {clinic.depositRates.map((r) => (
              <label
                key={r}
                className="cursor-pointer rounded-2xl bg-paper px-5 py-3 ring-1 ring-rule transition-colors duration-150 hover:ring-teal/50 has-checked:bg-deep has-checked:text-paper has-checked:ring-deep has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-teal"
              >
                <input type="radio" name="rate" value={r} checked={r === rate} onChange={() => setRate(r)} className="sr-only" />
                <span className="block text-[15px] font-medium">{pct(r)}</span>
                <span className="block text-[13px] opacity-80 tabular-nums">{eur(locale, Math.round((pkg.priceEurCents * r) / 100))}</span>
              </label>
            ))}
          </div>
          <p className="mt-2 text-[13px] text-muted">{t.restAtClinic(eur(locale, rest))}</p>
        </fieldset>
      </div>

      <aside className="lg:col-span-5">
        <div className="rounded-[28px] bg-paper p-6 shadow-[0_30px_80px_-30px_rgb(0_69_91_/_0.35)] ring-1 ring-deep/5 sm:p-7 lg:sticky lg:top-6">
          <p className="font-mono text-[11px] tracking-[0.2em] text-held uppercase">{t.summary}</p>
          <p className="mt-3 font-serif text-[1.5rem] leading-tight">{pkg.name[locale]}</p>
          <p className="mt-1 text-[14px] text-muted">
            {clinic.name} · {procedureDay}
          </p>

          <dl className="mt-6 space-y-2 text-[15px]">
            <Line label={t.total} value={eur(locale, pkg.priceEurCents)} />
            <Line label={t.atClinic} value={eur(locale, rest)} muted />
            <div className="flex items-baseline justify-between gap-4 border-t border-rule pt-3">
              <dt className="font-medium">
                {t.depositNow} <span className="text-muted">· {pct(rate)}</span>
              </dt>
              <dd className="font-serif text-3xl tabular-nums">{eur(locale, deposit)}</dd>
            </div>
          </dl>

          <p className="mt-6 text-[13px] text-muted">{t.ifCancel}</p>
          <ul className="mt-2 text-[14px]">
            {schedule?.map((row) => (
              <li key={row.label} className={`flex items-center justify-between gap-4 rounded-xl px-3 py-2 ${row.now ? 'bg-mist' : ''}`}>
                <span className={row.now ? 'text-ink' : 'text-muted'}>
                  {row.label}
                  {row.now && <span className="ml-2 text-[12px] font-medium text-held">{t.today}</span>}
                </span>
                <span className="tabular-nums">{row.amount}</span>
              </li>
            ))}
            <li className="flex items-center justify-between gap-4 px-3 py-2">
              <span className="text-muted">{t.clinicCancels}</span>
              <span className="flex items-center gap-1.5 text-held">
                <Check className="size-4" />
                {t.full}
              </span>
            </li>
          </ul>

          {state?.error && (
            <p role="alert" className="mt-5 rounded-2xl bg-alert/[0.06] p-3 text-[14px] text-alert">
              {t.errors[state.error]}
            </p>
          )}

          <button type="submit" disabled={pending} aria-busy={pending} className={`${primary} mt-6 w-full disabled:opacity-60`}>
            {pending ? t.reserving : t.reserve}
            {!pending && <Arrow className="size-4" />}
          </button>
          <p className="mt-3 text-[12px] leading-relaxed text-muted">{t.next}</p>
        </div>
      </aside>
    </form>
  );
}

function Step({ n, title }: { n: number; title: string }) {
  return (
    <legend className="flex items-center gap-3 font-serif text-[1.4rem]">
      <span className="grid size-9 place-items-center rounded-full bg-linear-to-br from-foam to-mint text-[17px] text-deep">{n}</span>
      {title}
    </legend>
  );
}

function Line({ label, value, muted = false }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-muted">{label}</dt>
      <dd className={`tabular-nums ${muted ? 'text-muted' : ''}`}>{value}</dd>
    </div>
  );
}
