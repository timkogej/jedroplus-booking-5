'use client';

// The appointment as a ticket: date tile and time on top, a perforated tear
// line, then services and the price. Used on the review step and on the
// success screen, so the client sees the same card before and after booking.

import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { useBookingStore } from '@/store/bookingStore';
import { usePromotionsStore } from '@/store/promotionsStore';
import { formatBookingPrice, getBookingPricing, resolvePrimaryPromotion } from '@/lib/pricing';
import { t } from '../i18n';
import Photo, { anyPhoto } from '@/components/shared/Photo';
import { Avatar, CARD, EASE, FONT, INK, INK_2, INK_3, dateLocale, formatDuration, longDatePattern } from './ui';

function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return '';
  const total = h * 60 + m + minutes;
  return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

export default function ClassicTicket({
  status,
  dateText,
  timeText,
}: {
  /** Small pill in the corner, e.g. "Potrjeno". */
  status?: { label: string; tone: 'success' | 'pending' };
  /** Fallbacks when the store no longer has the date (should not happen). */
  dateText?: string;
  timeText?: string;
}) {
  const {
    theme,
    selectedServices,
    selectedService,
    selectedDate,
    selectedTime,
    selectedEmployeeId,
    anyPerson,
    employeesUI,
    language,
  } = useBookingStore();
  const showEmployee = useBookingStore((s) => s.prikazZaposlenih);
  const { activePromotion, serviceDiscounts, selectedAddOn } = usePromotionsStore();

  const loc = dateLocale(language);
  const accent = theme.primarySolid;
  const services = selectedServices.length > 0 ? selectedServices : selectedService ? [selectedService] : [];
  const promotion = resolvePrimaryPromotion(services, serviceDiscounts, activePromotion);
  const pricing = getBookingPricing(services, promotion, selectedAddOn);
  const totalDuration = services.reduce((s, sv) => s + sv.trajanjeMin, 0) + (selectedAddOn?.trajanjeMin ?? 0);
  const time = selectedTime ?? timeText ?? '';
  const end = time && totalDuration > 0 ? addMinutes(time, totalDuration) : '';
  const employee = employeesUI.find((e) => e.id === selectedEmployeeId);
  const thumbs = anyPhoto(services);
  const personShown = showEmployee && (anyPerson || !!employee);

  const stagger = (i: number) => ({
    initial: { opacity: 0, y: 6 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, ease: EASE, delay: 0.08 + i * 0.05 },
  });

  return (
    <div className="relative overflow-hidden" style={CARD}>
      {/* ── Top: when ─────────────────────────────────────────────── */}
      <div
        className="relative px-5 pb-6 pt-5 sm:px-6"
        style={{ background: `linear-gradient(160deg, ${accent}14 0%, ${accent}05 60%, transparent 100%)` }}
      >
        {status && (
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 400, damping: 22 }}
            className="absolute right-4 top-4 flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-semibold"
            style={{
              fontFamily: FONT,
              background: status.tone === 'success' ? 'rgba(52,199,89,0.14)' : `${accent}14`,
              color: status.tone === 'success' ? '#1E8E3E' : theme.primaryOnLight,
            }}
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: status.tone === 'success' ? '#34C759' : accent }}
            />
            {status.label}
          </motion.span>
        )}

        <div className="flex items-center gap-4">
          {/* Calendar tile */}
          <motion.div
            {...stagger(0)}
            className="flex h-[68px] w-[64px] flex-shrink-0 flex-col overflow-hidden rounded-[16px] bg-white"
            style={{ boxShadow: '0 0 0 0.5px rgba(0,0,0,0.08), 0 6px 16px -6px rgba(0,0,0,0.18)' }}
          >
            <span
              className="py-[3px] text-center text-[11px] font-bold uppercase text-white"
              style={{ background: accent, fontFamily: FONT, letterSpacing: '0.06em' }}
            >
              {selectedDate ? format(selectedDate, 'MMM', { locale: loc }).replace('.', '') : '—'}
            </span>
            <span
              className="flex flex-1 items-center justify-center text-[28px] font-semibold leading-none tabular-nums"
              style={{ color: INK, fontFamily: FONT, letterSpacing: '-0.03em' }}
            >
              {selectedDate ? selectedDate.getDate() : ''}
            </span>
          </motion.div>

          <motion.div {...stagger(1)} className="min-w-0 pr-16">
            <p className="text-[19px] font-bold leading-tight first-cap sm:text-[21px]" style={{ fontFamily: FONT, color: INK, letterSpacing: '-0.022em' }}>
              {selectedDate ? format(selectedDate, longDatePattern(language), { locale: loc }) : dateText}
            </p>
            <p className="mt-1 text-[17px] font-semibold tabular-nums" style={{ fontFamily: FONT, color: theme.primaryOnLight }}>
              {time}
              {end && <span style={{ color: INK_3 }}> – {end}</span>}
            </p>
          </motion.div>
        </div>

        {(personShown || totalDuration > 0) && (
          <motion.div {...stagger(2)} className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2">
            {personShown && (
              <span className="flex items-center gap-2">
                {anyPerson ? (
                  <span className="flex h-7 w-7 items-center justify-center rounded-full" style={{ background: `${accent}18`, color: theme.primaryOnLight }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                      <circle cx="9" cy="7" r="4" />
                      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M16 3.13a4 4 0 010 7.75" />
                    </svg>
                  </span>
                ) : (
                  <Avatar initials={employee?.initials ?? ''} photo={employee?.slika_url} color={accent} size={28} />
                )}
                <span className="text-[15px] font-medium" style={{ fontFamily: FONT, color: INK }}>
                  {anyPerson ? t(language, 'anyone') : employee?.label}
                </span>
              </span>
            )}
            {totalDuration > 0 && (
              <span className="flex items-center gap-1.5 text-[15px]" style={{ fontFamily: FONT, color: INK_2 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="9.5" />
                  <path d="M12 7v5l3 2" />
                </svg>
                {formatDuration(totalDuration)}
              </span>
            )}
          </motion.div>
        )}
      </div>

      {/* ── Tear line ─────────────────────────────────────────────── */}
      <div className="relative h-0" aria-hidden="true">
        <span className="absolute -left-3 -top-3 h-6 w-6 rounded-full" style={{ background: `linear-gradient(160deg, ${theme.bgFrom}, ${theme.bgTo})`, boxShadow: 'inset -1px 0 0 rgba(0,0,0,0.05)' }} />
        <span className="absolute -right-3 -top-3 h-6 w-6 rounded-full" style={{ background: `linear-gradient(160deg, ${theme.bgFrom}, ${theme.bgTo})`, boxShadow: 'inset 1px 0 0 rgba(0,0,0,0.05)' }} />
        <span className="absolute left-5 right-5 top-0" style={{ borderTop: '1.5px dashed rgba(60,60,67,0.16)' }} />
      </div>

      {/* ── Bottom: what and how much ─────────────────────────────── */}
      <div className="px-5 pb-5 pt-5 sm:px-6">
        <div className="space-y-2.5">
          {services.map((s, i) => {
            const isPrimary = i === 0;
            const discounted = isPrimary && pricing.promotion && pricing.primaryFinalPrice < pricing.primaryOriginalPrice;
            return (
              <motion.div key={s.id} {...stagger(3 + i)} className={`flex justify-between gap-4 ${thumbs ? 'items-center' : 'items-baseline'}`}>
                <span className="flex min-w-0 items-center gap-3 text-[16px]" style={{ fontFamily: FONT, color: INK }}>
                  {thumbs && (
                    <Photo
                      src={s.slika_url}
                      eager
                      className="h-10 w-10 flex-shrink-0 rounded-[10px]"
                      style={{ background: `${accent}14` }}
                      fallback={<span className="text-[16px] font-semibold" style={{ color: accent }}>{s.naziv.trim().charAt(0).toUpperCase()}</span>}
                    />
                  )}
                  <span>{s.naziv}</span>
                </span>
                <span className="flex-shrink-0 text-[16px] tabular-nums" style={{ fontFamily: FONT, color: INK }}>
                  {discounted && (
                    <span className="mr-2 text-[14px] line-through" style={{ color: INK_3 }}>
                      {formatBookingPrice(pricing.primaryOriginalPrice)}
                    </span>
                  )}
                  {formatBookingPrice(discounted ? pricing.primaryFinalPrice : Number(s.cena || 0))}
                </span>
              </motion.div>
            );
          })}
          {selectedAddOn && (
            <motion.div {...stagger(3 + services.length)} className="flex items-baseline justify-between gap-4">
              <span className="text-[16px]" style={{ fontFamily: FONT, color: INK }}>
                <span style={{ color: theme.primaryOnLight }}>+ </span>
                {selectedAddOn.naziv}
              </span>
              <span className="flex-shrink-0 text-[16px] tabular-nums" style={{ fontFamily: FONT, color: INK }}>
                {pricing.addOnDiscountAmount > 0 && (
                  <span className="mr-2 text-[14px] line-through" style={{ color: INK_3 }}>
                    {formatBookingPrice(pricing.addOnOriginalPrice)}
                  </span>
                )}
                {formatBookingPrice(pricing.addOnFinalPrice)}
              </span>
            </motion.div>
          )}
          {pricing.promotion?.badgeLabel && (
            <div className="flex items-center justify-between gap-4">
              <span className="rounded-full px-2 py-0.5 text-[12px] font-bold text-white" style={{ background: accent, fontFamily: FONT }}>
                {t(language, 'discount')} {pricing.promotion.badgeLabel}
              </span>
              <span className="text-[14px] font-medium tabular-nums" style={{ fontFamily: FONT, color: '#1E8E3E' }}>
                −{formatBookingPrice(pricing.discountAmount)}
              </span>
            </div>
          )}
        </div>

        {services.length > 0 && (
          <div className="mt-4 flex items-end justify-between pt-4" style={{ borderTop: '0.5px solid rgba(60,60,67,0.16)' }}>
            <span className="text-[15px] font-medium" style={{ fontFamily: FONT, color: INK_2 }}>
              {t(language, 'total')}
            </span>
            <div className="text-right">
              {pricing.hasDiscount && (
                <span className="mr-2 text-[15px] line-through tabular-nums" style={{ fontFamily: FONT, color: INK_3 }}>
                  {formatBookingPrice(pricing.originalTotal)}
                </span>
              )}
              <span className="text-[28px] font-bold tabular-nums" style={{ fontFamily: FONT, color: INK, letterSpacing: '-0.03em' }}>
                {formatBookingPrice(pricing.finalTotal)}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
