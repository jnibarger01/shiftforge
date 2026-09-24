'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { api } from '@/lib/client-api';

export default function ArticleForm({ initialKind, series }: { initialKind: 'journal' | 'magazine'; series: string[] }) {
  const router = useRouter();
  const [kind, setKind] = useState(initialKind);
  const [body, setBody] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.currentTarget));
    setBusy(true);
    setError(null);
    try {
      const r = await api<{ href: string }>('/api/articles', { body: { ...f, kind } });
      router.push(r.href);
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  };
  return (
    <form className="panel form" onSubmit={submit}>
      <div className="seg" role="group" aria-label="Type">
        <button type="button" aria-pressed={kind === 'journal'} onClick={() => setKind('journal')}>
          Build journal episode
        </button>
        <button type="button" aria-pressed={kind === 'magazine'} onClick={() => setKind('magazine')}>
          Magazine article
        </button>
      </div>
      {kind === 'journal' && (
        <div className="field">
          <label htmlFor="series">Build name</label>
          <input id="series" name="series" className="input" list="series-list" required maxLength={60} placeholder="e.g. The Auction E46" />
          <datalist id="series-list">
            {series.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
          <span className="hint">Reuse a build name to add the next episode to it.</span>
        </div>
      )}
      <div className="field">
        <label htmlFor="title">Title</label>
        <input id="title" name="title" className="input" required minLength={4} maxLength={120} />
      </div>
      <div className="field">
        <label htmlFor="excerpt">Summary (optional)</label>
        <input id="excerpt" name="excerpt" className="input" maxLength={240} placeholder="One or two sentences shown on cards" />
      </div>
      <div className="field">
        <label htmlFor="body">Story</label>
        <textarea id="body" name="body" className="textarea" style={{ minHeight: 300 }} required minLength={80} maxLength={20000} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Leave a blank line between paragraphs." />
        <span className="hint">{body.trim().split(/\s+/).filter(Boolean).length} words · minimum 80 characters</span>
      </div>
      {error && (
        <div className="form-error" role="alert">
          {error}
        </div>
      )}
      <div>
        <button className="btn btn-primary btn-lg" disabled={busy}>
          {busy ? 'Publishing…' : 'Publish'}
        </button>
      </div>
    </form>
  );
}
