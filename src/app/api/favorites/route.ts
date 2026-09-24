import { ApiError, intParam, json, readJson, route } from '@/lib/api';
import { getDb } from '@/lib/db';

export const POST = route(
  async ({ req, user }) => {
    const id = intParam((await readJson(req)).partId, 'Part id');
    const db = getDb();
    if (!db.prepare('SELECT 1 FROM parts WHERE id = ?').get(id)) throw new ApiError(404, 'Part not found');
    const exists = db.prepare('SELECT 1 FROM favorites WHERE user_id = ? AND part_id = ?').get(user!.id, id);
    if (exists) db.prepare('DELETE FROM favorites WHERE user_id = ? AND part_id = ?').run(user!.id, id);
    else db.prepare('INSERT INTO favorites (user_id, part_id) VALUES (?, ?)').run(user!.id, id);
    const { n } = db.prepare('SELECT COUNT(*) AS n FROM favorites WHERE part_id = ?').get(id) as { n: number };
    return json({ active: !exists, count: n });
  },
  { auth: true },
);
