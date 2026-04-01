'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
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
  addDays,
} from 'date-fns';
import { sl } from 'date-fns/locale';
import { useBookingStore } from '@/store/bookingStore';
import { fetchTimeSlots } from '@/lib/api';
import { getContrastMode } from '../ClassicLayout';

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

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [direction, setDirection] = useState(0);
  const [timeSlots, setTimeSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const dateScrollRef = useRef<HTMLDivElement>(null);

  // ── Calendar data ──
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const startDow = getDay(monthStart);
    const pad = startDow === 0 ? 6 : startDow - 1;
    return [...Array(pad).fill(null), ...days] as (Date | null)[];
  }, [currentMonth]);

  // ── Mobile swiper: next 30 days ──
  const swiperDates = useMemo(() => {
    const today = startOfDay(new Date());
    return Array.from({ length: 30 }, (_, i) => addDays(today, i));
  }, []);

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

  const today = startOfDay(new Date());
  const isPrevDisabled = isBefore(endOfMonth(subMonths(currentMonth, 1)), today);

  const navigateMonth = (delta: number) => {
    setDirection(delta);
    setCurrentMonth((prev) => delta > 0 ? addMonths(prev, 1) : subMonths(prev, 1));
  };

  const scrollDates = (dir: number) => {
    if (dateScrollRef.current) {
      dateScrollRef.current.scrollBy({ left: dir * 210, behavior: 'smooth' });
    }
  };

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
          Izberi želeni termin
        </p>
      </motion.div>

      {/* ══ MOBILE: Horizontal Date Swiper ══════════════════════════════ */}
      <motion.div variants={itemVariants} className="md:hidden mb-6">
        <div className="relative">
          {/* Left arrow */}
          <button
            onClick={() => scrollDates(-1)}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center"
            style={{ marginBottom: '8px' }}
          >
            <span className="text-gray-500 text-sm">‹</span>
          </button>

          {/* Scrollable dates */}
          <div
            ref={dateScrollRef}
            className="flex gap-2.5 overflow-x-auto px-10 py-1 classic-scrollbar-hide classic-date-swiper"
          >
            {swiperDates.map((date, i) => {
              const isSelected = selectedDate ? isSameDay(date, selectedDate) : false;
              const isTodayDate = isToday(date);
              const dayName = format(date, 'EEE', { locale: sl });
              const dayNum = format(date, 'd');
              const monthName = format(date, 'MMM', { locale: sl });

              return (
                <motion.button
                  key={i}
                  onClick={() => selectDate(date)}
                  className="flex-shrink-0 w-[72px] py-3 rounded-2xl text-center classic-date-chip"
                  style={{
                    backgroundColor: isSelected
                      ? theme.primaryColor
                      : 'rgba(255,255,255,0.92)',
                    border: isTodayDate && !isSelected
                      ? `2px solid ${theme.primaryColor}`
                      : '2px solid transparent',
                    boxShadow: isSelected
                      ? `0 8px 24px ${theme.primaryColor}40`
                      : '0 2px 8px rgba(0,0,0,0.06)',
                  }}
                  whileTap={{ scale: 0.95 }}
                >
                  <p
                    className="text-xs font-medium uppercase mb-1"
                    style={{
                      fontFamily: 'var(--font-nunito-sans)',
                      color: isSelected ? 'rgba(255,255,255,0.75)' : '#9CA3AF',
                    }}
                  >
                    {dayName}
                  </p>
                  <p
                    className="text-2xl font-bold leading-none mb-1"
                    style={{
                      fontFamily: 'var(--font-nunito)',
                      color: isSelected ? '#ffffff' : '#1F2937',
                    }}
                  >
                    {dayNum}
                  </p>
                  <p
                    className="text-xs capitalize"
                    style={{
                      fontFamily: 'var(--font-nunito-sans)',
                      color: isSelected ? 'rgba(255,255,255,0.7)' : '#9CA3AF',
                    }}
                  >
                    {monthName}
                  </p>
                </motion.button>
              );
            })}
          </div>

          {/* Right arrow */}
          <button
            onClick={() => scrollDates(1)}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center"
          >
            <span className="text-gray-500 text-sm">›</span>
          </button>
        </div>
      </motion.div>

      {/* ══ DESKTOP: Calendar grid ═══════════════════════════════════════ */}
      <motion.div variants={itemVariants} className="hidden md:block mb-6">
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: 'rgba(255,255,255,0.95)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          }}
        >
          {/* Month header */}
          <div
            className="flex items-center justify-between px-5 py-4 border-b"
            style={{ borderColor: 'rgba(0,0,0,0.06)' }}
          >
            <button
              onClick={() => !isPrevDisabled && navigateMonth(-1)}
              disabled={isPrevDisabled}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
              style={{
                backgroundColor: isPrevDisabled ? 'transparent' : `${theme.primaryColor}12`,
                color: isPrevDisabled ? '#D1D5DB' : theme.primaryColor,
                cursor: isPrevDisabled ? 'not-allowed' : 'pointer',
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
                className="font-bold capitalize text-gray-800"
                style={{ fontFamily: 'var(--font-nunito)' }}
              >
                {format(currentMonth, 'LLLL yyyy', { locale: sl })}
              </motion.h3>
            </AnimatePresence>

            <button
              onClick={() => navigateMonth(1)}
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{
                backgroundColor: `${theme.primaryColor}12`,
                color: theme.primaryColor,
              }}
            >
              ›
            </button>
          </div>

          <div className="px-4 py-4">
            {/* Weekday labels */}
            <div className="grid grid-cols-7 mb-2">
              {WEEK_DAYS.map((d) => (
                <div
                  key={d}
                  className="text-center text-xs font-medium py-1"
                  style={{ fontFamily: 'var(--font-nunito-sans)', color: '#9CA3AF' }}
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
                className="grid grid-cols-7 gap-1"
              >
                {calendarDays.map((day, i) => {
                  if (!day) return <div key={`e-${i}`} className="aspect-square" />;

                  const isDisabled = isBefore(day, today);
                  const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
                  const isTodayDate = isToday(day);

                  return (
                    <motion.button
                      key={day.toISOString()}
                      onClick={() => !isDisabled && selectDate(day)}
                      disabled={isDisabled}
                      className="aspect-square rounded-xl flex items-center justify-center text-sm font-medium relative transition-all"
                      style={{
                        fontFamily: 'var(--font-nunito-sans)',
                        backgroundColor: isSelected ? theme.primaryColor : 'transparent',
                        color: isDisabled
                          ? '#E5E7EB'
                          : isSelected
                          ? '#ffffff'
                          : '#374151',
                        boxShadow: isSelected ? `0 4px 16px ${theme.primaryColor}40` : 'none',
                        border: isTodayDate && !isSelected
                          ? `1.5px solid ${theme.primaryColor}`
                          : '1.5px solid transparent',
                        cursor: isDisabled ? 'not-allowed' : 'pointer',
                      }}
                      whileHover={!isDisabled ? { backgroundColor: isSelected ? theme.primaryColor : `${theme.primaryColor}15`, scale: 1.06 } : {}}
                      whileTap={!isDisabled ? { scale: 0.94 } : {}}
                    >
                      {format(day, 'd')}
                      {isTodayDate && !isSelected && (
                        <span
                          className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
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

      {/* ══ Time slots ═══════════════════════════════════════════════════ */}
      <motion.div variants={itemVariants}>
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: 'rgba(255,255,255,0.95)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          }}
        >
          {/* Header */}
          <div
            className="px-5 py-4 border-b flex items-center justify-between"
            style={{ borderColor: 'rgba(0,0,0,0.06)' }}
          >
            <div>
              <p
                className="text-xs uppercase tracking-wide text-gray-400 mb-0.5"
                style={{ fontFamily: 'var(--font-nunito-sans)' }}
              >
                Prosti termini
              </p>
              {selectedDate ? (
                <p
                  className="font-bold text-gray-800 capitalize"
                  style={{ fontFamily: 'var(--font-nunito)' }}
                >
                  {format(selectedDate, 'd. MMMM yyyy', { locale: sl })}
                </p>
              ) : (
                <p
                  className="text-sm text-gray-400 italic"
                  style={{ fontFamily: 'var(--font-nunito-sans)' }}
                >
                  Izberite datum zgoraj
                </p>
              )}
            </div>

            {selectedDate && !loadingSlots && timeSlots.length > 0 && (
              <div
                className="px-3 py-1 rounded-full text-xs font-semibold"
                style={{
                  backgroundColor: `${theme.primaryColor}15`,
                  color: theme.primaryColor,
                  fontFamily: 'var(--font-nunito-sans)',
                }}
              >
                {timeSlots.length} {timeSlots.length === 1 ? 'termin' : 'terminov'}
              </div>
            )}
          </div>

          {/* Slot content */}
          <div className="p-4">
            {!selectedDate ? (
              <div className="text-center py-8">
                <p
                  className="text-gray-300 text-3xl mb-3"
                  style={{ fontFamily: 'var(--font-nunito)' }}
                >
                  📅
                </p>
                <p
                  className="text-sm text-gray-400"
                  style={{ fontFamily: 'var(--font-nunito-sans)' }}
                >
                  Izberite datum v koledarju
                </p>
              </div>
            ) : loadingSlots ? (
              <div className="grid grid-cols-3 gap-2">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-10 rounded-xl animate-pulse"
                    style={{ backgroundColor: '#F3F4F6' }}
                  />
                ))}
              </div>
            ) : timeSlots.length === 0 ? (
              <div className="text-center py-8">
                <p
                  className="text-gray-300 text-3xl mb-3"
                  style={{ fontFamily: 'var(--font-nunito)' }}
                >
                  😔
                </p>
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
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-56 overflow-y-auto classic-slots-scroll">
                {timeSlots.map((time, i) => {
                  const isSelected = selectedTime === time;
                  return (
                    <motion.button
                      key={time}
                      onClick={() => selectTime(time)}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.025, ease: 'easeOut' as const }}
                      className="py-2.5 px-2 rounded-xl text-sm font-semibold text-center transition-all"
                      style={{
                        fontFamily: 'var(--font-nunito-sans)',
                        backgroundColor: isSelected ? theme.primaryColor : '#F9FAFB',
                        color: isSelected ? '#ffffff' : '#374151',
                        boxShadow: isSelected ? `0 4px 14px ${theme.primaryColor}40` : 'none',
                        border: isSelected ? `2px solid ${theme.primaryColor}` : '2px solid transparent',
                      }}
                      whileHover={!isSelected ? { backgroundColor: `${theme.primaryColor}15`, scale: 1.04 } : {}}
                      whileTap={{ scale: 0.96 }}
                    >
                      {time}
                    </motion.button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Selected summary */}
      <AnimatePresence>
        {selectedDate && selectedTime && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.3 }}
            className="mt-4 flex items-center gap-2 justify-center"
          >
            <span style={{ color: theme.primaryColor, fontSize: '1rem' }}>✓</span>
            <span
              className="text-sm font-medium"
              style={{
                fontFamily: 'var(--font-nunito-sans)',
                color: contrastMode === 'light' ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.7)',
              }}
            >
              {format(selectedDate, 'd. MMMM yyyy', { locale: sl })} ob {selectedTime}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
