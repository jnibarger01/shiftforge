import { getDb } from './db';
import { getPart, slugify, type Part, partsByIds } from './catalog';
import type { UserRef } from './builds';

// ---------- Articles (Journals + Magazine) ----------

export type ArticleCard = {
  id: number;
  href: string;
  kind: 'journal' | 'magazine';
  series: string | null;
  episode: number | null;
  title: string;
  excerpt: string;
  cover: string;
  views: number;
  readMin: number;
  comments: number;
  likes: number;
  user: UserRef;
  createdAt: string;
};

export const articleHref = (id: number, title: string) => `/articles/${id}-${slugify(title)}`;

const ARTICLE_SELECT = `
  SELECT a.*, u.name AS uname, u.avatar_color AS ucolor,
         (SELECT COUNT(*) FROM comments c WHERE c.target_type = 'article' AND c.target_id = a.id) AS comment_count,
         (SELECT COUNT(*) FROM likes l WHERE l.target_type = 'article' AND l.target_id = a.id) AS like_count
  FROM articles a JOIN users u ON u.id = a.user_id`;

function toArticle(r: Record<string, unknown>): ArticleCard & { body: string } {
  const body = r.body as string;
  return {
    id: r.id as number,
    href: articleHref(r.id as number, r.title as string),
    kind: r.kind as ArticleCard['kind'],
    series: (r.series as string | null) ?? null,
    episode: (r.episode as number | null) ?? null,
    title: r.title as string,
    excerpt: r.excerpt as string,
    cover: r.cover as string,
    views: r.views as number,
    readMin: Math.max(1, Math.round(body.split(/\s+/).length / 220)),
    comments: r.comment_count as number,
    likes: r.like_count as number,
    user: { id: r.user_id as number, name: r.uname as string, color: r.ucolor as string },
    createdAt: r.created_at as string,
    body,
  };
}

export function listArticles(q: { kind?: 'journal' | 'magazine'; userId?: number; series?: string; limit?: number; sort?: 'new' | 'popular' } = {}) {
  const where: string[] = [];
  const args: (string | number)[] = [];
  if (q.kind) {
    where.push('a.kind = ?');
    args.push(q.kind);
  }
  if (q.userId) {
    where.push('a.user_id = ?');
    args.push(q.userId);
  }
  if (q.series) {
    where.push('a.series = ?');
    args.push(q.series);
  }
  const order = q.sort === 'popular' ? 'a.views DESC' : 'a.created_at DESC, a.id DESC';
  return (getDb().prepare(`${ARTICLE_SELECT} ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY ${order} LIMIT ?`).all(...args, q.limit ?? 50) as Record<string, unknown>[]).map(toArticle);
}

export function getArticle(id: number) {
  const row = getDb().prepare(`${ARTICLE_SELECT} WHERE a.id = ?`).get(id) as Record<string, unknown> | undefined;
  return row ? toArticle(row) : null;
}

export function userSeries(userId: number): string[] {
  return (getDb().prepare("SELECT DISTINCT series FROM articles WHERE user_id = ? AND kind = 'journal' AND series IS NOT NULL").all(userId) as { series: string }[]).map((r) => r.series);
}

// ---------- Events, shops, auctions ----------

export type EventRow = { id: number; title: string; category: string; startsAt: string; venue: string; city: string; state: string; lat: number; lng: number; host: string; description: string; going: number };

export function listEvents(q: { category?: string; state?: string } = {}): EventRow[] {
  const where = ["e.starts_at >= datetime('now', '-1 day')"];
  const args: string[] = [];
  if (q.category) {
    where.push('e.category = ?');
    args.push(q.category);
  }
  if (q.state) {
    where.push('e.state = ?');
    args.push(q.state);
  }
  return (getDb().prepare(`SELECT e.*, (SELECT COUNT(*) FROM rsvps r WHERE r.event_id = e.id) AS going FROM events e WHERE ${where.join(' AND ')} ORDER BY e.starts_at`).all(...args) as Record<string, unknown>[]).map(toEvent);
}

function toEvent(r: Record<string, unknown>): EventRow {
  return { id: r.id as number, title: r.title as string, category: r.category as string, startsAt: r.starts_at as string, venue: r.venue as string, city: r.city as string, state: r.state as string, lat: r.lat as number, lng: r.lng as number, host: r.host as string, description: r.description as string, going: r.going as number };
}

export function getEvent(id: number): EventRow | null {
  const r = getDb().prepare('SELECT e.*, (SELECT COUNT(*) FROM rsvps r WHERE r.event_id = e.id) AS going FROM events e WHERE e.id = ?').get(id) as Record<string, unknown> | undefined;
  return r ? toEvent(r) : null;
}

export type ShopRow = { id: number; name: string; services: string; city: string; state: string; lat: number; lng: number; rating: number; reviews: number; phone: string; description: string };

export function listShops(q: { service?: string } = {}): ShopRow[] {
  const rows = getDb().prepare('SELECT * FROM shops ORDER BY rating DESC, reviews DESC').all() as ShopRow[];
  return q.service ? rows.filter((s) => s.services.toLowerCase().includes(q.service!.toLowerCase())) : rows;
}

export type AuctionRow = { id: number; year: number; make: string; model: string; damage: string; miles: number; state: string; estimateCents: number; endsAt: string; verdict: string; paint: string; modelSlug: string | null; watchers: number };

export function listAuctions(q: { make?: string; maxCents?: number; sort?: 'ending' | 'price' } = {}): AuctionRow[] {
  const where = ["a.ends_at > datetime('now')"];
  const args: (string | number)[] = [];
  if (q.make) {
    where.push('a.make = ?');
    args.push(q.make);
  }
  if (q.maxCents) {
    where.push('a.estimate_cents <= ?');
    args.push(q.maxCents);
  }
  const order = q.sort === 'price' ? 'a.estimate_cents ASC' : 'a.ends_at ASC';
  return (
    getDb()
      .prepare(`SELECT a.*, m.slug AS model_slug, (SELECT COUNT(*) FROM watchlist w WHERE w.auction_id = a.id) AS watchers FROM auctions a LEFT JOIN car_models m ON m.id = a.model_id WHERE ${where.join(' AND ')} ORDER BY ${order}`)
      .all(...args) as Record<string, unknown>[]
  ).map((r) => ({
    id: r.id as number,
    year: r.year as number,
    make: r.make as string,
    model: r.model as string,
    damage: r.damage as string,
    miles: r.miles as number,
    state: r.state as string,
    estimateCents: r.estimate_cents as number,
    endsAt: r.ends_at as string,
    verdict: r.verdict as string,
    paint: r.paint as string,
    modelSlug: (r.model_slug as string | null) ?? null,
    watchers: r.watchers as number,
  }));
}

// ---------- Commerce ----------

export type CartLine = { id: number; part: Part; qty: number; options: Record<string, unknown>; lineCents: number | null };

export function getCart(userId: number): { lines: CartLine[]; totalCents: number; hasQuoteItems: boolean } {
  const rows = getDb().prepare('SELECT id, part_id, qty, options FROM cart_items WHERE user_id = ? ORDER BY created_at').all(userId) as { id: number; part_id: number; qty: number; options: string }[];
  const parts = partsByIds(rows.map((r) => r.part_id));
  const lines = rows
    .filter((r) => parts.has(r.part_id))
    .map((r) => {
      const part = parts.get(r.part_id)!;
      return { id: r.id, part, qty: r.qty, options: JSON.parse(r.options), lineCents: part.priceCents === null ? null : part.priceCents * r.qty };
    });
  return { lines, totalCents: lines.reduce((s, l) => s + (l.lineCents ?? 0), 0), hasQuoteItems: lines.some((l) => l.lineCents === null) };
}

export function cartCount(userId: number): number {
  return (getDb().prepare('SELECT COALESCE(SUM(qty), 0) AS n FROM cart_items WHERE user_id = ?').get(userId) as { n: number }).n;
}

export function addToCart(userId: number, partId: number, qty: number, options: Record<string, unknown>) {
  if (!getPart(partId)) return null;
  const db = getDb();
  const opts = JSON.stringify(options);
  const existing = db.prepare('SELECT id FROM cart_items WHERE user_id = ? AND part_id = ? AND options = ?').get(userId, partId, opts) as { id: number } | undefined;
  if (existing) db.prepare('UPDATE cart_items SET qty = MIN(qty + ?, 99) WHERE id = ?').run(qty, existing.id);
  else db.prepare('INSERT INTO cart_items (user_id, part_id, qty, options) VALUES (?, ?, ?, ?)').run(userId, partId, qty, opts);
  return cartCount(userId);
}

export function listOrders(userId: number) {
  return (getDb().prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC, id DESC').all(userId) as Record<string, unknown>[]).map((r) => ({
    id: r.id as number,
    items: JSON.parse(r.items as string) as { name: string; qty: number; lineCents: number | null; options: Record<string, unknown> }[],
    totalCents: r.total_cents as number,
    contact: JSON.parse(r.contact as string) as { name: string; email: string; zip: string },
    status: r.status as string,
    createdAt: r.created_at as string,
  }));
}

export function listFavorites(userId: number): Part[] {
  const ids = (getDb().prepare('SELECT part_id FROM favorites WHERE user_id = ? ORDER BY created_at DESC').all(userId) as { part_id: number }[]).map((r) => r.part_id);
  const map = partsByIds(ids);
  return ids.map((id) => map.get(id)).filter((p): p is Part => !!p);
}
