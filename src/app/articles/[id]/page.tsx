import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { bumpViews } from '@/lib/builds';
import { listComments, viewerState } from '@/lib/community';
import { articleHref, getArticle, listArticles } from '@/lib/content';
import { compact, fmtDate } from '@/lib/format';
import Avatar from '@/components/ui/Avatar';
import Comments from '@/components/ui/Comments';
import { LikeButton } from '@/components/ui/Toggles';
import ArticleCard from '@/components/articles/ArticleCard';

type Props = { params: Promise<{ id: string }> };

async function load(params: Props['params']) {
  const raw = (await params).id;
  const id = Number(raw.split('-')[0]);
  return { raw, a: Number.isInteger(id) ? getArticle(id) : null };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { a } = await load(params);
  if (!a) return { title: 'Article not found' };
  return { title: `${a.title} by ${a.user.name}`, description: a.excerpt, alternates: { canonical: a.href }, openGraph: { type: 'article' } };
}

export default async function ArticlePage({ params }: Props) {
  const { raw, a } = await load(params);
  if (!a) notFound();
  if (`/articles/${raw}` !== a.href) permanentRedirect(a.href);
  bumpViews('articles', a.id);
  const user = await getCurrentUser();
  const state = viewerState(user?.id, 'article', [a.id]);
  const series = a.series ? listArticles({ series: a.series, sort: 'new' }).filter((x) => x.user.id === a.user.id).sort((x, y) => (x.episode ?? 0) - (y.episode ?? 0)) : [];
  const more = listArticles({ kind: a.kind, limit: 4 }).filter((x) => x.id !== a.id).slice(0, 3);
  return (
    <div className="container page">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href={a.kind === 'journal' ? '/journal' : '/magazine'}>{a.kind === 'journal' ? 'Journals' : 'Magazine'}</Link>
        {a.series && (
          <>
            <span>·</span> <span>{a.series}</span>
          </>
        )}
      </nav>
      <header className="article-hero" style={{ background: `linear-gradient(145deg, ${a.cover}, #101014)` }}>
        {a.series && <span className="badge">{a.series} · Episode {a.episode}</span>}
        <h1>{a.title}</h1>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 14, flexWrap: 'wrap' }}>
          <Link href={`/users/${a.user.id}`} style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
            <Avatar name={a.user.name} color={a.user.color} size={28} round /> <b>{a.user.name}</b>
          </Link>
          <span style={{ opacity: 0.7 }}>
            {fmtDate(a.createdAt, { month: 'long', day: 'numeric', year: 'numeric' })} · {a.readMin} min read · {compact(a.views + 1)} views
          </span>
        </div>
      </header>
      <div className="detail">
        <article>
          <p className="prose" style={{ fontSize: 19, color: 'var(--text)', marginBottom: 20 }}>{a.excerpt}</p>
          <div className="prose">
            {a.body.split(/\n{2,}/).map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
          <div style={{ marginTop: 24 }}>
            <LikeButton target={{ type: 'article', id: a.id }} liked={state.liked.has(a.id)} count={a.likes} variant="button" />
          </div>
          <Comments target={{ type: 'article', id: a.id }} initial={listComments('article', a.id)} viewerId={user?.id ?? null} />
        </article>
        <aside style={{ display: 'grid', gap: 14 }}>
          {series.length > 1 && (
            <div className="panel">
              <h2>{a.series}</h2>
              <ol style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 8 }}>
                {series.map((s) => (
                  <li key={s.id}>
                    {s.id === a.id ? <b>{s.title}</b> : <Link href={articleHref(s.id, s.title)}>{s.title}</Link>}
                  </li>
                ))}
              </ol>
            </div>
          )}
          {more.map((m) => (
            <ArticleCard key={m.id} a={m} />
          ))}
        </aside>
      </div>
    </div>
  );
}
