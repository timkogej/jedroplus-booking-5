'use client';

import { Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import type { SupportedLanguage } from '@/types';
import { t } from '../i18n';

function CasinoSuccessContent() {
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

  const summaryRows = [
    { label: t(language, 'fieldService'), value: serviceName },
    { label: t(language, 'fieldDate'), value: date },
    { label: t(language, 'fieldTime'), value: time },
  ].filter((row) => row.value);

  return (
    <div
      className="min-h-screen mc-bg flex flex-col"
      data-session-id={sessionId ?? undefined}
    >
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md text-center"
        >
          <div className="flex items-center justify-center gap-2 mb-6">
            {['◆', '◆', '◆'].map((symbol, i) => (
              <span
                key={i}
                style={{
                  color: '#c9a84c',
                  fontFamily: 'Georgia, serif',
                  fontSize: i === 1 ? '1.2rem' : '0.7rem',
                }}
              >
                {symbol}
              </span>
            ))}
          </div>

          <div
            className="w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-6"
            style={{
              background: 'rgba(13, 59, 30, 0.8)',
              border: '2px solid rgba(201, 168, 76, 0.6)',
              boxShadow: '0 0 24px rgba(201, 168, 76, 0.2)',
            }}
          >
            <span style={{ color: '#c9a84c', fontSize: '1.6rem' }}>
              {cancelled ? '×' : '✓'}
            </span>
          </div>

          <h1
            className="font-bold italic mb-3"
            style={{
              fontFamily: 'var(--font-playfair)',
              fontSize: '2rem',
              color: '#f5edd6',
              letterSpacing: '0.02em',
            }}
          >
            {cancelled
              ? t(language, 'paymentCancelledTitle')
              : t(language, 'paymentSuccessTitle')}
          </h1>
          <p
            className="italic mb-7"
            style={{
              fontFamily: 'var(--font-cormorant)',
              fontSize: '1.05rem',
              color: 'rgba(232,217,184,0.72)',
              lineHeight: 1.6,
            }}
          >
            {cancelled
              ? t(language, 'paymentCancelledDesc')
              : t(language, 'paymentSuccessDesc')}
          </p>

          {summaryRows.length > 0 && (
            <div
              className="rounded-lg overflow-hidden mb-7 text-left"
              style={{
                background: 'rgba(8, 30, 15, 0.85)',
                border: '1px solid rgba(201, 168, 76, 0.45)',
                boxShadow: '0 0 30px rgba(201, 168, 76, 0.08)',
              }}
            >
              <div className="h-px" style={{ background: 'linear-gradient(to right, transparent, #c9a84c, #e8c96d, #c9a84c, transparent)' }} />
              <div className="px-5 py-4">
                {summaryRows.map((row) => (
                  <div key={row.label} className="mc-summary-row">
                    <span className="mc-summary-label">{row.label}</span>
                    <span
                      className="text-right"
                      style={{
                        fontFamily: 'var(--font-cormorant)',
                        fontSize: '0.95rem',
                        color: '#f5edd6',
                        maxWidth: '60%',
                      }}
                    >
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>
              <div className="h-px" style={{ background: 'linear-gradient(to right, transparent, #c9a84c, #e8c96d, #c9a84c, transparent)' }} />
            </div>
          )}

          <a href={`/${slug}/casino`} className="mc-btn-gold w-full max-w-sm">
            {cancelled ? t(language, 'backToBooking') : t(language, 'newBooking')}
          </a>
        </motion.div>
      </main>

      <footer className="py-6 text-center">
        <p
          className="text-xs"
          style={{ fontFamily: 'var(--font-cormorant)', color: 'rgba(201,168,76,0.35)' }}
        >
          © {new Date().getFullYear()} · Jedro+ · Rezervacijski Sistem
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
