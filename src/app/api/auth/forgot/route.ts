import { json, readJson, route } from '@/lib/api';
import { getDb } from '@/lib/db';
import { newToken } from '@/lib/password';
import { clientIp, rateLimit } from '@/lib/rate-limit';

/**
 * Issues a one-hour reset link. No email provider is configured, so the link is written to the
 * server log; outside production it is also returned so the flow can be completed locally.
 */
export const POST = route(async ({ req }) => {
  rateLimit(`forgot:${clientIp(req)}`, 5);
  const body = await readJson(req);
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const db = getDb();
  const user = db.prepare('SELECT id FROM users WHERE email = ?').get(email) as { id: number } | undefined;
  let resetUrl: string | undefined;
  if (user) {
    const { token, hash } = newToken();
    db.prepare("INSERT INTO password_resets (token_hash, user_id, expires_at) VALUES (?, ?, datetime('now', '+1 hour'))").run(hash, user.id);
    resetUrl = `${new URL(req.url).origin}/reset-password?token=${token}`;
    console.info(`[auth] password reset link for user ${user.id}: ${resetUrl}`);
  }
  // Same response whether or not the account exists, so emails cannot be enumerated.
  return json({ ok: true, ...(process.env.NODE_ENV !== 'production' && resetUrl ? { devResetUrl: resetUrl } : {}) });
});
