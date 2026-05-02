'use client';

import { useMemo, useState, useEffect } from 'react';
import { AnimatePresence, motion, type Variants } from 'framer-motion';
import { useBookingStore } from '@/store/bookingStore';
import { getCurrentSeasonalTheme, getSeasonEmoji } from './decorations/SeasonDetector';
import SeasonalDecorations from './decorations/SeasonalDecorations';
import FloatingEmojis from './decorations/FloatingEmojis';
import SeasonalSuccessAnimation from './decorations/SeasonalSuccessAnimation';
import SeasonalServiceSelection from './steps/SeasonalServiceSelection';
import SeasonalEmployeeSelection from './steps/SeasonalEmployeeSelection';
import SeasonalDateTimeSelection from './steps/SeasonalDateTimeSelection';
import SeasonalCustomerDetails from './steps/SeasonalCustomerDetails';
import SeasonalConfirmation from './steps/SeasonalConfirmation';

const STEPS = [
  { number: 1, label: 'Storitev', storeStep: 1 },
  { number: 2, label: 'Specialist', storeStep: 3 },
  { number: 3, label: 'Datum', storeStep: 4 },
  { number: 4, label: 'Podatki', storeStep: 5 },
  { number: 5, label: 'Potrditev', storeStep: 6 },
];

const pageVariants: Variants = {
  initial: { opacity: 0, y: 16 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
  },
  exit: { opacity: 0, y: -12, transition: { duration: 0.22 } },
};

interface Props {
  companySlug: string;
}

export default function SeasonalLayout({ companySlug }: Props) {
  const {
    theme,
    currentStep,
    prevStep,
    company,
    bookingConfirmation,
  } = useBookingStore();

  const seasonalTheme = useMemo(() => getCurrentSeasonalTheme(), []);
  const { config } = seasonalTheme;

  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    if (bookingConfirmation?.success) {
      setShowSuccessAnimation(true);
      setTimeout(() => setShowSuccessAnimation(false), 2000);
    }
  }, [bookingConfirmation?.success]);

  // CSS variables — always dark since all seasonal themes are dark
  const cssVars = useMemo(() => ({
    '--t-primary': '#ffffff',
    '--t-soft': 'rgba(255, 255, 255, 0.85)',
    '--t-muted': 'rgba(255, 255, 255, 0.58)',
    '--t-faint': 'rgba(255, 255, 255, 0.38)',
    '--t-disabled': 'rgba(255, 255, 255, 0.2)',
    '--s1': config.cardBgAlt,
    '--s2': config.cardBg,
    '--s2h': config.cardBgHover,
    '--s3': config.cardBgAlt,
    '--b1': 'rgba(255, 255, 255, 0.06)',
    '--b2': config.cardBorder,
    '--b3': 'rgba(255, 255, 255, 0.20)',
    '--header-bg': config.cardBg,
    '--nav-bg': config.cardBg,
  }), [config]);

  const isSuccess = !!bookingConfirmation?.success;
  const canGoBack = currentStep > 1 && !isSuccess;
  const displayStep = isSuccess ? 7 : currentStep;
  const stepKey = `step-${currentStep}-${isSuccess}`;

  const emoji = getSeasonEmoji(seasonalTheme);

  const renderStep = () => {
    if (bookingConfirmation?.success) {
      return <SeasonalConfirmation companySlug={companySlug} seasonalTheme={seasonalTheme} />;
    }
    switch (currentStep) {
      case 1:
      case 2: return <SeasonalServiceSelection seasonalTheme={seasonalTheme} />;
      case 3: return <SeasonalEmployeeSelection seasonalTheme={seasonalTheme} />;
      case 4: return <SeasonalDateTimeSelection companySlug={companySlug} seasonalTheme={seasonalTheme} />;
      case 5: return <SeasonalCustomerDetails seasonalTheme={seasonalTheme} />;
      case 6: return <SeasonalConfirmation companySlug={companySlug} seasonalTheme={seasonalTheme} />;
      default: return null;
    }
  };

  return (
    <div
      className="min-h-screen relative"
      style={{
        background: `linear-gradient(150deg, ${config.bgFrom}, ${config.bgTo})`,
        ...(cssVars as React.CSSProperties),
        fontFamily: 'var(--font-quicksand)',
      }}
    >
      {/* Seasonal decorations (snowflakes, leaves, etc.) */}
      <SeasonalDecorations
        seasonalTheme={seasonalTheme}
        primaryColor={theme.primaryColor}
        reducedCount={isMobile}
      />

      {/* Floating emojis through space */}
      <FloatingEmojis
        seasonalTheme={seasonalTheme}
        count={isMobile ? 12 : 22}
      />

      {/* Subtle accent glow */}
      <div className="fixed inset-0 z-[1] pointer-events-none overflow-hidden">
        <div
          className="absolute w-[600px] h-[600px] rounded-full"
          style={{
            background: `radial-gradient(circle, ${config.accentColor}18 0%, transparent 65%)`,
            top: '-20%',
            right: '-15%',
          }}
        />
        <div
          className="absolute w-[400px] h-[400px] rounded-full"
          style={{
            background: `radial-gradient(circle, ${config.accentColor}10 0%, transparent 65%)`,
            bottom: '-10%',
            left: '-10%',
          }}
        />
      </div>

      {/* Main content */}
      <div className="relative z-10 min-h-screen flex flex-col">

        {/* ── Company header ── */}
        <div className="text-center pt-10 pb-1 select-none pointer-events-none overflow-hidden px-4">
          {/* Season pill */}
          <motion.p
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-xs tracking-[0.22em] uppercase mb-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full"
            style={{
              color: 'rgba(255,255,255,0.55)',
              fontFamily: 'var(--font-quicksand)',
              border: '1px solid rgba(255,255,255,0.1)',
              backgroundColor: 'rgba(255,255,255,0.06)',
            }}
          >
            {emoji}&nbsp;{config.name}
          </motion.p>

          {/* Company name — visible, colored */}
          <motion.h1
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.08 }}
            className="leading-none font-black tracking-tight"
            style={{
              fontFamily: config.headingFont ?? 'var(--font-quicksand)',
              fontSize: 'clamp(2.2rem, 8vw, 4.5rem)',
              letterSpacing: '-0.02em',
              background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor ?? theme.primaryColor})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              filter: `drop-shadow(0 0 28px ${theme.primaryColor}55)`,
            }}
          >
            {company?.naziv ?? 'Booking'}
          </motion.h1>
        </div>

        {/* ── Progress steps ── */}
        <div className="relative px-8 py-5 max-w-2xl mx-auto w-full">
          <div className="flex items-start">
            {STEPS.map((step, i) => {
              const isDone = displayStep > step.storeStep;
              const isActive = displayStep === step.storeStep;
              const isLast = i === STEPS.length - 1;

              return (
                <div key={step.number} className="contents">
                  <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
                    <motion.div
                      className="flex items-center justify-center rounded-full text-xs font-bold flex-shrink-0"
                      style={{
                        width: 30,
                        height: 30,
                        backgroundColor:
                          isDone || isActive ? theme.primaryColor : 'rgba(255,255,255,0.1)',
                        border: `2px solid ${isDone || isActive ? theme.primaryColor : 'rgba(255,255,255,0.18)'}`,
                        color: isDone || isActive ? '#fff' : 'rgba(255,255,255,0.3)',
                        boxShadow: isActive
                          ? `0 0 0 4px ${theme.primaryColor}25, 0 0 16px ${theme.primaryColor}40`
                          : 'none',
                      }}
                      animate={isActive ? { scale: [1, 1.06, 1] } : { scale: 1 }}
                      transition={{ duration: 2, repeat: isActive ? Infinity : 0 }}
                    >
                      {isDone ? (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                        >
                          ✓
                        </motion.span>
                      ) : (
                        step.number
                      )}
                    </motion.div>

                    {/* Label - desktop only */}
                    <span
                      className="hidden sm:block text-center"
                      style={{
                        fontSize: '0.6rem',
                        fontFamily: 'var(--font-quicksand)',
                        color: isActive
                          ? 'rgba(255,255,255,0.85)'
                          : isDone
                          ? 'rgba(255,255,255,0.45)'
                          : 'rgba(255,255,255,0.25)',
                        maxWidth: 54,
                        lineHeight: 1.2,
                        textAlign: 'center',
                        fontWeight: isActive ? 600 : 400,
                      }}
                    >
                      {step.label}
                    </span>
                  </div>

                  {/* Connector line */}
                  {!isLast && (
                    <motion.div
                      className="flex-1"
                      style={{
                        height: 2,
                        marginTop: 14,
                        borderRadius: 2,
                      }}
                      animate={{
                        backgroundColor: isDone ? theme.primaryColor : 'rgba(255,255,255,0.12)',
                      }}
                      transition={{ duration: 0.4 }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Step content ── */}
        <main className="flex-1 flex justify-center px-4 pb-8">
          <div className="w-full max-w-lg">

            {/* Mobile back button */}
            {canGoBack && (
              <motion.button
                onClick={prevStep}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                whileHover={{ x: -3 }}
                className="flex items-center gap-2 text-sm mb-5"
                style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-quicksand)' }}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Nazaj
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
        </main>

        {/* Footer */}
        <footer className="py-4 text-center flex-shrink-0">
          <p
            className="text-xs"
            style={{ color: 'rgba(255,255,255,0.18)', fontFamily: 'var(--font-quicksand)' }}
          >
            © {new Date().getFullYear()} · Jedro+ · Rezervacijski Sistem
          </p>
        </footer>
      </div>

      {/* Success burst */}
      <SeasonalSuccessAnimation
        isActive={showSuccessAnimation}
        seasonalTheme={seasonalTheme}
        primaryColor={theme.primaryColor}
      />
    </div>
  );
}
