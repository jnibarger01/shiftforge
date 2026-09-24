import type { Metadata } from 'next';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import { listAuctions } from '@/lib/content';
import { getDb } from '@/lib/db';
import { money, parseSqlTime } from '@/lib/format';
import { ToggleButton } from '@/components/ui/Toggles';

export const metadata: Metadata = {
  title: 'Project Cars at Auction Prices',
  description: 'Salvage and project cars with an honest verdict and an estimate to win — and a link to plan the build in 3D.',
  alternates: { canonical: '/auctions' },
};

function endsIn(s: string) {
  const ms = parseSqlTime(s).getTime() - Date.now();
  const h = Math.max(0, Math.floor(ms / 3600000));
  return h < 24 ? `${h}h left` : h < 48 ? 'Tomorrow' : `${Math.floor(h / 24)} days left`;
}

export default async function AuctionsPage({ searchParams }: { searchParams: Promise<{ make?: string; max?: string; sort?: string }> }) {
  const sp = await searchParams;
  const user = await getCurrentUser();
  const all = listAuctions();
  const makes = [...new Set(all.map((a) => a.make))].sort();
  const items = listAuctions({ make: sp.make || undefined, maxCents: Number(sp.max) ? Number(sp.max) * 100 : undefined, sort: sp.sort === 'price' ? 'price' : 'ending' });
  const watched = new Set(user ? (getDb().prepare('SELECT auction_id FROM watchlist WHERE user_id = ?').all(user.id) as { auction_id: number }[]).map((r) => r.auction_id) : []);
  const verdictClass: Record<string, string> = { STEAL: 'badge-green', 'WORTH A LOOK': 'badge-green', PROJECT: 'badge-gold', RISKY: 'badge-new' };
  return (
    <div className="container page">
      <h1 className="page-title">
        Project Cars: Auctions<span className="accent">.</span>
      </h1>
      <p className="section-sub" style={{ marginBottom: 16 }}>
        Damaged, cheap, and full of potential. Our verdict is a starting point — inspect before you bid.
      </p>
      <form className="filter-bar" action="/auctions">
        <label className="sr-only" htmlFor="make">
          Make
        </label>
        <select id="make" name="make" className="select" defaultValue={sp.make ?? ''}>
          <option value="">All makes</option>
          {makes.map((m) => (
            <option key={m}>{m}</option>
          ))}
        </select>
        <label className="sr-only" htmlFor="max">
          Max budget
        </label>
        <select id="max" name="max" className="select" defaultValue={sp.max ?? ''}>
          <option value="">Any budget</option>
          <option value="15000">Under $15K</option>
          <option value="25000">Under $25K</option>
          <option value="35000">Under $35K</option>
        </select>
        <label className="sr-only" htmlFor="sort">
          Sort
        </label>
        <select id="sort" name="sort" className="select" defaultValue={sp.sort ?? ''}>
          <option value="">Ending soon</option>
          <option value="price">Lowest estimate</option>
        </select>
        <button className="btn btn-outline">Apply</button>
      </form>
      {items.length === 0 ? (
        <div className="empty">
          <h3>No auctions match</h3>
          <Link className="btn btn-outline" href="/auctions">
            Clear filters
          </Link>
        </div>
      ) : (
        <div className="grid">
          {items.map((a) => (
            <article className="uc" key={a.id}>
              <div className="uc-media" style={{ background: `radial-gradient(circle at 50% 70%, ${a.paint}66, #0d0d12 70%)` }}>
                <div className="uc-top">
                  <span className={`badge ${verdictClass[a.verdict] ?? ''}`}>{a.verdict}</span>
                  <span className="spacer" />
                  <span className="badge">{endsIn(a.endsAt)}</span>
                </div>
                <div className="uc-bottom">
                  <div>
                    <div className="mono" style={{ fontSize: 20, fontWeight: 700 }}>~{money(a.estimateCents)} to win</div>
                    <div className="uc-title">
                      {a.year} {a.make} {a.model}
                    </div>
                  </div>
                </div>
              </div>
              <div className="uc-body">
                <div className="muted" style={{ fontSize: 13 }}>
                  {a.damage} · {a.miles.toLocaleString()} mi · {a.state} · {a.watchers} watching
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {user ? (
                    <ToggleButton url="/api/watch" payload={{ auctionId: a.id }} active={watched.has(a.id)} on="★ Watching" off="☆ Watch" className="btn btn-outline btn-sm" />
                  ) : (
                    <Link className="btn btn-outline btn-sm" href="/signin?next=/auctions">
                      ☆ Watch
                    </Link>
                  )}
                  {a.modelSlug && (
                    <Link className="btn btn-primary btn-sm" href={`/garage/${a.modelSlug}`}>
                      Plan the build in 3D
                    </Link>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
      <p className="muted" style={{ fontSize: 12, marginTop: 16 }}>Auction listings are sample data for demonstration.</p>
    </div>
  );
}
