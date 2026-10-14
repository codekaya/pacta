import { copy, whatsappHref, type Locale } from '@/content/site';
import { focus } from '@/components/site/ui';

function Glyph({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className}>
      <path
        d="M12 3a9 9 0 0 0-7.8 13.5L3 21l4.6-1.2A9 9 0 1 0 12 3Z"
        fill="none"
        className="stroke-current"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M9 8.2c.2-.4.5-.4.8-.4h.4c.2 0 .4.1.5.4l.6 1.5c.1.2 0 .5-.1.6l-.5.6c.4.9 1.2 1.7 2.2 2.2l.6-.5c.2-.2.4-.2.6-.1l1.5.6c.3.1.4.3.4.5v.4c0 .3-.1.6-.4.8-.6.4-1.4.5-2.1.3-2.2-.7-3.9-2.4-4.6-4.6-.2-.7-.1-1.5.1-2.3Z"
        className="fill-current"
      />
    </svg>
  );
}

/**
 * WhatsApp is the only contact channel. Until NEXT_PUBLIC_PACTA_WHATSAPP is set
 * the buttons render as a visible placeholder in development and not at all in
 * production, so no visitor is ever sent to a wrong number.
 */
export function WhatsAppLink({ locale, className }: { locale: Locale; className: string }) {
  const t = copy[locale].whatsapp;
  const link = whatsappHref(locale);
  if (link) {
    return (
      <a href={link} target="_blank" rel="noreferrer" className={className}>
        <Glyph className="size-5" />
        {t.label}
      </a>
    );
  }
  if (process.env.NODE_ENV === 'production') return null;
  return (
    <span title={t.missing} className={`${className} cursor-not-allowed border border-dashed border-alert/50 opacity-70`}>
      <Glyph className="size-5" />
      {t.label}
    </span>
  );
}

export function WhatsAppFloat({ locale }: { locale: Locale }) {
  const t = copy[locale].whatsapp;
  const link = whatsappHref(locale);
  const skin = `fixed right-5 bottom-5 z-40 inline-flex size-14 items-center justify-center rounded-full bg-deep text-paper shadow-[0_16px_40px_-12px_rgb(0_69_91_/_0.75)] transition-colors duration-150 hover:bg-ink sm:right-8 sm:bottom-8 ${focus}`;
  if (link) {
    return (
      <a href={link} target="_blank" rel="noreferrer" aria-label={t.label} className={skin}>
        <Glyph className="size-7" />
      </a>
    );
  }
  if (process.env.NODE_ENV === 'production') return null;
  return (
    <span title={t.missing} aria-label={t.missing} className={`${skin} cursor-not-allowed ring-2 ring-alert/60 ring-offset-2`}>
      <Glyph className="size-7" />
    </span>
  );
}
