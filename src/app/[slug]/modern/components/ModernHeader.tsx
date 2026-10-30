'use client';

import { AnimatePresence, motion } from 'framer-motion';
import CompanyLogo from '@/components/shared/CompanyLogo';
import { useBookingStore } from '@/store/bookingStore';
import type { SupportedLanguage } from '@/types';
import { t, type TranslationKey } from '../i18n';
import { EASE, SPRING } from './brand';

// Visual steps and the store step each one starts at.
const ALL_STEPS: Array<{ key: TranslationKey; storeStep: number }> = [
  { key: 'stepService', storeStep: 1 }, // store steps 1, 2
  { key: 'stepPerson', storeStep: 3 },
  { key: 'stepAppointment', storeStep: 4 }, // "Želja" in request mode
  { key: 'stepDetails', storeStep: 5 },
  { key: 'stepConfirm', storeStep: 6 }, // store steps 6, 7
];

/** Index of the last shown step that the store step has reached. */
function storeToVisualIdx(steps: typeof ALL_STEPS, storeStep: number): number {
  let idx = 0;
  steps.forEach((s, i) => {
    if (s.storeStep <= storeStep) idx = i;
  });
  return idx;
}

function LanguageToggle({
  language,
  onToggle,
}: {
  language: SupportedLanguage;
  onToggle: (l: SupportedLanguage) => void;
}) {
  return (
    <div
      className="relative flex flex-shrink-0 rounded-full p-[3px]"
      style={{ background: 'rgba(255,255,255,0.07)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.08)' }}
    >
      {(['sl', 'en'] as SupportedLanguage[]).map((lang) => {
        const isActive = language === lang;
        return (
          <button
            key={lang}
            onClick={() => onToggle(lang)}
            aria-pressed={isActive}
            className="relative z-10 h-7 w-10 text-[12px] font-bold uppercase"
            style={{
              fontFamily: 'var(--font-inter)',
              color: isActive ? '#FFFFFF' : 'var(--t-faint)',
              letterSpacing: '0.06em',
              transition: 'color 0.2s',
            }}
          >
            {isActive && (
              <motion.span
                layoutId="modern-lang"
                className="absolute inset-0 -z-10 rounded-full"
                style={{ background: 'var(--brand-grad)', boxShadow: '0 4px 14px -4px var(--brand-a)' }}
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

interface Props {
  currentStep: number;
  isSuccess: boolean;
  canGoBack: boolean;
  onBack: () => void;
}

export default function ModernHeader({ currentStep, isSuccess, canGoBack, onBack }: Props) {
  const { company, language, setLanguage, prikazZaposlenih } = useBookingStore();
  // The specialist step is skipped when the company hides employees online.
  const STEPS = ALL_STEPS.filter((s) => prikazZaposlenih || s.storeStep !== 3);
  const visualIdx = isSuccess ? STEPS.length - 1 : storeToVisualIdx(STEPS, currentStep);
  const activeLabel = STEPS[visualIdx] ? t(language, STEPS[visualIdx].key) : '';

  return (
    <header
      className="sticky top-0 z-30 flex-shrink-0"
      style={{
        background: 'linear-gradient(180deg, rgba(7,7,11,0.82), rgba(7,7,11,0.55))',
        backdropFilter: 'saturate(160%) blur(22px)',
        WebkitBackdropFilter: 'saturate(160%) blur(22px)',
        boxShadow: '0 1px 0 rgba(255,255,255,0.06)',
      }}
    >
      <div className="mx-auto max-w-2xl px-4 sm:px-6">
        {/* ── Back · company · language ── */}
        <div className="flex h-16 items-center gap-3">
          <div className="flex w-[92px] flex-shrink-0 items-center">
            <AnimatePresence initial={false}>
              {canGoBack && (
                <motion.button
                  key="back"
                  onClick={onBack}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.25, ease: EASE }}
                  whileTap={{ scale: 0.92 }}
                  aria-label={t(language, 'back')}
                  className="flex h-9 items-center gap-1.5 rounded-full pl-2.5 pr-3.5 text-[14px] font-semibold"
                  style={{
                    fontFamily: 'var(--font-inter)',
                    color: 'var(--t-soft)',
                    background: 'rgba(255,255,255,0.07)',
                    boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.08)',
                  }}
                >
                  <svg width="8" height="13" viewBox="0 0 8 14" fill="none" aria-hidden="true">
                    <path d="M7 1L1 7l6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {t(language, 'back')}
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          <motion.h1
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: EASE }}
            className="min-w-0 flex-1 truncate text-center text-[17px] font-bold"
            style={{ fontFamily: 'var(--font-clash)', color: 'var(--t-primary)', letterSpacing: '-0.02em' }}
          >
            <CompanyLogo name={company?.naziv ?? 'Rezervacije'} logoUrl={company?.logo_url} variant="dark" />
          </motion.h1>

          <div className="flex w-[92px] flex-shrink-0 justify-end">
            <LanguageToggle language={language} onToggle={setLanguage} />
          </div>
        </div>

        {/* ── Progress: glowing gradient segments ── */}
        <AnimatePresence initial={false}>
          {!isSuccess && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: EASE }}
              className="overflow-hidden"
            >
              <div className="pb-3.5">
                <div className="flex gap-1.5">
                  {STEPS.map((step, i) => {
                    const fill = i < visualIdx ? 1 : i === visualIdx ? 0.55 : 0;
                    return (
                      <div key={step.key} className="relative h-[3px] flex-1 overflow-hidden rounded-full" style={{ background: 'rgba(255,255,255,0.09)' }}>
                        <motion.div
                          className="absolute inset-y-0 left-0 rounded-full"
                          style={{ background: 'var(--brand-grad)', boxShadow: '0 0 10px var(--brand-glow)' }}
                          initial={false}
                          animate={{ width: `${fill * 100}%` }}
                          transition={{ duration: 0.6, ease: EASE }}
                        />
                      </div>
                    );
                  })}
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.p
                      key={activeLabel}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.2 }}
                      className="text-[12px] font-semibold"
                      style={{ fontFamily: 'var(--font-inter)', color: 'var(--t-soft)' }}
                    >
                      {activeLabel}
                    </motion.p>
                  </AnimatePresence>
                  <p className="text-[12px] font-medium tabular-nums" style={{ fontFamily: 'var(--font-inter)', color: 'var(--t-faint)' }}>
                    {t(language, 'stepOf').replace('{n}', String(visualIdx + 1)).replace('{m}', String(STEPS.length))}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
