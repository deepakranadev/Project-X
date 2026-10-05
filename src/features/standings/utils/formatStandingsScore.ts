/**
 * Formats a competition score with deterministic precision handling.
 * Integers render directly (e.g. "12"), while fractional values display
 * up to 2 decimal places with fixed padding (e.g. "1.50", "0.25").
 */
export function formatStandingsScore(value: number): string {
  if (Number.isInteger(value)) {
    return value.toString();
  }
  const rounded = Math.round(value * 100) / 100;
  const formatted = rounded.toFixed(2);
  return formatted.endsWith(".00") ? formatted.slice(0, -3) : formatted;
}
