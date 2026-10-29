'use client';

import { useState } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { format } from 'date-fns';
import { useBookingStore } from '@/store/bookingStore';
import { bookingErrorMessage, isSlotConflict, returnToTimeStep, startCheckout, submitCurrentBooking } from '@/lib/booking/submit';
import { useSlotRecheck } from '@/lib/booking/useSlotRecheck';
import { usePromotionsStore } from '@/store/promotionsStore';
import {
  formatBookingPrice,
  getBookingPricing,
  resolvePrimaryPromotion,
} from '@/lib/pricing';
import { dateLocale, datePattern, t } from '../../i18n';
import { addBookingToCalendar } from '@/lib/booking/calendar';
import CancellationPolicy from '@/components/shared/CancellationPolicy';
import { shareBooking } from '@/lib/booking/share';
import { startNewBooking } from '@/lib/booking/newBooking';

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
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: 'easeOut' as const },
  },
};

// ── Success view ──────────────────────────────────────────────
function SuccessView() {
  const {
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

  const handleAddToCalendar = () => addBookingToCalendar();

  const handleShare = async () => {
    if ((await shareBooking()) === 'copied') {
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  return (
    <div>
      {/* Success icon + heading */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1, duration: 0.4, ease: 'easeOut' as const }}
        className="text-center mb-8"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 250, damping: 20 }}
          className="w-16 h-16 rounded-full mx-auto mb-5 flex items-center justify-center"
          style={{
            backgroundColor: `${theme.primaryColor}12`,
            border: `2px solid ${theme.primaryColor}30`,
          }}
        >
          <span style={{ color: theme.primaryOnLight, fontSize: '1.5rem' }}>✓</span>
        </motion.div>

        <h2
          style={{
            fontFamily: 'var(--font-playfair)',
            fontSize: '2.1rem',
            fontWeight: 400,
            color: '#111111',
          }}
        >
          {t(language, 'bookingConfirmedTitle')}
        </h2>

        {selectedService && (
          <p
            className="mt-2"
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '0.9rem',
              color: '#6B7280',
            }}
          >
            {selectedService.naziv}
            {(anyPerson || selectedEmployee) && (
              <> {t(language, 'withSpecialist')} {anyPerson ? t(language, 'withAnyone') : selectedEmployee?.label}</>
            )}
          </p>
        )}

        {selectedDate && selectedTime && (
          <p
            className="mt-1 first-cap"
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '0.9rem',
              color: theme.primaryOnLight,
              fontWeight: 500,
            }}
          >
            {format(selectedDate, datePattern(language, 'd. MMMM yyyy'), { locale: dateLocale(language) })} {t(language, 'at')} {selectedTime}
          </p>
        )}
      </motion.div>

      {/* Confirmation card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.4 }}
        className="rounded-xl border overflow-hidden mb-6"
        style={{
          borderColor: '#E5E7EB',
          backgroundColor: 'white',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}
      >
        {/* Top accent line */}
        <div
          className="h-0.5"
          style={{ background: `linear-gradient(to right, ${theme.primarySolid}, ${theme.primaryColor}40)` }}
        />

        <div className="px-6 py-5">
          {customerDetails?.email && (
            <p
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: '0.875rem',
                color: '#6B7280',
                lineHeight: 1.6,
              }}
            >
              Potrditev smo poslali na{' '}
              <span className="font-medium" style={{ color: '#1F2937' }}>
                {customerDetails.email}
              </span>
            </p>
          )}
        </div>
      </motion.div>

      {/* Action buttons */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="space-y-3"
      >
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleAddToCalendar}
            className="py-3 rounded-xl border text-sm font-medium transition-colors"
            style={{
              fontFamily: 'var(--font-inter)',
              borderColor: '#E5E7EB',
              color: '#374151',
              backgroundColor: 'white',
            }}
          >
            {t(language, 'addToCalendar')}
          </button>
          <button
            onClick={handleShare}
            className="py-3 rounded-xl border text-sm font-medium transition-colors"
            style={{
              fontFamily: 'var(--font-inter)',
              borderColor: '#E5E7EB',
              color: '#374151',
              backgroundColor: 'white',
            }}
          >
            {copied ? '✓ Kopirano' : 'Deli'}
          </button>
        </div>

        <button
          onClick={startNewBooking}
          className="w-full py-4 rounded-xl text-white font-medium text-sm transition-opacity hover:opacity-90"
          style={{
            backgroundColor: theme.primarySolid,
            fontFamily: 'var(--font-inter)',
            boxShadow: `0 4px 14px ${theme.primaryColor}30`,
          }}
        >
          {t(language, 'newBooking')}
        </button>
      </motion.div>
    </div>
  );
}

// ── Pre-submit confirmation ───────────────────────────────────
export default function ElegantConfirmation({ companySlug }: Props) {
  useSlotRecheck(companySlug);
  const {
    employeesUI,
    selectedEmployeeId,
    anyPerson,
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
  const services = selectedService ? [selectedService] : [];
  const promotion = resolvePrimaryPromotion(services, serviceDiscounts, activePromotion);
  const pricing = getBookingPricing(services, promotion, selectedAddOn);

  if (bookingConfirmation?.success) {
    return <SuccessView />;
  }

  const handleConfirm = async () => {
    if (!companySlug || !selectedService || !selectedDate || !selectedTime || !customerDetails) {
      setError(t(language, 'missingData'));
      return;
    }
    setSubmitting(true);
    setError(null);

    try {
      const result = await submitCurrentBooking(companySlug);
      const response = result.confirmation;

      if (response.success) {
        const serviceName = result.serviceName;
        const datumDisplay = format(selectedDate, datePattern(language, 'd. MMMM yyyy'), { locale: dateLocale(language) });

        if (response.requiresPayment === true) {
          setRedirecting(true);

          try {
            await startCheckout(result, companySlug, 'elegant', datumDisplay);
            return;
          } catch (err) {
            console.error('Elegant booking: failed to start payment:', err);
            setRedirecting(false);
            setError(
              t(language, 'paymentStartFailed')
            );
            return;
          }
        }

        setBookingConfirmation({
          success: true,
          message: response.message || t(language, 'bookingSuccess'),
          storitev: serviceName,
          datum: datumDisplay,
          cas: selectedTime,
        });
      } else {
        setError(response.message || t(language, 'bookingFailed'));
      }
    } catch (err) {
      console.error('Elegant booking: submit failed:', err);
      if (isSlotConflict(err)) {
        returnToTimeStep();
        return;
      }
      setError(bookingErrorMessage(err, t(language, 'bookingFailedRetry')));
    } finally {
      setSubmitting(false);
    }
  };

  const rows = [
    { label: t(language, 'fieldService'), value: selectedService?.naziv },
    { label: t(language, 'fieldDuration'), value: selectedService ? formatDuration(selectedService.trajanjeMin) : undefined },
    { label: t(language, 'fieldSpecialist'), value: showEmployee ? (anyPerson ? t(language, 'anyoneAvailable') : selectedEmployee?.label) : undefined },
    {
      label: t(language, 'fieldDate'),
      value: selectedDate
        ? format(selectedDate, datePattern(language, 'EEEE, d. MMMM yyyy'), { locale: dateLocale(language) })
        : undefined,
    },
    { label: t(language, 'fieldTime'), value: selectedTime },
    {
      label: t(language, 'fieldName'),
      value: customerDetails
        ? `${customerDetails.firstName} ${customerDetails.lastName}`
        : undefined,
    },
    { label: t(language, 'fieldEmail'), value: customerDetails?.email },
    { label: t(language, 'fieldPhone'), value: customerDetails?.phone },
    { label: t(language, 'fieldAddOn'), value: selectedAddOn ? `${selectedAddOn.naziv} (+${formatBookingPrice(selectedAddOn.finalCena ?? selectedAddOn.originalCena)})` : undefined },
  ].filter((r) => r.value);

  return (
    <div>
      {/* Heading */}
      <motion.div variants={itemVariants} initial="hidden" animate="visible" className="mb-6">
        <h2
          style={{
            fontFamily: 'var(--font-playfair)',
            fontSize: '2.1rem',
            fontWeight: 400,
            color: '#111111',
            lineHeight: 1.2,
          }}
        >
          {t(language, 'confirmTitleA')} <span style={{ color: theme.primaryOnLight }}>{t(language, 'confirmTitleB')}</span>
        </h2>
        <p
          className="mt-2"
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '0.9rem',
            color: '#6B7280',
          }}
        >
          {t(language, 'confirmSubtitle')}
        </p>
      </motion.div>

      {/* Review card */}
      <motion.div
        variants={itemVariants}
        initial="hidden"
        animate="visible"
        className="rounded-xl border overflow-hidden mb-5"
        style={{
          borderColor: '#E5E7EB',
          backgroundColor: 'white',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}
      >
        {/* Top accent */}
        <div
          className="h-0.5"
          style={{ background: `linear-gradient(to right, ${theme.primarySolid}, ${theme.primaryColor}30)` }}
        />

        <div className="px-5 py-1">
          {rows.map((row, i) => (
            <div key={i} className="elegant-summary-row">
              <span className="elegant-summary-label">{row.label}</span>
              <span
                className={`elegant-summary-value ${String(row.value).includes('@') ? '' : 'first-cap'}`}
                style={{ maxWidth: '65%' }}
              >
                {row.value}
              </span>
            </div>
          ))}
        </div>

        {/* Divider + price */}
        {selectedService && (
          <>
            <div className="mx-5 border-t" style={{ borderColor: '#F3F4F6' }} />
            <div className="px-5 py-4 flex items-center justify-between">
              <span
                style={{
                  fontFamily: 'var(--font-inter)',
                  fontSize: '0.7rem',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: '#6B7280',
                }}
              >
                {t(language, 'total')}
              </span>
              <div className="text-right">
                {pricing.hasDiscount && (
                  <div style={{ fontFamily: 'var(--font-inter)', fontSize: '0.85rem', color: '#6B7280', textDecoration: 'line-through' }}>
                    {formatBookingPrice(pricing.originalTotal)}
                  </div>
                )}
                <span
                  style={{
                    fontFamily: 'var(--font-playfair)',
                    fontSize: '1.5rem',
                    fontWeight: 500,
                    color: '#111111',
                  }}
                >
                  {formatBookingPrice(pricing.finalTotal)}
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
            style={{
              backgroundColor: '#FEF2F2',
              border: '1px solid #FECACA',
            }}
          >
            <span style={{ color: '#EF4444', flexShrink: 0, fontSize: '1rem' }}>!</span>
            <p
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: '0.875rem',
                color: '#DC2626',
              }}
            >
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
        whileHover={!isSubmitting ? { opacity: 0.92 } : {}}
        whileTap={!isSubmitting ? { scale: 0.99 } : {}}
        className="w-full py-4 rounded-xl text-white font-medium transition-all relative overflow-hidden"
        style={{
          backgroundColor: theme.primarySolid,
          fontFamily: 'var(--font-inter)',
          fontSize: '0.975rem',
          cursor: isSubmitting ? 'not-allowed' : 'pointer',
          opacity: isSubmitting ? 0.8 : 1,
          boxShadow: `0 4px 16px ${theme.primaryColor}30`,
        }}
      >
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
                : t(language, 'sendingBooking')}
            </span>
          </div>
        ) : (
          t(language, 'confirmBooking')
        )}
      </motion.button>

      <p
        className="text-center mt-3"
        style={{
          fontFamily: 'var(--font-inter)',
          fontSize: '0.8rem',
          color: '#6B7280',
        }}
      >
        {t(language, 'confirmationByEmail')}
      </p>
      <CancellationPolicy />
    </div>
  );
}
