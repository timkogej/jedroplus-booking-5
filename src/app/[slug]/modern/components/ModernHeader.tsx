'use client';

import { motion } from 'framer-motion';
import { useBookingStore } from '@/store/bookingStore';

const STEPS = [
  { num: 1, label: 'Kategorija' },
  { num: 2, label: 'Storitev' },
  { num: 3, label: 'Specialist' },
  { num: 4, label: 'Datum' },
  { num: 5, label: 'Podatki' },
  { num: 6, label: 'Potrditev' },
];

interface Props {
  currentStep: number;
  isSuccess: boolean;
  canGoBack: boolean;
  onBack: () => void;
}

export default function ModernHeader({ currentStep, isSuccess, canGoBack, onBack }: Props) {
  const { company, theme } = useBookingStore();

  const progressPercent = isSuccess
    ? 100
    : ((currentStep - 1) / (STEPS.length - 1)) * 100;

  return (
    <header className="relative z-20 flex-shrink-0 pt-8 pb-0 px-4">
      <div className="max-w-2xl mx-auto">

        {/* ── Company name + panoga ── */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' as const }}
          className="text-center mb-6"
        >
          <h1
            className="font-bold tracking-tight leading-none"
            style={{
              fontFamily: 'var(--font-dm-sans)',
              fontSize: 'clamp(1.5rem, 4vw, 2.25rem)',
              color: 'var(--t-primary)',
            }}
          >
            {company?.naziv ?? 'Rezervacije'}
          </h1>
          {company?.panoga && (
            <p
              className="mt-2 uppercase tracking-widest"
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: '0.65rem',
                letterSpacing: '0.28em',
                color: 'var(--t-faint)',
              }}
            >
              {company.panoga}
              {' · '}
              {new Date().getFullYear()}
            </p>
          )}
          {!company?.panoga && (
            <p
              className="mt-2 uppercase tracking-widest"
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: '0.65rem',
                letterSpacing: '0.28em',
                color: 'var(--t-faint)',
              }}
            >
              Spletna rezervacija · {new Date().getFullYear()}
            </p>
          )}
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
              {STEPS.map((step) => {
                const isDone = currentStep > step.num;
                const isActive = currentStep === step.num;

                return (
                  <div
                    key={step.num}
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

            {/* Mobile: current step label */}
            <div className="flex sm:hidden items-center justify-between mb-2 px-1">
              {canGoBack && (
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
              )}
              {!canGoBack && <div />}
              <p
                className="text-xs font-medium"
                style={{ color: 'var(--t-muted)', fontFamily: 'var(--font-inter)' }}
              >
                {STEPS[currentStep - 1]?.label} · {currentStep}/6
              </p>
            </div>
          </motion.div>
        )}

        {/* ── Progress line ── */}
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

        {/* Desktop back button — below the line */}
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
