'use client';

import { AnimatePresence, motion, type Variants } from 'framer-motion';
import { useBookingStore } from '@/store/bookingStore';
import { t } from '../i18n';
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

function EditorialPanel() {
  const { currentStep, theme, bookingConfirmation, language } = useBookingStore();
  const step = bookingConfirmation?.success ? 6 : currentStep;

  type PanelKey = 1 | 2 | 3 | 4 | 5 | 6;
  const panels: Record<PanelKey, { eyebrow: string; headline: string; quote: string; accent: string }> = {
    1: { eyebrow: t(language, 'ep1Eyebrow'), headline: t(language, 'ep1Headline'), quote: t(language, 'ep1Quote'), accent: t(language, 'ep1Accent') },
    2: { eyebrow: t(language, 'ep1Eyebrow'), headline: t(language, 'ep1Headline'), quote: t(language, 'ep1Quote'), accent: t(language, 'ep1Accent') },
    3: { eyebrow: t(language, 'ep3Eyebrow'), headline: t(language, 'ep3Headline'), quote: t(language, 'ep3Quote'), accent: t(language, 'ep3Accent') },
    4: { eyebrow: t(language, 'ep4Eyebrow'), headline: t(language, 'ep4Headline'), quote: t(language, 'ep4Quote'), accent: t(language, 'ep4Accent') },
    5: { eyebrow: t(language, 'ep5Eyebrow'), headline: t(language, 'ep5Headline'), quote: t(language, 'ep5Quote'), accent: t(language, 'ep5Accent') },
    6: { eyebrow: t(language, 'ep6Eyebrow'), headline: t(language, 'ep6Headline'), quote: t(language, 'ep6Quote'), accent: t(language, 'ep6Accent') },
  };

  const safeStep = (step >= 1 && step <= 6 ? step : 1) as PanelKey;
  const panel = panels[safeStep];

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
            key={`eyebrow-${step}-${language}`}
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
            key={`headline-${step}-${language}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] }}
            className="magazine-serif text-[2.1rem] leading-[1.15] text-[#1A1A1A] tracking-[-0.02em] mt-1 mb-6"
          >
            {panel.headline}
          </motion.h2>
        </AnimatePresence>

        <AnimatePresence mode="wait">
          <motion.p
            key={`quote-${step}-${language}`}
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
              key={`accent-${step}-${language}`}
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
            0{safeStep} / 06
          </span>
        </div>
      </div>
    </div>
  );
}

export default function MagazineLayout({ companySlug }: MagazineLayoutProps) {
  const { currentStep, bookingConfirmation, language, prevStep } = useBookingStore();

  const showBackButton =
    !bookingConfirmation?.success && currentStep > 1;

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
            {/* Back button */}
            {showBackButton && (
              <motion.button
                onClick={prevStep}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className="flex items-center gap-1.5 mb-8 group"
                style={{ color: 'rgba(0,0,0,0.28)' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#1A1A1A')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(0,0,0,0.28)')}
              >
                <span className="magazine-caps text-[9px] tracking-[0.22em] transition-colors duration-200">
                  {t(language, 'back')}
                </span>
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
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-black/10 px-8 py-4 md:px-12">
        <div className="flex items-center justify-between">
          <p className="magazine-caps text-[9px] tracking-[0.22em] text-black/25">
            © {new Date().getFullYear()} · Jedro+
          </p>
          <p className="magazine-caps text-[9px] tracking-[0.22em] text-black/25">
            {t(language, 'onlineBooking')}
          </p>
        </div>
      </footer>
    </div>
  );
}
