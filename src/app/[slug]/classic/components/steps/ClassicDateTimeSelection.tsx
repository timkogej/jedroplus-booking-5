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
import {
  CARD,
  EASE,
  FILL,
  FONT,
  INK,
  INK_2,
  INK_3,
  PageTitle,
  SPRING,
  atWord,
  dateLocale,
  itemVariants,
  listVariants,
  longDatePattern,
  useClassicColors,
} from '../ui';

// TODO: if backend returns selectable resources in the future, add explicit
// resource-choice UI here. For now, resource availability is handled server-side.

interface Props {
  companySlug?: string;
}

const CARD_W = 60;
const CARD_GAP = 8;

const slotVariants: Variants = {
  hidden: { opacity: 0, y: 6 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: EASE } },
};

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
    timeOfDay,
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

  const c = useClassicColors();
  const loc = dateLocale(language);
  const [visibleMonth, setVisibleMonth] = useState<Date>(selectedDate ?? new Date());

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
  const timeSlots = filterTimes(Array.isArray(daySlots) ? daySlots : [], timeOfDay);

  // Month name above the strip follows the first day in view.
  const onStripScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const idx = Math.min(dates.length - 1, Math.max(0, Math.round(el.scrollLeft / (CARD_W + CARD_GAP))));
    const d = dates[idx];
    if (d && (d.getMonth() !== visibleMonth.getMonth() || d.getFullYear() !== visibleMonth.getFullYear())) setVisibleMonth(d);
  };

  const arrow = (dir: -1 | 1) => (
    <motion.button
      onClick={() => scrollBy(dir)}
      whileTap={{ scale: 0.9 }}
      transition={SPRING}
      className="flex h-8 w-8 items-center justify-center rounded-full"
      style={{ background: c.light ? 'rgba(118,118,128,0.12)' : 'rgba(255,255,255,0.18)', color: c.text }}
      aria-label={dir < 0 ? 'scroll back' : 'scroll forward'}
    >
      <svg width="8" height="13" viewBox="0 0 8 14" fill="none" aria-hidden="true" style={{ transform: dir < 0 ? 'rotate(180deg)' : undefined }}>
        <path d="M1 1l6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </motion.button>
  );

  return (
    <motion.div variants={listVariants} initial="hidden" animate="visible">
      <SlotNotice />
      <QuickSlotBar />
      <PageTitle title={t(language, 'chooseDateTime')} subtitle={t(language, 'chooseAppointment')} />

      {/* ── Date strip ── */}
      <motion.div variants={itemVariants} className="mb-5 overflow-hidden px-2 pb-3 pt-4 sm:px-3" style={CARD}>
        <div className="mb-3 flex items-center justify-between px-2">
          <AnimatePresence mode="wait" initial={false}>
            <motion.p
              key={format(visibleMonth, 'yyyy-MM')}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
              className="text-[17px] font-semibold first-cap"
              style={{ fontFamily: FONT, color: INK, letterSpacing: '-0.015em' }}
            >
              {format(visibleMonth, 'LLLL yyyy', { locale: loc })}
            </motion.p>
          </AnimatePresence>
          <div className="flex gap-2">
            {arrow(-1)}
            {arrow(1)}
          </div>
        </div>

        <div
          ref={scrollRef}
          onScroll={onStripScroll}
          className="classic-scrollbar-hide flex gap-2 overflow-x-auto px-2 pb-2 pt-1"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {isLoadingSlots
            ? Array.from({ length: 10 }).map((_, i) => (
                <div
                  key={i}
                  className="classic-skeleton flex-shrink-0 rounded-[18px]"
                  style={{ width: CARD_W, height: 78, scrollSnapAlign: 'start' }}
                />
              ))
            : dates.map((date, i) => {
                const dateKey = format(date, 'yyyy-MM-dd');
                const dayData = slotsMap[dateKey];
                const isAvailable = Array.isArray(dayData) && dayData.length > 0;
                const isGrayed = !isAvailable; // fully_booked, unavailable, empty, or undefined
                const scarceCount = isAvailable ? dayData.length : 0;
                const isScarce = isAvailable && scarceCount < 3;
                const isSelected = selectedDate ? isSameDay(date, selectedDate) : false;
                const isTodayDate = isToday(date);

                return (
                  <motion.button
                    key={i}
                    onClick={() => handleDateSelect(date, isGrayed)}
                    disabled={isGrayed}
                    whileTap={isGrayed ? undefined : { scale: 0.92 }}
                    transition={SPRING}
                    aria-pressed={isSelected}
                    aria-label={format(date, longDatePattern(language), { locale: loc })}
                    className="relative flex flex-shrink-0 flex-col items-center justify-center rounded-[18px] py-2.5"
                    style={{
                      width: CARD_W,
                      scrollSnapAlign: 'start',
                      cursor: isGrayed ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {isSelected && (
                      <motion.span
                        layoutId="classic-day"
                        className="absolute inset-0 rounded-[18px]"
                        style={{ background: theme.primarySolid, boxShadow: `0 8px 18px -6px ${theme.primarySolid}AA` }}
                        transition={SPRING}
                      />
                    )}
                    <span
                      className="relative text-[11px] font-semibold uppercase"
                      style={{
                        fontFamily: FONT,
                        letterSpacing: '0.05em',
                        color: isSelected ? 'rgba(255,255,255,0.8)' : isGrayed ? INK_3 : INK_2,
                        opacity: isGrayed && !isSelected ? 0.6 : 1,
                      }}
                    >
                      {format(date, 'EEE', { locale: loc }).replace('.', '').slice(0, 3)}
                    </span>
                    <span
                      className="relative mt-0.5 text-[22px] font-semibold leading-none tabular-nums"
                      style={{
                        fontFamily: FONT,
                        color: isSelected ? '#FFFFFF' : isGrayed ? INK_3 : isTodayDate ? theme.primaryOnLight : INK,
                        textDecoration: isGrayed ? 'line-through' : undefined,
                        textDecorationColor: 'rgba(0,0,0,0.18)',
                        opacity: isGrayed && !isSelected ? 0.55 : 1,
                      }}
                    >
                      {date.getDate()}
                    </span>
                    {/* availability dot: brand = free, orange/red = last spots */}
                    <span className="relative mt-1.5 flex h-[6px] items-center gap-[3px]">
                      {!isGrayed && (
                        <span
                          className={isScarce ? (scarceCount === 1 ? 'classic-pulse-red' : 'classic-pulse-orange') : ''}
                          style={{
                            width: 5,
                            height: 5,
                            borderRadius: 999,
                            background: isScarce
                              ? undefined
                              : isSelected
                              ? 'rgba(255,255,255,0.85)'
                              : theme.primarySolid,
                          }}
                        />
                      )}
                    </span>
                  </motion.button>
                );
              })}
        </div>
      </motion.div>

      {/* ── Time slots ── */}
      <AnimatePresence mode="wait">
        {selectedDate && (
          <motion.div
            key={selectedDateKey}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="overflow-hidden"
            style={CARD}
          >
            <div className="flex items-center justify-between px-5 pb-3 pt-4">
              <div>
                <p className="text-[17px] font-semibold first-cap" style={{ fontFamily: FONT, color: INK, letterSpacing: '-0.015em' }}>
                  {format(selectedDate, longDatePattern(language), { locale: loc })}
                </p>
                <p className="text-[13px]" style={{ fontFamily: FONT, color: INK_2 }}>
                  {t(language, 'availableSlots')}
                </p>
              </div>
              {!isLoadingSlots && timeSlots.length > 0 && (
                <span
                  className="rounded-full px-2.5 py-1 text-[13px] font-semibold tabular-nums"
                  style={{ background: `${theme.primarySolid}14`, color: theme.primaryOnLight, fontFamily: FONT }}
                >
                  {timeSlots.length}
                </span>
              )}
            </div>

            <div className="px-4 pb-5 sm:px-5">
              {isLoadingSlots ? (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div key={i} className="classic-skeleton h-12 rounded-[14px]" />
                  ))}
                </div>
              ) : timeSlots.length === 0 ? (
                <div className="py-8 text-center">
                  <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full" style={{ background: FILL }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={INK_3} strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                      <circle cx="12" cy="12" r="9.5" />
                      <path d="M12 7v5l3 2" />
                    </svg>
                  </span>
                  <p className="text-[15px] font-semibold" style={{ fontFamily: FONT, color: INK }}>
                    {t(language, 'noSlotsForDay')}
                  </p>
                  <p className="mt-0.5 text-[14px]" style={{ fontFamily: FONT, color: INK_2 }}>
                    {t(language, 'tryOtherDate')}
                  </p>
                </div>
              ) : (
                <motion.div
                  className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5"
                  initial="hidden"
                  animate="visible"
                  variants={{ visible: { transition: { staggerChildren: 0.02 } } }}
                >
                  {timeSlots.map((time) => {
                    const isSelected = selectedTime === time;
                    const hhLabel = isHappyHour(time);
                    return (
                      <motion.button
                        key={time}
                        onClick={() => handleTimeSelect(time)}
                        variants={slotVariants}
                        whileHover={isSelected ? undefined : { y: -1 }}
                        whileTap={{ scale: 0.94 }}
                        aria-pressed={isSelected}
                        className="relative flex min-h-[48px] flex-col items-center justify-center gap-0.5 rounded-[14px] px-2 py-2 text-[16px] font-semibold tabular-nums"
                        style={{
                          fontFamily: FONT,
                          background: isSelected ? theme.primarySolid : hhLabel ? `${theme.primarySolid}12` : FILL,
                          color: isSelected ? '#FFFFFF' : INK,
                          boxShadow: isSelected
                            ? `0 8px 18px -6px ${theme.primarySolid}AA`
                            : hhLabel
                            ? `inset 0 0 0 1px ${theme.primarySolid}40`
                            : 'none',
                          transition: 'background 0.15s, color 0.15s, box-shadow 0.15s',
                        }}
                      >
                        <span>{time}</span>
                        {hhLabel && (
                          <span
                            className="rounded-full px-1.5 py-[1px] text-[10px] font-bold leading-tight"
                            style={{
                              background: isSelected ? 'rgba(255,255,255,0.25)' : theme.primarySolid,
                              color: '#FFFFFF',
                              fontFamily: FONT,
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
          </motion.div>
        )}
      </AnimatePresence>

      {/* No date selected placeholder */}
      {!selectedDate && !isLoadingSlots && (
        <motion.div variants={itemVariants} className="p-8 text-center" style={CARD}>
          <p className="text-[15px]" style={{ fontFamily: FONT, color: INK_2 }}>
            {t(language, 'chooseAbove')}
          </p>
        </motion.div>
      )}

      {/* Selected summary pill */}
      <AnimatePresence>
        {selectedDate && selectedTime && (
          <motion.div
            className="mt-4 flex items-center gap-3 rounded-[16px] px-4 py-3"
            style={{ background: '#FFFFFF', boxShadow: `inset 0 0 0 1px ${theme.primarySolid}30` }}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.25 }}
          >
            <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full" style={{ background: theme.primarySolid }}>
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M1.5 5.5l3 3 5-5" />
              </svg>
            </span>
            <p className="text-[15px] first-cap" style={{ fontFamily: FONT, color: INK }}>
              <span className="font-semibold">{format(selectedDate, longDatePattern(language), { locale: loc })}</span>{' '}
              {atWord(language)}{' '}
              <span className="font-semibold" style={{ color: theme.primaryOnLight }}>
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
            accentColor={theme.primarySolid}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
