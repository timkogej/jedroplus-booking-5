'use client';

import { AnimatePresence, motion, type Variants } from 'framer-motion';
import { useBookingStore } from '@/store/bookingStore';
import MagazineMasthead from './MagazineMasthead';
import MagazineProgress from './MagazineProgress';
import MagazineEmployeeSelection from './steps/MagazineEmployeeSelection';
import MagazineServiceSelection from './steps/MagazineServiceSelection';
import MagazineDateTimeSelection from './steps/MagazineDateTimeSelection';
import MagazineCustomerDetails from './steps/MagazineCustomerDetails';
import MagazineConfirmation from './steps/MagazineConfirmation';

interface MagazineLayoutProps {
  companySlug: string;
}

const pageVariants: Variants = {
  initial: { opacity: 0, y: 36, filter: 'blur(4px)' },
  animate: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
  },
  exit: {
    opacity: 0,
    y: -18,
    filter: 'blur(2px)',
    transition: { duration: 0.28 },
  },
};

// Editorial panel content per step
const EDITORIAL_PANELS = [
  {
    step: 1,
    eyebrow: 'Naše storitve',
    headline: 'Izbiramo samo najboljše za vas',
    quote: 'Kakovost je naš standard, ne izjema.',
    accent: 'Storitve',
  },
  {
    step: 2,
    eyebrow: 'Naše storitve',
    headline: 'Izbiramo samo najboljše za vas',
    quote: 'Kakovost je naš standard, ne izjema.',
    accent: 'Storitve',
  },
  {
    step: 3,
    eyebrow: 'Naši strokovnjaki',
    headline: 'Vsak specialist prinaša edinstveno izkušnjo',
    quote: 'Pravi strokovnjak za vsako storitev.',
    accent: 'Specialist',
  },
  {
    step: 4,
    eyebrow: 'Vaš termin',
    headline: 'Čas je dragocen — rezervirajte ga pametno',
    quote: 'Prosti termini, prilagojeni vašemu ritmu.',
    accent: 'Termin',
  },
  {
    step: 5,
    eyebrow: 'Vaši podatki',
    headline: 'Vaša zasebnost je naša prioriteta',
    quote: 'Zaupamo si le tisto, kar je potrebno.',
    accent: 'Podatki',
  },
  {
    step: 6,
    eyebrow: 'Potrditev',
    headline: 'Vaša rezervacija je skoraj potrjena',
    quote: 'Veselimo se vašega obiska.',
    accent: 'Potrdi',
  },
];

function EditorialPanel() {
  const { currentStep, theme, bookingConfirmation } = useBookingStore();
  const step = bookingConfirmation?.success ? 6 : currentStep;
  const panel = EDITORIAL_PANELS[step - 1] || EDITORIAL_PANELS[0];

  return (
    <div className="sticky top-0 h-screen flex flex-col justify-between p-12 overflow-hidden">
      {/* Background decorative shape */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 60% 60% at 30% 50%, ${theme.primaryColor}, transparent)`,
        }}
      />

      {/* Large decorative gradient shape */}
      <motion.div
        key={`shape-${step}`}
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/4 pointer-events-none"
        style={{ width: 380, height: 440 }}
      >
        <div
          className="w-full h-full editorial-gradient-shape"
          style={{
            background: `linear-gradient(135deg, ${theme.bgFrom}18, ${theme.bgTo}10)`,
            border: `1px solid ${theme.primaryColor}12`,
          }}
        />
      </motion.div>

      {/* Secondary smaller shape */}
      <motion.div
        key={`shape2-${step}`}
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, delay: 0.15, ease: 'easeOut' }}
        className="absolute left-6 bottom-1/3 pointer-events-none"
        style={{ width: 120, height: 120 }}
      >
        <div
          className="w-full h-full rounded-full"
          style={{
            background: `radial-gradient(circle, ${theme.primaryColor}14, transparent)`,
            border: `1px solid ${theme.primaryColor}10`,
          }}
        />
      </motion.div>

      {/* Top: eyebrow + decorative line */}
      <div>
        <div
          className="w-8 h-[1px] mb-4"
          style={{ backgroundColor: theme.primaryColor }}
        />
        <AnimatePresence mode="wait">
          <motion.p
            key={`eyebrow-${step}`}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="magazine-caps text-[9px] tracking-[0.28em]"
            style={{ color: theme.primaryColor }}
          >
            {panel.eyebrow}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* Center: large headline */}
      <div className="relative z-10">
        {/* Pull quote mark */}
        <span className="pull-quote-mark select-none" aria-hidden="true">
          &ldquo;
        </span>

        <AnimatePresence mode="wait">
          <motion.h2
            key={`headline-${step}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="magazine-serif text-[2.1rem] leading-[1.15] text-[#1A1A1A] tracking-[-0.02em] mt-1 mb-6"
          >
            {panel.headline}
          </motion.h2>
        </AnimatePresence>

        <AnimatePresence mode="wait">
          <motion.p
            key={`quote-${step}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="magazine-body text-[#6B6B6B] text-sm italic leading-relaxed"
          >
            {panel.quote}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* Bottom: step marker */}
      <div>
        <div className="h-[1px] bg-black/10 mb-4 w-full" />
        <div className="flex items-center justify-between">
          <AnimatePresence mode="wait">
            <motion.span
              key={`accent-${step}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="magazine-serif text-xs text-[#6B6B6B] italic"
            >
              {panel.accent}
            </motion.span>
          </AnimatePresence>
          <span className="magazine-caps text-[9px] tracking-[0.22em] text-black/25">
            0{step} / 06
          </span>
        </div>
      </div>
    </div>
  );
}

export default function MagazineLayout({ companySlug }: MagazineLayoutProps) {
  const { currentStep, bookingConfirmation } = useBookingStore();

  const renderStep = () => {
    if (bookingConfirmation?.success) {
      return <MagazineConfirmation companySlug={companySlug} />;
    }
    switch (currentStep) {
      case 1:
      case 2:
        return <MagazineServiceSelection />;
      case 3:
        return <MagazineEmployeeSelection />;
      case 4:
        return <MagazineDateTimeSelection companySlug={companySlug} />;
      case 5:
        return <MagazineCustomerDetails />;
      case 6:
        return <MagazineConfirmation companySlug={companySlug} />;
      default:
        return null;
    }
  };

  const stepKey = `${currentStep}-${!!bookingConfirmation?.success}`;

  return (
    <div className="min-h-screen bg-[#FAFAF9]">
      <MagazineMasthead />
      <MagazineProgress />

      <main>
        <div className="flex flex-col lg:flex-row min-h-[calc(100vh-130px)]">
          {/* Left: Editorial panel — desktop only */}
          <div className="hidden lg:block lg:w-[38%] xl:w-[40%] border-r border-black/10">
            <EditorialPanel />
          </div>

          {/* Right: Booking content */}
          <div className="flex-1 px-8 py-10 md:px-10 lg:px-14 xl:px-16 lg:py-12 pb-24 lg:pb-12">
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
      </main>

      {/* Footer */}
      <footer className="border-t border-black/10 px-8 py-4 md:px-12">
        <div className="flex items-center justify-between">
          <p className="magazine-caps text-[9px] tracking-[0.22em] text-black/25">
            © {new Date().getFullYear()} · Jedro+
          </p>
          <p className="magazine-caps text-[9px] tracking-[0.22em] text-black/25">
            Rezervacijski sistem
          </p>
        </div>
      </footer>
    </div>
  );
}
