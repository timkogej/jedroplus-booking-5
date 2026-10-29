// Modern is always dark. The company colours become a two-tone gradient that
// carries buttons, titles and the moving light behind the page.

import { ensureReadable, readableOnDark } from '@/lib/color';
import type { Theme } from '@/types';

function toRgb(hex: string): [number, number, number] | null {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  let h = m[1];
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function toHex([r, g, b]: number[]): string {
  return `#${[r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('')}`;
}

/** Rotates the hue of a colour by `deg` degrees. */
function shiftHue(hex: string, deg: number): string {
  const rgb = toRgb(hex);
  if (!rgb) return hex;
  const [r, g, b] = rgb.map((v) => v / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  let h = 0;
  let s = 0;
  if (d !== 0) {
    s = d / (1 - Math.abs(2 * l - 1));
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
  }
  h = (h + deg + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const [r1, g1, b1] =
    h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return toHex([(r1 + m) * 255, (g1 + m) * 255, (b1 + m) * 255]);
}

function distance(a: string, b: string): number {
  const x = toRgb(a);
  const y = toRgb(b);
  if (!x || !y) return 0;
  return Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]);
}

export interface Brand {
  /** Gradient start: carries white text. */
  a: string;
  /** Gradient end: carries white text. */
  b: string;
  /** Bright brand colour for text and icons on the dark page. */
  glow: string;
  /** Second bright colour for the moving light. */
  glow2: string;
  gradient: string;
  /** Same gradient for text (use with background-clip). */
  textGradient: string;
}

export function brandOf(theme: Theme): Brand {
  const a = theme.primarySolid;
  // A second company colour when it is really different, else a neighbour hue.
  const second = theme.secondaryColor && distance(theme.secondaryColor, theme.primaryColor) > 70
    ? theme.secondaryColor
    : shiftHue(theme.primaryColor, 38);
  const b = ensureReadable(second, '#FFFFFF', 3);
  const glow = theme.primaryOnDark;
  const glow2 = readableOnDark(second, '#0B0B10', 4.5);
  return {
    a,
    b,
    glow,
    glow2,
    gradient: `linear-gradient(120deg, ${a} 0%, ${b} 100%)`,
    textGradient: `linear-gradient(100deg, #FFFFFF 0%, #FFFFFF 35%, ${glow} 75%, ${glow2} 100%)`,
  };
}

/** Page colour behind everything. */
export const MODERN_BG = '#07070B';

/** Text and surfaces on the dark page (read through CSS variables). */
export const MODERN_VARS = {
  '--t-primary': '#F5F5F7',
  '--t-soft': 'rgba(245,245,247,0.82)',
  '--t-muted': 'rgba(245,245,247,0.6)',
  '--t-faint': 'rgba(245,245,247,0.42)',
  '--t-disabled': 'rgba(245,245,247,0.22)',
  '--s1': 'rgba(255,255,255,0.04)',
  '--s2': 'rgba(255,255,255,0.065)',
  '--s2h': 'rgba(255,255,255,0.1)',
  '--s3': 'rgba(255,255,255,0.14)',
  '--b1': 'rgba(255,255,255,0.07)',
  '--b2': 'rgba(255,255,255,0.11)',
  '--b3': 'rgba(255,255,255,0.18)',
  '--header-bg': 'rgba(7,7,11,0.6)',
  '--nav-bg': 'rgba(7,7,11,0.8)',
} as const;

export const EASE = [0.22, 1, 0.36, 1] as const;
export const SPRING = { type: 'spring' as const, stiffness: 420, damping: 32 };
