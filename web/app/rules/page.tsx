import type { Metadata } from 'next';
import { RulesPage } from '@/components/site/RulesPage';
import { copy } from '@/content/site';

export const metadata: Metadata = {
  title: copy.en.rules.meta.title,
  description: copy.en.rules.meta.description,
  alternates: { languages: { en: '/rules', tr: '/tr/rules' } },
};

export default function Page() {
  return <RulesPage locale="en" />;
}
