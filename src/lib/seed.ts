import type { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { CAR_MODELS, CITIES, FIRST_NAMES, LAST_NAMES, PARTS, WOMEN, type PartSeed } from './catalog-data';
import { ARTICLES, AUCTIONS, COMMENTS, EVENTS, OWNER_STORIES, SHOPS } from './seed-content';
import { PAINTS, type BuildConfig, type CarModel, defaultConfigFor } from './build-config';
import { analyzeFitment, outerFaceMm, suggestAspect, tireOverallDiameterMm } from './fitment';
import { hashPassword } from './password';
import { previousWeekKey, weekKey } from './week';

export const DEMO_EMAIL = 'demo@shiftforge.dev';
export const DEMO_PASSWORD = 'shiftforge-demo';

function rng(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const sqlTime = (d: Date) => d.toISOString().slice(0, 19).replace('T', ' ');
const daysAgo = (n: number) => sqlTime(new Date(Date.now() - n * 86400000));

export function rowToModel(r: Record<string, unknown>): CarModel {
  return {
    id: r.id as number,
    slug: r.slug as string,
    make: r.make as string,
    model: r.model as string,
    generation: r.generation as string,
    yearFrom: r.year_from as number,
    yearTo: (r.year_to as number | null) ?? null,
    origin: r.origin as CarModel['origin'],
    body: r.body as CarModel['body'],
    lengthMm: r.length_mm as number,
    widthMm: r.width_mm as number,
    heightMm: r.height_mm as number,
    wheelbaseMm: r.wheelbase_mm as number,
    boltPattern: r.bolt_pattern as string,
    centerBore: r.center_bore as number,
    stockDiameter: r.stock_diameter as number,
    stockWidth: r.stock_width as number,
    stockOffset: r.stock_offset as number,
    stockTireWidth: r.stock_tire_width as number,
    stockTireAspect: r.stock_tire_aspect as number,
    fenderClearance: r.fender_clearance as number,
    innerClearance: r.inner_clearance as number,
    archGap: r.arch_gap as number,
    defaultPaint: r.default_paint as string,
  };
}

type PartRow = PartSeed & { id: number };

/** Choose a combination a real builder would plausibly run: resample until the fitment engine does not reject it. */
function planConfig(model: CarModel, parts: PartRow[], rand: () => number, aggressive: boolean): BuildConfig {
  let config = planOnce(model, parts, rand, aggressive);
  for (let i = 0; i < 40 && analyzeFitment(config, model).verdict === 'bad'; i++) config = planOnce(model, parts, rand, aggressive && i < 20);
  return config;
}

function planOnce(model: CarModel, parts: PartRow[], rand: () => number, aggressive: boolean): BuildConfig {
  const pick = <T,>(xs: T[]) => xs[Math.floor(rand() * xs.length)];
  const offroad = model.body === 'truck' || model.body === 'suv';
  const wheels = parts.filter((p) => p.category === 'wheels' && (offroad ? ['method-mr305-nv', 'fuel-rebel', 'titan-7-t-d6'].includes(p.slug) : !['method-mr305-nv', 'fuel-rebel'].includes(p.slug)));
  const candidates = wheels.filter((w) => (w.specs.diameters as number[]).some((d) => d >= model.stockDiameter - 1 && d <= model.stockDiameter + 2));
  const w = pick(candidates.length ? candidates : wheels);
  const diameters = (w.specs.diameters as number[]).filter((d) => d >= model.stockDiameter - 1 && d <= model.stockDiameter + 2);
  const diameter = pick(diameters.length ? diameters : (w.specs.diameters as number[]));
  const maxExtra = (model.fenderClearance + model.innerClearance - 4) / 25.4;
  const widths = (w.specs.widths as number[]).filter((x) => x >= model.stockWidth && x <= model.stockWidth + maxExtra);
  const width = widths.length ? pick(widths) : (w.specs.widths as number[]).reduce((a, b) => (Math.abs(b - model.stockWidth) < Math.abs(a - model.stockWidth) ? b : a));
  const [etMin, etMax] = w.specs.offsets as [number, number];
  // Target poke: flush (use the fender clearance) for aggressive builds, a few mm tucked otherwise.
  const targetPoke = aggressive ? model.fenderClearance - 1 : model.fenderClearance * 0.5;
  const idealEt = (width * 25.4) / 2 - (outerFaceMm(model.stockWidth, model.stockOffset) + targetPoke);
  const offset = Math.round(Math.min(etMax, Math.max(etMin, idealEt)));
  const tireWidth = offroad ? model.stockTireWidth : Math.min(305, Math.max(195, Math.round((width * 25.4) / 0.88 / 5) * 5));
  const stockOverall = tireOverallDiameterMm(model.stockDiameter, model.stockTireWidth, model.stockTireAspect);
  const tireAspect = suggestAspect(diameter, tireWidth, stockOverall);
  const tires = parts.filter((p) => p.category === 'tires' && (offroad ? p.style === 'all-terrain' : p.style !== 'all-terrain'));
  const suspension = parts.filter((p) => p.category === 'suspension' && (offroad ? p.style === 'lift' : p.style !== 'lift'));
  const sus = rand() < 0.85 ? pick(suspension) : null;
  const dropCap = model.archGap * (aggressive ? 0.9 : 0.6);
  const drop = sus ? Math.min(dropCap, Math.round((sus.specs.dropMin as number) + rand() * ((sus.specs.dropMax as number) - (sus.specs.dropMin as number)) * (aggressive ? 0.8 : 0.45))) : 0;
  const aero = { front: null as string | null, side: null as string | null, rear: null as string | null, wing: null as string | null };
  if (!offroad) {
    for (const slot of ['front', 'side', 'rear', 'wing'] as const) {
      if (rand() < (slot === 'wing' ? 0.35 : 0.55)) aero[slot] = pick(parts.filter((p) => p.category === 'aero' && p.style === slot)).slug;
    }
  }
  const paint = rand() < 0.35 ? { name: 'Factory', value: model.defaultPaint } : pick(PAINTS);
  return {
    ...defaultConfigFor(model),
    wheelPartId: w.id,
    wheelColor: pick(w.colors ?? ['#c6c8cb']),
    diameter,
    width,
    offset,
    spacer: 0,
    tirePartId: pick(tires).id,
    tireWidth,
    tireAspect,
    drop: Math.round(Math.max((sus?.specs.dropMin as number | undefined) ?? 0, drop)),
    camber: offroad ? 0 : -Math.round(rand() * (aggressive ? 30 : 15)) / 10 || 0,
    suspensionPartId: sus?.id ?? null,
    paint: paint.value,
    paintName: paint.name,
    finish: pick(['gloss', 'metallic', 'metallic', 'satin', 'matte'] as const),
    caliperColor: pick(['#c8141c', '#f2c230', '#111111', '#1f46b5']),
    tint: Math.round(15 + rand() * 50),
    aero,
    scene: pick(['studio', 'studio', 'street', 'night'] as const),
  };
}

const BUILD_TITLES = ['Street Spec', 'Canyon Carver', 'Track Rat', 'Midnight Runner', 'Daily Weapon', 'Time Attack', 'OEM+', 'Stance Project', 'Weekend Toy', 'Autocross Build', 'Clean Daily', 'Touge Spec', 'Showcar Fit', 'Flush Fitment', 'Grand Tourer', 'Overland Rig'];

export function seedDatabase(db: DatabaseSync, publicDir = path.join(process.cwd(), 'public')) {
  const rand = rng(20260923);
  const pick = <T,>(xs: T[]) => xs[Math.floor(rand() * xs.length)];
  const hasFile = (webPath: string) => fs.existsSync(path.join(publicDir, webPath));

  db.exec('BEGIN');
  try {
    const insModel = db.prepare(`INSERT INTO car_models (slug, make, model, generation, year_from, year_to, origin, body, length_mm, width_mm, height_mm, wheelbase_mm, bolt_pattern, center_bore, stock_diameter, stock_width, stock_offset, stock_tire_width, stock_tire_aspect, fender_clearance, inner_clearance, arch_gap, default_paint) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);
    for (const m of CAR_MODELS) insModel.run(...m);
    const models = (db.prepare('SELECT * FROM car_models ORDER BY id').all() as Record<string, unknown>[]).map(rowToModel);

    const insPart = db.prepare('INSERT INTO parts (slug, category, brand, name, style, description, price_cents, specs, colors, views) VALUES (?,?,?,?,?,?,?,?,?,?)');
    const parts: PartRow[] = PARTS.map((p) => {
      const r = insPart.run(p.slug, p.category, p.brand, p.name, p.style, p.description, p.price === null ? null : Math.round(p.price * 100), JSON.stringify(p.specs), JSON.stringify(p.colors ?? []), Math.round(800 + rand() * 7500));
      return { ...p, id: Number(r.lastInsertRowid) };
    });

    // Every seeded account shares one hash; only the demo account is advertised.
    const sharedHash = hashPassword(DEMO_PASSWORD);
    const insUser = db.prepare('INSERT INTO users (email, name, password_hash, bio, location, avatar_color, women_builder, created_at) VALUES (?,?,?,?,?,?,?,?)');
    const colors = ['#2563eb', '#dc2626', '#16a34a', '#9333ea', '#ea580c', '#0891b2', '#db2777', '#ca8a04'];
    insUser.run(DEMO_EMAIL, 'Demo Driver', sharedHash, 'Test account for trying ShiftForge end to end.', 'Austin, TX', '#ea3323', 0, daysAgo(120));
    const userIds: number[] = [1];
    for (let i = 0; i < FIRST_NAMES.length; i++) {
      const first = FIRST_NAMES[i];
      const last = LAST_NAMES[(i * 7) % LAST_NAMES.length];
      const r = insUser.run(`${first}.${last}@example.com`.toLowerCase(), `${first} ${last}`, sharedHash, pick(['Weekend autocross, weekday commute.', 'Chasing flush fitment one spacer at a time.', 'JDM kid, grown-up budget.', 'Former drift judge. Current wheel addict.', 'If it has a clutch I am interested.', 'Building slowly and documenting everything.']), pick(CITIES), pick(colors), WOMEN.has(first) ? 1 : 0, daysAgo(30 + Math.floor(rand() * 600)));
      userIds.push(Number(r.lastInsertRowid));
    }
    const communityIds = userIds.slice(1);

    const insBuild = db.prepare('INSERT INTO builds (user_id, model_id, title, description, config, thumb, views, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?)');
    const buildIds: number[] = [];
    for (let i = 0; i < 36; i++) {
      const model = models[i % models.length];
      const aggressive = rand() < 0.5;
      const config = planConfig(model, parts, rand, aggressive);
      const year = model.yearFrom + Math.floor(rand() * ((model.yearTo ?? 2026) - model.yearFrom + 1));
      const title = i < models.length ? `${year} ${model.make} ${model.model} ${model.generation}` : `${pick(BUILD_TITLES)} ${model.generation}`;
      const thumb = `/seed/builds/${i + 1}.webp`;
      const created = daysAgo(Math.floor(rand() * 40) + (i % 5));
      const r = insBuild.run(pick(communityIds), model.id, title, pick(['Planning the wheel order around this one.', 'Mocked up before I bought anything.', 'Trying to get the front flush without rolling fenders.', 'Winter project plan. Parts list is real.', '']), JSON.stringify(config), hasFile(thumb) ? thumb : null, Math.round(300 + rand() * 7000), created, created);
      buildIds.push(Number(r.lastInsertRowid));
    }

    const insOwner = db.prepare('INSERT INTO owner_builds (user_id, model_id, year, title, description, usage, mods, seed_config, views, created_at) VALUES (?,?,?,?,?,?,?,?,?,?)');
    const insPhoto = db.prepare('INSERT INTO owner_photos (owner_build_id, path, position) VALUES (?,?,?)');
    const ownerIds: number[] = [];
    OWNER_STORIES.forEach((story, i) => {
      const model = models.find((m) => m.slug === story.model) ?? models[0];
      const config = planConfig(model, parts, rand, rand() < 0.5);
      const owner = story.woman ? communityIds.filter((id, idx) => WOMEN.has(FIRST_NAMES[idx]))[i % 12] : communityIds[(i * 5) % communityIds.length];
      const r = insOwner.run(owner, model.id, story.year, story.title, story.description, story.usage, story.mods, JSON.stringify({ ...config, scene: i % 2 ? 'night' : 'street' }), Math.round(400 + rand() * 3500), daysAgo(i * 2 + Math.floor(rand() * 3)));
      const id = Number(r.lastInsertRowid);
      ownerIds.push(id);
      for (let k = 0; k < 2; k++) {
        const photo = `/seed/owners/${i + 1}-${k + 1}.webp`;
        if (hasFile(photo)) insPhoto.run(id, photo, k);
      }
    });

    const insLike = db.prepare('INSERT OR IGNORE INTO likes (user_id, target_type, target_id) VALUES (?,?,?)');
    const insVote = db.prepare('INSERT OR IGNORE INTO votes (user_id, target_type, target_id, week, created_at) VALUES (?,?,?,?,?)');
    const weeks = [weekKey(), previousWeekKey(1), previousWeekKey(2), previousWeekKey(3)];
    for (const [type, ids] of [['build', buildIds], ['owner', ownerIds]] as const) {
      for (const id of ids) {
        const popularity = rand();
        for (const uid of communityIds) {
          if (rand() < popularity * 0.6) insLike.run(uid, type, id);
          weeks.forEach((wk, w) => {
            if (rand() < popularity * (w === 0 ? 0.35 : 0.5)) insVote.run(uid, type, id, wk, daysAgo(w * 7));
          });
        }
      }
    }

    const insComment = db.prepare('INSERT INTO comments (user_id, target_type, target_id, body, created_at) VALUES (?,?,?,?,?)');
    for (const [type, ids] of [['build', buildIds], ['owner', ownerIds]] as const) {
      for (const id of ids) {
        const n = Math.floor(rand() * 4);
        for (let k = 0; k < n; k++) insComment.run(pick(communityIds), type, id, pick(COMMENTS), daysAgo(Math.floor(rand() * 20)));
      }
    }

    const insArticle = db.prepare('INSERT INTO articles (user_id, kind, series, episode, title, excerpt, body, cover, views, created_at) VALUES (?,?,?,?,?,?,?,?,?,?)');
    ARTICLES.forEach((a, i) => {
      const r = insArticle.run(communityIds[(a.author * 3) % communityIds.length], a.kind, a.series ?? null, a.episode ?? null, a.title, a.excerpt, a.body, a.cover, Math.round(500 + rand() * 4000), daysAgo(a.daysAgo));
      const n = Math.floor(rand() * 3);
      for (let k = 0; k < n; k++) insComment.run(pick(communityIds), 'article', Number(r.lastInsertRowid), pick(COMMENTS), daysAgo(Math.max(0, a.daysAgo - k - 1)));
      void i;
    });

    const insEvent = db.prepare('INSERT INTO events (title, category, starts_at, venue, city, state, lat, lng, host, description) VALUES (?,?,?,?,?,?,?,?,?,?)');
    for (const e of EVENTS) insEvent.run(e.title, e.category, sqlTime(new Date(Date.now() + e.inDays * 86400000 + 9 * 3600000)), e.venue, e.city, e.state, e.lat, e.lng, e.host, e.description);
    const insShop = db.prepare('INSERT INTO shops (name, services, city, state, lat, lng, rating, reviews, phone, description) VALUES (?,?,?,?,?,?,?,?,?,?)');
    for (const s of SHOPS) insShop.run(s.name, s.services, s.city, s.state, s.lat, s.lng, s.rating, s.reviews, s.phone, s.description);
    const insAuction = db.prepare('INSERT INTO auctions (year, make, model, damage, miles, state, estimate_cents, ends_at, verdict, paint, model_id) VALUES (?,?,?,?,?,?,?,?,?,?,?)');
    for (const a of AUCTIONS) {
      const m = a.modelSlug ? models.find((x) => x.slug === a.modelSlug) : undefined;
      insAuction.run(a.year, a.make, a.model, a.damage, a.miles, a.state, a.estimate * 100, sqlTime(new Date(Date.now() + a.endsInHours * 3600000)), a.verdict, a.paint, m?.id ?? null);
    }

    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}
