'use client';

import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { ImageDown, Sparkles, Trash2 } from 'lucide-react';
import CarViewer, { type CarViewerHandle } from '@/components/lab/CarViewer';
import type { AeroShapes } from '@/components/lab/car-scene';
import type { BuildConfig, CarModel, WheelStyle } from '@/lib/build-config';
import { api } from '@/lib/client-api';
import { fitmentLabel } from '@/lib/build-config';

type PuterApi = {
  auth: { isSignedIn: () => boolean; signIn: () => Promise<unknown> };
  ai: { txt2img: (prompt: string, options?: Record<string, unknown>) => Promise<HTMLImageElement> };
};

function loadPuter(): Promise<PuterApi> {
  const w = window as unknown as { puter?: PuterApi };
  if (w.puter) return Promise.resolve(w.puter);
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://js.puter.com/v2/';
    s.async = true;
    s.onload = () => (w.puter ? resolve(w.puter) : reject(new Error('AI service failed to initialise')));
    s.onerror = () => reject(new Error('Could not reach the AI service. Check your connection or ad blocker.'));
    document.head.appendChild(s);
  });
}

async function imageToDataUrl(img: HTMLImageElement): Promise<string> {
  if (!img.complete) await new Promise((r, j) => ((img.onload = r), (img.onerror = j)));
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  canvas.getContext('2d')!.drawImage(img, 0, 0);
  return canvas.toDataURL('image/webp', 0.9);
}

export default function BuildStage(props: { buildId: number; title: string; modelName: string; model: CarModel; config: BuildConfig; wheelStyle: string; aero: AeroShapes; isOwner: boolean; modelSlug: string }) {
  const { buildId, title, modelName, model, config, wheelStyle, aero, isOwner } = props;
  const router = useRouter();
  const viewer = useRef<CarViewerHandle>(null);
  const [status, setStatus] = useState<{ text: string; error?: boolean } | null>(null);
  const [rendering, setRendering] = useState(false);

  const renderAi = async () => {
    setRendering(true);
    setStatus({ text: 'Connecting to the AI service… a Puter sign-in window may open.' });
    try {
      const puter = await loadPuter();
      if (!puter.auth.isSignedIn()) await puter.auth.signIn();
      const shot = viewer.current?.capture(1024, 640);
      const l = fitmentLabel(config);
      const prompt = [
        `Photoreal automotive photograph of a ${modelName} matching the reference image exactly:`,
        `same body, ${config.paintName} ${config.finish} paint, ${l.rim} aftermarket wheels in the same spoke design and color, ${l.tire} tires,`,
        config.drop > 0 ? `lowered ${config.drop}mm,` : '',
        `${config.scene === 'night' ? 'night city street with neon reflections' : config.scene === 'salt' ? 'salt flats at golden hour' : 'clean studio or empty urban street'},`,
        'three-quarter front view, realistic reflections, correct tire contact, no text, no logos, no people.',
      ].join(' ');
      setStatus({ text: 'Rendering… this usually takes 20–60 seconds.' });
      const img = await puter.ai.txt2img(prompt, { model: 'gpt-image-1', ...(shot ? { input_image: shot.split(',')[1], input_image_mime_type: 'image/webp' } : {}) });
      const dataUrl = await imageToDataUrl(img);
      await api(`/api/builds/${buildId}/renders`, { body: { image: dataUrl } });
      setStatus({ text: 'Render saved to this build and entered in the AI Renders division.' });
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setStatus({ text: /popup/i.test(msg) ? 'The sign-in popup was blocked. Allow popups for this site and try again.' : `AI render failed: ${msg}`, error: true });
    } finally {
      setRendering(false);
    }
  };

  const del = async () => {
    if (!confirm(`Delete “${title}”? This removes its votes, comments and renders and cannot be undone.`)) return;
    try {
      await api(`/api/builds/${buildId}`, { method: 'DELETE' });
      router.push('/garage');
      router.refresh();
    } catch (err) {
      setStatus({ text: (err as Error).message, error: true });
    }
  };

  const download = () => {
    const url = viewer.current?.capture(1920, 1080);
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.webp`;
    a.click();
  };

  return (
    <div>
      <div className="detail-viewer">
        <CarViewer ref={viewer} model={model} config={config} wheelStyle={wheelStyle as WheelStyle} aero={aero} label={`${title}, 3D view. Drag to rotate.`} />
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
        {(['front34', 'side', 'rear34', 'wheel'] as const).map((v) => (
          <button key={v} className="btn btn-outline btn-sm" onClick={() => viewer.current?.setView(v)}>
            {{ front34: 'Front ¾', side: 'Side', rear34: 'Rear ¾', wheel: 'Wheel close-up' }[v]}
          </button>
        ))}
        <span style={{ flex: 1 }} />
        <button className="btn btn-outline btn-sm" onClick={download}>
          <ImageDown size={14} aria-hidden /> Download image
        </button>
        {isOwner && (
          <>
            <button className="btn btn-ai btn-sm" onClick={renderAi} disabled={rendering}>
              <Sparkles size={14} aria-hidden /> {rendering ? 'Rendering…' : 'AI render'}
            </button>
            <button className="btn btn-danger btn-sm" onClick={del}>
              <Trash2 size={14} aria-hidden /> Delete
            </button>
          </>
        )}
      </div>
      {status && (
        <p className={status.error ? 'form-error' : 'notice'} role="status" style={{ marginTop: 10 }}>
          {status.text}
        </p>
      )}
      {isOwner && !status && <p className="muted" style={{ fontSize: 12, marginTop: 8 }}>AI render uses Puter (you sign in with your own Puter account; usage is billed to it). Results are concept art, not fitment proof.</p>}
    </div>
  );
}
