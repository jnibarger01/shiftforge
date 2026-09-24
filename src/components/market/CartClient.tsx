'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import PartArt from '@/components/ui/PartArt';
import { api } from '@/lib/client-api';
import { money } from '@/lib/format';

type Line = { id: number; qty: number; options: Record<string, unknown>; lineCents: number | null; part: { id: number; brand: string; name: string; category: string; style: string; color?: string; priceCents: number | null } };

export default function CartClient({ lines, totalCents, hasQuoteItems, defaultName, defaultEmail }: { lines: Line[]; totalCents: number; hasQuoteItems: boolean; defaultName: string; defaultEmail: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const setQty = async (id: number, qty: number) => {
    try {
      if (qty < 1) await api(`/api/cart/${id}`, { method: 'DELETE' });
      else await api(`/api/cart/${id}`, { method: 'PATCH', body: { qty } });
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const checkout = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    setError(null);
    try {
      const r = await api<{ id: number }>('/api/orders', { body: Object.fromEntries(f) });
      router.push(`/cart?ordered=${r.id}`);
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (!lines.length)
    return (
      <div className="empty">
        <h3>Your cart is empty</h3>
        <p>Add parts from the marketplace, or hit “Add parts” in the 3D Mods Lab to add a whole build.</p>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link className="btn btn-outline" href="/marketplace">
            Browse parts
          </Link>
          <Link className="btn btn-primary" href="/garage">
            Open the Lab
          </Link>
        </div>
      </div>
    );

  return (
    <div className="detail">
      <div className="panel">
        {lines.map((l) => (
          <div className="cart-line" key={l.id}>
            <div className="part-art">
              <PartArt category={l.part.category} style={l.part.style} color={(l.options.color as string) ?? l.part.color} />
            </div>
            <div>
              <b>
                {l.part.brand} {l.part.name}
              </b>
              <div className="muted mono" style={{ fontSize: 12 }}>
                {Object.entries(l.options)
                  .filter(([k]) => k !== 'color')
                  .map(([k, v]) => `${k}: ${v}`)
                  .join(' · ') || '—'}
              </div>
            </div>
            <div className="qty">
              <button aria-label={`Decrease ${l.part.name} quantity`} onClick={() => setQty(l.id, l.qty - 1)}>
                −
              </button>
              <span>{l.qty}</span>
              <button aria-label={`Increase ${l.part.name} quantity`} onClick={() => setQty(l.id, l.qty + 1)}>
                +
              </button>
            </div>
            <div className="line-total" style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'flex-end' }}>
              <span className="mono">{l.lineCents === null ? 'Quote' : money(l.lineCents)}</span>
              <button className="icon-btn" aria-label={`Remove ${l.part.name}`} onClick={() => setQty(l.id, 0)}>
                <Trash2 size={16} aria-hidden />
              </button>
            </div>
          </div>
        ))}
        <div className="total-row" style={{ marginTop: 12 }}>
          <span>Subtotal{hasQuoteItems ? ' (excl. quote items)' : ''}</span>
          <b className="mono" style={{ fontSize: 18 }}>
            {money(totalCents)}
          </b>
        </div>
      </div>
      <form className="panel form" onSubmit={checkout}>
        <h2>Request quote</h2>
        <p className="muted" style={{ fontSize: 13 }}>
          Sellers confirm fitment for your car and the final price before charging. No payment is taken here.
        </p>
        <div className="field">
          <label htmlFor="name">Name</label>
          <input id="name" name="name" className="input" required defaultValue={defaultName} autoComplete="name" />
        </div>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" className="input" required defaultValue={defaultEmail} autoComplete="email" />
        </div>
        <div className="form-row">
          <div className="field">
            <label htmlFor="zip">ZIP code</label>
            <input id="zip" name="zip" className="input" required minLength={3} maxLength={10} autoComplete="postal-code" />
          </div>
          <div className="field">
            <label htmlFor="vehicle">Vehicle</label>
            <input id="vehicle" name="vehicle" className="input" placeholder="2011 BMW M3" maxLength={80} />
          </div>
        </div>
        {error && (
          <div className="form-error" role="alert">
            {error}
          </div>
        )}
        <button className="btn btn-primary btn-lg" disabled={busy}>
          {busy ? 'Sending…' : 'Send quote request'}
        </button>
      </form>
    </div>
  );
}
