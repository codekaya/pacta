import Link from 'next/link';
import { Logo } from '@/components/Logo';
import { focus, wrap } from '@/components/site/ui';
import { copy, DEMO_NOTICE_PATH, href, REPO_URL, type Locale } from '@/content/site';

export function SiteFooter({ locale }: { locale: Locale }) {
  const t = copy[locale];
  const columns: { title: string; links: [string, string][] }[] = [
    {
      title: t.footer.product,
      links: [
        [href(locale, '', '#how'), t.nav.how],
        [href(locale, '', '#clinics'), t.nav.clinics],
        [href(locale, '', '#agencies'), t.nav.agencies],
        [href(locale, '', '#pricing'), t.nav.pricing],
      ],
    },
    {
      title: t.footer.rules,
      links: [
        [href(locale, '/rules'), t.footer.plainRules],
        [href(locale, '/rules', '#glossary'), t.footer.glossary],
        [href(locale, '/pilot'), t.nav.join],
      ],
    },
    {
      title: t.footer.demo,
      links: [
        [href(locale, '/clinics'), t.footer.demoClinics],
        ['/clinic', t.footer.clinicDesk],
        [DEMO_NOTICE_PATH, t.footer.patientNotice],
        [REPO_URL, t.footer.source],
      ],
    },
  ];

  return (
    <footer className="border-t border-rule">
      <div className={`${wrap} grid gap-10 py-14 md:grid-cols-12`}>
        <div className="md:col-span-6">
          <Logo />
          <p className="mt-4 max-w-xs text-[14px] leading-relaxed text-muted">{t.footer.tagline}</p>
        </div>
        {columns.map((column) => (
          <div key={column.title} className="md:col-span-2">
            <p className="text-[13px] font-medium text-ink">{column.title}</p>
            <ul className="mt-4 space-y-2.5 text-[14px] text-muted">
              {column.links.map(([to, label]) => (
                <li key={to}>
                  {to.startsWith('http') ? (
                    <a href={to} target="_blank" rel="noreferrer" className={`rounded hover:text-ink ${focus}`}>
                      {label}
                    </a>
                  ) : (
                    <Link href={to} className={`rounded hover:text-ink ${focus}`}>
                      {label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className={wrap}>
        <p className="border-t border-rule py-6 text-[13px] text-muted">{t.footer.bottom}</p>
      </div>
    </footer>
  );
}
