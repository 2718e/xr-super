/**
 * Central registry of every numeric input and model parameter.
 *
 * The UI (inputs, sweep dropdown), state persistence, and the calculation
 * engines all derive from this single list, so adding a new variable is one
 * entry here plus (optionally) wiring it into an engine.
 */
export type FieldGroup = 'you' | 'risk' | 'money' | 'advanced';

export interface NumericFieldMeta {
  /** stable key used in the state store and by engines */
  key: string;
  label: string;
  group: FieldGroup;
  /** display unit, e.g. "yrs", "%/yr", "$/yr" */
  unit: string;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  help?: string;
  /** shown in the UI but not used by Model B yet (reserved for future models) */
  unusedInModelB?: boolean;
}

export const NUMERIC_FIELDS: NumericFieldMeta[] = [
  // ---- You -------------------------------------------------------------
  {
    key: 'age',
    label: 'Current age',
    group: 'you',
    unit: 'yrs',
    min: 15,
    max: 90,
    step: 1,
    defaultValue: 35,
  },
  {
    key: 'retirementAge',
    label: 'Age you can access super',
    group: 'you',
    unit: 'yrs',
    min: 40,
    max: 80,
    step: 1,
    defaultValue: 60,
    help: 'Australian preservation age — earliest you can draw super tax-free',
  },
  {
    key: 'salary',
    label: 'Current salary (pre-tax)',
    group: 'you',
    unit: '$/yr',
    min: 0,
    max: 5_000_000,
    step: 1_000,
    defaultValue: 140_000,
  },
  // ---- Risk ------------------------------------------------------------
  {
    key: 'xRiskPct',
    label: 'X-risk',
    group: 'risk',
    unit: '%/yr',
    min: 0,
    max: 20,
    step: 0.25,
    defaultValue: 0.5,
    help: 'Annual probability you never get to enjoy retirement savings (world ends / catastrophe)',
  },
  // ---- Money ------------------------------------------------------------
  {
    key: 'savings',
    label: 'Cash / offset savings',
    group: 'money',
    unit: '$',
    min: 0,
    max: 50_000_000,
    step: 1_000,
    defaultValue: 20_000,
    unusedInModelB: true,
  },
  {
    key: 'sharesOutsideSuper',
    label: 'Shares outside super',
    group: 'money',
    unit: '$',
    min: 0,
    max: 50_000_000,
    step: 1_000,
    defaultValue: 50_000,
    help: 'Assumed to be an internally diversified indexed ETF',
    unusedInModelB: true,
  },
  {
    key: 'homeEquity',
    label: 'Home equity',
    group: 'money',
    unit: '$',
    min: 0,
    max: 50_000_000,
    step: 1_000,
    defaultValue: 350_000,
    unusedInModelB: true,
  },
  {
    key: 'superBalance',
    label: 'Current super balance',
    group: 'money',
    unit: '$',
    min: 0,
    max: 50_000_000,
    step: 1_000,
    defaultValue: 120_000,
    unusedInModelB: true,
  },
  // ---- Advanced model parameters ----------------------------------------
  {
    key: 'sgRatePct',
    label: 'Super Guarantee rate',
    group: 'advanced',
    unit: '%',
    min: 0,
    max: 30,
    step: 0.25,
    defaultValue: 11.5,
    help: 'Compulsory employer contribution as % of salary (2024-25: 11.5%, rising to 12%)',
  },
  {
    key: 'concessionalCap',
    label: 'Concessional contributions cap',
    group: 'advanced',
    unit: '$/yr',
    min: 0,
    max: 200_000,
    step: 1_000,
    defaultValue: 30_000,
    help: 'Annual cap on pre-tax contributions, incl. the SG (2024-25)',
  },
  {
    key: 'concessionalTaxPct',
    label: 'Contribution tax (super)',
    group: 'advanced',
    unit: '%',
    min: 0,
    max: 49,
    step: 0.5,
    defaultValue: 15,
    help: 'Tax on concessional (salary-sacrificed) contributions inside super',
  },
  {
    key: 'grossRealReturnPct',
    label: 'Gross real return',
    group: 'advanced',
    unit: '%',
    min: 0,
    max: 12,
    step: 0.25,
    defaultValue: 6.5,
    help: 'Assumed pre-tax real return of a diversified portfolio, inside and outside super',
  },
  {
    key: 'superEarningsTaxPct',
    label: 'Earnings tax (super)',
    group: 'advanced',
    unit: '%',
    min: 0,
    max: 49,
    step: 0.5,
    defaultValue: 15,
    help: 'Ongoing tax on investment earnings inside super',
  },
  {
    key: 'outsideDragFactor',
    label: 'Outside taxable-drag factor',
    group: 'advanced',
    unit: '',
    min: 0,
    max: 1,
    step: 0.05,
    defaultValue: 0.5,
    help: 'Fraction of outside returns effectively taxed at your marginal rate each year (crude approximation of dividends plus discounted, deferred capital gains)',
  },
  {
    key: 'liquidityValuePct',
    label: 'Liquidity value if no retirement',
    group: 'advanced',
    unit: '%',
    min: 1,
    max: 100,
    step: 5,
    defaultValue: 50,
    help: 'If the world ends before retirement, each liquid dollar outside super retains this % of value — super retains 0%',
  },
  {
    key: 'manualTaxRatePct',
    label: 'Manual marginal tax rate',
    group: 'advanced',
    unit: '%',
    min: 0,
    max: 60,
    step: 0.5,
    defaultValue: 39,
    help: 'Marginal rate incl. Medicare levy, used when tax mode is Manual',
  },
];

export type NumericKey = (typeof NUMERIC_FIELDS)[number]['key'];

export const DEFAULT_VALUES: Record<NumericKey, number> = Object.fromEntries(
  NUMERIC_FIELDS.map((f) => [f.key, f.defaultValue]),
) as Record<NumericKey, number>;

export const FIELD_BY_KEY: ReadonlyMap<NumericKey, NumericFieldMeta> = new Map(
  NUMERIC_FIELDS.map((f) => [f.key, f]),
);

export const DEFAULT_SWEEP_KEY: NumericKey = 'xRiskPct';

export const GROUP_LABELS: Record<FieldGroup, string> = {
  you: 'You',
  risk: 'Risk',
  money: 'Money (context)',
  advanced: 'Model parameters',
};
