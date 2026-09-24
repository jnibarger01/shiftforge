import { ApiError, intParam, json, readJson, route } from '@/lib/api';
import { cartCount } from '@/lib/content';
import { getDb } from '@/lib/db';

function own(id: number, userId: number) {
  const row = getDb().prepare('SELECT user_id FROM cart_items WHERE id = ?').get(id) as { user_id: number } | undefined;
  if (!row || row.user_id !== userId) throw new ApiError(404, 'Cart item not found');
}

export const PATCH = route<{ id: string }>(
  async ({ req, user, params }) => {
    const id = intParam(params.id, 'cart item');
    own(id, user!.id);
    const qty = Math.min(20, Math.max(1, Math.round(Number((await readJson(req)).qty) || 1)));
    getDb().prepare('UPDATE cart_items SET qty = ? WHERE id = ?').run(qty, id);
    return json({ count: cartCount(user!.id) });
  },
  { auth: true },
);

export const DELETE = route<{ id: string }>(
  async ({ user, params }) => {
    const id = intParam(params.id, 'cart item');
    own(id, user!.id);
    getDb().prepare('DELETE FROM cart_items WHERE id = ?').run(id);
    return json({ count: cartCount(user!.id) });
  },
  { auth: true },
);
