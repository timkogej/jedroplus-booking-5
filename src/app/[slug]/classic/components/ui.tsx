'use client';

// Shared look of the classic design: Apple-style type, white grouped cards
// with hairlines, and one solid brand-colour button per screen.

import type { CSSProperties, ReactNode } from 'react';
import { AnimatePresence, motion, type Variants } from 'framer-motion';
import { useBookingStore } from '@/store/bookingStore';
import { isLightBackground } from '@/lib/color';
import { enUS, sl } from 'date-fns/locale';
import type { SupportedLanguage } from '@/types';

export const FONT = 'var(--font-classic)';
export const EASE = [0.32, 0.72, 0, 1] as const;
export const SPRING = { type: 'spring' as const, stiffness: 420, damping: 32 };

/** Text on white cards. */
export const INK = '#1D1D1F';
export const INK_2 = '#6E6E73';
export const INK_3 = '#A1A1A6';
export const FILL = 'rgba(118,118,128,0.10)';
export const HAIRLINE = 'rgba(60,60,67,0.12)';

export const CARD: CSSProperties = {
  background: '#FFFFFF',
  borderRadius: 22,
  boxShadow: '0 0 0 0.5px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04), 0 10px 30px -12px rgba(0,0,0,0.10)',
};

export const listVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.04 } },
};

export const itemVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE } },
};

/** Colours that depend on the company background (light or dark). */
export function useClassicColors() {
  const theme = useBookingStore((s) => s.theme);
  const light = isLightBackground(theme.bgFrom, theme.bgTo);
  return {
    theme,
    light,
    accent: theme.primarySolid,
    accentText: theme.primaryOnLight,
    text: light ? '#1D1D1F' : 'rgba(255,255,255,0.96)',
    text2: light ? 'rgba(29,29,31,0.62)' : 'rgba(255,255,255,0.72)',
    text3: light ? 'rgba(29,29,31,0.42)' : 'rgba(255,255,255,0.5)',
    line: light ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.16)',
    glass: light ? 'rgba(255,255,255,0.72)' : 'rgba(255,255,255,0.14)',
  };
}

/** date-fns locale for the page language. */
export function dateLocale(language: SupportedLanguage) {
  return language === 'en' ? enUS : sl;
}

/** "Četrtek, 29. oktober" / "Thursday, October 29". */
export function longDatePattern(language: SupportedLanguage) {
  return language === 'en' ? 'EEEE, MMMM d' : 'EEEE, d. MMMM';
}

/** "Čet., 29. okt." / "Thu, Oct 29". */
export function shortDatePattern(language: SupportedLanguage) {
  return language === 'en' ? 'EEE, MMM d' : 'EEE, d. MMM';
}

/** "ob" / "at" between a date and a time. */
export function atWord(language: SupportedLanguage) {
  return language === 'en' ? 'at' : 'ob';
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h} h ${m} min` : `${h} h`;
}

/** Large Apple-style screen title. */
export function PageTitle({ title, subtitle, eyebrow }: { title: string; subtitle?: string; eyebrow?: string }) {
  const c = useClassicColors();
  return (
    <motion.div variants={itemVariants} className="mb-6">
      {eyebrow && (
        <p className="mb-1.5 text-[13px] font-semibold" style={{ color: c.light ? c.accentText : c.text2, fontFamily: FONT }}>
          {eyebrow}
        </p>
      )}
      <h2
        className="text-[30px] font-bold leading-[1.1] sm:text-[34px]"
        style={{ color: c.text, fontFamily: FONT, letterSpacing: '-0.028em' }}
      >
        {title}
      </h2>
      {subtitle && (
        <p className="mt-2 text-[16px] leading-6" style={{ color: c.text2, fontFamily: FONT }}>
          {subtitle}
        </p>
      )}
    </motion.div>
  );
}

/** Small grey label above a grouped card. */
export function SectionLabel({ children, right }: { children: ReactNode; right?: ReactNode }) {
  const c = useClassicColors();
  return (
    <div className="mb-2 flex items-baseline justify-between px-1">
      <p className="text-[13px] font-semibold uppercase" style={{ color: c.text2, letterSpacing: '0.04em', fontFamily: FONT }}>
        {children}
      </p>
      {right}
    </div>
  );
}

export function Spinner({ color = '#FFFFFF', size = 18 }: { color?: string; size?: number }) {
  return (
    <motion.span
      aria-hidden="true"
      className="block rounded-full"
      style={{ width: size, height: size, border: `2px solid ${color}55`, borderTopColor: color }}
      animate={{ rotate: 360 }}
      transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }}
    />
  );
}

/** The one solid button on a screen. */
export function PrimaryButton({
  children,
  onClick,
  disabled,
  loading,
  className = '',
  type = 'button',
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  type?: 'button' | 'submit';
}) {
  const c = useClassicColors();
  const off = disabled || loading;
  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={off}
      whileHover={off ? undefined : { y: -1 }}
      whileTap={off ? undefined : { scale: 0.98 }}
      transition={SPRING}
      className={`relative flex h-[54px] items-center justify-center gap-2 overflow-hidden rounded-[16px] px-7 text-[17px] font-semibold ${className}`}
      style={{
        fontFamily: FONT,
        color: '#FFFFFF',
        background: disabled && !loading ? 'rgba(120,120,128,0.32)' : c.accent,
        boxShadow: off ? 'none' : `0 1px 0 rgba(255,255,255,0.18) inset, 0 10px 24px -8px ${c.accent}99`,
        cursor: off ? 'not-allowed' : 'pointer',
        letterSpacing: '-0.01em',
      }}
    >
      {/* soft sheen across the top half */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-1/2"
        style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.16), rgba(255,255,255,0))' }}
      />
      {loading && <Spinner />}
      <span className="relative flex items-center gap-2">{children}</span>
    </motion.button>
  );
}

/** Outlined secondary button on white. */
export function SecondaryButton({ children, onClick, icon }: { children: ReactNode; onClick?: () => void; icon?: ReactNode }) {
  const c = useClassicColors();
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.97 }}
      transition={SPRING}
      className="flex h-[50px] flex-1 items-center justify-center gap-2 rounded-[14px] text-[15px] font-semibold"
      style={{ fontFamily: FONT, color: c.accentText, background: `${c.accent}12` }}
    >
      {icon}
      {children}
    </motion.button>
  );
}

/** Round check that pops in when selected (iOS list style). */
export function CheckCircle({ on, color, size = 24 }: { on: boolean; color: string; size?: number }) {
  return (
    <span
      className="relative flex flex-shrink-0 items-center justify-center rounded-full"
      style={{
        width: size,
        height: size,
        boxShadow: on ? 'none' : 'inset 0 0 0 1.5px rgba(60,60,67,0.26)',
        transition: 'box-shadow 0.2s',
      }}
    >
      <AnimatePresence initial={false}>
        {on && (
          <motion.span
            key="on"
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.4, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 520, damping: 26 }}
            className="absolute inset-0 flex items-center justify-center rounded-full"
            style={{ background: color }}
          >
            <svg width={size * 0.5} height={size * 0.5} viewBox="0 0 12 12" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <motion.path d="M2.5 6.2l2.4 2.4 4.6-5" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.25, delay: 0.05 }} />
            </svg>
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}

export function Chevron({ color = INK_3, dir = 'right' }: { color?: string; dir?: 'right' | 'left' }) {
  return (
    <svg width="8" height="14" viewBox="0 0 8 14" fill="none" aria-hidden="true" style={{ transform: dir === 'left' ? 'rotate(180deg)' : undefined }}>
      <path d="M1 1l6 6-6 6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Red notice inside the flow. */
export function ErrorNote({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="flex items-start gap-3 rounded-[16px] px-4 py-3.5"
      style={{ background: '#FFF1F0', boxShadow: '0 0 0 0.5px rgba(255,59,48,0.25)' }}
    >
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none" className="mt-px flex-shrink-0" aria-hidden="true">
        <circle cx="10" cy="10" r="9" fill="#FF3B30" />
        <path d="M10 5.5v5.2M10 14h.01" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <p className="text-[14px] leading-5" style={{ color: '#C4170C', fontFamily: FONT }}>
        {children}
      </p>
    </motion.div>
  );
}

/** Initials or photo in a soft brand-coloured circle. */
export function Avatar({ initials, photo, size = 44, color }: { initials: string; photo?: string; size?: number; color: string }) {
  if (photo) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={photo} alt="" className="flex-shrink-0 rounded-full object-cover" style={{ width: size, height: size }} />;
  }
  return (
    <span
      className="flex flex-shrink-0 items-center justify-center rounded-full font-semibold"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.36,
        color: '#FFFFFF',
        background: `linear-gradient(145deg, ${color}CC, ${color})`,
        fontFamily: FONT,
        letterSpacing: '0.01em',
      }}
    >
      {initials}
    </span>
  );
}
