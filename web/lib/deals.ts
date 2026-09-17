import type { Parties, Policy } from './policy';
import { parseUsdc } from './money';

/** created → funded → arrived (klinik işaretledi) → released; funded → refunded. */
export type DealStatus = 'created' | 'funded' | 'arrived' | 'released' | 'refunded';

/** Zincirde iz bırakan her adım — sayfada explorer linki olarak gösterilir. */
export type Receipt = {
  label: string;
  at: number;
  /** Stellar işlem hash'i, varsa. */
  hash?: string;
};

/** Kliniğin anchor üzerinden TL çekimi. */
export type Withdrawal = {
  id: string;
  at: number;
  usdc: string;
  tl: string;
  rate: string;
  stellarTx?: string;
  bankRef?: string;
  status: string;
};

export type SettlementReason = 'patient-cancel' | 'clinic-cancel' | 'arrival';

/** Kapanan bir anlaşmanın uygulanmış dağıtımı — politikanın ne hesapladığının kaydı. */
export type Settlement = {
  at: number;
  reason: SettlementReason;
  patientBps: number;
  /** Tutarlar taban birim, string olarak (bigint sunucu-istemci sınırını geçemez). */
  distributions: { address: string; amount: string }[];
};

export type Clinic = {
  id: string;
  name: string;
  city: string;
  /** Sağlık Bakanlığı sağlık turizmi yetki belgesi numarası. */
  licenseNo: string;
  /**
   * v1'de statik liste — canlı Bakanlık sorgusu değil ve demoda açıkça böyle söylenir.
   * Doğrulama katmanı yol haritasında Faz 2.
   */
  verified: boolean;
  verifiedAt: number;
};

export type Deal = {
  id: string;
  clinic: Clinic;
  agencyName?: string;
  procedure: string;
  /** Hastanın ödediği kapora, cent cinsinden — gösterim için yetkili kaynak. */
  depositEurCents: number;
  /** Escrow'daki USDC, taban birim — zincire giden her hesap için yetkili kaynak. */
  escrowAmount: bigint;
  policy: Policy;
  parties: Parties;
  status: DealStatus;
  /** `live`: gerçek TW escrow + PTK; `simulated`: yalnızca durum geçişi. Fonlanınca belirlenir. */
  mode?: 'live' | 'simulated';
  /** Trustless Work escrow kontrat adresi; anlaşma fonlanınca dolar. */
  escrowContractId?: string;
  /** Canlı modda escrow'a gerçekten kilitlenen tutar (testnet ölçeği), taban birim. */
  lockedAmount?: bigint;
  /** PTK'daki anlaşma kimliği (hex). */
  policyDealId?: string;
  fundedAt?: number;
  /** Kliniğin "hasta geldi" işareti. */
  arrivedAt?: number;
  receipts?: Receipt[];
  /** Son işlemin hatası; sayfada gösterilir, bir sonraki denemede silinir. */
  error?: string;
  settlement?: Settlement;
  createdAt: number;
};

/**
 * Anlaşma deposu. Şimdilik bellekte; TW hattı bağlanınca bu arayüzün arkası
 * `get-escrows-by-role` + PTK okuması olacak. Sayfalar yalnızca bu arayüzü görür.
 */
export interface DealStore {
  get(id: string): Promise<Deal | undefined>;
  list(): Promise<Deal[]>;
  save(deal: Deal): Promise<void>;
}

const DEMO_CLINIC: Clinic = {
  id: 'cl-estetikistanbul',
  name: 'Estetik Istanbul',
  city: 'Istanbul',
  licenseNo: 'STB-34-2024-1187',
  verified: true,
  verifiedAt: Date.parse('2026-03-02T00:00:00+03:00') / 1000,
};

/**
 * Demo anlaşması. İşlem tarihi sabit tutuldu ki kademe sınırları demoda
 * öngörülebilir olsun; sayfada `?at=` ile herhangi bir an canlandırılabilir.
 */
const DEMO_DEAL: Deal = {
  id: 'd-8f3a91',
  clinic: DEMO_CLINIC,
  agencyName: 'MedTravel Partners',
  procedure: 'Six implants, zirconia crowns',
  depositEurCents: 80_000,
  escrowAmount: parseUsdc('869.5652174'),
  policy: {
    procedureDate: Date.parse('2026-10-28T09:00:00+03:00') / 1000,
    tiers: [
      { minDaysBefore: 14, refundBps: 10_000 },
      { minDaysBefore: 7, refundBps: 5_000 },
      { minDaysBefore: 0, refundBps: 0 },
    ],
    agencyBps: 1_000,
  },
  parties: {
    patient: 'GDTYKTIOZET7VWU3MDS63Q3WVM6FDPFJXNL24RP4557VYLWKGZWPVJ6I',
    clinic: 'GBT4C6XHO4ZASHF674CIKIHDZWPLH6BKR3BKHC72FVV5MZDFOGTRLCPJ',
    agency: 'GCVEJZMXHOTH55XGZGWTASXFGBQOFRG2DMWVMY57GUV6UQJES2ZWRVWG',
  },
  status: 'created',
  createdAt: Date.parse('2026-09-16T14:20:00+03:00') / 1000,
};

/** Survives HMR. Bump SEED when demo fixture copy changes. */
const SEED = 4;
const globalForDeals = globalThis as typeof globalThis & {
  __pactaDeals?: Map<string, Deal>;
  __pactaSeed?: number;
};

function table(): Map<string, Deal> {
  if (globalForDeals.__pactaSeed !== SEED) {
    globalForDeals.__pactaDeals = new Map([[DEMO_DEAL.id, { ...DEMO_DEAL }]]);
    globalForDeals.__pactaSeed = SEED;
  }
  globalForDeals.__pactaDeals ??= new Map([[DEMO_DEAL.id, { ...DEMO_DEAL }]]);
  return globalForDeals.__pactaDeals;
}

export const dealStore: DealStore = {
  async get(id) {
    return table().get(id);
  },
  async list() {
    return [...table().values()].sort((a, b) => b.createdAt - a.createdAt);
  },
  async save(deal) {
    table().set(deal.id, deal);
  },
};

export const DEMO_DEAL_ID = DEMO_DEAL.id;

/** Demo fikstürünün ilk hali — sıfırlarken tarih ve taraflar buradan türetilir. */
export function demoDealTemplate(): Deal {
  return { ...DEMO_DEAL, policy: { ...DEMO_DEAL.policy }, parties: { ...DEMO_DEAL.parties } };
}

const globalForWithdrawals = globalThis as typeof globalThis & { __pactaWithdrawals?: Withdrawal[] };

export const withdrawalStore = {
  async list(): Promise<Withdrawal[]> {
    return [...(globalForWithdrawals.__pactaWithdrawals ?? [])].sort((a, b) => b.at - a.at);
  },
  async add(w: Withdrawal): Promise<void> {
    (globalForWithdrawals.__pactaWithdrawals ??= []).push(w);
  },
};
