import { ApiError } from './api';

const buckets = new Map<string, { count: number; reset: number }>();

/** Fixed-window limiter, in memory per server process. Enough to blunt password guessing. */
export function rateLimit(key: string, limit = 10, windowMs = 10 * 60 * 1000) {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.reset < now) {
    buckets.set(key, { count: 1, reset: now + windowMs });
    return;
  }
  b.count++;
  if (b.count > limit) throw new ApiError(429, 'Too many attempts. Wait a few minutes and try again.');
}

export function clientIp(req: Request) {
  return req.headers.get('x-forwarded-for')?.split(',')[0].trim() || req.headers.get('x-real-ip') || 'local';
}
