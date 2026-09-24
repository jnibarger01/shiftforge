import { ApiError, intParam, json, readJson, route } from '@/lib/api';
import { toggleFollow } from '@/lib/community';
import { getDb } from '@/lib/db';

export const POST = route(
  async ({ req, user }) => {
    const id = intParam((await readJson(req)).userId, 'user id');
    if (id === user!.id) throw new ApiError(400, 'You cannot follow yourself');
    if (!getDb().prepare('SELECT 1 FROM users WHERE id = ?').get(id)) throw new ApiError(404, 'User not found');
    return json(toggleFollow(user!.id, id));
  },
  { auth: true },
);
