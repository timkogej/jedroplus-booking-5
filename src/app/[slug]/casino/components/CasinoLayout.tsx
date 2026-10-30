'use client';

import { useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, type Variants } from 'framer-motion';
import CompanyLogo from '@/components/shared/CompanyLogo';
import { useBookingStore } from '@/store/bookingStore';
import { usePromotionsStore } from '@/store/promotionsStore';
import type { SupportedLanguage } from '@/types';
import {
  formatBookingPrice,
  getBookingPricing,
  resolvePrimaryPromotion,
} from '@/lib/pricing';
import { t } from '../i18n';
import BookingSummaryCard from './SlotMachine';
import CasinoServiceSelection from './steps/CasinoServiceSelection';
import CasinoEmployeeSelection from './steps/CasinoEmployeeSelection';
import CasinoDateTimeSelection from './steps/CasinoDateTimeSelection';
import CasinoCustomerDetails from './steps/CasinoCustomerDetails';
import CasinoConfirmation from './steps/CasinoConfirmation';
import RequestWhenStep from '@/components/shared/request/RequestWhenStep';
import RequestReview from '@/components/shared/request/RequestReview';
import { useRequestStore } from '@/lib/booking/request';
import { casinoLook } from '@/components/shared/request/looks';
import { CREAM, CX_BG, EASE, FAINT, FONT_HEAD, FONT_LABEL, SPRING, casinoVars, mix, Chip } from './ui';

interface CasinoLayoutProps {
  companySlug: string;
}

function storeToVisualCasino(storeStep: number, showEmployees: boolean): number {
  // Without the specialist step everything after it moves up by one.
  const shift = showEmployees ? 0 : 1;
  if (storeStep <= 2) return 1;
  if (storeStep === 3) return 2;
  if (storeStep === 4) return 3 - shift;
  if (storeStep === 5) return 4 - shift;
  return 5 - shift;
}

// A step is dealt like a card: it turns in from the side onto the table and
// the old one turns away. `dir` is 1 going forward and -1 going back.
const pageVariants: Variants = {
  initial: (dir: number) => ({ opacity: 0, x: 56 * dir, rotateY: -16 * dir, rotateZ: 1.5 * dir, scale: 0.96 }),
  animate: {
    opacity: 1,
    x: 0,
    rotateY: 0,
    rotateZ: 0,
    scale: 1,
    transition: { duration: 0.6, ease: EASE },
  },
  exit: (dir: number) => ({
    opacity: 0,
    x: -40 * dir,
    rotateY: 12 * dir,
    rotateZ: -1 * dir,
    scale: 0.97,
    transition: { duration: 0.26, ease: [0.4, 0, 1, 1] },
  }),
};

/** One pass of light over the new step, like light catching a fresh card. */
function DealGlint({ dir }: { dir: number }) {
  return (
    <motion.span
      aria-hidden="true"
      className="pointer-events-none absolute -inset-x-4 inset-y-0 z-20"
      style={{
        background: `linear-gradient(${dir > 0 ? 105 : 255}deg, transparent 38%, ${mix('--cx-glow', 9)} 48%, rgba(255,255,255,0.07) 50%, ${mix('--cx-glow', 9)} 52%, transparent 62%)`,
      }}
      initial={{ x: `${-110 * dir}%`, opacity: 1 }}
      animate={{ x: `${110 * dir}%`, opacity: [1, 1, 0] }}
      transition={{ duration: 0.9, delay: 0.18, ease: [0.4, 0, 0.2, 1] }}
    />
  );
}

// ── Progress: a row of poker chips ─────────────────────────────
function ChipProgress({ current }: { current: number }) {
  const prikazZaposlenih = useBookingStore((s) => s.prikazZaposlenih);
  const language = useBookingStore((s) => s.language);
  const visual = storeToVisualCasino(current, prikazZaposlenih);
  const labels = [
    t(language, 'stepService'),
    ...(prikazZaposlenih ? [t(language, 'stepSpecialist')] : []),
    t(language, 'stepDateTime'),
    t(language, 'stepDetails'),
    t(language, 'stepConfirm'),
  ];
  const total = labels.length;

  return (
    <div className="mb-7">
      <div className="flex items-center justify-center">
        {labels.map((label, i) => {
          const n = i + 1;
          const done = n < visual;
          const active = n === visual;
          return (
            <div key={label} className="flex items-center">
              {i > 0 && (
                <div className="relative mx-1 h-[2px] w-6 overflow-hidden rounded-full sm:mx-1.5 sm:w-10" style={{ background: 'rgba(255,255,255,0.1)' }}>
                  <motion.div
                    className="absolute inset-y-0 left-0"
                    style={{ background: 'var(--cx-grad)' }}
                    initial={false}
                    animate={{ width: n <= visual ? '100%' : '0%' }}
                    transition={{ duration: 0.5, ease: EASE }}
                  />
                </div>
              )}
              <motion.div
                initial={false}
                animate={{ scale: active ? 1 : 0.78 }}
                transition={SPRING}
                aria-label={label}
                aria-current={active ? 'step' : undefined}
              >
                <Chip size={34} on={done} dim={!done && !active} spin={active}>
                  <span style={{ fontSize: 13 }}>{n}</span>
                </Chip>
              </motion.div>
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex items-center justify-center gap-2">
        <AnimatePresence mode="wait" initial={false}>
          <motion.p
            key={labels[visual - 1]}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            className="cx-label"
            style={{ color: 'var(--cx-glow)' }}
          >
            {labels[visual - 1]}
          </motion.p>
        </AnimatePresence>
        <span style={{ color: FAINT, fontSize: '0.5rem' }}>◆</span>
        <p className="cx-label tabular-nums">
          {t(language, 'stepOf').replace('{n}', String(visual)).replace('{m}', String(total))}
        </p>
      </div>
    </div>
  );
}

// ── Language toggle with a sliding chip ────────────────────────
function LanguageToggle({
  language,
  onToggle,
}: {
  language: SupportedLanguage;
  onToggle: (l: SupportedLanguage) => void;
}) {
  return (
    <div className="relative flex rounded-full p-[3px]" style={{ background: 'rgba(255,255,255,0.06)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.08)' }}>
      {(['sl', 'en'] as SupportedLanguage[]).map((lang) => {
        const isActive = language === lang;
        return (
          <button
            key={lang}
            onClick={() => onToggle(lang)}
            aria-pressed={isActive}
            className="relative z-10 h-7 w-10 text-[12px] font-semibold uppercase"
            style={{ fontFamily: FONT_LABEL, letterSpacing: '0.1em', color: isActive ? '#fff' : FAINT, transition: 'color 0.2s' }}
          >
            {isActive && (
              <motion.span
                layoutId="cx-lang"
                className="absolute inset-0 -z-10 rounded-full"
                style={{ background: 'var(--cx-grad)', boxShadow: '0 4px 14px -4px var(--cx-a)' }}
                transition={SPRING}
              />
            )}
            {lang}
          </button>
        );
      })}
    </div>
  );
}

// ── Header ─────────────────────────────────────────────────────
function Header({ canGoBack, onBack }: { canGoBack: boolean; onBack: () => void }) {
  const { company, language, setLanguage } = useBookingStore();

  return (
    <header className="relative px-4 pb-5 pt-4 text-center">
      <div className="mx-auto flex h-9 max-w-2xl items-center justify-between">
        <AnimatePresence initial={false}>
          {canGoBack ? <BackButton key="back" onClick={onBack} label={t(language, 'back')} /> : <span key="none" />}
        </AnimatePresence>
        <LanguageToggle language={language} onToggle={setLanguage} />
      </div>

      <motion.div
        initial={{ opacity: 0, scaleX: 0.4 }}
        animate={{ opacity: 1, scaleX: 1 }}
        transition={{ duration: 0.8, ease: EASE }}
        className="mx-auto mb-3.5 mt-1 flex max-w-xs items-center justify-center gap-3"
        aria-hidden="true"
      >
        <span style={{ color: mix('--cx-glow', 50), fontSize: '0.55rem' }}>◆</span>
        <div className="cx-rule w-16 sm:w-20" />
        <span style={{ color: 'var(--cx-glow)', fontSize: '0.8rem' }}>◆</span>
        <div className="cx-rule w-16 sm:w-20" />
        <span style={{ color: mix('--cx-glow', 50), fontSize: '0.55rem' }}>◆</span>
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.6, ease: EASE }}
        className="font-black uppercase"
        style={{ fontFamily: FONT_HEAD, fontSize: 'clamp(1.45rem, 5vw, 2.1rem)', letterSpacing: '0.12em', color: CREAM }}
      >
        <CompanyLogo name={company?.naziv ?? 'Rezervacije'} logoUrl={company?.logo_url} variant="dark" />
      </motion.h1>

      {company?.panoga && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-1.5 text-[11px] uppercase"
          style={{ fontFamily: FONT_LABEL, letterSpacing: '0.38em', color: mix('--cx-glow', 70) }}
        >
          ♠&nbsp;&nbsp;{company.panoga}&nbsp;&nbsp;♠
        </motion.p>
      )}
    </header>
  );
}

// ── Back button ────────────────────────────────────────────────
function BackButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <motion.button
      onClick={onClick}
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -8 }}
      whileTap={{ scale: 0.94 }}
      className="flex h-9 items-center gap-2 rounded-full pl-3 pr-4 text-[12px] font-medium uppercase"
      style={{
        fontFamily: FONT_LABEL,
        letterSpacing: '0.16em',
        color: 'rgba(246,243,238,0.75)',
        background: 'rgba(255,255,255,0.05)',
        boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.09)',
      }}
    >
      <svg width="7" height="12" viewBox="0 0 8 14" fill="none" aria-hidden="true">
        <path d="M7 1L1 7l6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {label}
    </motion.button>
  );
}

// ── Roulette wheel in the corner, in the company colours ───────
function RouletteWheel() {
  const segments = useMemo(() => {
    const n = 37;
    const r1 = 200;
    const r2 = 150;
    const out: Array<{ d: string; brand: boolean; zero: boolean }> = [];
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * Math.PI * 2;
      const a1 = ((i + 1) / n) * Math.PI * 2;
      const p = (r: number, a: number) => `${(210 + r * Math.cos(a)).toFixed(2)} ${(210 + r * Math.sin(a)).toFixed(2)}`;
      out.push({
        d: `M${p(r2, a0)} L${p(r1, a0)} A${r1} ${r1} 0 0 1 ${p(r1, a1)} L${p(r2, a1)} A${r2} ${r2} 0 0 0 ${p(r2, a0)}Z`,
        brand: i % 2 === 1,
        zero: i === 0,
      });
    }
    return out;
  }, []);

  return (
    <div className="pointer-events-none fixed -right-36 -top-36 z-0 h-[420px] w-[420px] opacity-[0.12] sm:-right-24 sm:-top-24" aria-hidden="true">
      <svg viewBox="0 0 420 420" className="cx-wheel h-full w-full">
        <circle cx="210" cy="210" r="206" fill="none" stroke="var(--cx-glow)" strokeWidth="2" />
        {segments.map((s, i) => (
          <path key={i} d={s.d} fill={s.zero ? 'var(--cx-glow2)' : s.brand ? 'var(--cx-a)' : '#1a1a20'} stroke="rgba(255,255,255,0.25)" strokeWidth="0.6" />
        ))}
        <circle cx="210" cy="210" r="150" fill="none" stroke="var(--cx-glow)" strokeWidth="1" />
        <circle cx="210" cy="210" r="110" fill="none" stroke="var(--cx-glow)" strokeWidth="0.8" strokeDasharray="3 6" />
        <circle cx="210" cy="210" r="60" fill="none" stroke="var(--cx-glow)" strokeWidth="1.2" />
        {[0, 1, 2, 3].map((k) => (
          <line key={k} x1="210" y1="160" x2="210" y2="110" stroke="var(--cx-glow)" strokeWidth="1.5" transform={`rotate(${k * 90} 210 210)`} />
        ))}
        <circle cx="210" cy="210" r="14" fill="var(--cx-glow)" />
      </svg>
    </div>
  );
}

// ── Card suits that drift slowly ───────────────────────────────
const FLOATING_SUITS = [
  { symbol: '♣', style: { top: '9%', left: '3%' }, rot: -12, dur: 16, delay: 0 },
  { symbol: '♥', style: { bottom: '16%', left: '6%' }, rot: 8, dur: 19, delay: -4 },
  { symbol: '♠', style: { top: '34%', right: '3%' }, rot: 16, dur: 22, delay: -9 },
  { symbol: '♦', style: { bottom: '4%', right: '12%' }, rot: -6, dur: 17, delay: -2 },
];

function FloatingSuits() {
  return (
    <>
      {FLOATING_SUITS.map((s, i) => (
        <div
          key={i}
          className="cx-suit pointer-events-none fixed z-0 select-none"
          aria-hidden="true"
          style={{
            ...s.style,
            fontSize: 150,
            lineHeight: 1,
            fontFamily: 'Georgia, serif',
            color: mix('--cx-glow', 5),
            ['--rot' as string]: `${s.rot}deg`,
            ['--dur' as string]: `${s.dur}s`,
            ['--delay' as string]: `${s.delay}s`,
          }}
        >
          {s.symbol}
        </div>
      ))}
    </>
  );
}

// ── Step title info (i18n) ─────────────────────────────────────
function getStepInfo(step: number, lang: SupportedLanguage) {
  const map: Record<number, { title: string; subtitle: string }> = {
    1: { title: t(lang, 'placeYourBet'),      subtitle: t(lang, 'placeYourBetSub') },
    2: { title: t(lang, 'placeYourBet'),      subtitle: t(lang, 'placeYourBetSub') },
    3: { title: t(lang, 'chooseSpecialist'),  subtitle: t(lang, 'chooseSpecialistSub') },
    4: { title: t(lang, 'reserveTerm'),       subtitle: t(lang, 'reserveTermSub') },
    5: { title: t(lang, 'registration'),      subtitle: t(lang, 'registrationSub') },
    6: { title: t(lang, 'confirmTitle'),      subtitle: t(lang, 'confirmSub') },
  };
  return map[step] ?? map[1];
}

export default function CasinoLayout({ companySlug }: CasinoLayoutProps) {
  const { currentStep, prevStep, bookingConfirmation, selectedService, selectedServices: pickedServices, language, theme } = useBookingStore();
  const { activePromotion, serviceDiscounts, selectedAddOn } = usePromotionsStore();

  const stepInfo = getStepInfo(currentStep, language);
  const stepKey = `step-${currentStep}-${!!bookingConfirmation?.success}`;
  // Direction of the last step change, for the card deal.
  const lastStep = useRef(currentStep);
  const dirRef = useRef(1);
  if (lastStep.current !== currentStep) {
    dirRef.current = currentStep > lastStep.current ? 1 : -1;
    lastStep.current = currentStep;
  }
  const dir = dirRef.current;
  // Depth only while a step is dealt: a lasting perspective would trap
  // full-screen popups (add-ons) inside the page.
  const [dealing, setDealing] = useState(false);
  // A sent request counts as finished too: no progress or back link.
  const requestSent = useRequestStore((st) => st.sent);
  const isSuccess = !!bookingConfirmation?.success || requestSent;
  const canGoBack = currentStep > 1 && !isSuccess;

  // Request mode: the shared request screens carry their own heading and
  // show the chosen service, so the casino title and summary step aside there.
  const company = useBookingStore((s) => s.company);
  const isRequest = company?.booking_mode === 'request';
  const requestOwnsHeader = isRequest && (currentStep === 4 || currentStep === 6);
  // The review shows everything itself, the details step has its own summary.
  const showSummaryCard = !isSuccess && currentStep !== 5 && currentStep < 6 && !isRequest;
  const selectedServices = pickedServices.length > 0 ? pickedServices : selectedService ? [selectedService] : [];
  const promotion = resolvePrimaryPromotion(selectedServices, serviceDiscounts, activePromotion);
  const pricing = getBookingPricing(selectedServices, promotion, selectedAddOn);
  const requestLook = casinoLook(theme);
  const vars = useMemo(() => casinoVars(theme), [theme]);

  const renderStep = () => {
    if (bookingConfirmation?.success) {
      return <CasinoConfirmation companySlug={companySlug} />;
    }
    switch (currentStep) {
      case 1:
      case 2: return <CasinoServiceSelection />;
      case 3: return <CasinoEmployeeSelection />;
      case 4: return isRequest ? <RequestWhenStep look={requestLook} /> : <CasinoDateTimeSelection companySlug={companySlug} />;
      case 5: return <CasinoCustomerDetails />;
      case 6: return isRequest ? <RequestReview look={requestLook} companySlug={companySlug} /> : <CasinoConfirmation companySlug={companySlug} />;
      default: return null;
    }
  };

  return (
    <div className="cx-bg relative min-h-screen overflow-x-clip" style={{ ...vars, color: CREAM, backgroundColor: CX_BG }}>
      <div className="cx-felt" aria-hidden="true" />
      <div className="cx-drift" aria-hidden="true" />
      <RouletteWheel />
      <FloatingSuits />

      <div className="relative z-10">
        <Header canGoBack={canGoBack} onBack={prevStep} />
      </div>

      <main className="relative z-10 mx-auto max-w-2xl px-4 pb-16">
        <AnimatePresence initial={false}>
          {!isSuccess && (
            <motion.div key="progress" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }}>
              <ChipProgress current={currentStep} />
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence initial={false}>
          {showSummaryCard && (
            <motion.div
              key="summary"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              transition={{ duration: 0.35, ease: EASE }}
              className="mb-7"
            >
              <BookingSummaryCard />
            </motion.div>
          )}
        </AnimatePresence>

        <div style={dealing ? { perspective: 1600 } : undefined}>
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={stepKey}
            custom={dir}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            onAnimationStart={() => setDealing(true)}
            onAnimationComplete={() => setDealing(false)}
            className="relative"
            style={{ transformOrigin: dir > 0 ? '0% 30%' : '100% 30%' }}
          >
            <DealGlint dir={dir} />
            {!isSuccess && (
              <div className="mb-6">
                {!requestOwnsHeader && (
                  <>
                    <p className="mb-2 flex items-center gap-2 text-[15px] italic" style={{ fontFamily: FONT_HEAD, color: 'var(--cx-glow)' }}>
                      <span className="h-px w-6" style={{ background: 'var(--cx-glow)' }} />
                      {stepInfo.subtitle}
                    </p>
                    <h2
                      className="pb-1 font-bold leading-[1.08]"
                      style={{ fontFamily: FONT_HEAD, fontSize: 'clamp(2rem, 7vw, 2.75rem)', letterSpacing: '-0.01em', color: CREAM }}
                    >
                      {stepInfo.title}
                    </h2>

                    {selectedServices.length > 0 && currentStep > 2 && currentStep < 6 && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.15, ...SPRING }}
                        className="mt-4 inline-flex max-w-full items-center gap-2.5 rounded-full py-1.5 pl-4 pr-1.5"
                        style={{ background: mix('--cx-a', 14), boxShadow: `inset 0 0 0 1px ${mix('--cx-glow', 35)}` }}
                      >
                        <span className="truncate text-[12px] font-medium uppercase" style={{ fontFamily: FONT_LABEL, letterSpacing: '0.14em', color: 'rgba(246,243,238,0.8)' }}>
                          {selectedServices.map((s) => s.naziv).join(' + ')}
                        </span>
                        <span className="flex-shrink-0 rounded-full px-3 py-1 text-[14px] font-bold text-white" style={{ fontFamily: FONT_HEAD, background: 'var(--cx-grad)' }}>
                          {pricing.hasDiscount && (
                            <span className="mr-1.5 text-[12px] font-normal line-through opacity-70">{formatBookingPrice(pricing.originalTotal)}</span>
                          )}
                          {formatBookingPrice(pricing.finalTotal)}
                        </span>
                      </motion.div>
                    )}
                  </>
                )}
              </div>
            )}

            {renderStep()}
          </motion.div>
        </AnimatePresence>
        </div>
      </main>

      <footer className="relative z-10 px-4 py-8 text-center">
        <div className="mb-3 flex items-center justify-center gap-3" aria-hidden="true">
          <div className="cx-rule w-16 opacity-50" />
          <span style={{ color: mix('--cx-glow', 35), fontSize: '0.55rem' }}>◆</span>
          <div className="cx-rule w-16 opacity-50" />
        </div>
        <p className="text-[10px] uppercase" style={{ fontFamily: FONT_LABEL, letterSpacing: '0.3em', color: 'rgba(246,243,238,0.25)' }}>
          © {new Date().getFullYear()} · Jedro+
        </p>
      </footer>
    </div>
  );
}
