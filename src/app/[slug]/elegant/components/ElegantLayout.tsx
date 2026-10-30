'use client';

import { AnimatePresence, motion, type Variants } from 'framer-motion';
import CompanyLogo from '@/components/shared/CompanyLogo';
import { format } from 'date-fns';
import { useBookingStore } from '@/store/bookingStore';
import ElegantSidebar from './ElegantSidebar';
import ElegantServiceSelection from './steps/ElegantServiceSelection';
import ElegantEmployeeSelection from './steps/ElegantEmployeeSelection';
import ElegantDateTimeSelection from './steps/ElegantDateTimeSelection';
import ElegantCustomerDetails from './steps/ElegantCustomerDetails';
import ElegantConfirmation from './steps/ElegantConfirmation';
import ElegantSummary from './ElegantSummary';
import { dateLocale, datePattern, t } from '../i18n';
import type { SupportedLanguage } from '@/types';
import RequestWhenStep from '@/components/shared/request/RequestWhenStep';
import RequestReview from '@/components/shared/request/RequestReview';
import { useRequestStore } from '@/lib/booking/request';
import { elegantLook } from '@/components/shared/request/looks';

interface Props {
  companySlug: string;
}

const EASE = [0.22, 1, 0.36, 1] as const;

const pageVariants: Variants = {
  initial: { opacity: 0, y: 16 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: EASE },
  },
  exit: {
    opacity: 0,
    y: -6,
    transition: { duration: 0.2, ease: 'easeIn' as const },
  },
};

function BackButton({ onClick, label, color, className = '' }: { onClick: () => void; label: string; color: string; className?: string }) {
  return (
    <motion.button
      onClick={onClick}
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ x: -3 }}
      whileTap={{ scale: 0.96 }}
      className={`group flex items-center gap-2 text-sm text-gray-500 transition-colors hover:text-gray-900 ${className}`}
      style={{ fontFamily: 'var(--font-inter)' }}
    >
      <span
        className="flex h-7 w-7 items-center justify-center rounded-full border transition-colors group-hover:border-current"
        style={{ borderColor: '#E5E7EB', color }}
      >
        <svg width="7" height="12" viewBox="0 0 8 14" fill="none" aria-hidden="true">
          <path d="M7 1L1 7l6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      {label}
    </motion.button>
  );
}

const STEP_LABEL_KEYS = {
  1: 'stepService',
  2: 'stepService',
  3: 'stepSpecialist',
  4: 'stepDateTime',
  5: 'stepDetails',
  6: 'stepConfirm',
} as const;

function LanguageToggle({
  language,
  onChange,
  color,
}: {
  language: SupportedLanguage;
  onChange: (lang: SupportedLanguage) => void;
  color: string;
}) {
  return (
    <div className="relative flex rounded-full border p-0.5" style={{ borderColor: '#E5E7EB' }}>
      {(['sl', 'en'] as const).map((lang) => {
        const active = language === lang;
        return (
          <button
            key={lang}
            type="button"
            onClick={() => onChange(lang)}
            aria-pressed={active}
            className="relative z-10 h-6 w-9 text-[11px] font-medium uppercase tracking-[0.08em]"
            style={{ fontFamily: 'var(--font-inter)', color: active ? '#FFFFFF' : '#4B5563', transition: 'color 0.25s' }}
          >
            {active && (
              <motion.span
                layoutId="elegant-lang"
                className="absolute inset-0 -z-10 rounded-full"
                style={{ background: color }}
                transition={{ type: 'spring', stiffness: 420, damping: 34 }}
              />
            )}
            {lang}
          </button>
        );
      })}
    </div>
  );
}

function storeToVisualElegant(storeStep: number, showEmployees: boolean): number {
  // Without the specialist step everything after it moves up by one.
  const shift = showEmployees ? 0 : 1;
  if (storeStep <= 2) return 1;
  if (storeStep === 3) return 2;
  if (storeStep === 4) return 3 - shift;
  if (storeStep === 5) return 4 - shift;
  return 5 - shift;
}

export default function ElegantLayout({ companySlug }: Props) {
  const {
    currentStep,
    prevStep,
    company,
    theme,
    bookingConfirmation,
    selectedService,
    selectedServices,
    selectedDate,
    selectedTime,
    selectedEmployeeId,
    anyPerson,
    employeesUI,
    customerDetails,
    prikazZaposlenih,
    language,
    setLanguage,
  } = useBookingStore();

  // A sent request counts as finished too: no stepper or back link.
  const requestSent = useRequestStore((st) => st.sent);
  const isSuccess = !!bookingConfirmation?.success || requestSent;
  const canGoBack = currentStep > 1 && !isSuccess;
  const stepKey = `step-${currentStep}-${isSuccess}`;

  // Request mode (company.booking_mode='request'): no free-time calendar;
  // the client says when suits them and the salon picks the time.
  const isRequest = company?.booking_mode === 'request';
  const requestLook = elegantLook(theme);

  const renderStep = () => {
    if (bookingConfirmation?.success) {
      return <ElegantConfirmation companySlug={companySlug} />;
    }
    switch (currentStep) {
      case 1:
      case 2: return <ElegantServiceSelection />;
      case 3: return <ElegantEmployeeSelection />;
      case 4: return isRequest ? <RequestWhenStep look={requestLook} /> : <ElegantDateTimeSelection companySlug={companySlug} />;
      case 5: return <ElegantCustomerDetails />;
      case 6: return isRequest ? <RequestReview look={requestLook} companySlug={companySlug} /> : <ElegantConfirmation companySlug={companySlug} />;
      default: return null;
    }
  };

  const selectedEmployee = employeesUI.find((e) => e.id === selectedEmployeeId);

  const visualStep = storeToVisualElegant(currentStep, prikazZaposlenih);
  const totalSteps = prikazZaposlenih ? 5 : 4;

  // Sidebar step values (keys match store step numbers used in ElegantSidebar)
  const stepValues: Record<number, string | undefined> = {
    1: selectedServices.length > 0 ? selectedServices.map((sv) => sv.naziv).join(' + ') : selectedService?.naziv,
    3: anyPerson ? t(language, 'anyone') : selectedEmployee?.label,
    4: selectedDate
      ? selectedTime
        ? `${format(selectedDate, datePattern(language, 'd. MMM'), { locale: dateLocale(language) })} ${t(language, 'at')} ${selectedTime}`
        : format(selectedDate, datePattern(language, 'd. MMMM yyyy'), { locale: dateLocale(language) })
      : undefined,
    5: customerDetails
      ? `${customerDetails.firstName} ${customerDetails.lastName}`
      : undefined,
    6: undefined,
  };

  return (
    <div
      className="relative min-h-screen flex"
      style={{
        background: `linear-gradient(180deg, ${theme.bgFrom}06 0%, #ffffff 15%, #ffffff 85%, ${theme.bgTo}04 100%)`,
        fontFamily: 'var(--font-inter)',
        ['--el-accent' as string]: theme.primarySolid,
        ['--el-accent-soft' as string]: `${theme.primarySolid}1F`,
      }}
    >
      {/* Soft light in the company colour, drifting very slowly */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
        <motion.div
          className="absolute -right-[15%] -top-[20%] h-[60vh] w-[60vh] rounded-full"
          style={{ background: `radial-gradient(closest-side, ${theme.primaryColor}1A, transparent)` }}
          animate={{ x: [0, -40, 0], y: [0, 30, 0] }}
          transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>
      {/* ── Sidebar ────────────────────────────────────── */}
      <aside
        className="hidden md:flex flex-col border-r flex-shrink-0"
        style={{ width: '240px', borderColor: '#F3F4F6' }}
      >
        {/* Company name */}
        <div className="px-6 pt-10 pb-6 flex-shrink-0">
          <h1
            style={{
              fontFamily: 'var(--font-playfair)',
              fontSize: '1.1rem',
              fontWeight: 500,
              color: '#111111',
              lineHeight: 1.3,
            }}
          >
            <CompanyLogo name={company?.naziv ?? 'Booking'} logoUrl={company?.logo_url} maxHeight={34} />
          </h1>
          <div
            className="mt-3 h-px"
            style={{
              background: `linear-gradient(to right, ${theme.primaryColor}50, transparent)`,
            }}
          />
        </div>

        {/* Progress steps */}
        <ElegantSidebar
          currentStep={isSuccess ? 7 : currentStep}
          stepValues={stepValues}
        />
      </aside>

      {/* ── Main area ──────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header
          className="flex items-center justify-between px-6 md:px-10 py-5 border-b flex-shrink-0"
          style={{ borderColor: '#F3F4F6' }}
        >
          {/* Left: mobile company name / desktop step label + back */}
          <div className="flex items-center gap-4 min-w-0">
            {/* Mobile: company name */}
            <h1
              className="md:hidden truncate"
              style={{
                fontFamily: 'var(--font-playfair)',
                fontSize: '1rem',
                fontWeight: 500,
                color: '#111111',
              }}
            >
              {company?.naziv ?? 'Booking'}
            </h1>

            {/* Desktop: back button + step label */}
            <div className="hidden md:flex items-center gap-4">
              {canGoBack && <BackButton onClick={prevStep} label={t(language, 'back')} color={theme.primarySolid} />}
              {!isSuccess && (
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key={currentStep}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.25 }}
                    className="text-sm italic"
                    style={{ color: theme.primaryOnLight, fontFamily: 'var(--font-playfair)', fontSize: '0.95rem' }}
                  >
                    {t(language, STEP_LABEL_KEYS[currentStep as keyof typeof STEP_LABEL_KEYS] ?? 'stepService')}
                  </motion.span>
                </AnimatePresence>
              )}
            </div>
          </div>

          {/* Right: step indicator + language */}
          <div className="flex items-center gap-4 flex-shrink-0">
          {!isSuccess ? (
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Mobile: pill dots */}
              <div className="flex items-center gap-1 md:hidden">
                {Array.from({ length: totalSteps }, (_, i) => i + 1).map((v) => (
                  <motion.div
                    key={v}
                    className="rounded-full"
                    initial={false}
                    animate={{ width: v === visualStep ? 20 : 6 }}
                    transition={{ duration: 0.45, ease: EASE }}
                    style={{
                      height: 6,
                      background:
                        v === visualStep
                          ? `linear-gradient(to right, ${theme.primarySolid}, ${theme.secondaryColor ?? theme.primarySolid})`
                          : v < visualStep
                          ? theme.primarySolid
                          : '#E5E7EB',
                    }}
                  />
                ))}
              </div>
              {/* Desktop: text */}
              <span
                className="hidden md:block text-sm"
                style={{ color: '#6B7280', fontFamily: 'var(--font-inter)' }}
              >
                {t(language, 'stepOf')(visualStep, totalSteps)}
              </span>
            </div>
          ) : (
            <div />
          )}
            <LanguageToggle language={language} onChange={setLanguage} color={theme.primarySolid} />
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-x-clip px-6 md:px-12 py-8 md:py-10">
          <div className="flex gap-10 xl:gap-14">
          <div className="max-w-2xl flex-1 min-w-0">
            {/* Mobile: back button */}
            {canGoBack && <BackButton onClick={prevStep} label={t(language, 'back')} color={theme.primarySolid} className="mb-6 md:hidden" />}

            {/* Animated step content */}
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
          {!isSuccess && currentStep < 6 && <ElegantSummary />}
          </div>
        </main>

        {/* Footer */}
        <footer
          className="px-6 py-4 border-t text-center flex-shrink-0"
          style={{ borderColor: '#F9FAFB' }}
        >
          <p
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '0.7rem',
              color: '#D1D5DB',
            }}
          >
            © {new Date().getFullYear()} · Jedro+ · {t(language, 'footer')}
          </p>
        </footer>
      </div>
    </div>
  );
}
