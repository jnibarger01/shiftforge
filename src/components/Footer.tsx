'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS = [
  ['About Us', '/about'],
  ['3D Mods Lab', '/garage'],
  ['Fitment Search', '/fitment'],
  ['Marketplace', '/marketplace'],
  ['Events Map', '/map'],
  ['Comparisons', '/compare'],
  ['Community Guidelines', '/about#guidelines'],
  ['Privacy', '/about#privacy'],
  ['Terms of Sale', '/about#terms'],
] as const;

export default function Footer() {
  const pathname = usePathname();
  // The Lab is a full-viewport app; no footer under it.
  if (/^\/garage\/[^/]+/.test(pathname)) return null;
  return (
    <footer className="site-footer">
      <div className="container">
        <p>
          ShiftForge is an independent platform and is not sponsored by, associated with, or endorsed by any automobile or parts manufacturer. Makes, models and brand names are
          used only to identify vehicles and parts; all trademarks belong to their owners. Fitment readouts are planning estimates — measure your own car before buying parts.
          Marketplace listings and prices are demonstration data.
        </p>
        <nav className="footer-links" aria-label="Footer">
          {LINKS.map(([label, href], i) => (
            <span key={href} style={{ display: 'contents' }}>
              {i > 0 && <span aria-hidden>•</span>}
              <Link href={href}>{label}</Link>
            </span>
          ))}
        </nav>
        <div>© 2026 ShiftForge. All rights reserved.</div>
      </div>
    </footer>
  );
}
