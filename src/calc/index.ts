import { calculateModelB } from './engineB';
import type { EngineBOutput, NumericValues, TaxMode } from './engineB';

/**
 * Engine registry.
 *
 * Calculation methods are decoupled from the interface: each engine is a pure
 * function over the shared numeric `values` + tax mode, and its output feeds
 * the generic results/chart components via a small common shape. To add Model
 * A (lifetime expected-spending simulation) later, drop in a new file here and
 * register it — the UI will pick it up from the engine selector.
 */
export interface EngineDef {
  id: string;
  name: string;
  summary: string;
  calculate: (values: NumericValues, taxMode: TaxMode) => EngineOutput;
}

export type EngineOutput = EngineBOutput;

const ENGINES: Record<string, EngineDef> = {
  b: {
    id: 'b',
    name: 'Model B — risk-adjusted EV arbitrage',
    summary:
      'Per-dollar expected value of super vs outside money, weighted by survival to retirement age.',
    calculate: (values, taxMode) => calculateModelB(values, taxMode),
  },
};

export function getEngine(id: string): EngineDef {
  return ENGINES[id] ?? ENGINES.b;
}

export function listEngines(): EngineDef[] {
  return Object.values(ENGINES);
}
