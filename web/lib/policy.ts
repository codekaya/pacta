/**
 * İptal politikası — Politika Taahhüt Kontratı'nın (PTK) TypeScript aynası.
 *
 * Bu dosyadaki `entitlement` ve `distribute`, contracts/policy içindeki Soroban
 * kontratıyla birebir aynı sonucu vermek zorundadır (parite vektörleri iki test dosyasında ortak). Hasta ödeme sayfası buradan
 * okur, Trustless Work'e giden `resolve-dispute` dağıtımları buradan üretilir,
 * kontrat ise aynı hesabı zincirde değiştirilemez biçimde taahhüt eder.
 * İkisi ayrışırsa Pacta taahhüt ettiği politikadan sapmış olur ve bu tespit edilebilir.
 */

export const BPS = 10_000n;
export const DAY_SECONDS = 86_400;

/** Klinik iptal ederse veya doğrulaması düşerse iade her zaman tamdır (spec §6.2). */
export const CLINIC_CANCEL_REFUND_BPS = 10_000;

export type Tier = {
  /** İşlem tarihine bu kadar veya daha fazla gün kalmışsa bu kademe geçerli. */
  minDaysBefore: number;
  /** Hastaya iade oranı, baz puan (10000 = %100). */
  refundBps: number;
};

export type Policy = {
  /** İşlem tarihi, unix saniye. */
  procedureDate: number;
  /** Kademeler; sıra önemsiz, hesap her zaman azalan `minDaysBefore` ile yapılır. */
  tiers: Tier[];
  /** Ajansın, klinikte kalan tutardan aldığı pay (baz puan). */
  agencyBps: number;
};

/** Hak edilen dağıtım, toplamı her zaman tam 10000 baz puan. */
export type Entitlement = {
  patientBps: number;
  clinicBps: number;
  agencyBps: number;
  /** Hangi kademenin uygulandığı — arayüzde vurgulamak için. */
  tier: Tier;
};

function byDaysDesc(tiers: readonly Tier[]): Tier[] {
  return [...tiers].sort((a, b) => b.minDaysBefore - a.minDaysBefore);
}

/** Bir kademenin kapanma anı: bu ana kadar (dahil) iptal edilirse kademe geçerli. */
export function tierCutoff(policy: Policy, tier: Tier): Date {
  return new Date((policy.procedureDate - tier.minDaysBefore * DAY_SECONDS) * 1000);
}

/**
 * `at` anında iptal edilirse tarafların hak ettiği baz puanlar.
 * İşlem tarihi geçmişse en dar kademe uygulanır.
 */
export function entitlement(policy: Policy, at: Date): Entitlement {
  const tiers = byDaysDesc(policy.tiers);
  if (tiers.length === 0) throw new Error('Policy needs at least one tier');

  const atSeconds = Math.floor(at.getTime() / 1000);
  const matched =
    tiers.find((tier) => atSeconds <= policy.procedureDate - tier.minDaysBefore * DAY_SECONDS) ??
    tiers[tiers.length - 1]!;

  return withRefundBps(policy, matched.refundBps, matched);
}

/** Hasta klinikte: iade yok, kapora klinik ve ajans arasında bölünür (PTK `Reason::Arrival`). */
export function arrivalEntitlement(policy: Policy): Entitlement {
  const narrowest = byDaysDesc(policy.tiers).at(-1)!;
  return withRefundBps(policy, 0, narrowest);
}

/** Klinik kaynaklı iptal: kademelere bakılmaz, iade tamdır. */
export function clinicCancelEntitlement(policy: Policy): Entitlement {
  const widest = byDaysDesc(policy.tiers)[0]!;
  return withRefundBps(policy, CLINIC_CANCEL_REFUND_BPS, widest);
}

function withRefundBps(policy: Policy, refundBps: number, tier: Tier): Entitlement {
  if (refundBps < 0 || refundBps > 10_000) throw new Error(`Invalid refund rate: ${refundBps}`);
  const retained = 10_000 - refundBps;
  // Artık kliniğe yazılır ki üç pay tam 10000'e toplansın.
  const agencyBps = Math.floor((retained * policy.agencyBps) / 10_000);
  return { patientBps: refundBps, clinicBps: retained - agencyBps, agencyBps, tier };
}

// ---------------------------------------------------------------- dağıtım

export type Parties = {
  patient: string;
  clinic: string;
  /** Ajans yoksa payı kliniğe eklenir. */
  agency?: string;
};

export type Distribution = { address: string; amount: bigint };

/**
 * Trustless Work `resolve-dispute` için dağıtım listesi.
 *
 * İki sert kural var (TW hata listesi):
 *   1. Toplam, o anki escrow bakiyesine **tam** eşit olmalı.
 *   2. Hiçbir tutar sıfır veya negatif olamaz — payı olmayan taraf listeye yazılmaz.
 *
 * Bu yüzden iki pay taban bölmeyle hesaplanır, artık üçüncüye verilir. Artık
 * hastanın payı varsa hastaya gider (FR-4: yuvarlama hasta lehine), yoksa kliniğe.
 */
export function distribute(balance: bigint, e: Entitlement, parties: Parties): Distribution[] {
  if (balance <= 0n) throw new Error('Balance to distribute must be positive');

  const agencyBps = parties.agency ? BigInt(e.agencyBps) : 0n;
  const clinicBps = BigInt(e.clinicBps) + (parties.agency ? 0n : BigInt(e.agencyBps));

  const agency = (balance * agencyBps) / BPS;
  let patient: bigint;
  let clinic: bigint;

  if (e.patientBps > 0) {
    clinic = (balance * clinicBps) / BPS;
    patient = balance - agency - clinic; // artık hastaya
  } else {
    patient = 0n;
    clinic = balance - agency; // artık kliniğe
  }

  const rows: Distribution[] = [
    { address: parties.patient, amount: patient },
    { address: parties.clinic, amount: clinic },
    ...(parties.agency ? [{ address: parties.agency, amount: agency }] : []),
  ].filter((row) => row.amount > 0n);

  const total = rows.reduce((sum, row) => sum + row.amount, 0n);
  if (total !== balance) {
    throw new Error(`Distributions must sum to the balance: ${total} ≠ ${balance}`);
  }
  return rows;
}

// ---------------------------------------------------------------- görüntüleme

export type PolicyRow = {
  refundBps: number;
  /** Kademenin başladığı an; en geniş kademede null ("şimdiden itibaren"). */
  from: Date | null;
  /** Kademenin kapandığı an; en dar kademede null ("işlem tarihine kadar"). */
  until: Date | null;
  tier: Tier;
};

/**
 * Politikayı hastanın anlayacağı satırlara çevirir: yüzde değil, takvim aralığı
 * ve para tutarı (FR-7). Satırlar en cömert kademeden en dara doğru sıralı.
 */
export function policyRows(policy: Policy): PolicyRow[] {
  const tiers = byDaysDesc(policy.tiers);
  return tiers.map((tier, index) => {
    const previous = index > 0 ? tiers[index - 1] : undefined;
    const isLast = index === tiers.length - 1;
    return {
      refundBps: tier.refundBps,
      from: previous ? tierCutoff(policy, previous) : null,
      until: isLast ? null : tierCutoff(policy, tier),
      tier,
    };
  });
}

/** Oranı tutara uygular; gösterim için (kuruş/cent cinsinden tam sayı). */
export function applyBps(amount: number, bps: number): number {
  return Math.floor((amount * bps) / 10_000);
}

// ---------------------------------------------------------------- doğrulama

/** Kontrattaki `MAX_TIERS` ile aynı olmak zorunda. */
export const MAX_TIERS = 8;

export type PolicyIssue = { field: string; message: string };

/**
 * `contracts/policy/src/lib.rs` içindeki `check_terms`'ün aynası.
 *
 * Buradan geçemeyen bir politika zincirde `commit` tarafından reddedilir — ama
 * o noktada klinik hastaya çoktan bir fiyat söylemiş olur. Ucuz olduğu tek yer
 * form. Sıra ve mesaj, kontratın hata listesini (error.rs) izler.
 */
export function validatePolicy(policy: Policy, parties: Parties, now: Date): PolicyIssue[] {
  const issues: PolicyIssue[] = [];
  const tiers = policy.tiers;

  if (tiers.length === 0) {
    issues.push({ field: 'tiers', message: 'A schedule needs at least one row.' });
  }
  if (tiers.length > MAX_TIERS) {
    issues.push({ field: 'tiers', message: `At most ${MAX_TIERS} rows; this has ${tiers.length}.` });
  }
  if (policy.agencyBps < 0 || policy.agencyBps > 10_000) {
    issues.push({ field: 'agencyBps', message: 'The agency share must be between 0% and 100%.' });
  }

  const seen = new Set<number>();
  for (const tier of tiers) {
    if (tier.refundBps < 0 || tier.refundBps > 10_000) {
      issues.push({ field: 'tiers', message: 'Every refund must be between 0% and 100%.' });
    }
    if (tier.minDaysBefore < 0) {
      issues.push({ field: 'tiers', message: 'A row cannot start after the procedure date.' });
    }
    if (seen.has(tier.minDaysBefore)) {
      issues.push({
        field: 'tiers',
        message: `Two rows both start ${tier.minDaysBefore} days before. Each row needs its own cutoff.`,
      });
    }
    seen.add(tier.minDaysBefore);
  }

  // Kontratın umursamadığı ama hastaya gösterilemeyecek bir şey: geç iptal
  // etmenin erken iptal etmekten cömert olması. Neredeyse her zaman giriş hatası.
  const ordered = byDaysDesc(tiers);
  for (let i = 1; i < ordered.length; i += 1) {
    if (ordered[i]!.refundBps > ordered[i - 1]!.refundBps) {
      issues.push({
        field: 'tiers',
        message: 'Cancelling later cannot refund more than cancelling earlier.',
      });
      break;
    }
  }

  if (policy.procedureDate * 1000 <= now.getTime()) {
    issues.push({ field: 'procedureDate', message: 'The procedure date must be in the future.' });
  }

  if (parties.patient === parties.clinic || parties.agency === parties.patient || parties.agency === parties.clinic) {
    issues.push({ field: 'parties', message: 'Patient, clinic and agency must be different accounts.' });
  }

  return issues;
}
