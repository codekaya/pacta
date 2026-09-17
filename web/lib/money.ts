/** USDC on Stellar has 7 decimals; every on-chain amount is stored in base units. */
export const USDC_DECIMALS = 7;
const SCALE = 10n ** BigInt(USDC_DECIMALS);

const DATES = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

const DATES_LONG = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

/** "869.5652174" → 8695652174n */
export function parseUsdc(value: string): bigint {
  const [whole = '0', frac = ''] = value.trim().split('.');
  if (frac.length > USDC_DECIMALS) {
    throw new Error(`USDC accepts at most ${USDC_DECIMALS} decimal places: ${value}`);
  }
  return BigInt(whole) * SCALE + BigInt(frac.padEnd(USDC_DECIMALS, '0') || '0');
}

/** 8695652174n → "869.5652174" (trailing zeros stripped) */
export function formatUsdc(amount: bigint): string {
  const sign = amount < 0n ? '-' : '';
  const abs = amount < 0n ? -amount : amount;
  const frac = (abs % SCALE).toString().padStart(USDC_DECIMALS, '0').replace(/0+$/, '');
  return `${sign}${abs / SCALE}${frac ? `.${frac}` : ''}`;
}

export function formatUsdcDisplay(amount: bigint): string {
  const n = Number(amount) / Number(SCALE);
  return new Intl.NumberFormat('en-GB', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

export function formatEur(cents: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}

export function formatDate(at: Date): string {
  return DATES.format(at);
}

export function formatDateLong(at: Date): string {
  return DATES_LONG.format(at);
}

export function formatDateTime(at: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(at);
}
