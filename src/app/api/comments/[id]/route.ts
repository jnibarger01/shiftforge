import { ApiError, intParam, json, route } from '@/lib/api';
import { getDb } from '@/lib/db';

export const DELETE = route<{ id: string }>(
  async ({ user, params }) => {
    const id = intParam(params.id, 'comment id');
    const row = getDb().prepare('SELECT user_id FROM comments WHERE id = ?').get(id) as { user_id: number } | undefined;
    if (!row) throw new ApiError(404, 'Comment not found');
    if (row.user_id !== user!.id) throw new ApiError(403, 'You can only delete your own comments');
    getDb().prepare('DELETE FROM comments WHERE id = ?').run(id);
    return json({ ok: true });
  },
  { auth: true },
);
