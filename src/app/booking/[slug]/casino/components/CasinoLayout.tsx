'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useBookingStore } from '@/store/bookingStore';
import BookingSummaryCard from './SlotMachine';
import CasinoCategorySelection from './steps/CasinoCategorySelection';
import CasinoServiceSelection from './steps/CasinoServiceSelection';
import CasinoEmployeeSelection from './steps/CasinoEmployeeSelection';
import CasinoDateTimeSelection from './steps/CasinoDateTimeSelection';
import CasinoCustomerDetails from './steps/CasinoCustomerDetails';
import CasinoConfirmation from './steps/CasinoConfirmation';

interface CasinoLayoutProps {
  companySlug: string;
}

const STEP_INFO: Record<number, { title: string; subtitle: string }> = {
  1: { title: 'Izberi Kategorijo',       subtitle: 'Choose your experience' },
  2: { title: 'Postavi Stavo',           subtitle: 'Place your bet' },
  3: { title: 'Izberi Specialista',      subtitle: 'Pick your specialist' },
  4: { title: 'Rezerviraj Termin',       subtitle: 'Claim your slot' },
  5: { title: 'Registracija',            subtitle: 'Player registration' },
  6: { title: 'Potrditev',               subtitle: 'Confirm your seat' },
};

const pageVariants = {
  initial: { opacity: 0, y: 18, filter: 'blur(3px)' },
  animate: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      duration: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    filter: 'blur(2px)',
    transition: { duration: 0.28 },
  },
};

// ── Step indicator — elegant dots ──────────────────────────────
function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-1.5 mb-8">
      {[1, 2, 3, 4, 5, 6].map((step) => {
        const isDone = step < current;
        const isActive = step === current;
        return (
          <div key={step} className="relative flex items-center justify-center">
            <div
              className="rounded-full transition-all duration-500"
              style={{
                width: isActive ? 28 : isDone ? 8 : 6,
                height: isDone || isActive ? 8 : 6,
                background: isDone
                  ? '#c9a84c'
                  : isActive
                  ? 'linear-gradient(90deg, #a07830, #e8c96d)'
                  : 'rgba(201, 168, 76, 0.18)',
                boxShadow: isActive ? '0 0 8px rgba(201, 168, 76, 0.5)' : 'none',
              }}
            />
          </div>
        );
      })}
    </div>
  );
}

// ── Header ─────────────────────────────────────────────────────
function MCHeader() {
  const { company } = useBookingStore();

  return (
    <header className="text-center pt-8 pb-6 px-4">
      {/* Top decorative line */}
      <div className="flex items-center gap-3 justify-center mb-5">
        <span style={{ color: 'rgba(201,168,76,0.5)', fontSize: '0.6rem', letterSpacing: '0.3em' }}>◆</span>
        <div className="w-20 mc-divider" />
        <span style={{ color: '#c9a84c', fontSize: '0.8rem' }}>◆</span>
        <div className="w-20 mc-divider" />
        <span style={{ color: 'rgba(201,168,76,0.5)', fontSize: '0.6rem', letterSpacing: '0.3em' }}>◆</span>
      </div>

      <motion.h1
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.6 }}
        className="font-black uppercase tracking-[0.14em] mb-1"
        style={{
          fontFamily: 'var(--font-playfair)',
          fontSize: 'clamp(1.4rem, 4vw, 2rem)',
          color: '#c9a84c',
        }}
      >
        {company?.naziv ?? 'Booking'}
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-[10px] tracking-[0.45em] uppercase"
        style={{ fontFamily: 'var(--font-oswald)', color: 'rgba(201,168,76,0.35)' }}
      >
        ♠ &nbsp; Booking Casino &nbsp; ♠
      </motion.p>

      {/* Bottom decorative line */}
      <div className="flex items-center gap-3 justify-center mt-5">
        <div className="flex-1 max-w-32 mc-divider" />
        <span style={{ color: 'rgba(201,168,76,0.45)', fontSize: '0.65rem' }}>◆</span>
        <div className="flex-1 max-w-32 mc-divider" />
      </div>
    </header>
  );
}

// ── Back button ────────────────────────────────────────────────
function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ x: -3 }}
      whileTap={{ scale: 0.95 }}
      className="flex items-center gap-2 mb-6 transition-colors"
      style={{
        fontFamily: 'var(--font-oswald)',
        fontSize: '0.65rem',
        letterSpacing: '0.2em',
        textTransform: 'uppercase',
        color: 'rgba(201, 168, 76, 0.45)',
      }}
    >
      ← Nazaj
    </motion.button>
  );
}

// ── Roulette decoration (fixed, top-right) ─────────────────────
function RouletteDecoration() {
  return (
    <div
      className="fixed pointer-events-none z-0 mc-roulette"
      style={{
        top: '-80px',
        right: '-80px',
        width: '380px',
        height: '380px',
        border: '1.5px solid rgba(201, 168, 76, 0.12)',
        borderRadius: '50%',
        boxShadow: `
          inset 0 0 0 16px transparent,
          inset 0 0 0 17px rgba(201, 168, 76, 0.07),
          inset 0 0 0 48px transparent,
          inset 0 0 0 49px rgba(201, 168, 76, 0.05),
          inset 0 0 0 80px transparent,
          inset 0 0 0 81px rgba(201, 168, 76, 0.03)
        `,
      }}
    />
  );
}

// ── Floating card suits ────────────────────────────────────────
function CardSuitsDecoration() {
  const suits = [
    { symbol: '♣', top: '8%',  left: '3%',  rotate: '-12deg' },
    { symbol: '♥', bottom: '18%', left: '5%', rotate: '8deg'  },
    { symbol: '♠', top: '28%', right: '2%', rotate: '18deg'  },
  ];

  return (
    <>
      {suits.map((suit, i) => (
        <div
          key={i}
          className="fixed pointer-events-none z-0 select-none"
          style={{
            top: suit.top,
            bottom: (suit as { bottom?: string }).bottom,
            left: suit.left,
            right: (suit as { right?: string }).right,
            fontSize: '160px',
            color: 'rgba(201, 168, 76, 0.025)',
            fontFamily: 'Georgia, serif',
            transform: `rotate(${suit.rotate})`,
            lineHeight: 1,
          }}
        >
          {suit.symbol}
        </div>
      ))}
    </>
  );
}

export default function CasinoLayout({ companySlug }: CasinoLayoutProps) {
  const { currentStep, prevStep, bookingConfirmation, selectedService, theme } = useBookingStore();

  const stepInfo = STEP_INFO[currentStep] ?? STEP_INFO[1];
  const stepKey = `step-${currentStep}-${!!bookingConfirmation?.success}`;
  const canGoBack = currentStep > 1 && !bookingConfirmation?.success;
  const isSuccess = !!bookingConfirmation?.success;

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

  return (
    <div className="min-h-screen mc-bg relative overflow-x-hidden" style={{ color: '#f5edd6' }}>
      {/* Decorative elements */}
      <RouletteDecoration />
      <CardSuitsDecoration />

      {/* Header */}
      <div className="relative z-10">
        <MCHeader />
      </div>

      {/* Main */}
      <main className="relative z-10 max-w-2xl mx-auto px-4 pb-16">
        {/* Step indicator */}
        {!isSuccess && <StepIndicator current={currentStep} />}

        {/* Booking summary card */}
        {!isSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mb-7"
          >
            <BookingSummaryCard />
          </motion.div>
        )}

        {/* Step header */}
        {!isSuccess && (
          <AnimatePresence mode="wait">
            <motion.div
              key={`title-${currentStep}`}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.3 }}
              className="mb-6"
            >
              {canGoBack && <BackButton onClick={prevStep} />}

              {/* Step heading */}
              <h2
                className="font-bold mb-0.5"
                style={{
                  fontFamily: 'var(--font-playfair)',
                  fontSize: 'clamp(1.4rem, 4vw, 1.9rem)',
                  color: '#f5edd6',
                }}
              >
                {stepInfo.title}
              </h2>
              <p
                className="italic mb-4"
                style={{
                  fontFamily: 'var(--font-playfair)',
                  fontSize: '0.9rem',
                  color: '#c9a84c',
                  fontStyle: 'italic',
                }}
              >
                — {stepInfo.subtitle}
              </p>

              {/* Service price badge if applicable */}
              {selectedService && currentStep > 2 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full"
                  style={{
                    border: '1px solid rgba(201, 168, 76, 0.35)',
                    background: 'rgba(201, 168, 76, 0.06)',
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--font-oswald)',
                      fontSize: '0.65rem',
                      letterSpacing: '0.18em',
                      textTransform: 'uppercase',
                      color: '#a89060',
                    }}
                  >
                    {selectedService.naziv}
                  </span>
                  <span style={{ color: 'rgba(201,168,76,0.4)', fontSize: '0.5rem' }}>◆</span>
                  <span
                    style={{
                      fontFamily: 'var(--font-playfair)',
                      fontSize: '0.9rem',
                      fontWeight: 700,
                      color: '#e8c96d',
                    }}
                  >
                    €{selectedService.cena}
                  </span>
                </motion.div>
              )}

              <div className="mc-divider mt-4" />
            </motion.div>
          </AnimatePresence>
        )}

        {/* Step content */}
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

      {/* Footer */}
      <footer className="relative z-10 text-center py-6 px-4">
        <div className="flex items-center gap-3 justify-center mb-3">
          <div className="w-16 mc-divider" />
          <span style={{ color: 'rgba(201,168,76,0.2)', fontSize: '0.55rem' }}>◆</span>
          <div className="w-16 mc-divider" />
        </div>
        <p
          style={{
            fontFamily: 'var(--font-oswald)',
            fontSize: '0.6rem',
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            color: 'rgba(201,168,76,0.15)',
          }}
        >
          © {new Date().getFullYear()} · Jedro+ · Rezervacijski Sistem
        </p>
      </footer>
    </div>
  );
}
