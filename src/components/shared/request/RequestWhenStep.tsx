'use client';

import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useBookingStore } from '@/store/bookingStore';
import { getSelectedServices } from '@/lib/booking/submit';
import { stickyCtaStyle } from '@/lib/booking/stickyCta';
import {
  MAX_DESCRIPTION,
  MIN_DESCRIPTION,
  REQUEST_TEXT,
  descriptionPlaceholder,
  formatRange,
  useRequestStore,
  type PartOfDay,
  type RequestPreset,
} from '@/lib/booking/request';
import RangeCalendar from './RangeCalendar';
import type { RequestLook } from './look';

/**
 * Request mode, in place of the calendar with free times: when suits the
 * client, part of day, optionally with whom, and what they want.
 */
export default function RequestWhenStep({ look }: { look: RequestLook }) {
  const { language, employeesUI, eligibleEmployeeIds, maxDniRezervacija, company, goToStep, nextStep } =
    useBookingStore();
  const prikazZaposlenih = company?.prikaz_zaposlenih_rezervacija !== false;
  const lang = language === 'en' ? 'en' : 'sl';
  const T = REQUEST_TEXT[lang];
  const req = useRequestStore();
  const [tried, setTried] = useState(false);

  const services = getSelectedServices();
  const serviceText = services.length > 0 ? services.map((s) => s.naziv).join(' + ') : T.unsureShort;

  // Only people who do all chosen services; everyone when no service is chosen.
  const people = useMemo(() => {
    if (!prikazZaposlenih) return [];
    const list = services.length > 0 && eligibleEmployeeIds.length > 0
      ? employeesUI.filter((e) => eligibleEmployeeIds.includes(e.id))
      : employeesUI;
    return list.length > 1 ? list : [];
  }, [services.length, eligibleEmployeeIds, employeesUI]);

  const whenOk = !!req.dateFrom && !!req.dateTo;
  const descOk = req.description.trim().length >= MIN_DESCRIPTION;

  const label = (text: string) => (
    <p
      className={`mb-2.5 ${look.capsLabels ? 'text-[11px] uppercase tracking-[0.16em]' : 'text-[13px]'} font-semibold`}
      style={{ color: look.text, fontFamily: look.fontBody }}
    >
      {text}
    </p>
  );

  const chip = (active: boolean) => ({
    fontFamily: look.fontBody,
    background: active ? look.accent : look.surface,
    color: active ? look.onAccent : look.surfaceText,
    border: `1px solid ${active ? look.accent : look.border}`,
    boxShadow: active ? `0 6px 18px ${look.accent}33` : 'none',
  });

  const addQuick = (text: string) => {
    const current = req.description.trim();
    if (current.toLowerCase().includes(text.toLowerCase())) return;
    req.setDescription(current ? `${current}${/[.!?]$/.test(current) ? '' : '.'} ${text}.` : `${text}.`);
  };

  const proceed = () => {
    setTried(true);
    if (!whenOk || !descOk) return;
    nextStep();
  };

  const presets: RequestPreset[] = ['asap', 'thisWeek', 'nextWeek', 'custom'];
  const parts: PartOfDay[] = ['vseeno', 'dopoldan', 'popoldan'];

  return (
    <div>
      <div className="mb-6">
        <h2 className="mb-1.5 text-[28px] font-bold leading-tight" style={{ color: look.text, fontFamily: look.fontHeading }}>
          {T.whenTitle}
        </h2>
        <p className="text-[15px] leading-6" style={{ color: look.muted, fontFamily: look.fontBody }}>
          {T.whenSubtitle}
        </p>
      </div>

      {/* Chosen service */}
      <div
        className="mb-7 flex items-center justify-between gap-3 px-4 py-3"
        style={{ background: look.surface, borderRadius: look.radius, border: `1px solid ${look.border}` }}
      >
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: look.surfaceMuted, fontFamily: look.fontBody }}>
            {T.serviceLabel}
          </p>
          <p className="truncate text-[15px] font-semibold" style={{ color: look.surfaceText, fontFamily: look.fontBody }}>
            {serviceText}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            req.setUnsure(false);
            goToStep(1);
          }}
          className="flex-shrink-0 text-[13px] font-semibold underline-offset-4 hover:underline"
          style={{ color: look.accentText, fontFamily: look.fontBody }}
        >
          {T.change}
        </button>
      </div>

      {/* When */}
      <section className="mb-7">
        {label(T.whenLabel)}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {presets.map((p) => (
            <motion.button
              key={p}
              type="button"
              aria-pressed={req.preset === p}
              whileTap={{ scale: 0.97 }}
              onClick={() => req.setPreset(p)}
              className="px-3 py-3 text-[14px] font-semibold transition-colors"
              style={{ ...chip(req.preset === p), borderRadius: Math.min(look.radius, 14) }}
            >
              {T.presets[p]}
            </motion.button>
          ))}
        </div>

        <AnimatePresence initial={false}>
          {req.preset === 'custom' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-3">
                <p className="mb-2 text-[12px]" style={{ color: look.muted, fontFamily: look.fontBody }}>
                  {T.pickHint}
                </p>
                <RangeCalendar
                  from={req.dateFrom}
                  to={req.dateTo}
                  onChange={(f, t) => req.setRange(f, t)}
                  maxDays={maxDniRezervacija}
                  lang={lang}
                  look={look}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {whenOk && (
            <motion.p
              key={`${req.dateFrom?.toISOString()}-${req.dateTo?.toISOString()}`}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 text-[14px] font-medium"
              style={{ color: look.text, fontFamily: look.fontBody }}
            >
              <svg aria-hidden="true" className="mr-1.5 inline-block align-[-3px]" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={look.accent} strokeWidth="2" strokeLinecap="round"><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M3 10h18M8 3v4M16 3v4" /></svg>
              {formatRange(req.dateFrom, req.dateTo, lang)}
            </motion.p>
          )}
        </AnimatePresence>
        {tried && !whenOk && (
          <p className="mt-2 text-[13px] font-medium" style={{ color: '#DC2626', fontFamily: look.fontBody }}>
            {T.missingWhen}
          </p>
        )}
      </section>

      {/* Part of day */}
      <section className="mb-7">
        {label(T.partOfDayLabel)}
        <div className="grid grid-cols-3 gap-2">
          {parts.map((p) => (
            <motion.button
              key={p}
              type="button"
              aria-pressed={req.partOfDay === p}
              whileTap={{ scale: 0.97 }}
              onClick={() => req.setPartOfDay(p)}
              className="px-2 py-2.5 text-[14px] font-semibold"
              style={{ ...chip(req.partOfDay === p), borderRadius: Math.min(look.radius, 14) }}
            >
              {T.partsOfDay[p]}
            </motion.button>
          ))}
        </div>
      </section>

      {/* With whom */}
      {people.length > 0 && (
        <section className="mb-7">
          {label(T.employeeLabel)}
          <div className="flex flex-wrap gap-2">
            {[{ id: null as string | null, label: T.anyone }, ...people.map((p) => ({ id: p.id as string | null, label: p.label }))].map(
              (p) => (
                <motion.button
                  key={p.id ?? 'any'}
                  type="button"
                  aria-pressed={req.employeeId === p.id}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => req.setEmployeeId(p.id)}
                  className="rounded-full px-4 py-2 text-[14px] font-semibold"
                  style={chip(req.employeeId === p.id)}
                >
                  {p.label}
                </motion.button>
              ),
            )}
          </div>
        </section>
      )}

      {/* What */}
      <section className="mb-4">
        {label(T.descriptionLabel)}
        <div
          style={{
            background: look.surface,
            borderRadius: look.radius,
            border: `1.5px solid ${tried && !descOk ? '#DC2626' : look.border}`,
          }}
        >
          <textarea
            value={req.description}
            onChange={(e) => req.setDescription(e.target.value)}
            rows={4}
            maxLength={MAX_DESCRIPTION}
            placeholder={descriptionPlaceholder(lang)}
            aria-label={T.descriptionLabel}
            className="block w-full resize-none bg-transparent px-4 py-3 text-[15px] leading-6 outline-none"
            style={{ color: look.surfaceText, fontFamily: look.fontBody }}
          />
          <div className="flex flex-wrap items-center gap-1.5 px-3 pb-3">
            {T.quickAdds.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => addQuick(q)}
                className="rounded-full px-3 py-1 text-[12px] font-medium transition-opacity hover:opacity-80"
                style={{ background: `${look.accent}14`, color: look.accentText, fontFamily: look.fontBody }}
              >
                + {q}
              </button>
            ))}
            <span className="ml-auto text-[11px] tabular-nums" style={{ color: look.surfaceMuted, fontFamily: look.fontBody }}>
              {req.description.length}/{MAX_DESCRIPTION}
            </span>
          </div>
        </div>
        <p className="mt-2 text-[12px]" style={{ color: tried && !descOk ? '#DC2626' : look.muted, fontFamily: look.fontBody }}>
          {tried && !descOk ? T.missingDescription : T.descriptionHelp}
        </p>
      </section>

      <div className="booking-sticky-cta" style={stickyCtaStyle(look.ctaBg, look.ctaBleed ?? 0)}>
        <motion.button
          type="button"
          onClick={proceed}
          whileTap={{ scale: 0.98 }}
          className="flex w-full items-center justify-center gap-2 py-4 text-[16px] font-semibold"
          style={{
            background: look.accent,
            color: look.onAccent,
            borderRadius: Math.min(look.radius, 16),
            fontFamily: look.fontHeading,
            boxShadow: `0 10px 28px ${look.accent}40`,
            opacity: whenOk && descOk ? 1 : 0.85,
          }}
        >
          {T.next} <span aria-hidden="true">→</span>
        </motion.button>
      </div>
    </div>
  );
}
