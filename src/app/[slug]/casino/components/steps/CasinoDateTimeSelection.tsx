'use client';

import {
  useState,
  useMemo,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { format, isSameDay, isToday, startOfDay, addDays } from 'date-fns';
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

const CARD_W = 68;
const CARD_GAP = 8;

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

function ScarcityDot({ count }: { count: number }) {
  return (
    <span
      className={`inline-block w-1.5 h-1.5 rounded-full ${count === 1 ? 'mc-pulse-red' : 'mc-pulse-orange'}`}
      aria-hidden="true"
      style={{ background: count === 1 ? '#EF4444' : '#F97316' }}
    />
  );
}

export default function CasinoDateTimeSelection({ companySlug }: Props) {
  const {
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

  const activeServiceIds = useMemo(() => {
    if (selectedServices.length > 0) return selectedServices.map((s) => s.id);
    if (selectedService) return [selectedService.id];
    return [];
  }, [selectedServices, selectedService]);

  const today = useMemo(() => startOfDay(new Date()), []);
  const dates = useMemo(
    () => Array.from({ length: Math.max(maxDniRezervacija, 1) }, (_, i) => addDays(today, i)),
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

  // Default to today on mount
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
        scrollRef.current.scrollTo({ left: Math.max(0, offset), behavior: 'smooth' });
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
          scrollRef.current.scrollTo({ left: Math.max(0, offset), behavior: 'smooth' });
        }
      }
    },
    [dates, selectDate]
  );

  const handleTimeSelect = useCallback(async (time: string) => {
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
        const hh = await checkHappyHour(company.idPodjetja, primaryRowId, selectedDate, time);
        if (hh && primaryService.cena) {
          const { finalCena, popustZnesek } = calculateDiscount(primaryService.cena, hh.tipPopusta, hh.vrednost);
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
      const totalMin = selectedServices.length > 0
        ? selectedServices.reduce((sum, s) => sum + s.trajanjeMin, 0)
        : primaryService.trajanjeMin;
      const endMinutes = h * 60 + m + totalMin;
      const endTime = `${String(Math.floor(endMinutes / 60)).padStart(2, '0')}:${String(endMinutes % 60).padStart(2, '0')}`;
      try {
        const addOns = await fetchAvailableAddOns(company.idPodjetja, primaryRowId, selectedEmployeeId, selectedDate, endTime, services);
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
  }, [company, services, selectedServices, selectedService, activeServiceIds, selectedDate, selectedEmployeeId, serviceDiscounts, nextStep, setActiveHappyHour, computeActivePromotion, setAvailableAddOns, setLoadingAddOns]);

  // Derive time slots from slotsMap
  const selectedDateKey = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : null;
  const daySlots = selectedDateKey ? slotsMap[selectedDateKey] : undefined;
  const timeSlots = Array.isArray(daySlots) ? daySlots : [];

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">

      {/* ── Single horizontal date row ── */}
      <motion.div variants={itemVariants} className="mb-5">
        <div className="flex items-center gap-2">
          {/* Left scroll arrow */}
          <button
            onClick={() => scrollBy(-1)}
            className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all"
            style={{
              background: 'rgba(10, 40, 20, 0.7)',
              border: '1px solid rgba(201,168,76,0.2)',
              color: 'rgba(201,168,76,0.6)',
              fontSize: '0.85rem',
            }}
            aria-label="scroll back"
          >
            ‹
          </button>

          {/* Scrollable dates */}
          <div className="flex-1 min-w-0">
            <div
              ref={scrollRef}
              className="flex gap-2 overflow-x-auto py-2 px-0.5 mc-scrollbar-hide"
              style={{ scrollSnapType: 'x mandatory' }}
            >
              {isLoadingSlots
                ? Array.from({ length: 10 }).map((_, i) => (
                    <div
                      key={i}
                      className="flex-shrink-0 rounded-lg animate-pulse"
                      style={{
                        width: CARD_W,
                        height: 82,
                        background: 'rgba(201,168,76,0.07)',
                        scrollSnapAlign: 'center',
                        border: '1px solid rgba(201,168,76,0.1)',
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

                    const isSelected = selectedDate ? isSameDay(date, selectedDate) : false;
                    const isTodayDate = isToday(date);

                    return (
                      <button
                        key={i}
                        onClick={() => handleDateSelect(date, isGrayed)}
                        disabled={isGrayed}
                        className="flex-shrink-0 flex flex-col items-center py-2.5 rounded-lg relative"
                        style={{
                          width: CARD_W,
                          scrollSnapAlign: 'center',
                          background: isSelected ? '#c9a84c' : 'rgba(10, 40, 20, 0.75)',
                          border: isTodayDate && !isSelected
                            ? '1px solid rgba(201,168,76,0.5)'
                            : isSelected
                            ? '1px solid #c9a84c'
                            : '1px solid rgba(201,168,76,0.15)',
                          boxShadow: isSelected ? '0 4px 16px rgba(201,168,76,0.35)' : '0 2px 8px rgba(0,0,0,0.2)',
                          opacity: isGrayed ? 0.3 : 1,
                          cursor: isGrayed ? 'not-allowed' : 'pointer',
                          transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                          transition: 'all 0.18s ease',
                        }}
                      >
                        {/* Day of week */}
                        <span
                          style={{
                            fontFamily: 'var(--font-oswald)',
                            fontSize: '0.52rem',
                            letterSpacing: '0.1em',
                            textTransform: 'uppercase',
                            color: isSelected ? 'rgba(6,15,8,0.65)' : 'rgba(201,168,76,0.45)',
                            marginBottom: 2,
                          }}
                        >
                          {format(date, 'EEE', { locale: sl }).toUpperCase().slice(0, 2)}
                        </span>

                        {/* Day number */}
                        <span
                          style={{
                            fontFamily: 'var(--font-playfair)',
                            fontSize: '1.3rem',
                            fontWeight: 700,
                            lineHeight: 1,
                            color: isSelected ? '#060f08' : '#f5edd6',
                            marginBottom: 2,
                          }}
                        >
                          {date.getDate()}
                        </span>

                        {/* Month */}
                        <span
                          style={{
                            fontFamily: 'var(--font-oswald)',
                            fontSize: '0.52rem',
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase',
                            color: isSelected ? 'rgba(6,15,8,0.55)' : 'rgba(201,168,76,0.4)',
                          }}
                        >
                          {format(date, 'MMM', { locale: sl })}
                        </span>

                        {/* Scarcity badge */}
                        {isScarce && !isGrayed && (
                          <div className="mt-1 flex items-center gap-0.5">
                            <ScarcityDot count={scarceCount} />
                            <span
                              style={{
                                fontSize: '0.48rem',
                                fontFamily: 'var(--font-oswald)',
                                fontWeight: 700,
                                color: isSelected
                                  ? 'rgba(6,15,8,0.75)'
                                  : scarceCount === 1 ? '#EF4444' : '#F97316',
                              }}
                            >
                              {scarceCount}
                            </span>
                          </div>
                        )}

                        {/* Gold dot for today (not selected) */}
                        {isTodayDate && !isSelected && (
                          <span
                            className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                            style={{ background: '#c9a84c' }}
                          />
                        )}
                      </button>
                    );
                  })}
            </div>
          </div>

          {/* Right scroll arrow */}
          <button
            onClick={() => scrollBy(1)}
            className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all"
            style={{
              background: 'rgba(10, 40, 20, 0.7)',
              border: '1px solid rgba(201,168,76,0.2)',
              color: 'rgba(201,168,76,0.6)',
              fontSize: '0.85rem',
            }}
            aria-label="scroll forward"
          >
            ›
          </button>
        </div>
      </motion.div>

      {/* ── Time slots ── */}
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
                {t(language, 'availableSlots')}
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
                  {t(language, 'noDateSelected')}
                </p>
              )}
            </div>

            {selectedDate && !isLoadingSlots && timeSlots.length > 0 && (
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
                  {timeSlots.length}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Slot content */}
        <div className="p-4">
          {!selectedDate ? (
            <div className="text-center py-8">
              <span style={{ fontFamily: 'Georgia, serif', fontSize: '1.5rem', color: 'rgba(201,168,76,0.15)' }}>◆</span>
              <p className="mt-3 italic" style={{ fontFamily: 'var(--font-cormorant)', fontSize: '0.9rem', color: 'rgba(201,168,76,0.3)' }}>
                {t(language, 'noDateSelected')}
              </p>
            </div>
          ) : isLoadingSlots ? (
            /* Desktop: 3 col grid skeleton; mobile: 1 col */
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-10 rounded-md animate-pulse" style={{ background: 'rgba(201,168,76,0.06)' }} />
              ))}
            </div>
          ) : timeSlots.length === 0 ? (
            <div className="text-center py-8">
              <span style={{ fontFamily: 'Georgia, serif', fontSize: '1.5rem', color: 'rgba(201,168,76,0.2)' }}>◆</span>
              <p style={{ fontFamily: 'var(--font-oswald)', fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(201,168,76,0.35)', marginTop: '0.75rem' }}>
                {t(language, 'noSlots')}
              </p>
              <p className="mt-1 italic" style={{ fontFamily: 'var(--font-cormorant)', fontSize: '0.85rem', color: 'rgba(201,168,76,0.25)' }}>
                {t(language, 'noSlotsHint')}
              </p>
            </div>
          ) : (
            /* Desktop: 3-col grid; Mobile: 1-col stacked column, scrollable */
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 max-h-52 overflow-y-auto mc-scroll">
              {timeSlots.map((time, i) => {
                const isSelected = selectedTime === time;
                const hhLabel = isHappyHour(time);
                return (
                  <motion.button
                    key={time}
                    onClick={() => handleTimeSelect(time)}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.025, ease: 'easeOut' as const }}
                    className={`mc-time-slot ${isSelected ? 'selected' : ''} flex flex-col items-center justify-center gap-0.5`}
                    whileHover={!isSelected ? { y: -1 } : {}}
                    whileTap={{ scale: 0.96 }}
                  >
                    <span>{time}</span>
                    {hhLabel && (
                      <span
                        className="inline-block px-1.5 py-0.5 rounded-sm text-[8px] font-bold leading-none"
                        style={{
                          background: isSelected
                            ? 'rgba(6,15,8,0.3)'
                            : 'rgba(201,168,76,0.15)',
                          color: isSelected ? '#c9a84c' : '#c9a84c',
                          border: '1px solid rgba(201,168,76,0.35)',
                          fontFamily: 'var(--font-oswald)',
                          letterSpacing: '0.06em',
                        }}
                      >
                        {hhLabel}
                      </span>
                    )}
                  </motion.button>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>

      {/* Selected date+time confirmation */}
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
                {t(language, 'termSelected')}
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
            variantStyle="casino"
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
