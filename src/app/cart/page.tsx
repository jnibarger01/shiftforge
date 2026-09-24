import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getCart, listFavorites, listOrders } from '@/lib/content';
import { fmtDate, money } from '@/lib/format';
import CartClient from '@/components/market/CartClient';
import PartsGrid from '@/components/market/PartsGrid';

export const metadata: Metadata = { title: 'Cart & orders', robots: { index: false } };

export default async function CartPage({ searchParams }: { searchParams: Promise<{ ordered?: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect('/signin?next=/cart');
  const { ordered } = await searchParams;
  const cart = getCart(user.id);
  const orders = listOrders(user.id);
  const favorites = listFavorites(user.id);
  return (
    <div className="container page">
      <h1 className="page-title" style={{ marginBottom: 16 }}>
        Cart<span className="accent">.</span>
      </h1>
      {ordered && (
        <p className="form-ok" role="status" style={{ marginBottom: 16 }}>
          Quote request #{ordered} sent. Sellers confirm fitment and final price by email before anything is charged.
        </p>
      )}
      <CartClient
        lines={cart.lines.map((l) => ({ id: l.id, qty: l.qty, options: l.options, lineCents: l.lineCents, part: { id: l.part.id, brand: l.part.brand, name: l.part.name, category: l.part.category, style: l.part.style, color: l.part.colors[0], priceCents: l.part.priceCents } }))}
        totalCents={cart.totalCents}
        hasQuoteItems={cart.hasQuoteItems}
        defaultName={user.name}
        defaultEmail={user.email}
      />
      <section className="section">
        <div className="section-head">
          <h2>Your orders</h2>
        </div>
        {orders.length === 0 ? (
          <p className="muted">No orders yet.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Date</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td className="mono">{o.id}</td>
                    <td>{fmtDate(o.createdAt, { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                    <td>{o.items.map((i) => `${i.qty}× ${i.name}`).join(', ')}</td>
                    <td className="mono">{money(o.totalCents)}</td>
                    <td>
                      <span className="badge">{o.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <section className="section">
        <div className="section-head">
          <h2>Favorites</h2>
        </div>
        {favorites.length ? (
          <PartsGrid parts={favorites} />
        ) : (
          <p className="muted">
            Nothing saved yet. Tap Favorite on any <Link className="accent" href="/marketplace">part</Link>.
          </p>
        )}
      </section>
    </div>
  );
}
