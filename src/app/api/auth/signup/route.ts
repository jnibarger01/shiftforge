import { ApiError, json, readJson, route, str } from '@/lib/api';
import { startSession } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { hashPassword } from '@/lib/password';
import { clientIp, rateLimit } from '@/lib/rate-limit';

const COLORS = ['#2563eb', '#dc2626', '#16a34a', '#9333ea', '#ea580c', '#0891b2', '#db2777', '#ca8a04'];

export const POST = route(async ({ req }) => {
  rateLimit(`signup:${clientIp(req)}`, 8);
  const body = await readJson(req);
  const name = str(body.name, 'Name', { min: 2, max: 40 });
  const email = str(body.email, 'Email', { min: 3, max: 120 }).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new ApiError(400, 'Enter a valid email address');
  const password = typeof body.password === 'string' ? body.password : '';
  if (password.length < 8) throw new ApiError(400, 'Password must be at least 8 characters');
  if (password.length > 200) throw new ApiError(400, 'Password is too long');
  const db = getDb();
  if (db.prepare('SELECT 1 FROM users WHERE email = ?').get(email)) throw new ApiError(409, 'An account with this email already exists. Try signing in.');
  const color = COLORS[Math.floor(Math.random() * COLORS.length)];
  const r = db.prepare('INSERT INTO users (email, name, password_hash, avatar_color) VALUES (?, ?, ?, ?)').run(email, name, hashPassword(password), color);
  await startSession(Number(r.lastInsertRowid));
  return json({ ok: true, userId: Number(r.lastInsertRowid) }, 201);
});
