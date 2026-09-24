import { notFound } from 'next/navigation';
import { getBuild } from '@/lib/builds';
import { getModel, partsByIds } from '@/lib/catalog';
import { getOwnerBuild } from '@/lib/community';
import { getDb } from '@/lib/db';
import type { BuildConfig } from '@/lib/build-config';
import RenderHarness from './RenderHarness';

/** Dev-only: renders a seeded build full-frame so scripts/render-seed-images.mjs can capture it. */
export default async function DevRender({ searchParams }: { searchParams: Promise<{ kind?: string; id?: string; view?: string }> }) {
  if (process.env.ALLOW_SEED_RENDER !== '1') notFound();
  const sp = await searchParams;
  const id = Number(sp.id);
  let config: BuildConfig | null = null;
  let modelId = 0;
  if (sp.kind === 'owner') {
    const o = getOwnerBuild(id);
    if (!o?.seedConfig || !o.modelId) notFound();
    config = JSON.parse(o.seedConfig);
    modelId = o.modelId;
  } else {
    const b = getBuild(id);
    if (!b) notFound();
    config = b.config;
    modelId = b.modelId;
  }
  const model = getModel(modelId)!;
  const wheel = config!.wheelPartId ? partsByIds([config!.wheelPartId]).get(config!.wheelPartId) : undefined;
  const slugs = Object.values(config!.aero).filter(Boolean) as string[];
  const rows = slugs.length ? (getDb().prepare(`SELECT slug, specs FROM parts WHERE slug IN (${slugs.map(() => '?').join(',')})`).all(...slugs) as { slug: string; specs: string }[]) : [];
  const aero = Object.fromEntries(Object.entries(config!.aero).map(([k, v]) => [k, v ? JSON.parse(rows.find((r) => r.slug === v)?.specs ?? '{}').shape ?? null : null]));
  return <RenderHarness model={model} config={config!} wheelStyle={wheel?.style ?? 'five-spoke'} aero={aero} view={sp.view ?? 'front34'} />;
}
