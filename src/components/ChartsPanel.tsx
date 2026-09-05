import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useStore } from '../state/store';
import { runSweep } from '../calc/sweep';
import { getEngine } from '../calc';
import { fmtAxisValue, fmtMoney2, fmtMoneyCompact } from '../lib/format';

const SUPER_COLOR = '#0e7490';
const OUTSIDE_COLOR = '#ea580c';
const REC_COLOR = '#4f46e5';
const REF_COLOR = '#94a3b8';
const CROSSOVER_COLOR = '#c2410c';

interface TipProps {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number | string; color?: string; dataKey?: string | number }>;
  label?: number | string;
  metaLabel: string;
  unit: string;
  valueFormat: (key: string | number | undefined, v: number) => string;
}

function ChartTip({ active, payload, label, metaLabel, unit, valueFormat }: TipProps) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="chart-tip">
      <div className="chart-tip-label">
        {metaLabel}: {fmtAxisValue(Number(label), unit)}
      </div>
      {payload.map((p) => (
        <div key={String(p.dataKey)} className="chart-tip-row">
          <span className="chart-tip-swatch" style={{ background: p.color }} />
          <span>{p.name}</span>
          <span className="chart-tip-value">{valueFormat(p.dataKey, Number(p.value))}</span>
        </div>
      ))}
    </div>
  );
}

function Swatch({ color }: { color: string }) {
  return <span className="chart-tip-swatch" style={{ background: color }} />;
}

function ChartCard({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <section className="panel chart-card">
      <h2 className="panel-title">{title}</h2>
      {subtitle && <p className="panel-note">{subtitle}</p>}
      {children}
    </section>
  );
}

export function ChartsPanel() {
  const values = useStore((s) => s.values);
  const taxMode = useStore((s) => s.taxMode);
  const sweepEnabled = useStore((s) => s.sweepEnabled);
  const sweepKey = useStore((s) => s.sweepKey);
  const sweepMin = useStore((s) => s.sweepMin);
  const sweepMax = useStore((s) => s.sweepMax);
  const sweepStep = useStore((s) => s.sweepStep);
  const [metric, setMetric] = useState<'$' | '%'>('$');

  const sweep = useMemo(
    () => (sweepEnabled ? runSweep(values, taxMode, sweepKey, sweepMin, sweepMax, sweepStep) : null),
    [sweepEnabled, values, taxMode, sweepKey, sweepMin, sweepMax, sweepStep],
  );

  // Single-point result at the entered values (used for the crossover marker).
  const baseResult = useMemo(() => getEngine('b').calculate(values, taxMode), [values, taxMode]);

  if (!sweepEnabled) {
    return (
      <section className="panel panel--muted">
        <h2 className="panel-title">Charts</h2>
        <p>Enable “Sweep” to graph expected values and recommendations across a variable range.</p>
      </section>
    );
  }

  if (!sweep || sweep.points.length === 0) {
    return (
      <section className="panel panel--muted">
        <h2 className="panel-title">Charts</h2>
        <p>Nothing to plot — check the sweep range (max must be above min, step above 0).</p>
      </section>
    );
  }

  const unit = sweep.meta.unit;
  const xTick = (v: unknown) => fmtAxisValue(Number(v), unit);
  const evValue = (_k: string | number | undefined, v: number) => fmtMoney2(v);
  const recValue = (_k: string | number | undefined, v: number) =>
    metric === '$' ? fmtMoneyCompact(v) : `${(v * 100).toFixed(1)}%`;

  const firstX = sweep.points[0].x;
  const lastX = sweep.points[sweep.points.length - 1].x;
  const current = values[sweepKey];
  const currentInRange = current >= firstX && current <= lastX;

  // Vertical markers: "your value" always when in range; crossover only when
  // sweeping X-risk (crossover is defined for the other inputs held fixed).
  const crossoverP = sweep.key === 'xRiskPct' && baseResult.ok ? baseResult.crossoverXRiskPct : null;
  const crossoverInRange = crossoverP !== null && crossoverP >= firstX && crossoverP <= lastX;

  const markers = (
    <>
      {currentInRange && (
        <ReferenceLine
          x={current}
          stroke={REF_COLOR}
          strokeDasharray="4 3"
          label={{
            value: sweep.key === 'xRiskPct' ? 'your X-risk' : 'your value',
            position: 'insideTopRight',
            fill: REF_COLOR,
            fontSize: 11,
          }}
        />
      )}
      {crossoverInRange && crossoverP !== null && (
        <ReferenceLine
          x={crossoverP}
          stroke={CROSSOVER_COLOR}
          strokeDasharray="6 3"
          label={{
            value: 'crossover p*',
            position: 'insideTopLeft',
            fill: CROSSOVER_COLOR,
            fontSize: 11,
          }}
        />
      )}
    </>
  );

  const metaLabel = `${sweep.meta.label} (${unit})`;

  return (
    <div className="stack">
      <ChartCard
        title="Expected value per pre-tax $1"
        subtitle={`${metaLabel} on the x-axis; all other values at your entered level. The higher line wins the marginal dollar.`}
      >
        <div className="chart-frame"><ResponsiveContainer width={760} height={300}>
          <LineChart data={sweep.points} margin={{ top: 8, right: 16, bottom: 4, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e6e8ec" />
            <XAxis
              dataKey="x"
              type="number"
              domain={['dataMin', 'dataMax']}
              tickFormatter={xTick}
              tickLine={false}
              axisLine={{ stroke: '#cbd2d9' }}
              minTickGap={28}
            />
            <YAxis
              tickFormatter={(v: unknown) => `$${Number(v).toFixed(2)}`}
              tickLine={false}
              axisLine={{ stroke: '#cbd2d9' }}
              width={58}
              domain={[0, 'auto']}
            />
            <Tooltip content={<ChartTip metaLabel={sweep.meta.label} unit={unit} valueFormat={evValue} />} />
            <Line type="monotone" dataKey="evSuper" name="Super (salary-sacrificed)" stroke={SUPER_COLOR} strokeWidth={2.5} dot={false} isAnimationActive={false} />
            <Line type="monotone" dataKey="evOutside" name="Outside (kept liquid)" stroke={OUTSIDE_COLOR} strokeWidth={2.5} dot={false} isAnimationActive={false} />
            {markers}
          </LineChart>
        </ResponsiveContainer></div>
        <p className="panel-note legend-note">
          <Swatch color={SUPER_COLOR} /> salary-sacrificed · <Swatch color={OUTSIDE_COLOR} /> kept outside
        </p>
      </ChartCard>

      <ChartCard
        title="Recommended extra super (above the SG)"
        subtitle="Binary by design in Model B: while super has higher expected value, fill the concessional cap room; beyond the crossover, add nothing."
      >
        <div className="segmented metric-toggle" role="group" aria-label="Recommendation units">
          <button type="button" className={metric === '$' ? 'segmented-btn active' : 'segmented-btn'} onClick={() => setMetric('$')}>
            $ / yr
          </button>
          <button type="button" className={metric === '%' ? 'segmented-btn active' : 'segmented-btn'} onClick={() => setMetric('%')}>
            % of salary
          </button>
        </div>
        <div className="chart-frame"><ResponsiveContainer width={760} height={300}>
          <LineChart data={sweep.points} margin={{ top: 8, right: 16, bottom: 4, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e6e8ec" />
            <XAxis
              dataKey="x"
              type="number"
              domain={['dataMin', 'dataMax']}
              tickFormatter={xTick}
              tickLine={false}
              axisLine={{ stroke: '#cbd2d9' }}
              minTickGap={28}
            />
            <YAxis
              tickFormatter={(v: unknown) => (metric === '$' ? fmtMoneyCompact(Number(v)) : `${Number(v).toFixed(1)}%`)}
              tickLine={false}
              axisLine={{ stroke: '#cbd2d9' }}
              width={58}
              domain={[0, 'auto']}
            />
            <Tooltip content={<ChartTip metaLabel={sweep.meta.label} unit={unit} valueFormat={recValue} />} />
            <Line
              type="stepAfter"
              dataKey={metric === '$' ? 'recommendedExtraPerYear' : 'recommendedExtraPctSalary'}
              name={metric === '$' ? 'Extra per year ($)' : 'Extra (% of salary)'}
              stroke={REC_COLOR}
              strokeWidth={2.5}
              dot={false}
              isAnimationActive={false}
            />
            {markers}
          </LineChart>
        </ResponsiveContainer></div>
        <p className="panel-note legend-note">
          <Swatch color={REC_COLOR} /> recommended salary sacrifice above the SG
        </p>
      </ChartCard>
    </div>
  );
}
