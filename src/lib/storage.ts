import 'server-only';
import fs from 'node:fs';
import path from 'node:path';
import { randomBytes } from 'node:crypto';
import { UPLOAD_DIR } from './db';
import { ApiError } from './api';

export const MAX_IMAGE_BYTES = 6 * 1024 * 1024;

const TYPES: { ext: string; mime: string; test: (b: Buffer) => boolean }[] = [
  { ext: 'png', mime: 'image/png', test: (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  { ext: 'jpg', mime: 'image/jpeg', test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { ext: 'webp', mime: 'image/webp', test: (b) => b.subarray(0, 4).toString('ascii') === 'RIFF' && b.subarray(8, 12).toString('ascii') === 'WEBP' },
];

export const MIME_BY_EXT: Record<string, string> = Object.fromEntries(TYPES.map((t) => [t.ext, t.mime]));

/** Validate by magic bytes (never trust the client's content-type) and write under data/uploads. */
export function saveImage(buf: Buffer, folder: 'builds' | 'owners' | 'renders'): string {
  if (buf.length === 0) throw new ApiError(400, 'Empty image');
  if (buf.length > MAX_IMAGE_BYTES) throw new ApiError(413, 'Images must be 6 MB or smaller');
  const type = TYPES.find((t) => t.test(buf));
  if (!type) throw new ApiError(415, 'Only PNG, JPEG or WebP images are allowed');
  const dir = path.join(UPLOAD_DIR, folder);
  fs.mkdirSync(dir, { recursive: true });
  const name = `${randomBytes(12).toString('hex')}.${type.ext}`;
  fs.writeFileSync(path.join(dir, name), buf);
  return `/media/${folder}/${name}`;
}

export function saveDataUrl(dataUrl: unknown, folder: 'builds' | 'owners' | 'renders'): string {
  if (typeof dataUrl !== 'string') throw new ApiError(400, 'Missing image');
  const m = dataUrl.match(/^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/=]+)$/);
  if (!m) throw new ApiError(400, 'Image must be a base64 PNG, JPEG or WebP data URL');
  return saveImage(Buffer.from(m[2], 'base64'), folder);
}

export function deleteMedia(webPath: string | null | undefined) {
  if (!webPath?.startsWith('/media/')) return;
  const file = path.join(UPLOAD_DIR, webPath.slice('/media/'.length));
  if (file.startsWith(UPLOAD_DIR + path.sep)) fs.rm(file, { force: true }, () => {});
}
