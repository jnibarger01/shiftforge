import { ApiError, json, readJson, route, str } from '@/lib/api';
import { sanitizeConfig } from '@/lib/build-config';
import { buildHref, listBuilds } from '@/lib/builds';
import { getModel } from '@/lib/catalog';
import { getDb } from '@/lib/db';
import { saveDataUrl } from '@/lib/storage';

export const GET = route(async ({ req }) => {
  const url = new URL(req.url);
  const modelId = Number(url.searchParams.get('modelId')) || undefined;
  const offset = Math.max(0, Number(url.searchParams.get('offset')) || 0);
  const sort = url.searchParams.get('sort') === 'new' ? 'new' : 'trending';
  return json(listBuilds({ modelId, offset, sort, limit: 24 }));
});

export const POST = route(
  async ({ req, user }) => {
    const body = await readJson(req);
    const model = getModel(Number((body.config as Record<string, unknown> | undefined)?.modelId));
    if (!model) throw new ApiError(400, 'Pick a car model first');
    const title = str(body.title, 'Title', { min: 2, max: 80 });
    const description = str(body.description ?? '', 'Description', { max: 1000 });
    const config = sanitizeConfig(body.config, model);
    const thumb = body.thumb ? saveDataUrl(body.thumb, 'builds') : null;
    const r = getDb()
      .prepare('INSERT INTO builds (user_id, model_id, title, description, config, thumb) VALUES (?, ?, ?, ?, ?, ?)')
      .run(user!.id, model.id, title, description, JSON.stringify(config), thumb);
    const id = Number(r.lastInsertRowid);
    return json({ id, href: buildHref(id, title) }, 201);
  },
  { auth: true },
);
