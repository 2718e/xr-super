/**
 * Static documentation of how Model B works and its assumptions.
 * Kept in its own component so future engines can supply their own notes.
 */
export function Methodology() {
  return (
    <details className="panel">
      <summary className="panel-title summary-title">How Model B works &amp; assumptions</summary>
      <div className="method-content">
        <p>
          The question is whether to <em>salary-sacrifice</em> extra pre-tax dollars into super,
          on top of the compulsory Super Guarantee. Super cuts the tax on contributions (15% vs
          your marginal rate) and on earnings, but locks the money away until you can access it —
          so it only has value if the world survives that long.
        </p>
        <h4>Per pre-tax dollar, two options</h4>
        <ul>
          <li>
            <strong>Super:</strong> 15% contribution tax, grows at a net real return inside super,
            usable tax-free from your access age. Worth only if the world survives to then.
          </li>
          <li>
            <strong>Outside:</strong> taxed at your marginal rate now; invested at a lower net real
            return; but liquid — if the world ends early it keeps a fraction of its value (you could
            have spent or used it along the way).
          </li>
        </ul>
        <h4>The arithmetic (all real, per $1 of pre-tax salary)</h4>
        <pre className="code-block">{`n  = access age − current age
s  = (1 − X-risk)^n            chance the world makes it
EV_super   = s × (1 − 15%) × (1 + g_super)^n
EV_outside = s × (1 − t) × (1 + g_out)^n + (1 − s) × (1 − t) × w
g_super = return × (1 − super earnings tax)
g_out   = return × (1 − drag factor × t)`}</pre>
        <p>
          If <code>EV_super &gt; EV_outside</code> the marginal dollar belongs in super. Because
          neither side’s EV depends on how much you contribute, the rational amount is “as much as
          possible”: everything up to the <strong>concessional cap room</strong> left after the SG
          ({'{'}cap − SG{')'}), or nothing above the crossover X-risk <code>p*</code>. That’s why the
          recommendation chart is a step.
        </p>
        <h4>Simplifications &amp; limitations</h4>
        <ul>
          <li>Concessional (pre-tax) contributions only — no non-concessional or carry-forward rules.</li>
          <li>No personal mortality, estate or inheritance value; X-risk is the only “don’t reach it” risk.</li>
          <li>
            Constant real returns and tax settings; no salary growth, no market volatility or
            sequence-of-returns risk, no inflation effects (everything real).
          </li>
          <li>
            The <em>drag factor</em> crudely approximates how outside investment income is taxed
            (dividends yearly, capital gains deferred &amp; 50% discounted) as a single fraction of
            returns taxed at your marginal rate each year.
          </li>
          <li>Australian resident tax brackets FY2024-25, simplified (no offsets/phase-outs; Medicare below ~$24k ignored).</li>
          <li>Cash balances, home equity and existing super do not affect the marginal per-dollar comparison in Model B.</li>
          <li>Amounts are in AUD.</li>
        </ul>
        <h4>Design note</h4>
        <p>
          Engines are decoupled from the UI behind a small registry (see <code>src/calc/</code>), so
          richer lifetime-simulation models (“Model A” style) can be added later without touching the
          input, graphing or persistence layers.
        </p>
      </div>
    </details>
  );
}
