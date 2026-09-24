import type { BodyStyle } from './build-config';

type ModelRow = [
  slug: string, make: string, model: string, generation: string, yearFrom: number, yearTo: number | null,
  origin: 'German' | 'JDM' | 'USDM', body: BodyStyle, length: number, width: number, height: number, wheelbase: number,
  bolt: string, bore: number, stockD: number, stockW: number, stockEt: number, tireW: number, tireA: number,
  fender: number, inner: number, arch: number, paint: string,
];

// Dimensions and factory fitments are published figures (front axle where staggered).
export const CAR_MODELS: ModelRow[] = [
  ['bmw-m3-g80', 'BMW', 'M3', 'G80', 2021, null, 'German', 'sedan', 4794, 1903, 1433, 2857, '5x112', 66.6, 19, 9.5, 20, 275, 35, 8, 9, 38, '#135b3c'],
  ['bmw-m4-g82', 'BMW', 'M4', 'G82', 2021, null, 'German', 'coupe', 4794, 1887, 1393, 2857, '5x112', 66.6, 19, 9.5, 20, 275, 35, 8, 9, 38, '#e8561c'],
  ['bmw-m3-e92', 'BMW', 'M3', 'E92', 2008, 2013, 'German', 'coupe', 4615, 1817, 1424, 2761, '5x120', 72.6, 18, 8.5, 29, 245, 40, 12, 10, 45, '#eeeeea'],
  ['toyota-gr-supra-a90', 'Toyota', 'GR Supra', 'A90', 2020, null, 'JDM', 'coupe', 4379, 1854, 1292, 2470, '5x112', 66.6, 19, 9, 32, 255, 35, 10, 8, 40, '#c8141c'],
  ['toyota-supra-mk4', 'Toyota', 'Supra', 'MK4 A80', 1993, 2002, 'JDM', 'coupe', 4515, 1810, 1275, 2550, '5x114.3', 60.1, 17, 8, 50, 235, 45, 18, 12, 50, '#eeeeea'],
  ['toyota-gr86-zn8', 'Toyota', 'GR86', 'ZN8', 2022, null, 'JDM', 'coupe', 4265, 1775, 1310, 2575, '5x100', 56.1, 18, 7.5, 48, 215, 40, 16, 10, 42, '#1f46b5'],
  ['honda-civic-type-r-fl5', 'Honda', 'Civic Type R', 'FL5', 2023, null, 'JDM', 'hatch', 4595, 1890, 1405, 2735, '5x120', 64.1, 19, 9.5, 60, 265, 30, 10, 7, 40, '#eeeeea'],
  ['nissan-gt-r-r35', 'Nissan', 'GT-R', 'R35', 2009, null, 'JDM', 'coupe', 4710, 1895, 1370, 2780, '5x114.3', 66.1, 20, 9.5, 45, 255, 40, 10, 9, 42, '#8b8d8e'],
  ['subaru-wrx-vb', 'Subaru', 'WRX', 'VB', 2022, null, 'JDM', 'sedan', 4670, 1825, 1465, 2675, '5x114.3', 56.1, 18, 8.5, 55, 245, 40, 14, 9, 52, '#1f46b5'],
  ['mazda-mx5-nd', 'Mazda', 'MX-5', 'ND', 2016, null, 'JDM', 'roadster', 3915, 1735, 1235, 2310, '4x100', 54.1, 17, 7, 45, 205, 45, 15, 11, 45, '#c8141c'],
  ['toyota-gr-corolla', 'Toyota', 'GR Corolla', 'E210', 2023, null, 'JDM', 'hatch', 4410, 1850, 1480, 2640, '5x114.3', 60.1, 18, 8, 45, 235, 40, 14, 9, 50, '#eeeeea'],
  ['ford-mustang-gt-s650', 'Ford', 'Mustang GT', 'S650', 2024, null, 'USDM', 'fastback', 4811, 1916, 1397, 2720, '5x114.3', 70.5, 19, 9, 44, 255, 40, 12, 10, 48, '#f2c230'],
  ['chevrolet-camaro-ss', 'Chevrolet', 'Camaro SS', 'Gen 6', 2016, 2024, 'USDM', 'coupe', 4784, 1897, 1349, 2811, '5x120', 66.9, 20, 8.5, 35, 245, 40, 12, 10, 45, '#101114'],
  ['vw-golf-gti-mk8', 'Volkswagen', 'Golf GTI', 'Mk8', 2022, null, 'German', 'hatch', 4289, 1789, 1456, 2631, '5x112', 57.1, 18, 7.5, 51, 225, 40, 16, 10, 50, '#c8141c'],
  ['porsche-911-992', 'Porsche', '911 Carrera S', '992', 2020, null, 'German', 'coupe', 4519, 1852, 1300, 2450, '5x130', 71.6, 20, 8.5, 53, 245, 35, 10, 8, 38, '#b4b8b8'],
  ['audi-rs3-8y', 'Audi', 'RS3', '8Y', 2022, null, 'German', 'sedan', 4542, 1851, 1412, 2631, '5x112', 57.1, 19, 8.5, 44, 265, 30, 12, 9, 45, '#8b8d8e'],
  ['ford-f150-raptor', 'Ford', 'F-150 Raptor', 'Gen 3', 2021, null, 'USDM', 'truck', 5890, 2200, 2010, 3690, '6x135', 87.1, 17, 8.5, 34, 315, 70, 25, 20, 90, '#1f46b5'],
  ['toyota-4runner-n280', 'Toyota', '4Runner', 'N280', 2010, 2024, 'JDM', 'suv', 4830, 1925, 1816, 2790, '6x139.7', 106.1, 17, 7, 15, 265, 70, 20, 18, 85, '#8b8d8e'],
];

export type PartSeed = {
  slug: string;
  category: 'wheels' | 'tires' | 'suspension' | 'aero';
  brand: string;
  name: string;
  style: string;
  description: string;
  price: number | null;
  specs: Record<string, unknown>;
  colors?: string[];
};

const wheel = (
  brand: string, name: string, style: string, price: number | null, diameters: number[], widths: number[], offsets: [number, number],
  colors: string[], description: string, forged = false,
): PartSeed => ({
  slug: `${brand}-${name}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
  category: 'wheels', brand, name, style, price, description, colors,
  specs: { diameters, widths, offsets, construction: forged ? 'Forged monoblock' : 'Flow formed' },
});

export const PARTS: PartSeed[] = [
  wheel('Enkei', 'RPF1', 'split-spoke', 252.76, [15, 16, 17, 18], [7, 7.5, 8, 8.5, 9, 9.5, 10, 10.5], [15, 45], ['#c6c8cb', '#1a1a1c', '#b99a4a'], 'Twin five-spoke race wheel made with the MAT process. Around 16 lb in 17 inch — a time-attack default for two decades.'),
  wheel('Enkei', 'NT03+M', 'six-spoke', 289, [17, 18], [8, 9, 9.5, 10], [22, 45], ['#c6c8cb', '#1a1a1c'], 'Six-spoke with a machined lip and real concavity on the wider sizes.'),
  wheel('Volk Racing', 'TE37 Saga', 'six-spoke', 598, [17, 18, 19], [8, 8.5, 9, 9.5, 10, 10.5], [12, 45], ['#d9a93c', '#1a1a1c', '#c6c8cb'], 'Forged six-spoke icon. Sharp face, huge brake clearance, near-zero weight.', true),
  wheel('Volk Racing', 'CE28N', 'multi-spoke', 520, [16, 17, 18], [7, 7.5, 8, 8.5, 9, 9.5], [20, 50], ['#2f2f33', '#c6c8cb', '#d9a93c'], 'Ten-spoke forged lightweight built for small-bore JDM platforms.', true),
  wheel('BBS', 'LM', 'mesh', 1185, [17, 18, 19, 20], [8, 8.5, 9, 9.5, 10, 11], [15, 45], ['#c9b48a', '#c6c8cb', '#1a1a1c'], 'Two-piece cross-spoke mesh with a diamond-cut lip. The wheel every E46 dreams about.'),
  wheel('BBS', 'CH-R', 'multi-spoke', 495, [18, 19, 20], [8, 8.5, 9, 9.5, 10], [20, 45], ['#2f2f33', '#c6c8cb'], 'Flow-formed multi-spoke with a stainless lip trim ring.'),
  wheel('Work', 'Emotion CR Kiwami', 'split-spoke', 360, [15, 16, 17, 18], [7, 7.5, 8, 8.5, 9, 9.5, 10], [12, 47], ['#c6c8cb', '#1a1a1c', '#b99a4a'], 'Split five-spoke with a deep step lip on low offsets.'),
  wheel('Work', 'Meister S1 3P', 'deep-dish', 690, [17, 18, 19], [8, 9, 9.5, 10, 10.5, 11], [-20, 38], ['#c6c8cb', '#1a1a1c'], 'Three-piece with a polished barrel. Choose offset, get the lip you asked for.'),
  wheel('SSR', 'Professor SP1', 'deep-dish', 820, [17, 18, 19], [8, 8.5, 9, 9.5, 10], [-10, 42], ['#c6c8cb', '#2f2f33'], 'Classic two-piece five-spoke over a stepped lip.'),
  wheel('Rotiform', 'LAS-R', 'turbofan', 395, [18, 19, 20], [8.5, 9, 9.5, 10], [20, 45], ['#c6c8cb', '#1a1a1c'], 'Turbofan-inspired face that suits hot hatches and Euro sedans.'),
  wheel('Rotiform', 'RSE', 'mesh', 395, [17, 18, 19], [8, 8.5, 9, 9.5], [25, 45], ['#c6c8cb', '#1a1a1c'], 'Deep mesh cast wheel with a period-correct look.'),
  wheel('König', 'Hypergram', 'multi-spoke', 198.99, [15, 17, 18], [7, 8, 8.5, 9, 9.5], [25, 45], ['#1a1a1c', '#c6c8cb'], 'Budget flow-formed ten-spoke. Light for the money.'),
  wheel('König', 'Dekagram', 'multi-spoke', 214, [15, 17, 18, 19], [8, 8.5, 9, 9.5, 10], [25, 45], ['#1a1a1c', '#8b8d8e'], 'Ten-spoke flow-formed with a proper concave on wide sizes.'),
  wheel('Anovia', 'Titan', 'five-spoke', null, [17, 18, 19], [8, 8.5, 9, 9.5], [30, 45], ['#1a1a1c', '#8b8d8e'], 'Simple five-spoke with a tapered face. Pricing on request.'),
  wheel('Anovia', 'Kano', 'split-spoke', 220.79, [17, 18], [8, 8.5, 9, 9.5], [30, 45], ['#1a1a1c', '#c6c8cb'], 'Split-spoke gloss-black cast wheel for daily builds.'),
  wheel('Ferrada', 'CM2', 'monoblock', 545, [19, 20, 21, 22], [8.5, 9, 9.5, 10, 10.5, 11], [15, 45], ['#8b8d8e', '#1a1a1c'], 'Multi-spoke monoblock sized for modern sedans and SUVs.'),
  wheel('Fifteen52', 'Tarmac', 'five-spoke', 275, [15, 17, 18, 19], [7.5, 8, 8.5, 9, 9.5], [25, 50], ['#f3f3f3', '#1a1a1c', '#8b8d8e'], 'Rally-inspired five-hole face. Asphalt Black or Rally White.'),
  wheel('ESR', 'CS11', 'multi-spoke', 274, [18, 19, 20], [8.5, 9, 9.5, 10, 10.5], [20, 40], ['#8b8d8e', '#1a1a1c'], 'Flow-formed multi-spoke with a large concave.'),
  wheel('HRE', 'P101', 'monoblock', 1850, [19, 20, 21], [9, 9.5, 10, 10.5, 11, 12], [10, 55], ['#2f2f33', '#c6c8cb'], 'Forged monoblock, built to order per corner.', true),
  wheel('Vossen', 'HF-2', 'split-spoke', 450, [19, 20, 21], [8.5, 9, 9.5, 10, 10.5], [20, 45], ['#1a1a1c', '#8b8d8e'], 'Hybrid-forged split-spoke with deep concave on the rear.'),
  wheel('Titan 7', 'T-D6', 'six-spoke', 375, [17, 18, 19], [8.5, 9, 9.5, 10, 10.5], [20, 50], ['#1a1a1c', '#b99a4a'], 'Forged six-spoke rally wheel.', true),
  wheel('Apex', 'SM-10RS', 'multi-spoke', 330, [17, 18, 19], [8.5, 9, 9.5, 10, 10.5, 11], [10, 40], ['#8b8d8e', '#1a1a1c'], 'Track-focused ten-spoke flow-formed, widely sized for BMWs.'),
  wheel('Method', 'MR305 NV', 'six-spoke', 260, [16, 17, 18], [8, 8.5, 9], [-12, 25], ['#1a1a1c', '#8b8d8e'], 'Off-road six-spoke for trucks and SUVs.'),
  wheel('Fuel', 'Rebel', 'deep-dish', 300, [17, 18, 20], [8.5, 9, 10], [-24, 20], ['#1a1a1c', '#8b8d8e'], 'Six-spoke with a raised lip and deep face.'),

  { slug: 'michelin-pilot-sport-4s', category: 'tires', brand: 'Michelin', name: 'Pilot Sport 4S', style: 'max-performance', price: 312, description: 'Benchmark max-performance summer tire.', specs: { treadwear: 300 } },
  { slug: 'nitto-nt01', category: 'tires', brand: 'Nitto', name: 'NT01', style: 'track', price: 238, description: 'DOT competition tire for track days.', specs: { treadwear: 100 } },
  { slug: 'nitto-nt05', category: 'tires', brand: 'Nitto', name: 'NT05', style: 'max-performance', price: 196, description: 'Street max-performance with big sidewall lettering.', specs: { treadwear: 200 } },
  { slug: 'bridgestone-potenza-re-71rs', category: 'tires', brand: 'Bridgestone', name: 'Potenza RE-71RS', style: 'track', price: 268, description: '200TW autocross favorite.', specs: { treadwear: 200 } },
  { slug: 'falken-azenis-rt660', category: 'tires', brand: 'Falken', name: 'Azenis RT660', style: 'track', price: 184, description: 'Budget 200TW that runs with the expensive ones.', specs: { treadwear: 200 } },
  { slug: 'toyo-proxes-r888r', category: 'tires', brand: 'Toyo', name: 'Proxes R888R', style: 'track', price: 229, description: 'Track tire with a proper square shoulder.', specs: { treadwear: 100 } },
  { slug: 'continental-extremecontact-sport-02', category: 'tires', brand: 'Continental', name: 'ExtremeContact Sport 02', style: 'max-performance', price: 221, description: 'Quiet, quick max-performance summer.', specs: { treadwear: 340 } },
  { slug: 'bfgoodrich-all-terrain-ko3', category: 'tires', brand: 'BFGoodrich', name: 'All-Terrain T/A KO3', style: 'all-terrain', price: 289, description: 'All-terrain for trucks and SUVs.', specs: { treadwear: 0 } },

  { slug: 'kw-v3-coilovers', category: 'suspension', brand: 'KW', name: 'V3 Coilovers', style: 'coilover', price: 2699, description: 'Independent rebound and compression. Stainless bodies.', specs: { dropMin: 20, dropMax: 55 } },
  { slug: 'bc-racing-br-coilovers', category: 'suspension', brand: 'BC Racing', name: 'BR Series Coilovers', style: 'coilover', price: 1195, description: '30-way damping, monotube, adjustable top mounts.', specs: { dropMin: 10, dropMax: 70 } },
  { slug: 'ohlins-road-and-track', category: 'suspension', brand: 'Öhlins', name: 'Road & Track', style: 'coilover', price: 2950, description: 'DFV coilovers tuned for road and track.', specs: { dropMin: 15, dropMax: 45 } },
  { slug: 'hr-sport-springs', category: 'suspension', brand: 'H&R', name: 'Sport Springs', style: 'springs', price: 329, description: 'Progressive-rate lowering springs.', specs: { dropMin: 25, dropMax: 30 } },
  { slug: 'eibach-pro-kit', category: 'suspension', brand: 'Eibach', name: 'Pro-Kit', style: 'springs', price: 315, description: 'Mild progressive drop, OEM-like ride.', specs: { dropMin: 20, dropMax: 25 } },
  { slug: 'air-lift-performance-3p', category: 'suspension', brand: 'Air Lift', name: 'Performance 3P', style: 'air', price: 3890, description: 'Air suspension with height presets. Aired out or aired up.', specs: { dropMin: 0, dropMax: 100 } },
  { slug: 'fox-2-5-performance-elite', category: 'suspension', brand: 'Fox', name: '2.5 Performance Elite', style: 'lift', price: 2449, description: 'Adjustable coilover lift for trucks and SUVs.', specs: { dropMin: -30, dropMax: 0 } },

  { slug: 'maxton-front-splitter', category: 'aero', brand: 'Maxton Design', name: 'Front Splitter V2', style: 'front', price: 289, description: 'ABS front lip splitter with side fins.', specs: { slot: 'front', shape: 'splitter' } },
  { slug: 'apr-carbon-canards', category: 'aero', brand: 'APR Performance', name: 'Carbon Canards + Lip', style: 'front', price: 649, description: 'Carbon lip with dive planes.', specs: { slot: 'front', shape: 'canard' } },
  { slug: 'maxton-side-skirts', category: 'aero', brand: 'Maxton Design', name: 'Side Skirt Diffusers', style: 'side', price: 239, description: 'Side skirt extensions with flicks.', specs: { slot: 'side', shape: 'skirt' } },
  { slug: 'varis-wide-skirts', category: 'aero', brand: 'Varis', name: 'Arising Side Skirts', style: 'side', price: 1180, description: 'Carbon side skirts with a deep blade.', specs: { slot: 'side', shape: 'blade' } },
  { slug: 'maxton-rear-diffuser', category: 'aero', brand: 'Maxton Design', name: 'Rear Valance Diffuser', style: 'rear', price: 319, description: 'Rear diffuser with vertical strakes.', specs: { slot: 'rear', shape: 'diffuser' } },
  { slug: 'seibon-carbon-race-diffuser', category: 'aero', brand: 'Seibon Carbon', name: 'Race Diffuser', style: 'rear', price: 899, description: 'Tall-strake carbon diffuser.', specs: { slot: 'rear', shape: 'race' } },
  { slug: 'seibon-carbon-ducktail', category: 'aero', brand: 'Seibon Carbon', name: 'Ducktail Spoiler', style: 'wing', price: 399, description: 'Carbon ducktail on the trunk edge.', specs: { slot: 'wing', shape: 'ducktail' } },
  { slug: 'apr-gtc-300-wing', category: 'aero', brand: 'APR Performance', name: 'GTC-300 Wing', style: 'wing', price: 1299, description: 'Adjustable carbon GT wing on pedestal mounts.', specs: { slot: 'wing', shape: 'gt' } },
  { slug: 'voltex-type-7-swan', category: 'aero', brand: 'Voltex', name: 'Type 7 Swan Neck', style: 'wing', price: 2450, description: 'Swan-neck GT wing, time-attack spec.', specs: { slot: 'wing', shape: 'swan' } },
];

export const FIRST_NAMES = ['Marcus', 'Elena', 'Kenji', 'Priya', 'Diego', 'Hannah', 'Tomasz', 'Aaliyah', 'Ravi', 'Sofia', 'Jalen', 'Mei', 'Oskar', 'Brianna', 'Luca', 'Yuki', 'Andre', 'Camila', 'Felix', 'Nadia', 'Cole', 'Imani', 'Sven', 'Lucia'];
export const LAST_NAMES = ['Reyes', 'Kowalski', 'Tanaka', 'Okafor', 'Lindqvist', 'Moreau', 'Haddad', 'Brennan', 'Nakamura', 'Duarte', 'Petrov', 'Chen', 'Ibarra', 'Walsh', 'Rossi', 'Sato', 'Mensah', 'Vargas', 'Keller', 'Hughes', 'Park', 'Adeyemi', 'Novak', 'Serrano'];
export const WOMEN = new Set(['Elena', 'Priya', 'Hannah', 'Aaliyah', 'Sofia', 'Mei', 'Brianna', 'Yuki', 'Camila', 'Nadia', 'Imani', 'Lucia']);
export const CITIES = ['Austin, TX', 'Denver, CO', 'Tampa, FL', 'Portland, OR', 'Columbus, OH', 'San Diego, CA', 'Charlotte, NC', 'Phoenix, AZ', 'Detroit, MI', 'Seattle, WA', 'Atlanta, GA', 'Salt Lake City, UT'];
