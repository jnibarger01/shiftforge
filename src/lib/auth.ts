import 'server-only';
import { cookies } from 'next/headers';
import { getDb } from './db';
import { newToken, sha256 } from './password';

export const SESSION_COOKIE = 'sf_session';
const SESSION_DAYS = 30;

export type SessionUser = {
  id: number;
  email: string;
  name: string;
  avatarColor: string;
  bio: string;
  location: string;
  womenBuilder: boolean;
};

export function findSessionUser(token: string | undefined): SessionUser | null {
  if (!token) return null;
  const row = getDb()
    .prepare(
      `SELECT u.id, u.email, u.name, u.avatar_color, u.bio, u.location, u.women_builder
       FROM sessions s JOIN users u ON u.id = s.user_id
       WHERE s.token_hash = ? AND s.expires_at > datetime('now')`,
    )
    .get(sha256(token)) as Record<string, unknown> | undefined;
  if (!row) return null;
  return {
    id: row.id as number,
    email: row.email as string,
    name: row.name as string,
    avatarColor: row.avatar_color as string,
    bio: row.bio as string,
    location: row.location as string,
    womenBuilder: row.women_builder === 1,
  };
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const store = await cookies();
  return findSessionUser(store.get(SESSION_COOKIE)?.value);
}

export async function startSession(userId: number) {
  const { token, hash } = newToken();
  const expires = new Date(Date.now() + SESSION_DAYS * 86400000);
  const db = getDb();
  db.prepare("DELETE FROM sessions WHERE expires_at <= datetime('now')").run();
  db.prepare('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)').run(hash, userId, expires.toISOString().slice(0, 19).replace('T', ' '));
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production' && process.env.INSECURE_COOKIES !== '1',
    path: '/',
    expires,
  });
}

export async function endSession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) getDb().prepare('DELETE FROM sessions WHERE token_hash = ?').run(sha256(token));
  store.delete(SESSION_COOKIE);
}
