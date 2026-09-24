import type { Metadata } from 'next';
import Link from 'next/link';
import { listEvents, listShops } from '@/lib/content';
import { fmtDate } from '@/lib/format';
import MapExplorer from '@/components/map/MapExplorer';

export const metadata: Metadata = {
  title: 'Map — Car Events and Local Shops Near You',
  description: 'Cars & coffee, track days, autocross, meets and trusted local shops on one map.',
  alternates: { canonical: '/map' },
};

type SP = { tab?: string; category?: string; state?: string; filter?: string };

export default async function MapPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const tab = sp.tab === 'shops' ? 'shops' : 'events';
  const all = listEvents();
  const categories = [...new Set(all.map((e) => e.category))].sort();
  const states = [...new Set([...all.map((e) => e.state), ...listShops().map((s) => s.state)])].sort();
  const items =
    tab === 'events'
      ? listEvents({ category: sp.category, state: sp.state }).map((e) => ({
          id: e.id,
          kind: 'event' as const,
          title: e.title,
          sub: `${e.venue} · ${e.city}, ${e.state}`,
          meta: `${e.category} · ${e.going} going · hosted by ${e.host}`,
          lat: e.lat,
          lng: e.lng,
          href: `/events/${e.id}`,
          date: { d: fmtDate(e.startsAt, { day: 'numeric' }), m: fmtDate(e.startsAt, { month: 'short' }) },
        }))
      : listShops()
          .filter((s) => !sp.state || s.state === sp.state)
          .map((s) => ({ id: s.id, kind: 'shop' as const, title: s.name, sub: `${s.city}, ${s.state} · ${s.phone}`, meta: `${s.reviews} reviews · ${s.services}`, lat: s.lat, lng: s.lng, rating: s.rating, href: `/shops#shop-${s.id}` }));
  const qs = (patch: Partial<SP>) => {
    const q = new URLSearchParams(Object.entries({ ...sp, ...patch }).filter(([, v]) => v) as [string, string][]);
    return `/map${q.toString() ? `?${q}` : ''}`;
  };
  return (
    <div className="container page">
      <div className="section-head">
        <div>
          <h1 className="page-title">
            Local Events and People Near You<span className="accent">.</span>
          </h1>
        </div>
      </div>
      <div className="tabs" style={{ marginBottom: 14 }}>
        <Link href={qs({ tab: undefined, category: undefined })} className={`tab${tab === 'events' ? ' active' : ''}`}>
          Events
        </Link>
        <Link href={qs({ tab: 'shops', category: undefined })} className={`tab${tab === 'shops' ? ' active' : ''}`}>
          Local Shops
        </Link>
      </div>
      <form className="filter-bar" action="/map">
        {tab === 'shops' && <input type="hidden" name="tab" value="shops" />}
        {tab === 'events' && (
          <>
            <label className="sr-only" htmlFor="category">
              Category
            </label>
            <select id="category" name="category" className="select" defaultValue={sp.category ?? ''}>
              <option value="">All event types</option>
              {categories.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </>
        )}
        <label className="sr-only" htmlFor="state">
          State
        </label>
        <select id="state" name="state" className="select" defaultValue={sp.state ?? ''}>
          <option value="">All states</option>
          {states.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <button className="btn btn-outline">Apply</button>
        <span className="muted">{items.length} {tab === 'events' ? 'upcoming events' : 'shops'}</span>
      </form>
      <MapExplorer items={items} empty={tab === 'events' ? 'No upcoming events match. Try another state.' : 'No shops match.'} />
      <p className="muted" style={{ fontSize: 12, marginTop: 8 }}>
        Map data © OpenStreetMap contributors. Events and shops shown are sample listings.
      </p>
    </div>
  );
}
