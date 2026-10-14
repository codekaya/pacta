import type { Metadata } from 'next';
import { PilotPage } from '@/components/site/PilotPage';
import { copy } from '@/content/site';

export const metadata: Metadata = {
  title: copy.tr.pilot.meta.title,
  description: copy.tr.pilot.meta.description,
  alternates: { languages: { en: '/pilot', tr: '/tr/pilot' } },
};

export default function Page() {
  return <PilotPage locale="tr" />;
}
