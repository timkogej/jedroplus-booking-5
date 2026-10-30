'use client';

import {
  useState,
  useMemo,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
import { EASE, SPRING } from '../brand';
import { FONT, GLASS, PointerGlow, Title, atWord, dateLocale, itemVariants as fadeUp, listVariants, longDatePattern, pointerLight } from '../ui';

// TODO: if backend returns selectable resources in the future, add explicit
// resource-choice UI here. For now, resource availability is handled server-side.

interface Props {
  companySlug?: string;
}

const CARD_W = 62;
const CARD_GAP = 8;

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
  const timeSlots = filterTimes(Array.isArray(daySlots) ? daySlots : [], timeOfDay);

  const loc = dateLocale(language);
  const [visibleMonth, setVisibleMonth] = useState<Date>(selectedDate ?? new Date());
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
      className="flex h-9 w-9 items-center justify-center rounded-full"
      style={{ background: 'rgba(255,255,255,0.07)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.08)', color: 'var(--t-soft)' }}
      aria-label={dir < 0 ? '‹' : '›'}
    >
      <svg width="7" height="12" viewBox="0 0 8 14" fill="none" aria-hidden="true" style={{ transform: dir < 0 ? 'rotate(180deg)' : undefined }}>
        <path d="M1 1l6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </motion.button>
  );

  return (
    <motion.div variants={listVariants} initial="hidden" animate="visible">
      <SlotNotice />
      <QuickSlotBar />
      <Title title={t(language, 'chooseDateTime')} subtitle={t(language, 'chooseAppointment')} />

      {/* ── Date strip ── */}
      <motion.div variants={fadeUp} className="mb-5 overflow-hidden px-2 pb-3 pt-4" style={GLASS}>
        <div className="mb-3 flex items-center justify-between px-3">
          <AnimatePresence mode="wait" initial={false}>
            <motion.p
              key={format(visibleMonth, 'yyyy-MM')}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
              className="text-[17px] font-extrabold first-cap"
              style={{ fontFamily: FONT, color: 'var(--t-primary)', letterSpacing: '-0.02em' }}
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
          className="modern-scrollbar-hide flex gap-2 overflow-x-auto px-2 pb-2 pt-1"
          style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' as const }}
        >
          {isLoadingSlots
            ? Array.from({ length: 10 }).map((_, i) => (
                <div
                  key={i}
                  className="modern-slot-shimmer flex-shrink-0 rounded-[18px]"
                  style={{ width: CARD_W, height: 80, background: 'rgba(255,255,255,0.06)', scrollSnapAlign: 'start', animationDelay: `${i * 0.06}s` }}
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
                    whileTap={isGrayed ? undefined : { scale: 0.92 }}
                    transition={SPRING}
                    aria-pressed={isSelected}
                    aria-label={format(date, longDatePattern(language), { locale: loc })}
                    className="relative flex flex-shrink-0 flex-col items-center justify-center rounded-[18px] py-3"
                    style={{
                      width: CARD_W,
                      scrollSnapAlign: 'start',
                      cursor: isGrayed ? 'not-allowed' : 'pointer',
                      background: isSelected ? 'transparent' : isGrayed ? 'transparent' : 'rgba(255,255,255,0.04)',
                      boxShadow: isTodayDate && !isSelected ? 'inset 0 0 0 1px color-mix(in srgb, var(--brand-glow) 45%, transparent)' : undefined,
                    }}
                  >
                    {isSelected && (
                      <motion.span
                        layoutId="modern-day"
                        className="absolute inset-0 rounded-[18px]"
                        style={{ background: 'var(--brand-grad)', boxShadow: '0 12px 26px -10px var(--brand-a), 0 0 22px -6px var(--brand-glow), inset 0 1px 0 rgba(255,255,255,0.3)' }}
                        transition={SPRING}
                      />
                    )}
                    <span
                      className="relative text-[11px] font-bold uppercase"
                      style={{ fontFamily: FONT, letterSpacing: '0.08em', color: isSelected ? 'rgba(255,255,255,0.85)' : 'var(--t-faint)', opacity: isGrayed ? 0.5 : 1 }}
                    >
                      {format(date, 'EEE', { locale: loc }).replace('.', '').slice(0, 3)}
                    </span>
                    <span
                      className="relative mt-1 text-[22px] font-extrabold leading-none tabular-nums"
                      style={{
                        fontFamily: FONT,
                        letterSpacing: '-0.03em',
                        color: isSelected ? '#FFFFFF' : isGrayed ? 'var(--t-disabled)' : 'var(--t-primary)',
                        textDecoration: isGrayed ? 'line-through' : undefined,
                        textDecorationColor: 'rgba(255,255,255,0.2)',
                      }}
                    >
                      {date.getDate()}
                    </span>
                    <span className="relative mt-2 flex h-[6px] items-center">
                      {!isGrayed &&
                        (isScarce ? (
                          <ScarcityDot count={scarceCount} />
                        ) : (
                          <span
                            className="h-[5px] w-[5px] rounded-full"
                            style={{ background: isSelected ? '#FFFFFF' : 'var(--brand-glow)', boxShadow: isSelected ? undefined : '0 0 8px var(--brand-glow)' }}
                          />
                        ))}
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
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.35, ease: EASE }}
            className="overflow-hidden"
            style={GLASS}
          >
            <div className="flex items-center justify-between px-5 pb-3 pt-4">
              <div>
                <p className="text-[17px] font-extrabold first-cap" style={{ fontFamily: FONT, color: 'var(--t-primary)', letterSpacing: '-0.02em' }}>
                  {format(selectedDate, longDatePattern(language), { locale: loc })}
                </p>
                <p className="text-[13px]" style={{ fontFamily: FONT, color: 'var(--t-muted)' }}>
                  {t(language, 'availableSlots')}
                </p>
              </div>
              {!isLoadingSlots && timeSlots.length > 0 && (
                <span
                  className="rounded-full px-3 py-1 text-[13px] font-bold tabular-nums"
                  style={{ background: 'color-mix(in srgb, var(--brand-a) 25%, transparent)', color: 'var(--brand-glow)', fontFamily: FONT }}
                >
                  {timeSlots.length}
                </span>
              )}
            </div>

            <div className="px-4 pb-5">
              {isLoadingSlots ? (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="modern-slot-shimmer h-[52px] rounded-[16px]" style={{ background: 'rgba(255,255,255,0.06)', animationDelay: `${i * 0.07}s` }} />
                  ))}
                </div>
              ) : timeSlots.length === 0 ? (
                <div className="py-8 text-center">
                  <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full" style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--t-faint)' }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                      <circle cx="12" cy="12" r="9.5" />
                      <path d="M12 7v5l3 2" />
                    </svg>
                  </span>
                  <p className="text-[15px] font-bold" style={{ color: 'var(--t-primary)', fontFamily: FONT }}>
                    {t(language, 'noSlotsForDay')}
                  </p>
                  <p className="mt-0.5 text-[14px]" style={{ color: 'var(--t-muted)', fontFamily: FONT }}>
                    {t(language, 'tryOtherDate')}
                  </p>
                </div>
              ) : (
                <motion.div
                  className="grid grid-cols-3 gap-2 sm:grid-cols-4"
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
                        onPointerMove={pointerLight}
                        variants={{
                          hidden: { opacity: 0, y: 8, scale: 0.96 },
                          visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.35, ease: EASE } },
                        }}
                        aria-pressed={isSelected}
                        className="group relative flex min-h-[52px] flex-col items-center justify-center gap-0.5 overflow-hidden rounded-[16px] px-2 py-2 text-[16px] font-bold tabular-nums"
                        style={{
                          background: isSelected ? 'var(--brand-grad)' : 'rgba(255,255,255,0.055)',
                          color: isSelected ? '#FFFFFF' : 'var(--t-primary)',
                          boxShadow: isSelected
                            ? '0 12px 26px -10px var(--brand-a), inset 0 1px 0 rgba(255,255,255,0.3)'
                            : hhLabel
                            ? 'inset 0 0 0 1px color-mix(in srgb, var(--brand-glow) 45%, transparent)'
                            : 'inset 0 0 0 1px rgba(255,255,255,0.07)',
                          fontFamily: FONT,
                        }}
                        whileHover={isSelected ? undefined : { y: -2 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {!isSelected && <PointerGlow />}
                        <span className="relative">{slot}</span>
                        {hhLabel && (
                          <span
                            className="relative rounded-full px-1.5 py-[1px] text-[10px] font-bold leading-tight"
                            style={{ background: isSelected ? 'rgba(255,255,255,0.22)' : 'var(--brand-grad)', color: '#FFFFFF', fontFamily: FONT }}
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

      {/* ── Selected summary pill ── */}
      <AnimatePresence>
        {selectedDate && selectedTime && (
          <motion.div
            className="mt-5 flex items-center gap-3 rounded-[18px] px-4 py-3.5"
            style={{ background: 'color-mix(in srgb, var(--brand-a) 18%, rgba(255,255,255,0.04))', boxShadow: 'inset 0 0 0 1px color-mix(in srgb, var(--brand-glow) 30%, transparent)' }}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
          >
            <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full" style={{ background: 'var(--brand-grad)' }}>
              <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </span>
            <p className="text-[15px] first-cap" style={{ color: 'var(--t-soft)', fontFamily: FONT }}>
              <span className="font-bold">{format(selectedDate, longDatePattern(language), { locale: loc })}</span>{' '}
              {atWord(language)}{' '}
              <span className="font-bold" style={{ color: 'var(--brand-glow)' }}>
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
            accentColor={theme.primarySolid}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
