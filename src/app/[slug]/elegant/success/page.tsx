'use client';

import { Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import type { SupportedLanguage } from '@/types';

const copy = {
  sl: {
    paymentSuccessTitle: 'Plačilo uspešno!',
    paymentSuccessDesc: 'Vaša rezervacija je potrjena.',
    paymentCancelledTitle: 'Plačilo preklicano',
    paymentCancelledDesc: 'Plačilo ni bilo dokončano. Rezervacija še ni potrjena.',
    backToBooking: 'Nazaj na rezervacijo',
    newBooking: 'Nova rezervacija',
    fieldService: 'Storitev',
    fieldDate: 'Datum',
    fieldTime: 'Ura',
    poweredBy: 'Powered by',
  },
  en: {
    paymentSuccessTitle: 'Payment successful!',
    paymentSuccessDesc: 'Your booking is confirmed.',
    paymentCancelledTitle: 'Payment cancelled',
    paymentCancelledDesc: 'The payment was not completed. Your booking is not yet confirmed.',
    backToBooking: 'Back to booking',
    newBooking: 'New booking',
    fieldService: 'Service',
    fieldDate: 'Date',
    fieldTime: 'Time',
    poweredBy: 'Powered by',
  },
} as const;

function ElegantSuccessContent() {
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
  const t = copy[language];

  const summaryRows = [
    { label: t.fieldService, value: serviceName },
    { label: t.fieldDate, value: date },
    { label: t.fieldTime, value: time },
  ].filter((row) => row.value);

  return (
    <div
      className="min-h-screen flex items-center justify-center px-6 py-12"
      data-session-id={sessionId ?? undefined}
      style={{ background: '#FAFAFA' }}
    >
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' as const }}
        className="w-full max-w-md text-center"
      >
        <div
          className="w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center"
          style={{
            backgroundColor: cancelled ? '#F9FAFB' : '#1111110D',
            border: cancelled ? '1px solid #E5E7EB' : '1px solid #11111122',
          }}
        >
          <span style={{ color: cancelled ? '#9CA3AF' : '#111111', fontSize: '1.5rem' }}>
            {cancelled ? '×' : '✓'}
          </span>
        </div>

        <h1
          className="mb-3"
          style={{
            fontFamily: 'var(--font-playfair)',
            fontSize: '2.25rem',
            fontWeight: 400,
            color: '#111111',
            lineHeight: 1.15,
          }}
        >
          {cancelled ? t.paymentCancelledTitle : t.paymentSuccessTitle}
        </h1>

        <p
          className="mb-8"
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '0.92rem',
            color: '#6B7280',
            lineHeight: 1.6,
          }}
        >
          {cancelled ? t.paymentCancelledDesc : t.paymentSuccessDesc}
        </p>

        {summaryRows.length > 0 && (
          <div
            className="rounded-xl border overflow-hidden mb-7 text-left"
            style={{
              borderColor: '#E5E7EB',
              backgroundColor: 'white',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}
          >
            <div className="h-0.5 bg-[#111111]" />
            <div className="px-5 py-1">
              {summaryRows.map((row) => (
                <div key={row.label} className="elegant-summary-row">
                  <span className="elegant-summary-label">{row.label}</span>
                  <span className="elegant-summary-value" style={{ maxWidth: '65%' }}>
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <a
          href={`/${slug}/elegant`}
          className="block w-full py-4 rounded-xl text-white font-medium transition-opacity hover:opacity-90"
          style={{
            backgroundColor: '#111111',
            fontFamily: 'var(--font-inter)',
            fontSize: '0.95rem',
          }}
        >
          {cancelled ? t.backToBooking : t.newBooking}
        </a>

        <p
          className="mt-8 text-xs"
          style={{ fontFamily: 'var(--font-inter)', color: '#D1D5DB' }}
        >
          {t.poweredBy} <span style={{ color: '#11111199' }}>Jedro+</span>
        </p>
      </motion.div>
    </div>
  );
}

export default function ElegantSuccessPage() {
  return (
    <Suspense fallback={null}>
      <ElegantSuccessContent />
    </Suspense>
  );
}
