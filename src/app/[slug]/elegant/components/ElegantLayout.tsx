'use client';

import { AnimatePresence, motion, type Variants } from 'framer-motion';
import { format } from 'date-fns';
import { sl } from 'date-fns/locale';
import { useBookingStore } from '@/store/bookingStore';
import ElegantSidebar from './ElegantSidebar';
import ElegantServiceSelection from './steps/ElegantServiceSelection';
import ElegantEmployeeSelection from './steps/ElegantEmployeeSelection';
import ElegantDateTimeSelection from './steps/ElegantDateTimeSelection';
import ElegantCustomerDetails from './steps/ElegantCustomerDetails';
import ElegantConfirmation from './steps/ElegantConfirmation';

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

const STEP_LABELS: Record<number, string> = {
  1: 'Storitev',
  3: 'Specialist',
  4: 'Datum in ura',
  5: 'Podatki',
  6: 'Potrditev',
};

function storeToVisualElegant(storeStep: number): number {
  if (storeStep <= 2) return 1;
  if (storeStep === 3) return 2;
  if (storeStep === 4) return 3;
  if (storeStep === 5) return 4;
  return 5;
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

  const visualStep = storeToVisualElegant(currentStep);

  // Sidebar step values (keys match store step numbers used in ElegantSidebar)
  const stepValues: Record<number, string | undefined> = {
    1: selectedService?.naziv,
    3: anyPerson ? 'Kdorkoli' : selectedEmployee?.label,
    4: selectedDate
      ? selectedTime
        ? `${format(selectedDate, 'd. MMM', { locale: sl })} ob ${selectedTime}`
        : format(selectedDate, 'd. MMMM yyyy', { locale: sl })
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
            {company?.naziv ?? 'Booking'}
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
                  className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors"
                  style={{ fontFamily: 'var(--font-inter)' }}
                >
                  ← Nazaj
                </motion.button>
              )}
              {!isSuccess && (
                <span
                  className="text-sm font-medium"
                  style={{ color: theme.primaryColor, fontFamily: 'var(--font-inter)' }}
                >
                  {STEP_LABELS[currentStep]}
                </span>
              )}
            </div>
          </div>

          {/* Right: step indicator */}
          {!isSuccess ? (
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Mobile: pill dots */}
              <div className="flex items-center gap-1 md:hidden">
                {[1, 2, 3, 4, 5].map((v) => (
                  <div
                    key={v}
                    className="rounded-full transition-all duration-300"
                    style={{
                      width: v === visualStep ? 18 : 6,
                      height: 6,
                      background:
                        v === visualStep
                          ? `linear-gradient(to right, ${theme.primaryColor}, ${theme.secondaryColor ?? theme.primaryColor})`
                          : v < visualStep
                          ? theme.primaryColor
                          : '#E5E7EB',
                    }}
                  />
                ))}
              </div>
              {/* Desktop: text */}
              <span
                className="hidden md:block text-sm"
                style={{ color: '#9CA3AF', fontFamily: 'var(--font-inter)' }}
              >
                Korak {visualStep} od 5
              </span>
            </div>
          ) : (
            <div />
          )}
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto px-6 md:px-12 py-8 md:py-10">
          <div className="max-w-2xl">
            {/* Mobile: back button */}
            {canGoBack && (
              <motion.button
                onClick={prevStep}
                whileHover={{ x: -2 }}
                className="md:hidden flex items-center gap-1.5 text-sm text-gray-400 mb-6"
                style={{ fontFamily: 'var(--font-inter)' }}
              >
                ← Nazaj
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
            © {new Date().getFullYear()} · Jedro+ · Rezervacijski Sistem
          </p>
        </footer>
      </div>
    </div>
  );
}
