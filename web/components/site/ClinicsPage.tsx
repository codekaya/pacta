import Image from 'next/image';
import Link from 'next/link';
import { SiteFooter } from '@/components/site/Footer';
import { SiteHeader } from '@/components/site/Header';
import { Arrow, Check, Eyebrow, focus, Sweep, Title, wrap } from '@/components/site/ui';
import { WhatsAppFloat } from '@/components/site/WhatsApp';
import { eur } from '@/content/format';
import { copy, href, type Locale } from '@/content/site';
import { CATALOG, startingPrice, type Treatment } from '@/lib/clinics';

const TREATMENTS: Treatment[] = ['hair', 'dental', 'aesthetic'];

export function ClinicsPage({ locale, treatment }: { locale: Locale; treatment?: string }) {
  const t = copy[locale].clinicsPage;
  const active = TREATMENTS.find((x) => x === treatment);
  const clinics = active ? CATALOG.filter((c) => c.treatments.includes(active)) : CATALOG;
  const base = href(locale, '/clinics');
  const pct = (n: number) => (locale === 'tr' ? `%${n}` : `${n}%`);

  return (
    <div lang={locale} className="min-h-dvh">
      <div className="relative overflow-hidden bg-aura">
        <Sweep />
        <SiteHeader locale={locale} path="/clinics" />
        <header className={`${wrap} relative pt-8 pb-14 lg:pt-14`}>
          <div className="max-w-2xl">
            <Eyebrow>{t.label}</Eyebrow>
            <Title as="h1" text={t.title} />
            <p className="mt-5 text-[17px] leading-relaxed text-muted">{t.body}</p>
            <p className="mt-6 inline-flex items-start gap-2.5 rounded-2xl bg-paper/80 px-4 py-3 text-[14px] text-muted ring-1 ring-rule backdrop-blur">
              <span className="mt-0.5 rounded-full bg-foam/70 px-2 py-0.5 text-[11px] font-semibold tracking-wide text-held uppercase">{t.demo}</span>
              {t.demoNote}
            </p>
          </div>

          <nav aria-label={t.all} className="mt-10 flex flex-wrap gap-2">
            {[undefined, ...TREATMENTS].map((x) => {
              const on = x === active;
              return (
                <Link
                  key={x ?? 'all'}
                  href={x ? `${base}?t=${x}` : base}
                  aria-current={on ? 'page' : undefined}
                  scroll={false}
                  className={`rounded-full px-4 py-2.5 text-[14px] font-medium ring-1 transition-colors duration-150 ${focus} ${
                    on ? 'bg-deep text-paper ring-deep' : 'bg-paper/80 text-ink ring-rule hover:ring-teal/50'
                  }`}
                >
                  {x ? t.treatments[x] : t.all}
                </Link>
              );
            })}
          </nav>
        </header>
      </div>

      <main className={`${wrap} pt-12 pb-24`}>
        {clinics.length === 0 ? (
          <p className="text-muted">{t.empty}</p>
        ) : (
          <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {clinics.map((clinic) => {
              const plan = t.schedules[clinic.schedule];
              return (
                <li key={clinic.id}>
                  <Link
                    href={`${base}/${clinic.slug}`}
                    className={`group flex h-full flex-col overflow-hidden rounded-[28px] bg-paper ring-1 ring-rule transition-shadow duration-200 hover:shadow-[0_30px_70px_-30px_rgb(0_69_91_/_0.45)] hover:ring-teal/40 ${focus}`}
                  >
                    <div className="relative aspect-[4/3] overflow-hidden bg-mist">
                      <Image
                        src={clinic.photos.cover.src}
                        alt={clinic.photos.cover.alt[locale]}
                        fill
                        sizes="(min-width: 1024px) 360px, (min-width: 768px) 50vw, 100vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      />
                      <span className="absolute top-4 left-4 rounded-full bg-paper/90 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-held uppercase backdrop-blur">
                        {t.demo}
                      </span>
                      {clinic.photos.gallery.length > 0 && (
                        <span className="absolute right-4 bottom-4 rounded-full bg-ink/60 px-2.5 py-1 text-[11px] text-paper backdrop-blur">
                          {t.morePhotos(clinic.photos.gallery.length)}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col p-6">
                      <p className="font-serif text-[1.45rem] leading-tight">{clinic.name}</p>
                      <p className="mt-1 text-[14px] text-muted">
                        {clinic.district}, {clinic.city}
                      </p>
                      <div className="mt-4 flex flex-wrap gap-1.5">
                        {clinic.treatments.map((x) => (
                          <span key={x} className="rounded-full bg-mist px-2.5 py-1 text-[12px] text-deep">
                            {t.treatments[x]}
                          </span>
                        ))}
                      </div>

                      <dl className="mt-6 space-y-2.5 border-t border-rule pt-5 text-[14px]">
                        <div className="flex justify-between gap-4">
                          <dt className="text-muted">{t.from}</dt>
                          <dd className="font-serif text-lg leading-none">{eur(locale, startingPrice(clinic))}</dd>
                        </div>
                        <div className="flex justify-between gap-4">
                          <dt className="text-muted">{t.deposit}</dt>
                          <dd>{clinic.depositRates.map(pct).join(' · ')}</dd>
                        </div>
                        <div className="flex justify-between gap-4">
                          <dt className="text-muted">{t.refund}</dt>
                          <dd className="text-right">
                            {plan.name}
                            <span className="block text-[12px] text-muted">{plan.note}</span>
                          </dd>
                        </div>
                      </dl>

                      <div className="mt-auto flex items-center justify-between gap-4 pt-6">
                        <span className="flex items-center gap-1.5 text-[12px] text-muted">
                          <Check className="size-4 text-held" />
                          {t.licence}
                        </span>
                        <span className="inline-flex items-center gap-1.5 text-[14px] font-medium text-held group-hover:text-deep">
                          {t.view}
                          <Arrow className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                        </span>
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </main>

      <SiteFooter locale={locale} />
      <WhatsAppFloat locale={locale} />
    </div>
  );
}
