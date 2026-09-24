import type { Metadata } from 'next';
import Link from 'next/link';
import { Phone, Star } from 'lucide-react';
import { listShops } from '@/lib/content';
import { osmLink } from '@/lib/osm';

export const metadata: Metadata = {
  title: 'Local Shops — Alignment, Wheels, Tuning & Wraps',
  description: 'Community-rated shops for alignment, wheel fitment, suspension, tuning, wraps and fabrication.',
  alternates: { canonical: '/shops' },
};

const SERVICES = ['Wheels', 'Suspension', 'Alignment', 'Tuning', 'Wraps', 'Detailing', 'Fabrication', 'Lifts'];

export default async function ShopsPage({ searchParams }: { searchParams: Promise<{ service?: string }> }) {
  const { service } = await searchParams;
  const shops = listShops({ service });
  return (
    <div className="container page">
      <div className="section-head">
        <div>
          <h1 className="page-title">
            Local Shops<span className="accent">.</span>
          </h1>
          <p className="section-sub">Where the community gets the work done.</p>
        </div>
        <span className="spacer" />
        <Link className="link-accent" href="/map?tab=shops">
          Show on map →
        </Link>
      </div>
      <div className="filter-bar">
        <Link href="/shops" className={`chip${!service ? ' active' : ''}`}>
          All
        </Link>
        {SERVICES.map((s) => (
          <Link key={s} href={`/shops?service=${s}`} className={`chip${service === s ? ' active' : ''}`}>
            {s}
          </Link>
        ))}
      </div>
      {shops.length === 0 ? (
        <div className="empty">
          <h3>No shops list “{service}” yet</h3>
          <Link className="btn btn-outline" href="/shops">
            Show all shops
          </Link>
        </div>
      ) : (
        <div className="grid">
          {shops.map((s) => (
            <article className="panel" key={s.id} id={`shop-${s.id}`} style={{ display: 'grid', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <h2 style={{ margin: 0 }}>{s.name}</h2>
                <span style={{ display: 'inline-flex', gap: 4, alignItems: 'center', fontWeight: 700 }}>
                  <Star size={14} fill="var(--gold)" color="var(--gold)" aria-hidden /> {s.rating}
                </span>
              </div>
              <span className="muted" style={{ fontSize: 13 }}>
                {s.city}, {s.state} · {s.reviews} reviews
              </span>
              <p style={{ fontSize: 14 }}>{s.description}</p>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {s.services.split(', ').map((x) => (
                  <span key={x} className="chip" style={{ cursor: 'default' }}>
                    {x}
                  </span>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <a className="btn btn-outline btn-sm" href={`tel:${s.phone.replace(/[^\d]/g, '')}`}>
                  <Phone size={13} aria-hidden /> {s.phone}
                </a>
                <a className="btn btn-ghost btn-sm" href={osmLink(s.lat, s.lng)} target="_blank" rel="noreferrer">
                  Directions ↗
                </a>
              </div>
            </article>
          ))}
        </div>
      )}
      <p className="muted" style={{ fontSize: 12, marginTop: 16 }}>Shops shown are fictional sample listings (555 numbers).</p>
    </div>
  );
}
