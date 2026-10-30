'use client';

// The booking as a big playing card: date in the corners, the time large in
// the middle, then the services, the specialist and the guest. Used on the
// review (with edit links) and on the success page (with a "confirmed" stamp).

import type { ReactNode } from 'react';
import Photo, { anyPhoto } from '@/components/shared/Photo';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { useBookingStore } from '@/store/bookingStore';
import { usePromotionsStore } from '@/store/promotionsStore';
import { formatBookingPrice, getBookingPricing, resolvePrimaryPromotion } from '@/lib/pricing';
import { t } from '../i18n';
import { CREAM, CX_BG, Chip, EASE, FAINT, FONT_BODY, FONT_HEAD, FONT_LABEL, MUTED, dateLocale, formatDuration, mix } from './ui';

function EditButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className="-my-1 flex h-8 items-center gap-1.5 rounded-full px-3 text-[11px] font-medium uppercase transition-colors hover:text-white"
      style={{ fontFamily: FONT_LABEL, letterSpacing: '0.14em', color: 'var(--cx-glow)', background: mix('--cx-glow', 10) }}
    >
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4 20h4L19 9l-4-4L4 16v4zM14 6l4 4" />
      </svg>
      {label}
    </button>
  );
}

function Section({ label, action, children }: { label: string; action?: ReactNode; children: ReactNode }) {
  return (
    <div className="px-5 py-4 sm:px-7" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
      <div className="mb-2.5 flex items-center justify-between gap-3">
        <p className="cx-label">{label}</p>
        {action}
      </div>
      {children}
    </div>
  );
}

/** "name ........ price" like on a menu card. */
function Line({ name, value, sub, accent, thumb }: { name: string; value?: string; sub?: string; accent?: boolean; thumb?: ReactNode }) {
  const color = accent ? 'var(--cx-glow)' : CREAM;
  if (thumb) {
    return (
      <div className="flex items-center gap-3 py-1.5">
        {thumb}
        <div className="min-w-0 flex-1">
          <Line name={name} value={value} sub={sub} accent={accent} />
        </div>
      </div>
    );
  }
  return (
    <div className="py-1">
      <div className="flex items-baseline gap-2">
        <p className="min-w-0 text-[16px] font-semibold leading-snug" style={{ fontFamily: FONT_BODY, color }}>
          {name}
        </p>
        {value && (
          <>
            <span className="min-w-[16px] flex-1 border-b border-dotted" style={{ borderColor: 'rgba(255,255,255,0.2)' }} />
            <span className="flex-shrink-0 text-[16px] font-semibold tabular-nums" style={{ fontFamily: FONT_BODY, color }}>
              {value}
            </span>
          </>
        )}
      </div>
      {sub && (
        <p className="text-[13px]" style={{ fontFamily: FONT_BODY, color: FAINT }}>
          {sub}
        </p>
      )}
    </div>
  );
}

function Corner({ day, suit, flip }: { day: string; suit: string; flip?: boolean }) {
  return (
    <div
      className={`pointer-events-none absolute flex flex-col items-center leading-none ${flip ? 'bottom-4 right-5 rotate-180' : 'left-5 top-4'}`}
      aria-hidden="true"
    >
      <span className="text-[26px] font-bold" style={{ fontFamily: FONT_HEAD, color: 'var(--cx-glow)' }}>{day}</span>
      <span className="mt-1 text-[16px]" style={{ fontFamily: 'Georgia, serif', color: 'var(--cx-glow)' }}>{suit}</span>
    </div>
  );
}

interface Props {
  mode: 'review' | 'done';
  /** Review only: jump back to a step to change it. */
  onEdit?: (step: 1 | 3 | 4 | 5) => void;
  /** Done only: the appointment ID from the API. */
  refNum?: string;
}

export default function CasinoTicket({ mode, onEdit, refNum }: Props) {
  const {
    company,
    selectedService,
    selectedServices,
    selectedDate,
    selectedTime,
    selectedEmployeeId,
    anyPerson,
    employeesUI,
    totalDurationMin,
    customerDetails,
    language,
  } = useBookingStore();
  const showEmployee = useBookingStore((s) => s.prikazZaposlenih);
  const { activePromotion, serviceDiscounts, selectedAddOn } = usePromotionsStore();

  const services = selectedServices.length > 0 ? selectedServices : selectedService ? [selectedService] : [];
  const promotion = resolvePrimaryPromotion(services, serviceDiscounts, activePromotion);
  const pricing = getBookingPricing(services, promotion, selectedAddOn);
  const employee = employeesUI.find((e) => e.id === selectedEmployeeId);
  const minutes = (totalDurationMin > 0 ? totalDurationMin : services[0]?.trajanjeMin ?? 0) + (selectedAddOn?.trajanjeMin ?? 0);
  const loc = dateLocale(language);
  const edit = mode === 'review' && onEdit ? onEdit : null;
  const editLabel = t(language, 'edit');

  const day = selectedDate ? String(selectedDate.getDate()) : '◆';
  const weekday = selectedDate ? format(selectedDate, 'EEEE', { locale: loc }) : '';
  const dateLine = selectedDate ? format(selectedDate, language === 'en' ? 'MMMM d, yyyy' : 'd. MMMM yyyy', { locale: loc }) : '';

  return (
    <div
      className="relative overflow-hidden rounded-[24px]"
      style={{
        background: 'linear-gradient(165deg, #1a1a21 0%, #111116 55%, #0d0d11 100%)',
        boxShadow: `inset 0 0 0 1px ${mix('--cx-glow', 32)}, 0 40px 80px -40px rgba(0,0,0,0.9), 0 0 60px -30px var(--cx-glow)`,
      }}
    >
      {/* Brand band at the top */}
      <div className="relative flex items-center justify-between gap-3 overflow-hidden px-5 py-3 sm:px-7" style={{ background: 'var(--cx-grad)' }}>
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-25"
          style={{ backgroundImage: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.35) 0 1px, transparent 1px 9px)' }}
        />
        <p className="relative truncate text-[12px] font-semibold uppercase text-white" style={{ fontFamily: FONT_LABEL, letterSpacing: '0.22em' }}>
          ♠ {company?.naziv ?? ''}
        </p>
        <p className="relative flex-shrink-0 text-[11px] font-medium uppercase text-white/85" style={{ fontFamily: FONT_LABEL, letterSpacing: '0.16em' }}>
          {mode === 'done' && refNum ? `#${refNum}` : mode === 'done' ? t(language, 'statusConfirmed') : t(language, 'reviewLabel')}
        </p>
      </div>

      {/* Face: date and the time, large */}
      <div className="relative px-5 pb-7 pt-8 text-center sm:px-7">
        <Corner day={day} suit="♦" />
        <Corner day={day} suit="♦" flip />

        {edit && (
          <div className="absolute right-4 top-4">
            <EditButton onClick={() => edit(4)} label={editLabel} />
          </div>
        )}

        <p className="first-cap text-[12px] font-medium uppercase" style={{ fontFamily: FONT_LABEL, letterSpacing: '0.3em', color: MUTED }}>
          {weekday}
        </p>
        <p className="mt-1 text-[24px] font-bold sm:text-[28px]" style={{ fontFamily: FONT_HEAD, color: CREAM }}>
          {dateLine}
        </p>
        <p
          className="mx-auto mt-1 inline-block pb-1 text-[64px] font-black leading-none tabular-nums sm:text-[76px]"
          style={{
            fontFamily: FONT_HEAD,
            backgroundImage: 'linear-gradient(100deg, #fff 0%, #fff 30%, var(--cx-glow) 65%, var(--cx-glow2) 100%)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
            letterSpacing: '-0.02em',
          }}
        >
          {selectedTime ?? '—'}
        </p>
        {minutes > 0 && (
          <p className="mt-2 text-[12px] font-medium uppercase" style={{ fontFamily: FONT_LABEL, letterSpacing: '0.2em', color: FAINT }}>
            {formatDuration(minutes)}
          </p>
        )}

        {/* "Confirmed" stamp on the success page */}
        {mode === 'done' && (
          <motion.div
            initial={{ opacity: 0, scale: 2.2, rotate: -30 }}
            animate={{ opacity: 1, scale: 1, rotate: -14 }}
            transition={{ delay: 0.9, type: 'spring', stiffness: 300, damping: 16 }}
            className="absolute right-3 top-3 flex h-[62px] w-[62px] items-center justify-center rounded-full sm:right-6 sm:top-4"
            style={{ boxShadow: `inset 0 0 0 2px var(--cx-glow), inset 0 0 0 5px ${CX_BG}, inset 0 0 0 6px var(--cx-glow)` }}
            aria-hidden="true"
          >
            <span className="font-semibold uppercase" style={{ fontFamily: FONT_LABEL, fontSize: t(language, 'statusConfirmed').length > 8 ? 8 : 9.5, letterSpacing: '0.08em', color: 'var(--cx-glow)' }}>
              {t(language, 'statusConfirmed')}
            </span>
          </motion.div>
        )}
      </div>

      {/* Perforation with notches */}
      <div className="relative h-0" aria-hidden="true">
        <span className="absolute -left-3 -top-3 h-6 w-6 rounded-full" style={{ background: CX_BG, boxShadow: `inset -1px 0 0 ${mix('--cx-glow', 32)}` }} />
        <span className="absolute -right-3 -top-3 h-6 w-6 rounded-full" style={{ background: CX_BG, boxShadow: `inset 1px 0 0 ${mix('--cx-glow', 32)}` }} />
        <div className="mx-5 border-t border-dashed" style={{ borderColor: 'rgba(255,255,255,0.14)' }} />
      </div>

      {/* Services */}
      <div className="px-5 pb-3 pt-5 sm:px-7">
        <div className="mb-2 flex items-center justify-between gap-3">
          <p className="cx-label">{t(language, services.length > 1 ? 'services' : 'fieldService')}</p>
          {edit && <EditButton onClick={() => edit(1)} label={editLabel} />}
        </div>
        {services.map((s) => (
          <Line
            key={s.id}
            name={s.naziv}
            sub={formatDuration(s.trajanjeMin)}
            value={s.cena ? formatBookingPrice(Number(s.cena)) : undefined}
            thumb={
              anyPhoto(services) ? (
                <Photo
                  src={s.slika_url}
                  eager
                  className="h-11 w-11 flex-shrink-0 rounded-[10px]"
                  style={{ background: mix('--cx-glow', 10), boxShadow: `inset 0 0 0 1px ${mix('--cx-glow', 22)}` }}
                  fallback={<span style={{ fontFamily: 'Georgia, serif', color: 'var(--cx-glow)', fontSize: 18 }}>♠</span>}
                />
              ) : undefined
            }
          />
        ))}
        {selectedAddOn && (
          <Line name={`+ ${selectedAddOn.naziv}`} value={formatBookingPrice(selectedAddOn.finalCena ?? selectedAddOn.originalCena)} />
        )}
        {pricing.hasDiscount && (
          <Line name={promotion?.naziv || t(language, 'discount')} value={`− ${formatBookingPrice(pricing.originalTotal - pricing.finalTotal)}`} accent />
        )}
      </div>

      {showEmployee && (
        <Section label={t(language, 'fieldSpecialist')} action={edit && <EditButton onClick={() => edit(3)} label={editLabel} />}>
          <div className="flex items-center gap-3">
            <Chip size={anyPerson || !employee?.slika_url ? 40 : 46} photo={anyPerson ? null : employee?.slika_url}>{anyPerson ? '♣' : employee?.initials ?? '♣'}</Chip>
            <div className="min-w-0">
              <p className="text-[16px] font-semibold" style={{ fontFamily: FONT_BODY, color: CREAM }}>
                {anyPerson ? t(language, 'anyoneAvailable') : employee?.label ?? '—'}
              </p>
              {!anyPerson && employee?.subtitle && (
                <p className="text-[13px]" style={{ fontFamily: FONT_BODY, color: FAINT }}>{employee.subtitle}</p>
              )}
            </div>
          </div>
        </Section>
      )}

      {customerDetails && (
        <Section label={t(language, 'guest')} action={edit && <EditButton onClick={() => edit(5)} label={editLabel} />}>
          <p className="text-[16px] font-semibold" style={{ fontFamily: FONT_BODY, color: CREAM }}>
            {customerDetails.firstName} {customerDetails.lastName}
          </p>
          <p className="mt-0.5 break-all text-[14px] leading-5" style={{ fontFamily: FONT_BODY, color: MUTED }}>
            {customerDetails.email}
            {customerDetails.phone ? ` · ${customerDetails.phone}` : ''}
          </p>
          {customerDetails.notes && (
            <p className="mt-2 rounded-[10px] px-3 py-2 text-[14px] italic leading-5" style={{ fontFamily: FONT_BODY, color: MUTED, background: 'rgba(255,255,255,0.04)' }}>
              “{customerDetails.notes}”
            </p>
          )}
        </Section>
      )}

      {/* Total */}
      {services.length > 0 && (
        <div className="flex items-end justify-between gap-4 px-5 py-5 sm:px-7" style={{ borderTop: `1px solid ${mix('--cx-glow', 25)}`, background: mix('--cx-a', 10) }}>
          <p className="cx-label pb-1.5" style={{ color: 'var(--cx-glow)' }}>{t(language, 'fieldTotal')}</p>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.6, ease: EASE }}
            className="text-right"
          >
            {pricing.hasDiscount && (
              <p className="text-[14px] line-through" style={{ fontFamily: FONT_BODY, color: FAINT }}>
                {formatBookingPrice(pricing.originalTotal)}
              </p>
            )}
            <p className="text-[32px] font-bold leading-none" style={{ fontFamily: FONT_HEAD, color: CREAM }}>
              {formatBookingPrice(pricing.finalTotal)}
            </p>
          </motion.div>
        </div>
      )}
    </div>
  );
}
