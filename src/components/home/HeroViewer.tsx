'use client';

import CarViewer from '@/components/lab/CarViewer';
import type { AeroShapes } from '@/components/lab/car-scene';
import type { BuildConfig, CarModel, WheelStyle } from '@/lib/build-config';

export default function HeroViewer({ model, config, wheelStyle, aero, title }: { model: CarModel; config: BuildConfig; wheelStyle: string; aero: AeroShapes; title: string }) {
  return <CarViewer model={model} config={config} wheelStyle={wheelStyle as WheelStyle} aero={aero} autoRotate label={`${title} rotating in 3D. Drag to look around.`} />;
}
