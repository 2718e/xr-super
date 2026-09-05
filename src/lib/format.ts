/** Number formatting helpers. All monetary units are AUD. */

export function fmtMoney(n: number): string {
  const rounded = Math.round(n);
  const sign = rounded < 0 ? '-' : '';
  const abs = Math.abs(rounded);
  return `${sign}$${abs.toLocaleString('en-AU')}`;
}

/** Money with cents — used for small expected-value amounts. */
export function fmtMoney2(n: number): string {
  const sign = n < 0 ? '-' : '';
  return `${sign}$${Math.abs(n).toFixed(2)}`;
}

export function fmtMoneyCompact(n: number): string {
  const sign = n < 0 ? '-' : '';
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(2).replace(/\.?0+$/, '')}M`;
  if (abs >= 1_000) return `${sign}$${Math.round(abs / 1_000)}k`;
  return `${sign}$${Math.round(abs)}`;
}

/** Formats a proportion (0.045 -> "4.5%"). */
export function fmtPct(p: number, decimals = 1): string {
  return `${(p * 100).toFixed(decimals)}%`;
}

/** Formats a plain % number (4.5 -> "4.5%"). */
export function fmtPctNumber(p: number, decimals = 1): string {
  return `${p.toFixed(decimals)}%`;
}

/** Formats an arbitrary axis value for a field's unit. */
export function fmtAxisValue(v: number, unit: string): string {
  if (unit === '$' || unit === '$/yr') return fmtMoneyCompact(v);
  if (unit.includes('%')) return fmtPctNumber(v, v < 10 ? 2 : 1);
  return String(Math.round(v * 100) / 100);
}

export function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}
