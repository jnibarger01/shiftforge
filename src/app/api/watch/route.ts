import { ApiError, intParam, json, readJson, route } from '@/lib/api';
import { getDb } from '@/lib/db';

export const POST = route(
  async ({ req, user }) => {
    const id = intParam((await readJson(req)).auctionId, 'Auction id');
    const db = getDb();
    if (!db.prepare('SELECT 1 FROM auctions WHERE id = ?').get(id)) throw new ApiError(404, 'Auction not found');
    const exists = db.prepare('SELECT 1 FROM watchlist WHERE user_id = ? AND auction_id = ?').get(user!.id, id);
    if (exists) db.prepare('DELETE FROM watchlist WHERE user_id = ? AND auction_id = ?').run(user!.id, id);
    else db.prepare('INSERT INTO watchlist (user_id, auction_id) VALUES (?, ?)').run(user!.id, id);
    const { n } = db.prepare('SELECT COUNT(*) AS n FROM watchlist WHERE auction_id = ?').get(id) as { n: number };
    return json({ active: !exists, count: n });
  },
  { auth: true },
);
