/**
 * Trustless Work REST client, single-release escrow only.
 *
 * Every write endpoint returns an unsigned XDR; the caller signs it and the
 * signed envelope goes back through `/helper/send-transaction`. `SignXdr` is the
 * only thing that differs between a server-held demo key and a patient wallet.
 *
 * Shapes come from https://dev.api.trustlesswork.com/docs-json (2026-09-17).
 * TW amounts are decimal numbers, not base units: convert with `toTwAmount` /
 * `fromTwAmount` so every policy calculation stays in bigint.
 */
import { Networks, TransactionBuilder } from '@stellar/stellar-sdk';
import { formatUsdc, parseUsdc, USDC_DECIMALS } from './money.ts';

export const TW_TESTNET_URL = 'https://dev.api.trustlesswork.com';

/** Circle testnet USDC — the same issuer the TR mock anchor settles in. */
export const TESTNET_USDC = {
  symbol: 'USDC',
  address: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
};

export type SignXdr = (unsignedXdr: string) => Promise<string>;

export type Roles = {
  /** Patient: approves the arrival milestone. */
  approver: string;
  /** Clinic: marks the patient as arrived. */
  serviceProvider: string;
  /** Pacta fee address. */
  platformAddress: string;
  /** Pacta release key. */
  releaseSigner: string;
  /** Pacta resolver key — must differ from every other role. */
  disputeResolver: string;
  /** Clinic, or a split contract in front of clinic + agency. */
  receiver: string;
};

export type EscrowSpec = {
  engagementId: string;
  title: string;
  description: string;
  roles: Roles;
  /** Base units. */
  amount: bigint;
  /** Percent, 0–99. */
  platformFee: number;
  milestones: { description: string }[];
  trustline?: { symbol: string; address: string };
};

export type Escrow = {
  contractId?: string;
  engagementId: string;
  amount: number;
  balance?: number;
  roles: Roles;
  flags?: { disputed?: boolean; released?: boolean; resolved?: boolean; approved?: boolean };
  milestones: { description: string; status?: string; evidence?: string; approved?: boolean }[];
};

export type Sent = {
  status: string;
  message?: string;
  contractId?: string;
  escrow?: Escrow;
  hash?: string;
};

export class TrustlessWorkError extends Error {
  status: number;
  path: string;
  body: unknown;

  constructor(status: number, message: string, path: string, body: unknown) {
    super(message);
    this.name = 'TrustlessWorkError';
    this.status = status;
    this.path = path;
    this.body = body;
  }
}

/** 8695652174n → 869.5652174 */
export function toTwAmount(amount: bigint): number {
  return Number(formatUsdc(amount));
}

/** 869.5652174 → 8695652174n. Rounds away float noise at 7 decimals. */
export function fromTwAmount(amount: number): bigint {
  return parseUsdc(amount.toFixed(USDC_DECIMALS));
}

export class TrustlessWork {
  readonly baseUrl: string;
  readonly networkPassphrase: string;
  readonly #apiKey: string;

  constructor(apiKey: string, baseUrl: string = TW_TESTNET_URL, networkPassphrase: string = Networks.TESTNET) {
    if (!apiKey) throw new Error('Trustless Work API key is missing (TW_API_KEY)');
    this.#apiKey = apiKey;
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.networkPassphrase = networkPassphrase;
  }

  // ------------------------------------------------------------ lifecycle

  /** Deploys and initialises the escrow. The returned `contractId` is the escrow address. */
  deploy(spec: EscrowSpec, sign: SignXdr, signer: string): Promise<Sent> {
    return this.#write('POST', '/deployer/single-release', sign, {
      signer,
      engagementId: spec.engagementId,
      title: spec.title,
      description: spec.description,
      roles: spec.roles,
      amount: toTwAmount(spec.amount),
      platformFee: spec.platformFee,
      milestones: spec.milestones,
      trustline: spec.trustline ?? TESTNET_USDC,
    });
  }

  fund(contractId: string, amount: bigint, sign: SignXdr, signer: string): Promise<Sent> {
    return this.#write('POST', '/escrow/single-release/fund-escrow', sign, {
      contractId,
      signer,
      amount: toTwAmount(amount),
    });
  }

  /** Clinic (serviceProvider) marks a milestone, e.g. "Arrived". */
  markMilestone(
    contractId: string,
    milestoneIndex: number,
    newStatus: string,
    newEvidence: string,
    sign: SignXdr,
    serviceProvider: string,
  ): Promise<Sent> {
    return this.#write('POST', '/escrow/single-release/change-milestone-status', sign, {
      contractId,
      milestoneIndex: String(milestoneIndex),
      newStatus,
      newEvidence,
      serviceProvider,
    });
  }

  /** Patient (approver) confirms the milestone. */
  approveMilestone(contractId: string, milestoneIndex: number, sign: SignXdr, approver: string): Promise<Sent> {
    return this.#write('POST', '/escrow/single-release/approve-milestone', sign, {
      contractId,
      milestoneIndex: String(milestoneIndex),
      approver,
    });
  }

  release(contractId: string, sign: SignXdr, releaseSigner: string): Promise<Sent> {
    return this.#write('POST', '/escrow/single-release/release-funds', sign, { contractId, releaseSigner });
  }

  /** Approver, service provider or release signer — never the dispute resolver. */
  dispute(contractId: string, sign: SignXdr, signer: string): Promise<Sent> {
    return this.#write('POST', '/escrow/single-release/dispute-escrow', sign, { contractId, signer });
  }

  /**
   * Distributions must be positive and sum to the live escrow balance —
   * build them with `distribute()` from policy.ts against `balance()`.
   */
  resolve(
    contractId: string,
    distributions: { address: string; amount: bigint }[],
    sign: SignXdr,
    disputeResolver: string,
  ): Promise<Sent> {
    return this.#write('POST', '/escrow/single-release/resolve-dispute', sign, {
      contractId,
      disputeResolver,
      distributions: distributions.map((d) => ({ address: d.address, amount: toTwAmount(d.amount) })),
    });
  }

  // ------------------------------------------------------------ reads

  async escrow(contractId: string): Promise<Escrow | undefined> {
    const query = new URLSearchParams({ validateOnChain: 'true' });
    query.append('contractIds[]', contractId);
    const rows = await this.#request<Escrow[] | Escrow>('GET', `/helper/get-escrow-by-contract-ids?${query}`);
    return Array.isArray(rows) ? rows[0] : rows;
  }

  /** Live token balance held by the escrow contract, base units. */
  async balance(contractId: string): Promise<bigint> {
    const query = new URLSearchParams();
    query.append('addresses[]', contractId);
    const rows = await this.#request<{ address: string; balance: number }[]>(
      'GET',
      `/helper/get-multiple-escrow-balance?${query}`,
    );
    const row = rows.find((r) => r.address === contractId) ?? rows[0];
    if (!row) throw new Error(`No balance returned for ${contractId}`);
    return fromTwAmount(row.balance);
  }

  // ------------------------------------------------------------ plumbing

  async #write(method: 'POST' | 'PUT', path: string, sign: SignXdr, body: unknown): Promise<Sent> {
    const { unsignedTransaction } = await this.#request<{ unsignedTransaction?: string }>(method, path, body);
    if (!unsignedTransaction) throw new TrustlessWorkError(500, `${path} returned no unsignedTransaction`, path, undefined);
    const signedXdr = await sign(unsignedTransaction);
    const sent = await this.#request<Sent>('POST', '/helper/send-transaction', { signedXdr });
    // TW answers with status + message only; the hash is derived from what we signed.
    const hash = Buffer.from(TransactionBuilder.fromXDR(signedXdr, this.networkPassphrase).hash()).toString('hex');
    return { ...sent, hash };
  }

  async #request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: {
        accept: 'application/json',
        'x-api-key': this.#apiKey,
        ...(body === undefined ? {} : { 'content-type': 'application/json' }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: 'no-store',
    });
    const text = await res.text();
    let data: unknown;
    try {
      data = text ? JSON.parse(text) : undefined;
    } catch {
      data = undefined;
    }
    if (!res.ok) {
      const msg = (data as { message?: unknown } | undefined)?.message;
      const reason = Array.isArray(msg) ? msg.join('; ') : typeof msg === 'string' ? msg : text || res.statusText;
      throw new TrustlessWorkError(res.status, `${method} ${path} → ${res.status} ${reason}`, path, data);
    }
    return data as T;
  }
}
