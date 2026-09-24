import type { Metadata } from 'next';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import { listBuilds } from '@/lib/builds';
import { viewerState } from '@/lib/community';
import { BuildCard } from '@/components/ui/Cards';

export const metadata: Metadata = {
  title: 'Fitment Search — Find Cars Running Your Wheel Size',
  description: 'Search community builds by wheel diameter, width, offset and tire size to see how a fitment looks before you buy.',
  alternates: { canonical: '/fitment' },
};

type SP = { wheelDiameter?: string; diameter?: string; wheelWidth?: string; width?: string; wheelEtMin?: string; etMin?: string; wheelEtMax?: string; etMax?: string; tireSize?: string; tire?: string };
const num = (v?: string) => (v !== undefined && v !== '' && Number.isFinite(Number(v)) ? Number(v) : undefined);

export default async function FitmentPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const f = {
    diameter: num(sp.diameter ?? sp.wheelDiameter),
    width: num(sp.width ?? sp.wheelWidth),
    etMin: num(sp.etMin ?? sp.wheelEtMin),
    etMax: num(sp.etMax ?? sp.wheelEtMax),
    tire: (sp.tire ?? sp.tireSize)?.toUpperCase(),
  };
  const searched = Object.values(f).some((v) => v !== undefined && v !== '');
  const user = await getCurrentUser();
  const { items, total } = searched ? listBuilds({ fitment: f, limit: 60, range: 'all' }) : { items: [], total: 0 };
  const state = viewerState(user?.id, 'build', items.map((b) => b.id));
  return (
    <div className="container page">
      <h1 className="page-title">
        Fitment search<span className="accent">.</span>
      </h1>
      <p className="section-sub" style={{ marginBottom: 18 }}>
        See every community build running a wheel and tire size — the fastest way to know how a fitment actually sits.
      </p>
      <form className="panel form" action="/fitment" style={{ marginBottom: 24 }}>
        <div className="form-row">
          <div className="field">
            <label htmlFor="diameter">Diameter (in)</label>
            <input id="diameter" name="diameter" className="input" type="number" min={14} max={24} defaultValue={f.diameter} placeholder="18" />
          </div>
          <div className="field">
            <label htmlFor="width">Width (in)</label>
            <input id="width" name="width" className="input" type="number" step={0.5} min={5} max={13} defaultValue={f.width} placeholder="9.5" />
          </div>
          <div className="field">
            <label htmlFor="etMin">Offset from</label>
            <input id="etMin" name="etMin" className="input" type="number" min={-50} max={70} defaultValue={f.etMin} placeholder="20" />
          </div>
          <div className="field">
            <label htmlFor="etMax">Offset to</label>
            <input id="etMax" name="etMax" className="input" type="number" min={-50} max={70} defaultValue={f.etMax} placeholder="40" />
          </div>
          <div className="field">
            <label htmlFor="tire">Tire size</label>
            <input id="tire" name="tire" className="input" defaultValue={f.tire} placeholder="255/35R19" pattern="\d{3}/\d{2}Z?R\d{2}" title="Format: 255/35R19" />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-primary">Find builds</button>
          {searched && (
            <Link href="/fitment" className="btn btn-ghost">
              Reset
            </Link>
          )}
        </div>
      </form>
      {!searched ? (
        <div className="empty">
          <h3>Enter a wheel or tire size</h3>
          <p>
            Try <Link className="accent" href="/fitment?diameter=18&width=9.5">18×9.5</Link>, <Link className="accent" href="/fitment?diameter=19">any 19″</Link> or{' '}
            <Link className="accent" href="/fitment?etMin=20&etMax=35">ET20–35</Link>.
          </p>
        </div>
      ) : items.length === 0 ? (
        <div className="empty">
          <h3>No builds run that fitment yet</h3>
          <p>Widen the offset range, or build it yourself in the Lab.</p>
          <Link className="btn btn-primary" href="/garage">
            Open the 3D Mods Lab
          </Link>
        </div>
      ) : (
        <>
          <p className="muted" style={{ marginBottom: 12 }}>
            {total} build{total === 1 ? '' : 's'} found
          </p>
          <div className="grid">
            {items.map((b) => (
              <BuildCard key={b.id} b={b} liked={state.liked.has(b.id)} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
