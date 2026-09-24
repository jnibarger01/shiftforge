import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PART_CATEGORIES, listParts } from '@/lib/catalog';
import PartsGrid from '@/components/market/PartsGrid';

type Props = { params: Promise<{ category: string }>; searchParams: Promise<{ brand?: string; sort?: string; style?: string }> };

const ALIASES: Record<string, string> = { rims: 'wheels' };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const key = ALIASES[(await params).category] ?? (await params).category;
  const cat = PART_CATEGORIES.find((c) => c.key === key);
  return cat ? { title: cat.label, alternates: { canonical: `/marketplace/${cat.key}` } } : { title: 'Not found' };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const [{ category }, sp] = await Promise.all([params, searchParams]);
  const key = ALIASES[category] ?? category;
  const cat = PART_CATEGORIES.find((c) => c.key === key);
  if (!cat) notFound();
  const all = listParts({ category: cat.key });
  const brands = [...new Set(all.map((p) => p.brand))].sort();
  const styles = [...new Set(all.map((p) => p.style))].sort();
  let parts = listParts({ category: cat.key, brand: sp.brand, sort: sp.sort });
  if (sp.style) parts = parts.filter((p) => p.style === sp.style);
  return (
    <div className="container page">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href="/marketplace">Marketplace</Link> <span>·</span> <b>{cat.label}</b>
      </nav>
      <div className="section-head">
        <h1 className="page-title">{cat.label}</h1>
        <span className="muted">{parts.length} products</span>
      </div>
      <form className="filter-bar" action={`/marketplace/${cat.key}`}>
        <label className="sr-only" htmlFor="brand">
          Brand
        </label>
        <select id="brand" name="brand" className="select" defaultValue={sp.brand ?? ''}>
          <option value="">All brands</option>
          {brands.map((b) => (
            <option key={b}>{b}</option>
          ))}
        </select>
        <label className="sr-only" htmlFor="style">
          Style
        </label>
        <select id="style" name="style" className="select" defaultValue={sp.style ?? ''}>
          <option value="">All styles</option>
          {styles.map((s) => (
            <option key={s} value={s}>
              {s.replace('-', ' ')}
            </option>
          ))}
        </select>
        <label className="sr-only" htmlFor="sort">
          Sort
        </label>
        <select id="sort" name="sort" className="select" defaultValue={sp.sort ?? ''}>
          <option value="">Most viewed</option>
          <option value="price-asc">Price: low to high</option>
          <option value="price-desc">Price: high to low</option>
          <option value="name">Name</option>
        </select>
        <button className="btn btn-outline">Apply</button>
        {(sp.brand || sp.style || sp.sort) && (
          <Link href={`/marketplace/${cat.key}`} className="accent">
            Clear
          </Link>
        )}
      </form>
      {parts.length ? (
        <PartsGrid parts={parts} />
      ) : (
        <div className="empty">
          <h3>No products match</h3>
          <Link className="btn btn-outline" href={`/marketplace/${cat.key}`}>
            Clear filters
          </Link>
        </div>
      )}
    </div>
  );
}
