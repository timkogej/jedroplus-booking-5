'use client';

import { motion } from 'framer-motion';
import { useBookingStore } from '@/store/bookingStore';
import { SeasonalTheme } from './decorations/SeasonDetector';

const STEPS = [
  { number: 1, label: 'Kategorija' },
  { number: 2, label: 'Storitev' },
  { number: 3, label: 'Specialist' },
  { number: 4, label: 'Datum in ura' },
  { number: 5, label: 'Podatki' },
  { number: 6, label: 'Potrditev' },
];

interface Props {
  currentStep: number;
  stepValues: Record<number, string | undefined>;
  seasonalTheme: SeasonalTheme;
}

export default function SeasonalSidebar({ currentStep, stepValues, seasonalTheme }: Props) {
  const { theme } = useBookingStore();

  const progressPercent = Math.max(0, Math.min(100, ((currentStep - 1) / (STEPS.length - 1)) * 100));

  return (
    <aside
      className="hidden md:block flex-shrink-0 seasonal-glass"
      style={{
        width: '220px',
        backgroundColor: 'var(--nav-bg)',
        borderRight: '1px solid var(--b1)',
      }}
    >
      <nav className="px-5 pt-6 pb-8">
        <div className="relative">
          {/* Progress line background */}
          <div
            className="absolute rounded-full"
            style={{
              left: '13px',
              top: '14px',
              width: '2px',
              height: 'calc(100% - 28px)',
              backgroundColor: 'var(--b2)',
            }}
          />

          {/* Animated progress fill */}
          <motion.div
            className="absolute rounded-full"
            style={{
              left: '13px',
              top: '14px',
              width: '2px',
              backgroundColor: theme.primaryColor,
              boxShadow: `0 0 8px ${theme.primaryColor}60`,
            }}
            initial={{ height: '0%' }}
            animate={{ height: `${progressPercent}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' as const }}
          />

          {/* Steps */}
          <div className="relative space-y-5">
            {STEPS.map((step, index) => {
              const isDone = currentStep > step.number;
              const isActive = currentStep === step.number;
              const value = isDone ? stepValues[step.number] : undefined;

              return (
                <motion.div
                  key={step.number}
                  className="flex items-start gap-3"
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.07, duration: 0.35 }}
                >
                  {/* Indicator circle */}
                  <motion.div
                    className="relative w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-semibold z-10"
                    style={{
                      backgroundColor:
                        isDone || isActive ? theme.primaryColor : 'var(--s2)',
                      color: isDone || isActive ? '#ffffff' : 'var(--t-muted)',
                      border: `1.5px solid ${isDone || isActive ? theme.primaryColor : 'var(--b2)'}`,
                      boxShadow: isActive ? `0 0 14px ${theme.primaryColor}50` : 'none',
                      fontFamily: 'var(--font-quicksand)',
                    }}
                    animate={
                      isActive
                        ? {
                            boxShadow: [
                              `0 0 0px ${theme.primaryColor}00`,
                              `0 0 16px ${theme.primaryColor}55`,
                              `0 0 0px ${theme.primaryColor}00`,
                            ],
                          }
                        : {}
                    }
                    transition={{ duration: 2, repeat: isActive ? Infinity : 0 }}
                  >
                    {isDone ? (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                        className="text-xs"
                      >
                        ✓
                      </motion.span>
                    ) : (
                      step.number
                    )}
                  </motion.div>

                  {/* Label + value */}
                  <div className="min-w-0 pt-0.5">
                    <p
                      className="text-sm leading-tight transition-colors duration-300"
                      style={{
                        fontFamily: 'var(--font-quicksand)',
                        fontWeight: isActive ? 600 : 400,
                        color: isActive
                          ? 'var(--t-primary)'
                          : isDone
                          ? 'var(--t-soft)'
                          : 'var(--t-muted)',
                      }}
                    >
                      {step.label}
                    </p>
                    {value && (
                      <motion.p
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-xs mt-0.5 truncate"
                        style={{ color: 'var(--t-faint)', fontFamily: 'var(--font-quicksand)' }}
                      >
                        {value}
                      </motion.p>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Season label at bottom */}
        <div
          className="mt-8 pt-4 text-center"
          style={{ borderTop: '1px solid var(--b1)' }}
        >
          <p
            className="text-xs"
            style={{ color: 'var(--t-faint)', fontFamily: 'var(--font-quicksand)' }}
          >
            {seasonalTheme.config.name} sezona
          </p>
        </div>
      </nav>
    </aside>
  );
}
