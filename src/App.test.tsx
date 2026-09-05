// @vitest-environment happy-dom
import { beforeAll, describe, expect, it } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

beforeAll(() => {
  // Recharts relies on ResizeObserver, which happy-dom does not implement.
  if (!('ResizeObserver' in globalThis)) {
    class StubRO {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
    (globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver = StubRO;
  }
});

describe('App smoke test', () => {
  it('mounts, shows a verdict and draws charts', async () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    const root = createRoot(el);

    await act(async () => {
      root.render(<App />);
    });

    const text = el.textContent ?? '';
    expect(text).toContain('Crossover X-risk');
    expect(text).toContain('Recommended extra');
    expect(text).toContain('Expected value per pre-tax $1');
    expect(text).toContain('Model parameters');
    expect(el.querySelectorAll('svg').length).toBeGreaterThan(0);

    await act(async () => {
      root.unmount();
    });
  });
});
