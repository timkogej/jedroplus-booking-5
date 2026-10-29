'use client';

import { motion } from 'framer-motion';
import { useBookingStore } from '@/store/bookingStore';
import {
  REQUEST_TEXT,
  formatRange,
  requestServiceLabel,
  useRequestStore,
} from '@/lib/booking/request';
import { startNewBooking } from '@/lib/booking/newBooking';
import type { RequestLook } from './look';

/** After a request was sent: what happens next, and a summary. */
export default function RequestSent({ look }: { look: RequestLook }) {
  const { language, company, customerDetails } = useBookingStore();
  const lang = language === 'en' ? 'en' : 'sl';
  const T = REQUEST_TEXT[lang];
  const req = useRequestStore();
  const phone = company?.telefon?.trim();

  const summary = [
    { label: T.rowService, value: requestServiceLabel(lang) },
    { label: T.rowWhen, value: `${formatRange(req.dateFrom, req.dateTo, lang)} · ${T.partsOfDay[req.partOfDay]}` },
  ];

  return (
    <div className="mx-auto max-w-md text-center">
      {/* Animated envelope check */}
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 220, damping: 16, delay: 0.1 }}
        className="relative mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full"
        style={{ background: look.accent, boxShadow: `0 16px 40px ${look.accent}55` }}
      >
        <motion.span
          aria-hidden="true"
          className="absolute inset-0 rounded-full"
          style={{ border: `2px solid ${look.accent}` }}
          initial={{ scale: 1, opacity: 0.6 }}
          animate={{ scale: 1.6, opacity: 0 }}
          transition={{ duration: 1.6, repeat: Infinity, repeatDelay: 0.6 }}
        />
        <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke={look.onAccent} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <motion.path
            d="M5 12.5l4.5 4.5L19 7.5"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay: 0.35, duration: 0.45, ease: 'easeOut' }}
          />
        </svg>
      </motion.div>

      <motion.h2
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="mb-2 text-[28px] font-bold leading-tight"
        style={{ color: look.text, fontFamily: look.fontHeading }}
      >
        {T.sentTitle}
      </motion.h2>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mb-8 text-[15px] leading-6"
        style={{ color: look.muted, fontFamily: look.fontBody }}
      >
        {T.sentText(company?.naziv?.trim() || '', customerDetails?.email || '')}
      </motion.p>

      {/* What happens next */}
      <motion.ol
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mb-6 space-y-0 p-5 text-left"
        style={{ background: look.surface, borderRadius: look.radius, border: `1px solid ${look.border}` }}
      >
        {T.timeline.map((step, i) => {
          const done = i === 0;
          return (
            <li key={step} className="relative flex items-start gap-3.5 pb-5 last:pb-0">
              {i < T.timeline.length - 1 && (
                <span
                  aria-hidden="true"
                  className="absolute left-[13px] top-7 h-[calc(100%-20px)] w-0.5"
                  style={{ background: done ? look.accent : look.border }}
                />
              )}
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.6 + i * 0.15, type: 'spring', stiffness: 300 }}
                className="relative z-10 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[12px] font-bold"
                style={{
                  background: done ? look.accent : look.surface,
                  color: done ? look.onAccent : look.surfaceMuted,
                  border: `2px solid ${done ? look.accent : look.border}`,
                  fontFamily: look.fontBody,
                }}
              >
                {done ? '✓' : i + 1}
              </motion.span>
              <span
                className="pt-0.5 text-[15px]"
                style={{ color: done ? look.surfaceText : look.surfaceMuted, fontWeight: done ? 600 : 500, fontFamily: look.fontBody }}
              >
                {step}
              </span>
            </li>
          );
        })}
      </motion.ol>

      {/* Summary */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.65 }}
        className="mb-8 overflow-hidden text-left"
        style={{ background: look.surface, borderRadius: look.radius, border: `1px solid ${look.border}` }}
      >
        <p
          className="px-5 pt-4 text-[12px] font-semibold uppercase tracking-wide"
          style={{ color: look.surfaceMuted, fontFamily: look.fontBody }}
        >
          {T.yourRequest}
        </p>
        <dl className="px-5 pb-2">
          {summary.map((row) => (
            <div key={row.label} className="flex justify-between gap-4 py-2.5" style={{ borderBottom: `1px solid ${look.border}` }}>
              <dt className="text-[14px]" style={{ color: look.surfaceMuted, fontFamily: look.fontBody }}>{row.label}</dt>
              <dd className="first-cap text-right text-[14px] font-semibold" style={{ color: look.surfaceText, fontFamily: look.fontBody }}>
                {row.value}
              </dd>
            </div>
          ))}
          <p className="whitespace-pre-wrap break-words py-3 text-[14px] leading-6" style={{ color: look.surfaceText, fontFamily: look.fontBody }}>
            “{req.description.trim()}”
          </p>
        </dl>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="space-y-3">
        {phone && (
          <a
            href={`tel:${phone.replace(/\s+/g, '')}`}
            className="flex w-full items-center justify-center gap-2 py-3.5 text-[15px] font-semibold"
            style={{
              color: look.accentText,
              background: look.surface,
              border: `1.5px solid ${look.accent}55`,
              borderRadius: Math.min(look.radius, 16),
              fontFamily: look.fontHeading,
            }}
          >
            {T.callSalon} · {phone}
          </a>
        )}
        <button
          type="button"
          onClick={startNewBooking}
          className="w-full py-4 text-[16px] font-semibold"
          style={{
            background: look.accent,
            color: look.onAccent,
            borderRadius: Math.min(look.radius, 16),
            fontFamily: look.fontHeading,
            boxShadow: `0 10px 28px ${look.accent}40`,
          }}
        >
          {T.newRequest}
        </button>
      </motion.div>
    </div>
  );
}
