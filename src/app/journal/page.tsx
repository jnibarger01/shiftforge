import type { Metadata } from 'next';
import Link from 'next/link';
import { listArticles } from '@/lib/content';
import ArticleCard from '@/components/articles/ArticleCard';

export const metadata: Metadata = { title: 'Journals', description: 'Build journals from the community: episode-by-episode stories of real projects.', alternates: { canonical: '/journal' } };

export default async function Page({ searchParams }: { searchParams: Promise<{ sort?: string }> }) {
  const { sort } = await searchParams;
  const items = listArticles({ kind: 'journal', sort: sort === 'popular' ? 'popular' : 'new' });
  return (
    <div className="container page">
      <div className="section-head">
        <div>
          <h1 className="page-title">
            Journals<span className="accent">.</span>
          </h1>
          <p className="section-sub">Fresh chapters from builds in progress. Follow a project from purchase to first drive.</p>
        </div>
        <span className="spacer" />
        <div className="seg">
          <Link href="/journal" aria-current={sort !== 'popular'}>
            New
          </Link>
          <Link href="/journal?sort=popular" aria-current={sort === 'popular'}>
            Popular
          </Link>
        </div>
        <Link className="btn btn-primary" href="/articles/new?kind=journal">
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
          <Link className="btn btn-primary" href="/articles/new?kind=journal">
            Write the first one
          </Link>
        </div>
      )}
    </div>
  );
}
