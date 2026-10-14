import type { Metadata } from 'next';
import { HomePage } from '@/components/site/HomePage';
import { copy } from '@/content/site';

// Örnek kartların tarihleri bugünden sayılır; önceden çizilmiş bir kopya eskir.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: copy.tr.meta.title,
  description: copy.tr.meta.description,
  alternates: { languages: { en: '/', tr: '/tr' } },
};

export default function Page() {
  return <HomePage locale="tr" />;
}
