'use client';

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { format, isSameDay, isToday, isBefore, startOfDay } from 'date-fns';
import { sl } from 'date-fns/locale';
import { useBookingStore } from '@/store/bookingStore';
import { fetchTimeSlots } from '@/lib/api';
import { SeasonalTheme } from '../decorations/SeasonDetector';

interface Props {
  companySlug?: string;
  seasonalTheme: SeasonalTheme;
}

const slotVariants: Variants = {
  hidden: { opacity: 0, scale: 0.85 },
  visible: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 420, damping: 24 } },
};

const DAYS_TO_SHOW = 60;
const CARD_W = 72;
const CARD_GAP = 8;

function generateDates(count: number): Date[] {
  const today = startOfDay(new Date());
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return d;
  });
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

  const [timeSlots, setTimeSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const dates = useMemo(() => generateDates(DAYS_TO_SHOW), []);
  const today = useMemo(() => startOfDay(new Date()), []);

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

  // Center the selected date on mount
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
    [dates, selectDate]
  );

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

      {/* ── Horizontal date strip (all screen sizes) ── */}
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.06 }}
      >
        <div className="flex items-center gap-2">
          {/* Left arrow */}
          <button
            onClick={() => scrollBy(-1)}
            className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center"
            style={{
              backgroundColor: 'var(--s2)',
              border: '1px solid var(--b2)',
              color: 'var(--t-muted)',
              transition: 'background-color 0.15s',
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
              className="flex gap-2 overflow-x-auto py-3 px-2 seasonal-scrollbar-hide"
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
                      backgroundColor: isSelected ? theme.primaryColor : 'var(--s2)',
                      border: isTodayDate && !isSelected
                        ? `2px solid ${theme.primaryColor}60`
                        : '2px solid transparent',
                      boxShadow: isSelected ? `0 6px 22px ${theme.primaryColor}45` : 'none',
                      opacity: isPast ? 0.3 : 1,
                      cursor: isPast ? 'not-allowed' : 'pointer',
                      transform: isSelected ? 'scale(1.06)' : 'scale(1)',
                      transition: 'background-color 0.18s, transform 0.18s, box-shadow 0.18s',
                    }}
                  >
                    <span
                      style={{
                        color: isSelected ? 'rgba(255,255,255,0.72)' : 'var(--t-faint)',
                        fontFamily: 'var(--font-quicksand)',
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
                        color: isSelected ? '#ffffff' : 'var(--t-primary)',
                        fontFamily: seasonalTheme.config.headingFont ?? 'var(--font-quicksand)',
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
                        color: isSelected ? 'rgba(255,255,255,0.72)' : 'var(--t-faint)',
                        fontFamily: 'var(--font-quicksand)',
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
              backgroundColor: 'var(--s2)',
              border: '1px solid var(--b2)',
              color: 'var(--t-muted)',
              transition: 'background-color 0.15s',
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
              <>
                {/* Mobile shimmer: single column */}
                <div className="sm:hidden flex flex-col items-center gap-2.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <motion.div
                      key={i}
                      className="h-11 rounded-xl w-full max-w-[220px]"
                      style={{ backgroundColor: 'var(--s2)' }}
                      animate={{ opacity: [0.4, 0.8, 0.4] }}
                      transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.08 }}
                    />
                  ))}
                </div>
                {/* Desktop shimmer: grid */}
                <div className="hidden sm:grid sm:grid-cols-4 md:grid-cols-5 gap-2">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <motion.div
                      key={i}
                      className="h-11 rounded-xl"
                      style={{ backgroundColor: 'var(--s2)' }}
                      animate={{ opacity: [0.4, 0.8, 0.4] }}
                      transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.08 }}
                    />
                  ))}
                </div>
              </>
            ) : timeSlots.length > 0 ? (
              <>
                {/* Mobile: single column, centered */}
                <div className="sm:hidden">
                  <motion.div
                    className="flex flex-col items-center gap-2.5 overflow-y-auto seasonal-scrollbar-hide"
                    style={{ maxHeight: '18rem', paddingRight: 4 }}
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
                          className="w-full rounded-xl font-medium text-sm py-3.5 text-center"
                          style={{
                            maxWidth: 220,
                            backgroundColor: isSelected ? theme.primaryColor : 'var(--s2)',
                            color: isSelected ? '#ffffff' : 'var(--t-primary)',
                            border: `1px solid ${isSelected ? theme.primaryColor : 'var(--b2)'}`,
                            boxShadow: isSelected ? `0 4px 14px ${theme.primaryColor}40` : 'none',
                            fontFamily: 'var(--font-quicksand)',
                            transition: 'background-color 0.15s, color 0.15s, box-shadow 0.15s',
                          }}
                          whileTap={{ scale: 0.95 }}
                        >
                          {slot}
                        </motion.button>
                      );
                    })}
                  </motion.div>
                </div>

                {/* Desktop: grid */}
                <motion.div
                  className="hidden sm:grid sm:grid-cols-4 md:grid-cols-5 gap-2"
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
              </>
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
