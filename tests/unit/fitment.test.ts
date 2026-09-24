import { describe, expect, it } from 'vitest';
import { analyzeFitment, innerFaceMm, outerFaceMm, stretchOf, suggestAspect, tireOverallDiameterMm } from '@/lib/fitment';
import { sanitizeConfig, defaultConfigFor, fitmentLabel, type CarModel } from '@/lib/build-config';

const m3: CarModel = {
  id: 1, slug: 'bmw-m3-e92', make: 'BMW', model: 'M3', generation: 'E92', yearFrom: 2008, yearTo: 2013, origin: 'German', body: 'coupe',
  lengthMm: 4615, widthMm: 1817, heightMm: 1424, wheelbaseMm: 2761, boltPattern: '5x120', centerBore: 72.6,
  stockDiameter: 18, stockWidth: 8.5, stockOffset: 29, stockTireWidth: 245, stockTireAspect: 40,
  fenderClearance: 12, innerClearance: 10, archGap: 45, defaultPaint: '#eeeeea',
};

describe('tire geometry', () => {
  it('computes overall diameter from rim + sidewall', () => {
    // 245/40R18: 18*25.4 + 2*98 = 653.2 mm
    expect(tireOverallDiameterMm(18, 245, 40)).toBeCloseTo(653.2, 1);
  });
  it('suggests the aspect closest to stock diameter', () => {
    expect(suggestAspect(19, 255, tireOverallDiameterMm(18, 245, 40))).toBe(35);
  });
  it('classifies stretch', () => {
    expect(stretchOf(10, 225)).toBe('stretched');
    expect(stretchOf(7, 275)).toBe('bulged');
    expect(stretchOf(9, 255)).toBe('square');
  });
});

describe('offset math', () => {
  it('moves the outer face out when offset drops', () => {
    expect(outerFaceMm(8.5, 29) - outerFaceMm(8.5, 20)).toBeCloseTo(-9);
  });
  it('wider wheel with lower offset keeps inner barrel roughly fixed', () => {
    const inner = innerFaceMm(9, 23) - innerFaceMm(8.5, 29);
    expect(Math.abs(inner)).toBeLessThan(1);
  });
});

describe('analyzeFitment', () => {
  it('stock fitment fits', () => {
    const r = analyzeFitment(defaultConfigFor(m3), m3);
    expect(r.verdict).toBe('ok');
    expect(r.pokeMm).toBe(0);
    expect(r.diameterChangePct).toBe(0);
  });
  it('flags poke past the fender', () => {
    const r = analyzeFitment({ ...defaultConfigFor(m3), width: 10, offset: 15 }, m3);
    expect(r.pokeMm).toBeGreaterThan(20);
    expect(r.checks.find((c) => c.key === 'fender')!.severity).toBe('bad');
    expect(r.verdict).toBe('bad');
  });
  it('negative camber tucks the top of the wheel', () => {
    const base = { ...defaultConfigFor(m3), width: 9.5, offset: 22 };
    expect(analyzeFitment({ ...base, camber: -2 }, m3).fenderRoomMm).toBeGreaterThan(analyzeFitment(base, m3).fenderRoomMm);
  });
  it('flags strut contact on high offset', () => {
    const r = analyzeFitment({ ...defaultConfigFor(m3), width: 9.5, offset: 45 }, m3);
    expect(r.checks.find((c) => c.key === 'inner')!.severity).toBe('bad');
  });
  it('reports speedometer error for a taller tire', () => {
    const r = analyzeFitment({ ...defaultConfigFor(m3), tireAspect: 50 }, m3);
    expect(r.diameterChangePct).toBeGreaterThan(3);
    expect(r.speedoAt100).toBeLessThan(0);
  });
});

describe('sanitizeConfig', () => {
  it('clamps hostile input', () => {
    const c = sanitizeConfig({ diameter: 99, width: -3, offset: 500, paint: 'red;', finish: 'chrome', aero: { wing: '<script>' }, modelId: 99 }, m3);
    expect(c.diameter).toBe(24);
    expect(c.width).toBe(5.5);
    expect(c.offset).toBe(65);
    expect(c.paint).toBe(m3.defaultPaint);
    expect(c.finish).toBe('metallic');
    expect(c.aero.wing).toBeNull();
    expect(c.modelId).toBe(1);
  });
  it('labels fitment like the reference', () => {
    expect(fitmentLabel({ diameter: 18, width: 9.5, offset: 22, tireWidth: 265, tireAspect: 35 })).toEqual({ rim: '18×9.5 +22', tire: '265/35R18' });
  });
});
