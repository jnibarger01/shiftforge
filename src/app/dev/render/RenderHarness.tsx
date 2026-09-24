'use client';

import { useRef } from 'react';
import CarViewer, { type CarViewerHandle } from '@/components/lab/CarViewer';
import type { AeroShapes, ViewPreset } from '@/components/lab/car-scene';
import type { BuildConfig, CarModel, WheelStyle } from '@/lib/build-config';

export default function RenderHarness({ model, config, wheelStyle, aero, view }: { model: CarModel; config: BuildConfig; wheelStyle: string; aero: AeroShapes; view: string }) {
  const ref = useRef<CarViewerHandle>(null);
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 999 }}>
      <CarViewer
        ref={ref}
        model={model}
        config={config}
        wheelStyle={wheelStyle as WheelStyle}
        aero={aero}
        onReady={() => {
          ref.current?.setView(view as ViewPreset, true);
          const w = window as unknown as { __sfCapture?: () => string | null; __sfReady?: boolean };
          w.__sfCapture = () => ref.current?.capture(1200, 750) ?? null;
          setTimeout(() => (w.__sfReady = true), 400);
        }}
      />
    </div>
  );
}
