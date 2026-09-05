import { useStore } from '../state/store';
import { NUMERIC_FIELDS, GROUP_LABELS, type FieldGroup } from '../fields';
import { NumberField } from './NumberField';

const SECTIONS: FieldGroup[] = ['you', 'risk', 'money'];

export function InputPanel() {
  const values = useStore((s) => s.values);
  const taxMode = useStore((s) => s.taxMode);
  const setValue = useStore((s) => s.setValue);
  const setTaxMode = useStore((s) => s.setTaxMode);

  const field = (key: string) => {
    const meta = NUMERIC_FIELDS.find((f) => f.key === key)!;
    return (
      <NumberField
        key={key}
        meta={meta}
        value={values[meta.key]}
        onChange={(v) => setValue(meta.key, v)}
      />
    );
  };

  return (
    <div className="stack">
      <section className="panel">
        <h2 className="panel-title">Your details</h2>
        <div className="fields">
          {field('age')}
          {field('retirementAge')}
          {field('salary')}
        </div>

        <div className="field">
          <span className="field-label">Marginal tax rate</span>
          <div className="segmented" role="group" aria-label="Marginal tax rate">
            <button
              type="button"
              className={taxMode === 'auto' ? 'segmented-btn active' : 'segmented-btn'}
              onClick={() => setTaxMode('auto')}
            >
              Auto from salary
            </button>
            <button
              type="button"
              className={taxMode === 'manual' ? 'segmented-btn active' : 'segmented-btn'}
              onClick={() => setTaxMode('manual')}
            >
              Manual
            </button>
          </div>
          <span className="field-help">
            Auto uses your marginal rate on salary (FY2024-25 brackets + 2% Medicare, simplified).
            Manual overrides it — useful if offsets, salary packaging or asset income change your rate.
          </span>
        </div>
        {taxMode === 'manual' && field('manualTaxRatePct')}
      </section>

      {SECTIONS.slice(1).map((group) => (
        <section className="panel" key={group}>
          <h2 className="panel-title">{GROUP_LABELS[group]}</h2>
          <div className="fields">
            {NUMERIC_FIELDS.filter((f) => f.group === group).map((f) => field(f.key))}
          </div>
          {group === 'money' && (
            <p className="panel-note">
              Collected for future models — the marginal per-dollar comparison in Model B doesn&apos;t
              depend on balances or home equity.
            </p>
          )}
        </section>
      ))}

      <details className="panel">
        <summary className="panel-title summary-title">Model parameters</summary>
        <div className="fields">
          {NUMERIC_FIELDS.filter((f) => f.group === 'advanced').map((f) => field(f.key))}
        </div>
      </details>
    </div>
  );
}
