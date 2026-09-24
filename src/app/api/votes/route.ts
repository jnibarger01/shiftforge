import { json, readJson, route } from '@/lib/api';
import { toggleVote } from '@/lib/community';
import { parseTarget } from '@/lib/targets';

export const POST = route(
  async ({ req, user }) => {
    const { type, id } = parseTarget(await readJson(req), ['build', 'owner', 'render']);
    return json(toggleVote(user!.id, type, id));
  },
  { auth: true },
);
