/** PTK testnet duman testi: commit → deal_of → distribute → settle, TS hesabıyla karşılaştırarak. */
import { readFileSync } from 'node:fs';
import { Keypair } from '@stellar/stellar-sdk';
import { DAY_SECONDS, distribute, entitlement, type Policy } from '../lib/policy.ts';
import { PolicyCommitments } from '../lib/ptk.ts';

process.loadEnvFile(new URL('../.env.local', import.meta.url));
const w = JSON.parse(readFileSync(new URL('../.tw-wallets.json', import.meta.url), 'utf8'));
const key = (n: string) => Keypair.fromSecret(w[n]).publicKey();

const ptk = await PolicyCommitments.connect(process.env.PACTA_POLICY_CONTRACT!, Keypair.fromSecret(w.pactaRelease));
const now = Math.floor(Date.now() / 1000);
const policy: Policy = {
  procedureDate: now + 10 * DAY_SECONDS,
  tiers: [
    { minDaysBefore: 14, refundBps: 10_000 },
    { minDaysBefore: 7, refundBps: 5_000 },
    { minDaysBefore: 0, refundBps: 0 },
  ],
  agencyBps: 1_000,
};
const parties = { patient: key('patient'), clinic: key('clinic'), agency: key('agency') };
const escrow = Keypair.random().publicKey(); // placeholder until a TW escrow exists
const balance = 8_695_652_174n;

const { dealId, hash } = await ptk.commit(escrow, policy, parties);
console.log('commit', dealId, hash);
console.log('deal_of matches', (await ptk.dealOf(escrow)) === dealId);

const at = now + 30; // after commit, before settle
await new Promise((r) => setTimeout(r, 35_000));
const onChain = await ptk.distribute(dealId, 'PatientCancel', at, balance);
const offChain = distribute(balance, entitlement(policy, new Date(at * 1000)), parties);
console.log('distribute parity', JSON.stringify(onChain, (_, v) => (typeof v === 'bigint' ? v.toString() : v)) === JSON.stringify(offChain, (_, v) => (typeof v === 'bigint' ? v.toString() : v)));
const settled = await ptk.settle(dealId, 'PatientCancel', at, balance);
console.log('settle', settled.hash, settled.distributions.map((d) => `${d.address.slice(0, 5)} ${d.amount}`));
