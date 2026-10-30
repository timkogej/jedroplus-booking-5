'use client';

import { Suspense, useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { DEFAULT_THEME, fetchInitData } from '@/lib/api';
import { withReadableColors } from '@/lib/color';
import type { SupportedLanguage, Theme } from '@/types';
import { t } from '../i18n';
import { CREAM, CX_BG, EASE, FAINT, FONT_BODY, FONT_HEAD, MUTED, casinoVars, mix } from '../components/ui';

// Back from Stripe: the store is empty here, so the company colours are
// loaded again (with the default colours until they arrive).
function CasinoSuccessContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = (params.slug as string) ?? '';
  const [theme, setTheme] = useState<Theme>(DEFAULT_THEME);

  useEffect(() => {
    if (!slug) return;
    fetchInitData(slug)
      .then((data) => data.theme && setTheme(withReadableColors({ ...DEFAULT_THEME, ...data.theme })))
      .catch(() => {});
  }, [slug]);

  const language: SupportedLanguage = searchParams.get('lang') === 'en' ? 'en' : 'sl';
  const cancelled = searchParams.get('status') === 'cancelled';
  const serviceName = searchParams.get('service');
  const date = searchParams.get('date');
  const time = searchParams.get('time');
  const sessionId = searchParams.get('session_id');

  const summaryRows = [
    { label: t(language, 'fieldService'), value: serviceName },
    { label: t(language, 'fieldDate'), value: date },
    { label: t(language, 'fieldTime'), value: time },
  ].filter((row) => row.value);

  return (
    <div
      className="cx-bg flex min-h-screen flex-col"
      style={{ ...casinoVars(theme), backgroundColor: CX_BG, color: CREAM }}
      data-session-id={sessionId ?? undefined}
    >
      <div className="cx-felt" aria-hidden="true" />
      <main className="relative z-10 flex flex-1 items-center justify-center px-5 py-12">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE }}
          className="w-full max-w-md text-center"
        >
          <motion.div
            initial={{ scale: 0.4, opacity: 0, rotate: -90 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 220, damping: 16, delay: 0.15 }}
            className="relative mx-auto mb-7 flex h-20 w-20 items-center justify-center rounded-full"
            style={{ background: cancelled ? 'rgba(255,255,255,0.08)' : 'var(--cx-grad)', boxShadow: cancelled ? 'none' : '0 16px 40px -14px var(--cx-a)' }}
          >
            <span className="absolute inset-[6px] rounded-full" style={{ border: '3px dashed rgba(255,255,255,0.5)' }} />
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              {cancelled ? <path d="M7 7l10 10M17 7L7 17" /> : <path d="M5 12.5l4.5 4.5L19 7.5" />}
            </svg>
          </motion.div>

          <h1 className="mb-3 text-[34px] font-black leading-tight" style={{ fontFamily: FONT_HEAD, color: CREAM }}>
            {cancelled ? t(language, 'paymentCancelledTitle') : t(language, 'paymentSuccessTitle')}
          </h1>
          <p className="mb-8 text-[16px] leading-6" style={{ fontFamily: FONT_BODY, color: MUTED }}>
            {cancelled ? t(language, 'paymentCancelledDesc') : t(language, 'paymentSuccessDesc')}
          </p>

          {summaryRows.length > 0 && (
            <div className="mb-8 overflow-hidden rounded-[20px] text-left" style={{ background: 'rgba(255,255,255,0.04)', boxShadow: `inset 0 0 0 1px ${mix('--cx-glow', 30)}` }}>
              <div className="h-1" style={{ background: 'var(--cx-grad)' }} />
              <div className="px-5 py-2">
                {summaryRows.map((row, i) => (
                  <div key={row.label} className="flex items-center justify-between gap-4 py-3" style={{ borderTop: i ? '1px solid rgba(255,255,255,0.07)' : undefined }}>
                    <span className="cx-label">{row.label}</span>
                    <span className="text-right text-[15px] font-semibold" style={{ fontFamily: FONT_BODY, color: CREAM }}>
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <a href={`/${slug}/casino`} className="cx-btn w-full max-w-sm">
            {cancelled ? t(language, 'backToBooking') : t(language, 'newBooking')}
          </a>
        </motion.div>
      </main>

      <footer className="relative z-10 py-6 text-center">
        <p className="text-[10px] uppercase" style={{ fontFamily: 'var(--font-oswald)', letterSpacing: '0.3em', color: FAINT }}>
          © {new Date().getFullYear()} · Jedro+
        </p>
      </footer>
    </div>
  );
}

export default function CasinoSuccessPage() {
  return (
    <Suspense fallback={null}>
      <CasinoSuccessContent />
    </Suspense>
  );
}
