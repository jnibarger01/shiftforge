'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import Avatar from './Avatar';
import { api } from '@/lib/client-api';
import { timeAgo } from '@/lib/format';

type C = { id: number; body: string; createdAt: string; user: { id: number; name: string; color: string } };

export default function Comments({ target, initial, viewerId }: { target: { type: 'build' | 'owner' | 'article' | 'render'; id: number }; initial: C[]; viewerId: number | null }) {
  const [items, setItems] = useState(initial);
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return setError('Write a comment first');
    setBusy(true);
    setError(null);
    try {
      const c = await api<C>('/api/comments', { body: { ...target, body: text } });
      setItems([...items, c]);
      setText('');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: number) => {
    if (!confirm('Delete this comment?')) return;
    try {
      await api(`/api/comments/${id}`, { method: 'DELETE' });
      setItems(items.filter((c) => c.id !== id));
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <section className="section" aria-labelledby="comments-h">
      <div className="section-head">
        <h2 id="comments-h">Comments {items.length > 0 && <span className="dim">({items.length})</span>}</h2>
      </div>
      <div className="comments">
        {items.length === 0 && <p className="muted">No comments yet. Start the conversation.</p>}
        {items.map((c) => (
          <div className="comment" key={c.id}>
            <Avatar name={c.user.name} color={c.user.color} size={30} round />
            <div className="comment-body">
              <div className="comment-head">
                <Link href={`/users/${c.user.id}`}>
                  <b>{c.user.name}</b>
                </Link>
                <span>{timeAgo(c.createdAt)}</span>
                {viewerId === c.user.id && (
                  <button className="icon-btn" style={{ width: 24, height: 24, marginLeft: 'auto' }} aria-label="Delete comment" onClick={() => remove(c.id)}>
                    <Trash2 size={14} aria-hidden />
                  </button>
                )}
              </div>
              <p style={{ whiteSpace: 'pre-wrap' }}>{c.body}</p>
            </div>
          </div>
        ))}
        {viewerId ? (
          <form className="form" onSubmit={submit}>
            <label className="sr-only" htmlFor="comment-text">
              Add a comment
            </label>
            <textarea id="comment-text" className="textarea" style={{ minHeight: 80 }} placeholder="Add a comment…" value={text} maxLength={1000} onChange={(e) => setText(e.target.value)} />
            {error && <div className="form-error" role="alert">{error}</div>}
            <div>
              <button className="btn btn-primary" disabled={busy}>
                {busy ? 'Posting…' : 'Post comment'}
              </button>
            </div>
          </form>
        ) : (
          <p className="notice">
            <Link className="accent" href={`/signin?next=${typeof window === 'undefined' ? '' : encodeURIComponent(location.pathname)}`}>
              Sign in
            </Link>{' '}
            to add a comment.
          </p>
        )}
      </div>
    </section>
  );
}
