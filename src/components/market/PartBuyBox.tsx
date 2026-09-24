'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { Heart, ShoppingCart } from 'lucide-react';
import CarViewer from '@/components/lab/CarViewer';
import PartArt from '@/components/ui/PartArt';
import { defaultConfigFor, type CarModel, type WheelStyle } from '@/lib/build-config';
import { analyzeFitment, suggestAspect, tireOverallDiameterMm } from '@/lib/fitment';
import type { Part } from '@/lib/catalog';
import { api } from '@/lib/client-api';
import { money } from '@/lib/format';

type Props = { part: Part; favorite: boolean; signedIn: boolean; models: (CarModel & { label: string })[] };

export default function PartBuyBox({ part, favorite: initialFav, signedIn, models }: Props) {
  const router = useRouter();
  const isWheel = part.category === 'wheels';
  const diameters = (part.specs.diameters as number[] | undefined) ?? [];
  const widths = (part.specs.widths as number[] | undefined) ?? [];
  const [etMin, etMax] = (part.specs.offsets as [number, number] | undefined) ?? [0, 0];
  const [view, setView] = useState<'2d' | 'car'>('2d');
  const [diameter, setDiameter] = useState(diameters[Math.floor(diameters.length / 2)] ?? 18);
  const [width, setWidth] = useState(widths[Math.floor(widths.length / 2)] ?? 8.5);
  const [offset, setOffset] = useState(Math.round((etMin + etMax) / 2));
  const [color, setColor] = useState(part.colors[0] ?? '#c6c8cb');
  const [qty, setQty] = useState(isWheel || part.category === 'tires' ? 4 : 1);
  const [modelSlug, setModelSlug] = useState(models.find((m) => m.slug === 'bmw-m3-e92')?.slug ?? models[0].slug);
  const [fav, setFav] = useState(initialFav);
  const [msg, setMsg] = useState<{ text: string; error?: boolean } | null>(null);
  const [busy, setBusy] = useState(false);

  const model = models.find((m) => m.slug === modelSlug)!;
  const config = useMemo(() => {
    const base = defaultConfigFor(model);
    if (!isWheel) return base;
    const stock = tireOverallDiameterMm(model.stockDiameter, model.stockTireWidth, model.stockTireAspect);
    return { ...base, wheelPartId: part.id, diameter, width, offset, wheelColor: color, tireAspect: suggestAspect(diameter, base.tireWidth, stock) };
  }, [model, isWheel, part.id, diameter, width, offset, color]);
  const report = isWheel ? analyzeFitment(config, model) : null;

  const options = isWheel ? { size: `${diameter}x${width}`, offset, color } : {};

  const addToCart = async () => {
    if (!signedIn) return router.push(`/signin?next=${encodeURIComponent(location.pathname)}`);
    setBusy(true);
    try {
      await api('/api/cart', { body: { partId: part.id, qty, options } });
      setMsg({ text: 'Added to cart.' });
      router.refresh();
    } catch (err) {
      setMsg({ text: (err as Error).message, error: true });
    } finally {
      setBusy(false);
    }
  };
  const toggleFav = async () => {
    if (!signedIn) return router.push(`/signin?next=${encodeURIComponent(location.pathname)}`);
    try {
      const r = await api<{ active: boolean }>('/api/favorites', { body: { partId: part.id } });
      setFav(r.active);
    } catch (err) {
      setMsg({ text: (err as Error).message, error: true });
    }
  };

  return (
    <div className="detail">
      <div>
        <div className="detail-viewer" style={{ display: 'grid', placeItems: 'center' }}>
          {view === '2d' || !isWheel ? (
            <div style={{ width: '60%', maxWidth: 420, aspectRatio: 1, display: 'grid', placeItems: 'center' }}>
              <PartArt category={part.category} style={part.style} color={color} />
            </div>
          ) : (
            <CarViewer model={model} config={config} wheelStyle={part.style as WheelStyle} aero={{}} label={`${part.brand} ${part.name} on a ${model.label}`} />
          )}
        </div>
        {isWheel && (
          <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <div className="seg" role="group" aria-label="Preview">
              <button aria-pressed={view === '2d'} onClick={() => setView('2d')}>
                2D
              </button>
              <button aria-pressed={view === 'car'} onClick={() => setView('car')}>
                On car
              </button>
            </div>
            {view === 'car' && (
              <>
                <label className="sr-only" htmlFor="preview-car">
                  Preview car
                </label>
                <select id="preview-car" className="select" style={{ width: 'auto' }} value={modelSlug} onChange={(e) => setModelSlug(e.target.value)}>
                  {models.map((m) => (
                    <option key={m.slug} value={m.slug}>
                      {m.label}
                    </option>
                  ))}
                </select>
                {report && <span className={`verdict ${report.verdict}`}>{report.verdictLabel} · poke {report.pokeMm > 0 ? '+' : ''}{report.pokeMm}mm</span>}
              </>
            )}
          </div>
        )}
      </div>
      <aside className="panel" style={{ display: 'grid', gap: 14 }}>
        <div>
          <span className="kicker">{part.brand}</span>
          <h1 style={{ fontSize: 26, marginTop: 4 }}>
            {part.brand} {part.name}
          </h1>
          <p className="muted" style={{ marginTop: 6 }}>{part.description}</p>
        </div>
        <div className="price-big">{part.priceCents === null ? 'Upon request' : money(part.priceCents)}</div>
        {part.priceCents !== null && (isWheel || part.category === 'tires') && <small className="muted" style={{ marginTop: -10 }}>per {part.category === 'wheels' ? 'wheel' : 'tire'}</small>}
        {part.colors.length > 0 && (
          <div className="field">
            <span className="label">Select color</span>
            <div style={{ display: 'flex', gap: 8 }}>
              {part.colors.map((c) => (
                <button key={c} className="swatch" style={{ background: c }} aria-label={`Color ${c}`} aria-pressed={color === c} onClick={() => setColor(c)} />
              ))}
            </div>
          </div>
        )}
        {isWheel && (
          <div className="form-row">
            <div className="field">
              <label htmlFor="d">Diameter</label>
              <select id="d" className="select" value={diameter} onChange={(e) => setDiameter(Number(e.target.value))}>
                {diameters.map((d) => (
                  <option key={d} value={d}>
                    {d}″
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="w">Width</label>
              <select id="w" className="select" value={width} onChange={(e) => setWidth(Number(e.target.value))}>
                {widths.map((w) => (
                  <option key={w} value={w}>
                    {w}″
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="et">Offset (ET)</label>
              <input id="et" className="input" type="number" min={etMin} max={etMax} value={offset} onChange={(e) => setOffset(Math.min(etMax, Math.max(etMin, Number(e.target.value) || etMin)))} />
              <span className="hint">
                ET{etMin} to ET{etMax}
              </span>
            </div>
          </div>
        )}
        {part.category === 'suspension' && (
          <p className="notice">
            Ride height range: {String(part.specs.dropMin)}–{String(part.specs.dropMax)} mm {Number(part.specs.dropMin) < 0 ? 'lift' : 'drop'}
          </p>
        )}
        <div className="field">
          <span className="label">Quantity</span>
          <div className="qty">
            <button type="button" aria-label="Decrease quantity" onClick={() => setQty(Math.max(1, qty - 1))}>
              −
            </button>
            <span aria-live="polite">{qty}</span>
            <button type="button" aria-label="Increase quantity" onClick={() => setQty(Math.min(20, qty + 1))}>
              +
            </button>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-primary btn-lg" style={{ flex: 1 }} onClick={addToCart} disabled={busy}>
            <ShoppingCart size={16} aria-hidden /> {part.priceCents === null ? 'Request quote' : 'Add to cart'}
          </button>
          <button className={`btn btn-lg ${fav ? 'btn-danger' : 'btn-outline'}`} aria-pressed={fav} onClick={toggleFav} aria-label={fav ? 'Remove from favorites' : 'Add to favorites'}>
            <Heart size={16} fill={fav ? 'currentColor' : 'none'} aria-hidden /> {fav ? 'Saved' : 'Favorite'}
          </button>
        </div>
        {msg && (
          <p className={msg.error ? 'form-error' : 'form-ok'} role="status">
            {msg.text} {!msg.error && <Link href="/cart" className="accent">View cart →</Link>}
          </p>
        )}
        {isWheel && (
          <Link className="btn btn-outline" href={`/garage/${modelSlug}`}>
            Try it on your car in the Lab
          </Link>
        )}
      </aside>
    </div>
  );
}
