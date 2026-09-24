import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { bumpViews, listBuilds } from '@/lib/builds';
import { getModel, modelLabel } from '@/lib/catalog';
import { getOwnerBuild, getUserProfile, listComments, ownerHref, viewerState } from '@/lib/community';
import { compact, timeAgo } from '@/lib/format';
import Avatar from '@/components/ui/Avatar';
import { BuildCard } from '@/components/ui/Cards';
import Comments from '@/components/ui/Comments';
import { LikeButton, ToggleButton, VoteButton } from '@/components/ui/Toggles';
import OwnerGallery from '@/components/owner/OwnerGallery';
import DeleteOwnerBuild from '@/components/owner/DeleteOwnerBuild';

type Props = { params: Promise<{ id: string }> };

async function load(params: Props['params']) {
  const raw = (await params).id;
  const id = Number(raw.split('-')[0]);
  return { raw, o: Number.isInteger(id) ? getOwnerBuild(id) : null };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { o } = await load(params);
  if (!o) return { title: 'Build not found' };
  const car = [o.year, o.model].filter(Boolean).join(' ');
  return {
    title: `${car ? `${car} — ` : ''}${o.title} by ${o.user.name}`,
    description: `Check out this ${car || 'car'} build by ${o.user.name} “${o.title}”. ${o.photos.length} photo${o.photos.length === 1 ? '' : 's'}${o.mods ? `. Mods: ${o.mods}` : ''}.`.slice(0, 300),
    alternates: { canonical: ownerHref(o.id, o.title) },
    openGraph: o.photo ? { images: [o.photo] } : undefined,
  };
}

export default async function OwnerBuildPage({ params }: Props) {
  const { raw, o } = await load(params);
  if (!o) notFound();
  const canonical = ownerHref(o.id, o.title);
  if (`/owners-builds/${raw}` !== canonical) permanentRedirect(canonical);
  bumpViews('owner_builds', o.id);
  const user = await getCurrentUser();
  const state = viewerState(user?.id, 'owner', [o.id]);
  const model = o.modelId ? getModel(o.modelId) : null;
  const ideas = model ? listBuilds({ modelId: model.id, limit: 3 }).items : [];
  const profile = getUserProfile(o.user.id, user?.id);
  return (
    <div className="container page">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href="/community-builds">Owner&apos;s Club</Link> <span>·</span> <b>{model ? modelLabel(model) : 'Car'}</b>
      </nav>
      <div className="detail">
        <div>
          <h1 className="page-title" style={{ marginBottom: 10 }}>
            {o.title}
          </h1>
          <div className="stat-row" style={{ alignItems: 'center', marginBottom: 16 }}>
            <Link href={`/users/${o.user.id}`} style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
              <Avatar name={o.user.name} color={o.user.color} size={30} round /> <b>{o.user.name}</b>
            </Link>
            <span className="muted">
              {o.usage} · Added {timeAgo(o.createdAt)} · {compact(o.views + 1)} views
            </span>
            {user && user.id !== o.user.id && profile && <ToggleButton url="/api/follow" payload={{ userId: o.user.id }} active={profile.viewerFollows} on="Following" off={`Follow ${o.user.name.split(' ')[0]}`} className="btn btn-outline btn-sm" />}
          </div>
          <OwnerGallery photos={o.photos} title={o.title} />
          <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
            <LikeButton target={{ type: 'owner', id: o.id }} liked={state.liked.has(o.id)} count={o.likes} variant="button" />
            <VoteButton target={{ type: 'owner', id: o.id }} voted={state.voted.has(o.id)} count={o.votes} />
            {user?.id === o.user.id && <DeleteOwnerBuild id={o.id} title={o.title} />}
          </div>
          <section className="section">
            <h2 style={{ fontSize: 18, marginBottom: 8 }}>The build</h2>
            <p className="prose" style={{ fontSize: 15 }}>{o.description || 'My custom ride build.'}</p>
            {o.mods && (
              <p style={{ marginTop: 12 }}>
                <span className="kicker">Mods</span> <span className="mono" style={{ fontSize: 13 }}>{o.mods}</span>
              </p>
            )}
          </section>
          <Comments target={{ type: 'owner', id: o.id }} initial={listComments('owner', o.id)} viewerId={user?.id ?? null} />
        </div>
        <aside style={{ display: 'grid', gap: 14 }}>
          <div className="panel">
            <h2>Car</h2>
            <table className="spec-table">
              <tbody>
                <tr><th>Model</th><td>{model ? modelLabel(model) : '—'}</td></tr>
                <tr><th>Year</th><td>{o.year ?? '—'}</td></tr>
                <tr><th>Use</th><td>{o.usage}</td></tr>
                {model && <tr><th>Bolt pattern</th><td>{model.boltPattern}</td></tr>}
              </tbody>
            </table>
          </div>
          {model && (
            <div className="panel">
              <h2>This car in 3D</h2>
              <p className="muted" style={{ fontSize: 13, marginBottom: 12 }}>
                Try wheels, stance and body parts on this model before they go on the car.
              </p>
              <Link className="btn btn-primary btn-block" href={`/garage/${model.slug}`}>
                Build this in 3D
              </Link>
              {ideas.length > 0 && (
                <>
                  <div className="section-head" style={{ marginTop: 16, marginBottom: 8 }}>
                    <h3 style={{ fontSize: 14, margin: 0 }}>Ideas for {model.model} {model.generation}</h3>
                    <span className="spacer" />
                    <Link className="accent" style={{ fontSize: 13 }} href={`/builds?modelIds=${model.id}`}>
                      All →
                    </Link>
                  </div>
                  <div style={{ display: 'grid', gap: 10 }}>
                    {ideas.map((b) => (
                      <BuildCard key={b.id} b={b} />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
