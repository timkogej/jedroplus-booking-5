'use client';

import { motion } from 'framer-motion';
import CompanyLogo from '@/components/shared/CompanyLogo';
import { useBookingStore } from '@/store/bookingStore';
import type { SupportedLanguage } from '@/types';

// Visual step definitions — maps to store step ranges
const STEPS = [
  { label: 'Storitev' },   // 0: store steps 1, 2
  { label: 'Specialist' }, // 1: store step 3
  { label: 'Datum' },      // 2: store step 4
  { label: 'Podatki' },    // 3: store step 5
  { label: 'Potrditev' },  // 4: store steps 6, 7
];

function storeToVisualIdx(storeStep: number): number {
  if (storeStep <= 2) return 0;
  if (storeStep === 3) return 1;
  if (storeStep === 4) return 2;
  if (storeStep === 5) return 3;
  return 4; // 6+
}

function LanguageToggle({
  language,
  onToggle,
}: {
  language: SupportedLanguage;
  onToggle: (l: SupportedLanguage) => void;
}) {
  const { theme } = useBookingStore();
  return (
    <div
      className="flex rounded-lg overflow-hidden flex-shrink-0"
      style={{ border: '1px solid var(--b2)' }}
    >
      {(['sl', 'en'] as SupportedLanguage[]).map((lang) => {
        const isActive = language === lang;
        return (
          <button
            key={lang}
            onClick={() => onToggle(lang)}
            className="px-2.5 py-1 text-xs font-semibold uppercase transition-all"
            style={{
              fontFamily: 'var(--font-inter)',
              background: isActive ? theme.primaryColor : 'transparent',
              color: isActive ? '#ffffff' : 'var(--t-faint)',
              letterSpacing: '0.06em',
            }}
          >
            {lang}
          </button>
        );
      })}
    </div>
  );
}

interface Props {
  currentStep: number;
  isSuccess: boolean;
  canGoBack: boolean;
  onBack: () => void;
}

export default function ModernHeader({ currentStep, isSuccess, canGoBack, onBack }: Props) {
  const { company, theme, language, setLanguage } = useBookingStore();

  const visualIdx = isSuccess ? STEPS.length - 1 : storeToVisualIdx(currentStep);

  // Center each dot: dot at index i is centered at (2i+1) / (2*N) of total width.
  // For N=5 dots: 10%, 30%, 50%, 70%, 90%.
  // Progress line should reach exactly that dot's center.
  const progressPercent = isSuccess
    ? 100
    : ((2 * visualIdx + 1) * 100) / (2 * STEPS.length);

  return (
    <header className="relative z-20 flex-shrink-0 pt-8 pb-0 px-4">
      <div className="max-w-2xl mx-auto">

        {/* ── Company name + language toggle ── */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' as const }}
          className="flex items-start gap-4 mb-6"
        >
          {/* Spacer to balance language toggle on right */}
          <div className="flex-shrink-0" style={{ width: 56 }} />

          <div className="flex-1 min-w-0 text-center">
            <h1
              className="leading-none"
              style={{
                fontFamily: 'var(--font-clash)',
                fontWeight: 400,
                fontSize: 'clamp(1.875rem, 4.5vw, 3rem)',
                letterSpacing: '-0.02em',
                color: 'var(--t-primary)',
              }}
            >
              <CompanyLogo name={company?.naziv ?? 'Rezervacije'} logoUrl={company?.logo_url} variant="dark" />
            </h1>
            <p
              className="mt-1.5 text-sm"
              style={{ fontFamily: 'var(--font-inter)', color: 'var(--t-faint)' }}
            >
              {company?.panoga ?? 'Spletna rezervacija'}
              {' · '}
              {new Date().getFullYear()}
            </p>
          </div>

          {/* Language toggle */}
          <div className="flex-shrink-0 mt-1">
            <LanguageToggle language={language} onToggle={setLanguage} />
          </div>
        </motion.div>

        {/* ── Progress steps ── */}
        {!isSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.4 }}
          >
            {/* Desktop: step labels + dots */}
            <div className="hidden sm:flex items-end justify-between mb-2 px-1">
              {STEPS.map((step, i) => {
                const isDone = i < visualIdx;
                const isActive = i === visualIdx;

                return (
                  <div
                    key={i}
                    className="flex flex-col items-center gap-1.5"
                    style={{ minWidth: 0, flex: 1 }}
                  >
                    <span
                      className="text-center leading-tight"
                      style={{
                        fontFamily: 'var(--font-inter)',
                        fontSize: '0.6rem',
                        letterSpacing: '0.06em',
                        fontWeight: isActive ? 600 : 400,
                        color: isActive
                          ? 'var(--t-primary)'
                          : isDone
                          ? 'var(--t-muted)'
                          : 'var(--t-faint)',
                        transition: 'color 0.3s',
                      }}
                    >
                      {step.label}
                    </span>

                    {/* Dot */}
                    <motion.div
                      className="w-2 h-2 rounded-full"
                      animate={{
                        backgroundColor:
                          isDone || isActive ? theme.primaryColor : 'var(--b2)',
                        scale: isActive ? 1.4 : 1,
                        boxShadow: isActive
                          ? `0 0 8px ${theme.primaryColor}80`
                          : 'none',
                      }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                );
              })}
            </div>

            {/* Mobile: current step label + back */}
            <div className="flex sm:hidden items-center justify-between mb-2 px-1">
              {canGoBack ? (
                <motion.button
                  onClick={onBack}
                  whileTap={{ scale: 0.92 }}
                  className="flex items-center gap-1 text-xs"
                  style={{ color: 'var(--t-muted)', fontFamily: 'var(--font-inter)' }}
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Nazaj
                </motion.button>
              ) : (
                <div />
              )}
              <p
                className="text-xs font-medium"
                style={{ color: 'var(--t-muted)', fontFamily: 'var(--font-inter)' }}
              >
                {STEPS[visualIdx]?.label} · {visualIdx + 1}/{STEPS.length}
              </p>
            </div>
          </motion.div>
        )}

        {/* ── Progress line — line reaches center of active dot ── */}
        <div
          className="h-px overflow-hidden"
          style={{ backgroundColor: 'var(--b1)' }}
        >
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: theme.primaryColor }}
            initial={{ width: '0%' }}
            animate={{ width: `${progressPercent}%` }}
            transition={{
              duration: 0.6,
              ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
            }}
          />
        </div>

        {/* Desktop back button */}
        {canGoBack && (
          <motion.button
            onClick={onBack}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            whileHover={{ x: -3 }}
            whileTap={{ scale: 0.95 }}
            className="hidden sm:flex items-center gap-1.5 text-xs mt-3"
            style={{ color: 'var(--t-faint)', fontFamily: 'var(--font-inter)' }}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Nazaj
          </motion.button>
        )}

      </div>
    </header>
  );
}
