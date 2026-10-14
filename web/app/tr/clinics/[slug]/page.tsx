import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ClinicPage } from '@/components/site/ClinicPage';
import { copy } from '@/content/site';
import { CATALOG, catalogClinic } from '@/lib/clinics';

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return CATALOG.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const clinic = catalogClinic((await params).slug);
  if (!clinic) return {};
  return {
    title: `${clinic.name} — ${copy.tr.clinicsPage.meta.title}`,
    description: clinic.about.tr,
    alternates: { languages: { en: `/clinics/${clinic.slug}`, tr: `/tr/clinics/${clinic.slug}` } },
  };
}

export default async function Page({ params }: Props) {
  const clinic = catalogClinic((await params).slug);
  if (!clinic) notFound();
  return <ClinicPage locale="tr" clinic={clinic} />;
}
