import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { listBuilds } from '@/lib/builds';
import { getModel, listModels, modelYears } from '@/lib/catalog';
import ModelPicker from '@/components/lab/ModelPicker';
import { BuildCard } from '@/components/ui/Cards';

export const metadata: Metadata = {
  title: '3D Mods Lab — Pick Your Car',
  description: 'Choose your car and try wheels, offsets, tires, suspension drop, paint and aero in 3D with a live fitment check.',
  alternates: { canonical: '/garage' },
};

export default async function GaragePage({ searchParams }: { searchParams: Promise<{ modelId?: string }> }) {
  const { modelId } = await searchParams;
  if (modelId) {
    const m = getModel(Number(modelId));
    if (m) redirect(`/garage/${m.slug}`);
  }
  const user = await getCurrentUser();
  const models = listModels();
  const mine = user ? listBuilds({ userId: user.id, sort: 'new', limit: 8 }).items : [];
  const counts = new Map(models.map((m) => [m.id, listBuilds({ modelId: m.id, limit: 1 }).total]));
  return (
    <div className="container page">
      <div className="section-head">
        <div>
          <h1 className="page-title">
            3D Mods Lab<span className="accent">:</span> pick your car
          </h1>
          <p className="section-sub">Wheels, offset, tires, stance, paint and aero — with a live fitment check on every change.</p>
        </div>
        <span className="spacer" />
        <Link href="/builds" className="link-accent">
          Community builds →
        </Link>
      </div>
      {mine.length > 0 && (
        <section className="section">
          <div className="section-head">
            <h2>Your builds</h2>
            <span className="spacer" />
            <Link className="link-accent" href={`/users/${user!.id}`}>
              All →
            </Link>
          </div>
          <div className="row-scroll">
            {mine.map((b) => (
              <BuildCard key={b.id} b={b} />
            ))}
          </div>
        </section>
      )}
      <section className="section">
        <ModelPicker models={models.map((m) => ({ id: m.id, slug: m.slug, make: m.make, model: m.model, generation: m.generation, years: modelYears(m), origin: m.origin, body: m.body, bolt: m.boltPattern, paint: m.defaultPaint, builds: counts.get(m.id) ?? 0 }))} />
      </section>
    </div>
  );
}
