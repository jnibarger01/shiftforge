import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { buildHref, bumpViews, getBuild, listBuilds } from '@/lib/builds';
import { fitmentLabel } from '@/lib/build-config';
import { getModel, modelLabel, modelYears, partHref, partsByIds, type Part } from '@/lib/catalog';
import { listComments, viewerState } from '@/lib/community';
import { getDb } from '@/lib/db';
import { analyzeFitment } from '@/lib/fitment';
import { compact, money, timeAgo } from '@/lib/format';
import { weekKey } from '@/lib/week';
import Avatar from '@/components/ui/Avatar';
import { BuildCard } from '@/components/ui/Cards';
import Comments from '@/components/ui/Comments';
import { LikeButton, VoteButton } from '@/components/ui/Toggles';
import BuildStage from '@/components/build/BuildStage';

type Props = { params: Promise<{ id: string }> };

async function load(params: Props['params']) {
  const raw = (await params).id;
  const id = Number(raw.split('-')[0]);
  const build = Number.isInteger(id) ? getBuild(id) : null;
  return { raw, build };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { build } = await load(params);
  if (!build) return { title: 'Build not found' };
  const l = fitmentLabel(build.config);
  return {
    title: `${build.title} — ${build.model} on ${l.rim} wheels`,
    description: `${build.model} build by ${build.user.name}: ${l.rim} wheels, ${l.tire} tires${build.brands.length ? `, parts from ${build.brands.slice(0, 4).join(', ')}` : ''}. View it in 3D and remix it.`,
    alternates: { canonical: buildHref(build.id, build.title) },
    openGraph: build.thumb ? { images: [build.thumb] } : undefined,
  };
}

export default async function BuildPage({ params }: Props) {
  const { raw, build } = await load(params);
  if (!build) notFound();
  const canonical = buildHref(build.id, build.title);
  if (`/builds/${raw}` !== canonical) permanentRedirect(canonical);
  bumpViews('builds', build.id);
  const user = await getCurrentUser();
  const c = build.config;
  const model = getModel(build.modelId)!;
  const report = analyzeFitment(c, model);
  const l = fitmentLabel(c);
  const aeroSlugs = Object.values(c.aero).filter(Boolean) as string[];
  const aeroIds = aeroSlugs.length ? (getDb().prepare(`SELECT id FROM parts WHERE slug IN (${aeroSlugs.map(() => '?').join(',')})`).all(...aeroSlugs) as { id: number }[]).map((r) => r.id) : [];
  const parts = partsByIds([c.wheelPartId, c.tirePartId, c.suspensionPartId, ...aeroIds]);
  const rows: { kind: string; part: Part | undefined; qty: number; detail: string }[] = [
    { kind: 'Wheels', part: c.wheelPartId ? parts.get(c.wheelPartId) : undefined, qty: 4, detail: `${l.rim}${c.spacer ? ` · ${c.spacer}mm spacers` : ''}` },
    { kind: 'Tires', part: c.tirePartId ? parts.get(c.tirePartId) : undefined, qty: 4, detail: l.tire },
    { kind: 'Suspension', part: c.suspensionPartId ? parts.get(c.suspensionPartId) : undefined, qty: 1, detail: c.drop ? `${c.drop > 0 ? '−' : '+'}${Math.abs(c.drop)}mm · ${c.camber}° camber` : 'Stock height' },
    ...aeroIds.map((id) => ({ kind: 'Aero', part: parts.get(id), qty: 1, detail: '' })),
  ];
  const total = rows.reduce((s, r) => s + (r.part?.priceCents ?? 0) * r.qty, 0);
  const state = viewerState(user?.id, 'build', [build.id]);
  const renders = getDb().prepare('SELECT id, path, created_at FROM renders WHERE build_id = ? ORDER BY created_at DESC').all(build.id) as { id: number; path: string; created_at: string }[];
  const renderState = viewerState(user?.id, 'render', renders.map((r) => r.id));
  const renderVotes = new Map(
    renders.map((r) => [r.id, (getDb().prepare("SELECT COUNT(*) AS n FROM votes WHERE target_type = 'render' AND target_id = ? AND week = ?").get(r.id, weekKey()) as { n: number }).n]),
  );
  const related = listBuilds({ modelId: build.modelId, limit: 5 }).items.filter((b) => b.id !== build.id).slice(0, 4);
  const aeroShapes = Object.fromEntries(Object.entries(c.aero).map(([slot, slug]) => [slot, slug ? ((rows.find((r) => r.part?.slug === slug)?.part?.specs.shape as string) ?? null) : null]));
  const wheelStyle = (c.wheelPartId && parts.get(c.wheelPartId)?.style) || 'five-spoke';
  const isOwner = user?.id === build.user.id;

  return (
    <div className="container page">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href="/builds">3D Mods Lab</Link> <span>·</span>
        <Link href={`/builds?modelIds=${build.modelId}`}>{build.model}</Link>
      </nav>
      <div className="section-head" style={{ alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">{build.title}</h1>
          <div className="stat-row" style={{ marginTop: 8, alignItems: 'center' }}>
            <Link href={`/users/${build.user.id}`} style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
              <Avatar name={build.user.name} color={build.user.color} size={26} round /> <b>{build.user.name}</b>
            </Link>
            <span className="muted">
              {build.model} · {modelYears(model)} · {compact(build.views + 1)} views · {timeAgo(build.createdAt)}
            </span>
          </div>
        </div>
        <span className="spacer" />
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <LikeButton target={{ type: 'build', id: build.id }} liked={state.liked.has(build.id)} count={build.likes} variant="button" />
          <VoteButton target={{ type: 'build', id: build.id }} voted={state.voted.has(build.id)} count={build.votes} />
          {isOwner ? (
            <Link className="btn btn-primary" href={`/garage/${model.slug}?build=${build.id}`}>
              Edit in 3D
            </Link>
          ) : (
            <Link className="btn btn-primary" href={`/garage/${model.slug}?from=${build.id}`}>
              Build this in 3D
            </Link>
          )}
        </div>
      </div>

      <div className="detail">
        <div>
          <BuildStage
            buildId={build.id}
            title={build.title}
            modelName={modelLabel(model)}
            model={model}
            config={c}
            wheelStyle={wheelStyle}
            aero={aeroShapes}
            isOwner={isOwner}
            modelSlug={model.slug}
          />
          {build.description && (
            <section className="section">
              <h2 style={{ fontSize: 17, marginBottom: 8 }}>The build</h2>
              <p className="prose" style={{ fontSize: 15 }}>{build.description}</p>
            </section>
          )}
          {renders.length > 0 && (
            <section className="section">
              <div className="section-head">
                <h2>AI renders</h2>
              </div>
              <div className="grid">
                {renders.map((r) => (
                  <div key={r.id} className="uc">
                    <div className="uc-media">
                      <img src={r.path} alt={`AI render of ${build.title}`} loading="lazy" />
                      <div className="uc-top">
                        <span className="badge badge-ai">AI render</span>
                      </div>
                    </div>
                    <div className="uc-body">
                      <div className="uc-metrics">
                        <span>{timeAgo(r.created_at)}</span>
                        <span style={{ marginLeft: 'auto' }}>
                          <VoteButton target={{ type: 'render', id: r.id }} voted={renderState.voted.has(r.id)} count={renderVotes.get(r.id) ?? 0} />
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
          <Comments target={{ type: 'build', id: build.id }} initial={listComments('build', build.id)} viewerId={user?.id ?? null} />
        </div>

        <aside style={{ display: 'grid', gap: 14 }}>
          <div className="panel">
            <h2>Fitment</h2>
            <div className={`verdict ${report.verdict}`} style={{ marginBottom: 10 }}>
              {report.verdictLabel}
            </div>
            <table className="spec-table">
              <tbody>
                <tr><th>Rims</th><td>{l.rim}</td></tr>
                <tr><th>Tires</th><td>{l.tire}</td></tr>
                <tr><th>Bolt pattern</th><td>{model.boltPattern}</td></tr>
                <tr><th>Poke vs stock</th><td>{report.pokeMm > 0 ? '+' : ''}{report.pokeMm} mm</td></tr>
                <tr><th>Ride height</th><td>{c.drop ? `${c.drop > 0 ? '−' : '+'}${Math.abs(c.drop)} mm` : 'Stock'}</td></tr>
                <tr><th>Diameter</th><td>{report.diameterChangePct > 0 ? '+' : ''}{report.diameterChangePct}%</td></tr>
                <tr><th>Paint</th><td>{c.paintName} · {c.finish}</td></tr>
              </tbody>
            </table>
            <Link className="accent" style={{ fontSize: 13, display: 'inline-block', marginTop: 10 }} href={`/fitment?diameter=${c.diameter}&width=${c.width}&etMin=${c.offset}&etMax=${c.offset}`}>
              ⌕ Find other builds with this fitment
            </Link>
          </div>
          <div className="panel">
            <h2>Parts list</h2>
            {rows.map((r, i) => (
              <div className="part-row" key={i}>
                <span className="part-kind">{r.kind}</span>
                <span className="part-name">
                  {r.part ? (
                    <Link href={partHref(r.part)}>
                      {r.part.brand} {r.part.name}
                    </Link>
                  ) : (
                    <span className="muted">Factory</span>
                  )}
                  {r.detail && <small className="muted mono" style={{ display: 'block', fontWeight: 400 }}>{r.detail}</small>}
                </span>
                <span className="part-price">{r.part ? (r.part.priceCents === null ? 'Quote' : money(r.part.priceCents * r.qty)) : '—'}</span>
              </div>
            ))}
            <div className="total-row">
              <span className="muted">Estimated total</span>
              <b className="mono">{money(total)}</b>
            </div>
          </div>
          {related.length > 0 && (
            <div className="panel">
              <h2>More {model.model} {model.generation} builds</h2>
              <div style={{ display: 'grid', gap: 10 }}>
                {related.map((b) => (
                  <BuildCard key={b.id} b={b} />
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
