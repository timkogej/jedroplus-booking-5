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
  },
} as const;

function SeasonalSuccessContent() {
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
      className="min-h-screen flex flex-col bg-white"
      data-session-id={sessionId ?? undefined}
    >
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.42 }}
          className="w-full max-w-md text-center"
        >
          <div
            className="relative w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center"
            style={{
              background: cancelled ? '#F9FAFB' : '#1118270A',
              border: cancelled ? '1px solid #E5E7EB' : '1px solid #11182718',
            }}
          >
            <span className="text-3xl leading-none" style={{ color: cancelled ? '#9CA3AF' : '#111827' }}>
              {cancelled ? '×' : '✓'}
            </span>
          </div>

          <h1
            className="text-3xl font-bold mb-3 text-gray-900"
            style={{ fontFamily: 'var(--font-stardom, serif)' }}
          >
            {cancelled ? t.paymentCancelledTitle : t.paymentSuccessTitle}
          </h1>
          <p
            className="text-sm text-gray-500 leading-relaxed mb-7"
            style={{ fontFamily: 'var(--font-inter)' }}
          >
            {cancelled ? t.paymentCancelledDesc : t.paymentSuccessDesc}
          </p>

          {summaryRows.length > 0 && (
            <div
              className="rounded-2xl overflow-hidden mb-6 text-left"
              style={{ background: '#FAFAFA', border: '1px solid rgba(0,0,0,0.07)' }}
            >
              <div className="h-0.5 bg-gray-900" />
              <div className="px-5 py-2">
                {summaryRows.map((row) => (
                  <div key={row.label} className="seasonal-summary-row">
                    <span className="seasonal-summary-label">{row.label}</span>
                    <span className="seasonal-summary-value" style={{ maxWidth: '65%' }}>
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <a
            href={`/${slug}/seasonal`}
            className="block w-full py-4 rounded-2xl text-white font-semibold text-sm transition-colors bg-gray-900 hover:bg-gray-800"
            style={{ fontFamily: 'var(--font-inter)' }}
          >
            {cancelled ? t.backToBooking : t.newBooking}
          </a>
        </motion.div>
      </main>

      <p
        className="pb-8 text-xs text-gray-300 tracking-wide text-center"
        style={{ fontFamily: 'var(--font-inter, Inter, sans-serif)' }}
      >
        Powered by Jedro+
      </p>
    </div>
  );
}

export default function SeasonalSuccessPage() {
  return (
    <Suspense fallback={null}>
      <SeasonalSuccessContent />
    </Suspense>
  );
}
