import { randomBytes } from 'node:crypto';

import type { Parties, Policy } from './policy';
import { parseUsdc } from './money';
import { kvGet, kvPush, kvSet, kvValues } from './kv';

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
  create(input: NewDeal): Promise<Deal>;
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

/**
 * Klinik kütüğü. v1'de tek kayıt, ama anlaşma artık kliniği kimliğiyle taşıyor;
 * klinik kaydı (onboarding) geldiğinde bu haritanın arkası veritabanı olur ve
 * çağıran hiçbir yer değişmez.
 */
const CLINICS: Record<string, Clinic> = { [DEMO_CLINIC.id]: DEMO_CLINIC };

export function clinicById(id: string): Clinic | undefined {
  return CLINICS[id];
}

export function clinics(): Clinic[] {
  return Object.values(CLINICS);
}

/**
 * Bildirim linki hastanın tek kimliği — oturum yok, parola yok. Yani id
 * tahmin edilebilir olmamalı: demo fikstürünün `d-8f3a91`'i altı hex, denenerek
 * bulunur. Üretilen her anlaşma 128 bit rastgelelik taşır.
 */
export function newDealId(): string {
  return `d-${randomBytes(16).toString('base64url')}`;
}

/** Kliniğin formda doldurduğu her şey. Taraflar çağıranın sorumluluğunda. */
export type NewDeal = {
  clinicId: string;
  procedure: string;
  depositEurCents: number;
  /** Escrow'a kilitlenecek USDC, taban birim. */
  escrowAmount: bigint;
  policy: Policy;
  parties: Parties;
  agencyName?: string;
};

/** Bump when the demo fixture copy changes, so stored deals are reseeded. */
const SEED = 5;
const key = (id: string) => `pacta:${SEED}:deal:${id}`;
const DEAL_PREFIX = `pacta:${SEED}:deal:`;

export const dealStore: DealStore = {
  async get(id) {
    const stored = await kvGet<Deal>(key(id));
    if (stored) return stored;
    // First read of a fresh store: hand back the demo fixture.
    if (id !== DEMO_DEAL.id) return undefined;
    await kvSet(key(DEMO_DEAL.id), DEMO_DEAL);
    return { ...DEMO_DEAL };
  },
  async list() {
    const deals = await kvValues<Deal>(DEAL_PREFIX);
    if (deals.length === 0) {
      await kvSet(key(DEMO_DEAL.id), DEMO_DEAL);
      return [{ ...DEMO_DEAL }];
    }
    return deals.sort((a, b) => b.createdAt - a.createdAt);
  },
  async save(deal) {
    await kvSet(key(deal.id), deal);
  },
  async create(input) {
    const clinic = clinicById(input.clinicId);
    if (!clinic) throw new Error(`Unknown clinic: ${input.clinicId}`);
    const deal: Deal = {
      id: newDealId(),
      clinic,
      agencyName: input.agencyName,
      procedure: input.procedure,
      depositEurCents: input.depositEurCents,
      escrowAmount: input.escrowAmount,
      policy: input.policy,
      parties: input.parties,
      status: 'created',
      createdAt: Math.floor(Date.now() / 1000),
    };
    await kvSet(key(deal.id), deal);
    return deal;
  },
};

export const DEMO_DEAL_ID = DEMO_DEAL.id;

/** Demo fikstürünün ilk hali — sıfırlarken tarih ve taraflar buradan türetilir. */
export function demoDealTemplate(): Deal {
  return { ...DEMO_DEAL, policy: { ...DEMO_DEAL.policy }, parties: { ...DEMO_DEAL.parties } };
}

const WITHDRAWALS_KEY = `pacta:${SEED}:withdrawals`;

export const withdrawalStore = {
  async list(): Promise<Withdrawal[]> {
    return ((await kvGet<Withdrawal[]>(WITHDRAWALS_KEY)) ?? []).sort((a, b) => b.at - a.at);
  },
  async add(w: Withdrawal): Promise<void> {
    await kvPush(WITHDRAWALS_KEY, w);
  },
};
