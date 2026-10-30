'use client';

import { motion } from 'framer-motion';
import { useBookingStore } from '@/store/bookingStore';
import { t } from '../i18n';

const ROMAN = ['I', 'II', 'III', 'IV', 'V'];

/**
 * The visible steps and which one is current. Shared by the progress bar and
 * the side panel so both count the same way; the specialist step is skipped
 * when the company hides employees online.
 */
export function useMagazineSteps() {
  const { currentStep, prikazZaposlenih, bookingConfirmation } = useBookingStore();
  const steps = [
    { labelKey: 'stepService' as const, storeStep: 1 },
    { labelKey: 'stepSpecialist' as const, storeStep: 3 },
    { labelKey: 'stepAppointment' as const, storeStep: 4 },
    { labelKey: 'stepDetails' as const, storeStep: 5 },
    { labelKey: 'stepConfirm' as const, storeStep: 6 },
  ]
    .filter((s) => prikazZaposlenih || s.storeStep !== 3)
    .map((s, i) => ({ ...s, num: String(i + 1).padStart(2, '0'), roman: ROMAN[i] }));

  const idx = bookingConfirmation?.success
    ? steps.length - 1
    : steps.findIndex((s) => s.storeStep >= currentStep);
  const currentIdx = idx === -1 ? steps.length - 1 : idx;
  return { steps, currentIdx, total: String(steps.length).padStart(2, '0') };
}

// Past steps darker, future steps lighter but still readable (≥4.5:1).
const PAST = '#4B4B4B';
const FUTURE = '#757575';

export default function MagazineProgress() {
  const { theme, language } = useBookingStore();
  const { steps: STEPS, currentIdx: safeIdx } = useMagazineSteps();

  return (
    <div className="px-8 py-5 md:px-12">
      {/* Desktop: roman numeral chain */}
      <div className="hidden md:flex items-center">
        {STEPS.map((step, i) => {
          const isActive = i === safeIdx;
          const isPast = i < safeIdx;

          return (
            <div key={i} className="flex items-center">
              <div className="flex flex-col items-center gap-1 px-3 first:pl-0 last:pr-0">
                <span
                  className="magazine-caps text-[11px] tracking-[0.18em] transition-all duration-500"
                  style={{
                    color: isActive
                      ? theme.primarySolid
                      : isPast
                      ? PAST
                      : FUTURE,
                  }}
                >
                  {t(language, step.labelKey)}
                </span>
                <span
                  className="magazine-serif text-[11px] transition-all duration-500"
                  style={{
                    color: isActive
                      ? theme.primarySolid
                      : isPast
                      ? PAST
                      : FUTURE,
                    fontStyle: isActive ? 'italic' : 'normal',
                  }}
                >
                  {step.roman}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className="w-6 h-[1px] mx-1 bg-black/10" />
              )}
            </div>
          );
        })}

        {/* Vertical label on far right */}
        <div className="ml-auto pl-6 border-l border-black/10">
          <p
            className="magazine-caps text-[11px] tracking-[0.22em]"
            style={{ color: theme.primarySolid }}
          >
            {t(language, 'chapter')} {STEPS[safeIdx]?.num} / {String(STEPS.length).padStart(2, '0')}
          </p>
        </div>
      </div>

      {/* Mobile: compact indicator */}
      <div className="flex md:hidden items-center justify-between">
        <div>
          <p
            className="magazine-caps text-[11px] tracking-[0.22em] mb-1"
            style={{ color: theme.primarySolid }}
          >
            {t(language, 'chapter')} {STEPS[safeIdx]?.num} / {String(STEPS.length).padStart(2, '0')}
          </p>
          <p className="magazine-serif text-base text-[#1A1A1A]">
            {t(language, STEPS[safeIdx]?.labelKey ?? 'stepService')}
          </p>
        </div>

        {/* Dot progress */}
        <div className="flex items-center gap-1.5">
          {STEPS.map((_, i) => (
            <motion.div
              key={i}
              className="rounded-full h-1.5"
              animate={{
                width: i === safeIdx ? 20 : 6,
                backgroundColor:
                  i === safeIdx
                    ? theme.primarySolid
                    : i < safeIdx
                    ? `${theme.primaryColor}50`
                    : 'rgba(0,0,0,0.12)',
              }}
              transition={{ duration: 0.4, ease: 'easeInOut' }}
            />
          ))}
        </div>
      </div>

      {/* Progress line */}
      <div className="h-[1px] bg-black/10 mt-4 overflow-hidden">
        <motion.div
          className="h-full"
          style={{ backgroundColor: theme.primarySolid }}
          animate={{ width: `${((safeIdx + 1) / STEPS.length) * 100}%` }}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
        />
      </div>
    </div>
  );
}
