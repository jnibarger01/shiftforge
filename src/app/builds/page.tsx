import type { Metadata } from 'next';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import { listBuilds, type Range } from '@/lib/builds';
import { getModel, listModels, modelLabel } from '@/lib/catalog';
import { listOwnerBuilds, viewerState } from '@/lib/community';
import { BuildCard } from '@/components/ui/Cards';
import Pager from '@/components/ui/Pager';

export const metadata: Metadata = {
  title: '3D Mods Lab — Car Builds Gallery',
  description: 'Community car builds from the 3D Mods Lab: wheels, offsets, tires, drops and aero on real car models. Vote, remix and build your own.',
  alternates: { canonical: '/builds' },
};

const PAGE = 24;
type SP = { sort?: string; range?: string; modelIds?: string; women?: string; page?: string; make?: string };

export default async function BuildsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const sort = sp.sort === 'new' ? 'new' : 'trending';
  const range = (['today', 'week', 'month', 'all'].includes(sp.range ?? '') ? sp.range : 'week') as Range;
  const modelId = Number(sp.modelIds) || undefined;
  const model = modelId ? getModel(modelId) : null;
  const women = sp.women === '1';
  const page = Math.max(1, Number(sp.page) || 1);
  const user = await getCurrentUser();
  const { items, total } = listBuilds({ sort, range, modelId, women, make: sp.make || undefined, limit: PAGE, offset: (page - 1) * PAGE });
  const trending = listBuilds({ sort: 'trending', range: 'week', limit: 4 }).items;
  const state = viewerState(user?.id, 'build', items.map((b) => b.id));
  const owners = listOwnerBuilds({ sort: 'new', limit: 6 }).items;
  const makes = [...new Set(listModels().map((m) => m.make))].sort();
  const qs = (patch: Partial<SP>) => {
    const next = { ...sp, ...patch, page: undefined };
    const q = new URLSearchParams(Object.entries(next).filter(([, v]) => v) as [string, string][]);
    return `/builds${q.toString() ? `?${q}` : ''}`;
  };

  return (
    <div className="container page">
      <div className="section-head">
        <div>
          <h1 className="page-title">
            Community 3D Builds<span className="accent">:</span>Ratings
          </h1>
          <p className="section-sub">What the community is building right now. Climb the boards.</p>
        </div>
        <span className="spacer" />
        <Link href="/garage" className="btn btn-primary">
          + Build in 3D
        </Link>
      </div>

      {!model && page === 1 && (
        <div className="grid-4" style={{ marginBottom: 28 }}>
          {trending.map((b, i) => (
            <Link key={b.id} href={b.href} className="uc" style={{ minHeight: 0 }}>
              <div className="uc-media">
                {b.thumb && <img src={b.thumb} alt="" />}
                <div className="uc-top">
                  <span className="badge badge-new">Trending #{i + 1}</span>
                </div>
                <div className="uc-bottom">
                  <div>
                    <div className="uc-sub">{b.user.name}</div>
                    <div className="uc-title">{b.title}</div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="filter-bar">
        <div className="seg" aria-label="Sort">
          <Link href={qs({ sort: undefined })} aria-current={sort === 'trending'}>
            🔥 Trending
          </Link>
          <Link href={qs({ sort: 'new' })} aria-current={sort === 'new'}>
            New
          </Link>
        </div>
        <div className="seg" aria-label="Time range">
          {(['today', 'week', 'month', 'all'] as const).map((r) => (
            <Link key={r} href={qs({ range: r === 'week' ? undefined : r })} aria-current={range === r}>
              {r === 'all' ? 'All time' : r[0].toUpperCase() + r.slice(1)}
            </Link>
          ))}
        </div>
        <Link href={qs({ women: women ? undefined : '1' })} className={`chip${women ? ' active' : ''}`} aria-pressed={women}>
          ♀ Women builders
        </Link>
        <form action="/builds" style={{ display: 'contents' }}>
          <input type="hidden" name="sort" value={sp.sort ?? ''} />
          <label className="sr-only" htmlFor="make-filter">
            Make
          </label>
          <select id="make-filter" name="make" className="select" defaultValue={sp.make ?? ''}>
            <option value="">All makes</option>
            {makes.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
          <button className="btn btn-outline">Apply</button>
        </form>
      </div>
      <p className="muted" style={{ marginBottom: 14 }}>
        Showing <b>{model ? modelLabel(model) : sp.make ? `${sp.make} builds` : 'all builds'}</b> · {sort === 'new' ? 'newest first' : `top of ${range === 'all' ? 'all time' : `this ${range === 'today' ? 'day' : range}`}`} · {total} total
        {model && (
          <>
            {' '}
            · <Link href="/builds" className="accent">clear</Link>
          </>
        )}
      </p>

      {items.length === 0 ? (
        <div className="empty">
          <h3>No builds here yet</h3>
          <p>Be the first to publish one{model ? ` for the ${modelLabel(model)}` : ''}.</p>
          <Link className="btn btn-primary" href={model ? `/garage/${model.slug}` : '/garage'}>
            + Build in 3D
          </Link>
        </div>
      ) : (
        <div className="grid">
          {items.map((b, i) => (
            <BuildCard key={b.id} b={b} rank={sort === 'trending' ? (page - 1) * PAGE + i + 1 : undefined} liked={state.liked.has(b.id)} voted={state.voted.has(b.id)} showVote />
          ))}
        </div>
      )}
      <Pager basePath="/builds" params={{ sort: sp.sort, range: sp.range, modelIds: sp.modelIds, women: sp.women, make: sp.make }} page={page} pageSize={PAGE} total={total} />

      <section className="section">
        <div className="section-head">
          <h2>From Owner&apos;s Club — real cars</h2>
          <span className="spacer" />
          <Link href="/owners-builds/new" className="btn btn-primary btn-sm">
            + Add your ride
          </Link>
          <Link href="/community-builds" className="link-accent">
            Explore all →
          </Link>
        </div>
        <div className="row-scroll">
          {owners.map((o) => (
            <Link key={o.id} href={o.href} className="uc">
              <div className="uc-media">
                {o.photo && <img src={o.photo} alt={o.title} loading="lazy" />}
                <div className="uc-bottom">
                  <div>
                    <div className="uc-sub">{o.user.name}</div>
                    <div className="uc-title">{o.title}</div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
