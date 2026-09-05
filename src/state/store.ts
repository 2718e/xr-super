import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  DEFAULT_VALUES,
  DEFAULT_SWEEP_KEY,
  FIELD_BY_KEY,
  type NumericKey,
} from '../fields';
import type { TaxMode } from '../calc/engineB';

/**
 * Single source of truth for all editable state, persisted to localStorage.
 *
 * Values are kept as a flat numeric map keyed by the field registry so the UI
 * and engines stay generic. Deliberately contains no formatting or calculation
 * logic — components derive those via pure functions / useMemo.
 */
interface XrState {
  values: Record<NumericKey, number>;
  taxMode: TaxMode;
  sweepEnabled: boolean;
  sweepKey: NumericKey;
  sweepMin: number;
  sweepMax: number;
  sweepStep: number;

  setValue: (key: NumericKey, value: number) => void;
  setTaxMode: (mode: TaxMode) => void;
  setSweepEnabled: (enabled: boolean) => void;
  setSweepKey: (key: NumericKey) => void;
  setSweepRange: (min: number, max: number, step: number) => void;
  reset: () => void;
}

function initialSweep(key: NumericKey) {
  const meta = FIELD_BY_KEY.get(key);
  return {
    sweepKey: key,
    sweepMin: meta?.min ?? 0,
    sweepMax: meta?.max ?? 1,
    sweepStep: meta?.step ?? 0.5,
  };
}

function makeInitialState() {
  return {
    values: { ...DEFAULT_VALUES },
    taxMode: 'auto' as TaxMode,
    sweepEnabled: true,
    ...initialSweep(DEFAULT_SWEEP_KEY),
  };
}

const persistConfig = {
  name: 'xr-super-state-v1',
  version: 1,
  partialize: (s: XrState) => ({
    values: s.values,
    taxMode: s.taxMode,
    sweepEnabled: s.sweepEnabled,
    sweepKey: s.sweepKey,
    sweepMin: s.sweepMin,
    sweepMax: s.sweepMax,
    sweepStep: s.sweepStep,
  }),
  // Deep-merge values so fields added in later versions still get defaults.
  merge: (persisted: unknown, current: XrState): XrState => {
    const p = (persisted ?? {}) as Partial<XrState>;
    return {
      ...current,
      ...p,
      values: { ...current.values, ...(p.values ?? {}) },
    };
  },
};

export const useStore = create<XrState>()(
  persist(
    (set) => ({
      ...makeInitialState(),

      setValue: (key, value) =>
        set((s) => ({ values: { ...s.values, [key]: value } })),

      setTaxMode: (taxMode) => set({ taxMode }),

      setSweepEnabled: (sweepEnabled) => set({ sweepEnabled }),

      setSweepKey: (sweepKey) => set({ ...initialSweep(sweepKey) }),

      setSweepRange: (sweepMin, sweepMax, sweepStep) =>
        set({ sweepMin, sweepMax, sweepStep }),

      reset: () => set(makeInitialState()),
    }),
    persistConfig,
  ),
);
