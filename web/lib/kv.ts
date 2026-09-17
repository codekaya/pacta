/**
 * Paylaşılan durum deposu.
 *
 * Yerelde bellek yeter; Vercel'de her istek başka bir örneğe düşebildiği için
 * ödeme ile varış onayı arasında anlaşma kaybolur. Upstash Redis (veya Vercel
 * KV, aynı REST API) env değişkenleri varsa oraya yazılır, yoksa belleğe.
 *
 * `Deal` içinde bigint alanlar var; JSON'a `{"$b":"…"}` olarak gider.
 */
const REST_URL = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
const REST_TOKEN = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;

export const kvConfigured = Boolean(REST_URL && REST_TOKEN);

const memory = (globalThis as typeof globalThis & { __pactaKv?: Map<string, string> }).__pactaKv ??= new Map();

function encode(value: unknown): string {
  return JSON.stringify(value, (_key, v) => (typeof v === 'bigint' ? { $b: v.toString() } : v));
}

function decode<T>(raw: string): T {
  return JSON.parse(raw, (_key, v) =>
    v && typeof v === 'object' && typeof (v as { $b?: unknown }).$b === 'string' ? BigInt((v as { $b: string }).$b) : v,
  ) as T;
}

async function command<T>(...args: (string | number)[]): Promise<T> {
  const res = await fetch(REST_URL!, {
    method: 'POST',
    headers: { authorization: `Bearer ${REST_TOKEN}`, 'content-type': 'application/json' },
    body: JSON.stringify(args.map(String)),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`KV ${args[0]} → ${res.status} ${await res.text()}`);
  return (await res.json()).result as T;
}

export async function kvGet<T>(key: string): Promise<T | undefined> {
  const raw = kvConfigured ? await command<string | null>('GET', key) : memory.get(key);
  return raw ? decode<T>(raw) : undefined;
}

export async function kvSet(key: string, value: unknown): Promise<void> {
  const raw = encode(value);
  if (kvConfigured) await command('SET', key, raw);
  else memory.set(key, raw);
}

export async function kvValues<T>(prefix: string): Promise<T[]> {
  if (!kvConfigured) {
    return [...memory.entries()].filter(([k]) => k.startsWith(prefix)).map(([, raw]) => decode<T>(raw));
  }
  const keys = await command<string[]>('KEYS', `${prefix}*`);
  if (keys.length === 0) return [];
  const values = await command<(string | null)[]>('MGET', ...keys);
  return values.filter((v): v is string => Boolean(v)).map((raw) => decode<T>(raw));
}

export async function kvPush(key: string, value: unknown): Promise<void> {
  const list = (await kvGet<unknown[]>(key)) ?? [];
  list.push(value);
  await kvSet(key, list);
}
