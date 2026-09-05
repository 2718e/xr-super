import { useEffect, useMemo, useState } from 'react';
import { useStore } from '../state/store';
import { NUMERIC_FIELDS, FIELD_BY_KEY, GROUP_LABELS, type FieldGroup } from '../fields';
import { MAX_SWEEP_POINTS } from '../calc/sweep';
import { clamp } from '../lib/format';

const GROUP_ORDER: FieldGroup[] = ['you', 'risk', 'money', 'advanced'];

/** Compact inline numeric input for the sweep range controls. */
function InlineNum({
  label,
  value,
  onChange,
  min,
  max,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
}) {
  const [text, setText] = useState(() => String(value));
  useEffect(() => {
    setText((prev) => {
      const cur = parseFloat(prev);
      return Number.isFinite(cur) && cur === value ? prev : String(value);
    });
  }, [value]);
  return (
    <label className="sweep-range-field">
      <span>{label}</span>
      <input
        type="text"
        inputMode="decimal"
        value={text}
        onChange={(e) => {
          const t = e.target.value;
          setText(t);
          const parsed = parseFloat(t);
          if (Number.isFinite(parsed)) onChange(clamp(parsed, min, max));
        }}
        onBlur={() => {
          const parsed = parseFloat(text);
          if (!Number.isFinite(parsed)) setText(String(value));
          else onChange(clamp(parsed, min, max));
        }}
        aria-label={label}
      />
    </label>
  );
}

export function SweepPanel() {
  const sweepEnabled = useStore((s) => s.sweepEnabled);
  const sweepKey = useStore((s) => s.sweepKey);
  const sweepMin = useStore((s) => s.sweepMin);
  const sweepMax = useStore((s) => s.sweepMax);
  const sweepStep = useStore((s) => s.sweepStep);
  const setSweepEnabled = useStore((s) => s.setSweepEnabled);
  const setSweepKey = useStore((s) => s.setSweepKey);
  const setSweepRange = useStore((s) => s.setSweepRange);

  const meta = FIELD_BY_KEY.get(sweepKey);

  const rangeValid = Number.isFinite(sweepMin) && Number.isFinite(sweepMax) && sweepMax > sweepMin && sweepStep > 0;
  const estimate = useMemo(() => {
    if (!rangeValid) return 0;
    return Math.min(Math.floor((sweepMax - sweepMin) / sweepStep) + 1, MAX_SWEEP_POINTS);
  }, [rangeValid, sweepMax, sweepMin, sweepStep]);

  return (
    <section className="panel">
      <h2 className="panel-title">Sweep (graph)</h2>
      <label className="checkbox-row">
        <input
          type="checkbox"
          checked={sweepEnabled}
          onChange={(e) => setSweepEnabled(e.target.checked)}
        />
        <span>Chart outputs across a range of one variable</span>
      </label>

      {sweepEnabled && (
        <div className="stack-sm">
          <label className="field">
            <span className="field-label">Variable on the x-axis</span>
            <select
              value={sweepKey}
              onChange={(e) => setSweepKey(e.target.value as never)}
              aria-label="Sweep variable"
            >
              {GROUP_ORDER.map((group) => (
                <optgroup key={group} label={GROUP_LABELS[group]}>
                  {NUMERIC_FIELDS.filter((f) => f.group === group).map((f) => (
                    <option key={f.key} value={f.key}>
                      {f.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </label>

          <div className="sweep-range">
            <InlineNum label="Min" value={sweepMin} onChange={(v) => setSweepRange(v, sweepMax, sweepStep)} min={-1e12} max={1e12} />
            <InlineNum label="Max" value={sweepMax} onChange={(v) => setSweepRange(sweepMin, v, sweepStep)} min={-1e12} max={1e12} />
            <InlineNum label="Step" value={sweepStep} onChange={(v) => setSweepRange(sweepMin, sweepMax, v)} min={0.000001} max={1e12} />
          </div>

          <p className="panel-note">
            {rangeValid
              ? `≈ ${estimate} point${estimate === 1 ? '' : 's'}${estimate >= MAX_SWEEP_POINTS ? ' (step auto-widened above this)' : ''}`
              : 'Range invalid — set max above min and step above 0.'}
          </p>
          {meta && (
            <p className="panel-note">
              x-axis: {meta.label}
              {meta.unit ? ` (${meta.unit})` : ''}. All other values stay at their entered level.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
