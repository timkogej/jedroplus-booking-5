// src/lib/text.ts — small Slovenian text helpers shared by every design.

/**
 * Slovenian has four number forms: 1 storitev, 2 storitvi, 3-4 storitve,
 * 5+ storitev (and the same pattern repeats above 100).
 */
export function servicesCountLabel(count: number): string {
  const n = Math.abs(Math.trunc(count || 0)) % 100;
  const form =
    n % 100 === 1 ? 'storitev' : n % 100 === 2 ? 'storitvi' : n % 100 === 3 || n % 100 === 4 ? 'storitve' : 'storitev';
  return `${count} ${form}`;
}

/**
 * Services stored with price 0 showed as "0,00 €", which reads like a bug to
 * the client. Show nothing there instead (the price is agreed in person).
 */
export function servicePriceLabel(price: number | string | null | undefined, format: (v: number) => string): string | null {
  const amount = typeof price === 'string' ? Number(price) : Number(price ?? 0);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  return format(amount);
}
