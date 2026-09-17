/**
 * Kliniğin TL çıkışı: anchor/ paketinin SEP-10/12/38/6 zinciri, sunucuda.
 * CLI'daki `npm run offramp` ile aynı adımlar; burada klinik paneline bağlı.
 */
import {
  AnchorClient,
  Chain,
  anchorMemo,
  keypairSigner,
  loadConfig,
  type Sep6Transaction,
} from '@pacta/anchor';
import type { Keypair } from '@stellar/stellar-sdk';

// anchor/ resolves its own copy of stellar-sdk; a Keypair is structurally the same object.
type AnchorKeypair = Parameters<typeof keypairSigner>[0];
import type { Withdrawal } from './deals';

const config = loadConfig(process.env);
const chain = new Chain(config.network);

let client: Promise<AnchorClient> | undefined;
function anchor(): Promise<AnchorClient> {
  client ??= AnchorClient.connect(config).catch((err) => {
    client = undefined;
    throw err;
  });
  return client;
}

export type TryQuote = { usdc: string; tl: string; rate: string; anchor: string };

/** Clinic USDC on-chain, or null without a trustline. */
export async function usdcBalance(address: string): Promise<string | null> {
  const a = await anchor();
  return chain.balance(address, a.info.asset);
}

/** Indicative SEP-38 price, no login. */
export async function quoteTry(usdc: string): Promise<TryQuote> {
  const a = await anchor();
  const price = await a.price({
    sellAsset: a.info.assetId,
    buyAsset: a.info.fiatAssetId,
    sellAmount: usdc,
    context: 'sep6',
    buyDeliveryMethod: 'bank_account',
  });
  return { usdc: price.sell_amount, tl: price.buy_amount, rate: rate(price.buy_amount, price.sell_amount), anchor: a.info.homeDomain };
}

/** SEP-10 → SEP-12 → SEP-38 firm quote → SEP-6 withdraw-exchange → USDC payment → poll. */
export async function withdrawToTry(clinicKey: Keypair, usdc: string, iban?: string): Promise<Withdrawal> {
  const clinic = clinicKey as unknown as AnchorKeypair;
  const a = await anchor();
  const session = await a.authenticate(clinic.publicKey(), keypairSigner(clinic));
  await session.putCustomer(iban ? { bank_account_number: iban.replace(/\s/g, '') } : {});

  const quote = await session.createQuote({
    sellAsset: a.info.assetId,
    buyAsset: a.info.fiatAssetId,
    sellAmount: usdc,
    context: 'sep6',
    buyDeliveryMethod: 'bank_account',
  });
  const withdrawal = await session.withdrawExchange({ amount: quote.sell_amount, quoteId: quote.id });

  const stellarTx = await chain.pay(clinic, {
    destination: withdrawal.account_id,
    asset: a.info.asset,
    amount: quote.sell_amount,
    memo: anchorMemo(withdrawal.memo_type, withdrawal.memo),
  });

  const tx: Sep6Transaction = await session.waitForTransaction(withdrawal.id, { timeoutMs: 90_000 });
  return {
    id: withdrawal.id,
    at: Math.floor(Date.now() / 1000),
    usdc: quote.sell_amount,
    tl: tx.amount_out ?? quote.buy_amount,
    rate: rate(quote.buy_amount, quote.sell_amount),
    stellarTx,
    bankRef: tx.external_transaction_id,
    status: tx.status,
  };
}

function rate(buy: string, sell: string): string {
  return (Number(buy) / Number(sell)).toFixed(2);
}
