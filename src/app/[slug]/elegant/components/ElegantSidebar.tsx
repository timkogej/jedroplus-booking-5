'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useBookingStore } from '@/store/bookingStore';
import { t } from '../i18n';

const STEPS = [
  { number: 1, labelKey: 'stepService' },
  { number: 3, labelKey: 'stepSpecialist' },
  { number: 4, labelKey: 'stepDateTime' },
  { number: 5, labelKey: 'stepDetails' },
  { number: 6, labelKey: 'stepConfirm' },
] as const;

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
  const { theme, prikazZaposlenih, language } = useBookingStore();
  // The specialist step is skipped when the company hides employees online.
  const steps = STEPS.filter((s) => prikazZaposlenih || s.number !== 3);

  return (
    <nav className="px-6 pb-8 flex-1">
      {steps.map((step, idx) => {
        const isDone = currentStep > step.number;
        const isActive = currentStep === step.number;
        const isLast = idx === steps.length - 1;
        const value = isDone ? stepValues[step.number] : undefined;

        return (
          <div key={step.number} className="flex items-start gap-3">
            {/* Indicator column */}
            <div className="flex flex-col items-center flex-shrink-0" style={{ paddingTop: '2px' }}>
              {/* Circle — done / active / pending */}
              <div
                className="relative w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300"
                style={{
                  background: isDone
                    ? `linear-gradient(135deg, ${theme.primarySolid}, ${theme.secondaryColor ?? theme.primarySolid})`
                    : 'transparent',
                  border: isDone
                    ? 'none'
                    : isActive
                    ? `2px solid ${theme.primarySolid}`
                    : '1.5px solid #D1D5DB',
                  color: isActive ? theme.primarySolid : '#6B7280',
                  fontSize: '0.7rem',
                  fontWeight: 500,
                  fontFamily: 'var(--font-inter)',
                }}
              >
                {isActive && (
                  <motion.span
                    layoutId="elegant-step-halo"
                    className="absolute -inset-[5px] rounded-full"
                    style={{ boxShadow: `0 0 0 1px ${theme.primarySolid}33`, background: `${theme.primarySolid}0D` }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
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
                      {idx + 1}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>

              {/* Connecting line */}
              {!isLast && (
                <div
                  className="relative w-px overflow-hidden transition-all duration-300"
                  style={{ height: value ? '3rem' : '2.25rem', marginTop: '3px', backgroundColor: '#E5E7EB' }}
                >
                  <motion.span
                    className="absolute inset-x-0 top-0 block"
                    style={{ background: theme.primarySolid, opacity: 0.55 }}
                    initial={false}
                    animate={{ height: isDone ? '100%' : '0%' }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  />
                </div>
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
                  color: isDone ? '#6B7280' : isActive ? theme.primarySolid : '#6B7280',
                }}
              >
                {t(language, step.labelKey)}
              </p>
              {value && (
                <motion.p
                  initial={{ opacity: 0, y: -3 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="mt-0.5 truncate first-cap"
                  style={{
                    fontFamily: 'var(--font-inter)',
                    fontSize: '0.75rem',
                    color: '#6B7280',
                  }}
                >
                  {value}
                </motion.p>
              )}
            </div>
          </div>
        );
      })}
    </nav>
  );
}
