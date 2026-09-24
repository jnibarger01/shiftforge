'use client';

export class ClientApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

/** JSON fetch that surfaces the server's error message and bounces signed-out users to sign-in. */
export async function api<T = unknown>(url: string, opts: { method?: string; body?: unknown; form?: FormData } = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      method: opts.method ?? (opts.body || opts.form ? 'POST' : 'GET'),
      headers: opts.form ? undefined : { 'Content-Type': 'application/json' },
      body: opts.form ?? (opts.body === undefined ? undefined : JSON.stringify(opts.body)),
    });
  } catch {
    throw new ClientApiError(0, 'Network error — check your connection and try again.');
  }
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) {
    const next = window.location.pathname + window.location.search;
    window.location.href = `/signin?next=${encodeURIComponent(next)}`;
    throw new ClientApiError(401, data.error ?? 'Sign in to continue');
  }
  if (!res.ok) throw new ClientApiError(res.status, data.error ?? `Request failed (${res.status})`);
  return data as T;
}
