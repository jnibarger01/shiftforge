import Link from 'next/link';
import { Eye, MessageCircle } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import type { ArticleCard as A } from '@/lib/content';
import { compact } from '@/lib/format';

export default function ArticleCard({ a }: { a: A }) {
  return (
    <article className="article-card">
      <div className="article-cover" style={{ background: `linear-gradient(145deg, ${a.cover}, #101014)` }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 12 }}>
          <Avatar name={a.user.name} color={a.user.color} size={22} round /> <b>{a.user.name}</b>
        </div>
        <h3>
          <Link href={a.href} className="uc-link">
            {a.title}
          </Link>
        </h3>
      </div>
      <div className="article-body">
        <p>{a.excerpt}</p>
        <div className="article-meta">
          {a.series && (
            <span className="badge" style={{ background: 'var(--card-2)', color: 'var(--text-strong)' }}>
              {a.series} · Ep. {a.episode}
            </span>
          )}
          <span>{a.readMin} min read</span>
          <span style={{ display: 'inline-flex', gap: 3, alignItems: 'center' }}>
            <Eye size={12} aria-hidden /> {compact(a.views)}
          </span>
          <span style={{ display: 'inline-flex', gap: 3, alignItems: 'center' }}>
            <MessageCircle size={12} aria-hidden /> {a.comments}
          </span>
        </div>
      </div>
    </article>
  );
}
