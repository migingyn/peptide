// src/lib/reconstitution.test.ts
import { describe, it, expect } from 'vitest';
import { reconstitute, mcgToMg, roundUnits, ReconError, type ReconInput } from './reconstitution';

describe('reconstitute — canonical fixtures', () => {
  it('Tesamorelin: M=2, W=1, D=1 → 2 mg/mL, 0.5 mL, 50 units, 2 doses', () => {
    const out = reconstitute({ vialMg: 2, waterMl: 1, doseMg: 1 });
    expect(out.concentrationMgPerMl).toBe(2);
    expect(out.volumeMl).toBe(0.5);
    expect(out.drawUnits).toBe(50);
    expect(out.dosesPerVial).toBe(2);
    expect(out.warnings).toEqual([]);
  });

  it('Ipamorelin: M=2, W=2, D=0.1 → 1 mg/mL, 0.1 mL, 10 units, 20 doses', () => {
    const out = reconstitute({ vialMg: 2, waterMl: 2, doseMg: 0.1 });
    expect(out.concentrationMgPerMl).toBe(1);
    expect(out.volumeMl).toBeCloseTo(0.1, 10);
    expect(out.drawUnits).toBeCloseTo(10, 10);
    expect(out.dosesPerVial).toBe(20);
    expect(out.warnings).toEqual([]);
  });
});

describe('reconstitute — invalid input throws ReconError', () => {
  const bad: Array<[string, ReconInput]> = [
    ['waterMl <= 0 (zero)', { vialMg: 2, waterMl: 0, doseMg: 1 }],
    ['waterMl <= 0 (negative)', { vialMg: 2, waterMl: -1, doseMg: 1 }],
    ['vialMg <= 0 (zero)', { vialMg: 0, waterMl: 1, doseMg: 1 }],
    ['vialMg <= 0 (negative)', { vialMg: -2, waterMl: 1, doseMg: 1 }],
    ['doseMg <= 0 (zero)', { vialMg: 2, waterMl: 1, doseMg: 0 }],
    ['doseMg <= 0 (negative)', { vialMg: 2, waterMl: 1, doseMg: -1 }],
    ['NaN vialMg', { vialMg: NaN, waterMl: 1, doseMg: 1 }],
    ['NaN waterMl', { vialMg: 2, waterMl: NaN, doseMg: 1 }],
    ['NaN doseMg', { vialMg: 2, waterMl: 1, doseMg: NaN }],
    // non-numeric values arriving via untyped boundaries (parse failures)
    ['non-numeric vialMg', { vialMg: 'x' as unknown as number, waterMl: 1, doseMg: 1 }],
    ['Infinity waterMl', { vialMg: 2, waterMl: Infinity, doseMg: 1 }],
  ];

  it.each(bad)('throws ReconError for %s', (_label, input) => {
    expect(() => reconstitute(input)).toThrow(ReconError);
  });
});

describe('reconstitute — D > M produces a warning (valid math)', () => {
  it('warns "dose exceeds a full vial" when doseMg > vialMg', () => {
    const out = reconstitute({ vialMg: 2, waterMl: 1, doseMg: 3 });
    expect(out.warnings).toContain('dose exceeds a full vial');
    // math still computes on raw numbers
    expect(out.concentrationMgPerMl).toBe(2);
    expect(out.volumeMl).toBe(1.5);
    expect(out.drawUnits).toBe(150);
    expect(out.dosesPerVial).toBeCloseTo(2 / 3, 10);
  });

  it('does NOT warn when doseMg === vialMg', () => {
    const out = reconstitute({ vialMg: 2, waterMl: 1, doseMg: 2 });
    expect(out.warnings).toEqual([]);
  });
});

describe('mcgToMg', () => {
  it('converts 1000 mcg to 1 mg', () => {
    expect(mcgToMg(1000)).toBe(1);
  });

  it('converts 100 mcg to 0.1 mg', () => {
    expect(mcgToMg(100)).toBeCloseTo(0.1, 10);
  });

  it('converts 0 mcg to 0 mg', () => {
    expect(mcgToMg(0)).toBe(0);
  });
});

describe('roundUnits', () => {
  it('rounds to 1 decimal place', () => {
    expect(roundUnits(49.96)).toBe(50);
    expect(roundUnits(10.04)).toBe(10);
    expect(roundUnits(12.34)).toBe(12.3);
    expect(roundUnits(12.35)).toBe(12.4);
  });

  it('leaves whole numbers unchanged', () => {
    expect(roundUnits(50)).toBe(50);
  });
});
