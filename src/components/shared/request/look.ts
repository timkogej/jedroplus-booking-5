// How the shared request screens look in a design. Each design passes its own
// colours and fonts, so the screens feel native to it.

export interface RequestLook {
  /** Page text and secondary text. */
  text: string;
  muted: string;
  /** Cards, inputs and chips. */
  surface: string;
  surfaceText: string;
  surfaceMuted: string;
  border: string;
  /** Brand colour that carries `onAccent` text (buttons, selected chips). */
  accent: string;
  onAccent: string;
  /** Brand colour for text/icons on `surface`. */
  accentText: string;
  /** Corner radius of cards and buttons, px. */
  radius: number;
  fontHeading: string;
  fontBody: string;
  /** Small labels in capitals with letter spacing (casino, magazine). */
  capsLabels?: boolean;
  /** Colour behind the pinned Next button on phones, and the page side padding. */
  ctaBg: string;
  ctaBleed?: number;
}
