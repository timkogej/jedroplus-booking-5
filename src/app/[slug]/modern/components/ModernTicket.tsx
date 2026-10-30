'use client';

// The appointment as a dark glass ticket: date and time on top, a tear line,
// then services and price. Same card on the review step and after booking.

import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { useBookingStore } from '@/store/bookingStore';
import { usePromotionsStore } from '@/store/promotionsStore';
import { formatBookingPrice, getBookingPricing, resolvePrimaryPromotion } from '@/lib/pricing';
import { t } from '../i18n';
import { EASE, MODERN_BG } from './brand';
import Photo, { anyPhoto } from '@/components/shared/Photo';
import { Avatar, FONT, dateLocale, formatDuration, longDatePattern } from './ui';

function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return '';
  const total = h * 60 + m + minutes;
  return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

export default function ModernTicket({
  status,
  dateText,
  timeText,
}: {
  status?: string;
  dateText?: string;
  timeText?: string;
}) {
  const {
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
  const services = selectedServices.length > 0 ? selectedServices : selectedService ? [selectedService] : [];
  const promotion = resolvePrimaryPromotion(services, serviceDiscounts, activePromotion);
  const pricing = getBookingPricing(services, promotion, selectedAddOn);
  const totalDuration = services.reduce((s, sv) => s + sv.trajanjeMin, 0) + (selectedAddOn?.trajanjeMin ?? 0);
  const time = selectedTime ?? timeText ?? '';
  const end = time && totalDuration > 0 ? addMinutes(time, totalDuration) : '';
  const employee = employeesUI.find((e) => e.id === selectedEmployeeId);
  const personShown = showEmployee && (anyPerson || !!employee);
  const thumbs = anyPhoto(services);

  const rise = (i: number) => ({
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, ease: EASE, delay: 0.1 + i * 0.06 },
  });

  const notch = (side: 'left' | 'right') => (
    <span
      className={`absolute -top-3.5 h-7 w-7 rounded-full ${side === 'left' ? '-left-3.5' : '-right-3.5'}`}
      style={{ background: MODERN_BG, boxShadow: `inset ${side === 'left' ? '-1px' : '1px'} 0 0 rgba(255,255,255,0.1)` }}
    />
  );

  return (
    <div
      className="relative overflow-hidden rounded-[28px]"
      style={{
        background: 'linear-gradient(165deg, rgba(255,255,255,0.09), rgba(255,255,255,0.03))',
        boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.1), inset 0 1px 0 rgba(255,255,255,0.12), 0 40px 80px -40px rgba(0,0,0,0.8)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
      }}
    >
      {/* brand light across the top */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 left-1/2 h-48 w-[120%] -translate-x-1/2 rounded-full"
        style={{ background: 'radial-gradient(closest-side, color-mix(in srgb, var(--brand-glow) 35%, transparent), transparent)', filter: 'blur(10px)' }}
      />

      {/* ── When ── */}
      <div className="relative px-6 pb-7 pt-6">
        {status && (
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.35, type: 'spring', stiffness: 400, damping: 22 }}
            className="absolute right-5 top-5 flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-bold"
            style={{ fontFamily: FONT, background: 'rgba(48,209,88,0.14)', color: '#4ADE80', boxShadow: 'inset 0 0 0 1px rgba(48,209,88,0.3)' }}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: '#30D158', boxShadow: '0 0 8px #30D158' }} />
            {status}
          </motion.span>
        )}

        <motion.p {...rise(0)} className="text-[13px] font-bold uppercase first-cap" style={{ fontFamily: FONT, color: 'var(--brand-glow)', letterSpacing: '0.1em' }}>
          {selectedDate ? format(selectedDate, longDatePattern(language), { locale: loc }) : dateText}
        </motion.p>
        <motion.p
          {...rise(1)}
          className="mt-1 text-[52px] font-extrabold leading-none tabular-nums sm:text-[60px]"
          style={{ fontFamily: FONT, color: '#FFFFFF', letterSpacing: '-0.05em' }}
        >
          {time}
          {end && (
            <span className="ml-2 text-[22px] font-bold sm:text-[26px]" style={{ color: 'var(--t-faint)', letterSpacing: '-0.03em' }}>
              – {end}
            </span>
          )}
        </motion.p>

        {(personShown || totalDuration > 0) && (
          <motion.div {...rise(2)} className="mt-5 flex flex-wrap items-center gap-2">
            {personShown && (
              <span className="flex items-center gap-2 rounded-full py-1 pl-1 pr-3.5" style={{ background: 'rgba(255,255,255,0.07)' }}>
                {anyPerson ? (
                  <span className="flex h-7 w-7 items-center justify-center rounded-full" style={{ background: 'var(--brand-grad)', color: '#fff' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                      <circle cx="9" cy="7" r="4" />
                      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M16 3.13a4 4 0 010 7.75" />
                    </svg>
                  </span>
                ) : (
                  <Avatar initials={employee?.initials ?? ''} size={28} photo={employee?.slika_url} />
                )}
                <span className="text-[14px] font-semibold" style={{ fontFamily: FONT, color: 'var(--t-primary)' }}>
                  {anyPerson ? t(language, 'anyone') : employee?.label}
                </span>
              </span>
            )}
            {totalDuration > 0 && (
              <span className="flex items-center gap-1.5 rounded-full px-3.5 py-[7px] text-[14px] font-semibold" style={{ background: 'rgba(255,255,255,0.07)', color: 'var(--t-soft)', fontFamily: FONT }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="9.5" />
                  <path d="M12 7v5l3 2" />
                </svg>
                {formatDuration(totalDuration)}
              </span>
            )}
          </motion.div>
        )}
      </div>

      {/* ── Tear line ── */}
      <div className="relative h-0" aria-hidden="true">
        {notch('left')}
        {notch('right')}
        <span className="absolute left-6 right-6 top-0" style={{ borderTop: '1.5px dashed rgba(255,255,255,0.14)' }} />
      </div>

      {/* ── What and how much ── */}
      <div className="relative px-6 pb-6 pt-6">
        <div className="space-y-3">
          {services.map((s, i) => {
            const discounted = i === 0 && pricing.promotion && pricing.primaryFinalPrice < pricing.primaryOriginalPrice;
            return (
              <motion.div key={s.id} {...rise(3 + i)} className={`flex justify-between gap-4 ${thumbs ? 'items-center' : 'items-baseline'}`}>
                <span className="flex min-w-0 items-center gap-3 text-[16px] font-semibold" style={{ fontFamily: FONT, color: 'var(--t-primary)' }}>
                  {thumbs && (
                    <Photo
                      src={s.slika_url}
                      eager
                      className="h-11 w-11 flex-shrink-0 rounded-[12px]"
                      style={{ background: 'rgba(255,255,255,0.06)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.1)' }}
                      fallback={
                        <span style={{ background: 'var(--brand-grad)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>
                          {s.naziv.trim().charAt(0).toUpperCase()}
                        </span>
                      }
                    />
                  )}
                  <span>{s.naziv}</span>
                </span>
                <span className="flex-shrink-0 text-[16px] font-semibold tabular-nums" style={{ fontFamily: FONT, color: 'var(--t-soft)' }}>
                  {discounted && (
                    <span className="mr-2 text-[14px] line-through" style={{ color: 'var(--t-faint)' }}>
                      {formatBookingPrice(pricing.primaryOriginalPrice)}
                    </span>
                  )}
                  {formatBookingPrice(discounted ? pricing.primaryFinalPrice : Number(s.cena || 0))}
                </span>
              </motion.div>
            );
          })}
          {selectedAddOn && (
            <motion.div {...rise(3 + services.length)} className="flex items-baseline justify-between gap-4">
              <span className="text-[16px] font-semibold" style={{ fontFamily: FONT, color: 'var(--t-primary)' }}>
                <span style={{ color: 'var(--brand-glow)' }}>+ </span>
                {selectedAddOn.naziv}
              </span>
              <span className="flex-shrink-0 text-[16px] font-semibold tabular-nums" style={{ fontFamily: FONT, color: 'var(--t-soft)' }}>
                {pricing.addOnDiscountAmount > 0 && (
                  <span className="mr-2 text-[14px] line-through" style={{ color: 'var(--t-faint)' }}>
                    {formatBookingPrice(pricing.addOnOriginalPrice)}
                  </span>
                )}
                {formatBookingPrice(pricing.addOnFinalPrice)}
              </span>
            </motion.div>
          )}
          {pricing.promotion?.badgeLabel && (
            <div className="flex items-center justify-between gap-4">
              <span className="rounded-full px-2.5 py-0.5 text-[12px] font-bold text-white" style={{ background: 'var(--brand-grad)', fontFamily: FONT }}>
                {t(language, 'discount')} {pricing.promotion.badgeLabel}
              </span>
              <span className="text-[14px] font-bold tabular-nums" style={{ fontFamily: FONT, color: '#4ADE80' }}>
                −{formatBookingPrice(pricing.discountAmount)}
              </span>
            </div>
          )}
        </div>

        {services.length > 0 && (
          <div className="mt-5 flex items-end justify-between pt-5" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <span className="text-[14px] font-semibold uppercase" style={{ fontFamily: FONT, color: 'var(--t-faint)', letterSpacing: '0.1em' }}>
              {t(language, 'total')}
            </span>
            <div className="text-right">
              {pricing.hasDiscount && (
                <span className="mr-2 text-[15px] line-through tabular-nums" style={{ fontFamily: FONT, color: 'var(--t-faint)' }}>
                  {formatBookingPrice(pricing.originalTotal)}
                </span>
              )}
              <span
                className="modern-shift-text text-[32px] font-extrabold tabular-nums"
                style={{ fontFamily: FONT, letterSpacing: '-0.04em', backgroundImage: 'linear-gradient(100deg, #FFFFFF 0%, #FFFFFF 40%, var(--brand-glow) 70%, #FFFFFF 100%)' }}
              >
                {formatBookingPrice(pricing.finalTotal)}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
