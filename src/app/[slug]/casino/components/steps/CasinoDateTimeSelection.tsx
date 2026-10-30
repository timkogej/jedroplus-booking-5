'use client';

import {
  useState,
  useMemo,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, isSameDay, isToday, startOfDay, addDays } from 'date-fns';
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
import SlotNotice from '@/components/shared/SlotNotice';
import QuickSlotBar from '@/components/shared/QuickSlotBar';
import { filterTimes } from '@/lib/booking/slots';
import { CREAM, EASE, FAINT, FONT_BODY, FONT_HEAD, FONT_LABEL, MUTED, SPRING, atWord, dateLocale, itemVariants, listVariants, longDate, mix } from '../ui';

// TODO: if backend returns selectable resources in the future, add explicit
// resource-choice UI here. For now, resource availability is handled server-side.

interface Props {
  companySlug?: string;
}

const CARD_W = 64;
const CARD_GAP = 8;

function ScarcityDot({ count }: { count: number }) {
  return (
    <span
      className="cx-pulse inline-block h-1.5 w-1.5 rounded-full"
      aria-hidden="true"
      style={{ background: count === 1 ? '#FF5A50' : '#FF9F43' }}
    />
  );
}

const ARROW = (dir: 1 | -1) => (
  <svg width="8" height="13" viewBox="0 0 8 14" fill="none" aria-hidden="true" style={{ transform: dir === -1 ? 'rotate(180deg)' : undefined }}>
    <path d="M1 1l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

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
    timeOfDay,
    theme,
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

  // When the free times arrive and the chosen day has none (e.g. today is
  // full), move to the first day that has free times.
  useEffect(() => {
    if (isLoadingSlots || Object.keys(slotsMap).length === 0) return;
    const has = (d: Date) => {
      const v = slotsMap[format(d, 'yyyy-MM-dd')];
      return Array.isArray(v) && v.length > 0;
    };
    if (selectedDate && has(selectedDate)) return;
    const first = dates.find(has);
    if (first) selectDate(first);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoadingSlots, slotsMap]);

  // Keep the chosen day in view in the row of days.
  useEffect(() => {
    if (!selectedDate || isLoadingSlots) return;
    const id = window.setTimeout(() => {
      const el = scrollRef.current;
      if (!el) return;
      const idx = dates.findIndex((d) => isSameDay(d, selectedDate));
      if (idx < 0) return;
      const offset = idx * (CARD_W + CARD_GAP) - el.offsetWidth / 2 + CARD_W / 2;
      el.scrollTo({ left: Math.max(0, offset), behavior: 'smooth' });
    }, 60);
    return () => window.clearTimeout(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate?.getTime(), isLoadingSlots]);

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
    },
    [selectDate]
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
  const timeSlots = filterTimes(Array.isArray(daySlots) ? daySlots : [], timeOfDay);
  const loc = dateLocale(language);

  return (
    <motion.div variants={listVariants} initial="hidden" animate="visible">
      <SlotNotice />
      <QuickSlotBar accent={theme.primarySolid} onAccent="#FFFFFF" />

      {/* ── Dates: one row of cards, the chosen one lit in the brand colour ── */}
      <motion.div variants={itemVariants} className="mb-6">
        <div className="flex items-center gap-2">
          <button
            onClick={() => scrollBy(-1)}
            className="hidden h-10 w-10 flex-shrink-0 items-center justify-center rounded-full transition-colors hover:text-white sm:flex"
            style={{ background: 'rgba(255,255,255,0.05)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.1)', color: MUTED }}
            aria-label={language === 'en' ? 'Earlier days' : 'Prejšnji dnevi'}
          >
            {ARROW(-1)}
          </button>

          <div className="-mx-4 min-w-0 flex-1 sm:mx-0">
            <div
              ref={scrollRef}
              className="cx-scrollbar-hide flex gap-2 overflow-x-auto px-4 py-2 sm:px-0.5"
              style={{ scrollSnapType: 'x proximity' }}
            >
              {isLoadingSlots
                ? Array.from({ length: 10 }).map((_, i) => (
                    <div
                      key={i}
                      className="flex-shrink-0 animate-pulse rounded-[14px]"
                      style={{ width: CARD_W, height: 84, background: 'rgba(255,255,255,0.05)' }}
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
                      <motion.button
                        key={i}
                        onClick={() => handleDateSelect(date, isGrayed)}
                        disabled={isGrayed}
                        whileTap={!isGrayed ? { scale: 0.93 } : {}}
                        aria-pressed={isSelected}
                        className="relative flex flex-shrink-0 flex-col items-center justify-center rounded-[14px]"
                        style={{
                          width: CARD_W,
                          height: 84,
                          scrollSnapAlign: 'center',
                          background: 'rgba(255,255,255,0.04)',
                          boxShadow: isTodayDate && !isSelected ? `inset 0 0 0 1px ${mix('--cx-glow', 45)}` : 'inset 0 0 0 1px rgba(255,255,255,0.07)',
                          opacity: isGrayed ? 0.3 : 1,
                          cursor: isGrayed ? 'not-allowed' : 'pointer',
                        }}
                      >
                        {isSelected && (
                          <motion.span
                            layoutId="cx-day"
                            className="absolute inset-0 rounded-[14px]"
                            style={{ background: 'var(--cx-grad)', boxShadow: '0 10px 24px -10px var(--cx-a)' }}
                            transition={SPRING}
                          />
                        )}
                        <span className="relative text-[11px] font-medium uppercase" style={{ fontFamily: FONT_LABEL, letterSpacing: '0.1em', color: isSelected ? 'rgba(255,255,255,0.85)' : FAINT }}>
                          {format(date, 'EEE', { locale: loc }).replace('.', '').slice(0, 3)}
                        </span>
                        <span className="relative my-0.5 text-[22px] font-bold leading-none" style={{ fontFamily: FONT_HEAD, color: isSelected ? '#fff' : CREAM }}>
                          {date.getDate()}
                        </span>
                        <span className="relative text-[10px] uppercase" style={{ fontFamily: FONT_LABEL, letterSpacing: '0.08em', color: isSelected ? 'rgba(255,255,255,0.75)' : FAINT }}>
                          {format(date, 'MMM', { locale: loc }).replace('.', '')}
                        </span>
                        {isScarce && !isGrayed && (
                          <span className="absolute right-1.5 top-1.5 flex items-center gap-0.5">
                            <ScarcityDot count={scarceCount} />
                          </span>
                        )}
                      </motion.button>
                    );
                  })}
            </div>
          </div>

          <button
            onClick={() => scrollBy(1)}
            className="hidden h-10 w-10 flex-shrink-0 items-center justify-center rounded-full transition-colors hover:text-white sm:flex"
            style={{ background: 'rgba(255,255,255,0.05)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.1)', color: MUTED }}
            aria-label={language === 'en' ? 'Later days' : 'Naslednji dnevi'}
          >
            {ARROW(1)}
          </button>
        </div>
      </motion.div>

      {/* ── Times ── */}
      <motion.div variants={itemVariants} className="cx-card overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-4 py-3.5 sm:px-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="min-w-0">
            <p className="cx-label">{t(language, 'availableSlots')}</p>
            <AnimatePresence mode="wait" initial={false}>
              <motion.p
                key={selectedDateKey ?? 'none'}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2 }}
                className="first-cap mt-0.5 truncate text-[17px] font-bold"
                style={{ fontFamily: FONT_HEAD, color: CREAM }}
              >
                {selectedDate ? longDate(selectedDate, language) : t(language, 'noDateSelected')}
              </motion.p>
            </AnimatePresence>
          </div>
          {selectedDate && !isLoadingSlots && timeSlots.length > 0 && (
            <span
              className="flex-shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium uppercase"
              style={{ fontFamily: FONT_LABEL, letterSpacing: '0.1em', color: 'var(--cx-glow)', background: mix('--cx-glow', 12) }}
            >
              {t(language, 'slotsCount').replace('{n}', String(timeSlots.length))}
            </span>
          )}
        </div>

        <div className="p-3 sm:p-4">
          {!selectedDate ? (
            <div className="py-8 text-center">
              <p className="text-[15px]" style={{ fontFamily: FONT_BODY, color: MUTED }}>{t(language, 'noDateSelected')}</p>
            </div>
          ) : isLoadingSlots ? (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-12 animate-pulse rounded-[12px]" style={{ background: 'rgba(255,255,255,0.05)' }} />
              ))}
            </div>
          ) : timeSlots.length === 0 ? (
            <div className="py-9 text-center">
              <span style={{ fontFamily: 'Georgia, serif', fontSize: '1.4rem', color: mix('--cx-glow', 35) }}>◆</span>
              <p className="mt-2 text-[15px] font-semibold" style={{ fontFamily: FONT_BODY, color: CREAM }}>{t(language, 'noSlots')}</p>
              <p className="mt-1 text-[14px]" style={{ fontFamily: FONT_BODY, color: MUTED }}>{t(language, 'noSlotsHint')}</p>
            </div>
          ) : (
            <div key={selectedDateKey} className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {timeSlots.map((time, i) => {
                const isSelected = selectedTime === time;
                const hhLabel = isHappyHour(time);
                return (
                  <motion.button
                    key={time}
                    onClick={() => handleTimeSelect(time)}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.022, 0.4), duration: 0.35, ease: EASE }}
                    whileTap={{ scale: 0.94 }}
                    aria-pressed={isSelected}
                    className="relative flex min-h-[48px] flex-col items-center justify-center gap-0.5 rounded-[12px] px-1 py-2 text-[16px] font-semibold tabular-nums transition-colors"
                    style={{
                      fontFamily: FONT_BODY,
                      color: isSelected ? '#fff' : CREAM,
                      background: isSelected ? 'var(--cx-grad)' : 'rgba(255,255,255,0.05)',
                      boxShadow: isSelected ? '0 10px 22px -10px var(--cx-a)' : 'inset 0 0 0 1px rgba(255,255,255,0.09)',
                    }}
                  >
                    <span>{time}</span>
                    {hhLabel && (
                      <span
                        className="rounded px-1.5 py-0.5 text-[9px] font-bold uppercase leading-none"
                        style={{ fontFamily: FONT_LABEL, letterSpacing: '0.06em', color: isSelected ? '#fff' : 'var(--cx-glow)', background: isSelected ? 'rgba(0,0,0,0.2)' : mix('--cx-glow', 14) }}
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

      {/* Chosen date and time */}
      <AnimatePresence>
        {selectedDate && selectedTime && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.35, ease: EASE }}
            className="mt-4 flex items-center gap-3 rounded-[14px] px-4 py-3"
            style={{ background: mix('--cx-a', 14), boxShadow: `inset 0 0 0 1px ${mix('--cx-glow', 35)}` }}
          >
            <span style={{ color: 'var(--cx-glow)', fontSize: '0.7rem' }}>◆</span>
            <div>
              <p className="cx-label" style={{ color: 'var(--cx-glow)' }}>{t(language, 'termSelected')}</p>
              <p className="first-cap mt-0.5 text-[15px]" style={{ fontFamily: FONT_BODY, color: CREAM }}>
                {longDate(selectedDate, language)} {atWord(language)} {selectedTime}
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
            variantStyle="modern"
            accentColor={theme.primaryOnDark}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
