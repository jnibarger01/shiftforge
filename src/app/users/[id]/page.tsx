import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { listBuilds } from '@/lib/builds';
import { getUserProfile, listOwnerBuilds, viewerState } from '@/lib/community';
import { listArticles } from '@/lib/content';
import { fmtDate } from '@/lib/format';
import Avatar from '@/components/ui/Avatar';
import { BuildCard, OwnerCard } from '@/components/ui/Cards';
import { ToggleButton } from '@/components/ui/Toggles';
import ArticleCard from '@/components/articles/ArticleCard';

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ tab?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = getUserProfile(Number((await params).id));
  return p ? { title: `${p.name}'s garage`, description: p.bio || `${p.name}'s 3D builds, real cars and journals.` } : { title: 'User not found' };
}

export default async function UserPage({ params, searchParams }: Props) {
  const [{ id }, { tab }] = await Promise.all([params, searchParams]);
  const viewer = await getCurrentUser();
  const p = getUserProfile(Number(id), viewer?.id);
  if (!p) notFound();
  const builds = listBuilds({ userId: p.id, sort: 'new', limit: 100 });
  const owners = listOwnerBuilds({ userId: p.id, sort: 'new', limit: 100 });
  const articles = listArticles({ userId: p.id });
  const bState = viewerState(viewer?.id, 'build', builds.items.map((b) => b.id));
  const oState = viewerState(viewer?.id, 'owner', owners.items.map((o) => o.id));
  const active = tab === 'cars' ? 'cars' : tab === 'journals' ? 'journals' : '3d';
  const isMe = viewer?.id === p.id;
  return (
    <div className="container page">
      <div className="profile-head">
        <Avatar name={p.name} color={p.color} size={72} round />
        <div style={{ flex: 1, minWidth: 220 }}>
          <h1>{p.name}</h1>
          <p className="muted">
            {p.location && `${p.location} · `}Member since {fmtDate(p.joined, { month: 'short', year: 'numeric' })}
          </p>
          {p.bio && <p style={{ marginTop: 6 }}>{p.bio}</p>}
        </div>
        <div className="stat-row">
          <div className="stat">
            <strong>{builds.total + owners.total}</strong>
            <span>builds</span>
          </div>
          <div className="stat">
            <strong>{p.likesReceived}</strong>
            <span>likes</span>
          </div>
          <div className="stat">
            <strong>{p.followers}</strong>
            <span>followers</span>
          </div>
        </div>
        {isMe ? (
          <Link className="btn btn-outline" href="/settings">
            Edit profile
          </Link>
        ) : viewer ? (
          <ToggleButton url="/api/follow" payload={{ userId: p.id }} active={p.viewerFollows} on="Following" off="Follow" className="btn btn-primary" />
        ) : null}
      </div>
      <div className="tabs" style={{ margin: '24px 0 16px' }}>
        <Link href={`/users/${p.id}`} className={`tab${active === '3d' ? ' active' : ''}`}>
          3D builds ({builds.total})
        </Link>
        <Link href={`/users/${p.id}?tab=cars`} className={`tab${active === 'cars' ? ' active' : ''}`}>
          Real cars ({owners.total})
        </Link>
        <Link href={`/users/${p.id}?tab=journals`} className={`tab${active === 'journals' ? ' active' : ''}`}>
          Journals ({articles.length})
        </Link>
      </div>
      {active === '3d' &&
        (builds.items.length ? (
          <div className="grid">
            {builds.items.map((b) => (
              <BuildCard key={b.id} b={b} liked={bState.liked.has(b.id)} />
            ))}
          </div>
        ) : (
          <div className="empty">
            <h3>No 3D builds yet</h3>
            {isMe && (
              <Link className="btn btn-primary" href="/garage">
                + Build in 3D
              </Link>
            )}
          </div>
        ))}
      {active === 'cars' &&
        (owners.items.length ? (
          <div className="grid">
            {owners.items.map((o) => (
              <OwnerCard key={o.id} o={o} liked={oState.liked.has(o.id)} />
            ))}
          </div>
        ) : (
          <div className="empty">
            <h3>No real cars posted yet</h3>
            {isMe && (
              <Link className="btn btn-primary" href="/owners-builds/new">
                + Add your ride
              </Link>
            )}
          </div>
        ))}
      {active === 'journals' &&
        (articles.length ? (
          <div className="grid">
            {articles.map((a) => (
              <ArticleCard key={a.id} a={a} />
            ))}
          </div>
        ) : (
          <div className="empty">
            <h3>No journals yet</h3>
            {isMe && (
              <Link className="btn btn-primary" href="/articles/new">
                Start a build journal
              </Link>
            )}
          </div>
        ))}
    </div>
  );
}
