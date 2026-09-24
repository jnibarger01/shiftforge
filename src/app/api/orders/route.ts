import { ApiError, json, readJson, route, str } from '@/lib/api';
import { getCart } from '@/lib/content';
import { tx } from '@/lib/db';

/** Converts the cart into a quote request. No payment is taken — sellers confirm fitment and price first. */
export const POST = route(
  async ({ req, user }) => {
    const body = await readJson(req);
    const name = str(body.name, 'Name', { min: 2, max: 60 });
    const email = str(body.email, 'Email', { min: 3, max: 120 });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new ApiError(400, 'Enter a valid email address');
    const zip = str(body.zip, 'ZIP code', { min: 3, max: 10 });
    const vehicle = str(body.vehicle ?? '', 'Vehicle', { max: 80 });
    const cart = getCart(user!.id);
    if (!cart.lines.length) throw new ApiError(400, 'Your cart is empty');
    const items = cart.lines.map((l) => ({ name: `${l.part.brand} ${l.part.name}`, partId: l.part.id, qty: l.qty, options: l.options, lineCents: l.lineCents }));
    const id = tx((db) => {
      const r = db.prepare('INSERT INTO orders (user_id, items, total_cents, contact) VALUES (?, ?, ?, ?)').run(user!.id, JSON.stringify(items), cart.totalCents, JSON.stringify({ name, email, zip, vehicle }));
      db.prepare('DELETE FROM cart_items WHERE user_id = ?').run(user!.id);
      return Number(r.lastInsertRowid);
    });
    return json({ id }, 201);
  },
  { auth: true },
);
