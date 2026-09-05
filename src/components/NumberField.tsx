import { useEffect, useState } from 'react';
import type { NumericFieldMeta } from '../fields';
import { clamp } from '../lib/format';

function toText(v: number): string {
  return String(Math.round(v * 1_000_000) / 1_000_000);
}

interface Props {
  meta: NumericFieldMeta;
  value: number;
  disabled?: boolean;
  onChange: (v: number) => void;
}

/**
 * Labeled numeric input. Keeps a local text buffer so intermediate edits
 * (e.g. an empty field, or "1e") don't fight the store, and commits each
 * valid parse (clamped to the field's [min, max]).
 */
export function NumberField({ meta, value, disabled, onChange }: Props) {
  const [text, setText] = useState(() => toText(value));

  useEffect(() => {
    setText((prev) => {
      const cur = parseFloat(prev);
      return Number.isFinite(cur) && cur === value ? prev : toText(value);
    });
  }, [value]);

  const commit = (raw: string) => {
    const parsed = parseFloat(raw);
    if (!Number.isFinite(parsed)) {
      setText(toText(value));
      return;
    }
    onChange(clamp(parsed, meta.min, meta.max));
  };

  return (
    <label className={`field${disabled ? ' field--disabled' : ''}`}>
      <span className="field-label-row">
        <span className="field-label">{meta.label}</span>
        {meta.unusedInModelB && <span className="tag tag--muted">context</span>}
      </span>
      <span className="field-row">
        <input
          type="text"
          inputMode="decimal"
          value={text}
          disabled={disabled}
          onChange={(e) => {
            const t = e.target.value;
            setText(t);
            const parsed = parseFloat(t);
            if (Number.isFinite(parsed)) onChange(clamp(parsed, meta.min, meta.max));
          }}
          onBlur={() => commit(text)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
          }}
          aria-label={meta.label}
        />
        {meta.unit && <span className="unit">{meta.unit}</span>}
      </span>
      {meta.help && <span className="field-help">{meta.help}</span>}
    </label>
  );
}
