import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Wordmark } from '@/components/Frame';
import { listPilotApplications } from '@/lib/pilot-store';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Pilot inbox — Pacta', robots: { index: false, follow: false } };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

/**
 * Pilot başvuruları. PILOT_INBOX_KEY tanımlı değilse ya da ?key= eşleşmezse sayfa yok sayılır;
 * başvurular telefon numarası içerdiği için anahtarsız açılmaz.
 */
export default async function PilotInbox({ searchParams }: Props) {
  const expected = process.env.PILOT_INBOX_KEY;
  const given = (await searchParams).key;
  if (!expected || given !== expected) notFound();

  const apps = await listPilotApplications();
  const date = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

  return (
    <main className="mx-auto max-w-6xl px-6 py-8 md:px-8">
      <div className="flex items-center justify-between gap-6">
        <Wordmark />
        <p className="text-[13px] text-muted">{apps.length} applications</p>
      </div>
      <h1 className="mt-10 font-serif text-3xl">Pilot inbox</h1>
      {apps.length === 0 ? (
        <p className="mt-6 text-muted">No applications yet.</p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-3xl ring-1 ring-rule">
          <table className="w-full min-w-[64rem] text-left text-[14px]">
            <thead className="bg-canvas text-[12px] text-muted">
              <tr>
                {['When', 'Who', 'Organisation', 'Treatments', 'Deposits today', 'Contact'].map((h) => (
                  <th key={h} className="px-4 py-3 font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-rule align-top">
              {apps.map((a) => (
                <tr key={a.id}>
                  <td className="px-4 py-3 whitespace-nowrap text-muted">
                    {date.format(new Date(a.at * 1000))}
                    <span className="block text-[12px] uppercase">{a.locale}</span>
                  </td>
                  <td className="px-4 py-3">
                    {a.name}
                    {a.title && <span className="block text-muted">{a.title}</span>}
                    <span className="block text-[12px] text-held">{a.role}{a.clinics ? ` · ${a.clinics} clinics` : ''}</span>
                  </td>
                  <td className="px-4 py-3">
                    {a.org}
                    <span className="block text-muted">{a.city}</span>
                    {a.web && <span className="block text-[12px] text-muted">{a.web}</span>}
                  </td>
                  <td className="px-4 py-3">{a.treatments.join(', ')}</td>
                  <td className="px-4 py-3 text-[13px] text-muted">
                    <span className="block text-ink">{a.method.join(', ')}</span>
                    deposit {a.share ?? '—'} · {a.volume ?? '—'}/mo
                    <span className="block">refund {a.refund ?? '—'} · chargebacks {a.chargeback ?? '—'} · lost {a.lost ?? '—'}</span>
                  </td>
                  <td className="px-4 py-3">
                    <a className="text-held underline decoration-rule underline-offset-4" href={`https://wa.me/${a.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer">
                      {a.whatsapp}
                    </a>
                    {a.email && <span className="block text-muted">{a.email}</span>}
                    {a.lang && <span className="block text-[12px] text-muted">{a.lang}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
