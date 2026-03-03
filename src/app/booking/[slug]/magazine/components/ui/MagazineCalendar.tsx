'use client';

import { useState, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
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

const WEEK_DAYS = ['Po', 'To', 'Sr', 'Če', 'Pe', 'So', 'Ne'];

const slideVariants = {
  enter: (d: number) => ({ x: d > 0 ? 24 : -24, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (d: number) => ({ x: d < 0 ? 24 : -24, opacity: 0 }),
};

export default function MagazineCalendar() {
  const { selectedDate, selectDate, theme } = useBookingStore();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [direction, setDirection] = useState(0);

  const today = startOfDay(new Date());

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const days = eachDayOfInterval({ start: monthStart, end: endOfMonth(currentMonth) });
    const startDay = getDay(monthStart);
    const pad = startDay === 0 ? 6 : startDay - 1;
    return [...Array(pad).fill(null), ...days] as (Date | null)[];
  }, [currentMonth]);

  const isPrevDisabled = isBefore(endOfMonth(subMonths(currentMonth, 1)), today);

  const navigate = (delta: number) => {
    setDirection(delta);
    setCurrentMonth(delta > 0 ? addMonths(currentMonth, 1) : subMonths(currentMonth, 1));
  };

  return (
    <div>
      {/* Navigation */}
      <div className="flex items-center justify-between mb-5">
        <button
          onClick={() => !isPrevDisabled && navigate(-1)}
          disabled={isPrevDisabled}
          className="text-[#6B6B6B] hover:text-[#1A1A1A] disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
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
            className="magazine-serif text-base text-[#1A1A1A] capitalize"
          >
            {format(currentMonth, 'LLLL yyyy', { locale: sl })}
          </motion.h3>
        </AnimatePresence>

        <button
          onClick={() => navigate(1)}
          className="text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors"
        >
          →
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-2">
        {WEEK_DAYS.map((d) => (
          <div
            key={d}
            className="text-center magazine-caps text-[8px] tracking-[0.12em] text-[#6B6B6B] py-1"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Days */}
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={format(currentMonth, 'yyyy-MM')}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.2 }}
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
                className={`aspect-square flex items-center justify-center relative group ${
                  isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'
                } ${!inMonth ? 'opacity-20' : ''}`}
              >
                {isSelected && (
                  <motion.span
                    layoutId="magCalSelected"
                    className="absolute inset-1 rounded-full"
                    style={{ backgroundColor: theme.primaryColor }}
                    transition={{ duration: 0.2 }}
                  />
                )}
                {isTodayDate && !isSelected && (
                  <span
                    className="absolute inset-1 rounded-full border"
                    style={{ borderColor: `${theme.primaryColor}50` }}
                  />
                )}
                <span
                  className={`relative z-10 text-[13px] transition-colors leading-none ${
                    isDisabled ? 'text-black/20' : ''
                  } ${!isDisabled && !isSelected ? 'text-[#1A1A1A] group-hover:text-[#6B6B6B]' : ''} ${
                    isSelected ? 'text-white' : ''
                  }`}
                >
                  {format(day, 'd')}
                </span>
              </button>
            );
          })}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
