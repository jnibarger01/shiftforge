import Link from 'next/link';
import { Eye } from 'lucide-react';
import { partHref, type Part } from '@/lib/catalog';
import { compact, money } from '@/lib/format';
import PartArt from '@/components/ui/PartArt';
import Avatar from '@/components/ui/Avatar';

export default function PartsGrid({ parts }: { parts: Part[] }) {
  return (
    <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
      {parts.map((p) => (
        <article className="part-card" key={p.id}>
          <div className="part-art">
            <PartArt category={p.category} style={p.style} color={p.colors[0]} />
          </div>
          <div className="part-info">
            <span className="part-brand">
              <Avatar name={p.brand} color="#3b3b44" size={18} /> {p.brand}
            </span>
            <h3>
              <Link href={partHref(p)} className="uc-link">
                {p.brand} {p.name}
              </Link>
            </h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="price">{p.priceCents === null ? 'Upon request' : `From ${money(p.priceCents)}`}</span>
              <span className="muted" style={{ fontSize: 12, display: 'inline-flex', gap: 4, alignItems: 'center' }}>
                <Eye size={12} aria-hidden /> {compact(p.views)}
              </span>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
