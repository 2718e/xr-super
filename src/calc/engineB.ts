import type { NumericKey } from '../fields';
import { marginalTaxRateIncludingMedicare } from '../tax';

export type NumericValues = Record<NumericKey, number>;
export type TaxMode = 'auto' | 'manual';

/**
 * Model B — "risk-adjusted expected-value arbitrage".
 *
 * Compares what happens to one extra pre-tax dollar of salary: salary-sacrifice
 * it into super (taxed at the concessional rate, locked away until retirement
 * age R) versus keeping it outside super (taxed at your marginal rate, but
 * liquid). Both are invested until R; dollars in super only have value if the
 * world survives to R, so they are weighted by survival probability (1-p)^n.
 *
 * Result: the crossover X-risk p* above which keeping money outside super has
 * higher expected value than salary-sacrificing. Below p* the rational move is
 * to sacrifice as much as the concessional cap allows (after the SG).
 *
 * Caveats (documented in the UI): concessional contributions only; real
 * returns; no personal mortality; outside "drag factor" crudely approximates
 * dividend tax + discounted/deferred CGT; existing balances and home equity
 * do not affect the marginal-dollar comparison.
 */
export interface EngineBResult {
  ok: true;
  engine: 'b';
  // scenario
  yearsToRetirement: number;
  survivalToRetirement: number; // s, at the entered X-risk
  marginalTaxRatePct: number; // t_m * 100
  netReturnSuperPct: number; // g_s * 100
  netReturnOutsidePct: number; // g_o * 100
  // super mechanics
  sgPerYear: number;
  sgPctSalary: number; // as a proportion of salary
  capRoomPerYear: number;
  capFullyUsed: boolean; // SG alone already exhausts the cap
  // expected value per $1 of pre-tax salary (expected $ available, at age R)
  evSuper: number;
  evOutside: number;
  evSuperNoRisk: number; // same but with p = 0
  evOutsideNoRisk: number;
  evDifference: number; // evSuper - evOutside at entered p
  // decision
  crossoverXRiskPct: number | null; // p* ; null when super never wins
  superWins: boolean; // EV_super >= EV_outside at the entered X-risk
  recommendedExtraPerYear: number; // salary sacrifice above the SG, $/yr
  recommendedExtraPctSalary: number; // as a proportion of salary (0 if salary 0)
  notes: string[];
}

export interface EngineError {
  ok: false;
  engine: 'b';
  message: string;
}

export type EngineBOutput = EngineBResult | EngineError;

export function marginalTaxRatePct(values: NumericValues, taxMode: TaxMode): number {
  return taxMode === 'manual' ? values.manualTaxRatePct : marginalTaxRateIncludingMedicare(values.salary) * 100;
}

/** Expected value per pre-tax $1 if salary-sacrificed, at annual X-risk p (0..1). */
export function evSuperAt(
  p: number,
  n: number,
  concessionalTaxPct: number,
  gSuper: number,
): number {
  const s = Math.pow(1 - p, n);
  const factor = (1 - concessionalTaxPct / 100) * Math.pow(1 + gSuper, n);
  return s * factor;
}

/** Expected value per pre-tax $1 if kept outside super, at annual X-risk p (0..1). */
export function evOutsideAt(
  p: number,
  n: number,
  marginalTaxRatePct: number,
  gOutside: number,
  liquidityValuePct: number,
): number {
  const s = Math.pow(1 - p, n);
  const tm = marginalTaxRatePct / 100;
  const w = liquidityValuePct / 100;
  const kept = 1 - tm;
  // If the world survives to R the money is invested; if not it retains
  // partial "liquidity value" (you could have spent it along the way).
  return kept * (s * Math.pow(1 + gOutside, n) + (1 - s) * w);
}

/** Bisection over p in [0, ~1) for the crossover EV_super == EV_outside. */
function findCrossoverP(
  n: number,
  concessionalTaxPct: number,
  gSuper: number,
  marginalTaxRatePct: number,
  gOutside: number,
  liquidityValuePct: number,
): number | null {
  const f = (p: number) =>
    evSuperAt(p, n, concessionalTaxPct, gSuper) -
    evOutsideAt(p, n, marginalTaxRatePct, gOutside, liquidityValuePct);

  const f0 = f(0);
  if (f0 <= 0) return 0; // super never ahead, even with no X-risk
  if (f(0.9999) >= 0) return null; // super ahead across the whole range

  let lo = 0;
  let hi = 0.9999;
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2;
    if (f(mid) > 0) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

export function calculateModelB(values: NumericValues, taxMode: TaxMode): EngineBOutput {
  const n = values.retirementAge - values.age;
  if (n <= 0) {
    return {
      ok: false,
      engine: 'b',
      message: 'Access age must be later than your current age for this model to apply.',
    };
  }

  const p = values.xRiskPct / 100;
  const tmPct = marginalTaxRatePct(values, taxMode);
  const tm = tmPct / 100;

  const r = values.grossRealReturnPct / 100;
  const gSuper = r * (1 - values.superEarningsTaxPct / 100);
  const gOutside = Math.max(0, r * (1 - values.outsideDragFactor * tm));

  const sgPerYear = values.salary * (values.sgRatePct / 100);
  const capRoomPerYear = Math.max(0, values.concessionalCap - sgPerYear);
  const capFullyUsed = values.salary > 0 && capRoomPerYear <= 0;

  const survival = Math.pow(1 - p, n);
  const evSuper = evSuperAt(p, n, values.concessionalTaxPct, gSuper);
  const evOutside = evOutsideAt(p, n, tmPct, gOutside, values.liquidityValuePct);
  const evSuperNoRisk = evSuperAt(0, n, values.concessionalTaxPct, gSuper);
  const evOutsideNoRisk = evOutsideAt(0, n, tmPct, gOutside, values.liquidityValuePct);

  const crossoverP = findCrossoverP(
    n,
    values.concessionalTaxPct,
    gSuper,
    tmPct,
    gOutside,
    values.liquidityValuePct,
  );

  const superWins = evSuper >= evOutside;
  const canSacrifice = values.salary > 0 && !capFullyUsed;
  const recommendedExtraPerYear =
    superWins && crossoverP !== null && p < crossoverP && canSacrifice ? capRoomPerYear : 0;
  const recommendedExtraPctSalary =
    values.salary > 0 ? recommendedExtraPerYear / values.salary : 0;

  const notes: string[] = [];
  if (!canSacrifice) {
    notes.push(
      capFullyUsed
        ? 'The Super Guarantee alone already exhausts the concessional cap — there is no room for extra salary sacrifice.'
        : 'There is no salary to salary-sacrifice from.',
    );
  }
  if (tmPct <= values.concessionalTaxPct && crossoverP === 0) {
    notes.push('Your marginal tax rate is at or below the 15% super contribution tax, so extra super offers little tax arbitrage.');
  }

  return {
    ok: true,
    engine: 'b',
    yearsToRetirement: n,
    survivalToRetirement: survival,
    marginalTaxRatePct: tmPct,
    netReturnSuperPct: gSuper * 100,
    netReturnOutsidePct: gOutside * 100,
    sgPerYear,
    sgPctSalary: values.sgRatePct / 100,
    capRoomPerYear,
    capFullyUsed,
    evSuper,
    evOutside,
    evSuperNoRisk,
    evOutsideNoRisk,
    evDifference: evSuper - evOutside,
    crossoverXRiskPct: crossoverP === null ? null : crossoverP * 100,
    superWins,
    recommendedExtraPerYear,
    recommendedExtraPctSalary,
    notes,
  };
}
