import type { NumericKey, NumericFieldMeta } from '../fields';
import { FIELD_BY_KEY } from '../fields';
import { calculateModelB } from './engineB';
import type { NumericValues, TaxMode } from './engineB';

export const MAX_SWEEP_POINTS = 301;

export interface SweepPoint {
  x: number;
  evSuper: number;
  evOutside: number;
  superWins: boolean;
  recommendedExtraPerYear: number;
  recommendedExtraPctSalary: number;
}

export interface SweepResult {
  key: NumericKey;
  meta: NumericFieldMeta;
  points: SweepPoint[];
  stepUsed: number;
  count: number;
  stepAdjusted: boolean;
  /** points skipped because the engine rejected that scenario (e.g. access age before current age) */
  skipped: number;
}

/**
 * Evaluates the engine across a range of one variable, holding every other
 * value fixed. Steps are clamped so at most MAX_SWEEP_POINTS are computed.
 */
export function runSweep(
  values: NumericValues,
  taxMode: TaxMode,
  key: NumericKey,
  min: number,
  max: number,
  step: number,
): SweepResult {
  const meta = FIELD_BY_KEY.get(key);
  if (!meta) throw new Error(`Unknown sweep variable: ${key}`);

  if (!Number.isFinite(min) || !Number.isFinite(max) || min >= max || step <= 0) {
    return { key, meta, points: [], stepUsed: step, count: 0, stepAdjusted: false, skipped: 0 };
  }

  let stepUsed = step;
  let stepAdjusted = false;
  let count = Math.floor((max - min) / step) + 1;
  if (count > MAX_SWEEP_POINTS) {
    stepUsed = (max - min) / (MAX_SWEEP_POINTS - 1);
    count = MAX_SWEEP_POINTS;
    stepAdjusted = true;
  }

  const points: SweepPoint[] = [];
  let skipped = 0;
  for (let i = 0; i < count; i++) {
    const x = min + i * stepUsed;
    const sweptValues: NumericValues = { ...values, [key]: x };
    const result = calculateModelB(sweptValues, taxMode);
    if (!result.ok) {
      // e.g. sweeping access age below current age — skip rather than abort
      skipped++;
      continue;
    }
    points.push({
      x,
      evSuper: result.evSuper,
      evOutside: result.evOutside,
      superWins: result.superWins,
      recommendedExtraPerYear: result.recommendedExtraPerYear,
      recommendedExtraPctSalary: result.recommendedExtraPctSalary,
    });
  }

  return { key, meta, points, stepUsed, count: points.length, stepAdjusted, skipped };
}
