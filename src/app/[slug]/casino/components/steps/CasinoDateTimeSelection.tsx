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
  enter: (d: number) => ({
    x: d > 0 ? 24 : -24,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.25, ease: 'easeOut' as const },
  },
  exit: (d: number) => ({
    x: d < 0 ? 24 : -24,
    opacity: 0,
    transition: { duration: 0.2 },
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
    transition: { duration: 0.35, ease: 'easeOut' as const },
  },
};

export default function CasinoDateTimeSelection({ companySlug }: Props) {
  const {
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
  }, [selectedDate, companySlug, selectedEmployeeId, anyPerson, selectedService]);

  const today = startOfDay(new Date());
  const isPrevDisabled = isBefore(endOfMonth(subMonths(currentMonth, 1)), today);

  const navigateMonth = (delta: number) => {
    setDirection(delta);
    setCurrentMonth(delta > 0 ? addMonths(currentMonth, 1) : subMonths(currentMonth, 1));
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      {/* Calendar */}
      <motion.div
        variants={itemVariants}
        className="rounded-lg mb-4 overflow-hidden"
        style={{
          background: 'rgba(10, 40, 20, 0.82)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(201, 168, 76, 0.2)',
        }}
      >
        {/* Month navigation */}
        <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'rgba(201,168,76,0.1)' }}>
          <button
            onClick={() => !isPrevDisabled && navigateMonth(-1)}
            disabled={isPrevDisabled}
            className="w-7 h-7 rounded flex items-center justify-center transition-all"
            style={{
              background: isPrevDisabled ? 'transparent' : 'rgba(201,168,76,0.08)',
              border: `1px solid ${isPrevDisabled ? 'rgba(201,168,76,0.1)' : 'rgba(201,168,76,0.25)'}`,
              color: isPrevDisabled ? 'rgba(201,168,76,0.2)' : '#c9a84c',
              fontSize: '0.75rem',
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
              className="capitalize"
              style={{
                fontFamily: 'var(--font-playfair)',
                fontSize: '0.95rem',
                fontWeight: 700,
                color: '#f5edd6',
                letterSpacing: '0.05em',
              }}
            >
              {format(currentMonth, 'LLLL yyyy', { locale: sl })}
            </motion.h3>
          </AnimatePresence>

          <button
            onClick={() => navigateMonth(1)}
            className="w-7 h-7 rounded flex items-center justify-center transition-all"
            style={{
              background: 'rgba(201,168,76,0.08)',
              border: '1px solid rgba(201,168,76,0.25)',
              color: '#c9a84c',
              fontSize: '0.75rem',
              cursor: 'pointer',
            }}
          >
            ›
          </button>
        </div>

        <div className="px-3 py-3">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 mb-1">
            {WEEK_DAYS.map((d) => (
              <div
                key={d}
                className="text-center py-1"
                style={{
                  fontFamily: 'var(--font-oswald)',
                  fontSize: '0.58rem',
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  color: 'rgba(201,168,76,0.4)',
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
                    className="mc-calendar-day"
                    style={{
                      color: isDisabled
                        ? 'rgba(201,168,76,0.12)'
                        : isSelected
                        ? '#060f08'
                        : isWeekend
                        ? 'rgba(201,168,76,0.6)'
                        : 'rgba(232,217,184,0.75)',
                      background: isSelected ? '#c9a84c' : 'transparent',
                      boxShadow: isSelected ? '0 2px 10px rgba(201,168,76,0.35)' : 'none',
                      border: isTodayDate && !isSelected
                        ? '1px solid rgba(201,168,76,0.4)'
                        : '1px solid transparent',
                    }}
                    whileHover={!isDisabled ? { backgroundColor: 'rgba(201,168,76,0.12)', scale: 1.08 } : {}}
                    whileTap={!isDisabled ? { scale: 0.94 } : {}}
                  >
                    {format(day, 'd')}
                    {/* Gold dot for today */}
                    {isTodayDate && !isSelected && (
                      <span
                        className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                        style={{ background: '#c9a84c' }}
                      />
                    )}
                  </motion.button>
                );
              })}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Time slots */}
      <motion.div
        variants={itemVariants}
        className="rounded-lg overflow-hidden"
        style={{
          background: 'rgba(10, 40, 20, 0.82)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(201, 168, 76, 0.2)',
        }}
      >
        {/* Header */}
        <div className="px-4 py-3 border-b" style={{ borderColor: 'rgba(201,168,76,0.1)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p
                className="mb-0.5"
                style={{
                  fontFamily: 'var(--font-oswald)',
                  fontSize: '0.58rem',
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  color: '#a89060',
                }}
              >
                Prosti termini
              </p>
              {selectedDate ? (
                <p
                  style={{
                    fontFamily: 'var(--font-playfair)',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    color: '#f5edd6',
                    textTransform: 'capitalize',
                  }}
                >
                  {format(selectedDate, 'd. MMMM yyyy', { locale: sl })}
                </p>
              ) : (
                <p
                  className="italic"
                  style={{
                    fontFamily: 'var(--font-cormorant)',
                    fontSize: '0.85rem',
                    color: 'rgba(201,168,76,0.35)',
                  }}
                >
                  Izberite datum zgoraj
                </p>
              )}
            </div>

            {selectedDate && !loadingSlots && timeSlots.length > 0 && (
              <div
                className="px-2.5 py-1 rounded-full"
                style={{
                  background: 'rgba(39,174,96,0.08)',
                  border: '1px solid rgba(39,174,96,0.25)',
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-oswald)',
                    fontSize: '0.58rem',
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: 'rgba(39,174,96,0.8)',
                  }}
                >
                  {timeSlots.length} terminov
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Slot content */}
        <div className="p-4">
          {!selectedDate ? (
            <div className="text-center py-8">
              <span
                style={{ fontFamily: 'Georgia, serif', fontSize: '1.5rem', color: 'rgba(201,168,76,0.15)' }}
              >
                ◆
              </span>
              <p
                className="mt-3 italic"
                style={{
                  fontFamily: 'var(--font-cormorant)',
                  fontSize: '0.9rem',
                  color: 'rgba(201,168,76,0.3)',
                }}
              >
                Izberite datum v koledarju
              </p>
            </div>
          ) : loadingSlots ? (
            <div className="grid grid-cols-3 gap-2">
              {Array.from({ length: 9 }).map((_, i) => (
                <div
                  key={i}
                  className="h-9 rounded-md animate-pulse"
                  style={{ background: 'rgba(201,168,76,0.06)' }}
                />
              ))}
            </div>
          ) : timeSlots.length === 0 ? (
            <div className="text-center py-8">
              <span style={{ fontFamily: 'Georgia, serif', fontSize: '1.5rem', color: 'rgba(201,168,76,0.2)' }}>◆</span>
              <p
                style={{
                  fontFamily: 'var(--font-oswald)',
                  fontSize: '0.65rem',
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  color: 'rgba(201,168,76,0.35)',
                  marginTop: '0.75rem',
                }}
              >
                Ni prostih terminov
              </p>
              <p
                className="mt-1 italic"
                style={{
                  fontFamily: 'var(--font-cormorant)',
                  fontSize: '0.85rem',
                  color: 'rgba(201,168,76,0.25)',
                }}
              >
                Izberite drug datum
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2 max-h-52 overflow-y-auto mc-scroll">
              {timeSlots.map((time, i) => {
                const isSelected = selectedTime === time;
                return (
                  <motion.button
                    key={time}
                    onClick={() => selectTime(time)}
                    initial={{ opacity: 0, scale: 0.88 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.03, ease: 'easeOut' as const }}
                    className={`mc-time-slot ${isSelected ? 'selected' : ''}`}
                    whileHover={!isSelected ? { y: -1 } : {}}
                    whileTap={{ scale: 0.96 }}
                  >
                    {time}
                  </motion.button>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>

      {/* Selected confirmation */}
      <AnimatePresence>
        {selectedDate && selectedTime && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.35 }}
            className="mt-4 rounded-lg px-4 py-3 flex items-center gap-3"
            style={{
              background: 'rgba(13, 59, 30, 0.6)',
              border: '1px solid rgba(201, 168, 76, 0.35)',
            }}
          >
            <span style={{ color: '#c9a84c', fontSize: '0.7rem', flexShrink: 0 }}>◆</span>
            <div>
              <p
                style={{
                  fontFamily: 'var(--font-oswald)',
                  fontSize: '0.62rem',
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: '#c9a84c',
                }}
              >
                Termin izbran
              </p>
              <p
                className="italic mt-0.5"
                style={{
                  fontFamily: 'var(--font-cormorant)',
                  fontSize: '0.95rem',
                  color: '#f5edd6',
                }}
              >
                {format(selectedDate, 'd. MMMM yyyy', { locale: sl })} ob {selectedTime}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
