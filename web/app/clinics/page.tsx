import type { Metadata } from 'next';
import { ClinicsPage } from '@/components/site/ClinicsPage';
import { copy } from '@/content/site';

export const metadata: Metadata = {
  title: copy.en.clinicsPage.meta.title,
  description: copy.en.clinicsPage.meta.description,
  alternates: { languages: { en: '/clinics', tr: '/tr/clinics' } },
};

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function Page({ searchParams }: Props) {
  const t = (await searchParams).t;
  return <ClinicsPage locale="en" treatment={typeof t === 'string' ? t : undefined} />;
}
