import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { bumpViews, listBuilds, type BuildCard as BuildCardT } from '@/lib/builds';
import { getPart, listModels, listParts, modelLabel, partHref, PART_CATEGORIES } from '@/lib/catalog';
import { getDb } from '@/lib/db';
import { money } from '@/lib/format';
import { BuildCard } from '@/components/ui/Cards';
import PartsGrid from '@/components/market/PartsGrid';
import PartBuyBox from '@/components/market/PartBuyBox';

type Props = { params: Promise<{ id: string }> };

async function load(params: Props['params']) {
  const raw = (await params).id;
  const id = Number(raw.split('-')[0]);
  return { raw, part: Number.isInteger(id) ? getPart(id) : null };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { part } = await load(params);
  if (!part) return { title: 'Part not found' };
  return {
    title: `${part.brand} ${part.name} | ${PART_CATEGORIES.find((c) => c.key === part.category)?.short}`,
    description: `${part.brand} ${part.name} — ${part.description} Price: ${money(part.priceCents)}. Visualize it in 3D, check fitment and shop with confidence.`,
    alternates: { canonical: partHref(part) },
  };
}

export default async function PartPage({ params }: Props) {
  const { raw, part } = await load(params);
  if (!part) notFound();
  if (`/parts/${raw}` !== partHref(part)) permanentRedirect(partHref(part));
  bumpViews('parts', part.id);
  const user = await getCurrentUser();
  const favorite = user ? !!getDb().prepare('SELECT 1 FROM favorites WHERE user_id = ? AND part_id = ?').get(user.id, part.id) : false;
  const field = part.category === 'wheels' ? 'wheelPartId' : part.category === 'tires' ? 'tirePartId' : part.category === 'suspension' ? 'suspensionPartId' : null;
  const exampleIds = field
    ? (getDb().prepare(`SELECT id FROM builds WHERE json_extract(config, '$.${field}') = ? ORDER BY views DESC LIMIT 8`).all(part.id) as { id: number }[]).map((r) => r.id)
    : (getDb().prepare("SELECT id FROM builds WHERE json_extract(config, '$.aero.front') = ?1 OR json_extract(config, '$.aero.side') = ?1 OR json_extract(config, '$.aero.rear') = ?1 OR json_extract(config, '$.aero.wing') = ?1 ORDER BY views DESC LIMIT 8").all(part.slug) as { id: number }[]).map((r) => r.id);
  const all = listBuilds({ limit: 100 }).items;
  const examples = exampleIds.map((id) => all.find((b) => b.id === id)).filter((b): b is BuildCardT => !!b);
  const related = listParts({ category: part.category }).filter((p) => p.id !== part.id).slice(0, 5);
  const cat = PART_CATEGORIES.find((c) => c.key === part.category)!;
  return (
    <div className="container page">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href="/marketplace">Marketplace</Link> <span>·</span> <Link href={`/marketplace/${cat.key}`}>{cat.label}</Link>
      </nav>
      <PartBuyBox
        part={part}
        favorite={favorite}
        signedIn={!!user}
        models={listModels().map((m) => ({ ...m, label: modelLabel(m) }))}
      />
      <section className="section">
        <div className="section-head">
          <h2>Fitment examples</h2>
          <span className="muted">{examples.length} community build{examples.length === 1 ? '' : 's'} run this part</span>
        </div>
        {examples.length ? (
          <div className="grid">
            {examples.map((b) => (
              <BuildCard key={b.id} b={b} />
            ))}
          </div>
        ) : (
          <div className="empty">
            <h3>No builds use this yet</h3>
            <p>Try it in the 3D Mods Lab and be the first.</p>
            <Link className="btn btn-primary" href="/garage">
              Open the Lab
            </Link>
          </div>
        )}
      </section>
      <section className="section">
        <div className="section-head">
          <h2>More {cat.label.toLowerCase()}</h2>
        </div>
        <PartsGrid parts={related} />
      </section>
    </div>
  );
}
