import { Asset, BASE_FEE, Horizon, Keypair, Memo, Operation, TransactionBuilder, type xdr } from '@stellar/stellar-sdk';
import type { NetworkConfig } from './config.js';

/** The on-chain half of a ramp: funding, trustlines, balances, payments. */
export class Chain {
  readonly horizon: Horizon.Server;

  constructor(readonly network: NetworkConfig) {
    this.horizon = new Horizon.Server(network.horizonUrl);
  }

  async exists(address: string): Promise<boolean> {
    try {
      await this.horizon.loadAccount(address);
      return true;
    } catch (err) {
      if (httpStatus(err) === 404) return false;
      throw err;
    }
  }

  async fundWithFriendbot(address: string): Promise<void> {
    if (!this.network.friendbotUrl) throw new Error(`no friendbot on ${this.network.name}`);
    const res = await fetch(`${this.network.friendbotUrl}?addr=${encodeURIComponent(address)}`);
    if (!res.ok) throw new Error(`friendbot ${res.status}: ${await res.text()}`);
  }

  /** XLM when `asset` is omitted; `null` when the account has no trustline to `asset`. */
  async balance(address: string, asset?: Asset): Promise<string | null> {
    const account = await this.horizon.loadAccount(address);
    const line = account.balances.find((b) =>
      !asset || asset.isNative()
        ? b.asset_type === 'native'
        : 'asset_code' in b && b.asset_code === asset.getCode() && b.asset_issuer === asset.getIssuer(),
    );
    return line ? line.balance : null;
  }

  /** Adds the trustline if missing. Returns the tx hash, or null if it already existed. */
  async ensureTrustline(keypair: Keypair, asset: Asset): Promise<string | null> {
    if ((await this.balance(keypair.publicKey(), asset)) !== null) return null;
    return this.submit(keypair, Operation.changeTrust({ asset }));
  }

  pay(keypair: Keypair, to: { destination: string; asset: Asset; amount: string; memo?: Memo }): Promise<string> {
    return this.submit(
      keypair,
      Operation.payment({ destination: to.destination, asset: to.asset, amount: to.amount }),
      to.memo,
    );
  }

  txUrl(hash: string): string {
    return `${this.network.explorerUrl}/tx/${hash}`;
  }

  accountUrl(address: string): string {
    return `${this.network.explorerUrl}/account/${address}`;
  }

  private async submit(keypair: Keypair, op: xdr.Operation, memo: Memo = Memo.none()): Promise<string> {
    const source = await this.horizon.loadAccount(keypair.publicKey());
    const tx = new TransactionBuilder(source, { fee: BASE_FEE, networkPassphrase: this.network.passphrase })
      .addOperation(op)
      .addMemo(memo)
      .setTimeout(60)
      .build();
    tx.sign(keypair);
    try {
      return (await this.horizon.submitTransaction(tx)).hash;
    } catch (err) {
      const codes = (err as { response?: { data?: { extras?: { result_codes?: unknown } } } }).response?.data?.extras
        ?.result_codes;
      throw codes ? new Error(`transaction failed: ${JSON.stringify(codes)}`) : err;
    }
  }
}

/** The memo an anchor asks for in a SEP-6 withdraw response. Hash memos arrive base64-encoded. */
export function anchorMemo(type?: string, value?: string): Memo {
  if (!type || value === undefined) return Memo.none();
  switch (type) {
    case 'id':
      return Memo.id(value);
    case 'text':
      return Memo.text(value);
    case 'hash': {
      const hex = Array.from(atob(value), (c) => c.charCodeAt(0).toString(16).padStart(2, '0')).join('');
      return Memo.hash(hex);
    }
    default:
      throw new Error(`unsupported memo_type "${type}"`);
  }
}

function httpStatus(err: unknown): number | undefined {
  return (err as { response?: { status?: number } }).response?.status;
}
