'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { api } from '@/lib/client-api';

export default function SettingsForm({ user }: { user: { id: number; name: string; email: string; bio: string; location: string; womenBuilder: boolean } }) {
  const router = useRouter();
  const [msg, setMsg] = useState<{ text: string; error?: boolean } | null>(null);
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    setMsg(null);
    try {
      await api('/api/account', {
        method: 'PATCH',
        body: {
          name: f.get('name'),
          bio: f.get('bio'),
          location: f.get('location'),
          womenBuilder: f.get('womenBuilder') === 'on',
          currentPassword: f.get('currentPassword') || undefined,
          newPassword: f.get('newPassword') || undefined,
        },
      });
      setMsg({ text: 'Saved.' });
      (e.target as HTMLFormElement).querySelectorAll<HTMLInputElement>('input[type=password]').forEach((i) => (i.value = ''));
      router.refresh();
    } catch (err) {
      setMsg({ text: (err as Error).message, error: true });
    } finally {
      setBusy(false);
    }
  };
  return (
    <form className="panel form" onSubmit={submit}>
      <h2>Profile</h2>
      <div className="field">
        <label htmlFor="name">Display name</label>
        <input id="name" name="name" className="input" required minLength={2} maxLength={40} defaultValue={user.name} />
      </div>
      <div className="field">
        <label htmlFor="email">Email</label>
        <input id="email" className="input" value={user.email} disabled />
      </div>
      <div className="field">
        <label htmlFor="location">Location</label>
        <input id="location" name="location" className="input" maxLength={60} defaultValue={user.location} placeholder="City, ST" />
      </div>
      <div className="field">
        <label htmlFor="bio">Bio</label>
        <textarea id="bio" name="bio" className="textarea" maxLength={280} defaultValue={user.bio} />
      </div>
      <label className="check">
        <input type="checkbox" name="womenBuilder" defaultChecked={user.womenBuilder} />
        <span>
          Feature my builds in <b>What Women Builders Drive</b>
        </span>
      </label>
      <h2 style={{ marginTop: 10 }}>Change password</h2>
      <div className="form-row">
        <div className="field">
          <label htmlFor="currentPassword">Current password</label>
          <input id="currentPassword" name="currentPassword" type="password" className="input" autoComplete="current-password" />
        </div>
        <div className="field">
          <label htmlFor="newPassword">New password</label>
          <input id="newPassword" name="newPassword" type="password" className="input" minLength={8} autoComplete="new-password" />
        </div>
      </div>
      {msg && (
        <div className={msg.error ? 'form-error' : 'form-ok'} role="status">
          {msg.text}
        </div>
      )}
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn btn-primary" disabled={busy}>
          {busy ? 'Saving…' : 'Save changes'}
        </button>
        <Link className="btn btn-ghost" href={`/users/${user.id}`}>
          View profile
        </Link>
      </div>
    </form>
  );
}
