import { SiteFooter } from '@/components/site/Footer';
import { SiteHeader } from '@/components/site/Header';
import { Eyebrow, focus, Sweep, Title, wrap } from '@/components/site/ui';
import { WhatsAppFloat } from '@/components/site/WhatsApp';
import { copy, type Locale } from '@/content/site';

export function RulesPage({ locale }: { locale: Locale }) {
  const t = copy[locale].rules;
  const toc = [...t.sections.map((s) => [s.id, s.title] as const), ['glossary', t.glossaryTitle] as const];

  return (
    <div lang={locale} className="min-h-dvh">
      <div className="relative overflow-hidden bg-aura">
        <Sweep />
        <SiteHeader locale={locale} path="/rules" />
        <header className={`${wrap} relative pt-8 pb-16 lg:pt-14 lg:pb-20`}>
          <div className="max-w-2xl">
            <Eyebrow>{t.label}</Eyebrow>
            <Title as="h1" text={t.title} />
            <p className="mt-6 rounded-2xl bg-paper/80 p-5 text-[15px] leading-relaxed text-muted ring-1 ring-rule backdrop-blur">
              {t.note}
            </p>
          </div>
        </header>
      </div>

      <main className={`${wrap} grid gap-12 py-16 lg:grid-cols-12 lg:gap-10 lg:py-20`}>
        <nav aria-label={t.onThisPage} className="lg:col-span-3">
          <div className="lg:sticky lg:top-8">
            <p className="text-[13px] font-medium text-muted">{t.onThisPage}</p>
            <ol className="mt-4 space-y-1 border-l border-rule text-[14px]">
              {toc.map(([id, title]) => (
                <li key={id}>
                  <a href={`#${id}`} className={`-ml-px block border-l-2 border-transparent py-1.5 pl-4 text-muted hover:border-teal hover:text-ink ${focus}`}>
                    {title}
                  </a>
                </li>
              ))}
            </ol>
          </div>
        </nav>

        <div className="space-y-4 lg:col-span-8 lg:col-start-5">
          {t.sections.map((section, i) => (
            <section key={section.id} id={section.id} aria-labelledby={`${section.id}-title`} className="scroll-mt-6 rounded-3xl p-7 ring-1 ring-rule sm:p-8">
              <div className="flex flex-wrap items-center gap-3">
                <span className="grid size-8 place-items-center rounded-full bg-mist font-serif text-[15px] text-deep">{i + 1}</span>
                <h2 id={`${section.id}-title`} className="font-serif text-[1.5rem] leading-tight">
                  {section.title}
                </h2>
                {section.proposed && (
                  <span className="rounded-full bg-foam/60 px-2.5 py-0.5 text-[12px] font-medium text-held">{t.proposed}</span>
                )}
              </div>
              {section.body && <p className="mt-4 text-[16px] leading-relaxed text-muted">{section.body}</p>}
              {section.items && (
                <dl className="mt-5 divide-y divide-rule">
                  {section.items.map(([term, text]) => (
                    <div key={term} className="grid gap-1 py-3 sm:grid-cols-[11rem_1fr] sm:gap-4">
                      <dt className="text-[15px] font-medium">{term}</dt>
                      <dd className="text-[15px] leading-relaxed text-muted">{text}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </section>
          ))}

          <section id="glossary" aria-labelledby="glossary-title" className="scroll-mt-6 rounded-3xl bg-canvas p-7 ring-1 ring-rule/70 sm:p-8">
            <h2 id="glossary-title" className="font-serif text-[1.75rem] leading-tight">
              {t.glossaryTitle}
            </h2>
            <dl className="mt-6 grid gap-x-8 gap-y-5 sm:grid-cols-2">
              {t.glossary.map(([term, text]) => (
                <div key={term}>
                  <dt className="text-[15px] font-medium">{term}</dt>
                  <dd className="mt-1 text-[14px] leading-relaxed text-muted">{text}</dd>
                </div>
              ))}
            </dl>
          </section>
        </div>
      </main>

      <SiteFooter locale={locale} />
      <WhatsAppFloat locale={locale} />
    </div>
  );
}
