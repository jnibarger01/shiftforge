import { ApiError, intParam, json, readJson, route, str } from '@/lib/api';
import { sanitizeConfig } from '@/lib/build-config';
import { buildHref } from '@/lib/builds';
import { getModel } from '@/lib/catalog';
import { getDb } from '@/lib/db';
import { deleteMedia, saveDataUrl } from '@/lib/storage';

function ownBuild(id: number, userId: number) {
  const row = getDb().prepare('SELECT id, user_id, model_id, thumb FROM builds WHERE id = ?').get(id) as { id: number; user_id: number; model_id: number; thumb: string | null } | undefined;
  if (!row) throw new ApiError(404, 'Build not found');
  if (row.user_id !== userId) throw new ApiError(403, 'Only the builder can change this build');
  return row;
}

export const PATCH = route<{ id: string }>(
  async ({ req, user, params }) => {
    const id = intParam(params.id, 'build id');
    const row = ownBuild(id, user!.id);
    const body = await readJson(req);
    const model = getModel(row.model_id)!;
    const title = str(body.title, 'Title', { min: 2, max: 80 });
    const description = str(body.description ?? '', 'Description', { max: 1000 });
    const config = sanitizeConfig(body.config, model);
    let thumb = row.thumb;
    if (body.thumb) {
      thumb = saveDataUrl(body.thumb, 'builds');
      deleteMedia(row.thumb);
    }
    getDb().prepare("UPDATE builds SET title = ?, description = ?, config = ?, thumb = ?, updated_at = datetime('now') WHERE id = ?").run(title, description, JSON.stringify(config), thumb, id);
    return json({ id, href: buildHref(id, title) });
  },
  { auth: true },
);

export const DELETE = route<{ id: string }>(
  async ({ user, params }) => {
    const id = intParam(params.id, 'build id');
    const row = ownBuild(id, user!.id);
    const db = getDb();
    const renders = db.prepare('SELECT path FROM renders WHERE build_id = ?').all(id) as { path: string }[];
    db.prepare("DELETE FROM likes WHERE target_type = 'build' AND target_id = ?").run(id);
    db.prepare("DELETE FROM votes WHERE target_type = 'build' AND target_id = ?").run(id);
    db.prepare("DELETE FROM comments WHERE target_type = 'build' AND target_id = ?").run(id);
    db.prepare('DELETE FROM builds WHERE id = ?').run(id);
    deleteMedia(row.thumb);
    renders.forEach((r) => deleteMedia(r.path));
    return json({ ok: true });
  },
  { auth: true },
);
