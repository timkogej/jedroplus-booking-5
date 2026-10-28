// src/lib/color.ts
//
// Company colours come from the owner's settings and can be very light
// (one account has #aaaaaa). The designs use the primary colour for headings
// and buttons, so a pale value makes the page unreadable. We darken such
// colours just enough to keep text legible, and leave usable colours alone.

function hexToRgb(hex: string): [number, number, number] | null {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  let h = m[1];
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function rgbToHex(r: number, g: number, b: number): string {
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
  return `#${c(r)}${c(g)}${c(b)}`;
}

/** WCAG relative luminance (0 = black, 1 = white). */
export function luminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0.5;
  const [r, g, b] = rgb.map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Contrast ratio between two colours (1 = identical, 21 = black on white). */
export function contrastRatio(a: string, b: string): number {
  const l1 = luminance(a);
  const l2 = luminance(b);
  const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * Returns the colour darkened step by step until it has at least `minRatio`
 * contrast against `background` (default white). Colours that already pass are
 * returned unchanged.
 */
export function ensureReadable(color: string, background = '#FFFFFF', minRatio = 4.5): string {
  const rgb = hexToRgb(color);
  if (!rgb) return color;
  let [r, g, b] = rgb;
  let guard = 0;
  while (contrastRatio(rgbToHex(r, g, b), background) < minRatio && guard < 40) {
    r *= 0.9;
    g *= 0.9;
    b *= 0.9;
    guard += 1;
  }
  return rgbToHex(r, g, b);
}

/**
 * Text colour for a light background. A colour with almost no contrast of its
 * own (a pale grey company colour, say) is not worth "darkening" — the page
 * reads better in near-black ink, with the company colour left for accents.
 */
export function readableInkOnLight(color: string, ink = '#111827'): string {
  if (contrastRatio(color, '#FFFFFF') < 3) return ink;
  return ensureReadable(color, '#FFFFFF', 4.5);
}

/**
 * The colour mixed toward white until it has at least `minRatio` contrast
 * against a dark `background`. Used for brand-coloured text on dark designs.
 */
export function readableOnDark(color: string, background = '#111827', minRatio = 4.5): string {
  const rgb = hexToRgb(color);
  if (!rgb) return color;
  let [r, g, b] = rgb;
  let guard = 0;
  while (contrastRatio(rgbToHex(r, g, b), background) < minRatio && guard < 40) {
    r += (255 - r) * 0.15;
    g += (255 - g) * 0.15;
    b += (255 - b) * 0.15;
    guard += 1;
  }
  return rgbToHex(r, g, b);
}

/** True when dark text reads better than white text on this background. */
export function isLightBackground(from: string, to: string = from): boolean {
  const avg = (luminance(from) + luminance(to)) / 2;
  // 0.179 is where black and white text have equal contrast.
  return avg > 0.179;
}

/**
 * Rules for the company colour, used by every design:
 *  - `primaryColor`  — the owner's colour as entered. Only for soft tints
 *                      (`${primaryColor}20`), glows and decorations.
 *  - `primarySolid`  — same hue, dark enough to carry white text: buttons,
 *                      selected states, borders, icons, brand text on light.
 *  - `primaryOnLight`— text on white; a colour too pale to darken nicely
 *                      falls back to near-black ink.
 *  - `primaryOnDark` — text on dark backgrounds.
 */
export function withReadableColors<T extends { primaryColor: string }>(theme: T) {
  const raw = theme.primaryColor;
  return {
    ...theme,
    primarySolid: ensureReadable(raw),
    primaryOnLight: readableInkOnLight(raw),
    primaryOnDark: readableOnDark(raw),
  };
}
