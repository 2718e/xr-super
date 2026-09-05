import { useMemo } from 'react';
import { useStore } from '../state/store';
import { getEngine } from '../calc';
import { fmtMoney, fmtMoney2, fmtPctNumber } from '../lib/format';

export function ResultsPanel() {
  const values = useStore((s) => s.values);
  const taxMode = useStore((s) => s.taxMode);

  const result = useMemo(() => getEngine('b').calculate(values, taxMode), [values, taxMode]);

  if (!result.ok) {
    return (
      <section className="panel panel--alert">
        <h2 className="panel-title">Result</h2>
        <p>{result.message}</p>
      </section>
    );
  }

  const r = result;
  const pct = (n: number) => `${(n * 100).toFixed(1)}%`;
  const crossover =
    r.crossoverXRiskPct === null ? null : fmtPctNumber(r.crossoverXRiskPct, 2) + '/yr';
  const edge = r.evSuper - r.evOutside;

  return (
    <div className="stack">
      <section
        className={`banner ${r.superWins ? 'banner--yes' : 'banner--no'}`}
        role="status"
      >
        <span className="banner-title">
          {r.recommendedExtraPerYear > 0
            ? 'Put extra into super'
            : r.superWins
              ? 'Super wins on expected value — but no room to add'
              : 'Keep surplus outside super'}
        </span>
        <span className="banner-sub">
          {r.recommendedExtraPerYear > 0
            ? `Salary-sacrifice up to ${fmtMoney(r.recommendedExtraPerYear)}/yr (${pct(r.recommendedExtraPctSalary)} of salary) above the SG.`
            : r.superWins
              ? 'You are already contributing the maximum concessional amount.'
              : `At your X-risk, an outside dollar is worth more than one locked in super (EV edge ${fmtMoney2(Math.abs(edge))} per pre-tax $1).`}
        </span>
      </section>

      <div className="kpi-grid">
        <div className="kpi">
          <span className="kpi-label">Crossover X-risk</span>
          <span className="kpi-value">{crossover ?? 'never'}</span>
          <span className="kpi-sub">
            {r.crossoverXRiskPct === null
              ? 'Super keeps its edge across the whole X-risk range'
              : r.crossoverXRiskPct === 0
                ? 'Super never beats outside money — even with zero X-risk'
                : 'Above this annual X-risk, extra super stops paying'}
          </span>
        </div>

        <div className="kpi">
          <span className="kpi-label">Recommended extra (above SG)</span>
          <span className="kpi-value">
            {r.recommendedExtraPerYear > 0 ? fmtMoney(r.recommendedExtraPerYear) : '$0'}
            {r.recommendedExtraPerYear > 0 && <span className="kpi-unit">/yr</span>}
          </span>
          <span className="kpi-sub">
            {pct(r.recommendedExtraPctSalary)} of salary — limited by the {fmtMoney(r.capRoomPerYear)}/yr
            cap room left after the SG ({fmtMoney(r.sgPerYear)}/yr)
          </span>
        </div>

        <div className="kpi">
          <span className="kpi-label">EV per pre-tax $1</span>
          <span className="kpi-value">
            {fmtMoney2(r.evSuper)} <span className="kpi-vs">vs</span> {fmtMoney2(r.evOutside)}
          </span>
          <span className="kpi-sub">
            super vs outside, at your X-risk. Super edge {fmtMoney2(edge)} per dollar; with zero
            X-risk it would be {fmtMoney2(r.evSuperNoRisk - r.evOutsideNoRisk)}
          </span>
        </div>
      </div>

      <section className="panel">
        <h2 className="panel-title">Scenario facts</h2>
        <dl className="facts">
          <div><dt>Years money would be locked</dt><dd>{r.yearsToRetirement}</dd></div>
          <div><dt>Chance the world makes it to retirement</dt><dd>{pct(r.survivalToRetirement)}</dd></div>
          <div><dt>Marginal tax rate</dt><dd>{fmtPctNumber(r.marginalTaxRatePct, 1)}</dd></div>
          <div><dt>Net real return inside super</dt><dd>{fmtPctNumber(r.netReturnSuperPct, 2)}/yr</dd></div>
          <div><dt>Net real return outside super</dt><dd>{fmtPctNumber(r.netReturnOutsidePct, 2)}/yr</dd></div>
          <div><dt>Super Guarantee contribution</dt><dd>{fmtMoney(r.sgPerYear)}/yr</dd></div>
          <div><dt>Concessional cap room</dt><dd>{fmtMoney(r.capRoomPerYear)}/yr</dd></div>
        </dl>
        {r.notes.length > 0 && (
          <ul className="notes">
            {r.notes.map((n, i) => (
              <li key={i}>{n}</li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
