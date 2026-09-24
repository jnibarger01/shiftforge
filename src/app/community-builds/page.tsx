import type { Metadata } from 'next';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import { listBuilds } from '@/lib/builds';
import { listModels } from '@/lib/catalog';
import { listOwnerBuilds, viewerState } from '@/lib/community';
import { BuildCard, OwnerCard } from '@/components/ui/Cards';
import Pager from '@/components/ui/Pager';

export const metadata: Metadata = {
  title: "Owner's Club — Real Owner Car Builds Gallery",
  description: 'Real cars from the community: photos, mods lists and stories from owners. Vote in the weekly ratings and add your own ride.',
  alternates: { canonical: '/community-builds' },
};

const PAGE = 24;
type SP = { make?: string; origin?: string; sort?: string; women?: string; page?: string };

export default async function OwnersClubPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const user = await getCurrentUser();
  const page = Math.max(1, Number(sp.page) || 1);
  const sort = sp.sort === 'new' ? 'new' : 'trending';
  const { items, total } = listOwnerBuilds({ sort, make: sp.make, origin: sp.origin, women: sp.women === '1', limit: PAGE, offset: (page - 1) * PAGE });
  const state = viewerState(user?.id, 'owner', items.map((o) => o.id));
  const makes = [...new Set(listModels().map((m) => m.make))].sort();
  const lab = listBuilds({ sort: 'new', limit: 4 }).items;
  const qs = (patch: Partial<SP>) => {
    const q = new URLSearchParams(Object.entries({ ...sp, ...patch, page: undefined }).filter(([, v]) => v) as [string, string][]);
    return `/community-builds${q.toString() ? `?${q}` : ''}`;
  };
  return (
    <div className="container page">
      <div className="section-head">
        <div>
          <h1 className="page-title">
            Owner&apos;s Club<span className="accent">:</span>Ratings
          </h1>
          <p className="section-sub">Real cars from the community. Climb the boards.</p>
        </div>
        <span className="spacer" />
        <Link href="/owners-builds/new" className="btn btn-primary">
          + Add your ride
        </Link>
      </div>
      <div className="tabs" style={{ marginBottom: 16 }}>
        <Link href={qs({ women: undefined })} className={`tab${sp.women !== '1' ? ' active' : ''}`}>
          Spotlight
        </Link>
        <Link href={qs({ women: '1' })} className={`tab${sp.women === '1' ? ' active' : ''}`}>
          What Women Builders Drive
        </Link>
      </div>
      <div className="filter-bar">
        <span className="kicker">Brand</span>
        <Link href={qs({ make: undefined })} className={`chip${!sp.make ? ' active' : ''}`}>
          All
        </Link>
        {makes.map((m) => (
          <Link key={m} href={qs({ make: m })} className={`chip${sp.make === m ? ' active' : ''}`}>
            {m}
          </Link>
        ))}
      </div>
      <div className="filter-bar">
        <span className="kicker">Origin</span>
        {['German', 'JDM', 'USDM'].map((o) => (
          <Link key={o} href={qs({ origin: sp.origin === o ? undefined : o })} className={`chip${sp.origin === o ? ' active' : ''}`}>
            {o}
          </Link>
        ))}
        <span style={{ flex: 1 }} />
        <div className="seg">
          <Link href={qs({ sort: undefined })} aria-current={sort === 'trending'}>
            🔥 Trending
          </Link>
          <Link href={qs({ sort: 'new' })} aria-current={sort === 'new'}>
            New
          </Link>
        </div>
        <Link href="/map?tab=shops" className="chip">
          🗺 Show on Map
        </Link>
      </div>
      <p className="muted" style={{ marginBottom: 14 }}>
        Showing <b>{sp.make ?? 'all'} builds</b>
        {sp.origin ? ` · ${sp.origin}` : ''} · {sort === 'new' ? 'newest' : 'top of all time'} · {total} total
      </p>
      {items.length === 0 ? (
        <div className="empty">
          <h3>No owner builds match these filters</h3>
          <p>Try another brand, or be the first to add one.</p>
          <div style={{ display: 'flex', gap: 8 }}>
            <Link className="btn btn-outline" href="/community-builds">
              Clear filters
            </Link>
            <Link className="btn btn-primary" href="/owners-builds/new">
              + Add your ride
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid">
          {items.map((o, i) => (
            <OwnerCard key={o.id} o={o} liked={state.liked.has(o.id)} rank={sort === 'trending' ? (page - 1) * PAGE + i + 1 : undefined} />
          ))}
        </div>
      )}
      <Pager basePath="/community-builds" params={{ make: sp.make, origin: sp.origin, sort: sp.sort, women: sp.women }} page={page} pageSize={PAGE} total={total} />
      <section className="section">
        <div className="section-head">
          <h2>From the 3D Mods Lab</h2>
          <span className="spacer" />
          <Link href="/garage" className="btn btn-primary btn-sm">
            + Build in 3D
          </Link>
          <Link href="/builds" className="link-accent">
            Explore all →
          </Link>
        </div>
        <div className="grid">
          {lab.map((b) => (
            <BuildCard key={b.id} b={b} />
          ))}
        </div>
      </section>
    </div>
  );
}
