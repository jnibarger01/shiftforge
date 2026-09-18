import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { comparisons } from '@/lib/comparisons';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-top">
        <div>
          <div className="brand footer-brand">
            <span className="brand-mark">S</span>
            <span>SHIFT<span>FORGE</span></span>
          </div>
          <p>
            Visualize the build before you buy the parts. Realtime 3D first,
            photoreal AI when you need the final concept.
          </p>
        </div>
        <div className="footer-links">
          <div>
            <strong>Product</strong>
            <Link href="/studio">3D Studio</Link>
            <Link href="/garage">Garage</Link>
            <Link href="/marketplace">Marketplace</Link>
            <Link href="/community">Community</Link>
          </div>
          <div>
            <strong>Compare</strong>
            {comparisons.slice(0, 4).map((item) => (
              <Link href={'/compare/' + item.slug} key={item.slug}>
                vs {item.name}
              </Link>
            ))}
            <Link href="/compare">All comparisons <ArrowUpRight size={13} /></Link>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© 2026 ShiftForge. Independent concept project.</span>
        <span>
          Visual concepts only — not fitment, safety, legal or engineering advice.
        </span>
      </div>
    </footer>
  );
}
