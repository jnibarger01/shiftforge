import { ApiError, json, route, str } from '@/lib/api';
import { getModel } from '@/lib/catalog';
import { ownerHref } from '@/lib/community';
import { tx } from '@/lib/db';
import { deleteMedia, saveImage } from '@/lib/storage';

const USAGE = ['Daily', 'Weekend', 'Track', 'Show', 'Project'];

export const POST = route(
  async ({ req, user }) => {
    let form: FormData;
    try {
      form = await req.formData();
    } catch {
      throw new ApiError(400, 'Expected a multipart form');
    }
    const title = str(form.get('title'), 'Title', { min: 2, max: 80 });
    const description = str(form.get('description') ?? '', 'Story', { max: 2000 });
    const mods = str(form.get('mods') ?? '', 'Mods', { max: 500 });
    const usage = USAGE.includes(String(form.get('usage'))) ? String(form.get('usage')) : 'Daily';
    const modelId = Number(form.get('modelId')) || null;
    if (modelId && !getModel(modelId)) throw new ApiError(400, 'Unknown car model');
    const yearRaw = Number(form.get('year'));
    const year = Number.isInteger(yearRaw) && yearRaw >= 1950 && yearRaw <= 2027 ? yearRaw : null;
    const files = form.getAll('photos').filter((f): f is File => typeof f === 'object' && 'arrayBuffer' in f && f.size > 0);
    if (!files.length) throw new ApiError(400, 'Add at least one photo of your car');
    if (files.length > 8) throw new ApiError(400, 'Up to 8 photos per build');
    const saved: string[] = [];
    try {
      for (const f of files) saved.push(saveImage(Buffer.from(await f.arrayBuffer()), 'owners'));
      const id = tx((db) => {
        const r = db.prepare('INSERT INTO owner_builds (user_id, model_id, year, title, description, usage, mods) VALUES (?, ?, ?, ?, ?, ?, ?)').run(user!.id, modelId, year, title, description, usage, mods);
        const oid = Number(r.lastInsertRowid);
        const ins = db.prepare('INSERT INTO owner_photos (owner_build_id, path, position) VALUES (?, ?, ?)');
        saved.forEach((p, i) => ins.run(oid, p, i));
        return oid;
      });
      return json({ id, href: ownerHref(id, title) }, 201);
    } catch (err) {
      saved.forEach(deleteMedia);
      throw err;
    }
  },
  { auth: true },
);
