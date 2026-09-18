export type CarPreset = 'sport-coupe' | 'performance-sedan' | 'track-hatch';
export type Finish = 'gloss' | 'satin' | 'matte';
export type WheelStyle = 'mesh' | 'five-spoke' | 'aero' | 'deep-dish';
export type AeroStyle = 'stock' | 'splitter' | 'wing' | 'track';
export type Environment = 'studio' | 'night' | 'salt';

export type BuildConfig = {
  car: CarPreset;
  paint: string;
  paintName: string;
  finish: Finish;
  wheel: WheelStyle;
  wheelSize: number;
  stance: number;
  aero: AeroStyle;
  environment: Environment;
};

export type SavedBuild = {
  id: string;
  createdAt: string;
  config: BuildConfig;
};

export const DEFAULT_BUILD: BuildConfig = {
  car: 'sport-coupe',
  paint: '#f0eee8',
  paintName: 'Porcelain',
  finish: 'gloss',
  wheel: 'mesh',
  wheelSize: 19,
  stance: 28,
  aero: 'splitter',
  environment: 'studio',
};

export const CAR_NAMES: Record<CarPreset, string> = {
  'sport-coupe': 'Apex S2 Coupe',
  'performance-sedan': 'Vector RS Sedan',
  'track-hatch': 'Rook T Hatch',
};
