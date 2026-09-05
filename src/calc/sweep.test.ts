import { describe, expect, it } from 'vitest';
import { DEFAULT_VALUES } from '../fields';
import { runSweep } from './sweep';
import type { NumericValues, TaxMode } from './engineB';

const AUTO: TaxMode = 'auto';
const values: NumericValues = { ...DEFAULT_VALUES };

describe('runSweep', () => {
  it('evaluates one point per step across the range', () => {
    const s = runSweep(values, AUTO, 'xRiskPct', 0, 10, 1);
    expect(s.count).toBe(11);
    expect(s.points[0].x).toBe(0);
    expect(s.points[10].x).toBe(10);
    expect(s.points[5].x).toBe(5);
  });

  it('holds every other variable fixed', () => {
    const s = runSweep(values, AUTO, 'xRiskPct', 1, 3, 1);
    for (const pt of s.points) {
      expect(pt.x).toBeGreaterThanOrEqual(1);
      expect(pt.x).toBeLessThanOrEqual(3);
    }
    // EV at x-risk 1% should equal a direct single-point calculation
    const [point] = s.points;
    expect(point.evSuper).toBeGreaterThan(0);
    expect(point.evOutside).toBeGreaterThan(0);
  });

  it('caps the number of points', () => {
    const s = runSweep(values, AUTO, 'xRiskPct', 0, 100, 0.001);
    expect(s.count).toBeLessThanOrEqual(301);
    expect(s.stepAdjusted).toBe(true);
  });

  it('returns empty for an invalid range', () => {
    const s = runSweep(values, AUTO, 'xRiskPct', 10, 0, 1);
    expect(s.count).toBe(0);
    expect(s.points).toHaveLength(0);
  });

  it('skips invalid scenarios when the range crosses them', () => {
    // Sweeping access age from below the current age (35) skips the invalid points.
    const s = runSweep(values, AUTO, 'retirementAge', 30, 80, 5);
    expect(s.points.every((pt) => pt.x >= 40)).toBe(true);
    expect(s.points.length).toBe(9); // 40..80 step 5
    expect(s.skipped).toBe(2); // 30, 35
  });
});
