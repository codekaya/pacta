import type { Metadata } from 'next';
import { PilotPage } from '@/components/site/PilotPage';
import { copy } from '@/content/site';

export const metadata: Metadata = {
  title: copy.en.pilot.meta.title,
  description: copy.en.pilot.meta.description,
  alternates: { languages: { en: '/pilot', tr: '/tr/pilot' } },
};

export default function Page() {
  return <PilotPage locale="en" />;
}
