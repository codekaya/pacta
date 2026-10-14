import type { Metadata } from 'next';
import { RulesPage } from '@/components/site/RulesPage';
import { copy } from '@/content/site';

export const metadata: Metadata = {
  title: copy.tr.rules.meta.title,
  description: copy.tr.rules.meta.description,
  alternates: { languages: { en: '/rules', tr: '/tr/rules' } },
};

export default function Page() {
  return <RulesPage locale="tr" />;
}
