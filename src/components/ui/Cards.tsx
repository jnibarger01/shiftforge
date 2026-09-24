import Link from 'next/link';
import { Box, Eye, MessageCircle } from 'lucide-react';
import Avatar from './Avatar';
import { LikeButton, VoteButton } from './Toggles';
import type { BuildCard as BuildCardT } from '@/lib/builds';
import type { OwnerCard as OwnerCardT } from '@/lib/community';
import { compact } from '@/lib/format';

function Placeholder({ paint }: { paint: string }) {
  return (
    <div className="placeholder-art" style={{ background: `radial-gradient(circle at 50% 60%, ${paint}55, #0d0d12 70%)` }}>
      <Box size={40} strokeWidth={1.2} aria-hidden />
    </div>
  );
}

export function BuildCard({ b, rank, liked = false, voted, showVote = false }: { b: BuildCardT; rank?: number; liked?: boolean; voted?: boolean; showVote?: boolean }) {
  return (
    <article className="uc">
      <div className="uc-media">
        {b.thumb ? <img src={b.thumb} alt={`${b.title} — ${b.model}`} loading="lazy" /> : <Placeholder paint={b.paint} />}
        <div className="uc-top">
          <Link href={`/users/${b.user.id}`} className="uc-user stack-over">
            <Avatar name={b.user.name} color={b.user.color} size={20} />
            <span>{b.user.name}</span>
          </Link>
          <span className="spacer" />
          {b.isNew && <span className="badge badge-new">New</span>}
          <span className="badge badge-3d">3D</span>
        </div>
        {rank !== undefined && <span className={`uc-rank${rank === 1 ? ' gold' : ''}`} style={{ top: 38 }}>{rank}</span>}
        <div className="uc-bottom">
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 className="uc-title">
              <Link href={b.href} className="uc-link">
                {b.title}
              </Link>
            </h3>
            <div className="uc-sub">{b.model}</div>
          </div>
          <LikeButton target={{ type: 'build', id: b.id }} liked={liked} count={b.likes} />
        </div>
      </div>
      <div className="uc-body">
        <div className="uc-spec">
          Rims: {b.rim} · Tires: {b.tire}
        </div>
        <div className="uc-brands">{b.brands.join(', ') || 'OEM'}</div>
        <div className="uc-metrics">
          <span>
            <Eye size={13} aria-hidden /> {compact(b.views)}
          </span>
          <span>
            <MessageCircle size={13} aria-hidden /> {b.comments}
          </span>
          {showVote && (
            <span style={{ marginLeft: 'auto' }}>
              <VoteButton target={{ type: 'build', id: b.id }} voted={!!voted} count={b.votes} />
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

export function OwnerCard({ o, liked = false, rank, tall = false }: { o: OwnerCardT; liked?: boolean; rank?: number; tall?: boolean }) {
  return (
    <article className="uc">
      <div className={`uc-media${tall ? ' tall' : ''}`}>
        {o.photo ? <img src={o.photo} alt={`${o.title}${o.model ? ` — ${o.model}` : ''}`} loading="lazy" /> : <Placeholder paint="#444" />}
        <div className="uc-top">
          <Link href={`/users/${o.user.id}`} className="uc-user stack-over">
            <Avatar name={o.user.name} color={o.user.color} size={20} />
            <span>{o.user.name}</span>
          </Link>
          <span className="spacer" />
          {o.isNew && <span className="badge badge-new">New</span>}
          {rank !== undefined && <span className={`uc-rank${rank === 1 ? ' gold' : ''}`} style={{ position: 'static' }}>{rank}</span>}
        </div>
        <div className="uc-bottom">
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 className="uc-title">
              <Link href={o.href} className="uc-link">
                {o.title}
              </Link>
            </h3>
            <div className="uc-sub">
              {[o.year, o.model].filter(Boolean).join(' ')} · {compact(o.views)} views
            </div>
          </div>
          <LikeButton target={{ type: 'owner', id: o.id }} liked={liked} count={o.likes} />
        </div>
      </div>
    </article>
  );
}
