'use client';

// Shared pieces of the modern design: big gradient titles, dark glass panels
// and small controls in the company colours.

import type { CSSProperties, ReactNode } from 'react';
import { AnimatePresence, motion, type Variants } from 'framer-motion';
import { enUS, sl } from 'date-fns/locale';
import type { SupportedLanguage } from '@/types';
import { EASE } from './brand';

export const FONT = 'var(--font-inter)';

export const GLASS: CSSProperties = {
  background: 'rgba(255,255,255,0.045)',
  borderRadius: 24,
  boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.08), inset 0 1px 0 rgba(255,255,255,0.06), 0 30px 60px -30px rgba(0,0,0,0.6)',
  backdropFilter: 'blur(18px)',
  WebkitBackdropFilter: 'blur(18px)',
};

export const listVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

export const itemVariants: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } },
};

export function dateLocale(language: SupportedLanguage) {
  return language === 'en' ? enUS : sl;
}
export function longDatePattern(language: SupportedLanguage) {
  return language === 'en' ? 'EEEE, MMMM d' : 'EEEE, d. MMMM';
}
export function shortDatePattern(language: SupportedLanguage) {
  return language === 'en' ? 'EEE, MMM d' : 'EEE, d. MMM';
}
export function atWord(language: SupportedLanguage) {
  return language === 'en' ? 'at' : 'ob';
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h} h ${m} min` : `${h} h`;
}

/** Big title; the text slowly shimmers in the company colours. */
export function Title({ title, subtitle, eyebrow }: { title: string; subtitle?: string; eyebrow?: string }) {
  return (
    <motion.div variants={itemVariants} className="mb-7">
      {eyebrow && (
        <p className="mb-2 inline-flex items-center gap-2 text-[13px] font-bold" style={{ color: 'var(--brand-glow)', fontFamily: FONT }}>
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: 'var(--brand-glow)', boxShadow: '0 0 10px var(--brand-glow)' }} />
          {eyebrow}
        </p>
      )}
      <h2
        className="modern-shift-text pb-1.5 text-[34px] font-extrabold leading-[1.08] sm:text-[44px]"
        style={{
          fontFamily: FONT,
          letterSpacing: '-0.04em',
          backgroundImage: 'linear-gradient(100deg, #FFFFFF 0%, #FFFFFF 40%, var(--brand-glow) 70%, var(--brand-glow2) 85%, #FFFFFF 100%)',
        }}
      >
        {title}
      </h2>
      {subtitle && (
        <p className="mt-2.5 text-[16px] leading-6" style={{ color: 'var(--t-muted)', fontFamily: FONT }}>
          {subtitle}
        </p>
      )}
    </motion.div>
  );
}

export function SectionLabel({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="mb-2.5 flex items-baseline justify-between px-1">
      <p className="text-[12px] font-bold uppercase" style={{ color: 'var(--t-faint)', letterSpacing: '0.12em', fontFamily: FONT }}>
        {children}
      </p>
      {right}
    </div>
  );
}

/** Round check that fills with the brand gradient. */
export function CheckDot({ on, size = 24 }: { on: boolean; size?: number }) {
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
            style={{ background: 'var(--brand-grad)', boxShadow: '0 0 14px -2px var(--brand-glow)' }}
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

export function Avatar({ initials, size = 44 }: { initials: string; size?: number }) {
  return (
    <span
      className="relative flex flex-shrink-0 items-center justify-center rounded-full font-bold text-white"
      style={{ width: size, height: size, fontSize: size * 0.34, background: 'var(--brand-grad)', fontFamily: FONT, boxShadow: '0 8px 20px -8px var(--brand-a), inset 0 1px 0 rgba(255,255,255,0.3)' }}
    >
      {initials}
    </span>
  );
}

export function ErrorNote({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="flex items-start gap-3 rounded-[18px] px-4 py-3.5"
      style={{ background: 'rgba(255,69,58,0.12)', boxShadow: 'inset 0 0 0 1px rgba(255,69,58,0.3)' }}
    >
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none" className="mt-px flex-shrink-0" aria-hidden="true">
        <circle cx="10" cy="10" r="9" fill="#FF453A" />
        <path d="M10 5.5v5.2M10 14h.01" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <p className="text-[14px] leading-5" style={{ color: '#FFB4AE', fontFamily: FONT }}>
        {children}
      </p>
    </motion.div>
  );
}

/** Hover light that follows the pointer inside a row or card. */
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
      className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
      style={{
        background:
          'radial-gradient(240px circle at var(--mx, 50%) var(--my, 50%), color-mix(in srgb, var(--brand-glow) 14%, transparent), transparent 70%)',
      }}
    />
  );
}
