'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useBookingStore } from '@/store/bookingStore';
import { t } from '../i18n';
import { FONT_BODY, FAINT, mix } from './ui';

// "Your choice" as slot machine windows: every new choice rolls in like a reel.
export default function BookingSummaryCard() {
  const {
    selectedService,
    selectedServices,
    selectedEmployeeId,
    prikazZaposlenih,
    language,
    anyPerson,
    selectedTime,
    employeesUI,
    currentStep,
  } = useBookingStore();

  const selectedEmployee = employeesUI.find((e) => e.id === selectedEmployeeId);
  const services = selectedServices.length > 0 ? selectedServices : selectedService ? [selectedService] : [];

  const items = [
    {
      label: t(language, 'fieldService'),
      value: services.length > 0 ? services.map((s) => s.naziv).join(' + ') : null,
      suit: '♠',
    },
    // With the employee step hidden there is nothing to show here.
    ...(prikazZaposlenih
      ? [{
          label: t(language, 'fieldSpecialist'),
          value: anyPerson ? t(language, 'anyoneAvailable') : selectedEmployee?.label ?? null,
          suit: '♥',
        }]
      : []),
    {
      label: t(language, 'fieldTime'),
      value: selectedTime ?? null,
      suit: '♦',
    },
  ];

  const filledCount = items.filter((i) => i.value !== null).length;
  const allFilled = filledCount === items.length;

  // Only show once something is chosen.
  if (currentStep < 2 && filledCount === 0) return null;

  return (
    <div
      className="relative overflow-hidden rounded-[16px] p-1.5"
      style={{
        background: 'linear-gradient(180deg, rgba(255,255,255,0.07), rgba(255,255,255,0.02))',
        boxShadow: allFilled
          ? `inset 0 0 0 1px ${mix('--cx-glow', 55)}, 0 0 30px -10px var(--cx-glow)`
          : 'inset 0 0 0 1px rgba(255,255,255,0.08)',
        transition: 'box-shadow 0.6s',
      }}
    >
      <div className="flex gap-1.5">
        {items.map((item) => (
          <div
            key={item.label}
            className="relative min-w-0 flex-1 overflow-hidden rounded-[11px] px-3 pb-2.5 pt-2"
            style={{
              background: 'linear-gradient(180deg, #0c0c10 0%, #16161c 50%, #0c0c10 100%)',
              boxShadow: item.value ? `inset 0 0 0 1px ${mix('--cx-glow', 30)}` : 'inset 0 0 0 1px rgba(255,255,255,0.05)',
              transition: 'box-shadow 0.4s',
            }}
          >
            <p className="cx-label truncate" style={{ fontSize: '0.6rem', letterSpacing: '0.16em', color: item.value ? 'var(--cx-glow)' : FAINT }}>
              {item.suit} {item.label}
            </p>
            <div className="relative mt-1 h-[22px] overflow-hidden">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.p
                  key={item.value ?? 'empty'}
                  initial={{ y: -26, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 26, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 380, damping: 22 }}
                  className="truncate text-[14px] font-semibold leading-[22px]"
                  style={{ fontFamily: FONT_BODY, color: item.value ? '#F6F3EE' : 'rgba(246,243,238,0.18)' }}
                >
                  {item.value ?? '· · ·'}
                </motion.p>
              </AnimatePresence>
            </div>
            {/* Glass shine over the reel window. */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-0 h-1/2"
              style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.05), transparent)' }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
