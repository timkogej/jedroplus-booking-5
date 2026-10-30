'use client';

// The appointment as an invitation card: a framed white card with the date
// set large in serif, the time, and the services listed like a menu. Shown on
// the review step and, with a "confirmed" seal, after booking.

import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { useBookingStore } from '@/store/bookingStore';
import { usePromotionsStore } from '@/store/promotionsStore';
import { formatBookingPrice, getBookingPricing, resolvePrimaryPromotion } from '@/lib/pricing';
import { dateLocale, t } from '../i18n';
import Photo, { anyPhoto } from '@/components/shared/Photo';

const EASE = [0.22, 1, 0.36, 1] as const;

function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return '';
  const total = h * 60 + m + minutes;
  return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h} h ${m} min` : `${h} h`;
}

function Ornament({ color }: { color: string }) {
  return (
    <div className="flex items-center justify-center gap-3" aria-hidden="true">
      <span className="elegant-rule h-px w-14" style={{ background: `linear-gradient(to left, ${color}, transparent)`, transformOrigin: 'right' }} />
      <span className="h-1.5 w-1.5 rotate-45" style={{ background: color }} />
      <span className="elegant-rule h-px w-14" style={{ background: `linear-gradient(to right, ${color}, transparent)`, transformOrigin: 'left' }} />
    </div>
  );
}

export default function ElegantTicket({ sealed, dateText, timeText }: { sealed?: boolean; dateText?: string; timeText?: string }) {
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

  const gold = theme.primarySolid;
  const loc = dateLocale(language);
  const services = selectedServices.length > 0 ? selectedServices : selectedService ? [selectedService] : [];
  const promotion = resolvePrimaryPromotion(services, serviceDiscounts, activePromotion);
  const pricing = getBookingPricing(services, promotion, selectedAddOn);
  const duration = services.reduce((s, sv) => s + sv.trajanjeMin, 0) + (selectedAddOn?.trajanjeMin ?? 0);
  const time = selectedTime ?? timeText ?? '';
  const end = time && duration > 0 ? addMinutes(time, duration) : '';
  const employee = employeesUI.find((e) => e.id === selectedEmployeeId);
  const person = showEmployee ? (anyPerson ? t(language, 'anyoneAvailable') : employee?.label) : undefined;
  const personPhoto = showEmployee && !anyPerson ? employee?.slika_url : null;
  const thumbs = anyPhoto(services);

  const rise = (i: number) => ({
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.7, ease: EASE, delay: 0.15 + i * 0.07 },
  });

  const line = (name: React.ReactNode, price: React.ReactNode, i: number, key: string) => (
    <motion.div key={key} {...rise(i)} className={`flex gap-2 ${thumbs ? 'items-center' : 'items-baseline'}`}>
      <span className="text-[15px]" style={{ fontFamily: 'var(--font-inter)', color: '#1F2937' }}>
        {name}
      </span>
      <span className="mb-[5px] min-w-[24px] flex-1 border-b border-dotted" style={{ borderColor: '#D6D0C4' }} aria-hidden="true" />
      <span className="flex-shrink-0 text-[16px] tabular-nums" style={{ fontFamily: 'var(--font-playfair)', color: '#1F2937' }}>
        {price}
      </span>
    </motion.div>
  );

  return (
    <div
      className="relative rounded-[22px] bg-white p-2"
      style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.03), 0 30px 60px -36px rgba(60,40,10,0.35)', border: '1px solid #EEE8DE' }}
    >
      {/* inner frame */}
      <div className="relative rounded-[16px] px-6 pb-7 pt-8 sm:px-10" style={{ border: `1px solid ${gold}33` }}>
        {/* Confirmed seal */}
        {sealed && (
          <motion.div
            initial={{ opacity: 0, scale: 1.8, rotate: -30 }}
            animate={{ opacity: 1, scale: 1, rotate: -12 }}
            transition={{ delay: 1.1, type: 'spring', stiffness: 260, damping: 16 }}
            className="absolute -right-3 -top-4 flex h-[74px] w-[74px] flex-col items-center justify-center rounded-full text-white sm:-right-5"
            style={{ background: `radial-gradient(circle at 35% 30%, ${theme.primaryColor}, ${gold})`, boxShadow: `0 10px 24px -8px ${gold}, inset 0 0 0 3px rgba(255,255,255,0.35)` }}
          >
            <svg width="18" height="14" viewBox="0 0 12 10" fill="none" aria-hidden="true">
              <path d="M1 5L4.5 8.5L11 1" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="mt-0.5 text-[9px] font-semibold uppercase" style={{ fontFamily: 'var(--font-inter)', letterSpacing: '0.14em' }}>
              {t(language, 'statusConfirmed')}
            </span>
          </motion.div>
        )}

        {/* ── When ── */}
        <div className="text-center">
          <motion.p {...rise(0)} className="text-[11px] font-semibold uppercase" style={{ fontFamily: 'var(--font-inter)', letterSpacing: '0.28em', color: gold }}>
            {t(language, 'yourAppointment')}
          </motion.p>
          <motion.p {...rise(1)} className="mt-4 text-[19px] italic first-cap" style={{ fontFamily: 'var(--font-playfair)', color: '#6B6457' }}>
            {selectedDate ? format(selectedDate, 'EEEE', { locale: loc }) : dateText}
          </motion.p>
          {selectedDate && (
            <motion.p {...rise(2)} className="mt-1 leading-none" style={{ fontFamily: 'var(--font-playfair)', fontSize: 'clamp(3.6rem, 12vw, 4.6rem)', color: '#111111' }}>
              {selectedDate.getDate()}
            </motion.p>
          )}
          {selectedDate && (
            <motion.p {...rise(3)} className="mt-2 text-[13px] font-medium uppercase" style={{ fontFamily: 'var(--font-inter)', letterSpacing: '0.22em', color: '#6B6457' }}>
              {format(selectedDate, 'LLLL yyyy', { locale: loc })}
            </motion.p>
          )}
          <motion.p {...rise(4)} className="mt-4 text-[24px] tabular-nums" style={{ fontFamily: 'var(--font-playfair)', color: gold }}>
            {time}
            {end && <span style={{ color: '#A39C8F' }}> – {end}</span>}
          </motion.p>
          {(person || duration > 0) && (
            <motion.p {...rise(5)} className="mt-2 flex items-center justify-center gap-2 text-[14px]" style={{ fontFamily: 'var(--font-inter)', color: '#6B7280' }}>
              {personPhoto && (
                <Photo
                  src={personPhoto}
                  eager
                  className="h-8 w-8 flex-shrink-0 rounded-full"
                  style={{ boxShadow: `0 0 0 1.5px #fff, 0 0 0 2.5px ${gold}88` }}
                />
              )}
              <span>{[person, duration > 0 ? formatDuration(duration) : null].filter(Boolean).join('  ·  ')}</span>
            </motion.p>
          )}
        </div>

        <div className="my-7">
          <Ornament color={gold} />
        </div>

        {/* ── Services, menu style ── */}
        <div className="space-y-3">
          {services.map((s, i) => {
            const discounted = i === 0 && pricing.promotion && pricing.primaryFinalPrice < pricing.primaryOriginalPrice;
            return line(
              thumbs ? (
                <span className="flex items-center gap-3">
                  <Photo
                    src={s.slika_url}
                    eager
                    className="h-10 w-10 flex-shrink-0 rounded-lg"
                    style={{ background: '#F7F3EC', boxShadow: 'inset 0 0 0 1px #EDE6D8' }}
                    fallback={
                      <span style={{ fontFamily: 'var(--font-playfair)', fontStyle: 'italic', color: gold, fontSize: '1.1rem' }}>
                        {s.naziv.trim().charAt(0).toUpperCase()}
                      </span>
                    }
                  />
                  <span>{s.naziv}</span>
                </span>
              ) : (
                s.naziv
              ),
              <>
                {discounted && (
                  <span className="mr-2 text-[13px] line-through" style={{ color: '#A39C8F' }}>
                    {formatBookingPrice(pricing.primaryOriginalPrice)}
                  </span>
                )}
                {formatBookingPrice(discounted ? pricing.primaryFinalPrice : Number(s.cena || 0))}
              </>,
              6 + i,
              s.id,
            );
          })}
          {selectedAddOn &&
            line(
              <>
                <span style={{ color: gold }}>+ </span>
                {selectedAddOn.naziv}
              </>,
              formatBookingPrice(pricing.addOnFinalPrice),
              6 + services.length,
              'addon',
            )}
          {pricing.promotion?.badgeLabel && (
            <div className="flex items-baseline justify-between">
              <span className="text-[13px] italic" style={{ fontFamily: 'var(--font-playfair)', color: gold }}>
                {t(language, 'discount')} {pricing.promotion.badgeLabel}
              </span>
              <span className="text-[14px] tabular-nums" style={{ fontFamily: 'var(--font-inter)', color: '#15803D' }}>
                −{formatBookingPrice(pricing.discountAmount)}
              </span>
            </div>
          )}
        </div>

        {services.length > 0 && (
          <motion.div {...rise(8 + services.length)} className="mt-6 flex items-end justify-between border-t pt-5" style={{ borderColor: '#EEE8DE' }}>
            <span className="text-[11px] font-semibold uppercase" style={{ fontFamily: 'var(--font-inter)', letterSpacing: '0.22em', color: '#6B6457' }}>
              {t(language, 'total')}
            </span>
            <span className="text-right">
              {pricing.hasDiscount && (
                <span className="mr-2 text-[14px] line-through" style={{ fontFamily: 'var(--font-inter)', color: '#A39C8F' }}>
                  {formatBookingPrice(pricing.originalTotal)}
                </span>
              )}
              <span className="text-[30px] leading-none tabular-nums" style={{ fontFamily: 'var(--font-playfair)', color: gold }}>
                {formatBookingPrice(pricing.finalTotal)}
              </span>
            </span>
          </motion.div>
        )}
      </div>
    </div>
  );
}
