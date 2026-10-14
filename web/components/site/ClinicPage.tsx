import Image from 'next/image';
import Link from 'next/link';
import { BookingForm } from '@/components/site/BookingForm';
import { SiteFooter } from '@/components/site/Footer';
import { SiteHeader } from '@/components/site/Header';
import { Check, focus, Sweep, wrap } from '@/components/site/ui';
import { WhatsAppFloat } from '@/components/site/WhatsApp';
import { fullDate } from '@/content/format';
import { copy, href, type Locale } from '@/content/site';
import type { CatalogClinic } from '@/lib/clinics';

export function ClinicPage({ locale, clinic }: { locale: Locale; clinic: CatalogClinic }) {
  const t = copy[locale];
  const c = t.clinicsPage;
  const plan = c.schedules[clinic.schedule];

  return (
    <div lang={locale} className="min-h-dvh">
      <div className="relative overflow-hidden bg-aura">
        <Sweep />
        <SiteHeader locale={locale} path={`/clinics/${clinic.slug}`} />
        <header className={`${wrap} relative pt-6 pb-12 lg:pt-10`}>
          <Link href={href(locale, '/clinics')} className={`inline-flex items-center gap-1.5 rounded text-[14px] text-muted hover:text-ink ${focus}`}>
            <span aria-hidden>←</span> {t.booking.back}
          </Link>
          <div className="mt-6">
            <div className="max-w-3xl">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="font-serif text-[2.4rem] leading-tight tracking-[-0.02em]">{clinic.name}</h1>
                <span className="rounded-full bg-foam/70 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-held uppercase">{c.demo}</span>
              </div>
              <p className="mt-1 text-[15px] text-muted">
                {clinic.district}, {clinic.city}
              </p>
              <p className="mt-4 text-[17px] leading-relaxed text-muted">{clinic.about[locale]}</p>
              <ul className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-[13px] text-muted">
                <li className="flex items-center gap-1.5">
                  <Check className="size-4 text-held" />
                  {c.licence}: {clinic.licenseNo} · {fullDate(locale, new Date(clinic.verifiedAt * 1000))}
                </li>
                <li>
                  {c.refund}: <span className="text-ink">{plan.name}</span> · {plan.note}
                </li>
                <li>
                  {c.speaks}: <span className="text-ink">{clinic.languages.join(', ')}</span>
                </li>
              </ul>
            </div>
          </div>
          <Gallery locale={locale} clinic={clinic} />
        </header>
      </div>

      <main className={`${wrap} py-12 lg:py-16`}>
        <BookingForm locale={locale} clinic={clinic} />
      </main>

      <SiteFooter locale={locale} />
      <WhatsAppFloat locale={locale} />
    </div>
  );
}

/** Kapak solda büyük, diğerleri sağda üst üste; altında fotoğrafçı atıfları. */
function Gallery({ locale, clinic }: { locale: Locale; clinic: CatalogClinic }) {
  const c = copy[locale].clinicsPage;
  const { cover, gallery } = clinic.photos;
  const all = [cover, ...gallery];
  const credits = [...new Map(all.map((p) => [p.credit, p])).values()];

  return (
    <figure className="mt-10">
      <div className="grid gap-3 md:h-[26rem] md:grid-cols-3">
        <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-mist md:col-span-2 md:aspect-auto">
          <Image src={cover.src} alt={cover.alt[locale]} fill priority sizes="(min-width: 768px) 66vw, 100vw" className="object-cover" />
        </div>
        {gallery.length > 0 && (
          <div
            className="grid grid-cols-2 gap-3 md:grid-cols-1 md:[grid-template-rows:repeat(var(--rows),minmax(0,1fr))]"
            style={{ '--rows': gallery.length } as React.CSSProperties}
          >
            {gallery.map((photo) => (
              <div key={photo.id} className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-mist md:aspect-auto">
                <Image src={photo.src} alt={photo.alt[locale]} fill sizes="(min-width: 768px) 33vw, 50vw" className="object-cover" />
              </div>
            ))}
          </div>
        )}
      </div>
      <figcaption className="mt-3 text-[12px] leading-relaxed text-muted">
        {c.photos}:{' '}
        {credits.map((p, i) => (
          <span key={p.id}>
            {i > 0 && ', '}
            <a
              href={`https://unsplash.com/photos/${p.id}?utm_source=pacta&utm_medium=referral`}
              target="_blank"
              rel="noreferrer"
              className={`underline decoration-rule underline-offset-2 hover:text-ink ${focus}`}
            >
              {p.credit}
            </a>
          </span>
        ))}{' '}
        / Unsplash · {c.photoNote}
      </figcaption>
    </figure>
  );
}
