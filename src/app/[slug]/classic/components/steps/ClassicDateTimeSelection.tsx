'use client';

import {
  useState,
  useMemo,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import {
  format,
  isSameDay,
  isToday,
  startOfDay,
  addDays,
} from 'date-fns';
import { sl } from 'date-fns/locale';
import { useBookingStore } from '@/store/bookingStore';
import { fetchTimeSlotsRange } from '@/lib/api';
import {
  checkHappyHour,
  fetchAvailableAddOns,
  calculateDiscount,
  fetchHappyHoursForDay,
  type HappyHourRange,
} from '@/lib/promotionsApi';
import { usePromotionsStore } from '@/store/promotionsStore';
import { AddOnModal } from '@/components/shared/AddOnModal';
import { getContrastMode } from '../ClassicLayout';
import { t } from '../../i18n';

// TODO: if backend returns selectable resources in the future, add explicit
// resource-choice UI here. For now, resource availability is handled server-side.

interface Props {
  companySlug?: string;
}

const CARD_W = 68;
const CARD_GAP = 8;

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.28, ease: 'easeOut' as const },
  },
};

const slotVariants: Variants = {
  hidden: { opacity: 0, scale: 0.93 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.18, ease: 'easeOut' as const },
  },
};

function ScarcityDot({ count }: { count: number }) {
  const cls =
    count === 1 ? 'classic-pulse-red' : 'classic-pulse-orange';
  return (
    <span
      className={`inline-block w-1.5 h-1.5 ${cls}`}
      aria-hidden="true"
    />
  );
}

export default function ClassicDateTimeSelection({ companySlug }: Props) {
  const {
    theme,
    company,
    services,
    selectedServices,
    selectedService,
    selectedDate,
    selectedTime,
    selectedEmployeeId,
    anyPerson,
    eligibleEmployeeIds,
    requiredResursiIds,
    maxDniRezervacija,
    slotsMap,
    isLoadingSlots,
    setSlotsMap,
    setLoadingSlots,
    selectDate,
    language,
    nextStep,
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

  const [happyHourRanges, setHappyHourRanges] = useState<HappyHourRange[]>([]);
  const [showAddOnModal, setShowAddOnModal] = useState(false);

  const contrastMode = getContrastMode(theme.bgFrom, theme.bgTo);
  const textPrimary =
    contrastMode === 'light' ? 'rgba(255,255,255,0.95)' : 'rgba(0,0,0,0.9)';
  const textSecondary =
    contrastMode === 'light' ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.55)';

  const scrollRef = useRef<HTMLDivElement>(null);

  // Use selectedServices if available, fall back to legacy selectedService
  const activeServiceIds = useMemo(() => {
    if (selectedServices.length > 0) return selectedServices.map((s) => s.id);
    if (selectedService) return [selectedService.id];
    return [];
  }, [selectedServices, selectedService]);

  // Fetch happy-hour ranges for the selected date so badges appear before click
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

  const today = useMemo(() => startOfDay(new Date()), []);
  const dates = useMemo(
    () =>
      Array.from({ length: Math.max(maxDniRezervacija, 1) }, (_, i) =>
        addDays(today, i)
      ),
    [today, maxDniRezervacija]
  );

  // ── Fetch full range on mount / when service/employee changes ──────────────
  useEffect(() => {
    if (!companySlug || activeServiceIds.length === 0) return;

    const startDate = format(today, 'yyyy-MM-dd');
    const endDate = format(addDays(today, maxDniRezervacija), 'yyyy-MM-dd');

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
    // stringify to avoid re-fetch on array identity changes
    JSON.stringify(activeServiceIds),
    selectedEmployeeId,
    anyPerson,
  ]);

  // Default to today if no date is selected
  useEffect(() => {
    if (!selectedDate) selectDate(today);
  }, []); // only on mount

  // Scroll selected date into view on mount
  useEffect(() => {
    if (selectedDate && scrollRef.current) {
      const idx = dates.findIndex((d) => isSameDay(d, selectedDate));
      if (idx >= 0) {
        const offset =
          idx * (CARD_W + CARD_GAP) -
          scrollRef.current.offsetWidth / 2 +
          CARD_W / 2;
        scrollRef.current.scrollTo({
          left: Math.max(0, offset),
          behavior: 'smooth',
        });
      }
    }
  }, []); // only on mount

  const scrollBy = useCallback((direction: number) => {
    scrollRef.current?.scrollBy({
      left: direction * (CARD_W + CARD_GAP) * 5,
      behavior: 'smooth',
    });
  }, []);

  const handleDateSelect = useCallback(
    (date: Date, grayed: boolean) => {
      if (grayed) return;
      selectDate(date);
      if (scrollRef.current) {
        const idx = dates.findIndex((d) => isSameDay(d, date));
        if (idx >= 0) {
          const offset =
            idx * (CARD_W + CARD_GAP) -
            scrollRef.current.offsetWidth / 2 +
            CARD_W / 2;
          scrollRef.current.scrollTo({
            left: Math.max(0, offset),
            behavior: 'smooth',
          });
        }
      }
    },
    [dates, selectDate]
  );

  const handleTimeSelect = async (time: string) => {
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
        (selectedServices.length > 0
          ? selectedServices.reduce((sum, s) => sum + s.trajanjeMin, 0)
          : primaryService.trajanjeMin);
      const endMinutes = h * 60 + m + totalMin;
      const endTime = `${String(Math.floor(endMinutes / 60)).padStart(2, '0')}:${String(endMinutes % 60).padStart(2, '0')}`;
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
  };

  // Derive time slots from slotsMap (no extra API call)
  const selectedDateKey = selectedDate
    ? format(selectedDate, 'yyyy-MM-dd')
    : null;
  const daySlots = selectedDateKey ? slotsMap[selectedDateKey] : undefined;
  const timeSlots = Array.isArray(daySlots) ? daySlots : [];

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      {/* Title */}
      <motion.div variants={itemVariants} className="mb-5">
        <h2
          className="text-3xl font-bold mb-1.5"
          style={{ fontFamily: 'var(--font-nunito)', color: textPrimary }}
        >
          {t(language, 'chooseDateTime')}
        </h2>
        <p
          style={{
            fontFamily: 'var(--font-nunito-sans)',
            fontSize: '0.9rem',
            color: textSecondary,
          }}
        >
          {t(language, 'chooseAppointment')}
        </p>
      </motion.div>

      {/* ── Horizontal date strip ── */}
      <motion.div variants={itemVariants} className="mb-5">
        <div className="flex items-center gap-2">
          {/* Left arrow */}
          <button
            onClick={() => scrollBy(-1)}
            className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-opacity hover:opacity-70"
            style={{
              background: 'rgba(255,255,255,0.9)',
              border: '1.5px solid rgba(0,0,0,0.07)',
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
              color: '#6B7280',
            }}
            aria-label="scroll back"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Scrollable dates */}
          <div className="flex-1 min-w-0">
            <div
              ref={scrollRef}
              className="flex gap-2 overflow-x-auto py-2 px-0.5 classic-scrollbar-hide"
              style={{ scrollSnapType: 'x mandatory' }}
            >
              {isLoadingSlots
                ? // Skeleton chips while loading
                  Array.from({ length: 10 }).map((_, i) => (
                    <div
                      key={i}
                      className="flex-shrink-0 rounded-2xl animate-pulse"
                      style={{
                        width: CARD_W,
                        height: 88,
                        background: 'rgba(255,255,255,0.5)',
                        scrollSnapAlign: 'center',
                      }}
                    />
                  ))
                : dates.map((date, i) => {
                    const dateKey = format(date, 'yyyy-MM-dd');
                    const dayData = slotsMap[dateKey];
                    const isAvailable =
                      Array.isArray(dayData) && dayData.length > 0;
                    const isGrayed = !isAvailable; // fully_booked, unavailable, empty, or undefined
                    const scarceCount = isAvailable ? dayData.length : 0;
                    const isScarce = isAvailable && scarceCount < 3;

                    const isSelected = selectedDate
                      ? isSameDay(date, selectedDate)
                      : false;
                    const isTodayDate = isToday(date);

                    const scarceColor =
                      scarceCount === 1 ? '#EF4444' : '#F97316';

                    return (
                      <button
                        key={i}
                        onClick={() => handleDateSelect(date, isGrayed)}
                        disabled={isGrayed}
                        className="flex-shrink-0 flex flex-col items-center py-2.5 rounded-2xl relative"
                        style={{
                          width: CARD_W,
                          scrollSnapAlign: 'center',
                          background: isSelected
                            ? theme.primaryColor
                            : 'rgba(255,255,255,0.92)',
                          border: isTodayDate && !isSelected
                            ? `2px solid ${theme.primaryColor}50`
                            : isSelected
                            ? `2px solid ${theme.primaryColor}`
                            : '2px solid transparent',
                          boxShadow: isSelected
                            ? `0 5px 18px ${theme.primaryColor}42`
                            : '0 1px 6px rgba(0,0,0,0.05)',
                          opacity: isGrayed ? 0.38 : 1,
                          cursor: isGrayed ? 'not-allowed' : 'pointer',
                          transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                          transition:
                            'background 0.15s, transform 0.15s, box-shadow 0.15s, opacity 0.15s',
                        }}
                      >
                        {/* Day of week */}
                        <span
                          style={{
                            color: isSelected
                              ? 'rgba(255,255,255,0.7)'
                              : '#9CA3AF',
                            fontFamily: 'var(--font-nunito-sans)',
                            fontSize: '0.58rem',
                            fontWeight: 600,
                            letterSpacing: '0.07em',
                            marginBottom: 2,
                          }}
                        >
                          {format(date, 'EEE', { locale: sl })
                            .toUpperCase()
                            .slice(0, 3)}
                        </span>

                        {/* Day number */}
                        <span
                          style={{
                            color: isSelected ? '#ffffff' : '#1F2937',
                            fontFamily: 'var(--font-nunito)',
                            fontSize: '1.2rem',
                            fontWeight: 700,
                            lineHeight: 1,
                            marginBottom: 2,
                          }}
                        >
                          {date.getDate()}
                        </span>

                        {/* Month */}
                        <span
                          style={{
                            color: isSelected
                              ? 'rgba(255,255,255,0.65)'
                              : '#9CA3AF',
                            fontFamily: 'var(--font-nunito-sans)',
                            fontSize: '0.6rem',
                          }}
                        >
                          {format(date, 'MMM', { locale: sl })}
                        </span>

                        {/* Scarcity badge */}
                        {isScarce && !isGrayed && (
                          <div
                            className="mt-1 flex items-center gap-0.5"
                          >
                            <ScarcityDot count={scarceCount} />
                            <span
                              style={{
                                fontSize: '0.52rem',
                                fontFamily: 'var(--font-nunito-sans)',
                                fontWeight: 700,
                                color: isSelected ? 'rgba(255,255,255,0.85)' : scarceColor,
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
          </div>

          {/* Right arrow */}
          <button
            onClick={() => scrollBy(1)}
            className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-opacity hover:opacity-70"
            style={{
              background: 'rgba(255,255,255,0.9)',
              border: '1.5px solid rgba(0,0,0,0.07)',
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
              color: '#6B7280',
            }}
            aria-label="scroll forward"
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
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0, y: -6 }}
          >
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                background: 'rgba(255,255,255,0.96)',
                boxShadow: '0 4px 18px rgba(0,0,0,0.07)',
              }}
            >
              {/* Header */}
              <div
                className="px-5 py-4 border-b flex items-center justify-between"
                style={{ borderColor: 'rgba(0,0,0,0.05)' }}
              >
                <div>
                  <p
                    className="uppercase tracking-wide mb-0.5"
                    style={{
                      fontFamily: 'var(--font-nunito-sans)',
                      fontSize: '0.6rem',
                      color: '#9CA3AF',
                      letterSpacing: '0.1em',
                    }}
                  >
                    {t(language, 'availableSlots')}
                  </p>
                  <p
                    className="font-bold text-gray-800 capitalize"
                    style={{ fontFamily: 'var(--font-nunito)', fontSize: '0.95rem' }}
                  >
                    {format(selectedDate, 'd. MMMM yyyy', { locale: sl })}
                  </p>
                </div>

                {!isLoadingSlots && timeSlots.length > 0 && (
                  <div
                    className="px-3 py-1 rounded-full text-xs font-semibold"
                    style={{
                      background: `${theme.primaryColor}14`,
                      color: theme.primaryColor,
                      fontFamily: 'var(--font-nunito-sans)',
                    }}
                  >
                    {timeSlots.length}
                  </div>
                )}
              </div>

              {/* Slot grid */}
              <div className="p-4">
                {isLoadingSlots ? (
                  /* Skeleton */
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div
                        key={i}
                        className="h-11 rounded-xl animate-pulse"
                        style={{ background: '#F3F4F6' }}
                      />
                    ))}
                  </div>
                ) : timeSlots.length === 0 ? (
                  <div className="text-center py-8">
                    <div
                      className="w-10 h-10 rounded-full mx-auto mb-3 flex items-center justify-center"
                      style={{ background: '#F3F4F6' }}
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#9CA3AF"
                        strokeWidth="2"
                        strokeLinecap="round"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 8v4M12 16h.01" />
                      </svg>
                    </div>
                    <p
                      className="text-sm text-gray-400"
                      style={{ fontFamily: 'var(--font-nunito-sans)' }}
                    >
                      {t(language, 'noSlotsForDay')}
                    </p>
                    <p
                      className="text-xs text-gray-300 mt-1"
                      style={{ fontFamily: 'var(--font-nunito-sans)' }}
                    >
                      {t(language, 'tryOtherDate')}
                    </p>
                  </div>
                ) : (
                  <motion.div
                    className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2"
                    initial="hidden"
                    animate="visible"
                    variants={{
                      visible: { transition: { staggerChildren: 0.025 } },
                    }}
                  >
                    {timeSlots.map((time) => {
                      const isSelected = selectedTime === time;
                      const hhLabel = isHappyHour(time);
                      return (
                        <motion.button
                          key={time}
                          onClick={() => handleTimeSelect(time)}
                          variants={slotVariants}
                          className="classic-slot-btn py-2.5 px-2 rounded-xl text-sm font-semibold text-center flex flex-col items-center justify-center gap-0.5"
                          style={{
                            fontFamily: 'var(--font-nunito-sans)',
                            background: isSelected
                              ? theme.primaryColor
                              : '#F8F9FA',
                            color: isSelected ? '#ffffff' : '#374151',
                            border: `2px solid ${
                              isSelected ? theme.primaryColor : hhLabel ? `${theme.primaryColor}30` : 'transparent'
                            }`,
                            boxShadow: isSelected
                              ? `0 4px 12px ${theme.primaryColor}38`
                              : '0 1px 3px rgba(0,0,0,0.04)',
                            transition:
                              'background 0.13s, color 0.13s, box-shadow 0.13s, transform 0.13s',
                            minHeight: 44,
                          }}
                          whileHover={
                            !isSelected
                              ? {
                                  backgroundColor: `${theme.primaryColor}14`,
                                  scale: 1.03,
                                }
                              : {}
                          }
                          whileTap={{ scale: 0.95 }}
                        >
                          <span>{time}</span>
                          {hhLabel && (
                            <span
                              className="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold leading-none"
                              style={{
                                background: isSelected ? 'rgba(255,255,255,0.25)' : theme.primaryColor,
                                color: '#ffffff',
                                fontFamily: 'var(--font-nunito-sans)',
                              }}
                            >
                              {hhLabel}
                            </span>
                          )}
                        </motion.button>
                      );
                    })}
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* No date selected placeholder */}
      {!selectedDate && !isLoadingSlots && (
        <motion.div variants={itemVariants}>
          <div
            className="rounded-2xl p-8 text-center"
            style={{
              background: 'rgba(255,255,255,0.95)',
              boxShadow: '0 3px 14px rgba(0,0,0,0.06)',
            }}
          >
            <p
              className="text-sm text-gray-400"
              style={{ fontFamily: 'var(--font-nunito-sans)' }}
            >
              {t(language, 'chooseAbove')}
            </p>
          </div>
        </motion.div>
      )}

      {/* Selected summary pill */}
      <AnimatePresence>
        {selectedDate && selectedTime && (
          <motion.div
            className="mt-4 px-4 py-3 rounded-2xl flex items-center gap-3"
            style={{
              background: `${theme.primaryColor}12`,
              border: `1px solid ${theme.primaryColor}28`,
            }}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.25 }}
          >
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: theme.primaryColor }}
            >
              <svg
                width="11"
                height="11"
                viewBox="0 0 11 11"
                fill="none"
                stroke="white"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M1.5 5.5l3 3 5-5" />
              </svg>
            </div>
            <p
              className="text-sm capitalize"
              style={{
                fontFamily: 'var(--font-nunito-sans)',
                color: '#374151',
              }}
            >
              <span className="font-semibold">
                {format(selectedDate, 'd. MMMM yyyy', { locale: sl })}
              </span>{' '}
              ob{' '}
              <span
                className="font-semibold"
                style={{ color: theme.primaryColor }}
              >
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
            variantStyle="classic"
            accentColor={theme.primaryColor}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
