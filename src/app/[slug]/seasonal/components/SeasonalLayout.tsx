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

// ── Time-of-day background tint (always light) ────────────────────────────────
function getTimeOfDayTint(): { bgFrom: string; bgTo: string } {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 11) {
    // Morning: cool, bright, fresh
    return { bgFrom: '#F0F7FF', bgTo: '#EBF5FF' };
  }
  if (hour >= 11 && hour < 17) {
    // Day: brightest, clean neutral
    return { bgFrom: '#F8FAFC', bgTo: '#F2F6FA' };
  }
  if (hour >= 17 && hour < 21) {
    // Evening: warm gold/peach
    return { bgFrom: '#FFF9F0', bgTo: '#FFF5E8' };
  }
  // Night: muted, still light — dim pastel
  return { bgFrom: '#F4F6F9', bgTo: '#EEF1F5' };
}

// ── Blend two hex colors with a weight 0–1 ────────────────────────────────────
function blendHex(a: string, b: string, t: number): string {
  const parse = (hex: string) => {
    const h = hex.replace('#', '');
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  };
  const [ar, ag, ab] = parse(a);
  const [br, bg, bb] = parse(b);
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bv = Math.round(ab + (bb - ab) * t);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${bv.toString(16).padStart(2, '0')}`;
}

const STEPS = [
  { number: 1, label: 'Storitev', labelEn: 'Service', storeStep: 1 },
  { number: 2, label: 'Specialist', labelEn: 'Expert', storeStep: 3 },
  { number: 3, label: 'Datum', labelEn: 'Date', storeStep: 4 },
  { number: 4, label: 'Podatki', labelEn: 'Details', storeStep: 5 },
  { number: 5, label: 'Potrdi', labelEn: 'Confirm', storeStep: 6 },
];

const pageVariants: Variants = {
  initial: { opacity: 0, y: 18 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.38, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
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
    language,
    setLanguage,
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
      setTimeout(() => setShowSuccessAnimation(false), 2200);
    }
  }, [bookingConfirmation?.success]);

  // Blend seasonal bg with time-of-day tint (70% seasonal, 30% time-of-day)
  const timeTint = useMemo(() => getTimeOfDayTint(), []);
  const bgFrom = blendHex(config.bgFrom, timeTint.bgFrom, 0.35);
  const bgTo = blendHex(config.bgTo, timeTint.bgTo, 0.35);

  // CSS variables — always dark text on light background
  const cssVars = useMemo(() => ({
    '--t-primary': '#111827',
    '--t-soft': '#374151',
    '--t-muted': '#6B7280',
    '--t-faint': '#9CA3AF',
    '--t-disabled': '#D1D5DB',
    '--s1': '#F9FAFB',
    '--s2': config.cardBg,
    '--s2h': config.cardBgHover,
    '--s3': config.cardBgAlt,
    '--b1': 'rgba(0,0,0,0.05)',
    '--b2': config.cardBorder,
    '--b3': 'rgba(0,0,0,0.14)',
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
        background: `linear-gradient(150deg, ${bgFrom}, ${bgTo})`,
        ...(cssVars as React.CSSProperties),
        fontFamily: 'var(--font-inter)',
      }}
    >
      {/* Seasonal decorations (snowflakes, leaves, etc.) */}
      <SeasonalDecorations
        seasonalTheme={seasonalTheme}
        primaryColor={theme.primaryColor}
        reducedCount={isMobile}
      />

      {/* Floating emojis */}
      <FloatingEmojis
        seasonalTheme={seasonalTheme}
        count={isMobile ? 8 : 14}
      />

      {/* Subtle seasonal accent glow */}
      <div className="fixed inset-0 z-[1] pointer-events-none overflow-hidden">
        <div
          className="absolute w-[500px] h-[500px] rounded-full"
          style={{
            background: `radial-gradient(circle, ${config.accentColor}12 0%, transparent 65%)`,
            top: '-15%',
            right: '-10%',
          }}
        />
        <div
          className="absolute w-[350px] h-[350px] rounded-full"
          style={{
            background: `radial-gradient(circle, ${config.accentColor}08 0%, transparent 65%)`,
            bottom: '-8%',
            left: '-8%',
          }}
        />
      </div>

      {/* Main content */}
      <div className="relative z-10 min-h-screen flex flex-col">

        {/* ── Top bar: company pill (centered) + language toggle (right) ── */}
        <div className="relative grid grid-cols-3 items-center px-5 pt-6 pb-2 max-w-2xl mx-auto w-full">
          {/* Empty left column — balances the language toggle */}
          <div />

          {/* Company name pill — centered via middle column */}
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full select-none justify-self-center"
            style={{
              backgroundColor: 'rgba(255,255,255,0.82)',
              border: `1px solid ${config.cardBorder}`,
              backdropFilter: 'blur(8px)',
              boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
            }}
          >
            <span style={{ fontSize: '0.85rem' }}>{emoji}</span>
            <span
              className="text-xs font-semibold tracking-wide"
              style={{
                color: '#374151',
                fontFamily: 'var(--font-stardom, serif)',
                letterSpacing: '0.02em',
              }}
            >
              {company?.naziv ?? 'Booking'}
            </span>
          </motion.div>

          {/* Language toggle — right column */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.45, delay: 0.1 }}
            className="flex items-center gap-0.5 rounded-xl overflow-hidden justify-self-end"
            style={{
              backgroundColor: 'rgba(255,255,255,0.7)',
              border: `1px solid ${config.cardBorder}`,
              backdropFilter: 'blur(8px)',
            }}
          >
            {(['sl', 'en'] as const).map((lang) => (
              <button
                key={lang}
                onClick={() => setLanguage(lang)}
                className="px-2.5 py-1 text-xs font-medium transition-colors"
                style={{
                  backgroundColor: language === lang ? theme.primaryColor : 'transparent',
                  color: language === lang ? '#ffffff' : '#6B7280',
                  fontFamily: 'var(--font-inter)',
                  borderRadius: '0.6rem',
                }}
              >
                {lang.toUpperCase()}
              </button>
            ))}
          </motion.div>
        </div>

        {/* ── Progress indicator ── */}
        <div className="px-5 pb-4 max-w-2xl mx-auto w-full">
          <div className="flex items-start">
            {STEPS.map((step, i) => {
              const isDone = displayStep > step.storeStep;
              const isActive = displayStep === step.storeStep;
              const isLast = i === STEPS.length - 1;
              const label = language === 'en' ? step.labelEn : step.label;

              return (
                <div key={step.number} className="contents">
                  <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
                    {/* Step circle */}
                    <motion.div
                      className="flex items-center justify-center rounded-full text-xs font-semibold flex-shrink-0"
                      style={{
                        width: 28,
                        height: 28,
                        backgroundColor: isDone
                          ? theme.primaryColor
                          : isActive
                          ? '#ffffff'
                          : 'rgba(255,255,255,0.6)',
                        border: isActive
                          ? `2px solid ${theme.primaryColor}`
                          : isDone
                          ? `2px solid ${theme.primaryColor}`
                          : `1.5px solid ${config.cardBorder}`,
                        color: isDone ? '#ffffff' : isActive ? theme.primaryColor : '#9CA3AF',
                        boxShadow: isActive
                          ? `0 0 0 3px ${theme.primaryColor}20, 0 2px 8px ${theme.primaryColor}25`
                          : isDone
                          ? `0 2px 6px ${theme.primaryColor}30`
                          : '0 1px 3px rgba(0,0,0,0.06)',
                        backdropFilter: 'blur(4px)',
                      }}
                      animate={isActive ? { scale: [1, 1.05, 1] } : { scale: 1 }}
                      transition={{ duration: 2.5, repeat: isActive ? Infinity : 0 }}
                    >
                      {isDone ? (
                        <motion.svg
                          viewBox="0 0 14 14"
                          fill="none"
                          stroke="white"
                          strokeWidth="2.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="w-3.5 h-3.5"
                          initial={{ pathLength: 0, opacity: 0 }}
                          animate={{ pathLength: 1, opacity: 1 }}
                          transition={{ duration: 0.35, ease: 'easeOut' as const }}
                        >
                          <motion.path d="M2 7l4 4 6-6" />
                        </motion.svg>
                      ) : (
                        <span style={{ fontSize: '0.65rem' }}>{step.number}</span>
                      )}
                    </motion.div>

                    {/* Label — desktop only */}
                    <span
                      className="hidden sm:block text-center"
                      style={{
                        fontSize: '0.58rem',
                        fontFamily: 'var(--font-inter)',
                        fontWeight: isActive ? 600 : 400,
                        color: isActive ? '#374151' : isDone ? '#9CA3AF' : '#C0C8D4',
                        maxWidth: 52,
                        lineHeight: 1.2,
                        letterSpacing: '0.02em',
                      }}
                    >
                      {label}
                    </span>
                  </div>

                  {/* Connector line */}
                  {!isLast && (
                    <motion.div
                      className="flex-1"
                      style={{ height: 1.5, marginTop: 13, borderRadius: 2 }}
                      animate={{
                        backgroundColor: isDone ? theme.primaryColor : config.cardBorder,
                      }}
                      transition={{ duration: 0.4 }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Step content — solid white card ── */}
        <main className="flex-1 flex justify-center px-4 pb-10">
          <div className="w-full max-w-lg">

            {/* Back button */}
            {canGoBack && (
              <motion.button
                onClick={prevStep}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                whileHover={{ x: -3 }}
                className="flex items-center gap-1.5 text-sm mb-4"
                style={{ color: '#6B7280', fontFamily: 'var(--font-inter)', fontWeight: 500 }}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                {language === 'en' ? 'Back' : 'Nazaj'}
              </motion.button>
            )}

            {/* White content card */}
            <div
              className="rounded-3xl overflow-hidden"
              style={{
                backgroundColor: '#ffffff',
                boxShadow: '0 4px 24px rgba(0,0,0,0.07), 0 1px 6px rgba(0,0,0,0.04)',
                border: `1px solid ${config.cardBorder}`,
              }}
            >
              <div className="px-6 py-7">
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
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="py-4 text-center flex-shrink-0">
          <p
            className="text-xs"
            style={{ color: '#C0C8D4', fontFamily: 'var(--font-inter)' }}
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
