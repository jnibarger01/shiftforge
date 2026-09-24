import { getDb } from './db';
import { rowToModel } from './seed';
import type { CarModel } from './build-config';

export type Part = {
  id: number;
  slug: string;
  category: 'wheels' | 'tires' | 'suspension' | 'aero';
  brand: string;
  name: string;
  style: string;
  description: string;
  priceCents: number | null;
  specs: Record<string, unknown>;
  colors: string[];
  views: number;
};

export const PART_CATEGORIES = [
  { key: 'wheels', label: 'Aftermarket Wheels', short: 'Wheels' },
  { key: 'tires', label: 'Tires', short: 'Tires' },
  { key: 'suspension', label: 'Suspension', short: 'Suspension' },
  { key: 'aero', label: 'Body & Aero', short: 'Aero' },
] as const;

export function slugify(s: string) {
  return s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 60) || 'build';
}

export const modelLabel = (m: Pick<CarModel, 'make' | 'model' | 'generation'>) => `${m.make} ${m.model} ${m.generation}`;
export const modelYears = (m: Pick<CarModel, 'yearFrom' | 'yearTo'>) => `${m.yearFrom}–${m.yearTo ?? 'present'}`;

export function listModels(): CarModel[] {
  return (getDb().prepare('SELECT * FROM car_models ORDER BY make, model').all() as Record<string, unknown>[]).map(rowToModel);
}

export function getModel(idOrSlug: number | string): CarModel | null {
  const row = getDb()
    .prepare(typeof idOrSlug === 'number' ? 'SELECT * FROM car_models WHERE id = ?' : 'SELECT * FROM car_models WHERE slug = ?')
    .get(idOrSlug) as Record<string, unknown> | undefined;
  return row ? rowToModel(row) : null;
}

function rowToPart(r: Record<string, unknown>): Part {
  return {
    id: r.id as number,
    slug: r.slug as string,
    category: r.category as Part['category'],
    brand: r.brand as string,
    name: r.name as string,
    style: r.style as string,
    description: r.description as string,
    priceCents: (r.price_cents as number | null) ?? null,
    specs: JSON.parse(r.specs as string),
    colors: JSON.parse(r.colors as string),
    views: r.views as number,
  };
}

export function listParts(opts: { category?: string; q?: string; brand?: string; sort?: string } = {}): Part[] {
  const where: string[] = [];
  const args: (string | number)[] = [];
  if (opts.category) {
    where.push('category = ?');
    args.push(opts.category);
  }
  if (opts.brand) {
    where.push('brand = ?');
    args.push(opts.brand);
  }
  if (opts.q) {
    where.push('(brand LIKE ? OR name LIKE ? OR description LIKE ?)');
    const like = `%${opts.q}%`;
    args.push(like, like, like);
  }
  const order =
    opts.sort === 'price-asc' ? 'price_cents IS NULL, price_cents ASC' : opts.sort === 'price-desc' ? 'price_cents DESC' : opts.sort === 'name' ? 'brand, name' : 'views DESC';
  const sql = `SELECT * FROM parts ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY ${order}`;
  return (getDb().prepare(sql).all(...args) as Record<string, unknown>[]).map(rowToPart);
}

export function getPart(id: number): Part | null {
  const row = getDb().prepare('SELECT * FROM parts WHERE id = ?').get(id) as Record<string, unknown> | undefined;
  return row ? rowToPart(row) : null;
}

export function partsByIds(ids: (number | null | undefined)[]): Map<number, Part> {
  const clean = [...new Set(ids.filter((x): x is number => typeof x === 'number'))];
  const map = new Map<number, Part>();
  if (!clean.length) return map;
  const rows = getDb().prepare(`SELECT * FROM parts WHERE id IN (${clean.map(() => '?').join(',')})`).all(...clean) as Record<string, unknown>[];
  for (const r of rows) map.set(r.id as number, rowToPart(r));
  return map;
}

export const partHref = (p: Pick<Part, 'id' | 'brand' | 'name'>) => `/parts/${p.id}-${slugify(`${p.brand} ${p.name}`)}`;
export const formatPrice = (cents: number | null) =>
  cents === null ? 'Upon request' : `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: cents % 100 ? 2 : 0, maximumFractionDigits: 2 })}`;
