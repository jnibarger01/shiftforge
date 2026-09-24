import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { userSeries } from '@/lib/content';
import ArticleForm from '@/components/articles/ArticleForm';

export const metadata: Metadata = { title: 'Write', robots: { index: false } };

export default async function NewArticlePage({ searchParams }: { searchParams: Promise<{ kind?: string }> }) {
  const { kind } = await searchParams;
  const user = await getCurrentUser();
  if (!user) redirect(`/signin?next=${encodeURIComponent(`/articles/new?kind=${kind ?? 'journal'}`)}`);
  return (
    <div className="container page" style={{ maxWidth: 820 }}>
      <h1 className="page-title" style={{ marginBottom: 16 }}>
        Write<span className="accent">.</span>
      </h1>
      <ArticleForm initialKind={kind === 'magazine' ? 'magazine' : 'journal'} series={userSeries(user.id)} />
    </div>
  );
}
