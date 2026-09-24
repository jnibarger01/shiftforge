import { ApiError, intParam, json, readJson, route } from '@/lib/api';
import { addToCart } from '@/lib/content';

export const POST = route(
  async ({ req, user }) => {
    const body = await readJson(req);
    const partId = intParam(body.partId, 'part id');
    const qty = Math.min(20, Math.max(1, Math.round(Number(body.qty) || 1)));
    const raw = (body.options && typeof body.options === 'object' ? body.options : {}) as Record<string, unknown>;
    const options: Record<string, string | number> = {};
    for (const [k, v] of Object.entries(raw).slice(0, 6)) {
      if (/^[a-zA-Z]{1,20}$/.test(k) && (typeof v === 'number' || (typeof v === 'string' && v.length <= 40))) options[k] = v;
    }
    const count = addToCart(user!.id, partId, qty, options);
    if (count === null) throw new ApiError(404, 'Part not found');
    return json({ count }, 201);
  },
  { auth: true },
);
