/**
 * Escrow hattı: bir anlaşmanın para tarafını yürüten tek yer.
 *
 * TW_API_KEY ve PACTA_POLICY_CONTRACT ayarlı ve demo cüzdanları varsa **canlı**:
 * Trustless Work single-release escrow + Politika Taahhüt Kontratı, testnet'te.
 * Aksi halde **simüle**: aynı politika hesabı, zincire gitmeden. Sayfa hangisinin
 * çalıştığını her zaman açıkça söyler.
 */
import { Asset, Horizon, TransactionBuilder, Networks, type Keypair } from '@stellar/stellar-sdk';
import type { Deal, Receipt, Settlement, SettlementReason } from './deals';
import { formatUsdc, parseUsdc } from './money';
import {
  arrivalEntitlement,
  clinicCancelEntitlement,
  distribute,
  entitlement,
  type Distribution,
  type Entitlement,
} from './policy';
import { PolicyCommitments, type PtkReason } from './ptk';
import { TESTNET_USDC, TrustlessWork, type SignXdr } from './trustless';
import { demoWallets, type DemoWallets } from './wallets';

const horizon = new Horizon.Server('https://horizon-testnet.stellar.org');
const USDC = new Asset(TESTNET_USDC.symbol, TESTNET_USDC.address);

/** Testnet escrow scale: the mock anchor caps single transfers, so live demos lock 1:100. */
const LIVE_SCALE_DIVISOR = 100n;

type Live = { tw: TrustlessWork; ptk: PolicyCommitments; w: DemoWallets };

export function escrowMode(): 'live' | 'simulated' {
  return process.env.TW_API_KEY && process.env.PACTA_POLICY_CONTRACT && demoWallets() ? 'live' : 'simulated';
}

let liveClient: Promise<Live> | undefined;
function live(): Promise<Live> {
  liveClient ??= (async () => {
    const w = demoWallets()!;
    return {
      w,
      tw: new TrustlessWork(process.env.TW_API_KEY!, process.env.TW_API_URL || undefined),
      ptk: await PolicyCommitments.connect(process.env.PACTA_POLICY_CONTRACT!, w.pactaRelease),
    };
  })();
  return liveClient;
}

const now = () => Math.floor(Date.now() / 1000);

function signer(keypair: Keypair): SignXdr {
  return async (xdr) => {
    const tx = TransactionBuilder.fromXDR(xdr, Networks.TESTNET);
    tx.sign(keypair);
    return tx.toXDR();
  };
}

/** PTK rejects settlement times ahead of the ledger, so live settlements use ledger time. */
async function ledgerNow(): Promise<number> {
  const [ledger] = (await horizon.ledgers().order('desc').limit(1).call()).records;
  return Math.floor(Date.parse(ledger!.closed_at) / 1000);
}

/**
 * Trustless Work answers a short patient wallet with a 400 mid-flow, after the
 * escrow is already deployed. Checking first keeps a demo from breaking halfway.
 */
async function assertFunded(address: string, needed: bigint): Promise<void> {
  const account = await horizon.loadAccount(address);
  const line = account.balances.find(
    (b) => 'asset_code' in b && b.asset_code === USDC.getCode() && b.asset_issuer === USDC.getIssuer(),
  );
  const have = line ? parseUsdc(line.balance) : 0n;
  if (have >= needed) return;
  throw new Error(
    `Patient wallet holds ${formatUsdc(have)} USDC, needs ${formatUsdc(needed)}. ` +
      'Run "npm run tw -- topup" to recycle the demo balances.',
  );
}

function receipt(label: string, hash?: string): Receipt {
  return { label, at: now(), ...(hash ? { hash } : {}) };
}

function owedFor(deal: Deal, reason: SettlementReason, at: Date): Entitlement {
  if (reason === 'clinic-cancel') return clinicCancelEntitlement(deal.policy);
  if (reason === 'arrival') return arrivalEntitlement(deal.policy);
  return entitlement(deal.policy, at);
}

function settlementOf(reason: SettlementReason, at: number, owed: Entitlement, rows: Distribution[]): Settlement {
  return {
    at,
    reason,
    patientBps: owed.patientBps,
    distributions: rows.map((row) => ({ address: row.address, amount: formatUsdc(row.amount) })),
  };
}

const PTK_REASON: Record<SettlementReason, PtkReason> = {
  arrival: 'Arrival',
  'patient-cancel': 'PatientCancel',
  'clinic-cancel': 'ClinicCancel',
};

// ---------------------------------------------------------------- steps

/** Patient pays: deploy the escrow, commit the policy, fund. */
export async function lock(deal: Deal): Promise<Deal> {
  if (escrowMode() === 'simulated') {
    return { ...deal, mode: 'simulated', status: 'funded', fundedAt: now(), receipts: [receipt('Deposit held (simulated)')] };
  }

  const { tw, ptk, w } = await live();
  const parties = { patient: w.patient.publicKey(), clinic: w.clinic.publicKey(), agency: w.agency.publicKey() };
  const amount = deal.escrowAmount / LIVE_SCALE_DIVISOR;
  await assertFunded(parties.patient, amount);
  const receipts: Receipt[] = [];

  const deployed = await tw.deploy(
    {
      engagementId: `${deal.id}-${now()}`,
      title: `Pacta deposit — ${deal.clinic.name}`,
      description: `${deal.procedure}. Held until arrival; cancellations follow the committed policy.`,
      roles: {
        approver: parties.patient,
        serviceProvider: parties.clinic,
        platformAddress: w.pactaRelease.publicKey(),
        releaseSigner: w.pactaRelease.publicKey(),
        disputeResolver: w.pactaResolver.publicKey(),
        receiver: parties.clinic,
      },
      amount,
      platformFee: 0,
      milestones: [{ description: 'Patient arrived at clinic' }],
    },
    signer(w.pactaRelease),
    w.pactaRelease.publicKey(),
  );
  const escrowContractId = deployed.contractId;
  if (!escrowContractId) throw new Error('Trustless Work deploy returned no contract id');
  receipts.push(receipt('Escrow deployed on Trustless Work', deployed.hash));

  const committed = await ptk.commit(escrowContractId, deal.policy, parties);
  receipts.push(receipt('Cancellation policy committed', committed.hash));

  const funded = await tw.fund(escrowContractId, amount, signer(w.patient), w.patient.publicKey());
  receipts.push(receipt(`${formatUsdc(amount)} USDC locked`, funded.hash));

  return {
    ...deal,
    mode: 'live',
    parties,
    status: 'funded',
    fundedAt: now(),
    escrowContractId,
    lockedAmount: amount,
    policyDealId: committed.dealId,
    receipts,
  };
}

/** Clinic checks the patient in (TW serviceProvider marks the milestone). */
export async function markArrived(deal: Deal): Promise<Deal> {
  const receipts = [...(deal.receipts ?? [])];
  if (deal.mode === 'live' && deal.escrowContractId) {
    const { tw, w } = await live();
    const sent = await tw.markMilestone(deal.escrowContractId, 0, 'Arrived', 'Checked in at front desk', signer(w.clinic), w.clinic.publicKey());
    receipts.push(receipt('Clinic marked arrival', sent.hash));
  } else {
    receipts.push(receipt('Clinic marked arrival (simulated)'));
  }
  return { ...deal, status: 'arrived', arrivedAt: now(), receipts };
}

/** Patient confirms, Pacta records the split and releases. */
export async function release(deal: Deal): Promise<Deal> {
  const owed = arrivalEntitlement(deal.policy);
  const receipts = [...(deal.receipts ?? [])];

  if (deal.mode !== 'live' || !deal.escrowContractId || !deal.policyDealId) {
    const rows = distribute(deal.escrowAmount, owed, deal.parties);
    receipts.push(receipt('Deposit released (simulated)'));
    return { ...deal, status: 'released', receipts, settlement: settlementOf('arrival', now(), owed, rows) };
  }

  const { tw, ptk, w } = await live();
  const approved = await tw.approveMilestone(deal.escrowContractId, 0, signer(w.patient), w.patient.publicKey());
  receipts.push(receipt('Patient confirmed arrival', approved.hash));

  const balance = await tw.balance(deal.escrowContractId);
  const at = await ledgerNow();
  const recorded = await ptk.settle(deal.policyDealId, 'Arrival', at, balance);
  receipts.push(receipt('Split recorded on policy contract', recorded.hash));

  const released = await tw.release(deal.escrowContractId, signer(w.pactaRelease), w.pactaRelease.publicKey());
  receipts.push(receipt('Escrow released to clinic', released.hash));

  return { ...deal, status: 'released', receipts, settlement: settlementOf('arrival', at, owed, recorded.distributions) };
}

/**
 * Cancellation. Simulated mode may evaluate the tiers at a preview time;
 * live mode always uses ledger time — the policy contract refuses anything else.
 */
export async function cancel(deal: Deal, reason: Exclude<SettlementReason, 'arrival'>, previewAt?: Date): Promise<Deal> {
  const receipts = [...(deal.receipts ?? [])];

  if (deal.mode !== 'live' || !deal.escrowContractId || !deal.policyDealId) {
    const at = previewAt ?? new Date();
    const owed = owedFor(deal, reason, at);
    const rows = distribute(deal.escrowAmount, owed, deal.parties);
    receipts.push(receipt('Cancellation settled (simulated)'));
    return {
      ...deal,
      status: 'refunded',
      receipts,
      settlement: settlementOf(reason, Math.floor(at.getTime() / 1000), owed, rows),
    };
  }

  const { tw, ptk, w } = await live();
  // Release signer may raise a dispute, so the patient signs nothing here.
  const disputed = await tw.dispute(deal.escrowContractId, signer(w.pactaRelease), w.pactaRelease.publicKey());
  receipts.push(receipt('Cancellation opened', disputed.hash));

  const balance = await tw.balance(deal.escrowContractId);
  const at = await ledgerNow();
  const owed = owedFor(deal, reason, new Date(at * 1000));
  const local = distribute(balance, owed, deal.parties);
  const recorded = await ptk.settle(deal.policyDealId, PTK_REASON[reason], at, balance);
  if (!sameRows(local, recorded.distributions)) {
    throw new Error('Policy contract and policy.ts disagree — refusing to resolve');
  }
  receipts.push(receipt('Split recorded on policy contract', recorded.hash));

  const resolved = await tw.resolve(deal.escrowContractId, recorded.distributions, signer(w.pactaResolver), w.pactaResolver.publicKey());
  receipts.push(receipt('Escrow paid out per policy', resolved.hash));

  return { ...deal, status: 'refunded', receipts, settlement: settlementOf(reason, at, owed, recorded.distributions) };
}

function sameRows(a: Distribution[], b: Distribution[]): boolean {
  return a.length === b.length && a.every((row, i) => row.address === b[i]!.address && row.amount === b[i]!.amount);
}

export const LIVE_SCALE = Number(LIVE_SCALE_DIVISOR);
