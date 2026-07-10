'use client';

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
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
  isAfter,
  startOfDay,
  addDays,
  getDay,
} from 'date-fns';
import { sl, enUS } from 'date-fns/locale';
import { useBookingStore } from '@/store/bookingStore';
import { fetchTimeSlotsRange } from '@/lib/api';
import { checkHappyHour, fetchAvailableAddOns, calculateDiscount, fetchHappyHoursForDay, type HappyHourRange } from '@/lib/promotionsApi';
import { usePromotionsStore } from '@/store/promotionsStore';
import { AddOnModal } from '@/components/shared/AddOnModal';
import { t } from '../../i18n';
import type { DaySlots } from '@/types';

interface Props {
  companySlug?: string;
}

const MOBILE_CARD_W = 68;
const MOBILE_CARD_GAP = 8;

const WEEK_DAYS_SL = ['Po', 'To', 'Sr', 'Če', 'Pe', 'So', 'Ne'];
const WEEK_DAYS_EN = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

const slideVariants: Variants = {
  enter: (d: number) => ({ x: d > 0 ? 30 : -30, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (d: number) => ({ x: d < 0 ? 30 : -30, opacity: 0 }),
};

type DayStatus = 'available' | 'fully_booked' | 'unavailable' | 'empty' | 'loading';

function getDayStatus(
  dateKey: string,
  slotsMap: Record<string, DaySlots>,
  isLoadingSlots: boolean
): DayStatus {
  if (isLoadingSlots) return 'loading';
  const data = slotsMap[dateKey];
  if (data === undefined) return 'unavailable';
  if (data === 'unavailable') return 'unavailable';
  if (data === 'fully_booked') return 'fully_booked';
  if (Array.isArray(data) && data.length === 0) return 'empty';
  if (Array.isArray(data) && data.length > 0) return 'available';
  return 'unavailable';
}

function ScarcityDot({ count }: { count: number }) {
  const color = count === 1 ? '#EF4444' : '#F97316';
  return (
    <span
      className="inline-block w-1.5 h-1.5 rounded-full mag-scarcity-pulse"
      style={{ backgroundColor: color }}
      aria-hidden="true"
    />
  );
}

export default function MagazineDateTimeSelection({ companySlug }: Props) {
  const {
    selectedDate,
    selectedTime,
    selectedEmployeeId,
    anyPerson,
    eligibleEmployeeIds,
    selectedService,
    selectedServices,
    requiredResursiIds,
    selectDate,
    nextStep,
    theme,
    company,
    services,
    language,
    slotsMap,
    isLoadingSlots,
    setSlotsMap,
    setLoadingSlots,
    maxDniRezervacija,
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
  const mobileScrollRef = useRef<HTMLDivElement>(null);

  const locale = language === 'en' ? enUS : sl;
  const weekDays = language === 'en' ? WEEK_DAYS_EN : WEEK_DAYS_SL;

  const today = useMemo(() => startOfDay(new Date()), []);
  const maxDate = useMemo(() => addDays(today, maxDniRezervacija), [today, maxDniRezervacija]);

  const mobileDates = useMemo(
    () => Array.from({ length: Math.max(maxDniRezervacija, 1) }, (_, i) => addDays(today, i)),
    [today, maxDniRezervacija]
  );

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

  // Fetch full range once when entering step / service or employee changes
  useEffect(() => {
    if (!companySlug || activeServiceIds.length === 0) return;

    const startDate = format(today, 'yyyy-MM-dd');
    const endDate = format(maxDate, 'yyyy-MM-dd');

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
    // stringify prevents re-fetch on array identity changes
    JSON.stringify(activeServiceIds),
    selectedEmployeeId,
    anyPerson,
  ]);

  // Default to today on mount
  useEffect(() => {
    if (!selectedDate) selectDate(today);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Scroll mobile strip to selected date on mount
  useEffect(() => {
    if (selectedDate && mobileScrollRef.current) {
      const idx = mobileDates.findIndex((d) => isSameDay(d, selectedDate));
      if (idx >= 0) {
        const offset =
          idx * (MOBILE_CARD_W + MOBILE_CARD_GAP) -
          mobileScrollRef.current.offsetWidth / 2 +
          MOBILE_CARD_W / 2;
        mobileScrollRef.current.scrollTo({ left: Math.max(0, offset), behavior: 'smooth' });
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const startDay = getDay(monthStart);
    const pad = startDay === 0 ? 6 : startDay - 1;
    return [...Array(pad).fill(null), ...days] as (Date | null)[];
  }, [currentMonth]);

  const isPrevDisabled = isBefore(endOfMonth(subMonths(currentMonth, 1)), today);

  const navigateMonth = (delta: number) => {
    setDirection(delta);
    setCurrentMonth(delta > 0 ? addMonths(currentMonth, 1) : subMonths(currentMonth, 1));
  };

  const scrollMobileTo = useCallback(
    (date: Date) => {
      if (!mobileScrollRef.current) return;
      const idx = mobileDates.findIndex((d) => isSameDay(d, date));
      if (idx >= 0) {
        const offset =
          idx * (MOBILE_CARD_W + MOBILE_CARD_GAP) -
          mobileScrollRef.current.offsetWidth / 2 +
          MOBILE_CARD_W / 2;
        mobileScrollRef.current.scrollTo({ left: Math.max(0, offset), behavior: 'smooth' });
      }
    },
    [mobileDates]
  );

  const handleDateSelect = useCallback(
    (date: Date, grayed: boolean) => {
      if (grayed) return;
      selectDate(date);
      scrollMobileTo(date);
    },
    [selectDate, scrollMobileTo]
  );

  const handleTimeSelect = useCallback(
    async (time: string) => {
      useBookingStore.setState({ selectedTime: time });
      let shouldShowAddOnModal = false;

      if (!company?.idPodjetja || !activeServiceIds.length || !selectedDate) {
        nextStep();
        return;
      }

      const primaryId = activeServiceIds[0];
      const primaryService =
        selectedServices.find((s) => s.id === primaryId) ?? selectedService;
      const primaryRowId = String(primaryService?.id ?? primaryId);
      const hasDiscount = !!serviceDiscounts[primaryRowId];

      if (!hasDiscount && primaryService) {
        try {
          const hh = await checkHappyHour(
            company.idPodjetja,
            primaryRowId,
            selectedDate,
            time
          );
          if (hh && primaryService.cena) {
            const { finalCena, popustZnesek } = calculateDiscount(
              primaryService.cena,
              hh.tipPopusta,
              hh.vrednost
            );
            setActiveHappyHour({
              ...hh,
              originalCena: primaryService.cena,
              finalCena,
              popustZnesek,
            });
          } else {
            setActiveHappyHour(null);
          }
        } catch {
          setActiveHappyHour(null);
        }
      }

      computeActivePromotion(primaryRowId);

      if (selectedEmployeeId && primaryService) {
        setLoadingAddOns(true);
        const [h, m] = time.split(':').map(Number);
        const totalMin =
          selectedServices.length > 0
            ? selectedServices.reduce((sum, s) => sum + s.trajanjeMin, 0)
            : primaryService.trajanjeMin;
        const endMinutes = h * 60 + m + totalMin;
        const endTime = `${String(Math.floor(endMinutes / 60)).padStart(2, '0')}:${String(
          endMinutes % 60
        ).padStart(2, '0')}`;
        try {
          const addOns = await fetchAvailableAddOns(
            company.idPodjetja,
            primaryRowId,
            selectedEmployeeId,
            selectedDate,
            endTime,
            services
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
    },
    [
      company,
      services,
      activeServiceIds,
      selectedServices,
      selectedService,
      selectedDate,
      selectedEmployeeId,
      serviceDiscounts,
      nextStep,
      setActiveHappyHour,
      computeActivePromotion,
      setAvailableAddOns,
      setLoadingAddOns,
    ]
  );

  // Derive time slots from slotsMap — no extra API call
  const selectedDateKey = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : null;
  const daySlots = selectedDateKey ? slotsMap[selectedDateKey] : undefined;
  const timeSlots = Array.isArray(daySlots) ? daySlots : [];

  // ── Shared time-slot list component ────────────────────────────────────────
  const TimeSlotList = () => {
    if (!selectedDate) {
      return (
        <div className="py-8 text-center">
          <div className="w-8 h-[1px] bg-black/10 mx-auto mb-4" />
          <p className="magazine-body text-[#6B6B6B] text-sm italic">
            {t(language, 'pickFromCalendar')}
          </p>
        </div>
      );
    }
    if (isLoadingSlots) {
      return (
        <div className="space-y-0">
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-between py-3 border-b"
              style={{ borderColor: 'rgba(0,0,0,0.06)' }}
            >
              <div className="w-12 h-3 mag-skeleton rounded" />
              <div className="flex-1 mx-4 h-[1px]" style={{ backgroundColor: 'rgba(0,0,0,0.06)' }} />
              <div className="w-4 h-4 rounded-full mag-skeleton" />
            </div>
          ))}
        </div>
      );
    }
    if (timeSlots.length === 0) {
      return (
        <div className="py-8 text-center">
          <div className="w-8 h-[1px] bg-black/10 mx-auto mb-4" />
          <p className="magazine-body text-[#6B6B6B] text-sm italic">
            {t(language, 'noSlots')}
          </p>
          <p className="magazine-caps text-[9px] tracking-[0.18em] text-black/30 mt-2">
            {t(language, 'noSlotsHint')}
          </p>
        </div>
      );
    }
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-0 max-h-72 overflow-y-auto magazine-scrollbar"
      >
        {timeSlots.map((time, i) => {
          const isTimeSelected = selectedTime === time;
          const hhLabel = isHappyHour(time);
          return (
            <motion.button
              key={time}
              onClick={() => handleTimeSelect(time)}
              initial={{ opacity: 0, x: 14 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.025 }}
              className="w-full flex items-center justify-between py-3 group border-b transition-all"
              style={{ borderColor: 'rgba(0,0,0,0.06)' }}
            >
              <div className="flex items-center gap-2 flex-shrink-0">
                <span
                  className="magazine-body text-[15px] transition-colors duration-200 tabular-nums"
                  style={{ color: isTimeSelected ? theme.primaryColor : '#1A1A1A' }}
                >
                  {time}
                </span>
                {hhLabel && (
                  <span
                    className="magazine-caps text-[8px] tracking-[0.12em] px-1.5 py-0.5 border leading-none"
                    style={{
                      color: theme.primaryColor,
                      borderColor: `${theme.primaryColor}40`,
                    }}
                  >
                    {hhLabel}
                  </span>
                )}
              </div>
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
                  borderColor: isTimeSelected
                    ? theme.primaryColor
                    : 'rgba(0,0,0,0.2)',
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
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-2xl"
    >
      {/* Section header */}
      <div className="mb-8">
        <div className="w-8 h-[1px] mb-5" style={{ backgroundColor: theme.primaryColor }} />
        <h1 className="magazine-serif text-[2.5rem] md:text-[3rem] text-[#1A1A1A] tracking-[-0.02em] leading-[1.1] mb-4">
          {t(language, 'appointmentTitle')}
        </h1>
        <div className="h-[1px] w-full bg-black/10 mb-4" />
        <p className="magazine-body text-[#6B6B6B] text-[15px] italic leading-relaxed">
          {t(language, 'appointmentSubtitle')}
        </p>
      </div>

      {/* ── MOBILE: polished horizontal date strip ── */}
      <div className="md:hidden mb-8">
        {/* Date strip */}
        <div
          ref={mobileScrollRef}
          className="flex overflow-x-auto mag-scrollbar-hide pb-1"
          style={{ scrollSnapType: 'x mandatory', gap: MOBILE_CARD_GAP }}
        >
          {isLoadingSlots
            ? Array.from({ length: 10 }).map((_, i) => (
                <div
                  key={i}
                  className="flex-shrink-0 mag-skeleton"
                  style={{
                    width: MOBILE_CARD_W,
                    height: 86,
                    scrollSnapAlign: 'center',
                    borderRadius: 2,
                  }}
                />
              ))
            : mobileDates.map((date, i) => {
                const dateKey = format(date, 'yyyy-MM-dd');
                const status = getDayStatus(dateKey, slotsMap, isLoadingSlots);
                const isAvailable = status === 'available';
                const isGrayed = status !== 'available';
                const scarceCount = isAvailable
                  ? (slotsMap[dateKey] as string[]).length
                  : 0;
                const isScarce = isAvailable && scarceCount < 3;
                const isSelected = selectedDate ? isSameDay(date, selectedDate) : false;
                const isTodayDate = isToday(date);
                const scarceColor = scarceCount === 1 ? '#EF4444' : '#F97316';

                return (
                  <button
                    key={i}
                    onClick={() => handleDateSelect(date, isGrayed)}
                    disabled={isGrayed}
                    className="flex-shrink-0 flex flex-col items-center justify-center py-3 relative"
                    style={{
                      width: MOBILE_CARD_W,
                      minHeight: 86,
                      scrollSnapAlign: 'center',
                      border: isSelected
                        ? `1px solid ${theme.primaryColor}`
                        : isTodayDate
                        ? `1px solid ${theme.primaryColor}35`
                        : '1px solid rgba(0,0,0,0.07)',
                      backgroundColor: isSelected
                        ? `${theme.primaryColor}08`
                        : 'transparent',
                      opacity: isGrayed ? 0.28 : 1,
                      cursor: isGrayed ? 'default' : 'pointer',
                      transition: 'border-color 0.15s, background-color 0.15s, opacity 0.15s',
                    }}
                    aria-label={format(date, 'd. MMMM', { locale })}
                    aria-pressed={isSelected}
                  >
                    {/* Day abbreviation */}
                    <span
                      className="magazine-caps leading-none"
                      style={{
                        fontSize: '8px',
                        letterSpacing: '0.14em',
                        color: isSelected ? theme.primaryColor : '#9CA3AF',
                        marginBottom: 5,
                      }}
                    >
                      {format(date, 'EEE', { locale }).toUpperCase().slice(0, 2)}
                    </span>

                    {/* Day number — large, editorial serif */}
                    <span
                      className="magazine-serif leading-none"
                      style={{
                        fontSize: '1.45rem',
                        color: isSelected ? theme.primaryColor : '#1A1A1A',
                        fontStyle: isSelected ? 'italic' : 'normal',
                        marginBottom: 4,
                      }}
                    >
                      {date.getDate()}
                    </span>

                    {/* Month abbreviation */}
                    <span
                      className="magazine-caps leading-none"
                      style={{
                        fontSize: '8px',
                        letterSpacing: '0.1em',
                        color: isSelected ? theme.primaryColor : '#C4C4C4',
                      }}
                    >
                      {format(date, 'MMM', { locale })}
                    </span>

                    {/* Scarcity indicator */}
                    {isScarce && (
                      <div
                        className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex items-center gap-0.5"
                      >
                        <ScarcityDot count={scarceCount} />
                        <span
                          style={{
                            fontSize: '0.5rem',
                            fontFamily: 'var(--font-playfair)',
                            color: isSelected ? theme.primaryColor : scarceColor,
                            lineHeight: 1,
                          }}
                        >
                          {scarceCount}
                        </span>
                      </div>
                    )}
                  </button>
                );
              })}
        </div>

        {/* Mobile time slots section */}
        <div className="mt-6">
          <div className="border-b border-black/10 pb-3 mb-4 flex items-baseline justify-between">
            <p className="magazine-caps text-[9px] tracking-[0.22em] text-[#6B6B6B]">
              {t(language, 'availableSlots')}
            </p>
            {selectedDate && (
              <p className="magazine-serif text-sm text-[#1A1A1A]">
                {format(selectedDate, 'd. MMMM', { locale })}
              </p>
            )}
          </div>
          <TimeSlotList />
        </div>
      </div>

      {/* ── DESKTOP: month calendar + time slots ── */}
      <div className="hidden md:grid md:grid-cols-2 gap-10 md:gap-12">
        {/* Calendar */}
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
                {format(currentMonth, 'LLLL yyyy', { locale })}
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
            {weekDays.map((d) => (
              <div
                key={d}
                className="text-center magazine-caps text-[9px] tracking-[0.15em] text-[#6B6B6B] py-1"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Calendar grid with gray-out + scarcity */}
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

                const dateKey = format(day, 'yyyy-MM-dd');
                const isPast = isBefore(startOfDay(day), today);
                const isBeyondWindow = isAfter(startOfDay(day), maxDate);
                const inMonth = isSameMonth(day, currentMonth);
                const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
                const isTodayDate = isToday(day);

                const status =
                  isPast || isBeyondWindow
                    ? 'unavailable'
                    : getDayStatus(dateKey, slotsMap, isLoadingSlots);

                const isAvailable = status === 'available';
                const isGrayed =
                  isPast ||
                  isBeyondWindow ||
                  (!isLoadingSlots && status !== 'available');

                const scarceCount = isAvailable
                  ? (slotsMap[dateKey] as string[]).length
                  : 0;
                const isScarce = isAvailable && scarceCount < 3;
                const scarceColor = scarceCount === 1 ? '#EF4444' : '#F97316';

                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => !isGrayed && handleDateSelect(day, isGrayed)}
                    disabled={isGrayed}
                    className={[
                      'aspect-square flex flex-col items-center justify-center relative group',
                      isGrayed ? 'cursor-not-allowed' : 'cursor-pointer',
                      !inMonth ? 'opacity-20' : '',
                    ]
                      .join(' ')
                      .trim()}
                  >
                    {/* Selected: filled circle */}
                    {isSelected && (
                      <motion.span
                        layoutId="magCalSelectedDay"
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
                      className={[
                        'relative z-10 text-[13px] transition-colors leading-none',
                        isGrayed ? 'text-black/20' : '',
                        !isGrayed && !isSelected
                          ? 'text-[#1A1A1A] group-hover:text-[#6B6B6B]'
                          : '',
                        isSelected ? 'text-white' : '',
                      ]
                        .join(' ')
                        .trim()}
                    >
                      {format(day, 'd')}
                    </span>

                    {/* Scarcity dot */}
                    {isScarce && (
                      <span
                        className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                        style={{
                          backgroundColor: isSelected
                            ? 'rgba(255,255,255,0.75)'
                            : scarceColor,
                        }}
                        title={`${scarceCount} ${t(language, 'scarce')}`}
                      />
                    )}
                  </button>
                );
              })}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Time slots */}
        <div>
          <div className="mb-6 border-b border-black/10 pb-4">
            <p className="magazine-caps text-[9px] tracking-[0.22em] text-[#6B6B6B] mb-1">
              {t(language, 'availableSlots')}
            </p>
            {selectedDate ? (
              <p className="magazine-serif text-xl text-[#1A1A1A]">
                {format(selectedDate, 'd. MMMM yyyy', { locale })}
              </p>
            ) : (
              <p className="magazine-body text-[#6B6B6B] text-sm italic">
                {t(language, 'noDate')}
              </p>
            )}
          </div>
          <TimeSlotList />
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
            {format(selectedDate, 'd. MMMM yyyy', { locale })}{' '}
            {t(language, 'atPreposition')}{' '}
            <span style={{ color: theme.primaryColor }}>{selectedTime}</span>
          </span>
        </motion.div>
      )}

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
            variantStyle="magazine"
            accentColor={theme.primaryColor}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
