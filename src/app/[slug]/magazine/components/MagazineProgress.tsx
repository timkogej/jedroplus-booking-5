'use client';

import { motion } from 'framer-motion';
import { useBookingStore } from '@/store/bookingStore';

const STEPS = [
  { num: '01', label: 'Kategorija', roman: 'I' },
  { num: '02', label: 'Storitev', roman: 'II' },
  { num: '03', label: 'Specialist', roman: 'III' },
  { num: '04', label: 'Termin', roman: 'IV' },
  { num: '05', label: 'Podatki', roman: 'V' },
  { num: '06', label: 'Potrditev', roman: 'VI' },
];

export default function MagazineProgress() {
  const { currentStep, theme } = useBookingStore();
  const idx = currentStep - 1;

  return (
    <div className="px-8 py-5 md:px-12">
      {/* Desktop: roman numeral chain */}
      <div className="hidden md:flex items-center">
        {STEPS.map((step, i) => {
          const isActive = i === idx;
          const isPast = i < idx;

          return (
            <div key={i} className="flex items-center">
              <div className="flex flex-col items-center gap-1 px-3 first:pl-0 last:pr-0">
                <span
                  className="magazine-caps text-[9px] tracking-[0.18em] transition-all duration-500"
                  style={{
                    color: isActive
                      ? theme.primaryColor
                      : isPast
                      ? '#6B6B6B'
                      : 'rgba(0,0,0,0.2)',
                  }}
                >
                  {step.label}
                </span>
                <span
                  className="magazine-serif text-[11px] transition-all duration-500"
                  style={{
                    color: isActive
                      ? theme.primaryColor
                      : isPast
                      ? '#6B6B6B'
                      : 'rgba(0,0,0,0.18)',
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
            className="magazine-caps text-[9px] tracking-[0.22em]"
            style={{ color: theme.primaryColor }}
          >
            Poglavje {STEPS[idx]?.num} / 06
          </p>
        </div>
      </div>

      {/* Mobile: compact indicator */}
      <div className="flex md:hidden items-center justify-between">
        <div>
          <p
            className="magazine-caps text-[9px] tracking-[0.22em] mb-1"
            style={{ color: theme.primaryColor }}
          >
            Poglavje {STEPS[idx]?.num} / 06
          </p>
          <p className="magazine-serif text-base text-[#1A1A1A]">
            {STEPS[idx]?.label}
          </p>
        </div>

        {/* Dot progress */}
        <div className="flex items-center gap-1.5">
          {STEPS.map((_, i) => (
            <motion.div
              key={i}
              className="rounded-full h-1.5"
              animate={{
                width: i === idx ? 20 : 6,
                backgroundColor:
                  i === idx
                    ? theme.primaryColor
                    : i < idx
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
          style={{ backgroundColor: theme.primaryColor }}
          animate={{ width: `${(currentStep / STEPS.length) * 100}%` }}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
        />
      </div>
    </div>
  );
}
