'use client';

import { useMemo } from 'react';
import { AnimatePresence, motion, type Variants } from 'framer-motion';
import { useBookingStore } from '@/store/bookingStore';
import { MODERN_BG, MODERN_VARS, brandOf, EASE } from './brand';
import ModernHeader from './ModernHeader';
import ModernServiceSelection from './steps/ModernServiceSelection';
import ModernEmployeeSelection from './steps/ModernEmployeeSelection';
import ModernDateTimeSelection from './steps/ModernDateTimeSelection';
import ModernCustomerDetails from './steps/ModernCustomerDetails';
import ModernConfirmation from './steps/ModernConfirmation';
import ModernPaymentStep from './steps/ModernPaymentStep';
import RequestWhenStep from '@/components/shared/request/RequestWhenStep';
import RequestReview from '@/components/shared/request/RequestReview';
import { useRequestStore } from '@/lib/booking/request';
import { modernLook } from '@/components/shared/request/looks';

const pageVariants: Variants = {
  initial: { opacity: 0, y: 18, scale: 0.985 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: EASE },
  },
  exit: {
    opacity: 0,
    y: -10,
    scale: 0.99,
    transition: { duration: 0.18, ease: 'easeIn' as const },
  },
};

interface Props {
  companySlug: string;
}

export default function ModernLayout({ companySlug }: Props) {
  const {
    theme,
    currentStep,
    prevStep,
    bookingConfirmation,
  } = useBookingStore();

  const brand = useMemo(() => brandOf(theme), [theme]);
  const cssVars = useMemo(
    () => ({
      ...MODERN_VARS,
      '--t-accent': brand.glow,
      '--brand-a': brand.a,
      '--brand-b': brand.b,
      '--brand-glow': brand.glow,
      '--brand-glow2': brand.glow2,
      '--brand-grad': brand.gradient,
    }),
    [brand],
  );

  // A sent request counts as finished too: no stepper or back link.
  const requestSent = useRequestStore((st) => st.sent);
  const isSuccess = !!bookingConfirmation?.success || requestSent;
  const canGoBack = currentStep > 1 && !isSuccess;
  const stepKey = `step-${currentStep}-${isSuccess}`;

  // Request mode (company.booking_mode='request'): no free-time calendar;
  // the client says when suits them and the salon picks the time.
  const company = useBookingStore((s) => s.company);
  const isRequest = company?.booking_mode === 'request';
  const requestLook = modernLook(theme);

  const renderStep = () => {
    if (bookingConfirmation?.success) {
      return <ModernConfirmation companySlug={companySlug} />;
    }
    switch (currentStep) {
      case 1:
      case 2:
        return <ModernServiceSelection />;
      case 3:
        // Never reached when prikazZaposlenih=false: the store skips to step 4.
        return <ModernEmployeeSelection />;
      case 4:
        return isRequest ? <RequestWhenStep look={requestLook} /> : <ModernDateTimeSelection companySlug={companySlug} />;
      case 5:
        return <ModernCustomerDetails />;
      case 6:
        return isRequest ? <RequestReview look={requestLook} companySlug={companySlug} /> : <ModernConfirmation companySlug={companySlug} />;
      case 7:
        return <ModernPaymentStep />;
      default:
        return null;
    }
  };

  return (
    <div
      className="relative min-h-screen overflow-clip"
      style={{
        background: MODERN_BG,
        ...(cssVars as React.CSSProperties),
        fontFamily: 'var(--font-inter)',
        color: 'var(--t-primary)',
      }}
    >
      {/* Moving light in the company colours */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
        <div
          className="modern-aurora-a absolute -left-[20%] -top-[25%] h-[75vh] w-[75vh] rounded-full"
          style={{ background: `radial-gradient(closest-side, ${theme.primaryColor}, transparent)`, opacity: 0.42, filter: 'blur(40px)' }}
        />
        <div
          className="modern-aurora-b absolute -right-[25%] top-[10%] h-[70vh] w-[70vh] rounded-full"
          style={{ background: `radial-gradient(closest-side, ${brand.glow2}, transparent)`, opacity: 0.32, filter: 'blur(50px)' }}
        />
        <div
          className="modern-aurora-c absolute -bottom-[30%] left-[15%] h-[60vh] w-[90vh] rounded-full"
          style={{ background: `radial-gradient(closest-side, ${brand.glow}, transparent)`, opacity: 0.22, filter: 'blur(60px)' }}
        />
        {/* darken the lower page so content stays readable */}
        <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, transparent 0%, ${MODERN_BG}80 60%, ${MODERN_BG}E6 100%)` }} />
        <div className="modern-grain absolute inset-0" />
      </div>

      {/* Content layer */}
      <div className="relative z-10 flex min-h-screen flex-col">
        <ModernHeader
          currentStep={isSuccess ? 6 : currentStep}
          isSuccess={isSuccess}
          canGoBack={canGoBack}
          onBack={prevStep}
        />

        <main className="flex-1 overflow-x-clip px-4 pb-16 pt-8 sm:px-6">
          <div className="mx-auto max-w-2xl">
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

        <footer className="flex-shrink-0 py-6 text-center">
          <a
            href="https://jedroplus.si"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[12px] font-medium transition-opacity hover:opacity-80"
            style={{ color: 'var(--t-faint)', fontFamily: 'var(--font-inter)' }}
          >
            Powered by <span style={{ color: 'var(--t-muted)' }}>Jedro+</span>
          </a>
        </footer>
      </div>
    </div>
  );
}
