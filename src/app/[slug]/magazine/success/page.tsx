'use client';

import { Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import type { SupportedLanguage } from '@/types';
import { t } from '../i18n';

function MagazineSuccessContent() {
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
    { label: t(language, 'service'), value: serviceName },
    { label: t(language, 'date'), value: date },
    { label: t(language, 'time'), value: time },
  ].filter((row) => row.value);

  return (
    <div
      className="min-h-screen bg-[#FAFAF9] flex flex-col"
      data-session-id={sessionId ?? undefined}
    >
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-xl"
        >
          <div className="w-8 h-[1px] mb-8 bg-[#1A1A1A]" />

          <p className="magazine-caps text-[10px] tracking-[0.3em] text-[#6B6B6B] mb-5">
            {cancelled ? t(language, 'backToBooking') : t(language, 'confirmed')}
          </p>

          <h1 className="magazine-serif text-[2.7rem] md:text-[3.7rem] text-[#1A1A1A] leading-[1.05] mb-5">
            {cancelled
              ? t(language, 'paymentCancelledTitle')
              : t(language, 'paymentSuccessTitle')}
          </h1>

          <p className="magazine-body text-[#6B6B6B] italic text-lg leading-relaxed mb-10 max-w-md">
            {cancelled
              ? t(language, 'paymentCancelledDesc')
              : t(language, 'paymentSuccessDesc')}
          </p>

          <div className="h-[1px] bg-black/10 mb-6" />

          {summaryRows.length > 0 && (
            <div className="space-y-4 mb-8">
              {summaryRows.map((row) => (
                <div key={row.label} className="flex justify-between items-baseline gap-6">
                  <p className="magazine-caps text-[8px] tracking-[0.18em] text-[#6B6B6B]">
                    {row.label}
                  </p>
                  <p className="magazine-body text-[15px] text-[#1A1A1A] text-right">
                    {row.value}
                  </p>
                </div>
              ))}
            </div>
          )}

          <div className="h-[1px] bg-black/10 mb-8" />

          <a
            href={`/${slug}/magazine`}
            className="inline-flex px-8 py-3 magazine-caps text-[10px] tracking-[0.2em] border border-[#1A1A1A]/30 text-[#1A1A1A] hover:border-[#1A1A1A] transition-colors duration-300"
          >
            {cancelled ? t(language, 'backToBooking') : t(language, 'newBooking')}
          </a>
        </motion.div>
      </main>

      <footer className="py-6 text-center">
        <p className="magazine-caps text-[9px] tracking-[0.18em] text-black/30">
          © {new Date().getFullYear()} · Jedro+
        </p>
      </footer>
    </div>
  );
}

export default function MagazineSuccessPage() {
  return (
    <Suspense fallback={null}>
      <MagazineSuccessContent />
    </Suspense>
  );
}
