import { beforeAll, describe, expect, it } from 'vitest';
import os from 'node:os';
import fs from 'node:fs';
import path from 'node:path';

beforeAll(() => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sf-test-'));
  process.env.DATA_DIR = dir;
  process.env.DATABASE_PATH = path.join(dir, 'test.db');
});

describe('seeded database', () => {
  it('seeds models, parts, builds and community content', async () => {
    const { getDb } = await import('@/lib/db');
    const db = getDb();
    const count = (t: string) => (db.prepare(`SELECT COUNT(*) AS n FROM ${t}`).get() as { n: number }).n;
    expect(count('car_models')).toBe(18);
    expect(count('parts')).toBeGreaterThan(40);
    expect(count('builds')).toBe(36);
    expect(count('owner_builds')).toBeGreaterThan(10);
    expect(count('articles')).toBeGreaterThan(8);
    expect(count('votes')).toBeGreaterThan(50);
  });

  it('every seeded build config is sane and mostly fits', async () => {
    const { getDb } = await import('@/lib/db');
    const { getModel } = await import('@/lib/catalog');
    const { sanitizeConfig } = await import('@/lib/build-config');
    const { analyzeFitment } = await import('@/lib/fitment');
    const rows = getDb().prepare('SELECT model_id, config FROM builds').all() as { model_id: number; config: string }[];
    let bad = 0;
    for (const r of rows) {
      const model = getModel(r.model_id)!;
      const raw = JSON.parse(r.config);
      expect(sanitizeConfig(raw, model)).toEqual(raw);
      if (analyzeFitment(raw, model).verdict === 'bad') bad++;
    }
    expect(bad).toBeLessThan(rows.length / 3);
  });

  it('lists builds with filters and toggles likes/votes', async () => {
    const { listBuilds } = await import('@/lib/builds');
    const { toggleLike, toggleVote } = await import('@/lib/community');
    const all = listBuilds({ limit: 100 });
    expect(all.total).toBe(36);
    const first = all.items[0];
    expect(first.rim).toMatch(/×/);
    expect(listBuilds({ modelId: first.modelId }).items.every((b) => b.modelId === first.modelId)).toBe(true);
    const like = toggleLike(1, 'build', first.id);
    expect(toggleLike(1, 'build', first.id).liked).toBe(!like.liked);
    const v1 = toggleVote(1, 'build', first.id);
    const v2 = toggleVote(1, 'build', first.id);
    expect(v2.votes).toBe(v1.voted ? v1.votes - 1 : v1.votes + 1);
  });

  it('verifies the demo password and rejects a wrong one', async () => {
    const { getDb } = await import('@/lib/db');
    const { verifyPassword } = await import('@/lib/password');
    const { DEMO_EMAIL, DEMO_PASSWORD } = await import('@/lib/seed');
    const row = getDb().prepare('SELECT password_hash FROM users WHERE email = ?').get(DEMO_EMAIL) as { password_hash: string };
    expect(verifyPassword(DEMO_PASSWORD, row.password_hash)).toBe(true);
    expect(verifyPassword('nope', row.password_hash)).toBe(false);
  });
});
