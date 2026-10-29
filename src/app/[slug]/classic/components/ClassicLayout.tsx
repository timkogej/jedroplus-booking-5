'use client';

import CompanyLogo from '@/components/shared/CompanyLogo';
import { AnimatePresence, motion, type Variants } from 'framer-motion';
import { format } from 'date-fns';
import { sl } from 'date-fns/locale';
import { useBookingStore } from '@/store/bookingStore';
import { usePromotionsStore } from '@/store/promotionsStore';
import type { SupportedLanguage } from '@/types';
import { getBookingPricing, resolvePrimaryPromotion } from '@/lib/pricing';
import { isLightBackground } from '@/lib/color';
import { t } from '../i18n';
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
  initial: { opacity: 0, x: 18 },
  animate: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.28, ease: 'easeOut' as const },
  },
  exit: {
    opacity: 0,
    x: -14,
    transition: { duration: 0.18 },
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

// ── Language toggle ──────────────────────────────────────────────────────────
function LanguageToggle({
  language,
  onToggle,
  primaryColor,
  contrastMode,
}: {
  language: SupportedLanguage;
  onToggle: (l: SupportedLanguage) => void;
  primaryColor: string;
  contrastMode: 'light' | 'dark';
}) {
  const options: SupportedLanguage[] = ['sl', 'en'];
  const borderColor =
    contrastMode === 'light' ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.12)';

  return (
    <div
      className="flex rounded-lg overflow-hidden"
      style={{ border: `1.5px solid ${borderColor}` }}
    >
      {options.map((lang) => {
        const isActive = language === lang;
        return (
          <button
            key={lang}
            onClick={() => onToggle(lang)}
            className="px-2.5 py-1 text-xs font-semibold uppercase transition-all"
            style={{
              fontFamily: 'var(--font-nunito)',
              background: isActive ? primaryColor : 'transparent',
              color: isActive
                ? '#ffffff'
                : contrastMode === 'light'
                ? 'rgba(255,255,255,0.75)'
                : 'rgba(0,0,0,0.6)',
              letterSpacing: '0.06em',
            }}
          >
            {lang}
          </button>
        );
      })}
    </div>
  );
}

// ── Animated stepper ─────────────────────────────────────────────────────────
function ClassicStepper({
  steps,
  visualStep,
  primaryColor,
  contrastMode,
}: {
  steps: Array<{ visual: number; label: string }>;
  visualStep: number;
  primaryColor: string;
  contrastMode: 'light' | 'dark';
}) {
  const textMuted =
    contrastMode === 'light' ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.55)';
  const textActive =
    contrastMode === 'light' ? 'rgba(255,255,255,0.92)' : 'rgba(0,0,0,0.82)';
  const trackBg =
    contrastMode === 'light' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)';
  const nodeBg =
    contrastMode === 'light' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.06)';
  const nodeBorder =
    contrastMode === 'light' ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.12)';

  // Progress fraction: 0 at step 1, 1 at final step
  const progressFraction =
    steps.length > 1
      ? Math.max(0, Math.min(1, (visualStep - 1) / (steps.length - 1)))
      : 1;

  const activeLabel =
    steps.find((s) => s.visual === Math.min(visualStep, steps.length))?.label ?? '';

  return (
    <div className="px-6 pt-1 pb-5">
      {/* Track + nodes row */}
      <div className="relative max-w-xs mx-auto">
        {/* Base track */}
        <div
          className="absolute top-4 left-0 right-0 h-0.5 rounded-full"
          style={{ background: trackBg }}
        />
        {/* Filled progress */}
        <motion.div
          className="absolute top-4 left-0 h-0.5 rounded-full"
          style={{ background: primaryColor, originX: 0 }}
          animate={{ width: `${progressFraction * 100}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' as const }}
        />

        {/* Step nodes */}
        <div className="relative flex justify-between">
          {steps.map((step) => {
            const isDone = step.visual < visualStep;
            const isActive = step.visual === visualStep;

            return (
              <div key={step.visual} className="flex flex-col items-center">
                <motion.div
                  className="w-8 h-8 rounded-full flex items-center justify-center z-10 relative"
                  style={{
                    background:
                      isDone || isActive
                        ? primaryColor
                        : nodeBg,
                    border: `2px solid ${
                      isDone || isActive ? primaryColor : nodeBorder
                    }`,
                    boxShadow:
                      isActive
                        ? `0 0 0 4px ${primaryColor}22`
                        : 'none',
                  }}
                  animate={
                    isActive
                      ? { scale: [1, 1.08, 1] }
                      : { scale: 1 }
                  }
                  transition={{ duration: 2.2, repeat: Infinity }}
                >
                  {isDone ? (
                    <svg
                      width="11"
                      height="11"
                      viewBox="0 0 11 11"
                      fill="none"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M1.5 5.5l3 3 5-5" />
                    </svg>
                  ) : (
                    <span
                      className="text-xs font-bold"
                      style={{
                        color: isDone || isActive ? '#fff' : textMuted,
                        fontFamily: 'var(--font-nunito)',
                      }}
                    >
                      {step.visual}
                    </span>
                  )}
                </motion.div>

                {/* Label — desktop only */}
                <span
                  className="hidden md:block text-xs mt-1.5 font-medium transition-colors duration-300"
                  style={{
                    fontFamily: 'var(--font-nunito-sans)',
                    color: isActive || isDone ? textActive : textMuted,
                  }}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Active step name — mobile only */}
      <p
        className="md:hidden text-center text-xs mt-3 font-medium"
        style={{
          fontFamily: 'var(--font-nunito-sans)',
          color: textActive,
        }}
      >
        {activeLabel}
      </p>
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
  const { activePromotion, serviceDiscounts, selectedAddOn } = usePromotionsStore();

  // A sent request counts as finished too: no stepper or back link.
  const requestSent = useRequestStore((st) => st.sent);
  const isSuccess = !!bookingConfirmation?.success || requestSent;
  const contrastMode = getContrastMode(theme.bgFrom, theme.bgTo);
  const canGoBack = currentStep > 1 && !isSuccess && currentStep !== 7;

  // Step 3 is skipped in the store when prikazZaposlenih=false.

  const textPrimary =
    contrastMode === 'light' ? 'rgba(255,255,255,0.95)' : 'rgba(0,0,0,0.9)';
  const textSecondary =
    contrastMode === 'light' ? 'rgba(255,255,255,0.75)' : 'rgba(0,0,0,0.62)';

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
      ? `${format(selectedDate, 'd. MMM', { locale: sl })} ob ${selectedTime}`
      : format(selectedDate, 'd. MMMM yyyy', { locale: sl })
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
      className="min-h-screen"
      style={{
        background: `linear-gradient(135deg, ${theme.bgFrom} 0%, ${theme.bgTo} 100%)`,
        fontFamily: 'var(--font-nunito-sans)',
      }}
    >
      {/* ── Header ──────────────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-5 pt-6 pb-1 max-w-5xl mx-auto">
        <motion.h1
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="text-xl font-bold tracking-tight"
          style={{ fontFamily: 'var(--font-nunito)', color: textPrimary }}
        >
          <CompanyLogo name={company?.naziv ?? 'Booking'} logoUrl={company?.logo_url} />
        </motion.h1>

        <LanguageToggle
          language={language}
          onToggle={setLanguage}
          primaryColor={theme.primarySolid}
          contrastMode={contrastMode}
        />
      </header>

      {/* ── Stepper ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showStepper && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="max-w-5xl mx-auto"
          >
            <ClassicStepper
              steps={CLASSIC_STEPS}
              visualStep={visualStep}
              primaryColor={theme.primarySolid}
              contrastMode={contrastMode}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Content area ────────────────────────────────────────────── */}
      <main className="max-w-5xl mx-auto px-4 pb-20">
        <div className="flex gap-6 items-start">
          {/* Step content */}
          <div className="flex-1 min-w-0">
            {/* Back button */}
            {canGoBack && (
              <motion.button
                onClick={prevStep}
                whileHover={{ x: -2 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-1.5 mb-5 text-sm font-medium"
                style={{
                  fontFamily: 'var(--font-nunito-sans)',
                  color: textSecondary,
                }}
              >
                {t(language, 'back')}
              </motion.button>
            )}

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
            <div
              className="hidden lg:block flex-shrink-0"
              style={{ width: '268px' }}
            >
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
      <footer className="text-center pb-5 px-4">
        <p
          style={{
            fontFamily: 'var(--font-nunito-sans)',
            fontSize: '0.6rem',
            color:
              contrastMode === 'light'
                ? 'rgba(255,255,255,0.18)'
                : 'rgba(0,0,0,0.18)',
          }}
        >
          {t(language, 'poweredBy')}{' '}
          <a
            href="https://jedroplus.si"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline transition-opacity hover:opacity-70"
          >
            Jedro+
          </a>
        </p>
      </footer>
    </div>
  );
}
