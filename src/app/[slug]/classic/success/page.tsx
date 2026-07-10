'use client';

/**
 * Classic variant — Stripe Checkout return page.
 *
 * Stripe redirects here after payment (success_url built by buildSuccessUrl in
 * src/lib/checkout.ts). Query params:
 *   session_id  — Stripe Checkout session id (cs_...)
 *   status      — 'cancelled' when reached via a cancel flow (optional)
 *   lang        — 'sl' | 'en' (which language to render)
 *   service     — service name(s) (optional, for the summary)
 *   date, time  — booking date / time (optional, for the summary)
 *
 * The booking itself is confirmed server-side by the POS via the Stripe webhook;
 * this page is purely a customer-facing confirmation.
 */

import { Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { DEFAULT_THEME } from '@/lib/api';
import type { SupportedLanguage } from '@/types';
import { t } from '../i18n';

function SuccessContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = (params.slug as string) ?? '';

  const langParam = searchParams.get('lang');
  const language: SupportedLanguage = langParam === 'en' ? 'en' : 'sl';
  const cancelled = searchParams.get('status') === 'cancelled';

  const serviceName = searchParams.get('service');
  const date = searchParams.get('date');
  const time = searchParams.get('time');

  const primaryColor = DEFAULT_THEME.primaryColor;

  const summaryRows = [
    { label: t(language, 'fieldService'), value: serviceName },
    { label: t(language, 'fieldDate'), value: date },
    { label: t(language, 'fieldTime'), value: time },
  ].filter((r) => r.value);

  return (
    <div
      className="min-h-screen flex items-center justify-center px-6 py-12"
      style={{
        background: `linear-gradient(135deg, ${DEFAULT_THEME.bgFrom}, ${DEFAULT_THEME.bgTo})`,
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="w-full max-w-md"
      >
        {/* Icon */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 200, damping: 16 }}
          className="mb-6 flex justify-center"
        >
          <div
            className="rounded-full flex items-center justify-center"
            style={{
              width: 80,
              height: 80,
              background: cancelled ? '#F3F4F608' : `${primaryColor}12`,
              border: cancelled
                ? '2px solid rgba(0,0,0,0.08)'
                : `2px solid ${primaryColor}30`,
              boxShadow: cancelled ? 'none' : `0 0 0 8px ${primaryColor}07`,
            }}
          >
            {cancelled ? (
              <svg
                width="32"
                height="32"
                viewBox="0 0 32 32"
                fill="none"
                stroke="#9CA3AF"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M10 10l12 12M22 10L10 22" />
              </svg>
            ) : (
              <motion.svg
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.35, type: 'spring', stiffness: 280 }}
                width="32"
                height="32"
                viewBox="0 0 32 32"
                fill="none"
                stroke={primaryColor}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 16l8 8 14-14" />
              </motion.svg>
            )}
          </div>
        </motion.div>

        {/* Title + subtitle */}
        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="text-3xl font-bold text-center mb-2"
          style={{ fontFamily: 'var(--font-nunito)', color: '#1F2937' }}
        >
          {cancelled
            ? t(language, 'paymentCancelledTitle')
            : t(language, 'paymentSuccessTitle')}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="text-center text-sm text-gray-500 mb-8"
          style={{ fontFamily: 'var(--font-nunito-sans)' }}
        >
          {cancelled
            ? t(language, 'paymentCancelledDesc')
            : t(language, 'paymentSuccessDesc')}
        </motion.p>

        {/* Booking summary (success only, when details available) */}
        {!cancelled && summaryRows.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.35 }}
            className="rounded-2xl overflow-hidden mb-7"
            style={{
              background: 'rgba(255,255,255,0.97)',
              boxShadow: `0 8px 28px rgba(0,0,0,0.09), 0 0 0 1px ${primaryColor}12`,
            }}
          >
            <div
              className="h-1"
              style={{
                background: `linear-gradient(90deg, ${primaryColor}, ${primaryColor}60)`,
              }}
            />
            <div className="px-5 py-3">
              {summaryRows.map((row, i) => (
                <div
                  key={i}
                  className="flex items-start justify-between py-2.5"
                  style={{
                    borderBottom:
                      i < summaryRows.length - 1 ? '1px solid #F3F4F6' : 'none',
                  }}
                >
                  <span
                    className="text-xs text-gray-400 uppercase tracking-wide font-medium flex-shrink-0"
                    style={{ fontFamily: 'var(--font-nunito-sans)' }}
                  >
                    {row.label}
                  </span>
                  <span
                    className="text-sm font-semibold text-gray-800 text-right ml-4"
                    style={{ fontFamily: 'var(--font-nunito-sans)', maxWidth: '62%' }}
                  >
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Back to booking */}
        <motion.a
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          href={`/${slug}/classic`}
          className="block w-full py-3.5 rounded-2xl font-bold text-center transition-opacity hover:opacity-90"
          style={{
            fontFamily: 'var(--font-nunito)',
            color: cancelled ? '#ffffff' : primaryColor,
            background: cancelled ? primaryColor : `${primaryColor}10`,
            border: cancelled ? 'none' : `2px solid ${primaryColor}30`,
            boxShadow: cancelled ? `0 6px 22px ${primaryColor}38` : 'none',
          }}
        >
          {cancelled ? t(language, 'backToBooking') : t(language, 'newBooking')}
        </motion.a>

        {/* Powered by */}
        <p
          className="text-center mt-6 text-xs text-gray-400"
          style={{ fontFamily: 'var(--font-nunito-sans)' }}
        >
          {t(language, 'poweredBy')} Jedro+
        </p>
      </motion.div>
    </div>
  );
}

export default function ClassicSuccessPage() {
  return (
    <Suspense fallback={null}>
      <SuccessContent />
    </Suspense>
  );
}
