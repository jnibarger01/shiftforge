import type { BuildConfig, CarModel } from './build-config';

const MM_PER_INCH = 25.4;

export type Severity = 'ok' | 'warn' | 'bad';
export type FitmentCheck = { key: string; label: string; value: string; severity: Severity; note: string };

export type FitmentReport = {
  overallDiameterMm: number;
  stockDiameterMm: number;
  diameterChangePct: number;
  /** Speedometer reads this % low (negative) / high (positive) at a true 100. */
  speedoAt100: number;
  sidewallMm: number;
  /** Outer wheel face movement vs stock, +outward (mm). */
  pokeMm: number;
  /** Inner barrel movement vs stock, +inward toward the strut (mm). */
  innerMm: number;
  /** Remaining room between outer lip and fender; negative = poke past fender. */
  fenderRoomMm: number;
  innerRoomMm: number;
  archGapMm: number;
  stretch: 'stretched' | 'square' | 'bulged';
  checks: FitmentCheck[];
  verdict: Severity;
  verdictLabel: string;
};

export function tireOverallDiameterMm(diameterIn: number, tireWidthMm: number, aspect: number) {
  return diameterIn * MM_PER_INCH + 2 * tireWidthMm * (aspect / 100);
}

/** Wheel outer face position from hub face (mm, outward positive). */
export function outerFaceMm(widthIn: number, offsetMm: number, spacerMm = 0) {
  return (widthIn * MM_PER_INCH) / 2 - offsetMm + spacerMm;
}

/** Wheel inner barrel position from hub face (mm, inward positive). */
export function innerFaceMm(widthIn: number, offsetMm: number, spacerMm = 0) {
  return (widthIn * MM_PER_INCH) / 2 + offsetMm - spacerMm;
}

/** Rim-width to tire-width ratio sits roughly 0.78–0.97 on an approved fitment. */
export function stretchOf(widthIn: number, tireWidthMm: number): FitmentReport['stretch'] {
  const ratio = (widthIn * MM_PER_INCH) / tireWidthMm;
  if (ratio > 0.97) return 'stretched';
  if (ratio < 0.78) return 'bulged';
  return 'square';
}

const round1 = (n: number) => Math.round(n * 10) / 10;
const signed = (n: number, unit = 'mm') => `${n > 0 ? '+' : ''}${round1(n)}${unit}`;

export function analyzeFitment(
  config: Pick<BuildConfig, 'diameter' | 'width' | 'offset' | 'spacer' | 'tireWidth' | 'tireAspect' | 'drop' | 'camber'>,
  model: Pick<CarModel, 'stockDiameter' | 'stockWidth' | 'stockOffset' | 'stockTireWidth' | 'stockTireAspect' | 'fenderClearance' | 'innerClearance' | 'archGap'>,
): FitmentReport {
  const overall = tireOverallDiameterMm(config.diameter, config.tireWidth, config.tireAspect);
  const stock = tireOverallDiameterMm(model.stockDiameter, model.stockTireWidth, model.stockTireAspect);
  const changePct = ((overall - stock) / stock) * 100;
  const speedoAt100 = (stock / overall) * 100 - 100;

  const pokeMm = outerFaceMm(config.width, config.offset, config.spacer) - outerFaceMm(model.stockWidth, model.stockOffset);
  const innerMm = innerFaceMm(config.width, config.offset, config.spacer) - innerFaceMm(model.stockWidth, model.stockOffset);
  // Negative camber tucks the top of the wheel in: roughly tan(camber) * half the tire height.
  const camberTuck = Math.tan((Math.abs(Math.min(config.camber, 0)) * Math.PI) / 180) * (overall / 2);
  const fenderRoomMm = model.fenderClearance - pokeMm + camberTuck;
  const innerRoomMm = model.innerClearance - innerMm;
  const archGapMm = model.archGap - (overall - stock) / 2 - config.drop;
  const stretch = stretchOf(config.width, config.tireWidth);

  const checks: FitmentCheck[] = [];
  checks.push({
    key: 'fender',
    label: 'Fender',
    value: signed(fenderRoomMm),
    severity: fenderRoomMm < -5 ? 'bad' : fenderRoomMm < 0 ? 'warn' : 'ok',
    note: fenderRoomMm < 0 ? 'Wheel pokes past the fender lip — expect rubbing or a legal issue.' : fenderRoomMm < 6 ? 'Flush. Tight, but inside the fender.' : 'Tucked inside the fender.',
  });
  checks.push({
    key: 'inner',
    label: 'Strut',
    value: signed(innerRoomMm),
    severity: innerRoomMm < 0 ? 'bad' : innerRoomMm < 4 ? 'warn' : 'ok',
    note: innerRoomMm < 0 ? 'Barrel hits the strut. Add a spacer or raise offset.' : innerRoomMm < 4 ? 'Under 4 mm to the strut.' : 'Clears suspension.',
  });
  checks.push({
    key: 'arch',
    label: 'Arch gap',
    value: signed(archGapMm),
    severity: archGapMm < -10 ? 'bad' : archGapMm < 0 ? 'warn' : 'ok',
    note: archGapMm < 0 ? 'Tire tucks into the arch at rest — rubs over bumps without rolled fenders.' : 'Clears the arch at ride height.',
  });
  checks.push({
    key: 'diameter',
    label: 'Diameter',
    value: signed(changePct, '%'),
    severity: Math.abs(changePct) > 3 ? 'bad' : Math.abs(changePct) > 1.5 ? 'warn' : 'ok',
    note: `Speedometer shows ${round1(100 + speedoAt100)} at a true 100.`,
  });
  checks.push({
    key: 'stretch',
    label: 'Tire',
    value: stretch,
    severity: stretch === 'square' ? 'ok' : 'warn',
    note: stretch === 'stretched' ? 'Rim is wider than the tire is approved for.' : stretch === 'bulged' ? 'Rim is narrow for this tire; sidewall bulges.' : 'Tire width suits this rim.',
  });

  const verdict: Severity = checks.some((c) => c.severity === 'bad') ? 'bad' : checks.some((c) => c.severity === 'warn') ? 'warn' : 'ok';
  const verdictLabel = verdict === 'bad' ? 'Needs work' : verdict === 'warn' ? 'Aggressive' : 'Fits';

  return {
    overallDiameterMm: round1(overall),
    stockDiameterMm: round1(stock),
    diameterChangePct: round1(changePct),
    speedoAt100: round1(speedoAt100),
    sidewallMm: round1(config.tireWidth * (config.tireAspect / 100)),
    pokeMm: round1(pokeMm),
    innerMm: round1(innerMm),
    fenderRoomMm: round1(fenderRoomMm),
    innerRoomMm: round1(innerRoomMm),
    archGapMm: round1(archGapMm),
    stretch,
    checks,
    verdict,
    verdictLabel,
  };
}

/** Pick the tire aspect that keeps overall diameter closest to stock for a given rim + tire width. */
export function suggestAspect(diameterIn: number, tireWidthMm: number, stockOverallMm: number) {
  let best = 35;
  let bestDelta = Infinity;
  for (let a = 25; a <= 75; a += 5) {
    const d = Math.abs(tireOverallDiameterMm(diameterIn, tireWidthMm, a) - stockOverallMm);
    if (d < bestDelta) {
      bestDelta = d;
      best = a;
    }
  }
  return best;
}
