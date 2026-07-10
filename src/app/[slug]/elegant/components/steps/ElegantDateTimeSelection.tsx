'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
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
import { fetchTimeSlotsRange } from '@/lib/api';
import { checkHappyHour, fetchAvailableAddOns, calculateDiscount, fetchHappyHoursForDay, type HappyHourRange } from '@/lib/promotionsApi';
import { usePromotionsStore } from '@/store/promotionsStore';
import { AddOnModal } from '@/components/shared/AddOnModal';

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
    selectedServices,
    selectDate,
    language,
    nextStep,
    theme,
    company,
    services,
    maxDniRezervacija,
    slotsMap,
    isLoadingSlots,
    setSlotsMap,
    setLoadingSlots,
    requiredResursiIds,
  } = useBookingStore();

  const {
    availableAddOns,
    serviceDiscounts,
    setActiveHappyHour,
    computeActivePromotion,
    setAvailableAddOns,
    selectAddOn,
    setLoadingAddOns,
  } = usePromotionsStore();

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [direction, setDirection] = useState(0);
  const [happyHourRanges, setHappyHourRanges] = useState<HappyHourRange[]>([]);
  const [showAddOnModal, setShowAddOnModal] = useState(false);

  const today = useMemo(() => startOfDay(new Date()), []);

  // Last bookable date
  const windowEnd = useMemo(
    () => addDays(today, maxDniRezervacija),
    [today, maxDniRezervacija]
  );

  // Active service IDs — multi-service or single legacy
  const activeServiceIds = useMemo(() => {
    if (selectedServices.length > 0) return selectedServices.map((s) => s.id);
    if (selectedService) return [selectedService.id];
    return [];
  }, [selectedServices, selectedService]);

  useEffect(() => {
    if (!company?.idPodjetja || activeServiceIds.length === 0 || !selectedDate) {
      setHappyHourRanges([]);
      return;
    }
    const primaryId = activeServiceIds[0];
    const primaryService =
      selectedServices.find((s) => s.id === primaryId) ?? selectedService;
    const primaryRowId = String(primaryService?.id ?? primaryId);
    fetchHappyHoursForDay(company.idPodjetja, primaryRowId, selectedDate)
      .then(setHappyHourRanges)
      .catch(() => setHappyHourRanges([]));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [company?.idPodjetja, JSON.stringify(activeServiceIds), selectedDate?.toISOString()]);

  const isHappyHour = useCallback(
    (timeStr: string): string | null => {
      if (!happyHourRanges.length) return null;
      const [h, m] = timeStr.split(':').map(Number);
      const minutes = h * 60 + m;
      const range = happyHourRanges.find(
        (r) => minutes >= r.startMin && minutes < r.endMin
      );
      return range?.label ?? null;
    },
    [happyHourRanges]
  );

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const startDayOfWeek = getDay(monthStart);
    const pad = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;
    return [...Array(pad).fill(null), ...days] as (Date | null)[];
  }, [currentMonth]);

  // ── Fetch full range on mount / when service or employee changes ──────────
  useEffect(() => {
    if (!companySlug || activeServiceIds.length === 0) return;

    const startDate = format(today, 'yyyy-MM-dd');
    const endDate = format(windowEnd, 'yyyy-MM-dd');

    setLoadingSlots(true);
    setSlotsMap({});

    fetchTimeSlotsRange({
      companySlug,
      serviceIds: activeServiceIds,
      employeeId: selectedEmployeeId,
      anyPerson,
      eligibleEmployeeIds,
      startDate,
      endDate,
      resursiIds: requiredResursiIds.length > 0 ? requiredResursiIds : undefined,
    })
      .then((res) => setSlotsMap(res.slots))
      .catch(() => setSlotsMap({}))
      .finally(() => setLoadingSlots(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    companySlug,
    // stringify prevents re-fetch on array identity change
    // eslint-disable-next-line react-hooks/exhaustive-deps
    JSON.stringify(activeServiceIds),
    selectedEmployeeId,
    anyPerson,
  ]);

  // Default to today on mount
  useEffect(() => {
    if (!selectedDate) selectDate(today);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isPrevDisabled = isBefore(endOfMonth(subMonths(currentMonth, 1)), today);

  const navigateMonth = (delta: number) => {
    setDirection(delta);
    setCurrentMonth(delta > 0 ? addMonths(currentMonth, 1) : subMonths(currentMonth, 1));
  };

  // Derive time slots from slotsMap — no per-day fetch needed
  const selectedDateKey = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : null;
  const daySlots = selectedDateKey ? slotsMap[selectedDateKey] : undefined;
  const timeSlots = Array.isArray(daySlots) ? daySlots : [];

  const handleTimeSelect = useCallback(async (time: string) => {
    useBookingStore.setState({ selectedTime: time });
    let shouldShowAddOnModal = false;

    if (!company?.idPodjetja || !selectedService || !selectedDate) {
      nextStep();
      return;
    }

    const storitevId = String(selectedService.id);
    const hasDiscount = !!serviceDiscounts[storitevId];

    if (!hasDiscount) {
      try {
        const hh = await checkHappyHour(company.idPodjetja, storitevId, selectedDate, time);
        if (hh && selectedService.cena) {
          const { finalCena, popustZnesek } = calculateDiscount(
            selectedService.cena, hh.tipPopusta, hh.vrednost
          );
          setActiveHappyHour({ ...hh, originalCena: selectedService.cena, finalCena, popustZnesek });
        } else {
          setActiveHappyHour(null);
        }
      } catch {
        setActiveHappyHour(null);
      }
    }

    computeActivePromotion(storitevId);

    if (selectedEmployeeId) {
      setLoadingAddOns(true);
      const [h, m] = time.split(':').map(Number);
      const totalMin =
        selectedServices.length > 0
          ? selectedServices.reduce((sum, s) => sum + s.trajanjeMin, 0)
          : selectedService.trajanjeMin;
      const endMinutes = h * 60 + m + totalMin;
      const endTime = `${String(Math.floor(endMinutes / 60)).padStart(2, '0')}:${String(endMinutes % 60).padStart(2, '0')}`;
      try {
        const addOns = await fetchAvailableAddOns(
          company.idPodjetja, storitevId, selectedEmployeeId, selectedDate, endTime, services
        );
        setAvailableAddOns(addOns);
        shouldShowAddOnModal = addOns.length > 0;
      } catch {
        setAvailableAddOns([]);
      } finally {
        setLoadingAddOns(false);
      }
    }

    if (shouldShowAddOnModal) {
      setShowAddOnModal(true);
    } else {
      nextStep();
    }
  }, [
    company, services, selectedService, selectedServices, selectedDate, selectedEmployeeId,
    serviceDiscounts, nextStep, setActiveHappyHour, computeActivePromotion,
    setAvailableAddOns, setLoadingAddOns,
  ]);

  // Availability check for a calendar day
  const isDayGrayed = useCallback((day: Date): boolean => {
    if (isBefore(day, today)) return true;
    // Beyond booking window
    if (isBefore(windowEnd, day)) return true;
    // During loading, only gray past/out-of-range
    if (isLoadingSlots) return false;
    const dateKey = format(day, 'yyyy-MM-dd');
    const data = slotsMap[dateKey];
    if (!data || data === 'fully_booked' || data === 'unavailable') return true;
    if (Array.isArray(data) && data.length === 0) return true;
    return false;
  }, [today, windowEnd, isLoadingSlots, slotsMap]);

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      {/* Heading */}
      <motion.div variants={itemVariants} className="mb-6">
        <h2
          style={{
            fontFamily: 'var(--font-playfair)',
            fontSize: '2.1rem',
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

            {/* Horizontal date pills — skeleton during loading */}
            {isLoadingSlots ? (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex-shrink-0 rounded-xl animate-pulse"
                    style={{ width: 52, height: 68, backgroundColor: '#F3F4F6' }}
                  />
                ))}
              </div>
            ) : (
              <div className="elegant-date-strip flex gap-1.5 overflow-x-auto pb-1">
                {calendarDays.map((day) => {
                  if (!day) return null;
                  const isGrayed = isDayGrayed(day);
                  const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
                  const isTodayDate = isToday(day);
                  const dow = getDay(day);
                  const weekdayAbbr = WEEK_DAYS[dow === 0 ? 6 : dow - 1];

                  return (
                    <button
                      key={day.toISOString()}
                      onClick={() => !isGrayed && selectDate(day)}
                      disabled={isGrayed}
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
                        color: isGrayed ? '#D1D5DB' : isSelected ? 'white' : '#374151',
                        boxShadow: isSelected
                          ? `0 2px 8px ${theme.primaryColor}30`
                          : '0 1px 2px rgba(0,0,0,0.04)',
                        opacity: isGrayed ? 0.45 : 1,
                        cursor: isGrayed ? 'not-allowed' : 'pointer',
                      }}
                    >
                      <span
                        style={{
                          fontFamily: 'var(--font-inter)',
                          fontSize: '0.65rem',
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
                          fontSize: '1.15rem',
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
            )}
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

              <div className="flex items-center gap-2">
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
                {isLoadingSlots && (
                  <motion.div
                    className="w-3 h-3 rounded-full border border-t-transparent"
                    style={{ borderColor: `${theme.primaryColor}60`, borderTopColor: 'transparent' }}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' as const }}
                  />
                )}
              </div>

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

                    const isGrayed = isDayGrayed(day);
                    const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
                    const isTodayDate = isToday(day);
                    const isWeekend = getDay(day) === 0 || getDay(day) === 6;

                    return (
                      <motion.button
                        key={day.toISOString()}
                        onClick={() => !isGrayed && selectDate(day)}
                        disabled={isGrayed}
                        className="elegant-cal-day"
                        style={{
                          color: isGrayed
                            ? '#D1D5DB'
                            : isSelected
                            ? 'white'
                            : isWeekend
                            ? '#6B7280'
                            : '#374151',
                          backgroundColor: isSelected ? theme.primaryColor : 'transparent',
                          boxShadow: isSelected ? `0 2px 8px ${theme.primaryColor}40` : 'none',
                          borderColor:
                            isTodayDate && !isSelected && !isGrayed
                              ? theme.primaryColor
                              : 'transparent',
                          borderWidth: '2px',
                          fontWeight: isTodayDate && !isGrayed ? 500 : 400,
                          cursor: isGrayed ? 'not-allowed' : 'pointer',
                          opacity: isGrayed ? 0.38 : 1,
                        }}
                        whileHover={
                          !isGrayed && !isSelected
                            ? { backgroundColor: `${theme.primaryColor}12`, scale: 1.05 }
                            : {}
                        }
                        whileTap={!isGrayed ? { scale: 0.94 } : {}}
                      >
                        {format(day, 'd')}
                        {isTodayDate && !isSelected && !isGrayed && (
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

              {selectedDate && !isLoadingSlots && timeSlots.length > 0 && (
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{
                    backgroundColor: `${theme.secondaryColor ?? theme.primaryColor}15`,
                    border: `1px solid ${theme.secondaryColor ?? theme.primaryColor}25`,
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--font-inter)',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      color: theme.secondaryColor ?? theme.primaryColor,
                      lineHeight: 1,
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
            ) : isLoadingSlots ? (
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
                const hhLabel = isHappyHour(slot);
                return (
                  <motion.button
                    key={slot}
                    onClick={() => handleTimeSelect(slot)}
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
                    <div className="flex items-center gap-2 min-w-0">
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
                      {hhLabel && (
                        <span
                          className="inline-block px-1.5 py-0.5 rounded text-[9px] font-semibold leading-none border flex-shrink-0"
                          style={{
                            background: `${theme.primaryColor}10`,
                            borderColor: `${theme.primaryColor}30`,
                            color: theme.primaryColor,
                            fontFamily: 'var(--font-inter)',
                          }}
                        >
                          {hhLabel}
                        </span>
                      )}
                    </div>

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
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 10"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M1 5L4.5 8.5L11 1" />
              </svg>
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

      <AnimatePresence>
        {showAddOnModal && availableAddOns.length > 0 && (
          <AddOnModal
            addOns={availableAddOns}
            onSelect={(addOn) => {
              selectAddOn(addOn);
              setShowAddOnModal(false);
              nextStep();
            }}
            onSkip={() => {
              selectAddOn(null);
              setShowAddOnModal(false);
              nextStep();
            }}
            language={language}
            variantStyle="elegant"
            accentColor={theme.primaryColor}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
