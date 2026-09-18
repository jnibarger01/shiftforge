'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Cloud, LogIn, LogOut, ShieldCheck } from 'lucide-react';

type UserView = {
  username?: string;
  email?: string;
};

export default function AccountPanel() {
  const [user, setUser] = useState<UserView | null>(null);
  const [message, setMessage] = useState('Checking account…');

  useEffect(() => {
    let active = true;
    const load = async () => {
      for (let attempt = 0; attempt < 20 && !window.puter; attempt += 1) {
        await new Promise((resolve) => setTimeout(resolve, 150));
      }
      const puter = window.puter;
      if (!active) return;
      if (!puter) {
        setMessage('Account service did not load. The 3D studio still works without an account.');
        return;
      }
      if (puter.auth.isSignedIn()) {
        try {
          const next = await puter.auth.getUser();
          if (active) {
            setUser(next);
            setMessage('Cloud garage is active.');
          }
          return;
        } catch {
          setMessage('Could not read the signed-in account.');
          return;
        }
      }
      setMessage('Sign in only if you want cloud build copies and AI generation.');
    };
    void load();
    return () => { active = false; };
  }, []);

  const signIn = async () => {
    const puter = window.puter;
    if (!puter) return;
    try {
      const next = await puter.auth.signIn();
      setUser(next);
      setMessage('Signed in. Cloud garage and AI generation are available.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Sign-in cancelled.');
    }
  };

  const signOut = async () => {
    const puter = window.puter;
    if (!puter) return;
    await puter.auth.signOut();
    setUser(null);
    setMessage('Signed out. Local builds stay on this device.');
  };

  return (
    <div className="account-card">
      <div className="account-icon"><Cloud size={30} /></div>
      <span className="eyebrow">OPTIONAL ACCOUNT</span>
      <h1>{user ? 'Cloud garage connected.' : '3D first. Account second.'}</h1>
      <p className="lead">
        ShiftForge does not require an account for the live 3D studio. Puter
        authentication is used only for cloud build copies and user-paid AI generation.
      </p>
      <div className="account-state">
        <span className={user ? 'status-dot online' : 'status-dot'} />
        <div>
          <strong>{user ? user.email || user.username || 'Signed-in user' : 'Local mode'}</strong>
          <span>{message}</span>
        </div>
      </div>
      <div className="account-benefits">
        <span><CheckCircle2 size={16} /> Unlimited local 3D builds</span>
        <span><Cloud size={16} /> Optional cross-device cloud copies</span>
        <span><ShieldCheck size={16} /> No developer AI key stored by ShiftForge</span>
      </div>
      <div className="account-actions">
        {user ? (
          <button className="btn btn-secondary" onClick={signOut}>
            <LogOut size={17} /> Sign out
          </button>
        ) : (
          <button className="btn btn-primary" onClick={signIn}>
            <LogIn size={17} /> Continue with Puter
          </button>
        )}
        <Link className="btn btn-secondary" href="/studio">Open studio</Link>
      </div>
    </div>
  );
}
