import { ApiError, json, readJson, route, str } from '@/lib/api';
import { articleHref } from '@/lib/content';
import { getDb } from '@/lib/db';

const COVERS = ['#2a3342', '#3a2a1f', '#233a2a', '#3a1f24', '#1f2a3a', '#2e1f3a', '#3a331f', '#1f3a36'];

export const POST = route(
  async ({ req, user }) => {
    const body = await readJson(req);
    const kind = body.kind === 'magazine' ? 'magazine' : 'journal';
    const title = str(body.title, 'Title', { min: 4, max: 120 });
    const text = str(body.body, 'Story', { min: 80, max: 20000 });
    const excerpt = str(body.excerpt ?? '', 'Summary', { max: 240 }) || text.replace(/\s+/g, ' ').slice(0, 200);
    let series: string | null = null;
    let episode: number | null = null;
    if (kind === 'journal') {
      series = str(body.series, 'Build name', { min: 2, max: 60 });
      const { n } = getDb().prepare('SELECT COUNT(*) AS n FROM articles WHERE user_id = ? AND series = ?').get(user!.id, series) as { n: number };
      episode = n + 1;
    }
    const cover = COVERS.includes(body.cover as string) ? (body.cover as string) : COVERS[Math.floor(Math.random() * COVERS.length)];
    if (!text.trim()) throw new ApiError(400, 'Write something first');
    const r = getDb().prepare('INSERT INTO articles (user_id, kind, series, episode, title, excerpt, body, cover) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(user!.id, kind, series, episode, title, excerpt, text, cover);
    const id = Number(r.lastInsertRowid);
    return json({ id, href: articleHref(id, title) }, 201);
  },
  { auth: true },
);
