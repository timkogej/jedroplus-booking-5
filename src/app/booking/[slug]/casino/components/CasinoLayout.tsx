'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useBookingStore } from '@/store/bookingStore';
import SlotMachine from './SlotMachine';
import CasinoCategorySelection from './steps/CasinoCategorySelection';
import CasinoServiceSelection from './steps/CasinoServiceSelection';
import CasinoEmployeeSelection from './steps/CasinoEmployeeSelection';
import CasinoDateTimeSelection from './steps/CasinoDateTimeSelection';
import CasinoCustomerDetails from './steps/CasinoCustomerDetails';
import CasinoConfirmation from './steps/CasinoConfirmation';

interface CasinoLayoutProps {
  companySlug: string;
}

// Step titles for the casino theme
const STEP_TITLES: Record<number, { title: string; subtitle: string }> = {
  1: { title: '🎲 IZBERI IGRO', subtitle: 'Choose Your Game Type' },
  2: { title: '💰 POSTAVI STAVO', subtitle: 'Place Your Bet' },
  3: { title: '🃏 IZBERI MOJSTRA', subtitle: 'Pick Your Dealer' },
  4: { title: '⏰ ZAVRTITE KOLO', subtitle: 'Spin The Wheel' },
  5: { title: '🎫 REGISTRACIJA', subtitle: 'Player Registration' },
  6: { title: '🎰 JACKPOT', subtitle: 'Confirm Your Win' },
};

const pageVariants = {
  initial: { opacity: 0, y: 20, filter: 'blur(4px)' },
  animate: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
  },
  exit: {
    opacity: 0,
    y: -12,
    filter: 'blur(2px)',
    transition: { duration: 0.25 },
  },
};

// Progress dots at top
function StepIndicator({ current }: { current: number }) {
  const { theme } = useBookingStore();
  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      {[1, 2, 3, 4, 5, 6].map((step) => (
        <div
          key={step}
          className="rounded-full transition-all duration-300"
          style={{
            width: step === current ? 24 : 8,
            height: 8,
            backgroundColor: step <= current ? theme.primaryColor : 'rgba(255,255,255,0.15)',
            boxShadow: step === current ? `0 0 8px ${theme.primaryColor}` : 'none',
          }}
        />
      ))}
    </div>
  );
}

// Header with company name as neon sign
function CasinoHeader() {
  const { theme, company } = useBookingStore();
  const primary = theme.primaryColor;

  return (
    <header className="text-center py-6 px-4 border-b" style={{ borderColor: `${primary}20` }}>
      {/* Top sparkle row */}
      <div className="flex items-center justify-center gap-3 mb-3">
        <div className="casino-divider flex-1 max-w-24" />
        <span className="text-base" style={{ color: `${primary}80` }}>✦</span>
        <div className="casino-divider flex-1 max-w-24" />
      </div>

      {/* Company name */}
      <motion.h1
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
        className="text-2xl md:text-3xl font-black tracking-[0.15em] uppercase mb-1 casino-neon-text"
        style={{ fontFamily: 'var(--font-orbitron)' }}
      >
        {company?.naziv ?? 'BOOKING'}
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25 }}
        className="text-xs tracking-[0.4em] uppercase"
        style={{
          fontFamily: 'var(--font-orbitron)',
          color: `${primary}60`,
        }}
      >
        « BOOKING CASINO »
      </motion.p>

      {/* Bottom sparkle row */}
      <div className="flex items-center justify-center gap-3 mt-3">
        <div className="casino-divider flex-1 max-w-24" />
        <span className="text-base" style={{ color: `${primary}80` }}>✦</span>
        <div className="casino-divider flex-1 max-w-24" />
      </div>
    </header>
  );
}

// Nav back button
function BackButton({ onClick }: { onClick: () => void }) {
  const { theme } = useBookingStore();
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ x: -3 }}
      whileTap={{ scale: 0.95 }}
      className="flex items-center gap-2 text-sm tracking-widest uppercase mb-6 transition-colors"
      style={{
        fontFamily: 'var(--font-orbitron)',
        color: `${theme.primaryColor}70`,
        fontSize: '10px',
      }}
    >
      ← NAZAJ
    </motion.button>
  );
}

export default function CasinoLayout({ companySlug }: CasinoLayoutProps) {
  const { currentStep, prevStep, bookingConfirmation, selectedService, theme } = useBookingStore();
  const primary = theme.primaryColor;

  const stepInfo = STEP_TITLES[currentStep] ?? STEP_TITLES[1];
  const stepKey = `step-${currentStep}-${!!bookingConfirmation?.success}`;

  const renderStep = () => {
    if (bookingConfirmation?.success) {
      return <CasinoConfirmation companySlug={companySlug} />;
    }
    switch (currentStep) {
      case 1: return <CasinoCategorySelection />;
      case 2: return <CasinoServiceSelection />;
      case 3: return <CasinoEmployeeSelection />;
      case 4: return <CasinoDateTimeSelection companySlug={companySlug} />;
      case 5: return <CasinoCustomerDetails />;
      case 6: return <CasinoConfirmation companySlug={companySlug} />;
      default: return null;
    }
  };

  const canGoBack = currentStep > 1 && !bookingConfirmation?.success;
  const isSuccess = !!bookingConfirmation?.success;

  return (
    <div
      className="min-h-screen casino-bg-pattern"
      style={{ backgroundColor: '#0F0F1A', color: 'white' }}
    >
      {/* ── Header ── */}
      <CasinoHeader />

      {/* ── Main content ── */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* Step indicator */}
        {!isSuccess && <StepIndicator current={currentStep} />}

        {/* Slot machine display */}
        {!isSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mb-6"
          >
            <SlotMachine />
          </motion.div>
        )}

        {/* Step title */}
        {!isSuccess && (
          <AnimatePresence mode="wait">
            <motion.div
              key={`title-${currentStep}`}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.3 }}
              className="mb-5"
            >
              {canGoBack && <BackButton onClick={prevStep} />}

              <div className="flex items-center gap-3 mb-1">
                <div className="casino-divider flex-1" />
              </div>

              <h2
                className="text-lg font-bold tracking-[0.12em] uppercase mb-1"
                style={{ fontFamily: 'var(--font-orbitron)', color: primary }}
              >
                {stepInfo.title}
              </h2>
              <p
                className="text-xs tracking-[0.2em] uppercase"
                style={{ fontFamily: 'var(--font-inter)', color: 'rgba(255,255,255,0.35)' }}
              >
                {stepInfo.subtitle}
              </p>

              {/* Price badge if service selected */}
              {selectedService && currentStep > 2 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full border"
                  style={{
                    borderColor: '#FFD700',
                    backgroundColor: 'rgba(255,215,0,0.08)',
                  }}
                >
                  <span className="text-xs font-bold casino-neon-gold tracking-wider"
                    style={{ fontFamily: 'var(--font-orbitron)' }}>
                    JACKPOT: €{selectedService.cena}
                  </span>
                </motion.div>
              )}

              <div className="casino-divider mt-4" />
            </motion.div>
          </AnimatePresence>
        )}

        {/* ── Step content ── */}
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
      </main>

      {/* ── Footer ── */}
      <footer
        className="border-t py-4 px-4 text-center mt-12"
        style={{ borderColor: `${primary}15` }}
      >
        <p
          className="text-[9px] tracking-[0.3em] uppercase"
          style={{ fontFamily: 'var(--font-orbitron)', color: 'rgba(255,255,255,0.15)' }}
        >
          © {new Date().getFullYear()} · Jedro+ · Rezervacijski Sistem
        </p>
      </footer>
    </div>
  );
}
