/**
 * Politika Taahhüt Kontratı (contracts/policy) istemcisi.
 *
 * Arayüz zincirdeki kontrat spesifikasyonundan okunur, yani Rust tarafındaki
 * tip değişikliği burada elle taşınmaz. Yazma çağrıları operatör (Pacta)
 * anahtarıyla imzalanır; okuma çağrıları simülasyondur ve ücretsizdir.
 */
import { Keypair, Networks, contract } from '@stellar/stellar-sdk';
import type { Distribution, Parties, Policy } from './policy.ts';

export const TESTNET_RPC_URL = 'https://soroban-testnet.stellar.org';

export type PtkReason = 'Arrival' | 'PatientCancel' | 'ClinicCancel';

type OnChainTerms = {
  escrow: string;
  patient: string;
  clinic: string;
  agency: string | undefined;
  procedure_date: bigint;
  tiers: { min_days_before: number; refund_bps: number }[];
  agency_bps: number;
};

type OnChainDistribution = { address: string; amount: bigint };

export function toTerms(escrow: string, policy: Policy, parties: Parties): OnChainTerms {
  return {
    escrow,
    patient: parties.patient,
    clinic: parties.clinic,
    agency: parties.agency,
    procedure_date: BigInt(policy.procedureDate),
    tiers: policy.tiers.map((t) => ({ min_days_before: t.minDaysBefore, refund_bps: t.refundBps })),
    agency_bps: policy.agencyBps,
  };
}

const reason = (tag: PtkReason) => ({ tag, values: undefined });

// Client.from builds methods at runtime from the on-chain spec.
type Dynamic = Record<string, (args?: Record<string, unknown>) => Promise<contract.AssembledTransaction<unknown>>>;

export class PolicyCommitments {
  readonly contractId: string;
  readonly #client: Dynamic;

  private constructor(contractId: string, client: contract.Client) {
    this.contractId = contractId;
    this.#client = client as unknown as Dynamic;
  }

  static async connect(contractId: string, operator: Keypair, rpcUrl = TESTNET_RPC_URL): Promise<PolicyCommitments> {
    const networkPassphrase = Networks.TESTNET;
    const client = await contract.Client.from({
      contractId,
      rpcUrl,
      networkPassphrase,
      publicKey: operator.publicKey(),
      ...contract.basicNodeSigner(operator, networkPassphrase),
    });
    return new PolicyCommitments(contractId, client);
  }

  /** Commits the terms for `escrow`. Returns the deal id (hex) and tx hash. */
  async commit(escrow: string, policy: Policy, parties: Parties): Promise<{ dealId: string; hash: string }> {
    const tx = await this.#client.commit!({ terms: toTerms(escrow, policy, parties) });
    const sent = await tx.signAndSend();
    return { dealId: hex(unwrap<Buffer>(sent.result)), hash: sent.sendTransactionResponse?.hash ?? '' };
  }

  async dealOf(escrow: string): Promise<string> {
    const tx = await this.#client.deal_of!({ escrow });
    return hex(unwrap<Buffer>(tx.result));
  }

  /** Read-only: the split the contract says is owed. */
  async distribute(dealId: string, why: PtkReason, at: number, balance: bigint): Promise<Distribution[]> {
    const tx = await this.#client.distribute!({
      deal_id: Buffer.from(dealId, 'hex'),
      reason: reason(why),
      at: BigInt(at),
      balance,
    });
    return unwrap<OnChainDistribution[]>(tx.result).map((d) => ({ address: d.address, amount: BigInt(d.amount) }));
  }

  /** Records the split on-chain, once, before it is sent to Trustless Work. */
  async settle(dealId: string, why: PtkReason, at: number, balance: bigint): Promise<{ distributions: Distribution[]; hash: string }> {
    const tx = await this.#client.settle!({
      deal_id: Buffer.from(dealId, 'hex'),
      reason: reason(why),
      at: BigInt(at),
      balance,
    });
    const sent = await tx.signAndSend();
    const settlement = unwrap<{ distributions: OnChainDistribution[] }>(sent.result);
    return {
      distributions: settlement.distributions.map((d) => ({ address: d.address, amount: BigInt(d.amount) })),
      hash: sent.sendTransactionResponse?.hash ?? '',
    };
  }
}

/** Contract methods returning `Result<T, Error>` surface as `Ok`/`Err` wrappers. */
function unwrap<T>(result: unknown): T {
  const r = result as { isOk?: () => boolean; unwrap?: () => T; unwrapErr?: () => { message?: string } };
  if (typeof r?.isOk === 'function') {
    if (!r.isOk()) throw new Error(`PTK error: ${JSON.stringify(r.unwrapErr?.())}`);
    return r.unwrap!();
  }
  return result as T;
}

function hex(bytes: Buffer | Uint8Array): string {
  return Buffer.from(bytes).toString('hex');
}
