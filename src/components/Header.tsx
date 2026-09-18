import Link from 'next/link';
import { CircleUserRound, Menu, Sparkles } from 'lucide-react';

const nav = [
  ['Studio', '/studio'],
  ['Marketplace', '/marketplace'],
  ['Community', '/community'],
  ['Compare', '/compare'],
  ['Garage', '/garage'],
];

export default function Header() {
  return (
    <header className="site-header">
      <Link className="brand" href="/">
        <span className="brand-mark"><Sparkles size={16} /></span>
        <span>SHIFT<span>FORGE</span></span>
      </Link>
      <nav className="desktop-nav" aria-label="Main navigation">
        {nav.map(([label, href]) => (
          <Link key={href} href={href}>{label}</Link>
        ))}
      </nav>
      <div className="header-actions">
        <Link className="account-link" href="/signin" aria-label="Account">
          <CircleUserRound size={20} />
          <span>Sign in</span>
        </Link>
        <Link className="btn btn-primary header-cta" href="/studio">
          Build a car
        </Link>
        <details className="mobile-menu">
          <summary aria-label="Open menu"><Menu size={20} /></summary>
          <div className="mobile-menu-panel">
            {nav.map(([label, href]) => (
              <Link key={href} href={href}>{label}</Link>
            ))}
            <Link href="/signin">Sign in</Link>
          </div>
        </details>
      </div>
    </header>
  );
}
