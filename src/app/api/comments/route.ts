import { json, readJson, route, str } from '@/lib/api';
import { getDb } from '@/lib/db';
import { parseTarget } from '@/lib/targets';

export const POST = route(
  async ({ req, user }) => {
    const body = await readJson(req);
    const { type, id } = parseTarget(body);
    const text = str(body.body, 'Comment', { min: 1, max: 1000 });
    const r = getDb().prepare('INSERT INTO comments (user_id, target_type, target_id, body) VALUES (?, ?, ?, ?)').run(user!.id, type, id, text);
    const row = getDb().prepare('SELECT created_at FROM comments WHERE id = ?').get(Number(r.lastInsertRowid)) as { created_at: string };
    return json({ id: Number(r.lastInsertRowid), body: text, createdAt: row.created_at, user: { id: user!.id, name: user!.name, color: user!.avatarColor } }, 201);
  },
  { auth: true },
);
