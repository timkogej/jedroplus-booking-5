'use client';

// Shared pieces of the casino design: brand colours, poker chips, labels,
// buttons and date helpers. Everything takes its colour from the company.

import type { CSSProperties, ReactNode } from 'react';
import { AnimatePresence, motion, type Variants } from 'framer-motion';
import { format } from 'date-fns';
import { enUS, sl } from 'date-fns/locale';
import type { SupportedLanguage, Theme } from '@/types';
import { brandOf } from '../../modern/components/brand';

export const EASE = [0.22, 1, 0.36, 1] as const;
export const SPRING = { type: 'spring' as const, stiffness: 420, damping: 32 };

export const FONT_HEAD = 'var(--font-playfair)';
export const FONT_LABEL = 'var(--font-oswald)';
export const FONT_BODY = 'var(--font-inter)';

export const CX_BG = '#09090c';
export const CREAM = '#F6F3EE';
export const MUTED = 'rgba(246,243,238,0.62)';
export const FAINT = 'rgba(246,243,238,0.4)';

export const SUITS = ['♠', '♥', '♦', '♣'] as const;

/** CSS variables for the casino page, from the company colours. */
export function casinoVars(theme: Theme): CSSProperties {
  const b = brandOf(theme);
  return {
    '--cx-a': b.a,
    '--cx-b': b.b,
    '--cx-glow': b.glow,
    '--cx-glow2': b.glow2,
    '--cx-grad': b.gradient,
    // Shared pieces (add-ons, promotions) read the modern dark variables.
    '--t-primary': CREAM,
    '--t-soft': 'rgba(246,243,238,0.82)',
    '--t-muted': MUTED,
    '--t-faint': FAINT,
    '--t-accent': b.glow,
    '--s1': 'rgba(255,255,255,0.04)',
    '--s2': '#16161B',
    '--s2h': '#1C1C22',
    '--s3': 'rgba(255,255,255,0.14)',
    '--b1': 'rgba(255,255,255,0.07)',
    '--b2': 'rgba(255,255,255,0.11)',
    '--b3': 'rgba(255,255,255,0.18)',
  } as CSSProperties;
}

/** Brand colour mixed with transparency, e.g. mix('--cx-glow', 20). */
export function mix(variable: string, percent: number): string {
  return `color-mix(in srgb, var(${variable}) ${percent}%, transparent)`;
}

export const listVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

export const itemVariants: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } },
};

// ── Dates ───────────────────────────────────────────────────────────────────

export function dateLocale(language: SupportedLanguage) {
  return language === 'en' ? enUS : sl;
}
export function atWord(language: SupportedLanguage) {
  return language === 'en' ? 'at' : 'ob';
}
export function longDate(d: Date, language: SupportedLanguage) {
  return format(d, language === 'en' ? 'EEEE, MMMM d' : 'EEEE, d. MMMM', { locale: dateLocale(language) });
}
export function shortDate(d: Date, language: SupportedLanguage) {
  return format(d, language === 'en' ? 'MMM d, yyyy' : 'd. MMM yyyy', { locale: dateLocale(language) });
}

// "v četrtek, 29. oktobra" / "Thursday, October 29": as said in a sentence.
const SL_DAYS = ['v nedeljo', 'v ponedeljek', 'v torek', 'v sredo', 'v četrtek', 'v petek', 'v soboto'];
const SL_MONTHS = ['januarja', 'februarja', 'marca', 'aprila', 'maja', 'junija', 'julija', 'avgusta', 'septembra', 'oktobra', 'novembra', 'decembra'];
export function spokenDate(d: Date, language: SupportedLanguage): string {
  if (language === 'en') return format(d, 'EEEE, MMMM d', { locale: enUS });
  return `${SL_DAYS[d.getDay()]}, ${d.getDate()}. ${SL_MONTHS[d.getMonth()]}`;
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h} h ${m} min` : `${h} h`;
}

// ── Pieces ──────────────────────────────────────────────────────────────────

/** Small caps label in Oswald. */
export function Label({ children, className = '', style }: { children: ReactNode; className?: string; style?: CSSProperties }) {
  return (
    <p className={`cx-label ${className}`} style={style}>
      {children}
    </p>
  );
}

/** ◆ — rule — ◆ ornament. */
export function DiamondRule({ className = '', width = 'max-w-[8rem]' }: { className?: string; width?: string }) {
  return (
    <div className={`flex items-center justify-center gap-3 ${className}`} aria-hidden="true">
      <div className={`cx-rule flex-1 ${width}`} />
      <span style={{ color: 'var(--cx-glow)', fontSize: '0.6rem' }}>◆</span>
      <div className={`cx-rule flex-1 ${width}`} />
    </div>
  );
}

/**
 * A poker chip: brand gradient with a dashed edge. Shows a check when `on`,
 * otherwise its children (initials, a suit, a number).
 */
export function Chip({
  size = 44,
  on = false,
  dim = false,
  spin = false,
  children,
}: {
  size?: number;
  on?: boolean;
  dim?: boolean;
  spin?: boolean;
  children?: ReactNode;
}) {
  const edge = Math.max(3, Math.round(size * 0.11));
  return (
    <span
      className="relative inline-flex flex-shrink-0 items-center justify-center rounded-full"
      style={{
        width: size,
        height: size,
        background: dim ? 'rgba(255,255,255,0.06)' : 'var(--cx-grad)',
        boxShadow: dim
          ? 'inset 0 0 0 1px rgba(255,255,255,0.12)'
          : `0 6px 16px -6px var(--cx-a), inset 0 1px 0 rgba(255,255,255,0.35), inset 0 -2px 4px rgba(0,0,0,0.25)`,
        transition: 'background 0.3s, box-shadow 0.3s',
      }}
    >
      {/* Dashed edge, like the stripes on a real chip. */}
      <span
        className={`pointer-events-none absolute rounded-full ${spin ? 'cx-chip-edge' : ''}`}
        style={{
          inset: edge * 0.45,
          border: `${Math.max(1.5, edge * 0.55)}px dashed ${dim ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.55)'}`,
        }}
      />
      {/* Inner face. */}
      <span
        className="relative flex items-center justify-center rounded-full"
        style={{
          width: size - edge * 2.6,
          height: size - edge * 2.6,
          background: dim ? 'transparent' : 'rgba(0,0,0,0.16)',
          boxShadow: dim ? 'none' : 'inset 0 0 0 1px rgba(255,255,255,0.25)',
          color: dim ? FAINT : '#fff',
          fontFamily: FONT_HEAD,
          fontWeight: 700,
          fontSize: size * 0.3,
          lineHeight: 1,
        }}
      >
        <AnimatePresence mode="wait" initial={false}>
          {on ? (
            <motion.svg
              key="check"
              width={size * 0.4}
              height={size * 0.4}
              viewBox="0 0 12 12"
              fill="none"
              stroke="#fff"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.4, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 520, damping: 24 }}
              aria-hidden="true"
            >
              <motion.path d="M2.5 6.2l2.4 2.4 4.6-5" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.3, delay: 0.05 }} />
            </motion.svg>
          ) : (
            <motion.span key="face" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
              {children}
            </motion.span>
          )}
        </AnimatePresence>
      </span>
    </span>
  );
}

/** Round check for selectable rows. */
export function CheckMark({ on, size = 24 }: { on: boolean; size?: number }) {
  return (
    <span
      className="relative flex flex-shrink-0 items-center justify-center rounded-full"
      style={{ width: size, height: size, boxShadow: on ? 'none' : 'inset 0 0 0 1.5px rgba(255,255,255,0.22)', transition: 'box-shadow 0.2s' }}
    >
      <AnimatePresence initial={false}>
        {on && (
          <motion.span
            initial={{ scale: 0.3, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.3, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 520, damping: 24 }}
            className="absolute inset-0 flex items-center justify-center rounded-full"
            style={{ background: 'var(--cx-grad)', boxShadow: `0 0 14px -2px var(--cx-glow)` }}
          >
            <svg width={size * 0.5} height={size * 0.5} viewBox="0 0 12 12" fill="none" stroke="#fff" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <motion.path d="M2.5 6.2l2.4 2.4 4.6-5" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.25 }} />
            </svg>
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}

/** Square checkbox with an animated tick (consents). */
export function Tick({ on, error }: { on: boolean; error?: boolean }) {
  return (
    <span
      className="relative mt-0.5 flex h-[22px] w-[22px] flex-shrink-0 items-center justify-center rounded-[7px]"
      style={{
        boxShadow: on ? 'none' : `inset 0 0 0 1.5px ${error ? '#FF6B5E' : 'rgba(255,255,255,0.28)'}`,
        transition: 'box-shadow 0.2s',
      }}
    >
      <AnimatePresence initial={false}>
        {on && (
          <motion.span
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.4, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 520, damping: 26 }}
            className="absolute inset-0 flex items-center justify-center rounded-[7px]"
            style={{ background: 'var(--cx-grad)' }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#fff" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <motion.path d="M2.5 6.2l2.4 2.4 4.6-5" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.22 }} />
            </svg>
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}

export function ErrorNote({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="flex items-start gap-3 rounded-[14px] px-4 py-3.5"
      style={{ background: 'rgba(255,90,80,0.1)', boxShadow: 'inset 0 0 0 1px rgba(255,90,80,0.3)' }}
    >
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none" className="mt-px flex-shrink-0" aria-hidden="true">
        <circle cx="10" cy="10" r="9" fill="#FF5A50" />
        <path d="M10 5.5v5.2M10 14h.01" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <p className="text-[14px] leading-5" style={{ color: '#FFB8B0', fontFamily: FONT_BODY }}>
        {children}
      </p>
    </motion.div>
  );
}

/** Hover light that follows the pointer inside a card. */
export function pointerLight(e: React.PointerEvent<HTMLElement>) {
  if (e.pointerType !== 'mouse') return;
  const el = e.currentTarget;
  const r = el.getBoundingClientRect();
  el.style.setProperty('--mx', `${e.clientX - r.left}px`);
  el.style.setProperty('--my', `${e.clientY - r.top}px`);
}

export function PointerGlow() {
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
      style={{ background: `radial-gradient(220px circle at var(--mx, 50%) var(--my, 50%), ${mix('--cx-glow', 13)}, transparent 70%)` }}
    />
  );
}

export function Spinner({ color = '#fff' }: { color?: string }) {
  return (
    <motion.span
      className="inline-block h-4 w-4 rounded-full border-2"
      style={{ borderColor: color, borderTopColor: 'transparent' }}
      animate={{ rotate: 360 }}
      transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }}
    />
  );
}
