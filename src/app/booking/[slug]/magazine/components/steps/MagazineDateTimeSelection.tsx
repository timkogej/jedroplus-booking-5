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

const slideVariants = {
  enter: (d: number) => ({ x: d > 0 ? 30 : -30, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (d: number) => ({ x: d < 0 ? 30 : -30, opacity: 0 }),
};

export default function MagazineDateTimeSelection({ companySlug }: Props) {
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-2xl"
    >
      {/* Section header */}
      <div className="mb-10">
        <div className="w-8 h-[1px] mb-5" style={{ backgroundColor: theme.primaryColor }} />
        <h1 className="magazine-serif text-[2.5rem] md:text-[3rem] text-[#1A1A1A] tracking-[-0.02em] leading-[1.1] mb-4">
          Vaš Termin
        </h1>
        <div className="h-[1px] w-full bg-black/10 mb-4" />
        <p className="magazine-body text-[#6B6B6B] text-[15px] italic leading-relaxed">
          Izberite datum in uro
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-12">
        {/* ─── Calendar ─── */}
        <div>
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => !isPrevDisabled && navigateMonth(-1)}
              disabled={isPrevDisabled}
              className="text-[#6B6B6B] hover:text-[#1A1A1A] disabled:opacity-25 disabled:cursor-not-allowed transition-colors p-1"
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
                transition={{ duration: 0.22 }}
                className="magazine-serif text-lg text-[#1A1A1A] capitalize"
              >
                {format(currentMonth, 'LLLL yyyy', { locale: sl })}
              </motion.h3>
            </AnimatePresence>

            <button
              onClick={() => navigateMonth(1)}
              className="text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors p-1"
            >
              →
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 mb-3">
            {WEEK_DAYS.map((d) => (
              <div
                key={d}
                className="text-center magazine-caps text-[9px] tracking-[0.15em] text-[#6B6B6B] py-1"
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
              transition={{ duration: 0.22 }}
              className="grid grid-cols-7"
            >
              {calendarDays.map((day, i) => {
                if (!day) return <div key={`e-${i}`} className="aspect-square" />;

                const isDisabled = isBefore(day, today);
                const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
                const isTodayDate = isToday(day);
                const inMonth = isSameMonth(day, currentMonth);

                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => !isDisabled && selectDate(day)}
                    disabled={isDisabled}
                    className={`
                      aspect-square flex items-center justify-center relative group
                      ${isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}
                      ${!inMonth ? 'opacity-20' : ''}
                    `}
                  >
                    {/* Selected: filled circle */}
                    {isSelected && (
                      <motion.span
                        layoutId="calSelectedDay"
                        className="absolute inset-1 rounded-full"
                        style={{ backgroundColor: theme.primaryColor }}
                        transition={{ duration: 0.2 }}
                      />
                    )}

                    {/* Today: thin ring */}
                    {isTodayDate && !isSelected && (
                      <span
                        className="absolute inset-1 rounded-full border"
                        style={{ borderColor: `${theme.primaryColor}60` }}
                      />
                    )}

                    {/* Day number */}
                    <span
                      className={`
                        relative z-10 text-[13px] transition-colors leading-none
                        ${isDisabled ? 'text-black/20' : ''}
                        ${!isDisabled && !isSelected ? 'text-[#1A1A1A] group-hover:text-[#6B6B6B]' : ''}
                        ${isSelected ? 'text-white' : ''}
                      `}
                    >
                      {format(day, 'd')}
                    </span>
                  </button>
                );
              })}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ─── Time slots ─── */}
        <div>
          {/* Header */}
          <div className="mb-6 border-b border-black/10 pb-4">
            <p className="magazine-caps text-[9px] tracking-[0.22em] text-[#6B6B6B] mb-1">
              Prosti termini
            </p>
            {selectedDate ? (
              <p className="magazine-serif text-xl text-[#1A1A1A]">
                {format(selectedDate, 'd. MMMM yyyy', { locale: sl })
                  .toUpperCase()
                  .replace(/\./g, '.')}
              </p>
            ) : (
              <p className="magazine-body text-[#6B6B6B] text-sm italic">
                Najprej izberite datum
              </p>
            )}
          </div>

          {/* Slot list */}
          {!selectedDate ? (
            <div className="py-8 text-center">
              <div className="w-8 h-[1px] bg-black/10 mx-auto mb-4" />
              <p className="magazine-body text-[#6B6B6B] text-sm italic">
                Izberite datum v koledarju
              </p>
            </div>
          ) : loadingSlots ? (
            <div className="space-y-0">
              {Array.from({ length: 7 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-3 border-b border-black/06"
                >
                  <div className="w-12 h-3 mag-skeleton rounded" />
                  <div className="flex-1 mx-4 h-[1px] bg-black/06" />
                  <div className="w-4 h-4 rounded-full mag-skeleton" />
                </div>
              ))}
            </div>
          ) : timeSlots.length === 0 ? (
            <div className="py-8 text-center">
              <div className="w-8 h-[1px] bg-black/10 mx-auto mb-4" />
              <p className="magazine-body text-[#6B6B6B] text-sm italic">
                Ni prostih terminov
              </p>
              <p className="magazine-caps text-[9px] tracking-[0.18em] text-black/30 mt-2">
                Izberite drug datum
              </p>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-0 max-h-72 overflow-y-auto magazine-scrollbar"
            >
              {timeSlots.map((time, i) => {
                const isTimeSelected = selectedTime === time;

                return (
                  <motion.button
                    key={time}
                    onClick={() => selectTime(time)}
                    initial={{ opacity: 0, x: 14 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.025 }}
                    className="w-full flex items-center justify-between py-3 group border-b border-black/06 transition-all"
                  >
                    <span
                      className="magazine-body text-[15px] transition-colors duration-200 tabular-nums"
                      style={{
                        color: isTimeSelected ? theme.primaryColor : '#1A1A1A',
                      }}
                    >
                      {time}
                    </span>

                    <div
                      className="flex-1 mx-4 h-[1px] transition-colors duration-200"
                      style={{
                        backgroundColor: isTimeSelected
                          ? `${theme.primaryColor}30`
                          : 'rgba(0,0,0,0.08)',
                      }}
                    />

                    <div
                      className="w-4 h-4 rounded-full border transition-all duration-200 flex items-center justify-center flex-shrink-0"
                      style={{
                        borderColor: isTimeSelected ? theme.primaryColor : 'rgba(0,0,0,0.2)',
                      }}
                    >
                      {isTimeSelected && (
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: theme.primaryColor }}
                        />
                      )}
                    </div>
                  </motion.button>
                );
              })}
            </motion.div>
          )}
        </div>
      </div>

      {/* Selected confirmation strip */}
      {selectedDate && selectedTime && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-10 pt-6 border-t border-black/10 flex items-center gap-3"
        >
          <div
            className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: theme.primaryColor }}
          >
            <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
              <path
                d="M1 3L3 5L7 1"
                stroke="white"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <span className="magazine-body text-[#1A1A1A] text-sm">
            {format(selectedDate, 'd. MMMM yyyy', { locale: sl })} ob{' '}
            <span style={{ color: theme.primaryColor }}>{selectedTime}</span>
          </span>
        </motion.div>
      )}
    </motion.div>
  );
}
