import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Keypair } from '@stellar/stellar-sdk';

/**
 * Testnet demo keys, held server-side.
 *
 * In the product the patient signs with an embedded wallet and the clinic with
 * its own; Pacta holds only the release and resolver keys. For the demo every
 * role is a key in web/.tw-wallets.json (created by `npm run tw -- wallets`),
 * and the page says so.
 */
export type DemoWallets = {
  patient: Keypair;
  clinic: Keypair;
  agency: Keypair;
  pactaRelease: Keypair;
  pactaResolver: Keypair;
};

const NAMES = ['patient', 'clinic', 'agency', 'pactaRelease', 'pactaResolver'] as const;

let cached: DemoWallets | null | undefined;

export function demoWallets(): DemoWallets | null {
  if (cached !== undefined) return cached;
  // On Vercel there is no wallet file: the same JSON lives in PACTA_WALLETS.
  const inline = process.env.PACTA_WALLETS;
  const file = join(process.cwd(), '.tw-wallets.json');
  if (!inline && !existsSync(file)) return (cached = null);
  const stored = JSON.parse(inline ?? readFileSync(file, 'utf8')) as Record<string, string>;
  if (!NAMES.every((n) => stored[n])) return (cached = null);
  cached = Object.fromEntries(NAMES.map((n) => [n, Keypair.fromSecret(stored[n]!)])) as DemoWallets;
  return cached;
}
