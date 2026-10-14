import { kvSet, kvValues } from './kv';

/**
 * Pilot başvuruları deposu. Formun 2. adımı saha planındaki standart sorular — her
 * başvuru aynı zamanda karşılaştırılabilir bir araştırma kaydı.
 * Anahtar başına bir kayıt: liste okuyup yazmak eşzamanlı başvurularda kayıp verir.
 *
 * Bilerek 'use server' değil: buradaki okuma fonksiyonu bir sunucu eylemi olursa
 * başvuru listesi istemciden çağrılabilir hale gelir.
 */

export type PilotApplication = {
  id: string;
  at: number;
  locale: 'en' | 'tr';
  role: string;
  org: string;
  city: string;
  treatments: string[];
  web?: string;
  clinics?: string;
  method: string[];
  share?: string;
  volume?: string;
  refund?: string;
  chargeback?: string;
  lost?: string;
  name: string;
  title?: string;
  whatsapp: string;
  email?: string;
  lang?: string;
};

const PREFIX = 'pacta:pilot:app:';

export async function savePilotApplication(app: PilotApplication): Promise<void> {
  await kvSet(`${PREFIX}${app.id}`, app);
}

export async function listPilotApplications(): Promise<PilotApplication[]> {
  return (await kvValues<PilotApplication>(PREFIX)).sort((a, b) => b.at - a.at);
}
