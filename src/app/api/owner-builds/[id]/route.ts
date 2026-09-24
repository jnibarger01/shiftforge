import { ApiError, intParam, json, route } from '@/lib/api';
import { getDb } from '@/lib/db';
import { deleteMedia } from '@/lib/storage';

export const DELETE = route<{ id: string }>(
  async ({ user, params }) => {
    const id = intParam(params.id, 'build id');
    const db = getDb();
    const row = db.prepare('SELECT user_id FROM owner_builds WHERE id = ?').get(id) as { user_id: number } | undefined;
    if (!row) throw new ApiError(404, 'Build not found');
    if (row.user_id !== user!.id) throw new ApiError(403, 'Only the owner can delete this build');
    const photos = db.prepare('SELECT path FROM owner_photos WHERE owner_build_id = ?').all(id) as { path: string }[];
    db.prepare("DELETE FROM likes WHERE target_type = 'owner' AND target_id = ?").run(id);
    db.prepare("DELETE FROM votes WHERE target_type = 'owner' AND target_id = ?").run(id);
    db.prepare("DELETE FROM comments WHERE target_type = 'owner' AND target_id = ?").run(id);
    db.prepare('DELETE FROM owner_builds WHERE id = ?').run(id);
    photos.forEach((p) => deleteMedia(p.path));
    return json({ ok: true });
  },
  { auth: true },
);
