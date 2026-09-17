import { Asset, Keypair, StellarToml, TransactionBuilder, WebAuth } from '@stellar/stellar-sdk';
import type { AnchorConfig } from './config.ts';
import { request, withQuery } from './http.ts';

// ---------------------------------------------------------------- SEP-1

/** Everything a wallet learns from the anchor's stellar.toml. */
export interface AnchorInfo {
  homeDomain: string;
  signingKey: string;
  webAuthEndpoint: string;
  transferServer: string;
  kycServer?: string;
  quoteServer?: string;
  /** The on-chain asset, issuer taken from the toml — never hardcoded. */
  asset: Asset;
  /** SEP-38 id of the on-chain asset, e.g. `stellar:USDC:G…`. */
  assetId: string;
  /** SEP-38 id of the fiat it is anchored to, e.g. `iso4217:TRY`. */
  fiatAssetId: string;
}

export async function discover(config: AnchorConfig): Promise<AnchorInfo> {
  const toml = await StellarToml.Resolver.resolve(config.homeDomain);
  const where = `${config.homeDomain}/.well-known/stellar.toml`;

  if (toml.NETWORK_PASSPHRASE && toml.NETWORK_PASSPHRASE !== config.network.passphrase) {
    throw new Error(
      `${where} is on "${toml.NETWORK_PASSPHRASE}", but the config expects "${config.network.passphrase}"`,
    );
  }

  const currency = toml.CURRENCIES?.find((c) => c.code === config.assetCode);
  if (!currency?.code || !currency.issuer) {
    throw new Error(`${where} does not list ${config.assetCode} with an issuer`);
  }
  if (currency.anchor_asset_type !== 'fiat' || !currency.anchor_asset) {
    throw new Error(`${where}: ${config.assetCode} is not anchored to a fiat currency`);
  }

  return {
    homeDomain: config.homeDomain,
    signingKey: required(toml.SIGNING_KEY, 'SIGNING_KEY', where),
    webAuthEndpoint: required(toml.WEB_AUTH_ENDPOINT, 'WEB_AUTH_ENDPOINT', where),
    transferServer: required(toml.TRANSFER_SERVER, 'TRANSFER_SERVER', where),
    kycServer: toml.KYC_SERVER,
    quoteServer: toml.ANCHOR_QUOTE_SERVER,
    asset: new Asset(currency.code, currency.issuer),
    assetId: `stellar:${currency.code}:${currency.issuer}`,
    fiatAssetId: `iso4217:${currency.anchor_asset}`,
  };
}

function required(value: string | undefined, field: string, where: string): string {
  if (!value) throw new Error(`${where} has no ${field}`);
  return value;
}

// ---------------------------------------------------------------- signing

/**
 * Signs a transaction envelope. A Keypair in scripts; in the browser, the
 * clinic's wallet (Freighter, Stellar Wallets Kit) — the key never leaves it.
 */
export type SignXdr = (xdr: string, networkPassphrase: string) => Promise<string>;

export function keypairSigner(keypair: Keypair): SignXdr {
  return async (xdr, networkPassphrase) => {
    const tx = TransactionBuilder.fromXDR(xdr, networkPassphrase);
    tx.sign(keypair);
    return tx.toXDR();
  };
}

// ---------------------------------------------------------------- types

export type Sep6Status =
  | 'incomplete'
  | 'pending_user_transfer_start'
  | 'pending_user_transfer_complete'
  | 'pending_external'
  | 'pending_anchor'
  | 'pending_stellar'
  | 'pending_trust'
  | 'pending_user'
  | 'pending_customer_info_update'
  | 'pending_transaction_info_update'
  | 'on_hold'
  | 'completed'
  | 'refunded'
  | 'expired'
  | 'no_market'
  | 'too_small'
  | 'too_large'
  | 'error';

const TERMINAL: ReadonlySet<Sep6Status> = new Set([
  'completed',
  'refunded',
  'expired',
  'no_market',
  'too_small',
  'too_large',
  'error',
]);

export interface Sep6Transaction {
  id: string;
  kind: 'deposit' | 'deposit-exchange' | 'withdrawal' | 'withdrawal-exchange';
  status: Sep6Status;
  message?: string;
  amount_in?: string;
  amount_in_asset?: string;
  amount_out?: string;
  amount_out_asset?: string;
  amount_fee?: string;
  quote_id?: string;
  started_at?: string;
  completed_at?: string;
  stellar_transaction_id?: string;
  /** Deposits: the transfer reference. Withdrawals: the payout's bank reference. */
  external_transaction_id?: string;
  claimable_balance_id?: string;
  withdraw_anchor_account?: string;
  withdraw_memo?: string;
  withdraw_memo_type?: string;
  more_info_url?: string;
  /** Not in SEP-6; this anchor explains stalls here (e.g. `treasury_low`). */
  pending_reason?: string;
}

export interface Sep9Instruction {
  value: string;
  description: string;
}

export interface Sep6DepositResponse {
  id: string;
  how?: string;
  instructions?: Record<string, Sep9Instruction>;
  eta?: number;
  fee_percent?: number;
  extra_info?: { message?: string };
}

export interface Sep6WithdrawResponse {
  id: string;
  account_id: string;
  memo_type?: 'id' | 'text' | 'hash';
  memo?: string;
  min_amount?: number;
  max_amount?: number;
  fee_percent?: number;
  extra_info?: { message?: string };
}

export interface Sep12Customer {
  id?: string;
  status: 'ACCEPTED' | 'PROCESSING' | 'NEEDS_INFO' | 'REJECTED';
  message?: string;
}

export interface Sep38Fee {
  total: string;
  asset: string;
  details?: { name: string; description?: string; amount: string }[];
}

export interface Sep38Price {
  total_price: string;
  price: string;
  sell_amount: string;
  buy_amount: string;
  fee: Sep38Fee;
}

export interface Sep38Quote extends Sep38Price {
  id: string;
  expires_at: string;
  sell_asset: string;
  buy_asset: string;
}

export interface PriceRequest {
  sellAsset: string;
  buyAsset: string;
  sellAmount?: string;
  buyAmount?: string;
  context: 'sep6' | 'sep24' | 'sep31';
  sellDeliveryMethod?: string;
  buyDeliveryMethod?: string;
}

function priceParams(req: PriceRequest) {
  return {
    sell_asset: req.sellAsset,
    buy_asset: req.buyAsset,
    sell_amount: req.sellAmount,
    buy_amount: req.buyAmount,
    context: req.context,
    sell_delivery_method: req.sellDeliveryMethod,
    buy_delivery_method: req.buyDeliveryMethod,
  };
}

// ---------------------------------------------------------------- client

/** Public side of an anchor: discovery, capabilities, indicative prices, login. */
export class AnchorClient {
  readonly config: AnchorConfig;
  readonly info: AnchorInfo;

  private constructor(config: AnchorConfig, info: AnchorInfo) {
    this.config = config;
    this.info = info;
  }

  static async connect(config: AnchorConfig): Promise<AnchorClient> {
    return new AnchorClient(config, await discover(config));
  }

  /** SEP-6 capabilities: assets, limits, fields. */
  sep6Info(): Promise<Record<string, unknown>> {
    return request(`${this.info.transferServer}/info`);
  }

  /** SEP-38 indicative price; no login needed. */
  price(req: PriceRequest): Promise<Sep38Price> {
    return request(withQuery(`${this.quoteServer()}/price`, priceParams(req)));
  }

  /**
   * SEP-10: fetch the challenge, check it really comes from this anchor, have
   * the account sign it, trade it for a JWT. No password — the key is the identity.
   */
  async authenticate(account: string, sign: SignXdr): Promise<AnchorSession> {
    const { webAuthEndpoint, signingKey, homeDomain } = this.info;
    const passphrase = this.config.network.passphrase;

    const challenge = await request<{ transaction: string; network_passphrase?: string }>(
      withQuery(webAuthEndpoint, { account }),
    );
    if (challenge.network_passphrase && challenge.network_passphrase !== passphrase) {
      throw new Error(`SEP-10 challenge is for "${challenge.network_passphrase}", expected "${passphrase}"`);
    }

    // Throws unless the anchor's SIGNING_KEY signed it, for this home domain,
    // inside its time window, with sequence 0 — i.e. it can't move funds.
    const { clientAccountID } = WebAuth.readChallengeTx(
      challenge.transaction,
      signingKey,
      passphrase,
      homeDomain,
      new URL(webAuthEndpoint).hostname,
    );
    if (clientAccountID !== account) {
      throw new Error(`SEP-10 challenge is for ${clientAccountID}, not ${account}`);
    }

    const { token } = await request<{ token: string }>(webAuthEndpoint, {
      method: 'POST',
      body: { transaction: await sign(challenge.transaction, passphrase) },
    });
    return new AnchorSession(this, account, token);
  }

  quoteServer(): string {
    if (!this.info.quoteServer) throw new Error(`${this.info.homeDomain} publishes no ANCHOR_QUOTE_SERVER`);
    return this.info.quoteServer;
  }

  kycServer(): string {
    if (!this.info.kycServer) throw new Error(`${this.info.homeDomain} publishes no KYC_SERVER`);
    return this.info.kycServer;
  }
}

/** Everything that needs the SEP-10 JWT. */
export class AnchorSession {
  readonly anchor: AnchorClient;
  readonly account: string;
  readonly token: string;

  constructor(anchor: AnchorClient, account: string, token: string) {
    this.anchor = anchor;
    this.account = account;
    this.token = token;
  }

  private call<T>(url: string, opts: { method?: 'GET' | 'POST' | 'PUT'; body?: unknown } = {}): Promise<T> {
    return request<T>(url, { ...opts, token: this.token });
  }

  private get transferServer(): string {
    return this.anchor.info.transferServer;
  }

  // SEP-12 ------------------------------------------------------------

  getCustomer(): Promise<Sep12Customer> {
    return this.call(`${this.anchor.kycServer()}/customer`);
  }

  /** Send KYB fields (e.g. the clinic's `bank_account_number` IBAN for payouts). */
  putCustomer(fields: Record<string, string> = {}): Promise<{ id: string }> {
    return this.call(`${this.anchor.kycServer()}/customer`, { method: 'PUT', body: fields });
  }

  // SEP-38 ------------------------------------------------------------

  /** A firm, single-use quote bound to this account. */
  createQuote(req: PriceRequest & { expireAfter?: string }): Promise<Sep38Quote> {
    return this.call(`${this.anchor.quoteServer()}/quote`, {
      method: 'POST',
      body: { ...priceParams(req), expire_after: req.expireAfter },
    });
  }

  // SEP-6 -------------------------------------------------------------

  /** Fiat → on-chain. Returns SEP-9 bank instructions (IBAN + reference). */
  deposit(params: { amount?: string; fundingMethod?: string }): Promise<Sep6DepositResponse> {
    return this.call(
      withQuery(`${this.transferServer}/deposit`, {
        asset_code: this.anchor.info.asset.getCode(),
        account: this.account,
        funding_method: params.fundingMethod ?? 'bank_account',
        amount: params.amount,
      }),
    );
  }

  /** On-chain → fiat at the live rate. Returns where to send the asset, and the memo. */
  withdraw(params: { amount?: string; fundingMethod?: string }): Promise<Sep6WithdrawResponse> {
    return this.call(
      withQuery(`${this.transferServer}/withdraw`, {
        asset_code: this.anchor.info.asset.getCode(),
        funding_method: params.fundingMethod ?? 'bank_account',
        amount: params.amount,
      }),
    );
  }

  /** On-chain → fiat at a rate locked by a SEP-38 quote. */
  withdrawExchange(params: { amount: string; quoteId?: string; fundingMethod?: string }): Promise<Sep6WithdrawResponse> {
    return this.call(
      withQuery(`${this.transferServer}/withdraw-exchange`, {
        source_asset: this.anchor.info.asset.getCode(),
        destination_asset: this.anchor.info.fiatAssetId,
        amount: params.amount,
        quote_id: params.quoteId,
        funding_method: params.fundingMethod ?? 'bank_account',
      }),
    );
  }

  async transaction(id: string): Promise<Sep6Transaction> {
    const res = await this.call<{ transaction: Sep6Transaction }>(
      withQuery(`${this.transferServer}/transaction`, { id }),
    );
    return res.transaction;
  }

  async transactions(params: { kind?: 'deposit' | 'withdrawal'; limit?: number } = {}): Promise<Sep6Transaction[]> {
    const res = await this.call<{ transactions: Sep6Transaction[] }>(
      withQuery(`${this.transferServer}/transactions`, {
        asset_code: this.anchor.info.asset.getCode(),
        kind: params.kind,
        limit: params.limit,
      }),
    );
    return res.transactions;
  }

  /** Polls until the transaction reaches a terminal status; reports each status change. */
  async waitForTransaction(
    id: string,
    opts: { timeoutMs?: number; intervalMs?: number; onUpdate?: (tx: Sep6Transaction) => void } = {},
  ): Promise<Sep6Transaction> {
    const { timeoutMs = 180_000, intervalMs = 3_000, onUpdate } = opts;
    const deadline = Date.now() + timeoutMs;
    let last: Sep6Status | undefined;

    for (;;) {
      const tx = await this.transaction(id);
      if (tx.status !== last) {
        last = tx.status;
        onUpdate?.(tx);
      }
      if (TERMINAL.has(tx.status)) return tx;
      if (Date.now() > deadline) {
        throw new Error(`transaction ${id} still ${tx.status} after ${timeoutMs / 1000}s`);
      }
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
  }
}
