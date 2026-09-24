'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';

type M = { id: number; slug: string; make: string; model: string; generation: string; years: string; origin: string; body: string; bolt: string; paint: string; builds: number };

const SILHOUETTE: Record<string, string> = {
  coupe: 'M6 38 L14 38 Q16 30 24 30 Q32 30 34 38 L66 38 Q68 30 76 30 Q84 30 86 38 L94 38 L94 30 Q92 26 82 25 L66 16 Q56 12 40 14 L26 23 Q12 25 6 29 Z',
  fastback: 'M6 38 L14 38 Q16 30 24 30 Q32 30 34 38 L66 38 Q68 30 76 30 Q84 30 86 38 L94 38 L94 29 Q92 26 82 25 L64 15 Q54 12 42 14 L18 25 Q10 26 6 30 Z',
  sedan: 'M6 38 L14 38 Q16 30 24 30 Q32 30 34 38 L66 38 Q68 30 76 30 Q84 30 86 38 L94 38 L94 29 Q92 26 82 25 L66 15 Q56 12 38 13 L27 20 L10 24 Q6 26 6 30 Z',
  hatch: 'M6 38 L14 38 Q16 30 24 30 Q32 30 34 38 L66 38 Q68 30 76 30 Q84 30 86 38 L94 38 L94 29 Q92 26 82 25 L66 15 Q56 12 16 13 L8 20 Q6 24 6 30 Z',
  roadster: 'M6 38 L14 38 Q16 30 24 30 Q32 30 34 38 L66 38 Q68 30 76 30 Q84 30 86 38 L94 38 L94 30 Q92 27 80 26 L62 24 L54 18 L50 24 L20 25 Q8 26 6 30 Z',
  suv: 'M6 38 L14 38 Q16 29 24 29 Q32 29 34 38 L66 38 Q68 29 76 29 Q84 29 86 38 L94 38 L94 26 Q92 22 84 22 L70 10 Q60 8 10 9 L7 14 Q6 20 6 30 Z',
  truck: 'M6 38 L14 38 Q16 29 24 29 Q32 29 34 38 L66 38 Q68 29 76 29 Q84 29 86 38 L94 38 L94 25 Q92 21 84 21 L74 9 Q64 7 52 8 L52 21 L6 21 Z',
};

export default function ModelPicker({ models }: { models: M[] }) {
  const [q, setQ] = useState('');
  const [origin, setOrigin] = useState('');
  const makes = useMemo(() => [...new Set(models.map((m) => m.make))].sort(), [models]);
  const [make, setMake] = useState('');
  const shown = models.filter(
    (m) => (!origin || m.origin === origin) && (!make || m.make === make) && (!q || `${m.make} ${m.model} ${m.generation} ${m.years}`.toLowerCase().includes(q.toLowerCase())),
  );
  return (
    <>
      <div className="filter-bar">
        <label className="sr-only" htmlFor="model-q">
          Search cars
        </label>
        <div style={{ position: 'relative', flex: '1 1 260px', maxWidth: 420 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: 13 }} className="muted" aria-hidden />
          <input id="model-q" className="input" style={{ paddingLeft: 36 }} placeholder="Search make, model or chassis (e.g. G80, MK4)…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <label className="sr-only" htmlFor="model-make">
          Make
        </label>
        <select id="model-make" className="select" value={make} onChange={(e) => setMake(e.target.value)}>
          <option value="">All makes</option>
          {makes.map((m) => (
            <option key={m}>{m}</option>
          ))}
        </select>
        <div className="seg" role="group" aria-label="Origin">
          {['', 'German', 'JDM', 'USDM'].map((o) => (
            <button key={o || 'all'} aria-pressed={origin === o} onClick={() => setOrigin(o)}>
              {o || 'All'}
            </button>
          ))}
        </div>
      </div>
      {shown.length === 0 ? (
        <div className="empty">
          <h3>No cars match “{q}”</h3>
          <p>Try a make like BMW or a chassis code like GR86.</p>
          <button className="btn btn-outline" onClick={() => { setQ(''); setMake(''); setOrigin(''); }}>
            Clear filters
          </button>
        </div>
      ) : (
        <div className="model-grid">
          {shown.map((m) => (
            <Link key={m.id} href={`/garage/${m.slug}`} className="model-card">
              <div className="model-art">
                <svg viewBox="0 0 100 44" width="78%" aria-hidden>
                  <path d={SILHOUETTE[m.body] ?? SILHOUETTE.coupe} fill={m.paint} opacity="0.9" />
                  <circle cx="24" cy="37" r="6.5" fill="#0b0b0d" stroke="#888" strokeWidth="1.2" />
                  <circle cx="76" cy="37" r="6.5" fill="#0b0b0d" stroke="#888" strokeWidth="1.2" />
                </svg>
              </div>
              <div className="model-info">
                <b>
                  {m.make} {m.model} {m.generation}
                </b>
                <small>
                  {m.years} · {m.bolt} · {m.builds} builds
                </small>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
