import { ApiError, intParam, json, readJson, route } from '@/lib/api';
import { getDb } from '@/lib/db';

export const POST = route(
  async ({ req, user }) => {
    const id = intParam((await readJson(req)).eventId, 'Event id');
    const db = getDb();
    if (!db.prepare('SELECT 1 FROM events WHERE id = ?').get(id)) throw new ApiError(404, 'Event not found');
    const exists = db.prepare('SELECT 1 FROM rsvps WHERE user_id = ? AND event_id = ?').get(user!.id, id);
    if (exists) db.prepare('DELETE FROM rsvps WHERE user_id = ? AND event_id = ?').run(user!.id, id);
    else db.prepare('INSERT INTO rsvps (user_id, event_id) VALUES (?, ?)').run(user!.id, id);
    const { n } = db.prepare('SELECT COUNT(*) AS n FROM rsvps WHERE event_id = ?').get(id) as { n: number };
    return json({ active: !exists, count: n });
  },
  { auth: true },
);
