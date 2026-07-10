'use client';

import { Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { DEFAULT_THEME } from '@/lib/api';
import type { SupportedLanguage } from '@/types';
import { t } from '../i18n';

const cssVars = {
  '--t-primary': '#0f172a',
  '--t-soft': 'rgba(15, 23, 42, 0.75)',
  '--t-muted': 'rgba(15, 23, 42, 0.55)',
  '--t-faint': 'rgba(15, 23, 42, 0.4)',
  '--s2': 'rgba(255, 255, 255, 0.72)',
  '--s2h': 'rgba(255, 255, 255, 0.86)',
  '--b1': 'rgba(15, 23, 42, 0.08)',
  '--b2': 'rgba(15, 23, 42, 0.12)',
} as React.CSSProperties;

function ModernSuccessContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = (params.slug as string) ?? '';

  const language: SupportedLanguage = searchParams.get('lang') === 'en' ? 'en' : 'sl';
  const status = searchParams.get('status');
  const cancelled = status === 'cancelled';
  const serviceName = searchParams.get('service');
  const date = searchParams.get('date');
  const time = searchParams.get('time');
  const sessionId = searchParams.get('session_id');
  const primaryColor = DEFAULT_THEME.primaryColor;

  const summaryRows = [
    { label: t(language, 'fieldService'), value: serviceName },
    { label: t(language, 'fieldDate'), value: date },
    { label: t(language, 'fieldTime'), value: time },
  ].filter((row) => row.value);

  return (
    <div
      className="min-h-screen relative overflow-hidden flex items-center justify-center px-6 py-12"
      data-session-id={sessionId ?? undefined}
      style={{
        background: `linear-gradient(135deg, ${DEFAULT_THEME.bgFrom}, ${DEFAULT_THEME.bgTo})`,
        fontFamily: 'var(--font-inter)',
        ...cssVars,
      }}
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="modern-orb-1 absolute w-[520px] h-[520px] blur-3xl"
          style={{ backgroundColor: primaryColor, opacity: 0.22, top: '-22%', left: '-14%' }}
        />
        <div
          className="modern-orb-2 absolute w-[420px] h-[420px] blur-3xl"
          style={{ backgroundColor: DEFAULT_THEME.secondaryColor, opacity: 0.18, bottom: '-18%', right: '-8%' }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.42 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div
            className="w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center modern-glass"
            style={{
              backgroundColor: 'var(--s2)',
              border: '1px solid var(--b2)',
              color: cancelled ? 'var(--t-faint)' : primaryColor,
            }}
          >
            <span style={{ fontSize: '2rem' }}>{cancelled ? '×' : '✓'}</span>
          </div>

          <h1
            className="mb-3"
            style={{
              color: 'var(--t-primary)',
              fontFamily: 'var(--font-clash)',
              fontWeight: 400,
              fontSize: 'clamp(2.35rem, 7vw, 4rem)',
              lineHeight: 1.05,
            }}
          >
            {cancelled
              ? t(language, 'paymentCancelledTitle')
              : t(language, 'paymentSuccessTitle')}
          </h1>
          <p className="text-sm" style={{ color: 'var(--t-muted)' }}>
            {cancelled
              ? t(language, 'paymentCancelledDesc')
              : t(language, 'paymentSuccessDesc')}
          </p>
        </div>

        {summaryRows.length > 0 && (
          <div
            className="rounded-2xl overflow-hidden mb-6 modern-glass"
            style={{
              backgroundColor: 'var(--s2)',
              border: '1px solid var(--b2)',
            }}
          >
            <div
              className="h-1"
              style={{
                background: `linear-gradient(to right, ${primaryColor}, ${DEFAULT_THEME.secondaryColor})`,
              }}
            />
            <div className="px-5 py-2">
              {summaryRows.map((row) => (
                <div key={row.label} className="modern-summary-row">
                  <span className="modern-summary-label">{row.label}</span>
                  <span className="modern-summary-value" style={{ maxWidth: '65%' }}>
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <a
          href={`/${slug}/modern`}
          className="block w-full py-4 rounded-2xl text-white font-semibold text-center transition-opacity hover:opacity-90"
          style={{
            backgroundColor: primaryColor,
            boxShadow: `0 8px 28px ${primaryColor}40`,
          }}
        >
          {cancelled ? t(language, 'backToBooking') : t(language, 'newBooking')}
        </a>

        <footer className="py-4 text-center">
          <p className="text-xs" style={{ color: 'var(--t-faint)' }}>
            © {new Date().getFullYear()} · Jedro+ · Rezervacijski Sistem
          </p>
        </footer>
      </motion.div>
    </div>
  );
}

export default function ModernSuccessPage() {
  return (
    <Suspense fallback={null}>
      <ModernSuccessContent />
    </Suspense>
  );
}
