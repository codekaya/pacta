/**
 * Trustless Work hattı, komut satırından — web'e bağlamadan önce testnet'te kanıt.
 *
 *   npm run tw -- wallets          beş testnet cüzdanı: üret, XLM fonla, USDC trustline
 *   npm run tw -- arrival 10       deploy → fund → klinik "Arrived" → hasta onay → release
 *   npm run tw -- cancel 10 10     deploy → fund → PTK commit → dispute → PTK settle → resolve  (2. arg: işleme kalan gün)
 *   npm run tw -- show <C...>      escrow durumu + canlı bakiye
 *   npm run tw -- topup            provalar arasında USDC'yi hastaya geri toplar
 *
 * Cüzdanlar web/.tw-wallets.json'da (gitignore'da). Hastaya test USDC'si:
 *   cd ../anchor && CLINIC_SECRET=$(node -p 'require("../web/.tw-wallets.json").patient') npm run onramp -- 1500
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { Asset, BASE_FEE, Horizon, Keypair, Networks, Operation, TransactionBuilder } from '@stellar/stellar-sdk';
import { formatUsdc, parseUsdc } from '../lib/money.ts';
import { DAY_SECONDS, distribute, entitlement, type Parties, type Policy } from '../lib/policy.ts';
import { PolicyCommitments } from '../lib/ptk.ts';
import { TESTNET_USDC, TrustlessWork, TrustlessWorkError, type Roles, type SignXdr } from '../lib/trustless.ts';

const ENV_FILE = new URL('../.env.local', import.meta.url);
const WALLETS_FILE = new URL('../.tw-wallets.json', import.meta.url);
if (existsSync(ENV_FILE)) process.loadEnvFile(ENV_FILE);

const PASSPHRASE = Networks.TESTNET;
const EXPLORER = 'https://stellar.expert/explorer/testnet';
const horizon = new Horizon.Server('https://horizon-testnet.stellar.org');
const USDC = new Asset(TESTNET_USDC.symbol, TESTNET_USDC.address);

const log = (...parts: unknown[]) => console.log(...parts);
const step = (title: string) => console.log(`\n▸ ${title}`);

// ---------------------------------------------------------------- wallets

const WALLET_NAMES = ['patient', 'clinic', 'agency', 'pactaRelease', 'pactaResolver'] as const;
type WalletName = (typeof WALLET_NAMES)[number];
type Wallets = Record<WalletName, Keypair>;

function loadWallets(create: boolean): Wallets {
  const stored: Partial<Record<WalletName, string>> = existsSync(WALLETS_FILE)
    ? JSON.parse(readFileSync(WALLETS_FILE, 'utf8'))
    : {};
  let changed = false;
  for (const name of WALLET_NAMES) {
    if (stored[name]) continue;
    if (!create) throw new Error(`Wallet "${name}" missing — run: npm run tw -- wallets`);
    stored[name] = Keypair.random().secret();
    changed = true;
  }
  if (changed) writeFileSync(WALLETS_FILE, JSON.stringify(stored, null, 2), { mode: 0o600 });
  return Object.fromEntries(WALLET_NAMES.map((n) => [n, Keypair.fromSecret(stored[n]!)])) as Wallets;
}

function signer(keypair: Keypair): SignXdr {
  return async (xdr) => {
    const tx = TransactionBuilder.fromXDR(xdr, PASSPHRASE);
    tx.sign(keypair);
    return tx.toXDR();
  };
}

async function usdcBalance(address: string): Promise<string | null> {
  try {
    const account = await horizon.loadAccount(address);
    const line = account.balances.find(
      (b) => 'asset_code' in b && b.asset_code === USDC.getCode() && b.asset_issuer === USDC.getIssuer(),
    );
    return line ? line.balance : null;
  } catch (err) {
    if ((err as { response?: { status?: number } }).response?.status === 404) return null;
    throw err;
  }
}

async function ensureAccount(keypair: Keypair, trustline: boolean): Promise<void> {
  const address = keypair.publicKey();
  let exists = true;
  try {
    await horizon.loadAccount(address);
  } catch {
    exists = false;
  }
  if (!exists) {
    const res = await fetch(`https://friendbot.stellar.org?addr=${address}`);
    if (!res.ok) throw new Error(`friendbot ${res.status}: ${await res.text()}`);
  }
  if (trustline && (await usdcBalance(address)) === null) {
    const source = await horizon.loadAccount(address);
    const tx = new TransactionBuilder(source, { fee: BASE_FEE, networkPassphrase: PASSPHRASE })
      .addOperation(Operation.changeTrust({ asset: USDC }))
      .setTimeout(60)
      .build();
    tx.sign(keypair);
    await horizon.submitTransaction(tx);
  }
}

async function cmdWallets(): Promise<void> {
  const w = loadWallets(true);
  for (const name of WALLET_NAMES) {
    // Trustless Work rejects a deploy unless every role wallet trusts the escrow asset.
    await ensureAccount(w[name], true);
    const usdc = await usdcBalance(w[name].publicKey());
    log(`  ${name.padEnd(14)} ${w[name].publicKey()}  USDC ${usdc}`);
  }
  log(`\nHastaya test USDC'si:\n  cd ../anchor && CLINIC_SECRET=$(node -p 'require("../web/.tw-wallets.json").patient') npm run onramp -- 50`);
}

// ---------------------------------------------------------------- escrow flows

function client(): TrustlessWork {
  return new TrustlessWork(process.env.TW_API_KEY ?? '', process.env.TW_API_URL || undefined);
}

function rolesFor(w: Wallets): Roles {
  return {
    approver: w.patient.publicKey(),
    serviceProvider: w.clinic.publicKey(),
    platformAddress: w.pactaRelease.publicKey(),
    releaseSigner: w.pactaRelease.publicKey(),
    disputeResolver: w.pactaResolver.publicKey(),
    receiver: w.clinic.publicKey(),
  };
}

/** Demo tiers; procedure date placed `days` days from now. */
function demoPolicy(days: number): Policy {
  return {
    procedureDate: Math.floor(Date.now() / 1000) + days * DAY_SECONDS,
    tiers: [
      { minDaysBefore: 14, refundBps: 10_000 },
      { minDaysBefore: 7, refundBps: 5_000 },
      { minDaysBefore: 0, refundBps: 0 },
    ],
    agencyBps: 1_000,
  };
}

function partiesFor(w: Wallets): Parties {
  return { patient: w.patient.publicKey(), clinic: w.clinic.publicKey(), agency: w.agency.publicKey() };
}

async function policyContract(w: Wallets): Promise<PolicyCommitments | undefined> {
  const id = process.env.PACTA_POLICY_CONTRACT;
  if (!id) {
    log('  (PACTA_POLICY_CONTRACT unset — skipping on-chain policy commitment)');
    return undefined;
  }
  return PolicyCommitments.connect(id, w.pactaRelease);
}

async function commitPolicy(ptk: PolicyCommitments | undefined, contractId: string, policy: Policy, w: Wallets) {
  if (!ptk) return undefined;
  step('commit policy to PTK');
  const { dealId, hash } = await ptk.commit(contractId, policy, partiesFor(w));
  log(`  deal ${dealId}\n  ${EXPLORER}/tx/${hash}`);
  return dealId;
}

async function deployAndFund(tw: TrustlessWork, w: Wallets, amount: bigint, label: string): Promise<string> {
  const have = await usdcBalance(w.patient.publicKey());
  if (have === null || parseUsdc(have) < amount) {
    throw new Error(`Patient holds ${have ?? 'no'} USDC, needs ${formatUsdc(amount)} — see "npm run tw -- wallets"`);
  }

  step(`deploy (${label})`);
  const deployed = await tw.deploy(
    {
      engagementId: `pacta-${label}-${Date.now()}`,
      title: `Pacta deposit — ${label}`,
      description: 'Clinic deposit held until arrival; cancellations follow the committed policy.',
      roles: rolesFor(w),
      amount,
      platformFee: 0,
      milestones: [{ description: 'Patient arrived at clinic' }],
    },
    signer(w.pactaRelease),
    w.pactaRelease.publicKey(),
  );
  const contractId = deployed.contractId;
  if (!contractId) throw new Error(`deploy returned no contractId: ${JSON.stringify(deployed)}`);
  log(`  escrow ${EXPLORER}/contract/${contractId}`);

  step(`fund ${formatUsdc(amount)} USDC from patient`);
  const funded = await tw.fund(contractId, amount, signer(w.patient), w.patient.publicKey());
  log(`  ${EXPLORER}/tx/${funded.hash}`);
  log(`  escrow balance ${formatUsdc(await tw.balance(contractId))} USDC`);
  return contractId;
}

async function cmdArrival(amountArg = '10'): Promise<void> {
  const tw = client();
  const w = loadWallets(false);
  const ptk = await policyContract(w);
  const contractId = await deployAndFund(tw, w, parseUsdc(amountArg), 'arrival');
  const dealId = await commitPolicy(ptk, contractId, demoPolicy(30), w);

  step('clinic marks arrival');
  await tw.markMilestone(contractId, 0, 'Arrived', 'QR scanned at front desk', signer(w.clinic), w.clinic.publicKey());

  step('patient confirms');
  await tw.approveMilestone(contractId, 0, signer(w.patient), w.patient.publicKey());

  if (ptk && dealId) {
    step('record arrival settlement on PTK');
    const balance = await tw.balance(contractId);
    const { distributions, hash } = await ptk.settle(dealId, 'Arrival', await ledgerNow(), balance);
    for (const row of distributions) log(`  ${row.address.slice(0, 6)}… ${formatUsdc(row.amount)}`);
    log(`  ${EXPLORER}/tx/${hash}`);
    log('  note: TW release pays the receiver (clinic) in full; the agency share is owed clinic → agency');
  }

  step('Pacta releases');
  await tw.release(contractId, signer(w.pactaRelease), w.pactaRelease.publicKey());

  log(`  clinic USDC ${await usdcBalance(w.clinic.publicKey())}`);
  log(`\n✓ arrival path settled: ${EXPLORER}/contract/${contractId}`);
}

async function cmdCancel(amountArg = '10', daysArg = '10'): Promise<void> {
  const tw = client();
  const w = loadWallets(false);
  const ptk = await policyContract(w);
  const policy = demoPolicy(Number(daysArg));
  const contractId = await deployAndFund(tw, w, parseUsdc(amountArg), 'cancel');
  const dealId = await commitPolicy(ptk, contractId, policy, w);

  step('Pacta opens the dispute with its release key (patient signs nothing)');
  try {
    await tw.dispute(contractId, signer(w.pactaRelease), w.pactaRelease.publicKey());
    log('  ✓ release signer may dispute');
  } catch (err) {
    if (!(err instanceof TrustlessWorkError)) throw err;
    log(`  ✗ release signer refused (${err.message}) — falling back to patient`);
    await tw.dispute(contractId, signer(w.patient), w.patient.publicKey());
  }

  step('policy → distributions against the live balance');
  const balance = await tw.balance(contractId);
  const at = await ledgerNow();
  const local = distribute(balance, entitlement(policy, new Date(at * 1000)), partiesFor(w));
  let rows = local;
  if (ptk && dealId) {
    const recorded = await ptk.settle(dealId, 'PatientCancel', at, balance);
    const same = JSON.stringify(recorded.distributions, big) === JSON.stringify(local, big);
    if (!same) throw new Error('PTK and policy.ts disagree — refusing to resolve');
    rows = recorded.distributions;
    log(`  recorded on PTK ${EXPLORER}/tx/${recorded.hash}`);
  }
  log(`  balance ${formatUsdc(balance)}`);
  for (const row of rows) log(`  ${row.address.slice(0, 6)}… ${formatUsdc(row.amount)}`);

  step('Pacta resolves with its resolver key');
  await tw.resolve(contractId, rows, signer(w.pactaResolver), w.pactaResolver.publicKey());
  for (const who of ['patient', 'clinic', 'agency'] as const) {
    log(`  ${who.padEnd(8)} USDC ${await usdcBalance(w[who].publicKey())}`);
  }

  log(`\n✓ cancellation settled: ${EXPLORER}/contract/${contractId}`);
}

const big = (_: string, v: unknown) => (typeof v === 'bigint' ? v.toString() : v);

/** Latest ledger close time — PTK rejects settlement times ahead of the ledger. */
async function ledgerNow(): Promise<number> {
  const [ledger] = (await horizon.ledgers().order('desc').limit(1).call()).records;
  return Math.floor(Date.parse(ledger!.closed_at) / 1000);
}

/**
 * Rebalances the demo: clinic and agency send their USDC back to the patient,
 * so the notice can be paid again. Every run of the demo drains the patient.
 */
async function cmdTopup(): Promise<void> {
  const w = loadWallets(false);
  for (const who of ['clinic', 'agency'] as const) {
    const balance = await usdcBalance(w[who].publicKey());
    if (!balance || Number(balance) <= 0) continue;
    const source = await horizon.loadAccount(w[who].publicKey());
    const tx = new TransactionBuilder(source, { fee: BASE_FEE, networkPassphrase: PASSPHRASE })
      .addOperation(Operation.payment({ destination: w.patient.publicKey(), asset: USDC, amount: balance }))
      .setTimeout(60)
      .build();
    tx.sign(w[who]);
    await horizon.submitTransaction(tx);
    log(`  ${who} → patient  ${balance} USDC`);
  }
  const left = await usdcBalance(w.patient.publicKey());
  log(`\n✓ patient holds ${left} USDC — enough for ${Math.floor(Number(left) / 8.6956522)} more runs at €800`);
  if (Number(left) < 8.6956522) {
    log(`  Not enough for a run. Top up from the anchor:\n  cd ../anchor && CLINIC_SECRET=$(node -p 'require("../web/.tw-wallets.json").patient') npm run onramp -- 1500`);
  }
}

/** Returns a stuck escrow's whole balance to the patient (demo cleanup). */
async function cmdRefund(contractId?: string): Promise<void> {
  if (!contractId) throw new Error('usage: npm run tw -- refund <contractId>');
  const tw = client();
  const w = loadWallets(false);
  const escrow = await tw.escrow(contractId);
  if (!escrow?.flags?.disputed) await tw.dispute(contractId, signer(w.pactaRelease), w.pactaRelease.publicKey());
  const balance = await tw.balance(contractId);
  const sent = await tw.resolve(contractId, [{ address: w.patient.publicKey(), amount: balance }], signer(w.pactaResolver), w.pactaResolver.publicKey());
  log(`✓ ${formatUsdc(balance)} USDC back to patient ${EXPLORER}/tx/${sent.hash}`);
}

async function cmdShow(contractId?: string): Promise<void> {
  if (!contractId) throw new Error('usage: npm run tw -- show <contractId>');
  const tw = client();
  log(JSON.stringify(await tw.escrow(contractId), null, 2));
  log(`balance ${formatUsdc(await tw.balance(contractId))} USDC`);
}

// ---------------------------------------------------------------- main

const [command, ...args] = process.argv.slice(2);
const commands: Record<string, (...a: string[]) => Promise<void>> = {
  wallets: cmdWallets,
  arrival: cmdArrival,
  cancel: cmdCancel,
  topup: cmdTopup,
  refund: cmdRefund,
  show: cmdShow,
};

const run = command ? commands[command] : undefined;
if (!run) {
  console.error(`usage: npm run tw -- <${Object.keys(commands).join('|')}>`);
  process.exit(1);
}
run(...args).catch((err: unknown) => {
  if (err instanceof TrustlessWorkError) console.error(`\n✗ ${err.message}\n${JSON.stringify(err.body, null, 2)}`);
  else console.error(`\n✗ ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
