import { SiteFooter } from '@/components/site/Footer';
import { SiteHeader } from '@/components/site/Header';
import { PilotForm } from '@/components/site/PilotForm';
import { Check, Eyebrow, secondary, Sweep, Title, wrap } from '@/components/site/ui';
import { WhatsAppFloat, WhatsAppLink } from '@/components/site/WhatsApp';
import { copy, type Locale } from '@/content/site';

export function PilotPage({ locale }: { locale: Locale }) {
  const t = copy[locale];
  return (
    <div lang={locale} className="min-h-dvh">
      <div className="relative overflow-hidden bg-aura">
        <Sweep />
        <SiteHeader locale={locale} path="/pilot" />
        <section className={`${wrap} relative grid gap-12 pt-8 pb-24 lg:grid-cols-12 lg:gap-10 lg:pt-14`}>
          <div className="lg:col-span-4">
            <Eyebrow>{t.nav.join}</Eyebrow>
            <Title as="h1" text={t.pilot.title} />
            <p className="mt-5 text-[17px] leading-relaxed text-muted">{t.pilot.body}</p>
            <div className="mt-8 rounded-3xl bg-paper/80 p-6 ring-1 ring-rule backdrop-blur">
              <p className="text-[13px] font-medium text-muted">{t.pilot.boxTitle}</p>
              <ul className="mt-4 space-y-3">
                {t.pilot.box.map((item) => (
                  <li key={item} className="flex gap-3 text-[15px]">
                    <Check className="mt-0.5 size-5 shrink-0 text-held" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <WhatsAppLink locale={locale} className={`${secondary} mt-6`} />
          </div>
          <div className="lg:col-span-7 lg:col-start-6">
            <PilotForm locale={locale} />
          </div>
        </section>
      </div>
      <SiteFooter locale={locale} />
      <WhatsAppFloat locale={locale} />
    </div>
  );
}
