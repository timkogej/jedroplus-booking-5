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
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { useBookingStore } from '@/store/bookingStore';
import { fetchTimeSlots } from '@/lib/api';

interface DateTimeSelectionProps {
  companySlug?: string;
}

export default function DateTimeSelection({ companySlug }: DateTimeSelectionProps) {
  const {
    selectedDate,
    selectedTime,
    selectedEmployeeId,
    anyPerson,
    selectedService,
    selectDate,
    selectTime,
    theme,
  } = useBookingStore();

  const themeColor = theme.primaryColor;

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [direction, setDirection] = useState(0);
  const [timeSlots, setTimeSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

    // Add padding for days before the first day of month (Monday = 0)
    const startDay = getDay(monthStart);
    const startPadding = startDay === 0 ? 6 : startDay - 1;
    const paddedDays: (Date | null)[] = Array(startPadding).fill(null);

    return [...paddedDays, ...days];
  }, [currentMonth]);

  // Fetch time slots when date changes
  useEffect(() => {
    async function loadTimeSlots() {
      if (!selectedDate || !companySlug || !selectedService) {
        setTimeSlots([]);
        return;
      }

      setLoadingSlots(true);
      try {
        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        const slots = await fetchTimeSlots(
          companySlug,
          dateStr,
          selectedService.id,
          selectedEmployeeId,
          anyPerson
        );
        setTimeSlots(slots);
      } catch (error) {
        console.error('Failed to fetch time slots:', error);
        setTimeSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    }

    loadTimeSlots();
  }, [selectedDate, companySlug, selectedEmployeeId, anyPerson, selectedService]);

  const navigateMonth = (delta: number) => {
    setDirection(delta);
    if (delta > 0) {
      setCurrentMonth(addMonths(currentMonth, 1));
    } else {
      setCurrentMonth(subMonths(currentMonth, 1));
    }
  };

  const today = startOfDay(new Date());
  const isPrevMonthDisabled = isBefore(endOfMonth(subMonths(currentMonth, 1)), today);

  const isDateDisabled = (date: Date): boolean => {
    return isBefore(date, today);
  };

  const weekDays = ['Po', 'To', 'Sr', 'Če', 'Pe', 'So', 'Ne'];

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 50 : -50,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 50 : -50,
      opacity: 0,
    }),
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto"
    >
      {/* Header */}
      <div className="text-center mb-10">
        <h2 className="text-3xl md:text-4xl font-light text-white">
          Izberi{' '}
          <span style={{ color: themeColor }}>datum in uro</span>
        </h2>
        <p className="text-white/60 mt-2 font-light">Izberi želeni termin</p>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">

        {/* Left column — Calendar */}
        <div>
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => navigateMonth(-1)}
              disabled={isPrevMonthDisabled}
              className="text-white/40 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors p-1"
            >
              <ChevronLeft className="w-5 h-5" />
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
                className="text-xl font-light text-white tracking-wide"
              >
                {format(currentMonth, 'LLLL yyyy', { locale: sl })}
              </motion.h3>
            </AnimatePresence>

            <button
              onClick={() => navigateMonth(1)}
              className="text-white/40 hover:text-white transition-colors p-1"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Week days header */}
          <div className="grid grid-cols-7 mb-4">
            {weekDays.map((day) => (
              <div
                key={day}
                className="text-center text-sm text-white/40 font-light py-2"
              >
                {day}
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
              className="grid grid-cols-7 gap-y-1"
            >
              {calendarDays.map((day, index) => {
                if (!day) {
                  return <div key={`empty-${index}`} className="aspect-square" />;
                }

                const isDisabled = isDateDisabled(day);
                const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
                const isTodayDate = isToday(day);
                const isCurrentMonth = isSameMonth(day, currentMonth);

                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => !isDisabled && selectDate(day)}
                    disabled={isDisabled}
                    className={`
                      aspect-square flex items-center justify-center relative group
                      ${isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}
                      ${!isCurrentMonth ? 'opacity-30' : ''}
                    `}
                  >
                    {/* Filled circle for selected day */}
                    {isSelected && (
                      <motion.span
                        layoutId="selectedDate"
                        className="absolute inset-1 rounded-full"
                        style={{ backgroundColor: themeColor }}
                        transition={{ duration: 0.2 }}
                      />
                    )}

                    {/* Border-only circle for today (not selected) */}
                    {isTodayDate && !isSelected && (
                      <span
                        className="absolute inset-1 rounded-full border-2"
                        style={{ borderColor: themeColor }}
                      />
                    )}

                    {/* Day number */}
                    <span
                      className={`
                        relative z-10 text-base font-light transition-colors
                        ${isDisabled ? 'text-white/20' : ''}
                        ${!isDisabled && !isSelected ? 'text-white group-hover:text-white/70' : ''}
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

        {/* Right column — Time slots */}
        <div>
          <div className="mb-6">
            <h3 className="text-xl font-light text-white tracking-wide">
              Prosti termini
            </h3>
          </div>

          {!selectedDate ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-white/40 font-light">Najprej izberite datum</p>
            </div>
          ) : loadingSlots ? (
            <div className="space-y-0">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between py-3">
                  <div className="w-14 h-4 bg-white/10 rounded animate-pulse" />
                  <div className="flex-1 mx-4 h-px bg-white/5" />
                  <div className="w-5 h-5 rounded-full bg-white/10 animate-pulse" />
                </div>
              ))}
            </div>
          ) : timeSlots.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-white/60 font-light">Ni prostih terminov</p>
              <p className="text-white/40 text-sm mt-1 font-light">Izberite drug datum</p>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-0 max-h-[400px] overflow-y-auto custom-scrollbar"
            >
              {timeSlots.map((time, index) => {
                const isTimeSelected = selectedTime === time;

                return (
                  <motion.button
                    key={time}
                    onClick={() => selectTime(time)}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="w-full flex items-center justify-between py-3 group transition-all"
                  >
                    {/* Time on left */}
                    <span
                      className={`
                        text-base font-light tracking-wider transition-colors w-14 text-left
                        ${!isTimeSelected ? 'text-white/70 group-hover:text-white' : ''}
                      `}
                      style={isTimeSelected ? { color: themeColor } : undefined}
                    >
                      {time}
                    </span>

                    {/* Separator line */}
                    <div
                      className="flex-1 mx-4 h-px transition-colors"
                      style={{
                        backgroundColor: isTimeSelected
                          ? `${themeColor}40`
                          : 'rgba(255,255,255,0.1)',
                      }}
                    />

                    {/* Radio circle on right */}
                    <div
                      className={`
                        w-5 h-5 rounded-full border-2 transition-all flex items-center justify-center flex-shrink-0
                        ${!isTimeSelected ? 'border-white/30 group-hover:border-white/50' : ''}
                      `}
                      style={isTimeSelected ? { borderColor: themeColor } : undefined}
                    >
                      {isTimeSelected && (
                        <div
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: themeColor }}
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

      {/* Confirmation strip */}
      {selectedDate && selectedTime && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-10 flex items-center justify-center gap-3"
        >
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: `${themeColor}20` }}
          >
            <Check className="w-4 h-4" style={{ color: themeColor }} />
          </div>
          <span className="text-white font-light tracking-wide">
            {format(selectedDate, 'd. MMMM yyyy', { locale: sl })} ob {selectedTime}
          </span>
        </motion.div>
      )}
    </motion.div>
  );
}
