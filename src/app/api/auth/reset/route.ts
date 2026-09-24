import { ApiError, json, readJson, route } from '@/lib/api';
import { startSession } from '@/lib/auth';
import { tx } from '@/lib/db';
import { hashPassword, sha256 } from '@/lib/password';

export const POST = route(async ({ req }) => {
  const body = await readJson(req);
  const token = typeof body.token === 'string' ? body.token : '';
  const password = typeof body.password === 'string' ? body.password : '';
  if (password.length < 8) throw new ApiError(400, 'Password must be at least 8 characters');
  const userId = tx((db) => {
    const row = db.prepare("SELECT user_id FROM password_resets WHERE token_hash = ? AND used = 0 AND expires_at > datetime('now')").get(sha256(token)) as { user_id: number } | undefined;
    if (!row) throw new ApiError(400, 'This reset link is invalid or has expired. Request a new one.');
    db.prepare('UPDATE password_resets SET used = 1 WHERE token_hash = ?').run(sha256(token));
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hashPassword(password), row.user_id);
    db.prepare('DELETE FROM sessions WHERE user_id = ?').run(row.user_id);
    return row.user_id;
  });
  await startSession(userId);
  return json({ ok: true });
});
