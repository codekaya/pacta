'use server';

import { randomBytes } from 'node:crypto';
import { savePilotApplication, type PilotApplication } from './pilot-store';

/** Pilot başvuru formunun sunucu eylemi. Depo: ./pilot-store.ts */

export type PilotState =
  | undefined
  | { ok: true; name: string }
  | { ok: false; errors: Partial<Record<keyof PilotApplication | 'consent' | 'form', 'required' | 'chooseOne' | 'invalidPhone' | 'invalidEmail' | 'failed'>> };

const ROLES = ['clinic', 'agency', 'other'];
const TREATMENTS = ['hair', 'dental', 'aesthetic', 'ivf', 'other'];
const METHODS = ['transfer', 'wu', 'card', 'cash', 'other'];

const text = (form: FormData, key: string, max = 200): string => String(form.get(key) ?? '').trim().slice(0, max);
const pick = (form: FormData, key: string, allowed: string[]): string[] =>
  form.getAll(key).map(String).filter((v) => allowed.includes(v));

export async function submitPilot(_prev: PilotState, form: FormData): Promise<PilotState> {
  // Botlar için gizli alan: dolu gelirse sessizce kabul edilmiş gibi davran.
  if (text(form, 'company_site')) return { ok: true, name: text(form, 'name', 60) || '—' };

  const app: PilotApplication = {
    id: randomBytes(9).toString('base64url'),
    at: Math.floor(Date.now() / 1000),
    locale: text(form, 'locale') === 'tr' ? 'tr' : 'en',
    role: pick(form, 'role', ROLES)[0] ?? '',
    org: text(form, 'org'),
    city: text(form, 'city'),
    treatments: pick(form, 'treatments', TREATMENTS),
    web: text(form, 'web') || undefined,
    clinics: text(form, 'clinics', 10) || undefined,
    method: pick(form, 'method', METHODS),
    share: text(form, 'share', 10) || undefined,
    volume: text(form, 'volume', 10) || undefined,
    refund: text(form, 'refund', 10) || undefined,
    chargeback: text(form, 'chargeback', 10) || undefined,
    lost: text(form, 'lost', 10) || undefined,
    name: text(form, 'name', 120),
    title: text(form, 'title', 120) || undefined,
    whatsapp: text(form, 'whatsapp', 40),
    email: text(form, 'email', 160) || undefined,
    lang: text(form, 'lang', 10) || undefined,
  };

  const errors: Extract<PilotState, { ok: false }>['errors'] = {};
  if (!app.role) errors.role = 'required';
  if (!app.org) errors.org = 'required';
  if (!app.city) errors.city = 'required';
  if (app.treatments.length === 0) errors.treatments = 'chooseOne';
  if (app.method.length === 0) errors.method = 'chooseOne';
  if (!app.name) errors.name = 'required';
  if (!/^\+?[\d\s()-]{8,}$/.test(app.whatsapp) || app.whatsapp.replace(/\D/g, '').length < 8) errors.whatsapp = 'invalidPhone';
  if (app.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(app.email)) errors.email = 'invalidEmail';
  if (form.get('consent') !== 'yes') errors.consent = 'required';
  if (Object.keys(errors).length > 0) return { ok: false, errors };

  try {
    await savePilotApplication(app);
  } catch {
    return { ok: false, errors: { form: 'failed' } };
  }
  return { ok: true, name: app.name.split(' ')[0] ?? app.name };
}
