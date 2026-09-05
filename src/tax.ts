/**
 * Australian personal income tax (FY2024-25), resident rates, simplified.
 *
 * Rates: 0% / 19% / 30% / 37% / 45% plus the 2% Medicare levy once income
 * exceeds roughly the Medicare low-income threshold. Low-income offsets and
 * phase-outs are ignored — this only needs the *marginal* rate at salary.
 */
export interface TaxBracket {
  from: number; // first dollar of taxable income in this bracket (inclusive)
  marginal: number; // marginal tax rate on dollars in this bracket (excl. Medicare)
}

export const TAX_BRACKETS: TaxBracket[] = [
  { from: 0, marginal: 0 },
  { from: 18_201, marginal: 0.19 },
  { from: 45_001, marginal: 0.3 },
  { from: 135_001, marginal: 0.37 },
  { from: 190_001, marginal: 0.45 },
];

export const MEDICARE_LEVY = 0.02;
const MEDICARE_LOW_INCOME_THRESHOLD = 24_276;

/** Marginal (base, pre-Medicare) rate on an extra dollar of income. */
export function baseMarginalRate(income: number): number {
  let rate = 0;
  for (const b of TAX_BRACKETS) {
    if (income >= b.from) rate = b.marginal;
  }
  return rate;
}

/** Marginal rate including the Medicare levy. */
export function marginalTaxRateIncludingMedicare(income: number): number {
  if (income <= 0) return 0;
  const medicare = income > MEDICARE_LOW_INCOME_THRESHOLD ? MEDICARE_LEVY : 0;
  return baseMarginalRate(income) + medicare;
}
