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
import { t } from '../../i18n';

// TODO: if backend returns selectable resources in the future, add explicit
// resource-choice UI here. For now, resource availability is handled server-side.

interface Props {
  companySlug?: string;
}

const CARD_W = 72;
const CARD_GAP = 8;

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.28, ease: 'easeOut' as const },
  },
};

function ScarcityDot({ count }: { count: number }) {
  return (
    <span
      className={count === 1 ? 'modern-scarcity-dot-red' : 'modern-scarcity-dot-orange'}
      aria-hidden="true"
    />
  );
}

export default function ModernDateTimeSelection({ companySlug }: Props) {
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

  const scrollRef = useRef<HTMLDivElement>(null);

  // Use selectedServices if available, fall back to legacy selectedService
  const activeServiceIds = useMemo(() => {
    if (selectedServices.length > 0) return selectedServices.map((s) => s.id);
    if (selectedService) return [selectedService.id];
    return [];
  }, [selectedServices, selectedService]);

  const today = useMemo(() => startOfDay(new Date()), []);
  const dates = useMemo(
    () =>
      Array.from({ length: Math.max(maxDniRezervacija, 1) }, (_, i) =>
        addDays(today, i)
      ),
    [today, maxDniRezervacija]
  );

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

  // ── Fetch full date range on mount / when service/employee changes ──────────
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
    JSON.stringify(activeServiceIds),
    selectedEmployeeId,
    anyPerson,
  ]);

  // Default to today on first mount
  useEffect(() => {
    if (!selectedDate) selectDate(today);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Scroll selected date into view on mount
  useEffect(() => {
    if (selectedDate && scrollRef.current) {
      const idx = dates.findIndex((d) => isSameDay(d, selectedDate));
      if (idx >= 0) {
        const offset =
          idx * (CARD_W + CARD_GAP) -
          scrollRef.current.offsetWidth / 2 +
          CARD_W / 2;
        scrollRef.current.scrollTo({ left: Math.max(0, offset), behavior: 'smooth' });
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
          scrollRef.current.scrollTo({ left: Math.max(0, offset), behavior: 'smooth' });
        }
      }
    },
    [dates, selectDate]
  );

  const handleTimeSelect = useCallback(
    async (time: string) => {
      useBookingStore.setState({ selectedTime: time });
      let shouldShowAddOnModal = false;

      if (!company?.idPodjetja || activeServiceIds.length === 0 || !selectedDate) {
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
          const hh = await checkHappyHour(company.idPodjetja, primaryRowId, selectedDate, time);
          if (hh && primaryService.cena) {
            const { finalCena, popustZnesek } = calculateDiscount(
              primaryService.cena, hh.tipPopusta, hh.vrednost
            );
            setActiveHappyHour({ ...hh, originalCena: primaryService.cena, finalCena, popustZnesek });
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
        const endTime = `${String(Math.floor(endMinutes / 60)).padStart(2, '0')}:${String(endMinutes % 60).padStart(2, '0')}`;
        try {
          const addOns = await fetchAvailableAddOns(
            company.idPodjetja, primaryRowId, selectedEmployeeId, selectedDate, endTime, services
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
      company, services, selectedServices, selectedService, selectedDate,
      selectedEmployeeId, activeServiceIds, serviceDiscounts, nextStep,
      setActiveHappyHour, computeActivePromotion, setAvailableAddOns, setLoadingAddOns,
    ]
  );

  // Derive time slots from slotsMap — no extra API call needed
  const selectedDateKey = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : null;
  const daySlots = selectedDateKey ? slotsMap[selectedDateKey] : undefined;
  const timeSlots = Array.isArray(daySlots) ? daySlots : [];

  return (
    <div>
      {/* ── Heading ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22 }}
        className="mb-8"
      >
        <h2
          className="mb-2"
          style={{
            color: 'var(--t-primary)',
            fontFamily: 'var(--font-clash)',
            fontWeight: 400,
            fontSize: 'clamp(2rem, 5vw, 3.25rem)',
            letterSpacing: '-0.015em',
            lineHeight: 1.1,
          }}
        >
          {t(language, 'chooseDateTime')}
        </h2>
        <p className="text-sm" style={{ color: 'var(--t-muted)', fontFamily: 'var(--font-inter)' }}>
          {t(language, 'chooseAppointment')}
        </p>
      </motion.div>

      {/* ── Horizontal date strip ── */}
      <motion.div
        className="mb-8"
        variants={itemVariants}
        initial="hidden"
        animate="visible"
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

          {/* Scrollable dates */}
          <div className="flex-1 min-w-0">
            <div
              ref={scrollRef}
              className="flex gap-2 overflow-x-auto py-3 px-2 modern-scrollbar-hide"
              style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' as const }}
            >
              {isLoadingSlots
                ? Array.from({ length: 10 }).map((_, i) => (
                    <div
                      key={i}
                      className="flex-shrink-0 rounded-2xl modern-slot-shimmer"
                      style={{
                        width: CARD_W,
                        height: 90,
                        backgroundColor: 'var(--s2)',
                        scrollSnapAlign: 'center',
                      }}
                    />
                  ))
                : dates.map((date, i) => {
                    const dateKey = format(date, 'yyyy-MM-dd');
                    const dayData = slotsMap[dateKey];
                    const isAvailable = Array.isArray(dayData) && dayData.length > 0;
                    const isGrayed = !isAvailable;
                    const scarceCount = isAvailable ? dayData.length : 0;
                    const isScarce = isAvailable && scarceCount < 3;
                    const scarceColor = scarceCount === 1 ? '#EF4444' : '#F97316';

                    const isSelected = selectedDate ? isSameDay(date, selectedDate) : false;
                    const isTodayDate = isToday(date);

                    return (
                      <button
                        key={i}
                        onClick={() => handleDateSelect(date, isGrayed)}
                        disabled={isGrayed}
                        className="flex-shrink-0 flex flex-col items-center py-3 rounded-2xl relative"
                        style={{
                          width: CARD_W,
                          scrollSnapAlign: 'center',
                          backgroundColor: isSelected ? theme.primaryColor : 'var(--s2)',
                          border: isTodayDate && !isSelected
                            ? `2px solid ${theme.primaryColor}60`
                            : isSelected
                            ? `2px solid ${theme.primaryColor}`
                            : '2px solid transparent',
                          boxShadow: isSelected
                            ? `0 6px 22px ${theme.primaryColor}45`
                            : 'none',
                          opacity: isGrayed ? 0.35 : 1,
                          cursor: isGrayed ? 'not-allowed' : 'pointer',
                          transform: isSelected ? 'scale(1.06)' : 'scale(1)',
                          transition: 'background-color 0.18s, transform 0.18s, box-shadow 0.18s',
                        }}
                      >
                        <span
                          style={{
                            color: isSelected ? 'rgba(255,255,255,0.72)' : 'var(--t-faint)',
                            fontFamily: 'var(--font-inter)',
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
                            fontFamily: 'var(--font-clash)',
                            fontSize: '1.25rem',
                            fontWeight: 400,
                            lineHeight: 1,
                            marginBottom: 3,
                          }}
                        >
                          {date.getDate()}
                        </span>
                        <span
                          style={{
                            color: isSelected ? 'rgba(255,255,255,0.72)' : 'var(--t-faint)',
                            fontFamily: 'var(--font-inter)',
                            fontSize: '0.64rem',
                          }}
                        >
                          {format(date, 'MMM', { locale: sl })}
                        </span>

                        {/* Scarcity indicator */}
                        {isScarce && !isGrayed && (
                          <div className="mt-1 flex items-center gap-0.5">
                            <ScarcityDot count={scarceCount} />
                            <span
                              style={{
                                fontSize: '0.5rem',
                                fontFamily: 'var(--font-inter)',
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

      {/* ── Time slots — vertical list in a fixed-height scrollable container ── */}
      <AnimatePresence>
        {selectedDate && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
          >
            <div
              className="rounded-2xl overflow-hidden modern-glass"
              style={{
                backgroundColor: 'var(--s2)',
                border: '1px solid var(--b2)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
              }}
            >
              {/* Header row */}
              <div
                className="px-5 py-4 flex items-center justify-between border-b"
                style={{ borderColor: 'var(--b1)' }}
              >
                <div>
                  <p
                    className="uppercase tracking-widest mb-0.5"
                    style={{
                      fontFamily: 'var(--font-inter)',
                      fontSize: '0.6rem',
                      color: 'var(--t-faint)',
                      letterSpacing: '0.1em',
                    }}
                  >
                    {t(language, 'availableSlots')}
                  </p>
                  <p
                    className="capitalize"
                    style={{ fontFamily: 'var(--font-clash)', fontWeight: 400, fontSize: '0.95rem', color: 'var(--t-primary)' }}
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
                      fontFamily: 'var(--font-inter)',
                    }}
                  >
                    {timeSlots.length}
                  </div>
                )}
              </div>

              {/* Slot list */}
              <div className="p-3">
                {isLoadingSlots ? (
                  <div className="space-y-2">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div
                        key={i}
                        className="h-12 rounded-xl modern-slot-shimmer"
                        style={{
                          backgroundColor: 'var(--s1)',
                          animationDelay: `${i * 0.07}s`,
                        }}
                      />
                    ))}
                  </div>
                ) : timeSlots.length === 0 ? (
                  <div className="text-center py-8">
                    <div
                      className="w-10 h-10 rounded-full mx-auto mb-3 flex items-center justify-center"
                      style={{ backgroundColor: 'var(--s1)' }}
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        style={{ color: 'var(--t-faint)' }}
                      >
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 8v4M12 16h.01" />
                      </svg>
                    </div>
                    <p
                      className="text-sm"
                      style={{ color: 'var(--t-muted)', fontFamily: 'var(--font-inter)' }}
                    >
                      {t(language, 'noSlotsForDay')}
                    </p>
                    <p
                      className="text-xs mt-1"
                      style={{ color: 'var(--t-faint)', fontFamily: 'var(--font-inter)' }}
                    >
                      {t(language, 'tryOtherDate')}
                    </p>
                  </div>
                ) : (
                  <motion.div
                    className="modern-timeslot-scroll space-y-1.5"
                    initial="hidden"
                    animate="visible"
                    variants={{ visible: { transition: { staggerChildren: 0.025 } } }}
                  >
                    {timeSlots.map((slot) => {
                      const isSelected = selectedTime === slot;
                      const hhLabel = isHappyHour(slot);
                      return (
                        <motion.button
                          key={slot}
                          onClick={() => handleTimeSelect(slot)}
                          variants={{
                            hidden: { opacity: 0, x: -8 },
                            visible: {
                              opacity: 1,
                              x: 0,
                              transition: { duration: 0.18, ease: 'easeOut' as const },
                            },
                          }}
                          className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-sm font-semibold"
                          style={{
                            backgroundColor: isSelected ? theme.primaryColor : 'var(--s1)',
                            color: isSelected ? '#ffffff' : 'var(--t-primary)',
                            border: `1px solid ${isSelected ? theme.primaryColor : 'var(--b1)'}`,
                            fontFamily: 'var(--font-inter)',
                            boxShadow: isSelected ? `0 4px 14px ${theme.primaryColor}40` : 'none',
                            transition: 'background-color 0.15s, color 0.15s, box-shadow 0.15s',
                          }}
                          whileTap={{ scale: 0.98 }}
                          whileHover={!isSelected ? { backgroundColor: 'var(--s2)' } : {}}
                        >
                          <div className="flex items-center gap-2">
                            <span>{slot}</span>
                            {hhLabel && (
                              <span
                                className="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold leading-none"
                                style={{
                                  background: isSelected
                                    ? 'rgba(255,255,255,0.2)'
                                    : `${theme.primaryColor}14`,
                                  color: isSelected ? '#ffffff' : theme.primaryColor,
                                  border: `1px solid ${isSelected ? 'rgba(255,255,255,0.3)' : `${theme.primaryColor}30`}`,
                                  fontFamily: 'var(--font-inter)',
                                }}
                              >
                                {hhLabel}
                              </span>
                            )}
                          </div>
                          {isSelected && (
                            <motion.svg
                              className="w-4 h-4 text-white flex-shrink-0"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </motion.svg>
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

      {/* ── Selected summary pill ── */}
      <AnimatePresence>
        {selectedDate && selectedTime && (
          <motion.div
            className="mt-5 px-4 py-3.5 rounded-2xl flex items-center gap-3"
            style={{
              backgroundColor: `${theme.primaryColor}15`,
              border: `1px solid ${theme.primaryColor}30`,
            }}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
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
              style={{ color: 'var(--t-soft)', fontFamily: 'var(--font-inter)' }}
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
            variantStyle="modern"
            accentColor={theme.primaryColor}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
