import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="container page">
      <div className="empty" style={{ marginTop: 40 }}>
        <h3 style={{ fontSize: 26 }}>404 — this page took a wrong turn</h3>
        <p>The build, part or page you are looking for does not exist or was deleted.</p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link className="btn btn-primary" href="/">
            Home
          </Link>
          <Link className="btn btn-outline" href="/builds">
            Browse builds
          </Link>
          <Link className="btn btn-outline" href="/garage">
            Open the Lab
          </Link>
        </div>
      </div>
    </div>
  );
}
