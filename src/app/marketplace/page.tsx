import type { Metadata } from 'next';
import Link from 'next/link';
import { PART_CATEGORIES, listParts } from '@/lib/catalog';
import { listAuctions } from '@/lib/content';
import { money } from '@/lib/format';
import PartsGrid from '@/components/market/PartsGrid';

export const metadata: Metadata = {
  title: 'Marketplace — Wheels, Tires, Suspension & Aero',
  description: 'Browse aftermarket wheels, tires, coilovers and aero parts. Check fitment on your car in 3D before you buy.',
  alternates: { canonical: '/marketplace' },
};

export default async function MarketplacePage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const auctions = listAuctions().slice(0, 4);
  if (q) {
    const results = listParts({ q });
    return (
      <div className="container page">
        <SearchHeader q={q} />
        <p className="muted" style={{ margin: '12px 0' }}>
          {results.length} result{results.length === 1 ? '' : 's'} for “{q}”
        </p>
        {results.length ? (
          <PartsGrid parts={results} />
        ) : (
          <div className="empty">
            <h3>Nothing matched “{q}”</h3>
            <p>Try a brand (Enkei, BBS, KW) or a part type (coilovers, splitter).</p>
            <Link className="btn btn-outline" href="/marketplace">
              Browse all parts
            </Link>
          </div>
        )}
      </div>
    );
  }
  return (
    <div className="container page">
      <SearchHeader />
      {PART_CATEGORIES.map((c) => {
        const parts = listParts({ category: c.key }).slice(0, 5);
        return (
          <section className="section" key={c.key}>
            <div className="section-head">
              <h2>{c.label}</h2>
              <span className="spacer" />
              <Link className="link-accent" href={`/marketplace/${c.key}`}>
                Explore All
              </Link>
            </div>
            <PartsGrid parts={parts} />
          </section>
        );
      })}
      <section className="section">
        <div className="section-head">
          <h2>Project Cars: Auctions</h2>
          <span className="spacer" />
          <Link className="link-accent" href="/auctions">
            Explore All
          </Link>
        </div>
        <div className="grid">
          {auctions.map((a) => (
            <Link key={a.id} href="/auctions" className="panel" style={{ display: 'grid', gap: 4 }}>
              <span className="badge badge-green" style={{ width: 'fit-content' }}>{a.verdict}</span>
              <b className="mono" style={{ fontSize: 18 }}>~{money(a.estimateCents)} to win</b>
              <b>
                {a.year} {a.make} {a.model}
              </b>
              <span className="muted" style={{ fontSize: 13 }}>
                {a.damage} · {Math.round(a.miles / 1000)}K mi · {a.state}
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function SearchHeader({ q }: { q?: string }) {
  return (
    <div className="section-head">
      <div>
        <h1 className="page-title">
          Marketplace<span className="accent">.</span>
        </h1>
        <p className="section-sub">Wheels, kits & aftermarket parts — try them on your car in 3D first.</p>
      </div>
      <span className="spacer" />
      <form action="/marketplace" role="search" style={{ display: 'flex', gap: 8, flex: '1 1 320px', maxWidth: 480 }}>
        <label className="sr-only" htmlFor="part-q">
          Search parts
        </label>
        <input id="part-q" name="q" className="input" defaultValue={q} placeholder="Search brands and parts…" />
        <button className="btn btn-primary">Search</button>
      </form>
    </div>
  );
}
