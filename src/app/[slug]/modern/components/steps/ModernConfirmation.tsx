'use client';

import { useState } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { format } from 'date-fns';
import { sl } from 'date-fns/locale';
import { useBookingStore } from '@/store/bookingStore';
import { usePromotionsStore } from '@/store/promotionsStore';
import type { BookingConfirmation } from '@/types';
import {
  getBookingPricing,
  getPromotionPopustTip,
  resolvePrimaryPromotion,
} from '@/lib/pricing';
import { t } from '../../i18n';
import {
  buildCancelUrl,
  buildSuccessUrl,
  redirectToCheckout,
} from '@/lib/checkout';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_N8N_BOOKING_URL ||
  'https://n8n.jedroplus.com/webhook/booking-v2';

interface Props {
  companySlug?: string;
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: 'easeOut' as const },
  },
};

// ── Redesigned success screen ─────────────────────────────────────────────────
function SuccessView() {
  const {
    bookingConfirmation,
    selectedServices,
    selectedService,
    selectedDate,
    selectedTime,
    selectedEmployeeId,
    anyPerson,
    employeesUI,
    customerDetails,
    theme,
    language,
  } = useBookingStore();

  const [copied, setCopied] = useState(false);
  const selectedEmployee = employeesUI.find((e) => e.id === selectedEmployeeId);

  const services =
    selectedServices.length > 0
      ? selectedServices
      : selectedService
      ? [selectedService]
      : [];

  const totalDuration = services.reduce((sum, s) => sum + s.trajanjeMin, 0);

  const handleAddToCalendar = () => {
    if (!selectedDate || !selectedTime || services.length === 0) return;
    const [hours, minutes] = selectedTime.split(':').map(Number);
    const yr = selectedDate.getFullYear();
    const mo = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const dy = String(selectedDate.getDate()).padStart(2, '0');
    const hh = String(hours).padStart(2, '0');
    const mm = String(minutes).padStart(2, '0');
    const totalMin = hours * 60 + minutes + totalDuration;
    const endH = String(Math.floor(totalMin / 60) % 24).padStart(2, '0');
    const endM = String(totalMin % 60).padStart(2, '0');
    const summary = services.map((s) => s.naziv).join(' + ');
    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Jedro+//Booking//SL',
      'BEGIN:VEVENT',
      `DTSTART:${yr}${mo}${dy}T${hh}${mm}00`,
      `DTEND:${yr}${mo}${dy}T${endH}${endM}00`,
      `SUMMARY:${summary}`,
      `DESCRIPTION:Rezervacija: ${summary}`,
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'rezervacija.ics';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    const text = `${t(language, 'bookingConfirmed')}\n${services.map((s) => s.naziv).join(' + ')}\n${bookingConfirmation?.datum} ob ${bookingConfirmation?.cas}`;
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: t(language, 'bookingConfirmed'), text });
      } catch { /* cancelled */ }
    } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2200);
      } catch { /* unavailable */ }
    }
  };

  return (
    <div className="max-w-md mx-auto">
      {/* ── Hero — success icon + title ── */}
      <div className="text-center mb-8">
        <div className="relative w-24 h-24 mx-auto mb-6">
          {/* Outer pulse ring */}
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{ border: `2px solid ${theme.primaryColor}40` }}
            initial={{ scale: 1, opacity: 0.6 }}
            animate={{ scale: 1.6, opacity: 0 }}
            transition={{ delay: 0.5, duration: 1.4, repeat: 2 }}
          />
          {/* Main ring */}
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{ border: `2px solid ${theme.primaryColor}` }}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 220, damping: 18 }}
          />
          {/* Filled circle with checkmark */}
          <motion.div
            className="absolute inset-0 rounded-full flex items-center justify-center"
            style={{ backgroundColor: `${theme.primaryColor}1A` }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 280, damping: 20 }}
          >
            <svg
              className="w-10 h-10"
              style={{ color: theme.primaryColor }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <motion.path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M5 13l4 4L19 7"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ delay: 0.4, duration: 0.5, ease: 'easeOut' as const }}
              />
            </svg>
          </motion.div>
        </div>

        <motion.h2
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.4 }}
          className="mb-3"
          style={{
            color: 'var(--t-primary)',
            fontFamily: 'var(--font-clash)',
            fontWeight: 400,
            fontSize: 'clamp(2.25rem, 6vw, 4rem)',
            letterSpacing: '-0.02em',
            lineHeight: 1.05,
          }}
        >
          {t(language, 'bookingConfirmed')}
        </motion.h2>

        {selectedDate && selectedTime && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-sm font-semibold capitalize"
            style={{ color: theme.primaryColor, fontFamily: 'var(--font-inter)' }}
          >
            {format(selectedDate, 'd. MMMM yyyy', { locale: sl })} ob {selectedTime}
          </motion.p>
        )}
      </div>

      {/* ── Booking summary card ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.4 }}
        className="rounded-2xl overflow-hidden mb-5 modern-glass"
        style={{
          backgroundColor: 'var(--s2)',
          border: '1px solid var(--b2)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
      >
        {/* Gradient accent bar */}
        <div
          className="h-1"
          style={{
            background: `linear-gradient(to right, ${theme.primaryColor}, ${theme.secondaryColor})`,
          }}
        />

        <div className="px-5 py-2">
          {/* Services */}
          {services.length > 0 && (
            <div className="modern-summary-row">
              <span className="modern-summary-label">{t(language, 'fieldService')}</span>
              <span className="modern-summary-value" style={{ maxWidth: '65%' }}>
                {services.map((s) => s.naziv).join(' + ')}
              </span>
            </div>
          )}

          {/* Duration */}
          {services.length > 0 && (
            <div className="modern-summary-row">
              <span className="modern-summary-label">{t(language, 'fieldDuration')}</span>
              <span className="modern-summary-value">{formatDuration(totalDuration)}</span>
            </div>
          )}

          {/* Specialist */}
          {(anyPerson || selectedEmployee) && (
            <div className="modern-summary-row">
              <span className="modern-summary-label">{t(language, 'fieldSpecialist')}</span>
              <span className="modern-summary-value">
                {anyPerson ? t(language, 'anyone') : selectedEmployee?.label}
              </span>
            </div>
          )}

          {/* Date */}
          {bookingConfirmation?.datum && (
            <div className="modern-summary-row">
              <span className="modern-summary-label">{t(language, 'fieldDate')}</span>
              <span className="modern-summary-value capitalize">{bookingConfirmation.datum}</span>
            </div>
          )}

          {/* Time */}
          {bookingConfirmation?.cas && (
            <div className="modern-summary-row">
              <span className="modern-summary-label">{t(language, 'fieldTime')}</span>
              <span
                className="modern-summary-value font-semibold"
                style={{ color: theme.primaryColor }}
              >
                {bookingConfirmation.cas}
              </span>
            </div>
          )}
        </div>

        {/* Email confirmation footer */}
        {customerDetails?.email && (
          <div
            className="px-5 py-4 flex items-center gap-3 border-t"
            style={{
              borderColor: 'var(--b1)',
              backgroundColor: `${theme.primaryColor}08`,
            }}
          >
            <svg
              className="w-4 h-4 flex-shrink-0"
              style={{ color: theme.primaryColor }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M3 8l7.89 4.89a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            <p
              className="text-sm"
              style={{ color: 'var(--t-muted)', fontFamily: 'var(--font-inter)' }}
            >
              {t(language, 'emailSent')}{' '}
              <span className="font-semibold" style={{ color: 'var(--t-soft)' }}>
                {customerDetails.email}
              </span>
            </p>
          </div>
        )}
      </motion.div>

      {/* ── Actions ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.65 }}
        className="space-y-3"
      >
        <div className="grid grid-cols-2 gap-3">
          <motion.button
            onClick={handleAddToCalendar}
            className="py-3.5 rounded-xl text-sm font-medium modern-glass flex items-center justify-center gap-2"
            style={{
              fontFamily: 'var(--font-inter)',
              backgroundColor: 'var(--s2)',
              border: '1px solid var(--b2)',
              color: 'var(--t-soft)',
            }}
            whileHover={{ scale: 1.02, backgroundColor: 'var(--s2h)' }}
            whileTap={{ scale: 0.97 }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            {t(language, 'addToCalendar')}
          </motion.button>

          <motion.button
            onClick={handleShare}
            className="py-3.5 rounded-xl text-sm font-medium modern-glass flex items-center justify-center gap-2"
            style={{
              fontFamily: 'var(--font-inter)',
              backgroundColor: 'var(--s2)',
              border: '1px solid var(--b2)',
              color: 'var(--t-soft)',
            }}
            whileHover={{ scale: 1.02, backgroundColor: 'var(--s2h)' }}
            whileTap={{ scale: 0.97 }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
              />
            </svg>
            {copied ? t(language, 'copied') : t(language, 'share')}
          </motion.button>
        </div>

        <motion.button
          onClick={() => {
            usePromotionsStore.getState().resetSelections();
            window.location.reload();
          }}
          className="w-full py-4 rounded-2xl text-white font-semibold text-sm relative overflow-hidden"
          style={{
            backgroundColor: theme.primaryColor,
            fontFamily: 'var(--font-inter)',
            boxShadow: `0 8px 28px ${theme.primaryColor}40`,
          }}
          whileHover={{ scale: 1.02, boxShadow: `0 12px 36px ${theme.primaryColor}50` }}
          whileTap={{ scale: 0.98 }}
        >
          <motion.div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
              backgroundSize: '200% 100%',
            }}
            animate={{ backgroundPosition: ['-100% 0', '200% 0'] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 2.5 }}
          />
          {t(language, 'newBooking')}
        </motion.button>
      </motion.div>
    </div>
  );
}

// ── Pre-submit confirmation review ────────────────────────────────────────────
export default function ModernConfirmation({ companySlug }: Props) {
  const {
    employeesUI,
    selectedEmployeeId,
    anyPerson,
    eligibleEmployeeIds,
    selectedServices,
    selectedService,
    selectedDate,
    selectedTime,
    customerDetails,
    bookingConfirmation,
    isSubmitting,
    setSubmitting,
    setBookingConfirmation,
    theme,
    language,
  } = useBookingStore();

  const { activePromotion, serviceDiscounts, selectedAddOn } = usePromotionsStore();
  const [error, setError] = useState<string | null>(null);
  const [redirecting, setRedirecting] = useState(false);
  const selectedEmployee = employeesUI.find((e) => e.id === selectedEmployeeId);

  if (bookingConfirmation?.success) {
    return <SuccessView />;
  }

  // Resolve services — multi-service or legacy single
  const services =
    selectedServices.length > 0
      ? selectedServices
      : selectedService
      ? [selectedService]
      : [];
  const totalDuration = services.reduce((sum, s) => sum + s.trajanjeMin, 0);
  const promotion = resolvePrimaryPromotion(
    services,
    serviceDiscounts,
    activePromotion
  );
  const pricing = getBookingPricing(services, promotion, selectedAddOn);
  const totalPrice = pricing.originalTotal;
  const finalPrice = pricing.finalTotal;

  const handleConfirm = async () => {
    if (!companySlug || services.length === 0 || !selectedDate || !selectedTime || !customerDetails) {
      setError(t(language, 'missingData'));
      return;
    }
    setSubmitting(true);
    setError(null);

    try {
      const body: Record<string, unknown> = {
        action: 'create',
        companySlug,
        date: format(selectedDate, 'yyyy-MM-dd'),
        time: selectedTime,
        serviceIds: services.map((s) => s.id),
        employeeId: selectedEmployeeId,
        any_person: anyPerson,
        eligibleEmployeeIds,
        resursiIds: [],
        firstName: customerDetails.firstName,
        lastName: customerDetails.lastName,
        email: customerDetails.email,
        phone: customerDetails.phone,
        gender: customerDetails.gender ?? '',
        notes: customerDetails.notes ?? '',
        privacy_consent: customerDetails.privacyConsent ?? false,
        marketing_consent: customerDetails.gdprSendMarketing ?? false,
        consent_timestamp: new Date().toISOString(),
        language,
        originalCena: totalPrice,
        finalCena: finalPrice,
      };

      if (promotion) {
        body.promocijaTip = promotion.type;
        body.promocijaNaziv = promotion.naziv;
        body.popust = pricing.discountAmount;
        body.popustTip = getPromotionPopustTip(promotion);
        if (promotion.type === 'popust') body.popust_id = promotion.id;
        if (promotion.type === 'happy_hour') body.happy_hour_id = promotion.id;
      }

      if (selectedAddOn) {
        body.addOnServiceId = selectedAddOn.id;
        body.addOnNaziv = selectedAddOn.naziv;
        body.addOnFinalCena = selectedAddOn.finalCena;
        body.addOnOriginalCena = selectedAddOn.originalCena;
        body.addOnPopust = selectedAddOn.popustZnesek;
        body.addOnPopustTip = selectedAddOn.tipPopusta === 'percentage' ? '%' : 'valuta';
        body.addOnTrajanjeMin = selectedAddOn.trajanjeMin;
      }

      const response = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`Booking failed: ${response.status}`);
      }

      const text = await response.text();
      let parsed: Record<string, unknown> = {};
      if (text && text.trim()) {
        try { parsed = JSON.parse(text); } catch { /* treat as success */ }
      }

      if (parsed.success === false) {
        const msg = (parsed.message as string) || t(language, 'bookingFailed');
        setError(msg);
        return;
      }

      const confirmation = parsed as unknown as BookingConfirmation;
      const serviceName =
        confirmation.storitev || services.map((s) => s.naziv).join(' + ');
      const datumDisplay = format(selectedDate, 'd. MMMM yyyy', { locale: sl });

      if (confirmation.requiresPayment === true) {
        const appointmentId = String(
          confirmation.terminRowId ??
            confirmation.terminId ??
            confirmation.stripe?.terminId ??
            ''
        );
        setRedirecting(true);

        try {
          await redirectToCheckout({
            companySlug,
            appointmentId,
            amount:
              confirmation.paymentAmount ?? confirmation.stripe?.amount ?? finalPrice,
            currency: confirmation.currency ?? confirmation.stripe?.currency ?? 'EUR',
            serviceName,
            customerEmail: customerDetails.email,
            customerName: `${customerDetails.firstName} ${customerDetails.lastName}`,
            language,
            paymentMode:
              confirmation.paymentMode ?? confirmation.stripe?.paymentMode ?? 'full',
            successUrl: buildSuccessUrl(companySlug, 'modern', {
              lang: language,
              serviceName,
              date: confirmation.datum || datumDisplay,
              time: confirmation.cas || selectedTime,
            }),
            cancelUrl: buildCancelUrl(companySlug, 'modern'),
          });
          return;
        } catch (err) {
          console.error('Modern booking: failed to start payment:', err);
          setRedirecting(false);
          setError(t(language, 'paymentStartFailed'));
          return;
        }
      }

      setBookingConfirmation({
        success: true,
        message: (parsed.message as string) || 'Rezervacija uspešna!',
        storitev: serviceName,
        datum: datumDisplay,
        cas: selectedTime,
      });
    } catch (err) {
      console.error('Modern booking: submit failed:', err);
      setError(t(language, 'bookingFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  const rows = [
    {
      label: t(language, 'fieldService'),
      value: services.length > 0 ? services.map((s) => s.naziv).join(' + ') : undefined,
    },
    {
      label: t(language, 'fieldDuration'),
      value: services.length > 0 ? formatDuration(totalDuration) : undefined,
    },
    {
      label: t(language, 'fieldSpecialist'),
      value: anyPerson ? t(language, 'anyone') : selectedEmployee?.label,
    },
    {
      label: t(language, 'fieldDate'),
      value: selectedDate ? format(selectedDate, 'EEEE, d. MMMM yyyy', { locale: sl }) : undefined,
    },
    { label: t(language, 'fieldTime'), value: selectedTime ?? undefined },
    {
      label: t(language, 'fieldName'),
      value: customerDetails
        ? `${customerDetails.firstName} ${customerDetails.lastName}`
        : undefined,
    },
    { label: 'Email', value: customerDetails?.email },
    { label: t(language, 'phoneLabel'), value: customerDetails?.phone },
    {
      label: t(language, 'fieldAddon'),
      value: selectedAddOn
        ? `${selectedAddOn.naziv} (+${Number(selectedAddOn.finalCena ?? selectedAddOn.originalCena).toFixed(2).replace('.', ',')} €)`
        : undefined,
    },
  ].filter((r) => r.value);

  return (
    <div>
      {/* Heading */}
      <motion.div variants={itemVariants} initial="hidden" animate="visible" className="mb-8">
        <h2
          className="mb-2"
          style={{
            color: 'var(--t-primary)',
            fontFamily: 'var(--font-clash)',
            fontWeight: 400,
            fontSize: 'clamp(2rem, 5vw, 3.25rem)',
            letterSpacing: '-0.015em',
            lineHeight: 1.1,
          }}
        >
          {t(language, 'reviewBooking')}
        </h2>
        <p className="text-sm" style={{ color: 'var(--t-muted)', fontFamily: 'var(--font-inter)' }}>
          {t(language, 'checkDetails')}
        </p>
      </motion.div>

      {/* Summary card */}
      <motion.div
        variants={itemVariants}
        initial="hidden"
        animate="visible"
        className="rounded-2xl overflow-hidden mb-5 modern-glass"
        style={{
          backgroundColor: 'var(--s2)',
          border: '1px solid var(--b2)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
      >
        <div
          className="h-1"
          style={{
            background: `linear-gradient(to right, ${theme.primaryColor}, ${theme.secondaryColor})`,
          }}
        />

        <div className="px-5 py-2">
          {rows.map((row, i) => (
            <div key={i} className="modern-summary-row">
              <span className="modern-summary-label">{row.label}</span>
              <span
                className="modern-summary-value capitalize"
                style={{ maxWidth: '65%' }}
              >
                {row.value}
              </span>
            </div>
          ))}
        </div>

        {/* Price total */}
        {services.length > 0 && (
          <>
            <div className="mx-5 h-px" style={{ backgroundColor: 'var(--b1)' }} />
            <div className="px-5 py-4 flex items-center justify-between">
              <span
                className="text-xs font-semibold tracking-widest uppercase"
                style={{ color: 'var(--t-faint)', fontFamily: 'var(--font-inter)' }}
              >
                {t(language, 'total')}
              </span>
              <div className="text-right">
                {pricing.hasDiscount && (
                  <div
                    className="text-sm line-through"
                    style={{ color: 'var(--t-faint)', fontFamily: 'var(--font-inter)' }}
                  >
                    €{totalPrice}
                  </div>
                )}
                <span
                  style={{
                    color: 'var(--t-primary)',
                    fontFamily: 'var(--font-clash)',
                    fontWeight: 500,
                    fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
                    letterSpacing: '-0.01em',
                  }}
                >
                  €{finalPrice}
                </span>
              </div>
            </div>
          </>
        )}
      </motion.div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-5 px-4 py-3 rounded-xl flex items-center gap-3"
            style={{ backgroundColor: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)' }}
          >
            <span style={{ color: '#FCA5A5', flexShrink: 0, fontSize: '1rem' }}>!</span>
            <p className="text-sm" style={{ color: '#FCA5A5', fontFamily: 'var(--font-inter)' }}>
              {error}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirm CTA */}
      <motion.button
        variants={itemVariants}
        initial="hidden"
        animate="visible"
        onClick={handleConfirm}
        disabled={isSubmitting}
        className="w-full py-4 rounded-2xl text-white font-semibold relative overflow-hidden"
        style={{
          backgroundColor: theme.primaryColor,
          fontFamily: 'var(--font-inter)',
          fontSize: '0.975rem',
          cursor: isSubmitting ? 'not-allowed' : 'pointer',
          opacity: isSubmitting ? 0.8 : 1,
          boxShadow: `0 8px 28px ${theme.primaryColor}40`,
        }}
        whileHover={!isSubmitting ? { scale: 1.02, boxShadow: `0 12px 36px ${theme.primaryColor}50` } : {}}
        whileTap={!isSubmitting ? { scale: 0.98 } : {}}
      >
        {!isSubmitting && (
          <motion.div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
              backgroundSize: '200% 100%',
            }}
            animate={{ backgroundPosition: ['-100% 0', '200% 0'] }}
            transition={{ duration: 2.2, repeat: Infinity, repeatDelay: 2.5 }}
          />
        )}
        {isSubmitting ? (
          <div className="flex items-center justify-center gap-3">
            <motion.div
              className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' as const }}
            />
            <span>
              {redirecting
                ? t(language, 'redirectingToPayment')
                : t(language, 'confirmingSending')}
            </span>
          </div>
        ) : (
          t(language, 'confirmBooking')
        )}
      </motion.button>

      <p
        className="text-center mt-3 text-xs"
        style={{ color: 'var(--t-faint)', fontFamily: 'var(--font-inter)' }}
      >
        {t(language, 'confirmationSentEmail')}
      </p>
    </div>
  );
}
