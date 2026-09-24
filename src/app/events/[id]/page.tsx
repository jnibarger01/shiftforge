import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getEvent, listEvents } from '@/lib/content';
import { getDb } from '@/lib/db';
import { fmtDate } from '@/lib/format';
import { osmEmbed, osmLink } from '@/lib/osm';
import { ToggleButton } from '@/components/ui/Toggles';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const e = getEvent(Number((await params).id));
  return e ? { title: `${e.title} — ${e.city}, ${e.state}`, description: e.description, alternates: { canonical: `/events/${e.id}` } } : { title: 'Event not found' };
}

export default async function EventPage({ params }: Props) {
  const e = getEvent(Number((await params).id));
  if (!e) notFound();
  const user = await getCurrentUser();
  const going = user ? !!getDb().prepare('SELECT 1 FROM rsvps WHERE user_id = ? AND event_id = ?').get(user.id, e.id) : false;
  const nearby = listEvents().filter((x) => x.id !== e.id).slice(0, 4);
  return (
    <div className="container page">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href="/map">Map</Link> <span>·</span> <span>{e.category}</span>
      </nav>
      <div className="detail">
        <div>
          <h1 className="page-title">{e.title}</h1>
          <p className="section-sub" style={{ margin: '6px 0 16px' }}>
            {fmtDate(e.startsAt, { weekday: 'long', month: 'long', day: 'numeric' })} · 9:00 AM · {e.venue}, {e.city}, {e.state}
          </p>
          <div className="map-frame" style={{ minHeight: 380 }}>
            <iframe title={`Map: ${e.venue}`} src={osmEmbed(e.lat, e.lng, 0.02)} loading="lazy" referrerPolicy="no-referrer" />
          </div>
          <p className="prose" style={{ fontSize: 16, marginTop: 18 }}>{e.description}</p>
        </div>
        <aside className="panel" style={{ display: 'grid', gap: 12 }}>
          <h2 style={{ margin: 0 }}>Hosted by {e.host}</h2>
          <div className="stat">
            <strong>{e.going}</strong>
            <span>going</span>
          </div>
          {user ? (
            <ToggleButton url="/api/rsvp" payload={{ eventId: e.id }} active={going} count={e.going} on="✓ You're going" off="RSVP — I'm going" className="btn btn-primary btn-lg" />
          ) : (
            <Link className="btn btn-primary btn-lg" href={`/signin?next=/events/${e.id}`}>
              Sign in to RSVP
            </Link>
          )}
          <a className="btn btn-outline" href={osmLink(e.lat, e.lng)} target="_blank" rel="noreferrer">
            Open in OpenStreetMap ↗
          </a>
          <h3 style={{ marginTop: 10 }}>More events</h3>
          {nearby.map((n) => (
            <Link key={n.id} href={`/events/${n.id}`} className="map-item">
              <b>{n.title}</b>
              <small>
                {fmtDate(n.startsAt)} · {n.city}, {n.state}
              </small>
            </Link>
          ))}
        </aside>
      </div>
    </div>
  );
}
