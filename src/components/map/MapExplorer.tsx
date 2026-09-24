'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Star } from 'lucide-react';
import { osmEmbed } from '@/lib/osm';

type Item = { id: number; kind: 'event' | 'shop'; title: string; sub: string; meta: string; lat: number; lng: number; href?: string; date?: { d: string; m: string }; rating?: number };

export default function MapExplorer({ items, empty }: { items: Item[]; empty: string }) {
  const [sel, setSel] = useState<Item | null>(items[0] ?? null);
  return (
    <div className="map-layout">
      <div className="map-list">
        {items.length === 0 && <div className="empty">{empty}</div>}
        {items.map((it) => (
          <button key={`${it.kind}${it.id}`} className="map-item" aria-pressed={sel?.id === it.id && sel.kind === it.kind} onClick={() => setSel(it)}>
            <div style={{ display: 'flex', gap: 10 }}>
              {it.date && (
                <span className="date-badge" aria-hidden>
                  <b>{it.date.d}</b>
                  <small>{it.date.m}</small>
                </span>
              )}
              <div style={{ display: 'grid', gap: 3, minWidth: 0 }}>
                <b>{it.title}</b>
                <small>{it.sub}</small>
                <small>
                  {it.rating !== undefined && (
                    <>
                      <Star size={11} fill="var(--gold)" color="var(--gold)" aria-hidden /> {it.rating} ·{' '}
                    </>
                  )}
                  {it.meta}
                </small>
              </div>
            </div>
            {sel?.id === it.id && sel.kind === it.kind && it.href && (
              <Link className="accent" style={{ fontSize: 13 }} href={it.href} onClick={(e) => e.stopPropagation()}>
                Details & RSVP →
              </Link>
            )}
          </button>
        ))}
      </div>
      <div className="map-frame">
        <iframe key={sel ? `${sel.kind}${sel.id}` : 'us'} title={sel ? `Map: ${sel.title}` : 'Map of the United States'} src={osmEmbed(sel?.lat, sel?.lng)} loading="lazy" referrerPolicy="no-referrer" />
      </div>
    </div>
  );
}
