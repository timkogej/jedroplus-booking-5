'use client';

import { useMemo } from 'react';
import { AnimatePresence, motion, type Variants } from 'framer-motion';
import { useBookingStore } from '@/store/bookingStore';
import { Theme } from '@/types';
import { isLightBackground } from '@/lib/color';
import ModernHeader from './ModernHeader';
import ModernServiceSelection from './steps/ModernServiceSelection';
import ModernEmployeeSelection from './steps/ModernEmployeeSelection';
import ModernDateTimeSelection from './steps/ModernDateTimeSelection';
import ModernCustomerDetails from './steps/ModernCustomerDetails';
import ModernConfirmation from './steps/ModernConfirmation';
import ModernPaymentStep from './steps/ModernPaymentStep';

interface CssVars {
  '--t-primary': string;
  '--t-soft': string;
  '--t-muted': string;
  '--t-faint': string;
  '--t-disabled': string;
  '--s1': string;
  '--s2': string;
  '--s2h': string;
  '--s3': string;
  '--b1': string;
  '--b2': string;
  '--b3': string;
  '--header-bg': string;
  '--nav-bg': string;
  /** Company colour for text, readable on this background. */
  '--t-accent': string;
}

function computeCssVars(theme: Theme): CssVars {
  const isBgLight = isLightBackground(theme.bgFrom, theme.bgTo);

  if (isBgLight) {
    return {
      '--t-primary': '#0f172a',
      '--t-soft': 'rgba(15, 23, 42, 0.75)',
      '--t-muted': 'rgba(15, 23, 42, 0.55)',
      '--t-faint': 'rgba(15, 23, 42, 0.4)',
      '--t-disabled': 'rgba(15, 23, 42, 0.22)',
      '--s1': 'rgba(0, 0, 0, 0.04)',
      '--s2': 'rgba(0, 0, 0, 0.07)',
      '--s2h': 'rgba(0, 0, 0, 0.1)',
      '--s3': 'rgba(0, 0, 0, 0.13)',
      '--b1': 'rgba(0, 0, 0, 0.08)',
      '--b2': 'rgba(0, 0, 0, 0.12)',
      '--b3': 'rgba(0, 0, 0, 0.18)',
      '--header-bg': 'rgba(255, 255, 255, 0.75)',
      '--nav-bg': 'rgba(255, 255, 255, 0.85)',
      '--t-accent': theme.primarySolid,
    };
  } else {
    return {
      '--t-primary': '#ffffff',
      '--t-soft': 'rgba(255, 255, 255, 0.8)',
      '--t-muted': 'rgba(255, 255, 255, 0.6)',
      '--t-faint': 'rgba(255, 255, 255, 0.45)',
      '--t-disabled': 'rgba(255, 255, 255, 0.22)',
      '--s1': 'rgba(255, 255, 255, 0.05)',
      '--s2': 'rgba(255, 255, 255, 0.1)',
      '--s2h': 'rgba(255, 255, 255, 0.15)',
      '--s3': 'rgba(255, 255, 255, 0.2)',
      '--b1': 'rgba(255, 255, 255, 0.08)',
      '--b2': 'rgba(255, 255, 255, 0.12)',
      '--b3': 'rgba(255, 255, 255, 0.18)',
      '--header-bg': 'rgba(0, 0, 0, 0.05)',
      '--nav-bg': 'rgba(0, 0, 0, 0.1)',
      '--t-accent': theme.primaryOnDark,
    };
  }
}

const pageVariants: Variants = {
  initial: { opacity: 0, y: 12 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.22,
      ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
    },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: { duration: 0.15 },
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

  const cssVars = useMemo(() => computeCssVars(theme), [theme]);

  const isSuccess = !!bookingConfirmation?.success;
  const canGoBack = currentStep > 1 && !isSuccess;
  const stepKey = `step-${currentStep}-${isSuccess}`;

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
        return <ModernDateTimeSelection companySlug={companySlug} />;
      case 5:
        return <ModernCustomerDetails />;
      case 6:
        return <ModernConfirmation companySlug={companySlug} />;
      case 7:
        return <ModernPaymentStep />;
      default:
        return null;
    }
  };

  return (
    <div
      className="min-h-screen relative overflow-clip"
      style={{
        background: `linear-gradient(135deg, ${theme.bgFrom}, ${theme.bgTo})`,
        ...(cssVars as React.CSSProperties),
        fontFamily: 'var(--font-inter)',
      }}
    >
      {/* Animated background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="modern-orb-1 absolute w-[600px] h-[600px] blur-3xl"
          style={{
            backgroundColor: theme.primaryColor,
            opacity: 0.25,
            top: '-20%',
            left: '-10%',
          }}
        />
        <div
          className="modern-orb-2 absolute w-[450px] h-[450px] blur-3xl"
          style={{
            backgroundColor: theme.secondaryColor,
            opacity: 0.18,
            bottom: '-15%',
            right: '-5%',
          }}
        />
      </div>

      {/* Content layer */}
      <div className="relative z-10 flex flex-col min-h-screen">

        <ModernHeader
          currentStep={isSuccess ? 6 : currentStep}
          isSuccess={isSuccess}
          canGoBack={canGoBack}
          onBack={prevStep}
        />

        <main className="flex-1 overflow-x-clip py-8 px-4">
          <div className="max-w-2xl mx-auto">
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

        <footer className="py-4 text-center flex-shrink-0">
          <p
            className="text-xs"
            style={{ color: 'var(--t-faint)', fontFamily: 'var(--font-inter)' }}
          >
            © {new Date().getFullYear()} · Jedro+ · Rezervacijski Sistem
          </p>
        </footer>

      </div>
    </div>
  );
}
