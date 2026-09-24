import { json, readJson, route } from '@/lib/api';
import { toggleLike } from '@/lib/community';
import { parseTarget } from '@/lib/targets';

export const POST = route(
  async ({ req, user }) => {
    const { type, id } = parseTarget(await readJson(req));
    return json(toggleLike(user!.id, type, id));
  },
  { auth: true },
);
