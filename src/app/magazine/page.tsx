import type { Metadata } from 'next';
import Link from 'next/link';
import { listArticles } from '@/lib/content';
import ArticleCard from '@/components/articles/ArticleCard';

export const metadata: Metadata = { title: 'ShiftForge Magazine', description: 'How-tos, fitment explainers and opinion pieces for car modifiers.', alternates: { canonical: '/magazine' } };

export default async function Page({ searchParams }: { searchParams: Promise<{ sort?: string }> }) {
  const { sort } = await searchParams;
  const items = listArticles({ kind: 'magazine', sort: sort === 'popular' ? 'popular' : 'new' });
  return (
    <div className="container page">
      <div className="section-head">
        <div>
          <h1 className="page-title">
            ShiftForge Magazine<span className="accent">.</span>
          </h1>
          <p className="section-sub">Guides, explainers and opinion from the community.</p>
        </div>
        <span className="spacer" />
        <div className="seg">
          <Link href="/magazine" aria-current={sort !== 'popular'}>
            New
          </Link>
          <Link href="/magazine?sort=popular" aria-current={sort === 'popular'}>
            Popular
          </Link>
        </div>
        <Link className="btn btn-primary" href="/articles/new?kind=magazine">
          + Write
        </Link>
      </div>
      {items.length ? (
        <div className="grid">
          {items.map((a) => (
            <ArticleCard key={a.id} a={a} />
          ))}
        </div>
      ) : (
        <div className="empty">
          <h3>Nothing published yet</h3>
          <Link className="btn btn-primary" href="/articles/new?kind=magazine">
            Write the first one
          </Link>
        </div>
      )}
    </div>
  );
}
