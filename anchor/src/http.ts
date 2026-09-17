/** A non-2xx answer from an anchor endpoint, with the parsed body when there is one. */
export class AnchorError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly url: string,
    readonly body?: unknown,
  ) {
    super(message);
    this.name = 'AnchorError';
  }
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  /** SEP-10 JWT. */
  token?: string;
  /** Sent as JSON. */
  body?: unknown;
}

export async function request<T>(url: string, opts: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { accept: 'application/json' };
  if (opts.token) headers.authorization = `Bearer ${opts.token}`;
  if (opts.body !== undefined) headers['content-type'] = 'application/json';

  const res = await fetch(url, {
    method: opts.method ?? 'GET',
    headers,
    body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
  });
  const text = await res.text();
  const data = parseJson(text);

  if (!res.ok) {
    const reason = (data as { error?: string } | undefined)?.error ?? (text || res.statusText);
    throw new AnchorError(res.status, `${res.status} ${reason}`, url, data);
  }
  return data as T;
}

/** Builds `base?k=v&…`, dropping undefined values. */
export function withQuery(base: string, params: Record<string, string | number | undefined>): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) query.set(key, String(value));
  }
  const qs = query.toString();
  return qs ? `${base}?${qs}` : base;
}

function parseJson(text: string): unknown {
  if (!text) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}
