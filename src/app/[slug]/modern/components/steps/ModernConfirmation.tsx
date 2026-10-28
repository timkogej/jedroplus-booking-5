'use client';

import { useState } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { format } from 'date-fns';
import { sl } from 'date-fns/locale';
import { useBookingStore } from '@/store/bookingStore';
import { bookingErrorMessage, isSlotConflict, returnToTimeStep, startCheckout, submitCurrentBooking } from '@/lib/booking/submit';
import { useSlotRecheck } from '@/lib/booking/useSlotRecheck';
import { usePromotionsStore } from '@/store/promotionsStore';
import {
  formatBookingPrice,
  getBookingPricing,
  resolvePrimaryPromotion,
} from '@/lib/pricing';
import { t } from '../../i18n';
import { addBookingToCalendar } from '@/lib/booking/calendar';
import CancellationPolicy from '@/components/shared/CancellationPolicy';
import { shareBooking } from '@/lib/booking/share';


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
  const showEmployee = useBookingStore((s) => s.prikazZaposlenih);

  const [copied, setCopied] = useState(false);
  const selectedEmployee = employeesUI.find((e) => e.id === selectedEmployeeId);

  const services =
    selectedServices.length > 0
      ? selectedServices
      : selectedService
      ? [selectedService]
      : [];

  const totalDuration = services.reduce((sum, s) => sum + s.trajanjeMin, 0);

  const handleAddToCalendar = () => addBookingToCalendar();

  const handleShare = async () => {
    if ((await shareBooking()) === 'copied') {
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
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
            style={{ border: `2px solid ${theme.primarySolid}` }}
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
              style={{ color: 'var(--t-accent)' }}
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
            className="text-sm font-semibold first-cap"
            style={{ color: 'var(--t-accent)', fontFamily: 'var(--font-inter)' }}
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
            background: `linear-gradient(to right, ${theme.primarySolid}, ${theme.secondaryColor})`,
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
          {showEmployee && (anyPerson || selectedEmployee) && (
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
              <span className="modern-summary-value first-cap">{bookingConfirmation.datum}</span>
            </div>
          )}

          {/* Time */}
          {bookingConfirmation?.cas && (
            <div className="modern-summary-row">
              <span className="modern-summary-label">{t(language, 'fieldTime')}</span>
              <span
                className="modern-summary-value font-semibold"
                style={{ color: 'var(--t-accent)' }}
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
              style={{ color: 'var(--t-accent)' }}
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
            backgroundColor: theme.primarySolid,
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
  useSlotRecheck(companySlug);
  const {
    employeesUI,
    selectedEmployeeId,
    anyPerson,
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
  const showEmployee = useBookingStore((s) => s.prikazZaposlenih);

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
      const result = await submitCurrentBooking(companySlug);
      const { confirmation, serviceName } = result;
      const datumDisplay = format(selectedDate, 'd. MMMM yyyy', { locale: sl });

      if (confirmation.requiresPayment === true) {
        setRedirecting(true);

        try {
          await startCheckout(result, companySlug, 'modern', datumDisplay);
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
        message: confirmation.message || 'Rezervacija uspešna!',
        storitev: serviceName,
        datum: datumDisplay,
        cas: selectedTime,
      });
    } catch (err) {
      console.error('Modern booking: submit failed:', err);
      if (isSlotConflict(err)) {
        returnToTimeStep();
        return;
      }
      setError(bookingErrorMessage(err, t(language, 'bookingFailed')));
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
      value: showEmployee ? (anyPerson ? t(language, 'anyone') : selectedEmployee?.label) : undefined,
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
        ? `${selectedAddOn.naziv} (+${formatBookingPrice(selectedAddOn.finalCena ?? selectedAddOn.originalCena)})`
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
            background: `linear-gradient(to right, ${theme.primarySolid}, ${theme.secondaryColor})`,
          }}
        />

        <div className="px-5 py-2">
          {rows.map((row, i) => (
            <div key={i} className="modern-summary-row">
              <span className="modern-summary-label">{row.label}</span>
              <span
                className={`modern-summary-value ${String(row.value).includes('@') ? '' : 'first-cap'}`}
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
                    {formatBookingPrice(totalPrice)}
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
                  {formatBookingPrice(finalPrice)}
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
          backgroundColor: theme.primarySolid,
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
      <CancellationPolicy />
    </div>
  );
}
