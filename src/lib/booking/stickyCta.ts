// src/lib/booking/stickyCta.ts
//
// Style for the wrapper of a form's Next button. Together with the
// .booking-sticky-cta class (globals.css) it keeps the button pinned to the
// bottom of the screen on phones. `bg` is the colour behind the button,
// `bleed` the side padding of the page, so the strip reaches the screen edges.

import type { CSSProperties } from 'react';

export function stickyCtaStyle(bg: string, bleed = 0): CSSProperties {
  return { '--cta-bg': bg, '--cta-bleed': `${bleed}px` } as CSSProperties;
}
