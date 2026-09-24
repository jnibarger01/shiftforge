import fs from 'node:fs';
import path from 'node:path';
import { UPLOAD_DIR } from '@/lib/db';
import { MIME_BY_EXT } from '@/lib/storage';

/** Serves user uploads from data/uploads with a strict path check and content-type allowlist. */
export async function GET(_req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const parts = (await params).path;
  if (parts.some((p) => !/^[a-z0-9]+(\.[a-z0-9]+)?$/i.test(p))) return new Response('Not found', { status: 404 });
  const file = path.join(UPLOAD_DIR, ...parts);
  const mime = MIME_BY_EXT[path.extname(file).slice(1).toLowerCase()];
  if (!mime || !file.startsWith(UPLOAD_DIR + path.sep)) return new Response('Not found', { status: 404 });
  try {
    const data = await fs.promises.readFile(file);
    return new Response(new Uint8Array(data), {
      headers: { 'Content-Type': mime, 'Cache-Control': 'public, max-age=31536000, immutable', 'X-Content-Type-Options': 'nosniff' },
    });
  } catch {
    return new Response('Not found', { status: 404 });
  }
}
