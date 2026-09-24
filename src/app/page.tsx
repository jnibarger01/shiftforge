import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import { buildStandings, listOwnerBuilds, recentActivity, viewerState } from '@/lib/community';
import { getBuild, listBuilds } from '@/lib/builds';
import { getModel, listParts, partsByIds } from '@/lib/catalog';
import { listArticles, listAuctions, listEvents } from '@/lib/content';
import { getDb } from '@/lib/db';
import { fmtDate, money, timeAgo } from '@/lib/format';
import Avatar from '@/components/ui/Avatar';
import { BuildCard, OwnerCard } from '@/components/ui/Cards';
import { VoteButton } from '@/components/ui/Toggles';
import ArticleCard from '@/components/articles/ArticleCard';
import PartsGrid from '@/components/market/PartsGrid';
import HeroViewer from '@/components/home/HeroViewer';

export default async function Home({ searchParams }: { searchParams: Promise<{ club?: string }> }) {
  const { club } = await searchParams;
  const women = club === 'women';
  const user = await getCurrentUser();
  const spotlight = listOwnerBuilds({ sort: 'trending', women, limit: 2 }).items;
  const justAdded = listOwnerBuilds({ sort: 'new', women, limit: 8 }).items;
  const board = buildStandings(6);
  const heroBuild = board[0] ? getBuild(board[0].id) : null;
  const heroParts = heroBuild ? partsByIds([heroBuild.config.wheelPartId]) : new Map();
  const aeroSlugs = heroBuild ? (Object.values(heroBuild.config.aero).filter(Boolean) as string[]) : [];
  const aeroRows = aeroSlugs.length ? (getDb().prepare(`SELECT slug, specs FROM parts WHERE slug IN (${aeroSlugs.map(() => '?').join(',')})`).all(...aeroSlugs) as { slug: string; specs: string }[]) : [];
  const heroAero = heroBuild ? Object.fromEntries(Object.entries(heroBuild.config.aero).map(([k, v]) => [k, v ? (JSON.parse(aeroRows.find((r) => r.slug === v)?.specs ?? '{}').shape ?? null) : null])) : {};
  const journals = listArticles({ kind: 'journal', limit: 2 });
  const magazine = listArticles({ kind: 'magazine', sort: 'popular', limit: 3 });
  const activity = recentActivity(8);
  const events = listEvents().slice(0, 4);
  const auctions = listAuctions().slice(0, 4);
  const wheels = listParts({ category: 'wheels' }).slice(0, 4);
  const ownerState = viewerState(user?.id, 'owner', [...spotlight, ...justAdded].map((o) => o.id));
  const buildState = viewerState(user?.id, 'build', board.map((b) => b.id));
  const takeModel = spotlight[0]?.modelId ? getModel(spotlight[0].modelId) : null;
  const newest = listBuilds({ sort: 'new', limit: 4 }).items;

  const clubHead = (title: string) => (
    <div className="section-head">
      <h2 style={{ fontSize: 17 }}>{title}</h2>
      <div className="tabs" role="tablist">
        <Link href="/" className={`tab${!women ? ' active' : ''}`} role="tab" aria-selected={!women} scroll={false}>
          Spotlight
        </Link>
        <Link href="/?club=women" className={`tab${women ? ' active' : ''}`} role="tab" aria-selected={women} scroll={false}>
          What Women Builders Drive
        </Link>
      </div>
      <span className="spacer" />
      <Link href="/owners-builds/new" className="btn btn-primary">
        + Add your ride
      </Link>
      <Link href={`/community-builds${women ? '?women=1' : ''}`} className="link-accent">
        Explore All
      </Link>
    </div>
  );

  return (
    <div className="container page">
      <h1 className="sr-only">ShiftForge — 3D car configurator, wheel fitment and tuning community</h1>
      <section className="section">
        {clubHead("Owner's Club")}
        <div className="home-hero-row">
          {spotlight.map((o) => (
            <OwnerCard key={o.id} o={o} liked={ownerState.liked.has(o.id)} tall />
          ))}
        </div>
        {takeModel && (
          <Link href={`/garage/${takeModel.slug}`} className="take-card" style={{ marginTop: 14 }}>
            <span>Your take on it</span>
            <strong>
              Build this {takeModel.model} {takeModel.generation} in 3D
            </strong>
            <span>Model is ready in the configurator</span>
          </Link>
        )}
      </section>

      {heroBuild && (
        <section className="section lab-cta" aria-label="3D Mods Lab">
          <div className="lab-cta-copy">
            <span className="kicker">3D Mods Lab</span>
            <h1 style={{ fontSize: 'clamp(28px, 3.4vw, 46px)' }}>Try the wheels before you buy them.</h1>
            <p>
              Pick your car, drop in real wheel sizes and offsets, set the stance, and see the fitment verdict before a single part ships. Then publish it and let the
              community vote.
            </p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Link className="btn btn-primary btn-lg" href="/garage">
                + Build in 3D
              </Link>
              <Link className="btn btn-outline btn-lg" href={heroBuild.href}>
                #1 this week: {heroBuild.title}
              </Link>
            </div>
          </div>
          <HeroViewer model={heroBuild.carModel} config={heroBuild.config} wheelStyle={(heroBuild.config.wheelPartId && heroParts.get(heroBuild.config.wheelPartId)?.style) || 'five-spoke'} aero={heroAero} title={heroBuild.title} />
        </section>
      )}

      <section className="section">
        <div className="section-head">
          <h2>3D Builds: this week&apos;s board</h2>
          <span className="spacer" />
          <Link href="/ratings" className="link-accent">
            Full board →
          </Link>
        </div>
        <div className="grid">
          {board.slice(0, 4).map((b, i) => (
            <BuildCard key={b.id} b={b} rank={i + 1} liked={buildState.liked.has(b.id)} voted={buildState.voted.has(b.id)} showVote />
          ))}
        </div>
      </section>

      <section className="section">
        {clubHead('Just added')}
        <div className="row-scroll">
          {justAdded.map((o) => (
            <OwnerCard key={o.id} o={o} liked={ownerState.liked.has(o.id)} />
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <div>
            <h2>New episodes</h2>
            <p className="section-sub">Fresh chapters from builds in progress</p>
          </div>
          <span className="spacer" />
          <Link href="/journal" className="link-accent">
            All journals →
          </Link>
        </div>
        <div className="grid-2">
          {journals.map((a) => (
            <ArticleCard key={a.id} a={a} />
          ))}
        </div>
      </section>

      <section className="section" aria-label="Happening now">
        <div className="section-head">
          <span className="kicker">
            Happening now <span className="live-dot" aria-hidden /> live
          </span>
        </div>
        <div className="live-strip">
          {activity.map((a, i) => (
            <Link key={i} href={a.href} className="live-item">
              <Avatar name={a.who.name} color={a.who.color} size={36} />
              <div style={{ minWidth: 0, flex: 1 }}>
                <b>
                  {a.who.name} {a.text}
                </b>
                <small>
                  {a.title} · {timeAgo(a.at)}
                </small>
              </div>
              <span className={`badge ${a.kind === 'AI' ? 'badge-ai' : a.kind === '3D' ? 'badge-3d' : ''}`}>{a.kind}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <h2>Local Events and People Near You</h2>
          <span className="spacer" />
          <Link href="/map" className="link-accent">
            Explore All
          </Link>
        </div>
        <div className="grid">
          {events.map((e) => (
            <Link key={e.id} href={`/events/${e.id}`} className="panel" style={{ display: 'flex', gap: 12 }}>
              <span className="date-badge">
                <b>{fmtDate(e.startsAt, { day: 'numeric' })}</b>
                <small>{fmtDate(e.startsAt, { month: 'short' })}</small>
              </span>
              <span style={{ display: 'grid', gap: 3 }}>
                <b>{e.title}</b>
                <small className="muted">
                  {e.city}, {e.state} · {e.category}
                </small>
                <small className="muted">📍 {e.venue}</small>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <h2>Magazine: Popular Today</h2>
          <span className="spacer" />
          <Link href="/magazine" className="link-accent">
            Explore All
          </Link>
        </div>
        <div className="grid">
          {magazine.map((a) => (
            <ArticleCard key={a.id} a={a} />
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <h2>Fresh from the Lab</h2>
          <span className="spacer" />
          <Link href="/builds?sort=new" className="link-accent">
            Explore All
          </Link>
        </div>
        <div className="grid">
          {newest.map((b) => (
            <BuildCard key={b.id} b={b} />
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <h2>Project Cars: Auctions</h2>
          <span className="spacer" />
          <Link href="/auctions" className="link-accent">
            Explore All
          </Link>
        </div>
        <div className="grid">
          {auctions.map((a) => (
            <Link key={a.id} href="/auctions" className="panel" style={{ display: 'grid', gap: 4, background: `linear-gradient(160deg, ${a.paint}33, var(--card) 60%)` }}>
              <span className="badge badge-green" style={{ width: 'fit-content' }}>
                {a.verdict}
              </span>
              <b className="mono" style={{ fontSize: 19 }}>~{money(a.estimateCents)} to win</b>
              <b>
                {a.year} {a.make} {a.model}
              </b>
              <small className="muted">
                {a.damage} · {Math.round(a.miles / 1000)}K mi · {a.state}
              </small>
            </Link>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <h2>Aftermarket Wheels</h2>
          <span className="spacer" />
          <Link href="/marketplace/wheels" className="link-accent">
            Explore All
          </Link>
        </div>
        <PartsGrid parts={wheels} />
      </section>
      {board[0] && (
        <div className="notice" style={{ marginTop: 28, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          Weekly ratings are live — <b style={{ color: 'var(--text)' }}>{board[0].title}</b> leads 3D Builds.
          <VoteButton target={{ type: 'build', id: board[0].id }} voted={buildState.voted.has(board[0].id)} count={board[0].votes} />
        </div>
      )}
    </div>
  );
}
