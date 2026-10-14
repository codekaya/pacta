import { copy, type Locale } from '@/content/site';

export function eur(locale: Locale, cents: number): string {
  return new Intl.NumberFormat(copy[locale].intl, {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}

export function dayMonth(locale: Locale, at: Date): string {
  return new Intl.DateTimeFormat(copy[locale].intl, { day: 'numeric', month: 'short' }).format(at);
}

export function fullDate(locale: Locale, at: Date): string {
  return new Intl.DateTimeFormat(copy[locale].intl, { day: 'numeric', month: 'short', year: 'numeric' }).format(at);
}
