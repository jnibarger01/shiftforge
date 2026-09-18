import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, BadgeCheck, Search } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Concept Parts Marketplace',
  description:
    'Browse realistic sample wheels, aero, suspension, exhaust and interior concepts for ShiftForge builds.',
};

const products = [
  ['R-19 Mesh GT', 'Wheels', '$420 / wheel', '19×9.5 +22', 'Machined silver'],
  ['Orbit Mono 5', 'Wheels', '$510 / wheel', '20×10 +28', 'Satin graphite'],
  ['Streetline V2', 'Aero', '$1,850', '3-piece kit', 'FRP concept'],
  ['Circuit Wing 71', 'Aero', '$1,240', '71 in', 'Carbon concept'],
  ['Coil-4 Street', 'Suspension', '$1,290', '32-way', 'Height adjustable'],
  ['Valveback S3', 'Exhaust', '$1,680', '76 mm', 'Valved cat-back'],
  ['Six-Pot Road', 'Brakes', '$2,950', '355 mm', 'Forged caliper'],
  ['Halo Buckets', 'Interior', '$1,390 / pair', 'FIA-style', 'Black cloth'],
];

export default function MarketplacePage() {
  return (
    <main className="page-shell">
      <section className="page-hero marketplace-hero">
        <div>
          <span className="eyebrow">SAMPLE CATALOG</span>
          <h1>Parts that make the build feel real.</h1>
          <p>
            A seeded concept marketplace for exploring categories and budget.
            Listings are illustrative, not verified products or fitment claims.
          </p>
        </div>
        <div className="fake-search">
          <Search size={18} /><span>Search wheels, aero, suspension…</span>
        </div>
      </section>

      <div className="filter-row">
        {['All', 'Wheels', 'Aero', 'Suspension', 'Exhaust', 'Brakes', 'Interior'].map((item, index) => (
          <span className={index === 0 ? 'filter-pill active' : 'filter-pill'} key={item}>{item}</span>
        ))}
      </div>

      <section className="market-grid">
        {products.map(([name, category, price, size, finish], index) => (
          <article className="market-card" key={name}>
            <div className={'market-art market-art-' + ((index % 4) + 1)}>
              <span>{category}</span>
              <strong>{index < 2 ? '◉' : index < 4 ? '▰' : '⚙'}</strong>
            </div>
            <div className="market-copy">
              <span className="eyebrow">{category}</span>
              <h2>{name}</h2>
              <p>{size} · {finish}</p>
              <div className="price-line">
                <strong>{price}</strong>
                <span><BadgeCheck size={14} /> sample listing</span>
              </div>
            </div>
          </article>
        ))}
      </section>

      <div className="notice-card">
        <div>
          <strong>See something worth trying?</strong>
          <p>Use the studio to explore the visual direction before sourcing a real verified part.</p>
        </div>
        <Link className="btn btn-primary" href="/studio">Open studio <ArrowRight size={16} /></Link>
      </div>
    </main>
  );
}
