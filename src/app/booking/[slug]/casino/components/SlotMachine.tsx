'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useBookingStore } from '@/store/bookingStore';

// Monte Carlo Booking Summary Panel
// Replaces the Vegas slot machine with an elegant status display
export default function BookingSummaryCard() {
  const {
    selectedService,
    selectedEmployeeId,
    anyPerson,
    selectedTime,
    selectedDate,
    employeesUI,
    currentStep,
  } = useBookingStore();

  const selectedEmployee = employeesUI.find((e) => e.id === selectedEmployeeId);

  const items = [
    {
      label: 'Storitev',
      value: selectedService?.naziv ?? null,
      suit: '♠',
    },
    {
      label: 'Specialist',
      value: anyPerson ? 'Kdorkoli prost' : selectedEmployee?.label ?? null,
      suit: '♥',
    },
    {
      label: 'Termin',
      value: selectedTime ?? null,
      suit: '♦',
    },
  ];

  const filledCount = items.filter((i) => i.value !== null).length;
  const allFilled = filledCount === 3;

  // Only show when at least one item is selected (step 2+)
  if (currentStep < 2 && filledCount === 0) return null;

  return (
    <div
      className="relative rounded-lg overflow-hidden"
      style={{
        background: 'rgba(8, 30, 15, 0.7)',
        backdropFilter: 'blur(10px)',
        border: allFilled
          ? '1px solid rgba(201, 168, 76, 0.6)'
          : '1px solid rgba(201, 168, 76, 0.18)',
        boxShadow: allFilled
          ? '0 0 24px rgba(201, 168, 76, 0.12), inset 0 0 16px rgba(201, 168, 76, 0.04)'
          : '0 4px 20px rgba(0,0,0,0.25)',
        transition: 'border-color 0.6s ease, box-shadow 0.6s ease',
      }}
    >
      {/* Top accent */}
      <div
        className="h-px"
        style={{
          background: allFilled
            ? 'linear-gradient(to right, transparent, #c9a84c, #e8c96d, #c9a84c, transparent)'
            : 'linear-gradient(to right, transparent, rgba(201,168,76,0.2), transparent)',
          transition: 'background 0.6s ease',
        }}
      />

      <div className="px-4 py-3">
        {/* Label row */}
        <div className="flex items-center justify-between mb-2">
          <span
            style={{
              fontFamily: 'var(--font-oswald)',
              fontSize: '0.55rem',
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              color: 'rgba(201,168,76,0.35)',
            }}
          >
            Vaša Izbira
          </span>
          {allFilled && (
            <motion.span
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 350, damping: 18 }}
              style={{
                fontFamily: 'var(--font-oswald)',
                fontSize: '0.55rem',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: '#c9a84c',
              }}
            >
              ◆ Miza rezervirana
            </motion.span>
          )}
        </div>

        {/* Items */}
        <div className="flex gap-3">
          {items.map((item, i) => (
            <div key={i} className="flex-1 min-w-0">
              <p
                style={{
                  fontFamily: 'var(--font-oswald)',
                  fontSize: '0.55rem',
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  color: 'rgba(201,168,76,0.35)',
                  marginBottom: '0.2rem',
                }}
              >
                {item.suit} {item.label}
              </p>

              <AnimatePresence mode="wait">
                {item.value ? (
                  <motion.p
                    key={item.value}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.35, ease: 'easeOut' as const }}
                    className="truncate"
                    style={{
                      fontFamily: 'var(--font-cormorant)',
                      fontSize: '0.92rem',
                      fontWeight: 500,
                      color: '#f5edd6',
                      fontStyle: 'normal',
                    }}
                  >
                    {item.value}
                  </motion.p>
                ) : (
                  <motion.p
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{
                      fontFamily: 'var(--font-oswald)',
                      fontSize: '0.75rem',
                      color: 'rgba(201,168,76,0.15)',
                      letterSpacing: '0.1em',
                    }}
                  >
                    · · ·
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom accent when all filled */}
      <AnimatePresence>
        {allFilled && (
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            exit={{ scaleX: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' as const }}
            className="h-px"
            style={{
              background: 'linear-gradient(to right, transparent, #c9a84c, #e8c96d, #c9a84c, transparent)',
              transformOrigin: 'center',
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
