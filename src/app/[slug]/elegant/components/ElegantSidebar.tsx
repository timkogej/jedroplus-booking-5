'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useBookingStore } from '@/store/bookingStore';

const STEPS = [
  { number: 1, label: 'Storitev', visual: 1 },
  { number: 3, label: 'Specialist', visual: 2 },
  { number: 4, label: 'Datum in ura', visual: 3 },
  { number: 5, label: 'Podatki', visual: 4 },
  { number: 6, label: 'Potrditev', visual: 5 },
];

interface Props {
  currentStep: number;
  stepValues: Record<number, string | undefined>;
}

// Thin SVG checkmark — drawn-in on first appearance
function ElegantCheck({ color }: { color: string }) {
  return (
    <motion.svg
      width="11"
      height="11"
      viewBox="0 0 12 10"
      fill="none"
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
      initial={{ scale: 0.6, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 380, damping: 22 }}
    >
      <motion.path
        d="M1 5L4.5 8.5L11 1"
        strokeWidth="1.8"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.32, delay: 0.05, ease: 'easeOut' as const }}
      />
    </motion.svg>
  );
}

export default function ElegantSidebar({ currentStep, stepValues }: Props) {
  const { theme } = useBookingStore();

  return (
    <nav className="px-6 pb-8 flex-1">
      {STEPS.map((step, idx) => {
        const isDone = currentStep > step.number;
        const isActive = currentStep === step.number;
        const isLast = idx === STEPS.length - 1;
        const value = isDone ? stepValues[step.number] : undefined;

        return (
          <div key={step.number} className="flex items-start gap-3">
            {/* Indicator column */}
            <div className="flex flex-col items-center flex-shrink-0" style={{ paddingTop: '2px' }}>
              {/* Circle — done / active / pending */}
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300"
                style={{
                  background: isDone
                    ? `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor ?? theme.primaryColor})`
                    : 'transparent',
                  border: isDone
                    ? 'none'
                    : isActive
                    ? `2px solid ${theme.primaryColor}`
                    : '1.5px solid #D1D5DB',
                  color: isActive ? theme.primaryColor : '#9CA3AF',
                  fontSize: '0.7rem',
                  fontWeight: 500,
                  fontFamily: 'var(--font-inter)',
                }}
              >
                <AnimatePresence mode="wait">
                  {isDone ? (
                    <ElegantCheck key="check" color="white" />
                  ) : (
                    <motion.span
                      key="num"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      {step.visual}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>

              {/* Connecting line */}
              {!isLast && (
                <div
                  className="w-px transition-all duration-300"
                  style={{
                    height: value ? '3rem' : '2.25rem',
                    marginTop: '3px',
                    backgroundColor: isDone ? theme.primaryColor : '#E5E7EB',
                    opacity: isDone ? 0.4 : 1,
                  }}
                />
              )}
            </div>

            {/* Step text */}
            <div className="min-w-0" style={{ paddingBottom: value ? '0.75rem' : '2.25rem' }}>
              <p
                className="leading-tight transition-colors duration-300"
                style={{
                  fontFamily: 'var(--font-inter)',
                  fontSize: '0.875rem',
                  fontWeight: isActive ? 500 : 400,
                  color: isDone ? '#6B7280' : isActive ? theme.primaryColor : '#9CA3AF',
                }}
              >
                {step.label}
              </p>
              {value && (
                <p
                  className="mt-0.5 truncate"
                  style={{
                    fontFamily: 'var(--font-inter)',
                    fontSize: '0.75rem',
                    color: '#9CA3AF',
                  }}
                >
                  {value}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </nav>
  );
}
