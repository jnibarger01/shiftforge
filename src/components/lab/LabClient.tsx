'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Camera, CircleDot, Disc3, Gauge, ImageDown, Paintbrush, RotateCcw, Ruler, Save, ShoppingCart, Sparkles, Sun, Wind } from 'lucide-react';
import CarViewer, { type CarViewerHandle } from './CarViewer';
import type { AeroShapes, ViewPreset } from './car-scene';
import WheelIcon from '@/components/ui/WheelIcon';
import { CALIPER_COLORS, FINISHES, PAINTS, SCENES, defaultConfigFor, fitmentLabel, type BuildConfig, type CarModel, type WheelStyle } from '@/lib/build-config';
import { analyzeFitment, suggestAspect, tireOverallDiameterMm } from '@/lib/fitment';
import type { Part } from '@/lib/catalog';
import { api } from '@/lib/client-api';
import { money } from '@/lib/format';

type Props = {
  model: CarModel;
  models: { slug: string; label: string }[];
  parts: Part[];
  initialConfig: BuildConfig;
  initialTitle: string;
  initialDescription: string;
  buildId: number | null;
  signedIn: boolean;
  notice: string | null;
};

type Tab = 'wheels' | 'setup' | 'tires' | 'suspension' | 'paint' | 'body' | 'scene' | 'fitment';
const TABS: { key: Tab; label: string; icon: typeof Disc3 }[] = [
  { key: 'wheels', label: 'Wheels', icon: Disc3 },
  { key: 'setup', label: 'Setup', icon: Ruler },
  { key: 'tires', label: 'Tires', icon: CircleDot },
  { key: 'suspension', label: 'Stance', icon: Gauge },
  { key: 'paint', label: 'Paint', icon: Paintbrush },
  { key: 'body', label: 'Aero', icon: Wind },
  { key: 'scene', label: 'Scene', icon: Sun },
  { key: 'fitment', label: 'Fitment', icon: Sparkles },
];

const DRAFT_KEY = (slug: string) => `sf-lab-draft:${slug}`;

function Stepper({ label, value, display, onDec, onInc, id }: { label: string; value: number; display: string; onDec: () => void; onInc: () => void; id: string }) {
  return (
    <div className="range-row">
      <span className="label" id={id}>
        {label}
      </span>
      <div className="stepper" role="group" aria-labelledby={id}>
        <button type="button" onClick={onDec} aria-label={`Decrease ${label}`}>
          −
        </button>
        <output aria-live="polite" data-value={value}>
          {display}
        </output>
        <button type="button" onClick={onInc} aria-label={`Increase ${label}`}>
          +
        </button>
      </div>
    </div>
  );
}

function Range({ label, value, min, max, step = 1, unit, onChange, id }: { label: string; value: number; min: number; max: number; step?: number; unit: string; onChange: (v: number) => void; id: string }) {
  return (
    <div className="range-row">
      <div className="range-head">
        <label htmlFor={id}>{label}</label>
        <strong>
          {value > 0 && unit === 'mm' && label.includes('Spacer') ? '+' : ''}
          {value}
          {unit}
        </strong>
      </div>
      <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </div>
  );
}

export default function LabClient({ model, models, parts, initialConfig, initialTitle, initialDescription, buildId, signedIn, notice }: Props) {
  const router = useRouter();
  const viewer = useRef<CarViewerHandle>(null);
  const [config, setConfig] = useState<BuildConfig>(initialConfig);
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [tab, setTab] = useState<Tab>('wheels');
  const [wheelQuery, setWheelQuery] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{ text: string; error?: boolean } | null>(null);
  const [restored, setRestored] = useState(false);

  const wheels = useMemo(() => parts.filter((p) => p.category === 'wheels'), [parts]);
  const tires = useMemo(() => parts.filter((p) => p.category === 'tires'), [parts]);
  const suspensions = useMemo(() => parts.filter((p) => p.category === 'suspension'), [parts]);
  const aeroParts = useMemo(() => parts.filter((p) => p.category === 'aero'), [parts]);
  const byId = useMemo(() => new Map(parts.map((p) => [p.id, p])), [parts]);
  const bySlug = useMemo(() => new Map(parts.map((p) => [p.slug, p])), [parts]);

  const wheel = config.wheelPartId ? byId.get(config.wheelPartId) : undefined;
  const tire = config.tirePartId ? byId.get(config.tirePartId) : undefined;
  const suspension = config.suspensionPartId ? byId.get(config.suspensionPartId) : undefined;
  const wheelStyle = (wheel?.style ?? 'five-spoke') as WheelStyle;
  const aeroShapes: AeroShapes = useMemo(
    () => Object.fromEntries(Object.entries(config.aero).map(([slot, slug]) => [slot, slug ? ((bySlug.get(slug)?.specs.shape as string) ?? null) : null])),
    [config.aero, bySlug],
  );
  const report = useMemo(() => analyzeFitment(config, model), [config, model]);
  const label = fitmentLabel(config);
  const stockOverall = tireOverallDiameterMm(model.stockDiameter, model.stockTireWidth, model.stockTireAspect);

  const update = useCallback((patch: Partial<BuildConfig>) => setConfig((c) => ({ ...c, ...patch })), []);
  const flash = (text: string, error = false) => {
    setToast({ text, error });
    window.setTimeout(() => setToast(null), 3200);
  };

  // Restore an unsaved draft (e.g. after being sent to sign in), then autosave locally on every change.
  useEffect(() => {
    if (buildId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- draft lives in localStorage, only readable after mount
      setRestored(true);
      return;
    }
    try {
      const raw = localStorage.getItem(DRAFT_KEY(model.slug));
      const fromQuery = new URLSearchParams(location.search).has('from');
      if (raw && !fromQuery) {
        const d = JSON.parse(raw);
        if (d?.config?.modelId === model.id) {
          setConfig({ ...defaultConfigFor(model), ...d.config, aero: { ...defaultConfigFor(model).aero, ...d.config.aero } });
          if (d.title) setTitle(d.title);
          if (d.description) setDescription(d.description);
        }
      }
    } catch {}
    // eslint-disable-next-line react-hooks/set-state-in-effect -- see above
    setRestored(true);
  }, [buildId, model]);
  useEffect(() => {
    if (!restored || buildId) return;
    try {
      localStorage.setItem(DRAFT_KEY(model.slug), JSON.stringify({ config, title, description }));
    } catch {}
  }, [config, title, description, restored, buildId, model.slug]);

  const selectWheel = (p: Part | null) => {
    if (!p) {
      update({ wheelPartId: null, diameter: model.stockDiameter, width: model.stockWidth, offset: model.stockOffset, tireWidth: model.stockTireWidth, tireAspect: model.stockTireAspect, wheelColor: '#c6c8cb' });
      return;
    }
    const ds = p.specs.diameters as number[];
    const ws = p.specs.widths as number[];
    const [etMin, etMax] = p.specs.offsets as [number, number];
    const diameter = ds.includes(config.diameter) ? config.diameter : ds.reduce((a, b) => (Math.abs(b - model.stockDiameter) < Math.abs(a - model.stockDiameter) ? b : a));
    const width = ws.includes(config.width) ? config.width : ws.reduce((a, b) => (Math.abs(b - model.stockWidth) < Math.abs(a - model.stockWidth) ? b : a));
    const offset = Math.min(etMax, Math.max(etMin, config.offset));
    const tireAspect = suggestAspect(diameter, config.tireWidth, stockOverall);
    update({ wheelPartId: p.id, diameter, width, offset, tireAspect, wheelColor: p.colors.includes(config.wheelColor) ? config.wheelColor : p.colors[0] ?? '#c6c8cb' });
  };

  const diameters = wheel ? (wheel.specs.diameters as number[]) : [model.stockDiameter];
  const widths = wheel ? (wheel.specs.widths as number[]) : [model.stockWidth];
  const [etMin, etMax] = wheel ? (wheel.specs.offsets as [number, number]) : [model.stockOffset, model.stockOffset];
  const stepIn = (list: number[], cur: number, dir: 1 | -1) => {
    const sorted = [...list].sort((a, b) => a - b);
    const i = sorted.indexOf(cur);
    return sorted[Math.min(sorted.length - 1, Math.max(0, (i === -1 ? 0 : i) + dir))];
  };

  const dropRange: [number, number] = suspension ? [suspension.specs.dropMin as number, suspension.specs.dropMax as number] : [0, 0];

  const lineItems = [
    wheel && { kind: 'Wheels', part: wheel, qty: 4, options: { size: `${config.diameter}x${config.width}`, offset: config.offset } },
    tire && { kind: 'Tires', part: tire, qty: 4, options: { size: label.tire } },
    suspension && { kind: 'Suspension', part: suspension, qty: 1, options: {} },
    ...Object.values(config.aero).map((slug) => {
      const p = slug ? bySlug.get(slug) : undefined;
      return p && { kind: 'Aero', part: p, qty: 1, options: {} };
    }),
  ].filter(Boolean) as { kind: string; part: Part; qty: number; options: Record<string, string | number> }[];
  const total = lineItems.reduce((s, l) => s + (l.part.priceCents ?? 0) * l.qty, 0);

  const goSignIn = () => {
    const next = `/garage/${model.slug}`;
    router.push(`/signin?next=${encodeURIComponent(next)}&reason=lab`);
  };

  const save = async () => {
    if (!signedIn) return goSignIn();
    if (title.trim().length < 2) {
      setPublishing(true);
      return;
    }
    setBusy(true);
    try {
      viewer.current?.setView('front34');
      await new Promise((r) => setTimeout(r, 700));
      const thumb = viewer.current?.capture(1200, 750) ?? undefined;
      const body = { title, description, config, thumb };
      const res = buildId ? await api<{ id: number; href: string }>(`/api/builds/${buildId}`, { method: 'PATCH', body }) : await api<{ id: number; href: string }>('/api/builds', { body });
      try {
        localStorage.removeItem(DRAFT_KEY(model.slug));
      } catch {}
      router.push(res.href);
      router.refresh();
    } catch (err) {
      flash((err as Error).message, true);
      setBusy(false);
    }
  };

  const addAllToCart = async () => {
    if (!signedIn) return goSignIn();
    if (!lineItems.length) return flash('Pick at least one part first', true);
    setBusy(true);
    try {
      for (const l of lineItems) await api('/api/cart', { body: { partId: l.part.id, qty: l.qty, options: l.options } });
      flash(`Added ${lineItems.length} part${lineItems.length > 1 ? 's' : ''} to your cart`);
      router.refresh();
    } catch (err) {
      flash((err as Error).message, true);
    } finally {
      setBusy(false);
    }
  };

  const screenshot = () => {
    const url = viewer.current?.capture(1920, 1080, ) ?? null;
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/[^a-z0-9]+/gi, '-').toLowerCase() || 'build'}.webp`;
    a.click();
  };

  const views: [ViewPreset, string][] = [
    ['front34', 'Front ¾'],
    ['side', 'Side'],
    ['rear34', 'Rear ¾'],
    ['front', 'Front'],
    ['wheel', 'Wheel'],
    ['top', 'Top'],
  ];

  const shownWheels = wheels.filter((w) => !wheelQuery || `${w.brand} ${w.name} ${w.style}`.toLowerCase().includes(wheelQuery.toLowerCase()));

  return (
    <div className="lab">
      <aside className="lab-panel" aria-label="Build options">
        <div className="lab-panel-head">
          <label className="sr-only" htmlFor="build-title">
            Build name
          </label>
          <input id="build-title" className="lab-title-input" value={title} maxLength={80} onChange={(e) => setTitle(e.target.value)} />
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <label className="sr-only" htmlFor="model-switch">
              Car model
            </label>
            <select id="model-switch" className="select" style={{ minHeight: 34, fontSize: 13 }} value={model.slug} onChange={(e) => router.push(`/garage/${e.target.value}`)}>
              {models.map((m) => (
                <option key={m.slug} value={m.slug}>
                  {m.label}
                </option>
              ))}
            </select>
            <button className="btn btn-ghost btn-sm" title="Reset to factory setup" onClick={() => setConfig(defaultConfigFor(model))}>
              <RotateCcw size={14} aria-hidden /> Stock
            </button>
          </div>
          {notice && <p className="notice" style={{ padding: '8px 10px', fontSize: 12 }}>{notice}</p>}
        </div>
        <div className="lab-tabs" role="tablist" aria-label="Configurator sections">
          {TABS.map(({ key, label: l, icon: Icon }) => (
            <button key={key} role="tab" id={`tab-${key}`} aria-controls="lab-tabpanel" aria-selected={tab === key} className="lab-tab" onClick={() => setTab(key)}>
              <Icon size={19} aria-hidden />
              {l}
            </button>
          ))}
        </div>
        <div className="lab-body" role="tabpanel" id="lab-tabpanel" aria-labelledby={`tab-${tab}`}>
          {tab === 'wheels' && (
            <>
              <input className="input" placeholder="Search wheels (brand, model, style)…" aria-label="Search wheels" value={wheelQuery} onChange={(e) => setWheelQuery(e.target.value)} />
              <div className="option-grid">
                <button className="option" aria-pressed={!wheel} onClick={() => selectWheel(null)}>
                  <WheelIcon style="five-spoke" className="wheel-icon" />
                  <b>Factory wheels</b>
                  <small>
                    {model.stockDiameter}×{model.stockWidth} +{model.stockOffset}
                  </small>
                </button>
                {shownWheels.map((w) => (
                  <button key={w.id} className="option" aria-pressed={wheel?.id === w.id} onClick={() => selectWheel(w)}>
                    <WheelIcon style={w.style} color={w.colors[0]} className="wheel-icon" />
                    <b>
                      {w.brand} {w.name}
                    </b>
                    <small>
                      {Math.min(...(w.specs.diameters as number[]))}–{Math.max(...(w.specs.diameters as number[]))}″ · {money(w.priceCents)}
                    </small>
                  </button>
                ))}
              </div>
              {shownWheels.length === 0 && <p className="muted">No wheels match “{wheelQuery}”.</p>}
              {wheel && wheel.colors.length > 0 && (
                <div className="range-row">
                  <span className="label">Finish</span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {wheel.colors.map((c) => (
                      <button key={c} className="swatch" style={{ background: c }} aria-label={`Wheel color ${c}`} aria-pressed={config.wheelColor === c} onClick={() => update({ wheelColor: c })} />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {tab === 'setup' && (
            <>
              <h3>Wheel setup</h3>
              {!wheel && <p className="notice">Factory wheels are fixed. Pick an aftermarket wheel to change size and offset — or add spacers below.</p>}
              <Stepper id="diam" label="Diameter" value={config.diameter} display={`${config.diameter}″`} onDec={() => update({ diameter: stepIn(diameters, config.diameter, -1), tireAspect: suggestAspect(stepIn(diameters, config.diameter, -1), config.tireWidth, stockOverall) })} onInc={() => update({ diameter: stepIn(diameters, config.diameter, 1), tireAspect: suggestAspect(stepIn(diameters, config.diameter, 1), config.tireWidth, stockOverall) })} />
              <Stepper id="width" label="Width" value={config.width} display={`${config.width}″`} onDec={() => update({ width: stepIn(widths, config.width, -1) })} onInc={() => update({ width: stepIn(widths, config.width, 1) })} />
              {wheel ? (
                <Range id="et" label="Offset (ET)" value={config.offset} min={etMin} max={etMax} unit="" onChange={(v) => update({ offset: v })} />
              ) : (
                <p className="muted">Offset ET{config.offset}</p>
              )}
              <Range id="spacer" label="Spacer" value={config.spacer} min={0} max={25} unit="mm" onChange={(v) => update({ spacer: v })} />
              <div className="notice">
                Outer lip moves <b className="mono">{report.pokeMm > 0 ? '+' : ''}{report.pokeMm} mm</b> vs stock, inner barrel <b className="mono">{report.innerMm > 0 ? '+' : ''}{report.innerMm} mm</b> toward the strut.
              </div>
            </>
          )}

          {tab === 'tires' && (
            <>
              <h3>Tire</h3>
              <div className="option-grid">
                <button className="option" aria-pressed={!tire} onClick={() => update({ tirePartId: null })}>
                  <b>Factory tire</b>
                  <small>OEM spec</small>
                </button>
                {tires.map((t) => (
                  <button key={t.id} className="option" aria-pressed={tire?.id === t.id} onClick={() => update({ tirePartId: t.id })}>
                    <b>
                      {t.brand} {t.name}
                    </b>
                    <small>
                      {t.style} · {money(t.priceCents)}
                    </small>
                  </button>
                ))}
              </div>
              <h3>Size</h3>
              <Stepper id="tw" label="Section width" value={config.tireWidth} display={`${config.tireWidth} mm`} onDec={() => update({ tireWidth: Math.max(155, config.tireWidth - 10) })} onInc={() => update({ tireWidth: Math.min(345, config.tireWidth + 10) })} />
              <Stepper id="ta" label="Aspect ratio" value={config.tireAspect} display={`${config.tireAspect}`} onDec={() => update({ tireAspect: Math.max(25, config.tireAspect - 5) })} onInc={() => update({ tireAspect: Math.min(75, config.tireAspect + 5) })} />
              <button className="btn btn-outline" onClick={() => update({ tireAspect: suggestAspect(config.diameter, config.tireWidth, stockOverall) })}>
                Match stock diameter
              </button>
              <div className="notice">
                <span className="mono">{label.tire}</span> · {Math.round(report.overallDiameterMm)} mm tall ({report.diameterChangePct > 0 ? '+' : ''}
                {report.diameterChangePct}% vs stock) · {report.stretch}
              </div>
            </>
          )}

          {tab === 'suspension' && (
            <>
              <h3>Suspension</h3>
              <div className="option-grid">
                <button className="option" aria-pressed={!suspension} onClick={() => update({ suspensionPartId: null, drop: 0 })}>
                  <b>Factory</b>
                  <small>Stock ride height</small>
                </button>
                {suspensions
                  .filter((s) => (model.body === 'truck' || model.body === 'suv' ? true : s.style !== 'lift'))
                  .map((s) => (
                    <button
                      key={s.id}
                      className="option"
                      aria-pressed={suspension?.id === s.id}
                      onClick={() => update({ suspensionPartId: s.id, drop: Math.min(s.specs.dropMax as number, Math.max(s.specs.dropMin as number, config.drop || Math.round(((s.specs.dropMin as number) + (s.specs.dropMax as number)) / 2))) })}
                    >
                      <b>
                        {s.brand} {s.name}
                      </b>
                      <small>
                        {s.style} · {money(s.priceCents)}
                      </small>
                    </button>
                  ))}
              </div>
              {suspension ? (
                <Range id="drop" label={config.drop < 0 ? 'Lift' : 'Drop'} value={config.drop} min={dropRange[0]} max={dropRange[1]} unit="mm" onChange={(v) => update({ drop: v })} />
              ) : (
                <p className="muted">Pick coilovers, springs or air to change ride height.</p>
              )}
              <Range id="camber" label="Camber" value={config.camber} min={-6} max={1} step={0.1} unit="°" onChange={(v) => update({ camber: Math.round(v * 10) / 10 })} />
            </>
          )}

          {tab === 'paint' && (
            <>
              <h3>Paint</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {[{ name: 'Factory', value: model.defaultPaint }, ...PAINTS].map((p) => (
                  <button key={p.name} className="swatch" style={{ background: p.value, width: 36, height: 36 }} title={p.name} aria-label={p.name} aria-pressed={config.paint === p.value} onClick={() => update({ paint: p.value, paintName: p.name })} />
                ))}
              </div>
              <div className="field">
                <label htmlFor="custom-paint">Custom color</label>
                <input id="custom-paint" type="color" value={config.paint} onChange={(e) => update({ paint: e.target.value, paintName: 'Custom' })} style={{ width: 64, height: 36, background: 'none', border: 0 }} />
              </div>
              <h3>Finish</h3>
              <div className="seg" role="group" aria-label="Paint finish">
                {FINISHES.map((f) => (
                  <button key={f} aria-pressed={config.finish === f} onClick={() => update({ finish: f })} style={{ textTransform: 'capitalize' }}>
                    {f}
                  </button>
                ))}
              </div>
              <h3>Brake calipers</h3>
              <div style={{ display: 'flex', gap: 8 }}>
                {CALIPER_COLORS.map((c) => (
                  <button key={c} className="swatch" style={{ background: c }} aria-label={`Caliper color ${c}`} aria-pressed={config.caliperColor === c} onClick={() => update({ caliperColor: c })} />
                ))}
              </div>
              <Range id="tint" label="Window tint (VLT)" value={config.tint} min={5} max={90} unit="%" onChange={(v) => update({ tint: v })} />
            </>
          )}

          {tab === 'body' && (
            <>
              {model.body === 'truck' || model.body === 'suv' ? <p className="notice">Aero kits are listed for cars; trucks and SUVs can still pick them for fun.</p> : null}
              {(['front', 'side', 'rear', 'wing'] as const).map((slot) => (
                <div key={slot} className="range-row">
                  <h3>{{ front: 'Front lip', side: 'Side skirts', rear: 'Rear diffuser', wing: 'Wing / spoiler' }[slot]}</h3>
                  <div className="option-grid">
                    <button className="option" aria-pressed={!config.aero[slot]} onClick={() => update({ aero: { ...config.aero, [slot]: null } })}>
                      <b>None</b>
                      <small>Factory</small>
                    </button>
                    {aeroParts
                      .filter((p) => p.style === slot)
                      .map((p) => (
                        <button key={p.id} className="option" aria-pressed={config.aero[slot] === p.slug} onClick={() => update({ aero: { ...config.aero, [slot]: p.slug } })}>
                          <b>{p.name}</b>
                          <small>
                            {p.brand} · {money(p.priceCents)}
                          </small>
                        </button>
                      ))}
                  </div>
                </div>
              ))}
            </>
          )}

          {tab === 'scene' && (
            <>
              <h3>Scene</h3>
              <div className="option-grid">
                {SCENES.map((s) => (
                  <button key={s} className="option" aria-pressed={config.scene === s} onClick={() => update({ scene: s })} style={{ textTransform: 'capitalize' }}>
                    <b>{s}</b>
                  </button>
                ))}
              </div>
              <h3>Camera</h3>
              <div className="option-grid">
                {views.map(([v, l]) => (
                  <button key={v} className="option" onClick={() => viewer.current?.setView(v)}>
                    <b>{l}</b>
                  </button>
                ))}
              </div>
            </>
          )}

          {tab === 'fitment' && (
            <>
              <h3>Fitment check</h3>
              <div className={`verdict ${report.verdict}`} style={{ width: 'fit-content' }}>
                {report.verdictLabel}
              </div>
              <div className="checks">
                {report.checks.map((c) => (
                  <div key={c.key} className="check-row">
                    <span className={`dot ${c.severity}`} aria-hidden />
                    <span>{c.label}</span>
                    <span className="v">{c.value}</span>
                    <span className="n">{c.note}</span>
                  </div>
                ))}
              </div>
              <table className="spec-table">
                <tbody>
                  <tr><th>Bolt pattern</th><td>{model.boltPattern} · CB {model.centerBore}</td></tr>
                  <tr><th>Stock setup</th><td>{model.stockDiameter}×{model.stockWidth} +{model.stockOffset} · {model.stockTireWidth}/{model.stockTireAspect}R{model.stockDiameter}</td></tr>
                  <tr><th>This setup</th><td>{label.rim}{config.spacer ? ` +${config.spacer}mm spacer` : ''} · {label.tire}</td></tr>
                  <tr><th>Sidewall</th><td>{report.sidewallMm} mm</td></tr>
                  <tr><th>Speedo at 100</th><td>{Math.round((100 + report.speedoAt100) * 10) / 10}</td></tr>
                </tbody>
              </table>
              <p className="muted" style={{ fontSize: 12 }}>
                Estimates from published factory fitments. Always test-fit and measure your own car.
              </p>
            </>
          )}

          <div className="panel" style={{ padding: 14 }}>
            <h3 style={{ marginBottom: 8 }}>Parts list</h3>
            {lineItems.length === 0 ? (
              <p className="muted" style={{ fontSize: 13 }}>Factory everything. Pick wheels to start.</p>
            ) : (
              lineItems.map((l) => (
                <div key={l.part.id} className="part-row">
                  <span className="part-kind">{l.kind}</span>
                  <span className="part-name">
                    {l.part.brand} {l.part.name}
                    {l.qty > 1 && <span className="dim"> ×{l.qty}</span>}
                  </span>
                  <span className="part-price">{l.part.priceCents === null ? 'Quote' : money(l.part.priceCents * l.qty)}</span>
                </div>
              ))
            )}
            <div className="total-row">
              <span className="muted">Estimated total</span>
              <b className="mono">{money(total)}</b>
            </div>
          </div>
        </div>
        <div className="lab-foot">
          <button className="btn btn-outline" onClick={addAllToCart} disabled={busy}>
            <ShoppingCart size={15} aria-hidden /> Add parts
          </button>
          <button className="btn btn-primary" onClick={() => (signedIn ? setPublishing(true) : goSignIn())} disabled={busy}>
            <Save size={15} aria-hidden /> {buildId ? 'Save' : 'Publish'}
          </button>
        </div>
      </aside>

      <section className="lab-stage" aria-label="3D preview">
        <CarViewer ref={viewer} model={model} config={config} wheelStyle={wheelStyle} aero={aeroShapes} label={`${title}: ${model.make} ${model.model} on ${label.rim} wheels`} />
        <div className="lab-toolbar">
          <div className="glass view-btns" role="group" aria-label="Camera views">
            {views.slice(0, 4).map(([v, l]) => (
              <button key={v} onClick={() => viewer.current?.setView(v)}>
                {l}
              </button>
            ))}
          </div>
          <span className="spacer" />
          <button className="glass btn btn-sm" style={{ background: 'var(--glass)' }} onClick={screenshot}>
            <ImageDown size={15} aria-hidden /> Screenshot
          </button>
          {buildId && (
            <Link className="glass btn btn-sm" style={{ background: 'var(--glass)' }} href={`/builds/${buildId}`}>
              <Camera size={15} aria-hidden /> View build
            </Link>
          )}
        </div>
        <div className="fitbar glass" aria-live="polite">
          <div className="spec">
            <small>Rims</small>
            {label.rim}
            {config.spacer ? ` (+${config.spacer})` : ''}
          </div>
          <div className="spec">
            <small>Tires</small>
            {label.tire}
          </div>
          <div className="spec">
            <small>Poke</small>
            {report.pokeMm > 0 ? '+' : ''}
            {report.pokeMm}mm
          </div>
          <div className="spec">
            <small>Drop</small>
            {config.drop}mm
          </div>
          <div className="spec desktop-only">
            <small>Speedo</small>
            {report.speedoAt100 > 0 ? '+' : ''}
            {report.speedoAt100}%
          </div>
          <span style={{ flex: 1 }} />
          <button className={`verdict ${report.verdict}`} style={{ border: 0, cursor: 'pointer' }} onClick={() => setTab('fitment')}>
            {report.verdictLabel}
          </button>
        </div>
      </section>

      {publishing && (
        <div className="modal-backdrop" role="presentation" onClick={() => !busy && setPublishing(false)}>
          <div className="modal" role="dialog" aria-modal="true" aria-labelledby="publish-h" onClick={(e) => e.stopPropagation()}>
            <h2 id="publish-h">{buildId ? 'Save changes' : 'Publish your build'}</h2>
            <p className="muted" style={{ marginBottom: 14 }}>
              {buildId ? 'Updates the public build page and thumbnail.' : 'Your build goes to the 3D builds gallery and enters this week’s ratings.'}
            </p>
            <form
              className="form"
              onSubmit={(e) => {
                e.preventDefault();
                save();
              }}
            >
              <div className="field">
                <label htmlFor="pub-title">Title</label>
                <input id="pub-title" className="input" required minLength={2} maxLength={80} value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="pub-desc">Notes (optional)</label>
                <textarea id="pub-desc" className="textarea" maxLength={1000} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What are you planning? What will you buy first?" />
              </div>
              <div className="notice">
                <span className="mono">
                  {label.rim} · {label.tire}
                </span>{' '}
                — fitment: <b>{report.verdictLabel}</b>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setPublishing(false)} disabled={busy}>
                  Cancel
                </button>
                <button className="btn btn-primary" disabled={busy}>
                  {busy ? (
                    <>
                      <span className="spinner" aria-hidden /> Saving…
                    </>
                  ) : buildId ? (
                    'Save build'
                  ) : (
                    'Publish build'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {toast && (
        <div className={`toast${toast.error ? ' error' : ''}`} role="status">
          {toast.text}
        </div>
      )}
    </div>
  );
}
