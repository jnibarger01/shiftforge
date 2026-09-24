import { getDb } from './db';
import { fitmentLabel, type BuildConfig, type CarModel } from './build-config';
import { getModel, modelLabel, partsByIds, slugify, type Part } from './catalog';
import { weekKey } from './week';

export type UserRef = { id: number; name: string; color: string };

export type BuildCard = {
  id: number;
  href: string;
  title: string;
  model: string;
  modelId: number;
  modelSlug: string;
  user: UserRef;
  thumb: string | null;
  views: number;
  likes: number;
  votes: number;
  comments: number;
  rim: string;
  tire: string;
  brands: string[];
  createdAt: string;
  isNew: boolean;
  paint: string;
};

export type Range = 'today' | 'week' | 'month' | 'all';
const RANGE_SQL: Record<Range, string> = {
  today: "datetime('now', '-1 day')",
  week: "datetime('now', '-7 days')",
  month: "datetime('now', '-30 days')",
  all: "'0000-00-00'",
};

export const buildHref = (id: number, title: string) => `/builds/${id}-${slugify(title)}`;

export function brandsFor(config: BuildConfig, parts: Map<number, Part>, aeroBySlug?: Map<string, Part>): string[] {
  const brands = new Set<string>();
  for (const id of [config.wheelPartId, config.tirePartId, config.suspensionPartId]) {
    const p = id ? parts.get(id) : undefined;
    if (p) brands.add(p.brand.toUpperCase());
  }
  if (aeroBySlug) {
    for (const slug of Object.values(config.aero)) {
      const p = slug ? aeroBySlug.get(slug) : undefined;
      if (p) brands.add(p.brand.toUpperCase());
    }
  }
  return [...brands].sort();
}

export function aeroParts(): Map<string, Part> {
  const map = new Map<string, Part>();
  const rows = getDb().prepare("SELECT id FROM parts WHERE category = 'aero'").all() as { id: number }[];
  for (const p of partsByIds(rows.map((r) => r.id)).values()) map.set(p.slug, p);
  return map;
}

const CARD_SELECT = (range: Range) => `
  SELECT b.id, b.title, b.thumb, b.views, b.created_at, b.config, b.model_id,
         m.make, m.model, m.generation, m.slug AS model_slug,
         u.id AS uid, u.name AS uname, u.avatar_color AS ucolor,
         (SELECT COUNT(*) FROM likes l WHERE l.target_type = 'build' AND l.target_id = b.id) AS likes,
         (SELECT COUNT(*) FROM likes l WHERE l.target_type = 'build' AND l.target_id = b.id AND l.created_at >= ${RANGE_SQL[range]}) AS range_likes,
         (SELECT COUNT(*) FROM votes v WHERE v.target_type = 'build' AND v.target_id = b.id AND v.week = @week) AS votes,
         (SELECT COUNT(*) FROM comments c WHERE c.target_type = 'build' AND c.target_id = b.id) AS comments
  FROM builds b JOIN car_models m ON m.id = b.model_id JOIN users u ON u.id = b.user_id`;

function toCards(rows: Record<string, unknown>[]): BuildCard[] {
  const configs = rows.map((r) => JSON.parse(r.config as string) as BuildConfig);
  const parts = partsByIds(configs.flatMap((c) => [c.wheelPartId, c.tirePartId, c.suspensionPartId]));
  const aero = aeroParts();
  const weekAgo = Date.now() - 7 * 86400000;
  return rows.map((r, i) => {
    const c = configs[i];
    const label = fitmentLabel(c);
    return {
      id: r.id as number,
      href: buildHref(r.id as number, r.title as string),
      title: r.title as string,
      model: modelLabel({ make: r.make as string, model: r.model as string, generation: r.generation as string }),
      modelId: r.model_id as number,
      modelSlug: r.model_slug as string,
      user: { id: r.uid as number, name: r.uname as string, color: r.ucolor as string },
      thumb: (r.thumb as string | null) ?? null,
      views: r.views as number,
      likes: r.likes as number,
      votes: r.votes as number,
      comments: r.comments as number,
      rim: label.rim,
      tire: label.tire,
      brands: brandsFor(c, parts, aero),
      createdAt: r.created_at as string,
      isNew: new Date((r.created_at as string).replace(' ', 'T') + 'Z').getTime() > weekAgo,
      paint: c.paint,
    };
  });
}

export type BuildQuery = {
  sort?: 'trending' | 'new';
  range?: Range;
  modelId?: number;
  userId?: number;
  women?: boolean;
  make?: string;
  fitment?: { diameter?: number; width?: number; etMin?: number; etMax?: number; tire?: string };
  limit?: number;
  offset?: number;
};

export function listBuilds(q: BuildQuery = {}): { items: BuildCard[]; total: number } {
  const range = q.range ?? 'all';
  const where: string[] = [];
  const args: Record<string, string | number> = { week: weekKey() };
  if (q.modelId) {
    where.push('b.model_id = @modelId');
    args.modelId = q.modelId;
  }
  if (q.userId) {
    where.push('b.user_id = @userId');
    args.userId = q.userId;
  }
  if (q.women) where.push('u.women_builder = 1');
  if (q.make) {
    where.push('m.make = @make');
    args.make = q.make;
  }
  if (q.fitment) {
    const f = q.fitment;
    if (f.diameter) {
      where.push("json_extract(b.config, '$.diameter') = @fd");
      args.fd = f.diameter;
    }
    if (f.width) {
      where.push("json_extract(b.config, '$.width') = @fw");
      args.fw = f.width;
    }
    if (f.etMin !== undefined) {
      where.push("json_extract(b.config, '$.offset') >= @etMin");
      args.etMin = f.etMin;
    }
    if (f.etMax !== undefined) {
      where.push("json_extract(b.config, '$.offset') <= @etMax");
      args.etMax = f.etMax;
    }
    const tire = f.tire?.match(/^(\d{3})\/(\d{2})Z?R(\d{2})$/i);
    if (tire) {
      where.push("json_extract(b.config, '$.tireWidth') = @tw AND json_extract(b.config, '$.tireAspect') = @ta AND json_extract(b.config, '$.diameter') = @td");
      args.tw = Number(tire[1]);
      args.ta = Number(tire[2]);
      args.td = Number(tire[3]);
    }
  }
  if (q.sort === 'new' && range !== 'all') where.push(`b.created_at >= ${RANGE_SQL[range]}`);
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const order = q.sort === 'new' ? 'b.created_at DESC' : '(range_likes + votes * 2 + b.views / 400.0) DESC, b.created_at DESC';
  const limit = Math.min(q.limit ?? 24, 100);
  const db = getDb();
  const rows = db.prepare(`${CARD_SELECT(range)} ${whereSql} ORDER BY ${order} LIMIT @limit OFFSET @offset`).all({ ...args, limit, offset: q.offset ?? 0 }) as Record<string, unknown>[];
  const { week: _week, ...countArgs } = args;
  void _week;
  const { total } = db.prepare(`SELECT COUNT(*) AS total FROM builds b JOIN car_models m ON m.id = b.model_id JOIN users u ON u.id = b.user_id ${whereSql}`).get(countArgs) as { total: number };
  return { items: toCards(rows), total };
}

export type BuildDetail = BuildCard & { description: string; config: BuildConfig; carModel: CarModel; updatedAt: string };

export function getBuild(id: number): BuildDetail | null {
  const row = getDb().prepare(`${CARD_SELECT('all')} WHERE b.id = @id`).get({ id, week: weekKey() }) as Record<string, unknown> | undefined;
  if (!row) return null;
  const extra = getDb().prepare('SELECT description, updated_at FROM builds WHERE id = ?').get(id) as { description: string; updated_at: string };
  const carModel = getModel(row.model_id as number)!;
  return { ...toCards([row])[0], description: extra.description, updatedAt: extra.updated_at, config: JSON.parse(row.config as string), carModel };
}

export function bumpViews(table: 'builds' | 'owner_builds' | 'articles' | 'parts', id: number) {
  getDb().prepare(`UPDATE ${table} SET views = views + 1 WHERE id = ?`).run(id);
}
