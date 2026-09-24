'use client';

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import type { BuildConfig, CarModel, WheelStyle } from '@/lib/build-config';
import type { AeroShapes, CarScene, ViewPreset } from './car-scene';

export type CarViewerHandle = {
  capture: (w?: number, h?: number) => string | null;
  setView: (v: ViewPreset, instant?: boolean) => void;
};

type Props = {
  model: CarModel;
  config: BuildConfig;
  wheelStyle: WheelStyle;
  aero: AeroShapes;
  interactive?: boolean;
  autoRotate?: boolean;
  className?: string;
  label?: string;
  onReady?: () => void;
};

/** Mounts the Three.js scene lazily (client only) and feeds it config updates. */
const CarViewer = forwardRef<CarViewerHandle, Props>(function CarViewer({ model, config, wheelStyle, aero, interactive = true, autoRotate = false, className, label, onReady }, ref) {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<CarScene | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const latest = useRef({ model, config, wheelStyle, aero });
  latest.current = { model, config, wheelStyle, aero };
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;

  useImperativeHandle(ref, () => ({
    capture: (w, h) => sceneRef.current?.capture(w, h) ?? null,
    setView: (v, instant) => sceneRef.current?.setView(v, instant),
  }));

  useEffect(() => {
    let cancelled = false;
    let instance: CarScene | null = null;
    import('./car-scene')
      .then(({ CarScene }) => {
        if (cancelled || !mountRef.current) return;
        try {
          instance = new CarScene(mountRef.current, { interactive, autoRotate });
        } catch {
          setStatus('error');
          return;
        }
        sceneRef.current = instance;
        instance.update(latest.current);
        setStatus('ready');
        requestAnimationFrame(() => requestAnimationFrame(() => onReadyRef.current?.()));
      })
      .catch(() => !cancelled && setStatus('error'));
    return () => {
      cancelled = true;
      instance?.dispose();
      sceneRef.current = null;
    };
  }, [interactive, autoRotate]);

  useEffect(() => {
    sceneRef.current?.update({ model, config, wheelStyle, aero });
  }, [model, config, wheelStyle, aero]);

  return (
    <div className={`car-viewer ${className ?? ''}`} role="img" aria-label={label ?? `3D view of ${model.make} ${model.model}`}>
      <div ref={mountRef} className="car-viewer-canvas" />
      {status === 'loading' && (
        <div className="car-viewer-state">
          <span className="spinner" aria-hidden /> Loading 3D model…
        </div>
      )}
      {status === 'error' && <div className="car-viewer-state">3D view needs WebGL, which this browser has disabled.</div>}
    </div>
  );
});

export default CarViewer;
