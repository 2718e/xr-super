import { describe, expect, it } from 'vitest';
import { baseMarginalRate, marginalTaxRateIncludingMedicare } from './tax';

describe('base marginal tax rates (FY2024-25)', () => {
  it.each([
    [0, 0],
    [18_200, 0],
    [18_201, 0.19],
    [45_000, 0.19],
    [45_001, 0.3],
    [135_000, 0.3],
    [135_001, 0.37],
    [190_001, 0.45],
  ])('income %i -> base %.2f', (income, expected) => {
    expect(baseMarginalRate(income)).toBeCloseTo(expected, 9);
  });
});

describe('marginal rate including Medicare', () => {
  it('adds 2% Medicare above the low-income threshold', () => {
    expect(marginalTaxRateIncludingMedicare(20_000)).toBeCloseTo(0.19, 9);
    expect(marginalTaxRateIncludingMedicare(50_000)).toBeCloseTo(0.32, 9);
  });

  it('is 0 for non-positive income', () => {
    expect(marginalTaxRateIncludingMedicare(0)).toBe(0);
  });
});
