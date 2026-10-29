'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useBookingStore } from '@/store/bookingStore';
import {
  REQUEST_TEXT,
  formatRange,
  requestEmployeeLabel,
  requestErrorMessage,
  requestServiceLabel,
  submitRequest,
  useRequestStore,
} from '@/lib/booking/request';
import RequestSent from './RequestSent';
import type { RequestLook } from './look';

/** Request mode, in place of the booking review: check and send. */
export default function RequestReview({ look, companySlug }: { look: RequestLook; companySlug?: string }) {
  const { language, customerDetails, company, goToStep } = useBookingStore();
  // The company setting: in request mode the employee step itself is hidden.
  const prikazZaposlenih = company?.prikaz_zaposlenih_rezervacija !== false;
  const lang = language === 'en' ? 'en' : 'sl';
  const T = REQUEST_TEXT[lang];
  const req = useRequestStore();
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (req.sent) return <RequestSent look={look} />;

  const send = async () => {
    if (!companySlug) return;
    setSending(true);
    setError(null);
    try {
      await submitRequest(companySlug);
      if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Request submit failed:', err);
      setError(requestErrorMessage(err, lang));
    } finally {
      setSending(false);
    }
  };

  const rows: Array<{ label: string; value?: string; edit?: () => void; long?: boolean }> = [
    { label: T.rowService, value: requestServiceLabel(lang), edit: () => goToStep(1) },
    { label: T.rowWhen, value: formatRange(req.dateFrom, req.dateTo, lang), edit: () => goToStep(4) },
    { label: T.rowPartOfDay, value: T.partsOfDay[req.partOfDay], edit: () => goToStep(4) },
    ...(prikazZaposlenih ? [{ label: T.rowEmployee, value: requestEmployeeLabel(lang), edit: () => goToStep(4) }] : []),
    { label: T.rowDescription, value: req.description.trim(), edit: () => goToStep(4), long: true },
    { label: T.rowName, value: customerDetails ? `${customerDetails.firstName} ${customerDetails.lastName}` : undefined, edit: () => goToStep(5) },
    { label: T.rowEmail, value: customerDetails?.email, edit: () => goToStep(5) },
    { label: T.rowPhone, value: customerDetails?.phone, edit: () => goToStep(5) },
  ];
  const visible = rows.filter((r) => r.value);

  return (
    <div>
      <div className="mb-6">
        <h2 className="mb-1.5 text-[28px] font-bold leading-tight" style={{ color: look.text, fontFamily: look.fontHeading }}>
          {T.reviewTitle}
        </h2>
        <p className="text-[15px] leading-6" style={{ color: look.muted, fontFamily: look.fontBody }}>
          {T.reviewSubtitle}
        </p>
      </div>

      <div
        className="mb-5 overflow-hidden"
        style={{ background: look.surface, borderRadius: look.radius, border: `1px solid ${look.border}` }}
      >
        <div className="h-1" style={{ background: `linear-gradient(90deg, ${look.accent}, ${look.accent}55)` }} />
        <dl className="px-5 py-2">
          {visible.map((row, i) => (
            <div
              key={row.label}
              className={`py-3 ${row.long ? '' : 'flex items-start justify-between gap-4'}`}
              style={{ borderBottom: i < visible.length - 1 ? `1px solid ${look.border}` : 'none' }}
            >
              <dt className="flex items-center justify-between gap-3 text-[12px] font-medium uppercase tracking-wide" style={{ color: look.surfaceMuted, fontFamily: look.fontBody }}>
                {row.label}
                {row.long && row.edit && (
                  <button type="button" onClick={row.edit} className="normal-case tracking-normal text-[12px] font-semibold" style={{ color: look.accentText }}>
                    {T.change}
                  </button>
                )}
              </dt>
              <dd
                className={`${row.long ? 'mt-1.5 whitespace-pre-wrap text-[15px] leading-6' : `${row.label === T.rowEmail ? '' : 'first-cap '}text-right text-[15px] font-semibold`} break-words`}
                style={{ color: look.surfaceText, fontFamily: look.fontBody, maxWidth: row.long ? undefined : '65%' }}
              >
                {row.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <div
        className="mb-5 flex gap-3 px-4 py-3.5 text-[14px] leading-6"
        style={{ background: `${look.accent}12`, borderRadius: look.radius, color: look.text, fontFamily: look.fontBody }}
      >
        <span aria-hidden="true" style={{ color: look.accentText }}>ⓘ</span>
        <span>{T.notYetBooked}</span>
      </div>

      <AnimatePresence>
        {error && (
          <motion.p
            role="alert"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-5 rounded-2xl border px-4 py-3.5 text-[14px]"
            style={{ background: '#FEF2F2', borderColor: '#FECACA', color: '#B91C1C', fontFamily: look.fontBody }}
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      <motion.button
        type="button"
        onClick={send}
        disabled={sending || !companySlug}
        whileHover={!sending ? { scale: 1.01 } : {}}
        whileTap={!sending ? { scale: 0.98 } : {}}
        className="flex w-full items-center justify-center gap-2.5 py-4 text-[16px] font-semibold"
        style={{
          background: look.accent,
          color: look.onAccent,
          borderRadius: Math.min(look.radius, 16),
          fontFamily: look.fontHeading,
          boxShadow: sending ? 'none' : `0 10px 28px ${look.accent}40`,
          opacity: sending ? 0.75 : 1,
          cursor: sending ? 'wait' : 'pointer',
        }}
      >
        {sending ? (
          <>
            <motion.span
              className="block h-4 w-4 rounded-full border-2"
              style={{ borderColor: `${look.onAccent}55`, borderTopColor: look.onAccent }}
              animate={{ rotate: 360 }}
              transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }}
            />
            {T.sending}
          </>
        ) : (
          <>
            {T.send} <span aria-hidden="true">→</span>
          </>
        )}
      </motion.button>
    </div>
  );
}
