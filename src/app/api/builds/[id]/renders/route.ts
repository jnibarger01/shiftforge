import { ApiError, intParam, json, readJson, route } from '@/lib/api';
import { getDb } from '@/lib/db';
import { saveDataUrl } from '@/lib/storage';

/** Stores an AI render (generated client-side via Puter) against a build the user owns. */
export const POST = route<{ id: string }>(
  async ({ req, user, params }) => {
    const id = intParam(params.id, 'build id');
    const row = getDb().prepare('SELECT user_id FROM builds WHERE id = ?').get(id) as { user_id: number } | undefined;
    if (!row) throw new ApiError(404, 'Build not found');
    if (row.user_id !== user!.id) throw new ApiError(403, 'Only the builder can add renders');
    const body = await readJson(req);
    const path = saveDataUrl(body.image, 'renders');
    const r = getDb().prepare('INSERT INTO renders (user_id, build_id, path) VALUES (?, ?, ?)').run(user!.id, id, path);
    return json({ id: Number(r.lastInsertRowid), path }, 201);
  },
  { auth: true },
);
