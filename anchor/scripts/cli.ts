/**
 * Pacta klinik akışının anchor bacağı, komut satırından.
 *
 *   npm run wallet            klinik cüzdanı: üret, fonla, USDC trustline
 *   npm run quote -- 25       "bugün 25 USDC çekersen şu kadar TL" (SEP-38, girişsiz)
 *   npm run onramp -- 200     TL → USDC (klinik cüzdanını test USDC'siyle doldurur)
 *   npm run offramp -- 4      USDC → TL, kliniğin IBAN'ına (FR-21)
 *   npm run history           anchor'daki SEP-6 işlemleri
 *   npm run demo              onramp + offramp uçtan uca
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { Keypair } from '@stellar/stellar-sdk';
import {
  AnchorClient,
  AnchorError,
  Chain,
  anchorMemo,
  keypairSigner,
  loadConfig,
  simulateBankTransfer,
  type AnchorSession,
  type Sep6Transaction,
} from '../src/index.ts';

const ENV_FILE = new URL('../.env', import.meta.url);
const WALLET_FILE = new URL('../.wallet.json', import.meta.url);

if (existsSync(ENV_FILE)) process.loadEnvFile(ENV_FILE);
const config = loadConfig(process.env);
const chain = new Chain(config.network);

const log = (...parts: unknown[]) => console.log(...parts);
const step = (title: string) => console.log(`\n▸ ${title}`);

// ---------------------------------------------------------------- wallet

/** CLINIC_SECRET if set; otherwise a testnet key kept in .wallet.json. */
function clinicKeypair(): Keypair {
  if (process.env.CLINIC_SECRET) return Keypair.fromSecret(process.env.CLINIC_SECRET);
  if (existsSync(WALLET_FILE)) {
    return Keypair.fromSecret(JSON.parse(readFileSync(WALLET_FILE, 'utf8')).secret);
  }
  if (config.network.name !== 'testnet') {
    throw new Error("Mainnet'te cüzdan üretilmez; CLINIC_SECRET verin.");
  }
  const keypair = Keypair.random();
  writeFileSync(WALLET_FILE, JSON.stringify({ publicKey: keypair.publicKey(), secret: keypair.secret() }, null, 2), {
    mode: 0o600,
  });
  log(`  yeni testnet cüzdanı → anchor/.wallet.json`);
  return keypair;
}

async function readyWallet(anchor: AnchorClient): Promise<Keypair> {
  const keypair = clinicKeypair();
  const address = keypair.publicKey();
  if (!(await chain.exists(address))) {
    log('  Friendbot ile XLM fonlanıyor…');
    await chain.fundWithFriendbot(address);
  }
  const hash = await chain.ensureTrustline(keypair, anchor.info.asset);
  if (hash) log(`  ${anchor.info.asset.getCode()} trustline açıldı  ${chain.txUrl(hash)}`);
  return keypair;
}

async function login(anchor: AnchorClient, keypair: Keypair): Promise<AnchorSession> {
  step('SEP-10 · anahtarla giriş (şifre yok)');
  const session = await anchor.authenticate(keypair.publicKey(), keypairSigner(keypair));
  log(`  JWT alındı · ${session.account}`);
  return session;
}

function onUpdate(tx: Sep6Transaction) {
  const extra = [tx.message, tx.pending_reason].filter(Boolean).join(' · ');
  log(`  → ${tx.status}${extra ? `  (${extra})` : ''}`);
}

function assertCompleted(tx: Sep6Transaction) {
  if (tx.status !== 'completed') {
    throw new Error(`işlem ${tx.id} ${tx.status} durumunda bitti${tx.message ? `: ${tx.message}` : ''}`);
  }
}

// ---------------------------------------------------------------- commands

async function wallet(anchor: AnchorClient) {
  step('Klinik cüzdanı');
  const keypair = await readyWallet(anchor);
  const address = keypair.publicKey();
  log(`  adres  ${address}`);
  log(`  XLM    ${await chain.balance(address)}`);
  log(`  ${anchor.info.asset.getCode()}   ${await chain.balance(address, anchor.info.asset)}`);
  log(`  ${chain.accountUrl(address)}`);
}

async function quote(anchor: AnchorClient, amount = '10') {
  step(`SEP-38 · ${amount} ${anchor.info.asset.getCode()} bugün kaç TL eder?`);
  const price = await anchor.price({
    sellAsset: anchor.info.assetId,
    buyAsset: anchor.info.fiatAssetId,
    sellAmount: amount,
    context: 'sep6',
    buyDeliveryMethod: 'bank_account',
  });
  log(`  ${price.sell_amount} USDC → ${price.buy_amount} TL`);
  log(`  efektif kur ${rate(price.buy_amount, price.sell_amount)} TL/USDC · spread ${price.fee.total} USDC`);
}

async function onramp(anchor: AnchorClient, amount = '200'): Promise<Sep6Transaction> {
  step('Cüzdan hazırlığı');
  const keypair = await readyWallet(anchor);
  const session = await login(anchor, keypair);

  step(`SEP-6 · ${amount} TL yatırma (TL → USDC)`);
  const deposit = await session.deposit({ amount });
  log(`  işlem ${deposit.id}`);
  for (const { description, value } of Object.values(deposit.instructions ?? {})) {
    log(`  ${description}: ${value}`);
  }

  step('Sandbox · banka rolünü oynuyoruz: TL transferi geldi');
  await simulateBankTransfer(anchor, deposit.id, amount);

  step('SEP-6 · tamamlanana kadar izleniyor');
  const tx = await session.waitForTransaction(deposit.id, { onUpdate });
  assertCompleted(tx);
  log(`  ${tx.amount_in} TL → ${tx.amount_out} USDC`);
  if (tx.stellar_transaction_id) log(`  ${chain.txUrl(tx.stellar_transaction_id)}`);
  return tx;
}

async function offramp(anchor: AnchorClient, amount?: string): Promise<Sep6Transaction> {
  step('Cüzdan hazırlığı');
  const keypair = await readyWallet(anchor);
  const session = await login(anchor, keypair);

  step('SEP-12 · klinik KYB (sandbox: kişisel veri istenmez)');
  const iban = process.env.CLINIC_IBAN?.replace(/\s/g, '');
  await session.putCustomer(iban ? { bank_account_number: iban } : {});
  log(`  durum ${(await session.getCustomer()).status} · ödeme IBAN'ı: ${iban ?? 'anchor sandbox IBAN'}`);

  const sellAmount = amount ?? (await chain.balance(keypair.publicKey(), anchor.info.asset));
  if (!sellAmount || Number(sellAmount) <= 0) {
    throw new Error('Cüzdanda USDC yok — önce `npm run onramp`.');
  }

  step('SEP-38 · kur kilitleniyor');
  const q = await session.createQuote({
    sellAsset: anchor.info.assetId,
    buyAsset: anchor.info.fiatAssetId,
    sellAmount,
    context: 'sep6',
    buyDeliveryMethod: 'bank_account',
  });
  log(`  bugün çekersen: ${q.sell_amount} USDC → ${q.buy_amount} TL`);
  log(`  kur ${rate(q.buy_amount, q.sell_amount)} TL/USDC · geçerlilik ${q.expires_at} · quote ${q.id}`);

  step('SEP-6 · çekim başlatılıyor (USDC → TL)');
  const withdrawal = await session.withdrawExchange({ amount: q.sell_amount, quoteId: q.id });
  log(`  işlem ${withdrawal.id} · hedef ${withdrawal.account_id} · memo (${withdrawal.memo_type}) ${withdrawal.memo}`);

  step('Stellar · USDC memo ile anchor treasury\'sine gönderiliyor');
  const hash = await chain.pay(keypair, {
    destination: withdrawal.account_id,
    asset: anchor.info.asset,
    amount: q.sell_amount,
    memo: anchorMemo(withdrawal.memo_type, withdrawal.memo),
  });
  log(`  ${chain.txUrl(hash)}`);

  step('SEP-6 · anchor ödemeyi görüp TL ödeyene kadar izleniyor');
  const tx = await session.waitForTransaction(withdrawal.id, { onUpdate });
  assertCompleted(tx);
  log(`  ${tx.amount_in} USDC → ${tx.amount_out} TL · IBAN'a ödendi (simüle FAST)`);
  if (tx.external_transaction_id) log(`  banka referansı ${tx.external_transaction_id}`);
  return tx;
}

async function history(anchor: AnchorClient) {
  const session = await login(anchor, clinicKeypair());
  step('SEP-6 · işlem geçmişi');
  for (const tx of await session.transactions({ limit: 10 })) {
    log(`  ${tx.started_at ?? ''}  ${tx.kind.padEnd(19)} ${tx.status.padEnd(28)} ${tx.amount_in ?? '-'} → ${tx.amount_out ?? '-'}`);
  }
}

async function demo(anchor: AnchorClient) {
  const deposit = await onramp(anchor, '200');
  await offramp(anchor, deposit.amount_out);
}

function rate(buy: string, sell: string): string {
  return (Number(buy) / Number(sell)).toFixed(4);
}

// ---------------------------------------------------------------- main

async function main() {
  const [command = 'help', arg] = process.argv.slice(2);
  const anchor = await AnchorClient.connect(config);
  log(`Anchor ${anchor.info.homeDomain} · ${config.network.name} · ${anchor.info.assetId} ⇄ ${anchor.info.fiatAssetId}`);

  switch (command) {
    case 'wallet':
      return wallet(anchor);
    case 'quote':
      return quote(anchor, arg);
    case 'onramp':
      return void (await onramp(anchor, arg));
    case 'offramp':
      return void (await offramp(anchor, arg));
    case 'history':
      return history(anchor);
    case 'demo':
      return demo(anchor);
    default:
      log('komutlar: wallet | quote [usdc] | onramp [tl] | offramp [usdc] | history | demo');
  }
}

main().catch((err) => {
  console.error(`\n✗ ${err instanceof Error ? err.message : err}`);
  if (err instanceof AnchorError && err.body) console.error(JSON.stringify(err.body, null, 2));
  process.exit(1);
});
