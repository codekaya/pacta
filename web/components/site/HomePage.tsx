import Link from 'next/link';
import { headers } from 'next/headers';
import QRCode from 'qrcode';
import { PactaMark } from '@/components/Logo';
import { card, DeskCard, type DeskDeal } from '@/components/ProductCards';
import { RefundSimulator } from '@/components/RefundSimulator';
import { SiteFooter } from '@/components/site/Footer';
import { SiteHeader } from '@/components/site/Header';
import { ClinicMap, type MapClinic } from '@/components/site/ClinicMap';
import { LivingNotice, type NoticeRow } from '@/components/site/LivingNotice';
import { Arrow, Check, Cross, Eyebrow, primary, secondary, Sweep, Title, wrap, focus } from '@/components/site/ui';
import { Em } from '@/components/site/Em';
import { WhatsAppFloat, WhatsAppLink } from '@/components/site/WhatsApp';
import { dayMonth, eur } from '@/content/format';
import { copy, DEMO_NOTICE_PATH, href, POLICY_CONTRACT, REPO_URL, type Locale } from '@/content/site';
import { CATALOG, startingPrice } from '@/lib/clinics';
import { demoDealTemplate } from '@/lib/deals';
import { applyBps, arrivalEntitlement, DAY_SECONDS, entitlement, policyRows } from '@/lib/policy';

export async function HomePage({ locale }: { locale: Locale }) {
  const t = copy[locale];
  const now = new Date();
  const inDays = (n: number) => Math.floor(now.getTime() / 1000) + n * DAY_SECONDS;
  const deal = demoDealTemplate();
  // İşleme on gün: bildirimde ortadaki kademe (%50) "bugün" olarak işaretlenir.
  const policy = { ...deal.policy, procedureDate: inDays(10) };
  const active = entitlement(policy, now);
  const rows: NoticeRow[] = policyRows(policy).map((row) => ({
    label:
      row.from && row.until
        ? `${dayMonth(locale, row.from)} – ${dayMonth(locale, row.until)}`
        : row.until
          ? `${locale === 'tr' ? '' : 'Until '}${dayMonth(locale, row.until)}${locale === 'tr' ? ' tarihine kadar' : ''}`
          : `${locale === 'tr' ? '' : 'From '}${row.from ? dayMonth(locale, row.from) : ''}${locale === 'tr' ? ' sonrası' : ''}`,
    amount: row.refundBps === 0 ? t.living.noRefund : eur(locale, applyBps(deal.depositEurCents, row.refundBps)),
    now: row.tier.minDaysBefore === active.tier.minDaysBefore,
  }));

  const host = (await headers()).get('host') ?? 'localhost:3000';
  const origin = `${host.startsWith('localhost') ? 'http' : 'https'}://${host}`;
  const qr = await QRCode.toString(`${origin}${DEMO_NOTICE_PATH}`, {
    type: 'svg',
    margin: 0,
    color: { dark: '#0b2f3a', light: '#00000000' },
  });

  const desk: DeskDeal[] = [
    { procedure: 'FUE hair transplant, 4,000 grafts', date: new Date(inDays(0) * 1000), agency: 'MedTravel Partners', eurCents: 45_000, status: 'arrived' },
    { procedure: deal.procedure, date: new Date(inDays(10) * 1000), agency: deal.agencyName, eurCents: deal.depositEurCents, status: 'funded' },
    { procedure: 'Rhinoplasty, open technique', date: new Date(inDays(24) * 1000), eurCents: 90_000, status: 'created' },
  ];

  const arrival = arrivalEntitlement(deal.policy);

  const pct = (n: number) => (locale === 'tr' ? `%${n}` : `${n}%`);
  const mapClinics: MapClinic[] = CATALOG.map((c) => ({
    slug: c.slug,
    href: `${href(locale, '/clinics')}/${c.slug}`,
    name: c.name,
    district: c.district,
    city: c.city,
    lat: c.geo.lat,
    lon: c.geo.lon,
    cover: c.photos.cover.src,
    alt: c.photos.cover.alt[locale],
    from: eur(locale, startingPrice(c)),
    rates: c.depositRates.map(pct).join(' · '),
  }));

  return (
    <div id="top" lang={locale} className="min-h-dvh">
      {/* ================================================================ hero */}
      <div className="relative overflow-hidden bg-aura">
        <Sweep />
        <SiteHeader locale={locale} path="" />

        <section className={`${wrap} relative grid items-center gap-14 pt-8 pb-20 lg:grid-cols-12 lg:gap-8 lg:pt-14 lg:pb-28`}>
          <div className="rise lg:col-span-6">
            <p className="inline-flex items-center gap-2 rounded-full bg-paper/70 px-3.5 py-1.5 text-[13px] text-muted ring-1 ring-rule backdrop-blur">
              <span className="size-1.5 rounded-full bg-teal" />
              {t.hero.label}
            </p>
            <h1 className="mt-7 font-serif text-[2.75rem] leading-[1.04] tracking-[-0.025em] text-balance sm:text-[3.75rem] lg:text-[4.1rem]">
              <Em text={t.hero.title} />
            </h1>
            <p className="mt-6 max-w-[34rem] text-lg leading-relaxed text-muted">{t.hero.body}</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href={href(locale, '/pilot')} className={primary}>
                {t.nav.join}
                <Arrow className="size-4" />
              </Link>
              <Link href={href(locale, '/clinics')} className={secondary}>
                {t.hero.tryIt}
              </Link>
            </div>
            <ul className="mt-10 flex flex-wrap gap-x-5 gap-y-2 text-[13px] text-muted">
              {t.hero.trust.map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <Check className="size-4 text-held" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="rise w-full [animation-delay:120ms] lg:col-span-6 lg:col-start-7">
            <ClinicMap locale={locale} clinics={mapClinics} />
            <p className="mt-4 text-[13px] leading-relaxed text-muted">
              {t.map.caption}{' '}
              <Link href={href(locale, '/clinics')} className={`font-medium text-held underline decoration-rule underline-offset-4 hover:decoration-teal ${focus}`}>
                {t.map.browse}
              </Link>
            </p>
          </div>
        </section>
      </div>

      <main>
        {/* ============================================================ audience */}
        <section aria-labelledby="audience-title" className={`${wrap} pt-16 lg:pt-20`}>
          <h2 id="audience-title" className="text-center font-serif text-2xl">
            {t.audience.title}
          </h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {t.audience.items.map((item) => (
              <Link
                key={item.id}
                href={item.id === 'patients' ? href(locale, '/clinics') : `#${item.id}`}
                className={`group flex items-center justify-between gap-6 rounded-3xl bg-canvas p-6 ring-1 ring-rule/70 transition-shadow duration-200 hover:shadow-[0_20px_50px_-25px_rgb(0_69_91_/_0.45)] hover:ring-teal/40 ${focus}`}
              >
                <span>
                  <span className="block font-serif text-[1.35rem]">{item.title}</span>
                  <span className="mt-1 block text-[15px] leading-snug text-muted">{item.body}</span>
                </span>
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-paper text-deep ring-1 ring-rule transition-transform duration-200 group-hover:translate-x-0.5">
                  <Arrow className="size-4" />
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* ============================================================ problem */}
        <section className={`${wrap} py-24 lg:py-28`}>
          <div className="grid gap-10 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-6">
              <Eyebrow>{t.problem.label}</Eyebrow>
              <Title text={t.problem.title} />
            </div>
            <p className="text-[17px] leading-relaxed text-muted lg:col-span-5 lg:col-start-8">{t.problem.body}</p>
          </div>
          <dl className="mt-14 grid gap-4 sm:grid-cols-3">
            {t.problem.stats.map((stat) => (
              <div key={stat.figure} className="flex flex-col-reverse justify-end gap-3 rounded-3xl bg-canvas p-7 ring-1 ring-rule/70">
                <dt className="text-[15px] leading-snug text-muted">{stat.label}</dt>
                <dd className="font-serif text-[2.6rem] leading-none tracking-[-0.02em] text-deep">{stat.figure}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 text-[13px] text-muted">{t.problem.source}</p>
        </section>

        {/* ============================================================ how */}
        <section id="how" className="scroll-mt-4 bg-canvas py-24 lg:py-28">
          <div className={wrap}>
            <div className="mx-auto max-w-2xl text-center">
              <Eyebrow>{t.how.label}</Eyebrow>
              <Title text={t.how.title} />
              <p className="mt-5 text-[17px] leading-relaxed text-muted">{t.how.body}</p>
            </div>
            <ol className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {t.how.steps.map((step, i) => (
                <li key={step.title} className="flex flex-col rounded-3xl bg-paper p-7 ring-1 ring-rule/70">
                  <span className="grid size-11 place-items-center rounded-full bg-linear-to-br from-foam to-mint font-serif text-xl text-deep">
                    {i + 1}
                  </span>
                  <h3 className="mt-6 font-serif text-[1.35rem] leading-snug">{step.title}</h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-muted">{step.body}</p>
                  <p className="mt-auto pt-6 text-[13px] font-medium text-held">{step.chain}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ============================================================ clinics */}
        <section id="clinics" className={`${wrap} scroll-mt-4 py-24 lg:py-28`}>
          <div className="grid items-center gap-14 lg:grid-cols-12 lg:gap-12">
            <div className="lg:col-span-5">
              <Eyebrow>{t.clinics.label}</Eyebrow>
              <Title text={t.clinics.title} />
              <p className="mt-5 text-[17px] leading-relaxed text-muted">{t.clinics.body}</p>
              <Points items={t.clinics.points} />
              <Link href="/clinic" className={`${secondary} mt-10`}>
                {t.clinics.button}
                <Arrow className="size-4" />
              </Link>
            </div>
            <div className="lg:col-span-7">
              <DeskCard clinicName={deal.clinic.name} deals={desk} qr={qr} />
            </div>
          </div>
        </section>

        {/* ============================================================ agencies */}
        <section id="agencies" className="scroll-mt-4 bg-canvas py-24 lg:py-28">
          <div className={`${wrap} grid items-center gap-14 lg:grid-cols-12 lg:gap-12`}>
            <div className="order-2 lg:order-1 lg:col-span-6">
              <div className={`${card} p-7 sm:p-9`}>
                <div className="flex items-baseline justify-between gap-4">
                  <p className="text-[15px] text-muted">{t.agencies.held}</p>
                  <p className="font-serif text-4xl tabular-nums">{eur(locale, deal.depositEurCents)}</p>
                </div>
                <p className="mt-8 text-[13px] font-medium text-muted">{t.agencies.onArrival}</p>
                <div className="mt-3 space-y-4">
                  <Share label={t.agencies.clinic} bps={arrival.clinicBps} amount={eur(locale, applyBps(deal.depositEurCents, arrival.clinicBps))} tone="bg-teal" locale={locale} />
                  <Share label={deal.agencyName ?? 'Agency'} bps={arrival.agencyBps} amount={eur(locale, applyBps(deal.depositEurCents, arrival.agencyBps))} tone="bg-mint" locale={locale} />
                </div>
                <p className="mt-8 flex gap-3 rounded-2xl bg-canvas p-4 text-[14px] leading-relaxed text-muted">
                  <Check className="mt-0.5 size-5 shrink-0 text-held" />
                  {t.agencies.note}
                </p>
              </div>
            </div>
            <div className="order-1 lg:order-2 lg:col-span-5 lg:col-start-8">
              <Eyebrow>{t.agencies.label}</Eyebrow>
              <Title text={t.agencies.title} />
              <p className="mt-5 text-[17px] leading-relaxed text-muted">{t.agencies.body}</p>
              <Points items={t.agencies.points} />
            </div>
          </div>
        </section>

        {/* ============================================================ patients */}
        <section id="patients" className={`${wrap} scroll-mt-4 py-24 lg:py-28`}>
          <div className="grid items-center gap-14 lg:grid-cols-12 lg:gap-12">
            <div className="lg:col-span-5">
              <Eyebrow>{t.patients.label}</Eyebrow>
              <Title text={t.patients.title} />
              <Points items={t.patients.points} />
              <Link href={href(locale, '/clinics')} className={`${secondary} mt-10`}>
                {t.patients.button}
                <Arrow className="size-4" />
              </Link>
            </div>
            <div className="mx-auto w-full max-w-md lg:col-span-5 lg:col-start-8">
              <LivingNotice
                locale={locale}
                clinic={deal.clinic.name}
                procedure={`${t.living.procedure} · ${dayMonth(locale, new Date(policy.procedureDate * 1000))}`}
                deposit={eur(locale, deal.depositEurCents)}
                rows={rows}
                licence={deal.clinic.licenseNo}
              />
            </div>
          </div>
        </section>

        {/* ============================================================ refunds */}
        <section id="refunds" className="scroll-mt-4 bg-aura py-24 lg:py-28">
          <div className={wrap}>
            <div className="mx-auto max-w-2xl text-center">
              <Eyebrow>{t.refunds.label}</Eyebrow>
              <Title text={t.refunds.title} />
              <p className="mt-5 text-[17px] leading-relaxed text-muted">{t.refunds.body}</p>
            </div>
            <div className="mt-14">
              <RefundSimulator locale={locale} />
            </div>
          </div>
        </section>

        {/* ============================================================ pricing */}
        <section id="pricing" className="scroll-mt-4 bg-canvas py-24 lg:py-28">
          <div className={wrap}>
            <div className="mx-auto max-w-2xl text-center">
              <Eyebrow>{t.pricing.label}</Eyebrow>
              <Title text={t.pricing.title} />
              <p className="mt-5 text-[17px] leading-relaxed text-muted">{t.pricing.body}</p>
            </div>
            <div className="mt-14 grid gap-4 lg:grid-cols-3">
              {t.pricing.cards.map((rail) => {
                const ours = 'ours' in rail && rail.ours;
                return (
                  <div
                    key={rail.name}
                    className={`flex flex-col rounded-3xl p-8 ${
                      ours ? 'bg-deep text-paper shadow-[0_30px_80px_-30px_rgb(0_69_91_/_0.6)]' : 'bg-paper ring-1 ring-rule/70'
                    }`}
                  >
                    <p className={`text-[15px] font-medium ${ours ? 'text-sky' : 'text-muted'}`}>{rail.name}</p>
                    <p className="mt-3 font-serif text-[2.6rem] leading-none tracking-[-0.02em]">{rail.price}</p>
                    <p className={`mt-2 text-[14px] ${ours ? 'text-sky' : 'text-muted'}`}>{rail.unit}</p>
                    <ul className={`mt-7 space-y-3 border-t pt-6 ${ours ? 'border-paper/15' : 'border-rule'}`}>
                      {rail.points.map((point) => (
                        <li key={point.text} className="flex gap-3 text-[15px]">
                          {point.good ? (
                            <Check className={`mt-0.5 size-5 shrink-0 ${ours ? 'text-mint' : 'text-held'}`} />
                          ) : (
                            <Cross className="mt-0.5 size-5 shrink-0 text-muted" />
                          )}
                          <span className={ours || point.good ? '' : 'text-muted'}>{point.text}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ============================================================ stack */}
        <section className={`${wrap} py-24 lg:py-28`}>
          <div className="grid gap-10 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-6">
              <Eyebrow>{t.stack.label}</Eyebrow>
              <Title text={t.stack.title} />
            </div>
            <p className="text-[17px] leading-relaxed text-muted lg:col-span-5 lg:col-start-8">{t.stack.body}</p>
          </div>
          <div className="mt-14 grid gap-4 md:grid-cols-3">
            {t.stack.items.map((item) => (
              <div key={item.name} className="rounded-3xl p-7 ring-1 ring-rule">
                <p className="text-[13px] font-medium text-held">{item.role}</p>
                <p className="mt-2 font-serif text-[1.35rem]">{item.name}</p>
                <p className="mt-2 text-[15px] leading-relaxed text-muted">{item.body}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-[14px] text-muted">
            <Link href={href(locale, '/rules')} className={`inline-flex items-center gap-1.5 font-medium text-held hover:text-deep ${focus}`}>
              {t.stack.rulesLink}
              <Arrow className="size-4" />
            </Link>
            <span>
              {t.stack.contract}:{' '}
              <a
                className={`font-mono text-held underline decoration-rule underline-offset-4 hover:decoration-teal ${focus}`}
                href={`https://stellar.expert/explorer/testnet/contract/${POLICY_CONTRACT}`}
                target="_blank"
                rel="noreferrer"
              >
                {POLICY_CONTRACT.slice(0, 6)}…{POLICY_CONTRACT.slice(-4)}
              </a>
            </span>
            <a href={REPO_URL} target="_blank" rel="noreferrer" className={`text-held underline decoration-rule underline-offset-4 hover:decoration-teal ${focus}`}>
              {t.stack.source}
            </a>
          </div>
        </section>

        {/* ============================================================ faq */}
        <section id="faq" className="scroll-mt-4 border-t border-rule">
          <div className={`${wrap} grid gap-10 py-24 lg:grid-cols-12 lg:py-28`}>
            <div className="lg:col-span-4">
              <Eyebrow>{t.faq.label}</Eyebrow>
              <Title text={t.faq.title} />
            </div>
            <div className="divide-y divide-rule border-y border-rule lg:col-span-7 lg:col-start-6">
              {t.faq.items.map((item) => (
                <details key={item.q} className="group py-1">
                  <summary
                    className={`flex cursor-pointer list-none items-center justify-between gap-6 rounded-lg py-5 text-[17px] font-medium [&::-webkit-details-marker]:hidden ${focus}`}
                  >
                    {item.q}
                    <span
                      aria-hidden
                      className="grid size-8 shrink-0 place-items-center rounded-full bg-mist text-lg text-deep transition-transform duration-200 group-open:rotate-45"
                    >
                      +
                    </span>
                  </summary>
                  <p className="max-w-[60ch] pb-6 text-[15px] leading-relaxed text-muted">{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================================ cta */}
        <section className={`${wrap} pb-24 lg:pb-28`}>
          <div className="relative overflow-hidden rounded-[36px] bg-linear-to-br from-teal via-[#036c80] to-deep px-8 py-16 text-paper sm:px-14 lg:py-20">
            <PactaMark className="pointer-events-none absolute -right-10 -bottom-16 h-[22rem] w-auto opacity-25 sm:h-[26rem]" />
            <div className="relative max-w-xl">
              <h2 className="font-serif text-[2.4rem] leading-[1.08] tracking-[-0.02em] sm:text-[3rem]">{t.cta.title}</h2>
              <p className="mt-5 text-[17px] leading-relaxed text-sky">{t.cta.body}</p>
              <div className="mt-9 flex flex-wrap gap-3">
                <Link
                  href={href(locale, '/pilot')}
                  className={`inline-flex h-12 items-center gap-2 rounded-full bg-paper px-6 text-[15px] font-medium text-deep transition-colors duration-150 hover:bg-foam ${focus}`}
                >
                  {t.nav.join}
                  <Arrow className="size-4" />
                </Link>
                <WhatsAppLink
                  locale={locale}
                  className={`inline-flex h-12 items-center gap-2 rounded-full px-6 text-[15px] font-medium text-paper ring-1 ring-paper/40 transition-colors duration-150 hover:bg-paper/10 ${focus}`}
                />
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter locale={locale} />
      <WhatsAppFloat locale={locale} />
    </div>
  );
}

function Points({ items }: { items: string[] }) {
  return (
    <ul className="mt-8 space-y-4">
      {items.map((item) => (
        <li key={item} className="flex gap-3 text-[15px]">
          <Check className="mt-0.5 size-5 shrink-0 text-held" />
          {item}
        </li>
      ))}
    </ul>
  );
}

function Share({ label, bps, amount, tone, locale }: { label: string; bps: number; amount: string; tone: string; locale: Locale }) {
  const pct = locale === 'tr' ? `%${bps / 100}` : `${bps / 100}%`;
  return (
    <div>
      <div className="flex items-baseline justify-between text-[15px]">
        <span>{label}</span>
        <span className="tabular-nums">
          {amount} <span className="text-muted">· {pct}</span>
        </span>
      </div>
      <div className="mt-2 h-2.5 rounded-full bg-mist">
        <div className={`h-full rounded-full ${tone}`} style={{ width: `${bps / 100}%` }} />
      </div>
    </div>
  );
}
