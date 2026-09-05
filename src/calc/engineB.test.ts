import { describe, expect, it } from 'vitest';
import { DEFAULT_VALUES } from '../fields';
import {
  calculateModelB,
  evSuperAt,
  evOutsideAt,
  marginalTaxRatePct,
} from './engineB';
import type { NumericValues, TaxMode } from './engineB';

/** Default inputs, overridable. */
function inputs(overrides: Partial<NumericValues> = {}): NumericValues {
  return { ...DEFAULT_VALUES, ...overrides } as NumericValues;
}

const AUTO: TaxMode = 'auto';

describe('marginal tax rate (auto, FY2024-25 + Medicare)', () => {
  it.each([
    [18_000, 0],
    [30_000, 21],
    [50_000, 32],
    [100_000, 32],
    [140_000, 39],
    [200_000, 47],
  ])('salary %i -> marginal %.0f%%', (salary, expected) => {
    const v = inputs({ salary });
    expect(marginalTaxRatePct(v, AUTO)).toBeCloseTo(expected, 6);
  });

  it('uses the manual rate when tax mode is manual', () => {
    const v = inputs({ salary: 200_000, manualTaxRatePct: 30 });
    expect(marginalTaxRatePct(v, 'manual')).toBe(30);
  });
});

describe('model B — expected values', () => {
  it('with no X-risk, EV_super > EV_outside for a high-bracket taxpayer', () => {
    const v = inputs({ xRiskPct: 0, salary: 140_000 }); // t_m = 39%
    const r = calculateModelB(v, AUTO);
    if (!r.ok) throw new Error('expected ok');
    expect(r.evSuper).toBeGreaterThan(r.evOutside);
  });

  it('EV is monotonic decreasing in X-risk for both paths', () => {
    for (const p of [0, 0.02, 0.05, 0.08, 0.12]) {
      const a = calculateModelB(inputs({ xRiskPct: 0 }), AUTO);
      const b = calculateModelB(inputs({ xRiskPct: p * 100 }), AUTO);
      if (!a.ok || !b.ok) throw new Error('expected ok');
      expect(b.evSuper).toBeLessThanOrEqual(a.evSuper);
      expect(b.evOutside).toBeLessThanOrEqual(a.evOutside);
    }
  });

  it('at very high X-risk, outside money has higher expected value', () => {
    const r = calculateModelB(inputs({ xRiskPct: 15 }), AUTO);
    if (!r.ok) throw new Error('expected ok');
    expect(r.evOutside).toBeGreaterThan(r.evSuper);
    expect(r.superWins).toBe(false);
  });

  it('reports a crossover somewhere between 3% and 10% for the default scenario', () => {
    const r = calculateModelB(inputs(), AUTO);
    if (!r.ok) throw new Error('expected ok');
    expect(r.crossoverXRiskPct).not.toBeNull();
    expect(r.crossoverXRiskPct!).toBeGreaterThan(3);
    expect(r.crossoverXRiskPct!).toBeLessThan(10);
  });

  it('EV curves actually cross at the reported p*', () => {
    const v = inputs();
    const r = calculateModelB(v, AUTO);
    if (!r.ok) throw new Error('expected ok');
    const pStar = r.crossoverXRiskPct! / 100;
    const n = v.retirementAge - v.age;
    const a = evSuperAt(pStar, n, v.concessionalTaxPct, r.netReturnSuperPct / 100);
    const b = evOutsideAt(pStar, n, r.marginalTaxRatePct, r.netReturnOutsidePct / 100, v.liquidityValuePct);
    expect(Math.abs(a - b)).toBeLessThan(1e-6);
  });
});

describe('model B — recommendation', () => {
  it('below crossover: recommend the full cap room above the SG', () => {
    const r = calculateModelB(inputs({ xRiskPct: 0.5, salary: 140_000 }), AUTO);
    if (!r.ok) throw new Error('expected ok');
    // SG = 11.5% of 140k = 16.1k -> cap room 30k - 16.1k
    expect(r.sgPerYear).toBeCloseTo(16_100, 2);
    expect(r.capRoomPerYear).toBeCloseTo(13_900, 2);
    expect(r.superWins).toBe(true);
    expect(r.recommendedExtraPerYear).toBeCloseTo(13_900, 2);
    expect(r.recommendedExtraPctSalary).toBeCloseTo(13_900 / 140_000, 9);
  });

  it('above crossover: recommend nothing', () => {
    const r = calculateModelB(inputs({ xRiskPct: 20, salary: 140_000 }), AUTO);
    if (!r.ok) throw new Error('expected ok');
    expect(r.superWins).toBe(false);
    expect(r.recommendedExtraPerYear).toBe(0);
  });

  it('when the SG alone fills the cap there is no room to add', () => {
    const r = calculateModelB(inputs({ salary: 400_000 }), AUTO); // SG = 46k > 30k cap
    if (!r.ok) throw new Error('expected ok');
    expect(r.capFullyUsed).toBe(true);
    expect(r.capRoomPerYear).toBe(0);
    expect(r.recommendedExtraPerYear).toBe(0);
  });

  it('low marginal rate (~15%) => never worth sacrificing extra', () => {
    const r = calculateModelB(inputs({ manualTaxRatePct: 15 }), 'manual');
    if (!r.ok) throw new Error('expected ok');
    expect(r.crossoverXRiskPct).toBe(0);
    expect(r.recommendedExtraPerYear).toBe(0);
  });

  it('errors when the access age is not in the future', () => {
    const r = calculateModelB(inputs({ age: 65, retirementAge: 60 }), AUTO);
    expect(r.ok).toBe(false);
  });

  it('zero salary => cannot sacrifice', () => {
    const r = calculateModelB(inputs({ salary: 0 }), AUTO);
    if (!r.ok) throw new Error('expected ok');
    expect(r.recommendedExtraPerYear).toBe(0);
  });
});
