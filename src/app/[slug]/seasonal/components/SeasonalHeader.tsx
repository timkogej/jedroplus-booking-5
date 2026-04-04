'use client';

import { motion } from 'framer-motion';
import { useBookingStore } from '@/store/bookingStore';
import { SeasonalTheme } from './decorations/SeasonDetector';

interface Props {
  currentStep: number;
  isSuccess: boolean;
  canGoBack: boolean;
  onBack: () => void;
  seasonalTheme: SeasonalTheme;
}

export default function SeasonalHeader({ currentStep, isSuccess, canGoBack, onBack, seasonalTheme }: Props) {
  const { company, theme } = useBookingStore();

  const seasonEmoji: Record<string, string> = {
    christmas: '🎄',
    newyear: '🎉',
    valentine: '💕',
    easter: '🐣',
    halloween: '🎃',
    thanksgiving: '🍂',
    winter: '❄️',
    spring: '🌸',
    summer: '☀️',
    autumn: '🍁',
  };

  const emoji = seasonalTheme.holiday
    ? seasonEmoji[seasonalTheme.holiday] ?? seasonEmoji[seasonalTheme.season]
    : seasonEmoji[seasonalTheme.season];

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' as const }}
      className="seasonal-glass flex-shrink-0 mx-3 mt-3 md:mx-4 md:mt-4 rounded-2xl px-4 md:px-6 py-3 md:py-4"
      style={{
        backgroundColor: 'var(--header-bg)',
        border: '1px solid var(--b1)',
        boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
      }}
    >
      <div className="flex items-center justify-between gap-4">
        {/* Left: company name + back button */}
        <div className="flex items-center gap-3 min-w-0">
          {canGoBack && (
            <motion.button
              onClick={onBack}
              whileHover={{ x: -2, scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="hidden md:flex items-center justify-center w-8 h-8 rounded-xl flex-shrink-0"
              style={{ backgroundColor: 'var(--s2)', border: '1px solid var(--b1)' }}
              aria-label="Nazaj"
            >
              <svg className="w-4 h-4" style={{ color: 'var(--t-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </motion.button>
          )}

          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-white font-bold text-sm"
            style={{ backgroundColor: theme.primaryColor }}
          >
            {(company?.naziv ?? 'B').charAt(0).toUpperCase()}
          </div>

          <h1
            className="truncate font-semibold text-xs md:text-sm"
            style={{ color: 'var(--t-primary)', fontFamily: 'var(--font-quicksand)' }}
          >
            {company?.naziv ?? 'Booking'}
          </h1>

          {/* Season badge */}
          <span
            className="hidden sm:inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full flex-shrink-0"
            style={{
              backgroundColor: 'var(--s1)',
              color: 'var(--t-faint)',
              border: '1px solid var(--b1)',
              fontFamily: 'var(--font-quicksand)',
            }}
          >
            {emoji} {seasonalTheme.config.name}
          </span>
        </div>

        {/* Right: step indicator */}
        {!isSuccess ? (
          <div className="flex items-center gap-3 flex-shrink-0">
            {/* Mobile: pill dots */}
            <div className="flex items-center gap-1 md:hidden">
              {[1, 2, 3, 4, 5, 6].map((s) => (
                <motion.div
                  key={s}
                  className="rounded-full transition-all duration-300"
                  animate={{
                    width: s === currentStep ? 18 : 6,
                    backgroundColor:
                      s <= currentStep ? theme.primaryColor : 'var(--b2)',
                  }}
                  style={{ height: 6 }}
                />
              ))}
            </div>
            {/* Desktop: text badge */}
            <span
              className="hidden md:block text-xs font-medium px-3 py-1.5 rounded-full"
              style={{
                backgroundColor: 'var(--s2)',
                color: 'var(--t-muted)',
                fontFamily: 'var(--font-quicksand)',
                border: '1px solid var(--b1)',
              }}
            >
              Korak {currentStep} od 6
            </span>
          </div>
        ) : (
          <div
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full"
            style={{
              backgroundColor: `${theme.primaryColor}20`,
              color: theme.primaryColor,
              border: `1px solid ${theme.primaryColor}40`,
              fontFamily: 'var(--font-quicksand)',
            }}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
            Potrjeno
          </div>
        )}
      </div>
    </motion.header>
  );
}
