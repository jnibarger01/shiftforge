import { ApiError, json, readJson, route, str } from '@/lib/api';
import { getDb } from '@/lib/db';
import { hashPassword, verifyPassword } from '@/lib/password';

export const PATCH = route(
  async ({ req, user }) => {
    const body = await readJson(req);
    const name = str(body.name, 'Name', { min: 2, max: 40 });
    const bio = str(body.bio ?? '', 'Bio', { max: 280 });
    const location = str(body.location ?? '', 'Location', { max: 60 });
    const db = getDb();
    db.prepare('UPDATE users SET name = ?, bio = ?, location = ?, women_builder = ? WHERE id = ?').run(name, bio, location, body.womenBuilder ? 1 : 0, user!.id);
    if (body.newPassword) {
      const next = String(body.newPassword);
      if (next.length < 8) throw new ApiError(400, 'New password must be at least 8 characters');
      const row = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(user!.id) as { password_hash: string };
      if (!verifyPassword(String(body.currentPassword ?? ''), row.password_hash)) throw new ApiError(400, 'Current password is incorrect');
      db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hashPassword(next), user!.id);
    }
    return json({ ok: true });
  },
  { auth: true },
);
