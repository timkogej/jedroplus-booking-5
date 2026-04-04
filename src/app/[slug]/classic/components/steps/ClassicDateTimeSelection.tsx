'use client';

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import {
  format,
  isSameDay,
  isToday,
  isBefore,
  startOfDay,
  addDays,
} from 'date-fns';
import { sl } from 'date-fns/locale';
import { useBookingStore } from '@/store/bookingStore';
import { fetchTimeSlots } from '@/lib/api';
import { getContrastMode } from '../ClassicLayout';

interface Props {
  companySlug?: string;
}

const DAYS_TO_SHOW = 60;
const CARD_W = 72;
const CARD_GAP = 8;

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: 'easeOut' as const },
  },
};

const slotVariants: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.2, ease: 'easeOut' as const },
  },
};

function generateDates(count: number): Date[] {
  const today = startOfDay(new Date());
  return Array.from({ length: count }, (_, i) => addDays(today, i));
}

export default function ClassicDateTimeSelection({ companySlug }: Props) {
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

  const contrastMode = getContrastMode(theme.bgFrom, theme.bgTo);
  const textPrimary =
    contrastMode === 'light' ? 'rgba(255,255,255,0.95)' : 'rgba(0,0,0,0.9)';
  const textSecondary =
    contrastMode === 'light' ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.55)';

  const [timeSlots, setTimeSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const dates = useMemo(() => generateDates(DAYS_TO_SHOW), []);
  const today = useMemo(() => startOfDay(new Date()), []);

  // ── Fetch time slots when date changes ──
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
      eligibleEmployeeIds
    )
      .then(setTimeSlots)
      .catch(() => setTimeSlots([]))
      .finally(() => setLoadingSlots(false));
  }, [selectedDate, companySlug, selectedEmployeeId, anyPerson, selectedService, eligibleEmployeeIds]);

  // Center selected date on mount
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
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      {/* Page title */}
      <motion.div variants={itemVariants} className="mb-6">
        <h2
          className="text-3xl font-bold mb-2"
          style={{ fontFamily: 'var(--font-nunito)', color: textPrimary }}
        >
          Izberi{' '}
          <span style={{ color: theme.primaryColor }}>datum in uro</span>
        </h2>
        <p style={{ fontFamily: 'var(--font-nunito-sans)', color: textSecondary }}>
          Izberi željeni termin
        </p>
      </motion.div>

      {/* ── Horizontal date strip ── */}
      <motion.div variants={itemVariants} className="mb-6">
        <div className="flex items-center gap-2">
          {/* Left arrow */}
          <button
            onClick={() => scrollBy(-1)}
            className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center"
            style={{
              backgroundColor: 'rgba(255,255,255,0.92)',
              border: '1.5px solid rgba(0,0,0,0.08)',
              boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
              color: '#6B7280',
            }}
            aria-label="Pomakni nazaj"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Scrollable row */}
          <div className="flex-1 min-w-0">
            <div
              ref={scrollRef}
              className="flex gap-2 overflow-x-auto py-3 px-1 classic-scrollbar-hide"
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
                    className="flex-shrink-0 flex flex-col items-center py-3 rounded-2xl"
                    style={{
                      width: CARD_W,
                      scrollSnapAlign: 'center',
                      backgroundColor: isSelected ? theme.primaryColor : 'rgba(255,255,255,0.92)',
                      border: isTodayDate && !isSelected
                        ? `2px solid ${theme.secondaryColor}`
                        : '2px solid transparent',
                      boxShadow: isSelected
                        ? `0 6px 20px ${theme.primaryColor}45`
                        : '0 2px 8px rgba(0,0,0,0.06)',
                      opacity: isPast ? 0.35 : 1,
                      cursor: isPast ? 'not-allowed' : 'pointer',
                      transform: isSelected ? 'scale(1.06)' : 'scale(1)',
                      transition: 'background-color 0.18s, transform 0.18s, box-shadow 0.18s',
                    }}
                  >
                    <span
                      style={{
                        color: isSelected ? 'rgba(255,255,255,0.72)' : '#9CA3AF',
                        fontFamily: 'var(--font-nunito-sans)',
                        fontSize: '0.62rem',
                        fontWeight: 500,
                        letterSpacing: '0.06em',
                        marginBottom: 2,
                      }}
                    >
                      {format(date, 'EEE', { locale: sl }).toUpperCase().slice(0, 3)}
                    </span>
                    <span
                      style={{
                        color: isSelected ? '#ffffff' : '#1F2937',
                        fontFamily: 'var(--font-nunito)',
                        fontSize: '1.25rem',
                        fontWeight: 700,
                        lineHeight: 1,
                        marginBottom: 3,
                      }}
                    >
                      {date.getDate()}
                    </span>
                    <span
                      style={{
                        color: isSelected ? 'rgba(255,255,255,0.72)' : '#9CA3AF',
                        fontFamily: 'var(--font-nunito-sans)',
                        fontSize: '0.64rem',
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
            className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center"
            style={{
              backgroundColor: 'rgba(255,255,255,0.92)',
              border: '1.5px solid rgba(0,0,0,0.08)',
              boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
              color: '#6B7280',
            }}
            aria-label="Pomakni naprej"
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
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0, y: -6 }}
          >
            {/* Header */}
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                background: 'rgba(255,255,255,0.95)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              }}
            >
              <div
                className="px-5 py-4 border-b flex items-center justify-between"
                style={{ borderColor: 'rgba(0,0,0,0.06)' }}
              >
                <div>
                  <p
                    className="text-xs uppercase tracking-wide mb-0.5"
                    style={{ fontFamily: 'var(--font-nunito-sans)', color: '#9CA3AF' }}
                  >
                    Prosti termini
                  </p>
                  <p
                    className="font-bold text-gray-800 capitalize"
                    style={{ fontFamily: 'var(--font-nunito)' }}
                  >
                    {format(selectedDate, 'd. MMMM yyyy', { locale: sl })}
                  </p>
                </div>

                {!loadingSlots && timeSlots.length > 0 && (
                  <div
                    className="px-3 py-1 rounded-full text-xs font-semibold"
                    style={{
                      backgroundColor: `${theme.secondaryColor}20`,
                      color: theme.secondaryColor,
                      fontFamily: 'var(--font-nunito-sans)',
                    }}
                  >
                    {timeSlots.length} {timeSlots.length === 1 ? 'termin' : 'terminov'}
                  </div>
                )}
              </div>

              {/* Slot content */}
              <div className="p-4">
                {loadingSlots ? (
                  <>
                    {/* Mobile shimmer: single centered column */}
                    <div className="sm:hidden flex flex-col items-center gap-2.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div
                          key={i}
                          className="h-11 rounded-xl animate-pulse w-full max-w-[220px]"
                          style={{ backgroundColor: '#F3F4F6' }}
                        />
                      ))}
                    </div>
                    {/* Desktop shimmer: grid */}
                    <div className="hidden sm:grid sm:grid-cols-4 gap-2">
                      {Array.from({ length: 8 }).map((_, i) => (
                        <div
                          key={i}
                          className="h-10 rounded-xl animate-pulse"
                          style={{ backgroundColor: '#F3F4F6' }}
                        />
                      ))}
                    </div>
                  </>
                ) : timeSlots.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-300 text-3xl mb-3">😔</p>
                    <p
                      className="text-sm text-gray-400"
                      style={{ fontFamily: 'var(--font-nunito-sans)' }}
                    >
                      Ni prostih terminov za ta dan
                    </p>
                    <p
                      className="text-xs text-gray-300 mt-1"
                      style={{ fontFamily: 'var(--font-nunito-sans)' }}
                    >
                      Prosimo izberite drug datum
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Mobile: centered single column, scrollable */}
                    <div className="sm:hidden">
                      <motion.div
                        className="flex flex-col items-center gap-2.5 overflow-y-auto classic-slots-scroll"
                        style={{ maxHeight: '18rem', paddingRight: 4 }}
                        initial="hidden"
                        animate="visible"
                        variants={{ visible: { transition: { staggerChildren: 0.03 } } }}
                      >
                        {timeSlots.map((time) => {
                          const isSelected = selectedTime === time;
                          return (
                            <motion.button
                              key={time}
                              onClick={() => selectTime(time)}
                              variants={slotVariants}
                              className="w-full rounded-xl font-semibold text-sm py-3 text-center"
                              style={{
                                maxWidth: 220,
                                fontFamily: 'var(--font-nunito-sans)',
                                backgroundColor: isSelected ? theme.primaryColor : '#F9FAFB',
                                color: isSelected ? '#ffffff' : '#374151',
                                border: `2px solid ${isSelected ? theme.primaryColor : 'transparent'}`,
                                boxShadow: isSelected ? `0 4px 14px ${theme.primaryColor}40` : 'none',
                                transition: 'background-color 0.15s, color 0.15s, box-shadow 0.15s',
                              }}
                              whileTap={{ scale: 0.95 }}
                            >
                              {time}
                            </motion.button>
                          );
                        })}
                      </motion.div>
                    </div>

                    {/* Desktop: grid */}
                    <motion.div
                      className="hidden sm:grid sm:grid-cols-4 gap-2"
                      initial="hidden"
                      animate="visible"
                      variants={{ visible: { transition: { staggerChildren: 0.03 } } }}
                    >
                      {timeSlots.map((time) => {
                        const isSelected = selectedTime === time;
                        return (
                          <motion.button
                            key={time}
                            onClick={() => selectTime(time)}
                            variants={slotVariants}
                            className="py-2.5 px-2 rounded-xl text-sm font-semibold text-center"
                            style={{
                              fontFamily: 'var(--font-nunito-sans)',
                              backgroundColor: isSelected ? theme.primaryColor : '#F9FAFB',
                              color: isSelected ? '#ffffff' : '#374151',
                              border: `2px solid ${isSelected ? theme.primaryColor : 'transparent'}`,
                              boxShadow: isSelected ? `0 4px 14px ${theme.primaryColor}40` : 'none',
                              transition: 'background-color 0.15s, color 0.15s, box-shadow 0.15s',
                            }}
                            whileHover={!isSelected ? { backgroundColor: `${theme.primaryColor}15`, scale: 1.04 } : {}}
                            whileTap={{ scale: 0.96 }}
                          >
                            {time}
                          </motion.button>
                        );
                      })}
                    </motion.div>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* No date selected placeholder */}
      {!selectedDate && (
        <motion.div variants={itemVariants}>
          <div
            className="rounded-2xl p-8 text-center"
            style={{
              background: 'rgba(255,255,255,0.95)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            }}
          >
            <p className="text-gray-300 text-3xl mb-3">📅</p>
            <p className="text-sm text-gray-400" style={{ fontFamily: 'var(--font-nunito-sans)' }}>
              Izberite datum zgoraj
            </p>
          </div>
        </motion.div>
      )}

      {/* Selected summary */}
      <AnimatePresence>
        {selectedDate && selectedTime && (
          <motion.div
            className="mt-4 px-4 py-3.5 rounded-2xl flex items-center gap-3"
            style={{
              backgroundColor: `${theme.primaryColor}15`,
              border: `1px solid ${theme.primaryColor}30`,
            }}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.3 }}
          >
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: theme.primaryColor }}
            >
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p
              className="text-sm capitalize"
              style={{ fontFamily: 'var(--font-nunito-sans)', color: '#374151' }}
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
    </motion.div>
  );
}
