import type { Metadata } from 'next';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import type { BuildCard as BuildCardT } from '@/lib/builds';
import { buildStandings, listRenders, ownerStandings, pastChampions, viewerState, type OwnerCard as OwnerCardT, type RenderCard } from '@/lib/community';
import { msUntilWeekEnds, weekKey } from '@/lib/week';
import Avatar from '@/components/ui/Avatar';
import { VoteButton } from '@/components/ui/Toggles';

export const metadata: Metadata = {
  title: 'Ratings — Weekly Car Build Championship',
  description: 'One championship, three divisions: 3D builds, real cars and AI renders. Vote every week, watch the standings move, and see who takes the division titles.',
  alternates: { canonical: '/ratings' },
};

type Entry = { key: string; id: number; type: 'build' | 'owner' | 'render'; href: string; img: string | null; title: string; sub: string; spec?: string; user: { id: number; name: string; color: string }; votes: number; isNew?: boolean };

const fromBuild = (b: BuildCardT): Entry => ({ key: `b${b.id}`, id: b.id, type: 'build', href: b.href, img: b.thumb, title: b.title, sub: b.model, spec: `${b.rim} · ${b.tire}${b.brands.length ? ` · ${b.brands.slice(0, 2).join(' ')}` : ''}`, user: b.user, votes: b.votes, isNew: b.isNew });
const fromOwner = (o: OwnerCardT): Entry => ({ key: `o${o.id}`, id: o.id, type: 'owner', href: o.href, img: o.photo, title: o.title, sub: [o.year, o.model].filter(Boolean).join(' ') || o.usage, user: o.user, votes: o.votes, isNew: o.isNew });
const fromRender = (r: RenderCard): Entry => ({ key: `r${r.id}`, id: r.id, type: 'render', href: r.buildHref, img: r.path, title: r.model, sub: r.title, spec: `${r.rim} · ${r.tire}`, user: r.user, votes: r.votes });

const DIVISIONS = [
  { key: '3d', label: '3D Builds', type: 'build' as const },
  { key: 'real', label: 'Real Cars', type: 'owner' as const },
  { key: 'ai', label: 'AI Renders', type: 'render' as const },
];

function Board({ entries, voted, title, more, cta }: { entries: Entry[]; voted: Set<string>; title: string; more?: string; cta: React.ReactNode }) {
  if (!entries.length)
    return (
      <div className="empty">
        <h3>No {title.toLowerCase()} this week yet</h3>
        {cta}
      </div>
    );
  const [first, ...rest] = entries;
  return (
    <div className="board">
      <article className="board-feature">
        {first.img && <img src={first.img} alt={first.title} />}
        <div className="uc-top">
          <span className="uc-rank gold" style={{ position: 'static' }}>1</span>
          {first.isNew && <span className="badge badge-new">New</span>}
          {first.type === 'render' && <span className="badge badge-ai">AI render</span>}
        </div>
        <div className="board-feature-info">
          <h3>
            <Link href={first.href}>{first.title}</Link>
          </h3>
          <div className="uc-sub">{first.sub}</div>
          {first.spec && <div className="uc-spec" style={{ color: 'rgba(255,255,255,.7)' }}>{first.spec}</div>}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
            <Link href={`/users/${first.user.id}`} style={{ display: 'inline-flex', gap: 6, alignItems: 'center', fontSize: 13 }}>
              <Avatar name={first.user.name} color={first.user.color} size={20} /> {first.user.name}
            </Link>
            <span style={{ flex: 1 }} />
            <VoteButton target={{ type: first.type, id: first.id }} voted={voted.has(first.key)} count={first.votes} />
          </div>
        </div>
      </article>
      <div className="board-list">
        {rest.map((e, i) => (
          <div className="board-row" key={e.key}>
            <span className="rank">{i + 2}</span>
            <Link href={e.href} className="thumb">
              {e.img && <img src={e.img} alt="" loading="lazy" />}
            </Link>
            <div className="info">
              <Link href={e.href}>
                <b>{e.title}</b>
              </Link>
              <small>
                {e.user.name} · {e.spec ?? e.sub}
              </small>
            </div>
            <VoteButton target={{ type: e.type, id: e.id }} voted={voted.has(e.key)} count={e.votes} />
          </div>
        ))}
        {more && (
          <Link href={more} className="link-accent" style={{ fontSize: 14, padding: '6px 4px' }}>
            Full leaderboard →
          </Link>
        )}
      </div>
    </div>
  );
}

export default async function RatingsPage({ searchParams }: { searchParams: Promise<{ division?: string }> }) {
  const { division } = await searchParams;
  const user = await getCurrentUser();
  const builds = buildStandings().map(fromBuild);
  const owners = ownerStandings().map(fromOwner);
  const renders = listRenders(100).map(fromRender);
  const all = { build: builds, owner: owners, render: renders };
  const voted = new Set<string>();
  for (const [type, list] of Object.entries(all) as ['build' | 'owner' | 'render', Entry[]][]) {
    const s = viewerState(user?.id, type, list.map((e) => e.id));
    list.forEach((e) => s.voted.has(e.id) && voted.add(e.key));
  }
  const entered = user ? [...builds, ...owners, ...renders].filter((e) => e.user.id === user.id) : [];
  const ms = msUntilWeekEnds();
  const days = Math.floor(ms / 86400000);
  const hours = Math.floor((ms % 86400000) / 3600000);
  const active = DIVISIONS.find((d) => d.key === division);
  const champs = pastChampions(3);
  const duel = (list: Entry[]) => {
    let best: [Entry, Entry] | null = null;
    for (let i = 1; i < Math.min(list.length - 1, 20); i++) {
      const gap = list[i].votes - list[i + 1].votes;
      if (!best || gap < best[0].votes - best[1].votes) best = [list[i], list[i + 1]];
    }
    return best;
  };
  const ctaFor = (type: string) =>
    type === 'build' ? (
      <Link className="btn btn-primary" href="/garage">
        + Build in 3D
      </Link>
    ) : type === 'owner' ? (
      <Link className="btn btn-primary" href="/owners-builds/new">
        + Add your ride
      </Link>
    ) : (
      <p>
        Open one of your published builds and hit <b>AI render</b> to enter this division.
      </p>
    );

  return (
    <div className="container page">
      <div className="section-head">
        <div>
          <h1 className="page-title">
            Championship<span className="accent">.</span>
          </h1>
          <p className="section-sub">
            Week {weekKey().split('-W')[1]} · voting closes in {days}d {hours}h · one vote per entry per week
          </p>
        </div>
        <span className="spacer" />
        <nav className="division-stats" aria-label="Divisions">
          <Link href="/ratings" aria-current={!active}>
            <b>{builds.length + owners.length + renders.length}</b>
            <span>All divisions</span>
          </Link>
          {DIVISIONS.map((d) => (
            <Link key={d.key} href={`/ratings?division=${d.key}`} aria-current={active?.key === d.key}>
              <b>{all[d.type].length}</b>
              <span>{d.label}</span>
            </Link>
          ))}
        </nav>
      </div>

      <div className="notice" style={{ marginBottom: 24, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        {user ? (
          entered.length ? (
            <>
              You have <b style={{ color: 'var(--text)' }}>{entered.length}</b> {entered.length === 1 ? 'entry' : 'entries'} in this week&apos;s race. Best position: #
              {Math.min(...entered.map((e) => all[e.type].findIndex((x) => x.key === e.key) + 1))} in{' '}
              {DIVISIONS.find((d) => d.type === entered[0].type)?.label}.
            </>
          ) : (
            <>
              You are not in this week&apos;s race yet. <b style={{ color: 'var(--text)' }}>Publish a build to enter.</b>
              <Link href="/garage" className="accent">
                Open the Lab →
              </Link>
            </>
          )
        ) : (
          <>
            <Link href="/signin?next=/ratings" className="accent">
              Sign in
            </Link>{' '}
            to vote and enter your builds.
          </>
        )}
      </div>

      {active ? (
        <section className="section">
          <div className="section-head">
            <h2>{active.label} — full leaderboard</h2>
            <span className="spacer" />
            <Link className="link-accent" href="/ratings">
              ← All divisions
            </Link>
          </div>
          <Board entries={all[active.type]} voted={voted} title={active.label} cta={ctaFor(active.type)} />
        </section>
      ) : (
        <>
          {DIVISIONS.map((d) => (
            <section className="section" key={d.key}>
              <div className="section-head">
                <h2>{d.label}</h2>
                <span className="muted">{all[d.type].length} entries</span>
              </div>
              <Board entries={all[d.type].slice(0, 6)} voted={voted} title={d.label} more={all[d.type].length > 6 ? `/ratings?division=${d.key}` : undefined} cta={ctaFor(d.type)} />
            </section>
          ))}
          <section className="section">
            <div className="section-head">
              <div>
                <h2>Photo finish</h2>
                <p className="section-sub">Closest battles on the board. Your vote decides these.</p>
              </div>
            </div>
            <div className="grid-2">
              {DIVISIONS.map((d) => {
                const pair = duel(all[d.type]);
                if (!pair) return null;
                return (
                  <div key={d.key} className="panel">
                    <h3>
                      {d.label} · places {all[d.type].indexOf(pair[0]) + 1}–{all[d.type].indexOf(pair[1]) + 1}
                    </h3>
                    <div className="duel">
                      {pair.map((e) => (
                        <article className="uc" key={e.key}>
                          <div className="uc-media">
                            {e.img && <img src={e.img} alt={e.title} loading="lazy" />}
                            <div className="uc-top">
                              <span className="badge">#{all[d.type].indexOf(e) + 1}</span>
                            </div>
                            <div className="uc-bottom">
                              <div>
                                <div className="uc-title" style={{ fontSize: 14 }}>
                                  <Link href={e.href} className="uc-link">
                                    {e.title}
                                  </Link>
                                </div>
                                {e.spec && <div className="uc-sub">{e.spec}</div>}
                              </div>
                            </div>
                          </div>
                          <div className="uc-body">
                            <VoteButton target={{ type: e.type, id: e.id }} voted={voted.has(e.key)} count={e.votes} />
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
          <section className="section">
            <div className="section-head">
              <div>
                <h2>Past champions</h2>
                <p className="section-sub">Closed weeks, sealed results.</p>
              </div>
            </div>
            {champs.length === 0 ? (
              <div className="empty">
                <h3>No week has closed yet</h3>
                <p>When voting closes, the standings freeze here and the division winners keep their titles for good.</p>
              </div>
            ) : (
              <div className="grid">
                {champs.map((c) => (
                  <div className="panel" key={c.week}>
                    <h3>Week {c.week.split('-W')[1]}</h3>
                    {c.build && (
                      <p style={{ marginBottom: 6 }}>
                        <span className="badge badge-gold">3D</span>{' '}
                        <Link href={c.build.href}>
                          <b>{c.build.title}</b>
                        </Link>{' '}
                        <span className="muted">by {c.build.user.name} · {c.buildVotes} votes</span>
                      </p>
                    )}
                    {c.owner && (
                      <p>
                        <span className="badge badge-gold">Real</span>{' '}
                        <Link href={c.owner.href}>
                          <b>{c.owner.title}</b>
                        </Link>{' '}
                        <span className="muted">by {c.owner.user} · {c.owner.votes} votes</span>
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
