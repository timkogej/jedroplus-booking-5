'use client';

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { format, isSameDay, isToday, isBefore, startOfDay } from 'date-fns';
import { sl } from 'date-fns/locale';
import { useBookingStore } from '@/store/bookingStore';
import { fetchTimeSlots } from '@/lib/api';

interface Props {
  companySlug?: string;
}

const slotVariants: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: 'spring', stiffness: 400, damping: 26 },
  },
};

const DAYS_TO_SHOW = 60;
const CARD_W = 76; // px — card width
const CARD_GAP = 8; // px — gap between cards

function generateDates(count: number): Date[] {
  const today = startOfDay(new Date());
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return d;
  });
}

export default function ModernDateTimeSelection({ companySlug }: Props) {
  const {
    theme,
    selectedDate,
    selectedTime,
    selectedEmployeeId,
    anyPerson,
    eligibleEmployeeIds,
    selectedService,
    selectDate,
    selectTime,
  } = useBookingStore();

  const [timeSlots, setTimeSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const dates = useMemo(() => generateDates(DAYS_TO_SHOW), []);
  const today = useMemo(() => startOfDay(new Date()), []);

  // Fetch time slots when date changes
  useEffect(() => {
    if (!selectedDate || !companySlug || !selectedService) {
      setTimeSlots([]);
      return;
    }
    setLoadingSlots(true);
    fetchTimeSlots(
      companySlug,
      format(selectedDate, 'yyyy-MM-dd'),
      selectedService.id,
      selectedEmployeeId,
      anyPerson,
      eligibleEmployeeIds,
    )
      .then(setTimeSlots)
      .catch(() => setTimeSlots([]))
      .finally(() => setLoadingSlots(false));
  }, [selectedDate, companySlug, selectedEmployeeId, anyPerson, selectedService, eligibleEmployeeIds]);

  // Scroll selected date into view on initial render
  useEffect(() => {
    if (selectedDate && scrollRef.current) {
      const idx = dates.findIndex((d) => isSameDay(d, selectedDate));
      if (idx >= 0) {
        const offset = idx * (CARD_W + CARD_GAP) - scrollRef.current.offsetWidth / 2 + CARD_W / 2;
        scrollRef.current.scrollTo({ left: Math.max(0, offset), behavior: 'smooth' });
      }
    }
  }, []); // only on mount

  const scrollBy = useCallback((direction: number) => {
    scrollRef.current?.scrollBy({ left: direction * (CARD_W + CARD_GAP) * 5, behavior: 'smooth' });
  }, []);

  const handleDateSelect = useCallback(
    (date: Date) => {
      selectDate(date);
      // Keep the selected card roughly centered
      if (scrollRef.current) {
        const idx = dates.findIndex((d) => isSameDay(d, date));
        if (idx >= 0) {
          const offset = idx * (CARD_W + CARD_GAP) - scrollRef.current.offsetWidth / 2 + CARD_W / 2;
          scrollRef.current.scrollTo({ left: Math.max(0, offset), behavior: 'smooth' });
        }
      }
    },
    [dates, selectDate],
  );

  return (
    <div>
      {/* Heading */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22 }}
        className="mb-8"
      >
        <h2
          className="text-3xl font-bold mb-2"
          style={{ color: 'var(--t-primary)', fontFamily: 'var(--font-dm-sans)' }}
        >
          Izberi{' '}
          <span
            className="modern-gradient-text"
            style={{
              backgroundImage: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})`,
            }}
          >
            termin
          </span>
        </h2>
        <p className="text-sm" style={{ color: 'var(--t-muted)', fontFamily: 'var(--font-inter)' }}>
          Izberite željeni datum in uro
        </p>
      </motion.div>

      {/* ── Horizontal date strip ── */}
      <motion.div
        className="mb-6"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, delay: 0.06 }}
      >
        <div className="relative flex items-center gap-2">
          {/* Left arrow */}
          <button
            onClick={() => scrollBy(-1)}
            className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
            style={{
              backgroundColor: 'var(--s2)',
              border: '1px solid var(--b2)',
              color: 'var(--t-muted)',
            }}
            aria-label="Prejšnji teden"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Scrollable date row */}
          <div className="relative flex-1 overflow-hidden">
            {/* Fade edges */}
            <div
              className="absolute left-0 top-0 bottom-0 w-6 z-10 pointer-events-none"
              style={{ background: `linear-gradient(to right, ${theme.bgFrom}ee, transparent)` }}
            />
            <div
              className="absolute right-0 top-0 bottom-0 w-6 z-10 pointer-events-none"
              style={{ background: `linear-gradient(to left, ${theme.bgTo}ee, transparent)` }}
            />

            <div
              ref={scrollRef}
              className="flex gap-2 overflow-x-auto py-1 modern-scrollbar-hide"
              style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' as const }}
            >
              {dates.map((date, i) => {
                const isSelected = selectedDate ? isSameDay(date, selectedDate) : false;
                const isTodayDate = isToday(date);
                const isPast = isBefore(date, today);

                return (
                  <button
                    key={i}
                    onClick={() => !isPast && handleDateSelect(date)}
                    disabled={isPast}
                    className="flex-shrink-0 flex flex-col items-center py-3 rounded-2xl transition-all duration-150"
                    style={{
                      width: CARD_W,
                      scrollSnapAlign: 'center',
                      backgroundColor: isSelected ? theme.primaryColor : 'var(--s2)',
                      border: isTodayDate && !isSelected
                        ? `2px solid ${theme.primaryColor}70`
                        : '2px solid transparent',
                      boxShadow: isSelected ? `0 6px 20px ${theme.primaryColor}40` : 'none',
                      opacity: isPast ? 0.35 : 1,
                      cursor: isPast ? 'not-allowed' : 'pointer',
                      transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                    }}
                  >
                    <span
                      className="text-xs font-medium mb-0.5"
                      style={{
                        color: isSelected ? 'rgba(255,255,255,0.75)' : 'var(--t-faint)',
                        fontFamily: 'var(--font-inter)',
                        fontSize: '0.65rem',
                        letterSpacing: '0.05em',
                      }}
                    >
                      {format(date, 'EEE', { locale: sl }).toUpperCase().slice(0, 3)}
                    </span>
                    <span
                      className="font-bold leading-none my-0.5"
                      style={{
                        color: isSelected ? '#ffffff' : 'var(--t-primary)',
                        fontFamily: 'var(--font-dm-sans)',
                        fontSize: '1.3rem',
                      }}
                    >
                      {date.getDate()}
                    </span>
                    <span
                      className="text-xs"
                      style={{
                        color: isSelected ? 'rgba(255,255,255,0.75)' : 'var(--t-faint)',
                        fontFamily: 'var(--font-inter)',
                        fontSize: '0.68rem',
                      }}
                    >
                      {format(date, 'MMM', { locale: sl })}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right arrow */}
          <button
            onClick={() => scrollBy(1)}
            className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
            style={{
              backgroundColor: 'var(--s2)',
              border: '1px solid var(--b2)',
              color: 'var(--t-muted)',
            }}
            aria-label="Naslednji teden"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </motion.div>

      {/* ── Time slots ── */}
      <AnimatePresence>
        {selectedDate && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
          >
            <h3
              className="font-semibold mb-4 text-sm"
              style={{ color: 'var(--t-primary)', fontFamily: 'var(--font-inter)' }}
            >
              Prosti termini &mdash;{' '}
              <span className="font-normal capitalize" style={{ color: 'var(--t-muted)' }}>
                {format(selectedDate, 'd. MMMM', { locale: sl })}
              </span>
            </h3>

            {loadingSlots ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-11 rounded-xl modern-slot-shimmer"
                    style={{ backgroundColor: 'var(--s2)', animationDelay: `${i * 0.07}s` }}
                  />
                ))}
              </div>
            ) : timeSlots.length > 0 ? (
              <motion.div
                className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2"
                initial="hidden"
                animate="visible"
                variants={{ visible: { transition: { staggerChildren: 0.03 } } }}
              >
                {timeSlots.map((slot) => {
                  const isSelected = selectedTime === slot;
                  return (
                    <motion.button
                      key={slot}
                      onClick={() => selectTime(slot)}
                      variants={slotVariants}
                      className="py-3 px-2 rounded-xl text-center font-medium text-sm"
                      style={{
                        backgroundColor: isSelected ? theme.primaryColor : 'var(--s2)',
                        color: isSelected ? '#ffffff' : 'var(--t-primary)',
                        border: `1px solid ${isSelected ? theme.primaryColor : 'var(--b2)'}`,
                        boxShadow: isSelected ? `0 4px 14px ${theme.primaryColor}40` : 'none',
                        fontFamily: 'var(--font-inter)',
                        transition: 'background-color 0.15s, color 0.15s, box-shadow 0.15s',
                      }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {slot}
                    </motion.button>
                  );
                })}
              </motion.div>
            ) : (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-8 text-sm"
                style={{ color: 'var(--t-muted)', fontFamily: 'var(--font-inter)' }}
              >
                Ni prostih terminov za izbrani dan
              </motion.p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Selected slot confirmation strip ── */}
      <AnimatePresence>
        {selectedDate && selectedTime && (
          <motion.div
            className="mt-5 px-4 py-3.5 rounded-2xl flex items-center gap-3"
            style={{
              backgroundColor: `${theme.primaryColor}15`,
              border: `1px solid ${theme.primaryColor}30`,
            }}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: theme.primaryColor }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 22 }}
            >
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </motion.div>
            <p
              className="text-sm capitalize"
              style={{ color: 'var(--t-soft)', fontFamily: 'var(--font-inter)' }}
            >
              <span className="font-semibold">
                {format(selectedDate, 'd. MMMM yyyy', { locale: sl })}
              </span>{' '}
              ob{' '}
              <span className="font-semibold" style={{ color: theme.primaryColor }}>
                {selectedTime}
              </span>
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
