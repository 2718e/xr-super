import { useStore } from './state/store';
import { getEngine } from './calc';
import { InputPanel } from './components/InputPanel';
import { SweepPanel } from './components/SweepPanel';
import { ResultsPanel } from './components/ResultsPanel';
import { ChartsPanel } from './components/ChartsPanel';
import { Methodology } from './components/Methodology';

export default function App() {
  const reset = useStore((s) => s.reset);
  const engine = getEngine('b');

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <h1>X-risk &amp; super</h1>
          <p className="brand-sub">
            How much extra superannuation is worth it, when the world might end first?
          </p>
        </div>
        <div className="topbar-right">
          <span className="engine-pill">{engine.name}</span>
          <button type="button" className="btn" onClick={reset}>
            Reset to defaults
          </button>
        </div>
      </header>

      <main className="layout">
        <aside className="sidebar">
          <InputPanel />
          <SweepPanel />
        </aside>
        <section className="content">
          <ResultsPanel />
          <ChartsPanel />
          <Methodology />
        </section>
      </main>

      <footer className="footer">
        Rough planning tool, not financial advice. Figures are AUD. Values you enter are saved in
        your browser (localStorage) — nothing is sent anywhere.
      </footer>
    </div>
  );
}
