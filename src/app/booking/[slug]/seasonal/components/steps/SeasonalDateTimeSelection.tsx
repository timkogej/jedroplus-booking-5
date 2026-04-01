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
} from 'date-fns';
import { sl } from 'date-fns/locale';
import { useBookingStore } from '@/store/bookingStore';
import { fetchTimeSlots } from '@/lib/api';
import { SeasonalTheme } from '../decorations/SeasonDetector';

interface Props {
  companySlug?: string;
  seasonalTheme: SeasonalTheme;
}

const WEEK_DAYS = ['Po', 'To', 'Sr', 'Če', 'Pe', 'So', 'Ne'];

const slideVariants: Variants = {
  enter: (d: number) => ({ x: d > 0 ? 24 : -24, opacity: 0 }),
  center: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.22, ease: 'easeOut' as const },
  },
  exit: (d: number) => ({
    x: d < 0 ? 24 : -24,
    opacity: 0,
    transition: { duration: 0.18 },
  }),
};

const slotVariants: Variants = {
  hidden: { opacity: 0, scale: 0.85 },
  visible: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 420, damping: 24 } },
};

function generateMobileDates(): Date[] {
  const dates: Date[] = [];
  const today = new Date();
  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    dates.push(date);
  }
  return dates;
}

export default function SeasonalDateTimeSelection({ companySlug, seasonalTheme }: Props) {
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

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [direction, setDirection] = useState(0);
  const [timeSlots, setTimeSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const mobileDates = useMemo(() => generateMobileDates(), []);

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const startDow = getDay(monthStart);
    const pad = startDow === 0 ? 6 : startDow - 1;
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
  }, [selectedDate, companySlug, selectedEmployeeId, anyPerson, selectedService]);

  const today = startOfDay(new Date());
  const isPrevDisabled = isBefore(endOfMonth(subMonths(currentMonth, 1)), today);

  const navigateMonth = (delta: number) => {
    setDirection(delta);
    setCurrentMonth(delta > 0 ? addMonths(currentMonth, 1) : subMonths(currentMonth, 1));
  };

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8"
      >
        <h2
          className="text-3xl font-bold mb-2"
          style={{
            color: 'var(--t-primary)',
            fontFamily: seasonalTheme.config.headingFont ?? 'var(--font-quicksand)',
          }}
        >
          Izberi{' '}
          <span
            className="seasonal-gradient-text"
            style={{
              backgroundImage: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})`,
            }}
          >
            termin
          </span>
        </h2>
        <p className="text-sm" style={{ color: 'var(--t-muted)', fontFamily: 'var(--font-quicksand)' }}>
          Izberite željeni datum in uro
        </p>
      </motion.div>

      {/* ── MOBILE: Horizontal date swiper ── */}
      <div className="md:hidden mb-6">
        <div className="relative">
          <div
            className="absolute left-0 top-0 bottom-0 w-8 z-10 pointer-events-none"
            style={{ background: `linear-gradient(to right, ${theme.bgFrom}cc, transparent)` }}
          />
          <div
            className="absolute right-0 top-0 bottom-0 w-8 z-10 pointer-events-none"
            style={{ background: `linear-gradient(to left, ${theme.bgTo}cc, transparent)` }}
          />

          <div
            ref={scrollRef}
            className="flex gap-2.5 overflow-x-auto px-4 py-2 seasonal-scrollbar-hide"
            style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' as const }}
          >
            {mobileDates.map((date, index) => {
              const isSelected = selectedDate ? isSameDay(date, selectedDate) : false;
              const isTodayDate = isToday(date);

              return (
                <motion.button
                  key={index}
                  onClick={() => selectDate(date)}
                  className="flex-shrink-0 w-[72px] py-3.5 rounded-2xl text-center"
                  style={{
                    scrollSnapAlign: 'center',
                    backgroundColor: isSelected ? theme.primaryColor : 'var(--s2)',
                    border: isTodayDate && !isSelected
                      ? `2px solid ${theme.primaryColor}60`
                      : '2px solid transparent',
                    boxShadow: isSelected ? `0 6px 20px ${theme.primaryColor}40` : 'none',
                  }}
                  whileTap={{ scale: 0.94 }}
                >
                  <p
                    className="text-xs font-medium mb-0.5"
                    style={{
                      color: isSelected ? 'rgba(255,255,255,0.7)' : 'var(--t-faint)',
                      fontFamily: 'var(--font-quicksand)',
                    }}
                  >
                    {format(date, 'EEE', { locale: sl }).toUpperCase().slice(0, 3)}
                  </p>
                  <p
                    className="text-xl font-bold my-0.5"
                    style={{
                      color: isSelected ? '#ffffff' : 'var(--t-primary)',
                      fontFamily: 'var(--font-quicksand)',
                    }}
                  >
                    {date.getDate()}
                  </p>
                  <p
                    className="text-xs"
                    style={{
                      color: isSelected ? 'rgba(255,255,255,0.7)' : 'var(--t-faint)',
                      fontFamily: 'var(--font-quicksand)',
                    }}
                  >
                    {format(date, 'MMM', { locale: sl })}
                  </p>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── DESKTOP: Calendar grid ── */}
      <div className="hidden md:block mb-6">
        <motion.div
          className="rounded-2xl p-5 seasonal-surface"
          style={{
            backgroundColor: 'var(--s2)',
            border: '1px solid var(--b2)',
          }}
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35 }}
        >
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-5">
            <motion.button
              onClick={() => !isPrevDisabled && navigateMonth(-1)}
              disabled={isPrevDisabled}
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{
                backgroundColor: isPrevDisabled ? 'transparent' : 'var(--s2)',
                border: '1px solid var(--b2)',
                color: isPrevDisabled ? 'var(--t-disabled)' : 'var(--t-muted)',
                cursor: isPrevDisabled ? 'not-allowed' : 'pointer',
              }}
              whileHover={!isPrevDisabled ? { scale: 1.08 } : {}}
              whileTap={!isPrevDisabled ? { scale: 0.92 } : {}}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </motion.button>

            <AnimatePresence mode="wait" custom={direction}>
              <motion.h3
                key={format(currentMonth, 'yyyy-MM')}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="capitalize font-semibold"
                style={{
                  color: 'var(--t-primary)',
                  fontFamily: 'var(--font-quicksand)',
                  fontSize: '0.95rem',
                }}
              >
                {format(currentMonth, 'LLLL yyyy', { locale: sl })}
              </motion.h3>
            </AnimatePresence>

            <motion.button
              onClick={() => navigateMonth(1)}
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{
                backgroundColor: 'var(--s2)',
                border: '1px solid var(--b2)',
                color: 'var(--t-muted)',
                cursor: 'pointer',
              }}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </motion.button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-2">
            {WEEK_DAYS.map((d) => (
              <div
                key={d}
                className="text-center text-xs font-medium py-1"
                style={{ color: 'var(--t-faint)', fontFamily: 'var(--font-quicksand)', letterSpacing: '0.04em' }}
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
                    className="seasonal-cal-day"
                    style={{
                      color: isDisabled
                        ? 'var(--t-disabled)'
                        : isSelected
                        ? '#ffffff'
                        : isWeekend
                        ? 'var(--t-soft)'
                        : 'var(--t-primary)',
                      backgroundColor: isSelected ? theme.primaryColor : 'transparent',
                      boxShadow: isSelected ? `0 3px 10px ${theme.primaryColor}45` : 'none',
                      borderColor: isTodayDate && !isSelected ? `${theme.primaryColor}70` : 'transparent',
                      fontWeight: isTodayDate ? 600 : 400,
                      cursor: isDisabled ? 'not-allowed' : 'pointer',
                      fontFamily: 'var(--font-quicksand)',
                    }}
                    whileHover={
                      !isDisabled && !isSelected
                        ? { backgroundColor: `${theme.primaryColor}18`, scale: 1.08 }
                        : {}
                    }
                    whileTap={!isDisabled ? { scale: 0.92 } : {}}
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
        </motion.div>
      </div>

      {/* Time slots */}
      <AnimatePresence>
        {selectedDate && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
          >
            <h3
              className="font-semibold mb-4 text-sm"
              style={{ color: 'var(--t-primary)', fontFamily: 'var(--font-quicksand)' }}
            >
              Prosti termini &mdash;{' '}
              <span className="font-normal capitalize" style={{ color: 'var(--t-muted)' }}>
                {format(selectedDate, 'd. MMMM', { locale: sl })}
              </span>
            </h3>

            {loadingSlots ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                {[...Array(8)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="h-11 rounded-xl"
                    style={{ backgroundColor: 'var(--s2)' }}
                    animate={{ opacity: [0.4, 0.8, 0.4] }}
                    transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.08 }}
                  />
                ))}
              </div>
            ) : timeSlots.length > 0 ? (
              <motion.div
                className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2"
                initial="hidden"
                animate="visible"
                variants={{ visible: { transition: { staggerChildren: 0.04 } } }}
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
                        fontFamily: 'var(--font-quicksand)',
                      }}
                      whileHover={{
                        scale: 1.04,
                        backgroundColor: isSelected ? theme.primaryColor : 'var(--s2h)',
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
                style={{ color: 'var(--t-muted)', fontFamily: 'var(--font-quicksand)' }}
              >
                Ni prostih terminov za izbrani dan
              </motion.p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Selection confirmation strip */}
      <AnimatePresence>
        {selectedDate && selectedTime && (
          <motion.div
            className="mt-5 px-4 py-3.5 rounded-2xl flex items-center gap-3"
            style={{
              backgroundColor: `${theme.primaryColor}15`,
              border: `1px solid ${theme.primaryColor}30`,
            }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
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
              style={{ color: 'var(--t-soft)', fontFamily: 'var(--font-quicksand)' }}
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
