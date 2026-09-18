'use client';

import { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Box,
  Camera,
  Check,
  Cloud,
  Download,
  Gauge,
  LoaderCircle,
  Rotate3D,
  Save,
  Sparkles,
  WandSparkles,
} from 'lucide-react';
import CarPreview, { type CarPreviewHandle } from '@/components/CarPreview';
import {
  CAR_NAMES,
  DEFAULT_BUILD,
  type BuildConfig,
  type SavedBuild,
} from '@/lib/types';

type PuterUser = {
  username?: string;
  email?: string;
};

type PuterApi = {
  auth: {
    isSignedIn: () => boolean;
    signIn: () => Promise<PuterUser>;
    getUser: () => Promise<PuterUser>;
    signOut: () => Promise<void>;
  };
  ai: {
    txt2img: (
      prompt: string,
      options?: Record<string, unknown>,
    ) => Promise<HTMLImageElement>;
  };
  kv: {
    get: (key: string) => Promise<unknown>;
    set: (key: string, value: unknown) => Promise<unknown>;
  };
};

declare global {
  interface Window {
    puter?: PuterApi;
  }
}

const paints = [
  { name: 'Porcelain', value: '#f0eee8' },
  { name: 'Signal Red', value: '#dc2d32' },
  { name: 'Electric Blue', value: '#1769ff' },
  { name: 'Acid Lime', value: '#b6ff2e' },
  { name: 'Midnight', value: '#101216' },
  { name: 'Copper', value: '#ad5f36' },
];

const carOptions: { value: BuildConfig['car']; label: string; note: string }[] = [
  { value: 'sport-coupe', label: 'Apex S2', note: 'low, rear-biased coupe' },
  { value: 'performance-sedan', label: 'Vector RS', note: 'long-wheelbase sedan' },
  { value: 'track-hatch', label: 'Rook T', note: 'short, upright hot hatch' },
];

const wheels: { value: BuildConfig['wheel']; label: string }[] = [
  { value: 'mesh', label: 'Mesh GT' },
  { value: 'five-spoke', label: 'Five Spoke' },
  { value: 'aero', label: 'Aero Disc' },
  { value: 'deep-dish', label: 'Deep Dish' },
];

const aero: { value: BuildConfig['aero']; label: string }[] = [
  { value: 'stock', label: 'Clean' },
  { value: 'splitter', label: 'Street' },
  { value: 'wing', label: 'Wing' },
  { value: 'track', label: 'Track' },
];

const environments: { value: BuildConfig['environment']; label: string }[] = [
  { value: 'studio', label: 'Dark studio' },
  { value: 'night', label: 'Night paddock' },
  { value: 'salt', label: 'Salt flat' },
];

export default function CarStudio() {
  const [config, setConfig] = useState<BuildConfig>(DEFAULT_BUILD);
  const [renderUrl, setRenderUrl] = useState<string | null>(null);
  const [rendering, setRendering] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const previewRef = useRef<CarPreviewHandle | null>(null);

  const buildName = useMemo(
    () => CAR_NAMES[config.car] + ' · ' + config.paintName + ' · ' + config.wheelSize + '″',
    [config],
  );

  const patch = <K extends keyof BuildConfig>(key: K, value: BuildConfig[K]) => {
    setConfig((current) => ({ ...current, [key]: value }));
  };

  const saveBuild = async () => {
    const record: SavedBuild = {
      id: String(Date.now()),
      createdAt: new Date().toISOString(),
      config,
    };
    const local = JSON.parse(
      window.localStorage.getItem('shiftforge-builds') || '[]',
    ) as SavedBuild[];
    const next = [record, ...local].slice(0, 24);
    window.localStorage.setItem('shiftforge-builds', JSON.stringify(next));

    let cloudSaved = false;
    const puter = window.puter;
    if (puter?.auth.isSignedIn()) {
      try {
        const raw = await puter.kv.get('shiftforge:build-index');
        const cloud = Array.isArray(raw) ? (raw as SavedBuild[]) : [];
        await puter.kv.set('shiftforge:build:' + record.id, record);
        await puter.kv.set(
          'shiftforge:build-index',
          [record, ...cloud].slice(0, 30),
        );
        cloudSaved = true;
      } catch {
        cloudSaved = false;
      }
    }
    setMessage(
      cloudSaved
        ? 'Build saved locally and to your cloud garage.'
        : 'Build saved to this device. Sign in to enable cloud copies.',
    );
  };

  const generateRender = async () => {
    const puter = window.puter;
    if (!puter) {
      setMessage('AI service is still loading. Try again in a moment.');
      return;
    }

    setRendering(true);
    setMessage(null);
    try {
      if (!puter.auth.isSignedIn()) {
        await puter.auth.signIn();
      }

      const shot = previewRef.current?.capture();
      const prompt = [
        'Create a photoreal automotive editorial image based closely on the reference car.',
        'Keep the same body proportions, paint, wheel choice, ride height and aero treatment.',
        'Vehicle: ' + CAR_NAMES[config.car] + '.',
        'Paint: ' + config.paintName + ', ' + config.finish + ' finish.',
        'Wheels: ' + config.wheelSize + ' inch ' + config.wheel + '.',
        'Stance setting: ' + config.stance + ' of 70.',
        'Aero: ' + config.aero + '.',
        'Scene: ' + config.environment + '.',
        'Three-quarter front view, realistic reflections, correct tire contact patches, premium car photography, no text, no logos.',
      ].join(' ');

      const options: Record<string, unknown> = {
        model: 'gpt-image-1.5',
      };
      if (shot) {
        options.input_image = shot;
        options.input_image_mime_type = 'image/png';
      }

      const image = await puter.ai.txt2img(prompt, options);
      setRenderUrl(image.src);
      setMessage('AI concept render complete. Visual reference only — verify real-world fitment separately.');
    } catch (error) {
      const text = error instanceof Error ? error.message : String(error);
      setMessage(
        text.toLowerCase().includes('popup')
          ? 'Sign-in popup was blocked or closed. Allow popups, then retry the AI render.'
          : 'AI render failed: ' + text,
      );
    } finally {
      setRendering(false);
    }
  };

  return (
    <main className="studio-shell">
      <section className="studio-topbar">
        <div>
          <div className="eyebrow">LIVE BUILD · CONCEPT MODE</div>
          <h1>{buildName}</h1>
        </div>
        <div className="studio-actions">
          <button className="btn btn-secondary" onClick={saveBuild}>
            <Save size={17} /> Save build
          </button>
          <button
            className="btn btn-primary"
            onClick={generateRender}
            disabled={rendering}
          >
            {rendering ? (
              <LoaderCircle className="spin" size={17} />
            ) : (
              <Sparkles size={17} />
            )}
            {rendering ? 'Rendering…' : 'AI photoreal'}
          </button>
        </div>
      </section>

      {message ? <div className="status-banner">{message}</div> : null}

      <section className="studio-grid">
        <aside className="control-panel">
          <div className="control-section">
            <span className="control-kicker"><Box size={15} /> Platform</span>
            <div className="choice-stack">
              {carOptions.map((car) => (
                <button
                  key={car.value}
                  className={'choice-card ' + (config.car === car.value ? 'active' : '')}
                  onClick={() => patch('car', car.value)}
                >
                  <span>{car.label}</span>
                  <small>{car.note}</small>
                </button>
              ))}
            </div>
          </div>

          <div className="control-section">
            <span className="control-kicker">Paint</span>
            <div className="swatch-grid">
              {paints.map((paint) => (
                <button
                  key={paint.name}
                  className={'swatch ' + (config.paintName === paint.name ? 'active' : '')}
                  style={{ backgroundColor: paint.value }}
                  aria-label={paint.name}
                  title={paint.name}
                  onClick={() =>
                    setConfig((current) => ({
                      ...current,
                      paint: paint.value,
                      paintName: paint.name,
                    }))
                  }
                />
              ))}
            </div>
            <div className="segmented">
              {(['gloss', 'satin', 'matte'] as const).map((finish) => (
                <button
                  key={finish}
                  className={config.finish === finish ? 'active' : ''}
                  onClick={() => patch('finish', finish)}
                >
                  {finish}
                </button>
              ))}
            </div>
          </div>

          <div className="control-section">
            <span className="control-kicker"><Gauge size={15} /> Stance</span>
            <label className="range-label">
              <span>Ride height</span><strong>{config.stance}/70</strong>
            </label>
            <input
              type="range"
              min="0"
              max="70"
              value={config.stance}
              onChange={(event) => patch('stance', Number(event.target.value))}
            />
            <label className="range-label">
              <span>Wheel diameter</span><strong>{config.wheelSize}″</strong>
            </label>
            <input
              type="range"
              min="17"
              max="22"
              value={config.wheelSize}
              onChange={(event) => patch('wheelSize', Number(event.target.value))}
            />
          </div>
        </aside>

        <section className="viewer-panel">
          <div className="viewer-badges">
            <span><Rotate3D size={14} /> drag to rotate</span>
            <span>scroll to zoom</span>
          </div>
          <CarPreview ref={previewRef} config={config} className="car-preview" />
          <div className="viewer-foot">
            <span>{CAR_NAMES[config.car]}</span>
            <span>{config.paintName} / {config.finish}</span>
            <span>{config.wheelSize}″ {config.wheel}</span>
          </div>
        </section>

        <aside className="control-panel right-panel">
          <div className="control-section">
            <span className="control-kicker">Wheels</span>
            <div className="tile-grid">
              {wheels.map((wheel) => (
                <button
                  key={wheel.value}
                  className={'spec-tile ' + (config.wheel === wheel.value ? 'active' : '')}
                  onClick={() => patch('wheel', wheel.value)}
                >
                  <span className="wheel-glyph" />
                  <span>{wheel.label}</span>
                  {config.wheel === wheel.value ? <Check size={14} /> : null}
                </button>
              ))}
            </div>
          </div>

          <div className="control-section">
            <span className="control-kicker">Aero</span>
            <div className="segmented wrap">
              {aero.map((item) => (
                <button
                  key={item.value}
                  className={config.aero === item.value ? 'active' : ''}
                  onClick={() => patch('aero', item.value)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="control-section">
            <span className="control-kicker"><Camera size={15} /> Scene</span>
            <div className="choice-stack compact">
              {environments.map((item) => (
                <button
                  key={item.value}
                  className={'choice-card ' + (config.environment === item.value ? 'active' : '')}
                  onClick={() => patch('environment', item.value)}
                >
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="pro-callout">
            <WandSparkles size={19} />
            <div>
              <strong>From viewport to photoreal</strong>
              <p>
                The AI step uses the live 3D frame as a reference, so the render starts from the build you actually configured.
              </p>
            </div>
          </div>
        </aside>
      </section>

      <section className="render-section">
        <div className="section-heading split-heading">
          <div>
            <span className="eyebrow">AI CONCEPT OUTPUT</span>
            <h2>One more pass when 3D is not enough.</h2>
          </div>
          <p>
            Generation runs through Puter’s user-paid model gateway. ShiftForge does not store an API key or sell AI credits.
          </p>
        </div>

        {renderUrl ? (
          <div className="render-result">
            <div className="render-image-wrap">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={renderUrl} alt={'AI render of ' + buildName} />
            </div>
            <div className="render-meta">
              <span className="pill success"><Check size={14} /> Render complete</span>
              <h3>{buildName}</h3>
              <p>
                Concept visualization only. Wheel clearance, suspension geometry, lighting legality and part fitment must be verified before purchase or installation.
              </p>
              <div className="render-actions">
                <a className="btn btn-primary" href={renderUrl} download="shiftforge-concept.png">
                  <Download size={17} /> Download
                </a>
                <button className="btn btn-secondary" onClick={generateRender}>
                  <Sparkles size={17} /> Regenerate
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="empty-render">
            <Cloud size={28} />
            <h3>No AI render yet</h3>
            <p>Dial in the 3D build first, then generate only when the spec feels right.</p>
            <button className="btn btn-primary" onClick={generateRender} disabled={rendering}>
              <Sparkles size={17} /> Generate from current build
            </button>
          </div>
        )}
      </section>

      <section className="disclaimer-bar">
        <strong>Visualization, not fitment engineering.</strong>
        <span>
          ShiftForge concepts are for planning and inspiration only. Confirm dimensions, load ratings, clearances and legal requirements with the part manufacturer or installer.
        </span>
        <Link href="/compare">See how this differs from other tools →</Link>
      </section>
    </main>
  );
}
