# X-risk & super

Estimate how much extra superannuation you should salary-sacrifice, balancing the
tax advantages of Australia's super system against the chance you never reach
retirement because of X-risks (world-ending events).

Rough planning tool — not financial advice. Amounts are AUD.

## The model (v1: "Model B" — risk-adjusted EV arbitrage)

Simplified model to get the project started.

For each extra pre-tax dollar, compare the expected value of two uses:

- **Super (salary sacrifice):** 15% contribution tax, locked until your access
  age, earnings taxed concessionally, tax-free on the way out — but only worth
  anything if the world survives that long.
- **Outside super:** taxed at your marginal rate now, invested at a lower net
  return, but liquid — if the world ends early it keeps a fraction of its value.

Each is weighted by survival probability `(1 − X-risk)^years`. When super's
expected value is higher, the recommendation is to fill the concessional cap
room left after the Super Guarantee; above the crossover X-risk `p*`, add
nothing. All parameters (SG rate, caps, returns, taxes) are editable under
"Model parameters", since these settings change over time.

See the in-app "How Model B works & assumptions" panel for the full arithmetic
and its simplifications.

---

Notes from the human: 

How to value money that is **outside super** is actually a
difficult question. To a first approximation the value **as in utility** of money
is exactly 0 unless it's spent on something useful (to second approximation there's
a meaningful benefit to security and psychological safety up to a point, though the 
possiblity of super being withdrawable early in financial hardship may negate this).

Maybe the question didn't actually make sense, or maybe needs a model of the chance of
actually wanting to spend investment money prior to retirement.

## Stack

- React 19 + TypeScript (strict)
- Vite (static build — deployable to Vercel/Netlify or any static host) + Vitest
- Zustand with localStorage persistence (your values stay in your browser)
- Recharts for graphs

## Develop

```bash
npm install
npm run dev        # local dev server
npm test           # unit + DOM smoke tests
npm run build      # typecheck + production build to dist/
npm run preview    # serve the production build locally
```

## Code layout

- `src/fields.ts` — single registry of every numeric input & model parameter
  (label, units, range, defaults). UI, state, engines and sweeps derive from it.
- `src/calc/` — pure, UI-free calculation layer:
  - `engineB.ts` — Model B maths
  - `index.ts` — engine registry (the seam for adding new models later)
  - `sweep.ts` — evaluating an engine across a variable range
- `src/tax.ts` — simplified FY2024-25 Australian marginal tax brackets
- `src/state/store.ts` — Zustand store, decoupled from components
- `src/components/` — inputs, sweep controls, results, charts, methodology notes

`money`-group inputs (cash, shares, home equity, super balance) are collected
but intentionally unused by Model B's marginal per-dollar comparison; they are
reserved for richer lifetime models later.

## Roadmap ideas (from Spec.md)

- Lifetime expected-spending simulation ("Model A") as a second engine via the
  registry — could use existing savings/home equity, SG-rate changes, etc.
- More output types, more sweep-able quantities, carry-forward caps,
  non-concessional contributions.
