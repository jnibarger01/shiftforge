'use client';

import Link from 'next/link';
import { useEffect } from 'react';

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className="container page">
      <div className="empty" style={{ marginTop: 40 }} role="alert">
        <h3 style={{ fontSize: 24 }}>Something went wrong</h3>
        <p>We could not load this page. Try again — if it keeps happening, it is on us.</p>
        {error.digest && <p className="mono" style={{ fontSize: 12 }}>Ref: {error.digest}</p>}
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-primary" onClick={reset}>
            Try again
          </button>
          <Link className="btn btn-outline" href="/">
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
