import Link from 'next/link';
import { Logo } from '@/components/Logo';
import { MobileMenu } from '@/components/site/MobileMenu';
import { focus, primary, wrap } from '@/components/site/ui';
import { copy, href, type Locale, type SitePath } from '@/content/site';

export function SiteHeader({ locale, path }: { locale: Locale; path: SitePath }) {
  const t = copy[locale].nav;
  const links: [string, string][] = [
    [href(locale, '', '#how'), t.how],
    [href(locale, '/clinics'), t.findClinic],
    [href(locale, '', '#clinics'), t.clinics],
    [href(locale, '', '#agencies'), t.agencies],
    [href(locale, '', '#pricing'), t.pricing],
    [href(locale, '/rules'), t.rules],
  ];

  return (
    <header className={`${wrap} relative z-30 flex h-20 items-center justify-between gap-6`}>
      <Link href={href(locale)} aria-label={t.home} className={`rounded-md ${focus}`}>
        <Logo />
      </Link>
      <nav aria-label={t.menu} className="hidden items-center gap-7 text-[15px] text-muted lg:flex">
        {links.map(([to, label]) => (
          <Link key={to} href={to} className={`rounded transition-colors duration-150 hover:text-ink ${focus}`}>
            {label}
          </Link>
        ))}
      </nav>
      <div className="flex items-center gap-2 sm:gap-3">
        <LangSwitch locale={locale} path={path} />
        <Link href={href(locale, '/pilot')} className={`${primary} h-10 px-5 text-sm max-sm:hidden`}>
          {t.join}
        </Link>
        <MobileMenu label={t.menu} links={[...links, [href(locale, '/pilot'), t.join]]} />
      </div>
    </header>
  );
}

function LangSwitch({ locale, path }: { locale: Locale; path: SitePath }) {
  const options: [Locale, string][] = [
    ['en', 'EN'],
    ['tr', 'TR'],
  ];
  return (
    <div className="flex rounded-full bg-paper/70 p-0.5 text-[13px] font-medium ring-1 ring-rule backdrop-blur">
      {options.map(([code, label]) => (
        <Link
          key={code}
          href={href(code, path)}
          hrefLang={code}
          aria-current={code === locale ? 'true' : undefined}
          className={`rounded-full px-2.5 py-1 transition-colors duration-150 ${focus} ${
            code === locale ? 'bg-deep text-paper' : 'text-muted hover:text-ink'
          }`}
        >
          {label}
        </Link>
      ))}
    </div>
  );
}
