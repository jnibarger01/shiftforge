import { getDb } from './db';
import { modelLabel, slugify } from './catalog';
import { buildHref, listBuilds, type BuildCard, type UserRef } from './builds';
import { previousWeekKey, weekKey } from './week';

export type TargetType = 'build' | 'owner' | 'render' | 'article';
export const TARGET_TABLE: Record<TargetType, string> = { build: 'builds', owner: 'owner_builds', render: 'renders', article: 'articles' };

export function targetExists(type: TargetType, id: number) {
  return !!getDb().prepare(`SELECT 1 FROM ${TARGET_TABLE[type]} WHERE id = ?`).get(id);
}

// ---------- Owner's Club ----------

export type OwnerCard = {
  id: number;
  href: string;
  title: string;
  model: string | null;
  modelId: number | null;
  make: string | null;
  year: number | null;
  usage: string;
  user: UserRef;
  photo: string | null;
  views: number;
  likes: number;
  votes: number;
  comments: number;
  createdAt: string;
  isNew: boolean;
};

export const ownerHref = (id: number, title: string) => `/owners-builds/${id}-${slugify(title)}`;

const OWNER_SELECT = `
  SELECT o.id, o.title, o.year, o.usage, o.views, o.created_at, o.model_id,
         m.make, m.model, m.generation, m.origin,
         u.id AS uid, u.name AS uname, u.avatar_color AS ucolor,
         (SELECT path FROM owner_photos p WHERE p.owner_build_id = o.id ORDER BY position LIMIT 1) AS photo,
         (SELECT COUNT(*) FROM likes l WHERE l.target_type = 'owner' AND l.target_id = o.id) AS likes,
         (SELECT COUNT(*) FROM votes v WHERE v.target_type = 'owner' AND v.target_id = o.id AND v.week = @week) AS votes,
         (SELECT COUNT(*) FROM comments c WHERE c.target_type = 'owner' AND c.target_id = o.id) AS comments
  FROM owner_builds o JOIN users u ON u.id = o.user_id LEFT JOIN car_models m ON m.id = o.model_id`;

function toOwnerCard(r: Record<string, unknown>): OwnerCard {
  return {
    id: r.id as number,
    href: ownerHref(r.id as number, r.title as string),
    title: r.title as string,
    model: r.make ? modelLabel({ make: r.make as string, model: r.model as string, generation: r.generation as string }) : null,
    modelId: (r.model_id as number | null) ?? null,
    make: (r.make as string | null) ?? null,
    year: (r.year as number | null) ?? null,
    usage: r.usage as string,
    user: { id: r.uid as number, name: r.uname as string, color: r.ucolor as string },
    photo: (r.photo as string | null) ?? null,
    views: r.views as number,
    likes: r.likes as number,
    votes: r.votes as number,
    comments: r.comments as number,
    createdAt: r.created_at as string,
    isNew: new Date((r.created_at as string).replace(' ', 'T') + 'Z').getTime() > Date.now() - 7 * 86400000,
  };
}

export function listOwnerBuilds(q: { sort?: 'trending' | 'new'; make?: string; origin?: string; modelId?: number; userId?: number; women?: boolean; limit?: number; offset?: number } = {}) {
  const where: string[] = [];
  const args: Record<string, string | number> = { week: weekKey() };
  if (q.make) {
    where.push('m.make = @make');
    args.make = q.make;
  }
  if (q.origin) {
    where.push('m.origin = @origin');
    args.origin = q.origin;
  }
  if (q.modelId) {
    where.push('o.model_id = @modelId');
    args.modelId = q.modelId;
  }
  if (q.userId) {
    where.push('o.user_id = @userId');
    args.userId = q.userId;
  }
  if (q.women) where.push('u.women_builder = 1');
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const order = q.sort === 'new' ? 'o.created_at DESC' : '(likes + votes * 2 + o.views / 300.0) DESC';
  const db = getDb();
  const rows = db.prepare(`${OWNER_SELECT} ${whereSql} ORDER BY ${order} LIMIT @limit OFFSET @offset`).all({ ...args, limit: Math.min(q.limit ?? 24, 100), offset: q.offset ?? 0 }) as Record<string, unknown>[];
  const { week: _w, ...countArgs } = args;
  void _w;
  const { total } = db.prepare(`SELECT COUNT(*) AS total FROM owner_builds o JOIN users u ON u.id = o.user_id LEFT JOIN car_models m ON m.id = o.model_id ${whereSql}`).get(countArgs) as { total: number };
  return { items: rows.map(toOwnerCard), total };
}

export function getOwnerBuild(id: number) {
  const db = getDb();
  const row = db.prepare(`${OWNER_SELECT} WHERE o.id = @id`).get({ id, week: weekKey() }) as Record<string, unknown> | undefined;
  if (!row) return null;
  const extra = db.prepare('SELECT description, mods, seed_config FROM owner_builds WHERE id = ?').get(id) as { description: string; mods: string; seed_config: string | null };
  const photos = (db.prepare('SELECT id, path FROM owner_photos WHERE owner_build_id = ? ORDER BY position').all(id) as { id: number; path: string }[]).map((p) => p.path);
  return { ...toOwnerCard(row), description: extra.description, mods: extra.mods, photos, seedConfig: extra.seed_config };
}

// ---------- Users ----------

export function getUserProfile(id: number, viewerId?: number) {
  const db = getDb();
  const u = db.prepare('SELECT id, name, bio, location, avatar_color, women_builder, created_at FROM users WHERE id = ?').get(id) as Record<string, unknown> | undefined;
  if (!u) return null;
  const count = (sql: string) => (db.prepare(sql).get(id) as { n: number }).n;
  return {
    id: u.id as number,
    name: u.name as string,
    bio: u.bio as string,
    location: u.location as string,
    color: u.avatar_color as string,
    womenBuilder: u.women_builder === 1,
    joined: u.created_at as string,
    followers: count('SELECT COUNT(*) AS n FROM follows WHERE followee_id = ?'),
    following: count('SELECT COUNT(*) AS n FROM follows WHERE follower_id = ?'),
    likesReceived: count("SELECT COUNT(*) AS n FROM likes l JOIN builds b ON l.target_type = 'build' AND l.target_id = b.id WHERE b.user_id = ?") + count("SELECT COUNT(*) AS n FROM likes l JOIN owner_builds o ON l.target_type = 'owner' AND l.target_id = o.id WHERE o.user_id = ?"),
    viewerFollows: viewerId ? !!db.prepare('SELECT 1 FROM follows WHERE follower_id = ? AND followee_id = ?').get(viewerId, id) : false,
  };
}

export function toggleFollow(followerId: number, followeeId: number) {
  const db = getDb();
  const exists = db.prepare('SELECT 1 FROM follows WHERE follower_id = ? AND followee_id = ?').get(followerId, followeeId);
  if (exists) db.prepare('DELETE FROM follows WHERE follower_id = ? AND followee_id = ?').run(followerId, followeeId);
  else db.prepare('INSERT INTO follows (follower_id, followee_id) VALUES (?, ?)').run(followerId, followeeId);
  const { n } = db.prepare('SELECT COUNT(*) AS n FROM follows WHERE followee_id = ?').get(followeeId) as { n: number };
  return { following: !exists, followers: n };
}

// ---------- Likes, votes, comments ----------

export function toggleLike(userId: number, type: TargetType, id: number) {
  const db = getDb();
  const exists = db.prepare('SELECT 1 FROM likes WHERE user_id = ? AND target_type = ? AND target_id = ?').get(userId, type, id);
  if (exists) db.prepare('DELETE FROM likes WHERE user_id = ? AND target_type = ? AND target_id = ?').run(userId, type, id);
  else db.prepare('INSERT INTO likes (user_id, target_type, target_id) VALUES (?, ?, ?)').run(userId, type, id);
  const { n } = db.prepare('SELECT COUNT(*) AS n FROM likes WHERE target_type = ? AND target_id = ?').get(type, id) as { n: number };
  return { liked: !exists, likes: n };
}

export function toggleVote(userId: number, type: TargetType, id: number) {
  const db = getDb();
  const week = weekKey();
  const exists = db.prepare('SELECT 1 FROM votes WHERE user_id = ? AND target_type = ? AND target_id = ? AND week = ?').get(userId, type, id, week);
  if (exists) db.prepare('DELETE FROM votes WHERE user_id = ? AND target_type = ? AND target_id = ? AND week = ?').run(userId, type, id, week);
  else db.prepare('INSERT INTO votes (user_id, target_type, target_id, week) VALUES (?, ?, ?, ?)').run(userId, type, id, week);
  const { n } = db.prepare('SELECT COUNT(*) AS n FROM votes WHERE target_type = ? AND target_id = ? AND week = ?').get(type, id, week) as { n: number };
  return { voted: !exists, votes: n };
}

export function viewerState(userId: number | undefined, type: TargetType, ids: number[]) {
  const liked = new Set<number>();
  const voted = new Set<number>();
  if (!userId || !ids.length) return { liked, voted };
  const db = getDb();
  const ph = ids.map(() => '?').join(',');
  for (const r of db.prepare(`SELECT target_id FROM likes WHERE user_id = ? AND target_type = ? AND target_id IN (${ph})`).all(userId, type, ...ids) as { target_id: number }[]) liked.add(r.target_id);
  for (const r of db.prepare(`SELECT target_id FROM votes WHERE user_id = ? AND target_type = ? AND week = ? AND target_id IN (${ph})`).all(userId, type, weekKey(), ...ids) as { target_id: number }[]) voted.add(r.target_id);
  return { liked, voted };
}

export type CommentView = { id: number; body: string; createdAt: string; user: UserRef };

export function listComments(type: TargetType, id: number): CommentView[] {
  return (
    getDb()
      .prepare('SELECT c.id, c.body, c.created_at, u.id AS uid, u.name, u.avatar_color FROM comments c JOIN users u ON u.id = c.user_id WHERE c.target_type = ? AND c.target_id = ? ORDER BY c.created_at ASC, c.id ASC')
      .all(type, id) as Record<string, unknown>[]
  ).map((r) => ({ id: r.id as number, body: r.body as string, createdAt: r.created_at as string, user: { id: r.uid as number, name: r.name as string, color: r.avatar_color as string } }));
}

// ---------- Ratings ----------

export type RenderCard = { id: number; path: string; buildId: number; buildHref: string; title: string; model: string; rim: string; tire: string; user: UserRef; votes: number; createdAt: string };

export function listRenders(limit = 50, week = weekKey()): RenderCard[] {
  const rows = getDb()
    .prepare(
      `SELECT r.id, r.path, r.created_at, b.id AS bid, b.title, b.config, m.make, m.model, m.generation, u.id AS uid, u.name, u.avatar_color,
              (SELECT COUNT(*) FROM votes v WHERE v.target_type = 'render' AND v.target_id = r.id AND v.week = ?) AS votes
       FROM renders r JOIN builds b ON b.id = r.build_id JOIN car_models m ON m.id = b.model_id JOIN users u ON u.id = r.user_id
       ORDER BY votes DESC, r.created_at DESC LIMIT ?`,
    )
    .all(week, limit) as Record<string, unknown>[];
  return rows.map((r) => {
    const c = JSON.parse(r.config as string);
    const et = c.offset >= 0 ? `+${c.offset}` : `${c.offset}`;
    return {
      id: r.id as number,
      path: r.path as string,
      buildId: r.bid as number,
      buildHref: buildHref(r.bid as number, r.title as string),
      title: r.title as string,
      model: modelLabel({ make: r.make as string, model: r.model as string, generation: r.generation as string }),
      rim: `${c.diameter}×${c.width} ${et}`,
      tire: `${c.tireWidth}/${c.tireAspect}R${c.diameter}`,
      user: { id: r.uid as number, name: r.name as string, color: r.avatar_color as string },
      votes: r.votes as number,
      createdAt: r.created_at as string,
    };
  });
}

export function buildStandings(limit = 100): BuildCard[] {
  return listBuilds({ limit: 200 }).items.sort((a, b) => b.votes - a.votes || b.likes - a.likes).slice(0, limit);
}

export function ownerStandings(limit = 100): OwnerCard[] {
  return listOwnerBuilds({ limit: 200 }).items.sort((a, b) => b.votes - a.votes || b.likes - a.likes).slice(0, limit);
}

/** Division winners for closed weeks, most recent first. */
export function pastChampions(weeks = 3) {
  const db = getDb();
  const out: { week: string; build: BuildCard | null; owner: { id: number; title: string; href: string; user: string; votes: number } | null; buildVotes: number }[] = [];
  for (let i = 1; i <= weeks; i++) {
    const wk = previousWeekKey(i);
    const b = db.prepare("SELECT target_id AS id, COUNT(*) AS n FROM votes WHERE target_type = 'build' AND week = ? GROUP BY target_id ORDER BY n DESC LIMIT 1").get(wk) as { id: number; n: number } | undefined;
    const o = db.prepare("SELECT target_id AS id, COUNT(*) AS n FROM votes WHERE target_type = 'owner' AND week = ? GROUP BY target_id ORDER BY n DESC LIMIT 1").get(wk) as { id: number; n: number } | undefined;
    if (!b && !o) continue;
    const buildCard = b ? listBuilds({ limit: 200 }).items.find((x) => x.id === b.id) ?? null : null;
    const ownerRow = o ? (db.prepare('SELECT o.id, o.title, u.name FROM owner_builds o JOIN users u ON u.id = o.user_id WHERE o.id = ?').get(o.id) as { id: number; title: string; name: string } | undefined) : undefined;
    out.push({
      week: wk,
      build: buildCard,
      buildVotes: b?.n ?? 0,
      owner: ownerRow && o ? { id: ownerRow.id, title: ownerRow.title, href: ownerHref(ownerRow.id, ownerRow.title), user: ownerRow.name, votes: o.n } : null,
    });
  }
  return out;
}

// ---------- Activity feed ----------

export type Activity = { kind: '3D' | 'BUILD' | 'AI' | 'JOURNAL'; who: UserRef; text: string; title: string; href: string; at: string };

export function recentActivity(limit = 8): Activity[] {
  const rows = getDb()
    .prepare(
      `SELECT * FROM (
         SELECT '3D' AS kind, b.user_id AS uid, b.title AS title, b.id AS id, b.created_at AS at FROM builds b
         UNION ALL SELECT 'BUILD', o.user_id, o.title, o.id, o.created_at FROM owner_builds o
         UNION ALL SELECT 'AI', r.user_id, bb.title, bb.id, r.created_at FROM renders r JOIN builds bb ON bb.id = r.build_id
         UNION ALL SELECT 'JOURNAL', a.user_id, a.title, a.id, a.created_at FROM articles a
       ) act JOIN users u ON u.id = act.uid ORDER BY act.at DESC LIMIT ?`,
    )
    .all(limit) as Record<string, unknown>[];
  const verb = { '3D': 'built in 3D.', BUILD: 'added an owner build.', AI: 'rendered a build.', JOURNAL: 'published an article.' } as const;
  return rows.map((r) => {
    const kind = r.kind as Activity['kind'];
    const title = r.title as string;
    const id = r.id as number;
    const href = kind === 'BUILD' ? ownerHref(id, title) : kind === 'JOURNAL' ? `/articles/${id}-${slugify(title)}` : buildHref(id, title);
    return { kind, who: { id: r.uid as number, name: r.name as string, color: r.avatar_color as string }, text: verb[kind], title, href, at: r.at as string };
  });
}
