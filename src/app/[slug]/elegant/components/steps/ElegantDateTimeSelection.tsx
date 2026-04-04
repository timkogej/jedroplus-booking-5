'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isToday,
  isBefore,
  startOfDay,
  getDay,
} from 'date-fns';
import { sl } from 'date-fns/locale';
import { useBookingStore } from '@/store/bookingStore';
import { fetchTimeSlots } from '@/lib/api';

interface Props {
  companySlug?: string;
}

const WEEK_DAYS = ['Po', 'To', 'Sr', 'Če', 'Pe', 'So', 'Ne'];

const slideVariants: Variants = {
  enter: (d: number) => ({ x: d > 0 ? 20 : -20, opacity: 0 }),
  center: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.22, ease: 'easeOut' as const },
  },
  exit: (d: number) => ({
    x: d < 0 ? 20 : -20,
    opacity: 0,
    transition: { duration: 0.18 },
  }),
};

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.28, ease: 'easeOut' as const },
  },
};

export default function ElegantDateTimeSelection({ companySlug }: Props) {
  const {
    selectedDate,
    selectedTime,
    selectedEmployeeId,
    anyPerson,
    eligibleEmployeeIds,
    selectedService,
    selectDate,
    selectTime,
    theme,
  } = useBookingStore();

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [direction, setDirection] = useState(0);
  const [timeSlots, setTimeSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const startDayOfWeek = getDay(monthStart);
    const pad = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;
    return [...Array(pad).fill(null), ...days] as (Date | null)[];
  }, [currentMonth]);

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

  const today = startOfDay(new Date());
  const isPrevDisabled = isBefore(endOfMonth(subMonths(currentMonth, 1)), today);

  const navigateMonth = (delta: number) => {
    setDirection(delta);
    setCurrentMonth(delta > 0 ? addMonths(currentMonth, 1) : subMonths(currentMonth, 1));
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      {/* Heading */}
      <motion.div variants={itemVariants} className="mb-6">
        <h2
          style={{
            fontFamily: 'var(--font-playfair)',
            fontSize: '1.75rem',
            fontWeight: 400,
            color: '#111111',
            lineHeight: 1.2,
          }}
        >
          Izberi <span style={{ color: theme.primaryColor }}>termin</span>
        </h2>
        <p
          className="mt-2"
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '0.9rem',
            color: '#6B7280',
          }}
        >
          Izberite željeni datum in uro
        </p>
      </motion.div>

      {/* Two-column layout on desktop */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Calendar */}
        <motion.div variants={itemVariants}>
          {/* ── Mobile: elegant horizontal date strip ──────── */}
          <div className="md:hidden">
            {/* Compact month nav */}
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={() => !isPrevDisabled && navigateMonth(-1)}
                disabled={isPrevDisabled}
                className="w-7 h-7 rounded-full flex items-center justify-center"
                style={{
                  color: isPrevDisabled ? '#D1D5DB' : '#9CA3AF',
                  backgroundColor: isPrevDisabled ? 'transparent' : '#F9FAFB',
                  border: `1px solid ${isPrevDisabled ? 'transparent' : '#E5E7EB'}`,
                  fontSize: '1rem',
                  cursor: isPrevDisabled ? 'not-allowed' : 'pointer',
                }}
              >
                ‹
              </button>
              <span
                className="capitalize"
                style={{
                  fontFamily: 'var(--font-inter)',
                  fontSize: '0.85rem',
                  fontWeight: 500,
                  color: '#374151',
                }}
              >
                {format(currentMonth, 'LLLL yyyy', { locale: sl })}
              </span>
              <button
                onClick={() => navigateMonth(1)}
                className="w-7 h-7 rounded-full flex items-center justify-center"
                style={{
                  color: '#9CA3AF',
                  backgroundColor: '#F9FAFB',
                  border: '1px solid #E5E7EB',
                  fontSize: '1rem',
                  cursor: 'pointer',
                }}
              >
                ›
              </button>
            </div>

            {/* Horizontal date pills */}
            <div className="elegant-date-strip flex gap-1.5 overflow-x-auto pb-1">
              {calendarDays.map((day) => {
                if (!day) return null;
                const isDisabled = isBefore(day, today);
                const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
                const isTodayDate = isToday(day);
                const dow = getDay(day);
                const weekdayAbbr = WEEK_DAYS[dow === 0 ? 6 : dow - 1];

                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => !isDisabled && selectDate(day)}
                    disabled={isDisabled}
                    className="elegant-date-pill flex-shrink-0 flex flex-col items-center justify-center gap-0.5"
                    style={{
                      backgroundColor: isSelected
                        ? theme.primaryColor
                        : isTodayDate
                        ? `${theme.primaryColor}08`
                        : 'white',
                      border: `1px solid ${
                        isSelected
                          ? theme.primaryColor
                          : isTodayDate
                          ? `${theme.primaryColor}30`
                          : '#EFEFEF'
                      }`,
                      color: isDisabled ? '#D1D5DB' : isSelected ? 'white' : '#374151',
                      boxShadow: isSelected
                        ? `0 2px 8px ${theme.primaryColor}30`
                        : '0 1px 2px rgba(0,0,0,0.04)',
                      opacity: isDisabled ? 0.45 : 1,
                      cursor: isDisabled ? 'not-allowed' : 'pointer',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: 'var(--font-inter)',
                        fontSize: '0.55rem',
                        letterSpacing: '0.02em',
                        color: isSelected ? 'rgba(255,255,255,0.7)' : '#9CA3AF',
                        lineHeight: 1,
                      }}
                    >
                      {weekdayAbbr}
                    </span>
                    <span
                      style={{
                        fontFamily: 'var(--font-inter)',
                        fontSize: '0.9rem',
                        fontWeight: isSelected || isTodayDate ? 600 : 400,
                        lineHeight: 1,
                      }}
                    >
                      {format(day, 'd')}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Desktop: full calendar card ────────────────── */}
          <div
            className="hidden md:block rounded-xl border overflow-hidden"
            style={{
              borderColor: '#E5E7EB',
              backgroundColor: 'white',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}
          >
            {/* Month navigation */}
            <div
              className="flex items-center justify-between px-4 py-3 border-b"
              style={{ borderBottomColor: '#F3F4F6' }}
            >
              <button
                onClick={() => !isPrevDisabled && navigateMonth(-1)}
                disabled={isPrevDisabled}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                style={{
                  backgroundColor: isPrevDisabled ? 'transparent' : '#F9FAFB',
                  color: isPrevDisabled ? '#D1D5DB' : '#6B7280',
                  cursor: isPrevDisabled ? 'not-allowed' : 'pointer',
                  border: '1px solid',
                  borderColor: isPrevDisabled ? '#F3F4F6' : '#E5E7EB',
                  fontSize: '1rem',
                }}
              >
                ‹
              </button>

              <AnimatePresence mode="wait" custom={direction}>
                <motion.h3
                  key={format(currentMonth, 'yyyy-MM')}
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  className="capitalize"
                  style={{
                    fontFamily: 'var(--font-inter)',
                    fontSize: '0.9rem',
                    fontWeight: 500,
                    color: '#1F2937',
                  }}
                >
                  {format(currentMonth, 'LLLL yyyy', { locale: sl })}
                </motion.h3>
              </AnimatePresence>

              <button
                onClick={() => navigateMonth(1)}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                style={{
                  backgroundColor: '#F9FAFB',
                  color: '#6B7280',
                  cursor: 'pointer',
                  border: '1px solid #E5E7EB',
                  fontSize: '1rem',
                }}
              >
                ›
              </button>
            </div>

            <div className="p-3">
              {/* Weekday headers */}
              <div className="grid grid-cols-7 mb-1">
                {WEEK_DAYS.map((d) => (
                  <div
                    key={d}
                    className="text-center py-1"
                    style={{
                      fontFamily: 'var(--font-inter)',
                      fontSize: '0.7rem',
                      fontWeight: 500,
                      color: '#9CA3AF',
                      letterSpacing: '0.03em',
                    }}
                  >
                    {d}
                  </div>
                ))}
              </div>

              {/* Calendar days */}
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={format(currentMonth, 'yyyy-MM')}
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  className="grid grid-cols-7 gap-0.5"
                >
                  {calendarDays.map((day, i) => {
                    if (!day) return <div key={`e-${i}`} className="aspect-square" />;

                    const isDisabled = isBefore(day, today);
                    const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
                    const isTodayDate = isToday(day);
                    const isWeekend = getDay(day) === 0 || getDay(day) === 6;

                    return (
                      <motion.button
                        key={day.toISOString()}
                        onClick={() => !isDisabled && selectDate(day)}
                        disabled={isDisabled}
                        className="elegant-cal-day"
                        style={{
                          color: isDisabled
                            ? '#D1D5DB'
                            : isSelected
                            ? 'white'
                            : isWeekend
                            ? '#6B7280'
                            : '#374151',
                          backgroundColor: isSelected ? theme.primaryColor : 'transparent',
                          boxShadow: isSelected ? `0 2px 8px ${theme.primaryColor}40` : 'none',
                          borderColor:
                            isTodayDate && !isSelected ? theme.primaryColor : 'transparent',
                          borderWidth: '2px',
                          fontWeight: isTodayDate ? 500 : 400,
                          cursor: isDisabled ? 'not-allowed' : 'pointer',
                        }}
                        whileHover={
                          !isDisabled && !isSelected
                            ? { backgroundColor: `${theme.primaryColor}12`, scale: 1.05 }
                            : {}
                        }
                        whileTap={!isDisabled ? { scale: 0.94 } : {}}
                      >
                        {format(day, 'd')}
                        {isTodayDate && !isSelected && (
                          <span
                            className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                            style={{ backgroundColor: theme.primaryColor }}
                          />
                        )}
                      </motion.button>
                    );
                  })}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

        {/* Time slots */}
        <motion.div
          variants={itemVariants}
          className="rounded-xl border overflow-hidden"
          style={{
            borderColor: '#E5E7EB',
            backgroundColor: 'white',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}
        >
          {/* Header */}
          <div
            className="px-4 py-3 border-b"
            style={{ borderBottomColor: '#F3F4F6' }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p
                  style={{
                    fontFamily: 'var(--font-inter)',
                    fontSize: '0.7rem',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: '#9CA3AF',
                  }}
                >
                  Prosti termini
                </p>
                {selectedDate ? (
                  <p
                    className="mt-0.5 capitalize"
                    style={{
                      fontFamily: 'var(--font-inter)',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      color: '#1F2937',
                    }}
                  >
                    {format(selectedDate, 'd. MMMM yyyy', { locale: sl })}
                  </p>
                ) : (
                  <p
                    className="mt-0.5"
                    style={{
                      fontFamily: 'var(--font-inter)',
                      fontSize: '0.875rem',
                      color: '#9CA3AF',
                    }}
                  >
                    Izberite datum
                  </p>
                )}
              </div>

              {selectedDate && !loadingSlots && timeSlots.length > 0 && (
                <div
                  className="px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: `${theme.secondaryColor ?? theme.primaryColor}12`,
                    border: `1px solid ${theme.secondaryColor ?? theme.primaryColor}30`,
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--font-inter)',
                      fontSize: '0.7rem',
                      color: theme.secondaryColor ?? theme.primaryColor,
                    }}
                  >
                    {timeSlots.length}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Slot list */}
          <div className="overflow-y-auto elegant-scroll" style={{ maxHeight: '280px' }}>
            {!selectedDate ? (
              <div className="flex items-center justify-center py-12">
                <p
                  style={{
                    fontFamily: 'var(--font-inter)',
                    fontSize: '0.875rem',
                    color: '#D1D5DB',
                  }}
                >
                  Izberite datum v koledarju
                </p>
              </div>
            ) : loadingSlots ? (
              <div className="p-4 space-y-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-11 rounded-lg animate-pulse"
                    style={{ backgroundColor: '#F3F4F6' }}
                  />
                ))}
              </div>
            ) : timeSlots.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <p
                    style={{
                      fontFamily: 'var(--font-inter)',
                      fontSize: '0.875rem',
                      color: '#9CA3AF',
                    }}
                  >
                    Ni prostih terminov
                  </p>
                  <p
                    className="mt-1"
                    style={{
                      fontFamily: 'var(--font-inter)',
                      fontSize: '0.8rem',
                      color: '#D1D5DB',
                    }}
                  >
                    Izberite drug datum
                  </p>
                </div>
              </div>
            ) : (
              timeSlots.map((slot, i) => {
                const isSelected = selectedTime === slot;
                return (
                  <motion.button
                    key={slot}
                    onClick={() => selectTime(slot)}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.025, ease: 'easeOut' as const }}
                    className="w-full px-4 py-3 flex items-center justify-between border-b last:border-b-0 transition-colors"
                    style={{
                      borderBottomColor: '#F9FAFB',
                      backgroundColor: isSelected ? `${theme.primaryColor}06` : 'transparent',
                    }}
                    whileTap={{ scale: 0.995 }}
                  >
                    <span
                      className="font-medium"
                      style={{
                        fontFamily: 'var(--font-inter)',
                        fontSize: '0.9rem',
                        color: isSelected ? theme.primaryColor : '#374151',
                      }}
                    >
                      {slot}
                    </span>

                    {/* Radio indicator */}
                    <div
                      className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                      style={{ borderColor: isSelected ? theme.primaryColor : '#D1D5DB' }}
                    >
                      {isSelected && (
                        <div
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: theme.primaryColor }}
                        />
                      )}
                    </div>
                  </motion.button>
                );
              })
            )}
          </div>
        </motion.div>
      </div>

      {/* Selection confirmation strip */}
      <AnimatePresence>
        {selectedDate && selectedTime && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.3 }}
            className="mt-4 px-4 py-3 rounded-xl flex items-center gap-3"
            style={{
              backgroundColor: `${theme.primaryColor}08`,
              border: `1px solid ${theme.primaryColor}20`,
            }}
          >
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: theme.primaryColor }}
            >
              <span style={{ color: 'white', fontSize: '0.7rem' }}>✓</span>
            </div>
            <p
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: '0.875rem',
                color: '#374151',
              }}
            >
              <span className="font-medium capitalize">
                {format(selectedDate, 'd. MMMM yyyy', { locale: sl })}
              </span>{' '}
              ob{' '}
              <span className="font-medium" style={{ color: theme.primaryColor }}>
                {selectedTime}
              </span>
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
