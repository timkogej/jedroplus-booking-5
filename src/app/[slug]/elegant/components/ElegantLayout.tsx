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

interface Props {
  companySlug: string;
}

const pageVariants: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: 'easeOut' as const },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: { duration: 0.2 },
  },
};

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
    <div className="flex rounded-full border overflow-hidden" style={{ borderColor: '#E5E7EB' }}>
      {(['sl', 'en'] as const).map((lang) => {
        const active = language === lang;
        return (
          <button
            key={lang}
            type="button"
            onClick={() => onChange(lang)}
            aria-pressed={active}
            className="px-2.5 py-1 text-xs font-medium uppercase transition-colors"
            style={{
              fontFamily: 'var(--font-inter)',
              background: active ? color : 'transparent',
              color: active ? '#FFFFFF' : '#4B5563',
            }}
          >
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

  const isSuccess = !!bookingConfirmation?.success;
  const canGoBack = currentStep > 1 && !isSuccess;
  const stepKey = `step-${currentStep}-${isSuccess}`;

  const renderStep = () => {
    if (bookingConfirmation?.success) {
      return <ElegantConfirmation companySlug={companySlug} />;
    }
    switch (currentStep) {
      case 1:
      case 2: return <ElegantServiceSelection />;
      case 3: return <ElegantEmployeeSelection />;
      case 4: return <ElegantDateTimeSelection companySlug={companySlug} />;
      case 5: return <ElegantCustomerDetails />;
      case 6: return <ElegantConfirmation companySlug={companySlug} />;
      default: return null;
    }
  };

  const selectedEmployee = employeesUI.find((e) => e.id === selectedEmployeeId);

  const visualStep = storeToVisualElegant(currentStep, prikazZaposlenih);
  const totalSteps = prikazZaposlenih ? 5 : 4;

  // Sidebar step values (keys match store step numbers used in ElegantSidebar)
  const stepValues: Record<number, string | undefined> = {
    1: selectedService?.naziv,
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
      className="min-h-screen flex"
      style={{
        background: `linear-gradient(180deg, ${theme.bgFrom}06 0%, #ffffff 15%, #ffffff 85%, ${theme.bgTo}04 100%)`,
        fontFamily: 'var(--font-inter)',
      }}
    >
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
              {canGoBack && (
                <motion.button
                  onClick={prevStep}
                  whileHover={{ x: -2 }}
                  whileTap={{ scale: 0.97 }}
                  className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-600 transition-colors"
                  style={{ fontFamily: 'var(--font-inter)' }}
                >
                  {t(language, 'back')}
                </motion.button>
              )}
              {!isSuccess && (
                <span
                  className="text-sm font-medium"
                  style={{ color: theme.primaryOnLight, fontFamily: 'var(--font-inter)' }}
                >
                  {t(language, STEP_LABEL_KEYS[currentStep as keyof typeof STEP_LABEL_KEYS] ?? 'stepService')}
                </span>
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
                  <div
                    key={v}
                    className="rounded-full transition-all duration-300"
                    style={{
                      width: v === visualStep ? 18 : 6,
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
            {canGoBack && (
              <motion.button
                onClick={prevStep}
                whileHover={{ x: -2 }}
                className="md:hidden flex items-center gap-1.5 text-sm text-gray-500 mb-6"
                style={{ fontFamily: 'var(--font-inter)' }}
              >
                {t(language, 'back')}
              </motion.button>
            )}

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
