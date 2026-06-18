// src/lib/reconstitution.ts
export interface ReconInput {
  vialMg: number;
  waterMl: number;
  doseMg: number;
}

export interface ReconResult {
  concentrationMgPerMl: number;
  volumeMl: number;
  drawUnits: number;
  dosesPerVial: number;
  warnings: string[];
}

export class ReconError extends Error {}

function assertPositiveNumber(value: number, label: string): void {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    throw new ReconError(`${label} must be a finite number > 0`);
  }
}

export function reconstitute(input: ReconInput): ReconResult {
  const { vialMg, waterMl, doseMg } = input;
  assertPositiveNumber(vialMg, 'vialMg');
  assertPositiveNumber(waterMl, 'waterMl');
  assertPositiveNumber(doseMg, 'doseMg');

  const concentrationMgPerMl = vialMg / waterMl; // M / W
  const volumeMl = doseMg / concentrationMgPerMl; // D * W / M
  const drawUnits = volumeMl * 100; // U-100: 1 mL = 100 units
  const dosesPerVial = vialMg / doseMg; // M / D

  const warnings: string[] = [];
  if (doseMg > vialMg) {
    warnings.push('dose exceeds a full vial');
  }

  return { concentrationMgPerMl, volumeMl, drawUnits, dosesPerVial, warnings };
}

export function mcgToMg(mcg: number): number {
  return mcg / 1000;
}

export function roundUnits(units: number): number {
  return Math.round(units * 10) / 10; // 1 decimal place for display
}
