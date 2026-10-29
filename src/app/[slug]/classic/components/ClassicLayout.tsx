'use client';

import { useEffect, useRef } from 'react';
import CompanyLogo from '@/components/shared/CompanyLogo';
import { AnimatePresence, motion, type Variants } from 'framer-motion';
import { format } from 'date-fns';
import { useBookingStore } from '@/store/bookingStore';
import { usePromotionsStore } from '@/store/promotionsStore';
import type { SupportedLanguage } from '@/types';
import { getBookingPricing, resolvePrimaryPromotion } from '@/lib/pricing';
import { isLightBackground } from '@/lib/color';
import { t } from '../i18n';
import { EASE, FONT, SPRING, atWord, dateLocale, shortDatePattern } from './ui';
import ClassicSummaryCard from './ClassicSummaryCard';
import ClassicServiceSelection from './steps/ClassicServiceSelection';
import ClassicEmployeeSelection from './steps/ClassicEmployeeSelection';
import ClassicDateTimeSelection from './steps/ClassicDateTimeSelection';
import ClassicCustomerDetails from './steps/ClassicCustomerDetails';
import ClassicConfirmation from './steps/ClassicConfirmation';
import ClassicPaymentStep from './steps/ClassicPaymentStep';
import RequestWhenStep from '@/components/shared/request/RequestWhenStep';
import RequestReview from '@/components/shared/request/RequestReview';
import { useRequestStore } from '@/lib/booking/request';
import { classicLook } from '@/components/shared/request/looks';

interface Props {
  companySlug: string;
}

// ── Contrast detection (exported for step components) ────────────────────────
// 'dark' means dark text (light background). Uses the shared threshold, where
// black and white text have equal contrast.
export function getContrastMode(bgFrom: string, bgTo: string): 'light' | 'dark' {
  return isLightBackground(bgFrom, bgTo) ? 'dark' : 'light';
}

// ── Page transition variants ─────────────────────────────────────────────────
const pageVariants: Variants = {
  initial: { opacity: 0, y: 14 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.42, ease: EASE },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: { duration: 0.18, ease: 'easeIn' as const },
  },
};

// ── Step → visual mapping ────────────────────────────────────────────────────
function storeToVisual(storeStep: number, prikazZaposlenih: boolean): number {
  if (storeStep <= 2) return 1;
  if (storeStep === 3) return prikazZaposlenih ? 2 : 3;
  if (storeStep === 4) return prikazZaposlenih ? 3 : 2;
  if (storeStep === 5) return prikazZaposlenih ? 4 : 3;
  return prikazZaposlenih ? 5 : 4; // steps 6+ — all done
}

// ── Language toggle: iOS segmented control ──────────────────────────────────
function LanguageToggle({
  language,
  onToggle,
  light,
}: {
  language: SupportedLanguage;
  onToggle: (l: SupportedLanguage) => void;
  light: boolean;
}) {
  const options: SupportedLanguage[] = ['sl', 'en'];
  return (
    <div
      className="relative flex rounded-[10px] p-[2px]"
      style={{ background: light ? 'rgba(118,118,128,0.12)' : 'rgba(255,255,255,0.16)' }}
    >
      {options.map((lang) => {
        const isActive = language === lang;
        return (
          <button
            key={lang}
            onClick={() => onToggle(lang)}
            aria-pressed={isActive}
            className="relative z-10 h-7 w-10 text-[12px] font-semibold uppercase"
            style={{
              fontFamily: FONT,
              color: isActive ? '#1D1D1F' : light ? 'rgba(29,29,31,0.55)' : 'rgba(255,255,255,0.75)',
              letterSpacing: '0.04em',
              transition: 'color 0.2s',
            }}
          >
            {isActive && (
              <motion.span
                layoutId="classic-lang"
                className="absolute inset-0 -z-10 rounded-[8px]"
                style={{ background: '#FFFFFF', boxShadow: '0 3px 8px rgba(0,0,0,0.12), 0 0 0 0.5px rgba(0,0,0,0.04)' }}
                transition={SPRING}
              />
            )}
            {lang}
          </button>
        );
      })}
    </div>
  );
}

// ── Progress: thin segments with the step name ──────────────────────────────
function ClassicStepper({
  steps,
  visualStep,
  accent,
  light,
  language,
}: {
  steps: Array<{ visual: number; label: string }>;
  visualStep: number;
  accent: string;
  light: boolean;
  language: SupportedLanguage;
}) {
  const current = Math.min(visualStep, steps.length);
  const activeLabel = steps.find((s) => s.visual === current)?.label ?? '';
  const track = light ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.2)';
  const muted = light ? 'rgba(29,29,31,0.5)' : 'rgba(255,255,255,0.65)';
  const strong = light ? '#1D1D1F' : '#FFFFFF';

  return (
    <div className="mx-auto max-w-5xl px-5 pb-3 pt-1">
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <AnimatePresence mode="wait" initial={false}>
          <motion.p
            key={activeLabel}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.22 }}
            className="text-[13px] font-semibold md:invisible"
            style={{ color: strong, fontFamily: FONT }}
          >
            {activeLabel}
          </motion.p>
        </AnimatePresence>
        <p className="text-[12px] font-medium tabular-nums" style={{ color: muted, fontFamily: FONT }}>
          {t(language, 'stepOf').replace('{n}', String(current)).replace('{m}', String(steps.length))}
        </p>
      </div>
      <div className="flex gap-1.5" role="progressbar" aria-valuemin={1} aria-valuemax={steps.length} aria-valuenow={current}>
        {steps.map((step) => {
          const filled = step.visual < visualStep ? 1 : step.visual === visualStep ? 0.5 : 0;
          return (
            <div key={step.visual} className="h-[4px] flex-1 overflow-hidden rounded-full" style={{ background: track }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: accent }}
                initial={false}
                animate={{ width: `${filled * 100}%` }}
                transition={{ duration: 0.5, ease: EASE }}
              />
            </div>
          );
        })}
      </div>
      {/* Step names under the bar on wider screens */}
      <div className="mt-2 hidden gap-1.5 md:flex">
        {steps.map((step) => (
          <span
            key={step.visual}
            className="flex-1 text-[12px] font-medium"
            style={{ color: step.visual <= visualStep ? strong : muted, fontFamily: FONT, transition: 'color 0.3s' }}
          >
            {step.label}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Main layout ───────────────────────────────────────────────────────────────
export default function ClassicLayout({ companySlug }: Props) {
  const {
    currentStep,
    prevStep,
    company,
    theme,
    bookingConfirmation,
    selectedEmployeeId,
    anyPerson,
    employeesUI,
    selectedService,
    selectedServices,
    selectedDate,
    selectedTime,
    customerDetails,
    language,
    setLanguage,
    prikazZaposlenih,
  } = useBookingStore();
  const showEmployee = useBookingStore((s) => s.prikazZaposlenih);
  const rootRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);

  // Sticky parts of the steps sit right under the header, whatever its height.
  useEffect(() => {
    const header = headerRef.current;
    const root = rootRef.current;
    if (!header || !root) return;
    const ro = new ResizeObserver(() => root.style.setProperty('--classic-header-h', `${header.offsetHeight}px`));
    ro.observe(header);
    return () => ro.disconnect();
  }, []);
  const { activePromotion, serviceDiscounts, selectedAddOn } = usePromotionsStore();

  // A sent request counts as finished too: no stepper or back link.
  const requestSent = useRequestStore((st) => st.sent);
  const isSuccess = !!bookingConfirmation?.success || requestSent;
  const contrastMode = getContrastMode(theme.bgFrom, theme.bgTo);
  const light = contrastMode === 'dark';
  const canGoBack = currentStep > 1 && !isSuccess && currentStep !== 7;

  // Step 3 is skipped in the store when prikazZaposlenih=false.

  const textSecondary = light ? 'rgba(29,29,31,0.62)' : 'rgba(255,255,255,0.75)';
  const accentOnPage = light ? theme.primaryOnLight : '#FFFFFF';

  // Build step list based on prikazZaposlenih flag
  const CLASSIC_STEPS = prikazZaposlenih
    ? [
        { visual: 1, label: t(language, 'stepService') },
        { visual: 2, label: t(language, 'stepPerson') },
        { visual: 3, label: t(language, 'stepAppointment') },
        { visual: 4, label: t(language, 'stepDetails') },
      ]
    : [
        { visual: 1, label: t(language, 'stepService') },
        { visual: 2, label: t(language, 'stepAppointment') },
        { visual: 3, label: t(language, 'stepDetails') },
      ];

  const visualStep = storeToVisual(currentStep, prikazZaposlenih);
  const showStepper = !isSuccess && currentStep < 7;

  // Request mode (company.booking_mode='request'): no free-time calendar;
  // the client says when suits them and the salon picks the time.
  const isRequest = company?.booking_mode === 'request';
  const requestLook = classicLook(theme);

  const renderStep = () => {
    if (bookingConfirmation?.success) {
      return <ClassicConfirmation companySlug={companySlug} />;
    }
    switch (currentStep) {
      case 1:
      case 2:
        return <ClassicServiceSelection />;
      case 3:
        return <ClassicEmployeeSelection />;
      case 4:
        return isRequest ? <RequestWhenStep look={requestLook} /> : <ClassicDateTimeSelection companySlug={companySlug} />;
      case 5:
        return <ClassicCustomerDetails />;
      case 6:
        return isRequest ? <RequestReview look={requestLook} companySlug={companySlug} /> : <ClassicConfirmation companySlug={companySlug} />;
      case 7:
        return <ClassicPaymentStep />;
      default:
        return null;
    }
  };

  // Summary card values
  const selectedEmployee = employeesUI.find((e) => e.id === selectedEmployeeId);
  const summaryEmployee =
    showEmployee && (selectedEmployeeId !== null || anyPerson)
      ? anyPerson
        ? t(language, 'anyone')
        : selectedEmployee?.label
      : undefined;
  const summaryDate = selectedDate
    ? selectedTime
      ? `${format(selectedDate, shortDatePattern(language), { locale: dateLocale(language) })} ${atWord(language)} ${selectedTime}`
      : format(selectedDate, 'd. MMMM yyyy', { locale: dateLocale(language) })
    : undefined;
  const summaryServices =
    selectedServices.length > 0
      ? selectedServices
      : selectedService
      ? [selectedService]
      : [];
  const summaryPromotion = resolvePrimaryPromotion(
    summaryServices,
    serviceDiscounts,
    activePromotion
  );
  const summaryPricing = getBookingPricing(
    summaryServices,
    summaryPromotion,
    selectedAddOn
  );

  const stepKey = `step-${currentStep}-${isSuccess}`;

  return (
    <div
      ref={rootRef}
      className="relative min-h-screen overflow-x-clip"
      style={{
        background: `linear-gradient(160deg, ${theme.bgFrom} 0%, ${theme.bgTo} 100%)`,
        fontFamily: FONT,
      }}
    >
      {/* Soft brand-coloured light, drifting slowly */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
        <div
          className="classic-glow absolute -top-[30%] left-1/2 h-[70vh] w-[110vw] -translate-x-1/2 rounded-full"
          style={{
            background: `radial-gradient(closest-side, ${theme.primarySolid}${light ? '1F' : '33'}, transparent)`,
            filter: 'blur(20px)',
          }}
        />
      </div>

      {/* ── Header: frosted, stays on top ───────────────────────────── */}
      <header
        ref={headerRef}
        className="sticky top-0 z-30"
        style={{
          background: light ? 'rgba(255,255,255,0.62)' : 'rgba(0,0,0,0.22)',
          backdropFilter: 'saturate(180%) blur(20px)',
          WebkitBackdropFilter: 'saturate(180%) blur(20px)',
          boxShadow: `0 0.5px 0 ${light ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.12)'}`,
        }}
      >
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-3 px-5">
          <div className="flex min-w-0 items-center gap-2">
            <AnimatePresence initial={false}>
              {canGoBack && (
                <motion.button
                  key="back"
                  onClick={prevStep}
                  initial={{ opacity: 0, x: -6, width: 0 }}
                  animate={{ opacity: 1, x: 0, width: 'auto' }}
                  exit={{ opacity: 0, x: -6, width: 0 }}
                  transition={{ duration: 0.25, ease: EASE }}
                  whileTap={{ scale: 0.94 }}
                  aria-label={t(language, 'back')}
                  className="-ml-1.5 flex h-9 flex-shrink-0 items-center gap-1 overflow-hidden rounded-full pl-1.5 pr-2.5 text-[15px] font-medium"
                  style={{ color: accentOnPage, fontFamily: FONT }}
                >
                  <svg width="10" height="17" viewBox="0 0 10 17" fill="none" aria-hidden="true">
                    <path d="M8.5 1.5L1.5 8.5l7 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="hidden sm:inline">{t(language, 'back')}</span>
                </motion.button>
              )}
            </AnimatePresence>
            <motion.h1
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: EASE }}
              className="min-w-0 truncate text-[17px] font-semibold"
              style={{ fontFamily: FONT, color: light ? '#1D1D1F' : '#FFFFFF', letterSpacing: '-0.02em' }}
            >
              <CompanyLogo name={company?.naziv ?? 'Booking'} logoUrl={company?.logo_url} />
            </motion.h1>
          </div>

          <LanguageToggle language={language} onToggle={setLanguage} light={light} />
        </div>

        {/* ── Progress ─────────────────────────────────────────────── */}
        <AnimatePresence initial={false}>
          {showStepper && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: EASE }}
              className="overflow-hidden"
            >
              <ClassicStepper
                steps={CLASSIC_STEPS}
                visualStep={visualStep}
                accent={theme.primarySolid}
                light={light}
                language={language}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ── Content area ────────────────────────────────────────────── */}
      <main className="relative mx-auto max-w-5xl px-4 pb-24 pt-7 sm:px-5">
        <div className="flex items-start gap-8">
          {/* Step content */}
          <div className="min-w-0 flex-1">
            <AnimatePresence mode="wait">
              <motion.div
                key={stepKey}
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                {renderStep()}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Summary card — desktop only, during active flow */}
          {!isSuccess && currentStep < 6 && (
            <div className="hidden flex-shrink-0 lg:block" style={{ width: '300px' }}>
              <ClassicSummaryCard
                services={
                  summaryServices.length > 0
                    ? summaryServices.map((s) => ({
                        name: s.naziv,
                        price: s.cena,
                        duration: s.trajanjeMin,
                      }))
                    : []
                }
                addOn={
                  selectedAddOn
                    ? {
                        name: selectedAddOn.naziv,
                        price: selectedAddOn.finalCena,
                        duration: selectedAddOn.trajanjeMin,
                      }
                    : undefined
                }
                employee={summaryEmployee}
                dateTime={summaryDate}
                customer={
                  customerDetails
                    ? `${customerDetails.firstName} ${customerDetails.lastName}`
                    : undefined
                }
                primaryColor={theme.primarySolid}
                language={language}
                originalTotal={summaryPricing.originalTotal}
                finalTotal={summaryPricing.finalTotal}
                hasDiscount={summaryPricing.hasDiscount}
              />
            </div>
          )}
        </div>
      </main>

      {/* ── Footer ──────────────────────────────────────────────────── */}
      <footer className="relative px-4 pb-6 text-center">
        <p className="text-[11px]" style={{ fontFamily: FONT, color: textSecondary, opacity: 0.6 }}>
          {t(language, 'poweredBy')}{' '}
          <a
            href="https://jedroplus.si"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold hover:underline"
          >
            Jedro+
          </a>
        </p>
      </footer>
    </div>
  );
}
