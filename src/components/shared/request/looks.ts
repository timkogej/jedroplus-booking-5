// The look of the shared request screens in each design: the same colours,
// fonts and shapes as that design's own steps.

import { isLightBackground } from '@/lib/color';
import type { Theme } from '@/types';
import type { RequestLook } from './look';

export function classicLook(theme: Theme): RequestLook {
  const light = isLightBackground(theme.bgFrom, theme.bgTo);
  return {
    text: light ? '#1D1D1F' : 'rgba(255,255,255,0.96)',
    muted: light ? 'rgba(29,29,31,0.62)' : 'rgba(255,255,255,0.72)',
    surface: '#FFFFFF',
    surfaceText: '#1D1D1F',
    surfaceMuted: '#6E6E73',
    border: 'rgba(60,60,67,0.14)',
    accent: theme.primarySolid,
    onAccent: '#FFFFFF',
    accentText: theme.primaryOnLight,
    radius: 22,
    fontHeading: 'var(--font-classic, var(--font-nunito))',
    fontBody: 'var(--font-classic, var(--font-nunito-sans))',
    ctaBg: theme.bgTo,
    ctaBleed: 16,
  };
}

/** Modern uses its own CSS variables, so it follows light and dark backgrounds. */
export function modernLook(theme: Theme): RequestLook {
  return {
    text: 'var(--t-primary)',
    muted: 'var(--t-muted)',
    surface: 'var(--s2)',
    surfaceText: 'var(--t-primary)',
    surfaceMuted: 'var(--t-muted)',
    border: 'var(--b2)',
    accent: theme.primarySolid,
    onAccent: '#FFFFFF',
    accentText: 'var(--t-accent)',
    radius: 20,
    fontHeading: 'var(--font-clash)',
    fontBody: 'var(--font-inter)',
    ctaBg: theme.bgTo,
    ctaBleed: 16,
  };
}

export function elegantLook(theme: Theme): RequestLook {
  return {
    text: '#111111',
    muted: '#6B7280',
    surface: '#FFFFFF',
    surfaceText: '#111111',
    surfaceMuted: '#6B7280',
    border: '#E5E7EB',
    accent: theme.primarySolid,
    onAccent: '#FFFFFF',
    accentText: theme.primaryOnLight,
    radius: 12,
    fontHeading: 'var(--font-playfair)',
    fontBody: 'var(--font-inter)',
    ctaBg: '#FFFFFF',
    ctaBleed: 24,
  };
}

export function seasonalLook(theme: Theme, headingFont?: string): RequestLook {
  return {
    text: 'var(--t-primary)',
    muted: 'var(--t-muted)',
    surface: '#FFFFFF',
    surfaceText: '#111827',
    surfaceMuted: '#6B7280',
    border: '#ECE7E1',
    accent: theme.primarySolid,
    onAccent: '#FFFFFF',
    accentText: theme.primaryOnLight,
    radius: 20,
    fontHeading: headingFont ?? 'var(--font-quicksand)',
    fontBody: 'var(--font-quicksand)',
    ctaBg: '#FFFFFF',
    ctaBleed: 24,
  };
}

/** Casino keeps its gold on green until the casino redesign. */
export function casinoLook(): RequestLook {
  return {
    text: '#F3E9D2',
    muted: '#A89060',
    surface: 'rgba(10, 40, 20, 0.82)',
    surfaceText: '#F3E9D2',
    surfaceMuted: '#A89060',
    border: 'rgba(201, 168, 76, 0.28)',
    accent: '#C9A84C',
    onAccent: '#0B1A10',
    accentText: '#E8C96D',
    radius: 10,
    fontHeading: 'var(--font-playfair)',
    fontBody: 'var(--font-cormorant)',
    capsLabels: true,
    ctaBg: '#060F08',
    ctaBleed: 16,
  };
}

export function magazineLook(theme: Theme): RequestLook {
  return {
    text: '#1C1917',
    muted: '#78716C',
    surface: '#FFFFFF',
    surfaceText: '#1C1917',
    surfaceMuted: '#78716C',
    border: '#E7E5E4',
    accent: theme.primarySolid,
    onAccent: '#FFFFFF',
    accentText: theme.primaryOnLight,
    radius: 4,
    fontHeading: 'var(--font-playfair), Georgia, serif',
    fontBody: 'var(--font-source-serif), Georgia, serif',
    capsLabels: true,
    ctaBg: '#FAFAF9',
    ctaBleed: 24,
  };
}
