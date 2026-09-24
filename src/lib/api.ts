import 'server-only';
import { NextResponse } from 'next/server';
import { getCurrentUser, type SessionUser } from './auth';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export const json = (data: unknown, status = 200) => NextResponse.json(data, { status });

/** Reject cross-site mutations: the Origin (or Referer) host must match the request host. */
function assertSameOrigin(req: Request) {
  const origin = req.headers.get('origin') ?? req.headers.get('referer');
  if (!origin) throw new ApiError(403, 'Missing origin');
  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host');
  let originHost: string;
  try {
    originHost = new URL(origin).host;
  } catch {
    throw new ApiError(403, 'Bad origin');
  }
  if (originHost !== host) throw new ApiError(403, 'Cross-site request blocked');
}

type Handler<C> = (ctx: { req: Request; user: SessionUser | null; params: C }) => Promise<Response> | Response;

/** Wraps a route handler: origin check on writes, optional auth, uniform JSON errors. */
export function route<C = Record<string, string>>(handler: Handler<C>, opts: { auth?: boolean } = {}) {
  return async (req: Request, context: { params: Promise<C> }) => {
    try {
      if (req.method !== 'GET' && req.method !== 'HEAD') assertSameOrigin(req);
      const user = await getCurrentUser();
      if (opts.auth && !user) throw new ApiError(401, 'Sign in to continue');
      const params = context?.params ? await context.params : ({} as C);
      return await handler({ req, user, params });
    } catch (err) {
      if (err instanceof ApiError) return json({ error: err.message }, err.status);
      console.error(err);
      return json({ error: 'Something went wrong on our side. Try again.' }, 500);
    }
  };
}

export async function readJson<T = Record<string, unknown>>(req: Request): Promise<T> {
  try {
    const body = await req.json();
    if (!body || typeof body !== 'object') throw new Error();
    return body as T;
  } catch {
    throw new ApiError(400, 'Invalid JSON body');
  }
}

export function str(v: unknown, field: string, { min = 0, max = 200 } = {}): string {
  const s = typeof v === 'string' ? v.trim() : '';
  if (s.length < min) throw new ApiError(400, min <= 1 ? `${field} is required` : `${field} must be at least ${min} characters`);
  if (s.length > max) throw new ApiError(400, `${field} must be ${max} characters or fewer`);
  return s;
}

export function intParam(v: unknown, field: string): number {
  const n = typeof v === 'number' ? v : Number(v);
  if (!Number.isInteger(n) || n <= 0) throw new ApiError(400, `Invalid ${field}`);
  return n;
}
