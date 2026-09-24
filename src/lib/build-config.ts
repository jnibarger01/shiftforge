export type BodyStyle = 'sedan' | 'coupe' | 'hatch' | 'fastback' | 'roadster' | 'suv' | 'truck';
export type Finish = 'gloss' | 'satin' | 'matte' | 'metallic';
export type WheelStyle = 'mesh' | 'five-spoke' | 'split-spoke' | 'multi-spoke' | 'six-spoke' | 'monoblock' | 'deep-dish' | 'turbofan';
export type Scene = 'studio' | 'night' | 'street' | 'salt';

export type AeroConfig = {
  front: string | null;
  side: string | null;
  rear: string | null;
  wing: string | null;
};

/** Everything the 3D Mods Lab needs to reproduce a build. Persisted as JSON. */
export type BuildConfig = {
  modelId: number;
  wheelPartId: number | null;
  wheelColor: string;
  diameter: number;
  width: number;
  offset: number;
  spacer: number;
  tirePartId: number | null;
  tireWidth: number;
  tireAspect: number;
  drop: number;
  camber: number;
  suspensionPartId: number | null;
  paint: string;
  paintName: string;
  finish: Finish;
  caliperColor: string;
  tint: number;
  aero: AeroConfig;
  scene: Scene;
};

export type CarModel = {
  id: number;
  slug: string;
  make: string;
  model: string;
  generation: string;
  yearFrom: number;
  yearTo: number | null;
  origin: 'German' | 'JDM' | 'USDM';
  body: BodyStyle;
  lengthMm: number;
  widthMm: number;
  heightMm: number;
  wheelbaseMm: number;
  boltPattern: string;
  centerBore: number;
  stockDiameter: number;
  stockWidth: number;
  stockOffset: number;
  stockTireWidth: number;
  stockTireAspect: number;
  /** Outer-lip-to-fender distance (mm) with stock wheels; positive means tucked. */
  fenderClearance: number;
  /** Space between stock inner barrel and strut (mm). */
  innerClearance: number;
  /** Gap between stock tire top and arch (mm). */
  archGap: number;
  defaultPaint: string;
};

export const SCENES: Scene[] = ['studio', 'street', 'night', 'salt'];
export const FINISHES: Finish[] = ['gloss', 'metallic', 'satin', 'matte'];

export const PAINTS = [
  { name: 'Alpine White', value: '#eeeeea' },
  { name: 'Obsidian', value: '#101114' },
  { name: 'Nardo Grey', value: '#8b8d8e' },
  { name: 'Brooklyn Grey', value: '#b4b8b8' },
  { name: 'Race Red', value: '#c8141c' },
  { name: 'Sunset Orange', value: '#e8561c' },
  { name: 'Signal Yellow', value: '#f2c230' },
  { name: 'Isle of Man Green', value: '#135b3c' },
  { name: 'Estoril Blue', value: '#1f46b5' },
  { name: 'Midnight Purple', value: '#2c1846' },
  { name: 'Miami Teal', value: '#1fb0a8' },
  { name: 'Champagne', value: '#c9b48a' },
];

export const CALIPER_COLORS = ['#c8141c', '#f2c230', '#1f46b5', '#111111', '#d0d0d0', '#e8561c'];

export function defaultConfigFor(model: CarModel): BuildConfig {
  return {
    modelId: model.id,
    wheelPartId: null,
    wheelColor: '#c6c8cb',
    diameter: model.stockDiameter,
    width: model.stockWidth,
    offset: model.stockOffset,
    spacer: 0,
    tirePartId: null,
    tireWidth: model.stockTireWidth,
    tireAspect: model.stockTireAspect,
    drop: 0,
    camber: 0,
    suspensionPartId: null,
    paint: model.defaultPaint,
    paintName: PAINTS.find((p) => p.value === model.defaultPaint)?.name ?? 'Factory',
    finish: 'metallic',
    caliperColor: '#111111',
    tint: 35,
    aero: { front: null, side: null, rear: null, wing: null },
    scene: 'studio',
  };
}

const HEX = /^#[0-9a-f]{6}$/i;
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
const num = (v: unknown, fallback: number) => (typeof v === 'number' && Number.isFinite(v) ? v : fallback);
const color = (v: unknown, fallback: string) => (typeof v === 'string' && HEX.test(v) ? v : fallback);
const idOrNull = (v: unknown) => (typeof v === 'number' && Number.isInteger(v) && v > 0 ? v : null);
const aeroSlot = (v: unknown) => (typeof v === 'string' && /^[a-z0-9-]{1,40}$/.test(v) ? v : null);

/** Coerce untrusted JSON into a valid config, clamping every value to a physical range. */
export function sanitizeConfig(input: unknown, model: CarModel): BuildConfig {
  const base = defaultConfigFor(model);
  if (!input || typeof input !== 'object') return base;
  const raw = input as Record<string, unknown>;
  const aero = (raw.aero && typeof raw.aero === 'object' ? raw.aero : {}) as Record<string, unknown>;
  const finish = FINISHES.includes(raw.finish as Finish) ? (raw.finish as Finish) : base.finish;
  const scene = SCENES.includes(raw.scene as Scene) ? (raw.scene as Scene) : base.scene;
  return {
    modelId: model.id,
    wheelPartId: idOrNull(raw.wheelPartId),
    wheelColor: color(raw.wheelColor, base.wheelColor),
    diameter: clamp(Math.round(num(raw.diameter, base.diameter)), 14, 24),
    width: clamp(Math.round(num(raw.width, base.width) * 2) / 2, 5.5, 13),
    offset: clamp(Math.round(num(raw.offset, base.offset)), -45, 65),
    spacer: clamp(Math.round(num(raw.spacer, 0)), 0, 30),
    tirePartId: idOrNull(raw.tirePartId),
    tireWidth: clamp(Math.round(num(raw.tireWidth, base.tireWidth) / 5) * 5, 155, 345),
    tireAspect: clamp(Math.round(num(raw.tireAspect, base.tireAspect) / 5) * 5, 25, 75),
    drop: clamp(Math.round(num(raw.drop, 0)), -30, 100),
    camber: clamp(Math.round(num(raw.camber, 0) * 10) / 10, -6, 1),
    suspensionPartId: idOrNull(raw.suspensionPartId),
    paint: color(raw.paint, base.paint),
    paintName: typeof raw.paintName === 'string' ? raw.paintName.slice(0, 40) : base.paintName,
    finish,
    caliperColor: color(raw.caliperColor, base.caliperColor),
    tint: clamp(Math.round(num(raw.tint, base.tint)), 5, 90),
    aero: { front: aeroSlot(aero.front), side: aeroSlot(aero.side), rear: aeroSlot(aero.rear), wing: aeroSlot(aero.wing) },
    scene,
  };
}

export function fitmentLabel(c: Pick<BuildConfig, 'diameter' | 'width' | 'offset' | 'tireWidth' | 'tireAspect'>) {
  const et = c.offset >= 0 ? `+${c.offset}` : `${c.offset}`;
  return {
    rim: `${c.diameter}×${c.width} ${et}`,
    tire: `${c.tireWidth}/${c.tireAspect}R${c.diameter}`,
  };
}
