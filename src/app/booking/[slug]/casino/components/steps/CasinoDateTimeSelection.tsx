'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
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

const LUCKY_MESSAGES = [
  '🍀 Zjutraj je sreče več!',
  '⭐ Odlična izbira!',
  '🎰 Jackpot čas je prost!',
  '🎲 Zvečerni termini gorijo!',
  '🍒 Cherry termin!',
  '💎 Premium čas!',
];

const slideVariants = {
  enter: (d: number) => ({ x: d > 0 ? 30 : -30, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (d: number) => ({ x: d < 0 ? 30 : -30, opacity: 0 }),
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
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
    theme,
  } = useBookingStore();

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [direction, setDirection] = useState(0);
  const [timeSlots, setTimeSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [luckyMessage] = useState(
    () => LUCKY_MESSAGES[Math.floor(Math.random() * LUCKY_MESSAGES.length)]
  );

  const primary = theme.primaryColor;

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const startDay = getDay(monthStart);
    const pad = startDay === 0 ? 6 : startDay - 1;
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
      {/* Calendar section */}
      <motion.div
        variants={itemVariants}
        className="rounded-xl p-4 mb-4"
        style={{ backgroundColor: '#1A1A2E', border: `1px solid ${primary}25` }}
      >
        {/* Month navigation */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => !isPrevDisabled && navigateMonth(-1)}
            disabled={isPrevDisabled}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
            style={{
              backgroundColor: isPrevDisabled ? 'rgba(255,255,255,0.05)' : `${primary}20`,
              color: isPrevDisabled ? 'rgba(255,255,255,0.2)' : primary,
              border: `1px solid ${isPrevDisabled ? 'rgba(255,255,255,0.1)' : `${primary}40`}`,
            }}
          >
            ←
          </button>

          <AnimatePresence mode="wait" custom={direction}>
            <motion.h3
              key={format(currentMonth, 'yyyy-MM')}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.2 }}
              className="text-sm font-bold tracking-widest uppercase text-white capitalize"
              style={{ fontFamily: 'var(--font-orbitron)' }}
            >
              {format(currentMonth, 'LLLL yyyy', { locale: sl })}
            </motion.h3>
          </AnimatePresence>

          <button
            onClick={() => navigateMonth(1)}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
            style={{
              backgroundColor: `${primary}20`,
              color: primary,
              border: `1px solid ${primary}40`,
            }}
          >
            →
          </button>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 mb-2">
          {WEEK_DAYS.map((d) => (
            <div
              key={d}
              className="text-center text-[9px] tracking-widest uppercase py-1 font-bold"
              style={{ fontFamily: 'var(--font-orbitron)', color: `${primary}60` }}
            >
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={format(currentMonth, 'yyyy-MM')}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.2 }}
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
                  className="aspect-square flex items-center justify-center relative rounded-lg text-xs font-bold transition-all"
                  style={{
                    fontFamily: 'var(--font-orbitron)',
                    cursor: isDisabled ? 'not-allowed' : 'pointer',
                    backgroundColor: isSelected
                      ? primary
                      : isDisabled
                      ? 'transparent'
                      : 'transparent',
                    color: isDisabled
                      ? 'rgba(255,255,255,0.15)'
                      : isSelected
                      ? 'white'
                      : isWeekend
                      ? `${primary}80`
                      : 'rgba(255,255,255,0.8)',
                    boxShadow: isSelected ? `0 0 10px ${primary}60` : 'none',
                    border: isTodayDate && !isSelected ? `1px solid ${primary}50` : '1px solid transparent',
                  }}
                  whileHover={!isDisabled ? { backgroundColor: `${primary}30`, scale: 1.1 } : {}}
                  whileTap={!isDisabled ? { scale: 0.95 } : {}}
                >
                  {isTodayDate && !isSelected && (
                    <span
                      className="absolute -top-0.5 -right-0.5 text-[8px]"
                      style={{ color: primary }}
                    >
                      ☆
                    </span>
                  )}
                  {format(day, 'd')}
                </motion.button>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* Time slots section */}
      <motion.div
        variants={itemVariants}
        className="rounded-xl p-4"
        style={{ backgroundColor: '#1A1A2E', border: `1px solid ${primary}25` }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <p
              className="text-[9px] tracking-[0.25em] uppercase font-bold mb-1"
              style={{ fontFamily: 'var(--font-orbitron)', color: `${primary}70` }}
            >
              Lucky Times
            </p>
            {selectedDate ? (
              <p
                className="text-sm font-bold text-white tracking-wider"
                style={{ fontFamily: 'var(--font-orbitron)' }}
              >
                {format(selectedDate, 'd. MMM yyyy', { locale: sl }).toUpperCase()}
              </p>
            ) : (
              <p
                className="text-xs"
                style={{ fontFamily: 'var(--font-inter)', color: 'rgba(255,255,255,0.35)' }}
              >
                Najprej izberite datum
              </p>
            )}
          </div>

          {selectedDate && !loadingSlots && timeSlots.length > 0 && (
            <div
              className="px-2 py-1 rounded-lg text-[9px] font-bold tracking-wider"
              style={{
                fontFamily: 'var(--font-orbitron)',
                backgroundColor: 'rgba(0,255,135,0.1)',
                border: '1px solid rgba(0,255,135,0.3)',
                color: '#00FF87',
              }}
            >
              {timeSlots.length} SLOTS
            </div>
          )}
        </div>

        {/* Slots */}
        {!selectedDate ? (
          <div className="text-center py-8">
            <span className="text-3xl block mb-3">🎰</span>
            <p
              className="text-xs"
              style={{ fontFamily: 'var(--font-inter)', color: 'rgba(255,255,255,0.3)' }}
            >
              Izberite datum v koledarju
            </p>
          </div>
        ) : loadingSlots ? (
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 9 }).map((_, i) => (
              <div
                key={i}
                className="h-9 rounded-lg animate-pulse"
                style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}
              />
            ))}
          </div>
        ) : timeSlots.length === 0 ? (
          <div className="text-center py-8">
            <span className="text-3xl block mb-3">😔</span>
            <p
              className="text-xs font-bold tracking-wider"
              style={{ fontFamily: 'var(--font-orbitron)', color: 'rgba(255,255,255,0.3)' }}
            >
              NI PROSTIH TERMINOV
            </p>
            <p
              className="text-xs mt-1"
              style={{ fontFamily: 'var(--font-inter)', color: 'rgba(255,255,255,0.2)' }}
            >
              Izberite drug datum
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto casino-scroll">
              {timeSlots.map((time, i) => {
                const isSelected = selectedTime === time;
                return (
                  <motion.button
                    key={time}
                    onClick={() => selectTime(time)}
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.03 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="h-9 rounded-lg text-xs font-bold tracking-wider transition-all"
                    style={{
                      fontFamily: 'var(--font-orbitron)',
                      backgroundColor: isSelected ? primary : `${primary}15`,
                      border: `1px solid ${isSelected ? primary : `${primary}30`}`,
                      color: isSelected ? 'white' : primary,
                      boxShadow: isSelected ? `0 0 12px ${primary}60` : 'none',
                    }}
                  >
                    {time}
                  </motion.button>
                );
              })}
            </div>

            {/* Lucky message */}
            {selectedDate && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-center text-[10px] mt-4 tracking-wider"
                style={{ fontFamily: 'var(--font-inter)', color: `${primary}60` }}
              >
                {luckyMessage}
              </motion.p>
            )}
          </>
        )}
      </motion.div>

      {/* Selected confirmation */}
      <AnimatePresence>
        {selectedDate && selectedTime && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="mt-4 rounded-xl p-3 flex items-center gap-3"
            style={{
              backgroundColor: 'rgba(0,255,135,0.08)',
              border: '1px solid rgba(0,255,135,0.3)',
            }}
          >
            <span className="text-lg">🎯</span>
            <div>
              <p
                className="text-xs font-bold tracking-wider"
                style={{ fontFamily: 'var(--font-orbitron)', color: '#00FF87' }}
              >
                TERMIN IZBRAN!
              </p>
              <p
                className="text-xs mt-0.5"
                style={{ fontFamily: 'var(--font-inter)', color: 'rgba(255,255,255,0.6)' }}
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
