import { ApiError, json, readJson, route } from '@/lib/api';
import { startSession } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { verifyPassword } from '@/lib/password';
import { clientIp, rateLimit } from '@/lib/rate-limit';

export const POST = route(async ({ req }) => {
  const body = await readJson(req);
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  if (!email || !password) throw new ApiError(400, 'Enter your email and password');
  rateLimit(`signin:${clientIp(req)}:${email}`, 10);
  const row = getDb().prepare('SELECT id, password_hash FROM users WHERE email = ?').get(email) as { id: number; password_hash: string } | undefined;
  if (!row || !verifyPassword(password, row.password_hash)) throw new ApiError(401, 'Email or password is incorrect');
  await startSession(row.id);
  return json({ ok: true });
});
