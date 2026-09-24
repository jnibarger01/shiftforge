'use client';

import { useState } from 'react';
import { Heart } from 'lucide-react';
import { api } from '@/lib/client-api';

type Target = { type: 'build' | 'owner' | 'render' | 'article'; id: number };

export function LikeButton({ target, liked: initialLiked, count: initialCount, variant = 'overlay' }: { target: Target; liked: boolean; count: number; variant?: 'overlay' | 'button' }) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [busy, setBusy] = useState(false);
  const toggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (busy) return;
    setBusy(true);
    setLiked(!liked);
    setCount(count + (liked ? -1 : 1));
    try {
      const r = await api<{ liked: boolean; likes: number }>('/api/likes', { body: target });
      setLiked(r.liked);
      setCount(r.likes);
    } catch {
      setLiked(liked);
      setCount(count);
    } finally {
      setBusy(false);
    }
  };
  if (variant === 'button')
    return (
      <button className={`btn ${liked ? 'btn-danger' : 'btn-outline'}`} aria-pressed={liked} onClick={toggle}>
        <Heart size={16} fill={liked ? 'currentColor' : 'none'} aria-hidden /> {count} {count === 1 ? 'like' : 'likes'}
      </button>
    );
  return (
    <button className="heart stack-over" aria-pressed={liked} aria-label={liked ? 'Unlike' : 'Like'} onClick={toggle}>
      <Heart size={20} aria-hidden />
      <span>{count}</span>
    </button>
  );
}

export function VoteButton({ target, voted: initialVoted, count: initialCount, label = 'Vote' }: { target: Target; voted: boolean; count: number; label?: string }) {
  const [voted, setVoted] = useState(initialVoted);
  const [count, setCount] = useState(initialCount);
  const [busy, setBusy] = useState(false);
  const toggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (busy) return;
    setBusy(true);
    try {
      const r = await api<{ voted: boolean; votes: number }>('/api/votes', { body: target });
      setVoted(r.voted);
      setCount(r.votes);
    } catch {
      /* api() redirects when signed out */
    } finally {
      setBusy(false);
    }
  };
  return (
    <button className="vote-btn stack-over" aria-pressed={voted} onClick={toggle} disabled={busy} aria-label={`${voted ? 'Remove vote' : label}, ${count} votes this week`}>
      ▲ {voted ? 'Voted' : label} <b>{count}</b>
    </button>
  );
}

export function ToggleButton({ url, payload, active: initial, count: initialCount, on, off, className = 'btn btn-outline' }: { url: string; payload: Record<string, unknown>; active: boolean; count?: number; on: string; off: string; className?: string }) {
  const [active, setActive] = useState(initial);
  const [count, setCount] = useState(initialCount);
  const [busy, setBusy] = useState(false);
  return (
    <button
      className={className}
      aria-pressed={active}
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          const r = await api<{ active?: boolean; count?: number; following?: boolean; followers?: number }>(url, { body: payload });
          setActive(r.active ?? r.following ?? !active);
          setCount(r.count ?? r.followers ?? count);
        } catch {
        } finally {
          setBusy(false);
        }
      }}
    >
      {active ? on : off}
      {count !== undefined && <span className="dim"> · {count}</span>}
    </button>
  );
}
