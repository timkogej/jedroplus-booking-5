'use client';

import { AnimatePresence, motion, type Variants } from 'framer-motion';
import { format } from 'date-fns';
import { sl } from 'date-fns/locale';
import { useBookingStore } from '@/store/bookingStore';
import ClassicSummaryCard from './ClassicSummaryCard';
import ClassicServiceSelection from './steps/ClassicServiceSelection';
import ClassicEmployeeSelection from './steps/ClassicEmployeeSelection';
import ClassicDateTimeSelection from './steps/ClassicDateTimeSelection';
import ClassicCustomerDetails from './steps/ClassicCustomerDetails';
import ClassicConfirmation from './steps/ClassicConfirmation';

interface Props {
  companySlug: string;
}

// ── Contrast detection ─────────────────────────────────────────
export function getContrastMode(bgFrom: string, bgTo: string): 'light' | 'dark' {
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) }
      : { r: 128, g: 128, b: 128 };
  };
  const luminance = (r: number, g: number, b: number) => {
    const [rs, gs, bs] = [r, g, b].map((c) => {
      const s = c / 255;
      return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  };
  const rgb1 = hexToRgb(bgFrom);
  const rgb2 = hexToRgb(bgTo);
  const avg =
    (luminance(rgb1.r, rgb1.g, rgb1.b) + luminance(rgb2.r, rgb2.g, rgb2.b)) / 2;
  return avg > 0.5 ? 'dark' : 'light';
}

// ── Step config (store: 1=Storitev+Kat combined, 3=Employee, 4=DateTime, 5=Customer, 6=Confirm)
const CLASSIC_STEPS = [
  { visual: 1, label: 'Storitev', storeStep: 1 },
  { visual: 2, label: 'Oseba', storeStep: 3 },
  { visual: 3, label: 'Termin', storeStep: 4 },
  { visual: 4, label: 'Podatki', storeStep: 5 },
];

function storeToVisual(storeStep: number): number {
  if (storeStep <= 2) return 1;
  if (storeStep === 3) return 2;
  if (storeStep === 4) return 3;
  if (storeStep === 5) return 4;
  return 5; // step 6 — all visual steps done
}

// ── Page variants ──────────────────────────────────────────────
const pageVariants: Variants = {
  initial: { opacity: 0, x: 20 },
  animate: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.3, ease: 'easeOut' as const },
  },
  exit: {
    opacity: 0,
    x: -20,
    transition: { duration: 0.2 },
  },
};

// ── Stepper ────────────────────────────────────────────────────
function ClassicStepper({
  visualStep,
  contrastMode,
  primaryColor,
}: {
  visualStep: number;
  contrastMode: 'light' | 'dark';
  primaryColor: string;
}) {
  const textMuted =
    contrastMode === 'light' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)';
  const textActive =
    contrastMode === 'light' ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.85)';
  const connectorDone = primaryColor;
  const connectorPending =
    contrastMode === 'light' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.12)';

  return (
    <div className="flex items-center justify-center px-4 py-5">
      {CLASSIC_STEPS.map((step, index) => {
        const isDone = step.visual < visualStep;
        const isActive = step.visual === visualStep;

        return (
          <div key={step.visual} className="flex items-center">
            {/* Step bubble */}
            <div className="flex flex-col items-center">
              <motion.div
                className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm"
                style={{
                  fontFamily: 'var(--font-nunito)',
                  backgroundColor:
                    isDone || isActive ? primaryColor : contrastMode === 'light'
                      ? 'rgba(255,255,255,0.18)'
                      : 'rgba(0,0,0,0.08)',
                  color:
                    isDone || isActive
                      ? '#ffffff'
                      : textMuted,
                  boxShadow: isActive ? `0 0 0 3px ${primaryColor}30` : 'none',
                }}
                animate={isActive ? { scale: [1, 1.06, 1] } : { scale: 1 }}
                transition={{ duration: 2.5, repeat: Infinity }}
              >
                {isDone ? '✓' : step.visual}
              </motion.div>

              {/* Label — hidden on mobile */}
              <span
                className="hidden md:block text-xs mt-1.5 font-medium"
                style={{
                  fontFamily: 'var(--font-nunito-sans)',
                  color: isActive || isDone ? textActive : textMuted,
                  transition: 'color 0.3s',
                }}
              >
                {step.label}
              </span>
            </div>

            {/* Connector line */}
            {index < CLASSIC_STEPS.length - 1 && (
              <div
                className="h-0.5 mx-1.5 rounded-full transition-all duration-500"
                style={{
                  width: '36px',
                  backgroundColor: isDone ? connectorDone : connectorPending,
                  marginBottom: '18px',
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Main layout ────────────────────────────────────────────────
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
    selectedDate,
    selectedTime,
    customerDetails,
  } = useBookingStore();

  const isSuccess = !!bookingConfirmation?.success;
  const contrastMode = getContrastMode(theme.bgFrom, theme.bgTo);
  const visualStep = storeToVisual(currentStep);
  const canGoBack = currentStep > 1 && !isSuccess;
  const stepKey = `step-${currentStep}-${isSuccess}`;

  const textPrimary =
    contrastMode === 'light' ? 'rgba(255,255,255,0.95)' : 'rgba(0,0,0,0.9)';
  const textSecondary =
    contrastMode === 'light' ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.55)';

  const renderStep = () => {
    if (bookingConfirmation?.success) {
      return <ClassicConfirmation companySlug={companySlug} />;
    }
    switch (currentStep) {
      case 1:
      case 2: return <ClassicServiceSelection />;
      case 3: return <ClassicEmployeeSelection />;
      case 4: return <ClassicDateTimeSelection companySlug={companySlug} />;
      case 5: return <ClassicCustomerDetails />;
      case 6: return <ClassicConfirmation companySlug={companySlug} />;
      default: return null;
    }
  };

  // Summary values
  const selectedEmployee = employeesUI.find((e) => e.id === selectedEmployeeId);
  const summaryEmployee =
    selectedEmployeeId !== null || anyPerson
      ? anyPerson ? 'Kdorkoli' : selectedEmployee?.label
      : undefined;
  const summaryDate = selectedDate
    ? selectedTime
      ? `${format(selectedDate, 'd. MMM', { locale: sl })} ob ${selectedTime}`
      : format(selectedDate, 'd. MMMM yyyy', { locale: sl })
    : undefined;

  return (
    <div
      className="min-h-screen"
      style={{
        background: `linear-gradient(135deg, ${theme.bgFrom} 0%, ${theme.bgTo} 100%)`,
        fontFamily: 'var(--font-nunito-sans)',
      }}
    >
      {/* ── Header ─────────────────────────────────────── */}
      <header className="text-center pt-8 pb-2 px-4">
        <motion.h1
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-2xl font-bold tracking-tight"
          style={{
            fontFamily: 'var(--font-nunito)',
            color: textPrimary,
          }}
        >
          {company?.naziv ?? 'Booking'}
        </motion.h1>
      </header>

      {/* ── Stepper ────────────────────────────────────── */}
      {!isSuccess && (
        <ClassicStepper
          visualStep={visualStep}
          contrastMode={contrastMode}
          primaryColor={theme.primaryColor}
        />
      )}

      {/* ── Content area ───────────────────────────────── */}
      <main className="max-w-5xl mx-auto px-4 pb-16">
        <div className="flex gap-6 items-start">

          {/* ── Step content (left / full-width) ── */}
          <div className="flex-1 min-w-0">
            {/* Back button */}
            {canGoBack && !isSuccess && (
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
                ← Nazaj
              </motion.button>
            )}

            {/* Animated step */}
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

          {/* ── Summary card (desktop only) ── */}
          {!isSuccess && (
            <div className="hidden lg:block flex-shrink-0" style={{ width: '280px' }}>
              <ClassicSummaryCard
                employee={summaryEmployee}
                service={selectedService ? { name: selectedService.naziv, price: selectedService.cena, duration: selectedService.trajanjeMin } : undefined}
                dateTime={summaryDate}
                customer={customerDetails ? `${customerDetails.firstName} ${customerDetails.lastName}` : undefined}
                primaryColor={theme.primaryColor}
              />
            </div>
          )}
        </div>
      </main>

      {/* ── Footer ─────────────────────────────────────── */}
      <footer className="text-center pb-6 px-4">
        <p
          style={{
            fontFamily: 'var(--font-nunito-sans)',
            fontSize: '0.65rem',
            color: contrastMode === 'light' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
          }}
        >
          © {new Date().getFullYear()} · Jedro+ · Rezervacijski Sistem
        </p>
      </footer>
    </div>
  );
}
