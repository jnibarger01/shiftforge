'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { api } from '@/lib/client-api';

type Mode = 'signin' | 'signup' | 'forgot' | 'reset';

/** Only allow same-site relative redirects after auth. */
function safeNext(next: string | null) {
  return next && next.startsWith('/') && !next.startsWith('//') ? next : '/';
}

export default function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get('next'));
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<React.ReactNode>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    setError(null);
    if ((mode === 'signup' || mode === 'reset') && f.password !== f.confirm) return setError('Passwords do not match');
    setBusy(true);
    try {
      if (mode === 'signin') await api('/api/auth/signin', { body: { email: f.email, password: f.password } });
      if (mode === 'signup') await api('/api/auth/signup', { body: { name: f.name, email: f.email, password: f.password } });
      if (mode === 'reset') await api('/api/auth/reset', { body: { token: params.get('token'), password: f.password } });
      if (mode === 'forgot') {
        const r = await api<{ devResetUrl?: string }>('/api/auth/forgot', { body: { email: f.email } });
        setOk(
          <>
            If an account exists for that email, a reset link is on its way. It expires in one hour.
            {r.devResetUrl && (
              <>
                <br />
                <b>Local dev:</b> no mail server is configured — <a className="accent" href={r.devResetUrl}>open the reset link</a>.
              </>
            )}
          </>,
        );
        setBusy(false);
        return;
      }
      router.push(next);
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  };

  const titles: Record<Mode, [string, string]> = {
    signin: ['Sign in', 'Welcome back. Your garage is waiting.'],
    signup: ['Create your account', 'Save builds, vote in the ratings and post your ride.'],
    forgot: ['Reset your password', 'Enter your email and we will send a reset link.'],
    reset: ['Choose a new password', 'At least 8 characters.'],
  };
  const reason = params.get('reason');

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <h1>{titles[mode][0]}</h1>
        <p className="section-sub">{reason === 'lab' ? 'Sign in to publish your build — your work in the Lab is saved on this device and will be waiting.' : titles[mode][1]}</p>
        <form className="form" onSubmit={submit} noValidate={false}>
          {mode === 'signup' && (
            <div className="field">
              <label htmlFor="name">Name</label>
              <input id="name" name="name" className="input" required minLength={2} maxLength={40} autoComplete="name" />
            </div>
          )}
          {mode !== 'reset' && (
            <div className="field">
              <label htmlFor="email">Email</label>
              <input id="email" name="email" type="email" className="input" required autoComplete="email" />
            </div>
          )}
          {mode !== 'forgot' && (
            <div className="field">
              <label htmlFor="password">{mode === 'reset' ? 'New password' : 'Password'}</label>
              <input id="password" name="password" type="password" className="input" required minLength={mode === 'signin' ? 1 : 8} autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} />
            </div>
          )}
          {(mode === 'signup' || mode === 'reset') && (
            <div className="field">
              <label htmlFor="confirm">Confirm password</label>
              <input id="confirm" name="confirm" type="password" className="input" required minLength={8} autoComplete="new-password" />
            </div>
          )}
          {mode === 'signin' && (
            <Link href="/forgot-password" className="accent" style={{ fontSize: 13, justifySelf: 'end' }}>
              Forgot password?
            </Link>
          )}
          {error && (
            <div className="form-error" role="alert">
              {error}
            </div>
          )}
          {ok && (
            <div className="form-ok" role="status">
              {ok}
            </div>
          )}
          <button className="btn btn-primary btn-lg btn-block" disabled={busy}>
            {busy ? 'Please wait…' : { signin: 'Sign in', signup: 'Create account', forgot: 'Send reset link', reset: 'Save new password' }[mode]}
          </button>
        </form>
        <div className="auth-foot">
          {mode === 'signin' && (
            <>
              New here? <Link href={`/signup?next=${encodeURIComponent(next)}`}>Create an account</Link>
            </>
          )}
          {mode === 'signup' && (
            <>
              Already have an account? <Link href={`/signin?next=${encodeURIComponent(next)}`}>Sign in</Link>
            </>
          )}
          {(mode === 'forgot' || mode === 'reset') && <Link href="/signin">Back to sign in</Link>}
        </div>
        {mode === 'signin' && (
          <p className="demo-note">
            Demo account: <span className="mono">demo@shiftforge.dev</span> / <span className="mono">shiftforge-demo</span>
          </p>
        )}
      </div>
    </div>
  );
}
