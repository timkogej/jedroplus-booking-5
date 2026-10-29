'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { sl } from 'date-fns/locale';
import { useBookingStore } from '@/store/bookingStore';
import { bookingErrorMessage, isSlotConflict, returnToTimeStep, startCheckout, submitCurrentBooking } from '@/lib/booking/submit';
import { useSlotRecheck } from '@/lib/booking/useSlotRecheck';
import { getContrastMode } from '../ClassicLayout';
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

// ── Confetti particles ────────────────────────────────────────────────────────
function SuccessParticles({ active }: { active: boolean }) {
  const [particles, setParticles] = useState<
    Array<{
      id: number;
      x: number;
      color: string;
      delay: number;
      duration: number;
      rotate: number;
    }>
  >([]);

  useEffect(() => {
    if (!active) return;
    const palette = [
      '#6D5EF7', '#2AD4C5', '#F59E0B', '#EC4899', '#10B981', '#3B82F6',
    ];
    const next = Array.from({ length: 22 }, (_, i) => ({
      id: i,
      x: 5 + Math.random() * 90,
      color: palette[Math.floor(Math.random() * palette.length)],
      delay: Math.random() * 0.5,
      duration: 1.4 + Math.random() * 1.0,
      rotate: Math.random() * 360,
    }));
    setParticles(next);
    const timer = setTimeout(() => setParticles([]), 3500);
    return () => clearTimeout(timer);
  }, [active]);

  if (!particles.length) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute w-2 h-2 rounded-sm"
          style={{
            left: `${p.x}%`,
            bottom: '0%',
            backgroundColor: p.color,
          }}
          initial={{ y: 0, opacity: 0, scale: 0, rotate: 0 }}
          animate={{
            y: -(160 + Math.random() * 320),
            opacity: [0, 1, 0.9, 0],
            scale: [0, 1, 0.7, 0],
            x: (Math.random() - 0.5) * 80,
            rotate: p.rotate,
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            ease: 'easeOut' as const,
          }}
        />
      ))}
    </div>
  );
}

// ── Success screen ────────────────────────────────────────────────────────────
function SuccessView({ primaryColor }: { primaryColor: string }) {
  const {
    bookingConfirmation,
    selectedServices,
    selectedService,
    selectedEmployeeId,
    anyPerson,
    employeesUI,
    customerDetails,
    language,
  } = useBookingStore();
  const showEmployee = useBookingStore((s) => s.prikazZaposlenih);
  const { activePromotion, serviceDiscounts, selectedAddOn } = usePromotionsStore();

  const [copied, setCopied] = useState(false);
  const [showParticles, setShowParticles] = useState(false);

  const services =
    selectedServices.length > 0
      ? selectedServices
      : selectedService
      ? [selectedService]
      : [];
  const totalDuration =
    services.reduce((s, sv) => s + sv.trajanjeMin, 0) +
    (selectedAddOn?.trajanjeMin ?? 0);
  const successPromotion = resolvePrimaryPromotion(
    services,
    serviceDiscounts,
    activePromotion
  );
  const successPricing = getBookingPricing(
    services,
    successPromotion,
    selectedAddOn
  );
  const selectedEmployee = employeesUI.find((e) => e.id === selectedEmployeeId);

  useEffect(() => {
    const t1 = setTimeout(() => setShowParticles(true), 250);
    const t2 = setTimeout(() => setShowParticles(false), 4000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const handleAddToCalendar = () => addBookingToCalendar();

  const handleShare = async () => {
    if ((await shareBooking()) === 'copied') {
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  const detailRows = [
    {
      label: t(language, 'fieldService'),
      value: services.map((s) => s.naziv).join(' + '),
    },
    {
      label: t(language, 'fieldSpecialist'),
      value: !showEmployee
        ? undefined
        : anyPerson
        ? t(language, 'anyone')
        : selectedEmployee?.label ?? undefined,
    },
    {
      label: t(language, 'fieldDate'),
      value: bookingConfirmation?.datum,
    },
    { label: t(language, 'fieldTime'), value: bookingConfirmation?.cas },
    {
      label: t(language, 'fieldDuration'),
      value: services.length > 0 ? formatDuration(totalDuration) : undefined,
    },
    {
      label: t(language, 'fieldName'),
      value: customerDetails
        ? `${customerDetails.firstName} ${customerDetails.lastName}`
        : undefined,
    },
  ].filter((r) => r.value);

  return (
    <>
      <SuccessParticles active={showParticles} />

      <div className="text-center py-2">
        {/* Success icon */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            delay: 0.15,
            type: 'spring',
            stiffness: 200,
            damping: 16,
          }}
          className="mb-5"
        >
          <div
            className="w-18 h-18 rounded-full mx-auto flex items-center justify-center"
            style={{
              width: 72,
              height: 72,
              background: `${primaryColor}12`,
              border: `2px solid ${primaryColor}30`,
              boxShadow: `0 0 0 8px ${primaryColor}07`,
            }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.45, type: 'spring', stiffness: 280 }}
            >
              <svg
                width="28"
                height="28"
                viewBox="0 0 28 28"
                fill="none"
                stroke={primaryColor}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 14l7 7 13-13" />
              </svg>
            </motion.div>
          </div>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="text-2xl font-bold text-gray-900 mb-1.5"
          style={{ fontFamily: 'var(--font-nunito)' }}
        >
          {t(language, 'bookingConfirmed')}
        </motion.h2>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-sm text-gray-500 mb-7"
          style={{ fontFamily: 'var(--font-nunito-sans)' }}
        >
          {t(language, 'emailSent')}
        </motion.p>

        {/* Confirmation card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.35 }}
          className="rounded-2xl overflow-hidden mb-6 text-left"
          style={{
            background: 'rgba(255,255,255,0.97)',
            boxShadow: `0 8px 28px rgba(0,0,0,0.09), 0 0 0 1px ${primaryColor}12`,
          }}
        >
          {/* Accent bar */}
          <div
            className="h-1"
            style={{
              background: `linear-gradient(90deg, ${primaryColor}, ${primaryColor}60)`,
            }}
          />

          <div className="px-5 py-4">
            {detailRows.map((row, i) => (
              <div
                key={i}
                className="flex items-start justify-between py-2.5"
                style={{
                  borderBottom:
                    i < detailRows.length - 1
                      ? '1px solid #F3F4F6'
                      : 'none',
                }}
              >
                <span
                  className="text-xs text-gray-500 uppercase tracking-wide font-medium flex-shrink-0"
                  style={{ fontFamily: 'var(--font-nunito-sans)' }}
                >
                  {row.label}
                </span>
                <span
                  className="text-sm font-semibold text-gray-800 text-right ml-4"
                  style={{
                    fontFamily: 'var(--font-nunito-sans)',
                    maxWidth: '62%',
                  }}
                >
                  {row.value}
                </span>
              </div>
            ))}
          </div>

          {/* Price footer */}
          {services.length > 0 && (
            <div
              className="px-5 py-3.5 flex items-center justify-between border-t"
              style={{
                borderColor: '#F3F4F6',
                background: `${primaryColor}04`,
              }}
            >
              <span
                className="text-sm text-gray-500"
                style={{ fontFamily: 'var(--font-nunito-sans)' }}
              >
                {t(language, 'total')}
              </span>
              <span
                className="text-2xl font-bold"
                style={{
                  fontFamily: 'var(--font-nunito)',
                  color: primaryColor,
                }}
              >
                {successPricing.promotion && (
                  <span
                    className="block text-sm line-through text-gray-300 mb-0.5"
                    style={{ fontFamily: 'var(--font-nunito-sans)' }}
                  >
                    {formatBookingPrice(successPricing.originalTotal)}
                  </span>
                )}
                {formatBookingPrice(successPricing.finalTotal)}
              </span>
            </div>
          )}
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.75 }}
          className="space-y-3"
        >
          <div className="flex gap-2.5">
            <button
              onClick={handleAddToCalendar}
              className="flex-1 py-3 rounded-2xl text-sm font-semibold transition-opacity hover:opacity-75"
              style={{
                fontFamily: 'var(--font-nunito)',
                border: `2px solid ${primaryColor}30`,
                color: primaryColor,
                background: `${primaryColor}08`,
              }}
            >
              {t(language, 'addToCalendar')}
            </button>
            <button
              onClick={handleShare}
              className="flex-1 py-3 rounded-2xl text-sm font-semibold transition-opacity hover:opacity-75"
              style={{
                fontFamily: 'var(--font-nunito)',
                border: `2px solid ${primaryColor}30`,
                color: primaryColor,
                background: `${primaryColor}08`,
              }}
            >
              {copied ? `✓ ${t(language, 'copied')}` : t(language, 'share')}
            </button>
          </div>

          <button
            onClick={startNewBooking}
            className="w-full py-3.5 rounded-2xl font-bold text-white transition-opacity hover:opacity-90"
            style={{
              fontFamily: 'var(--font-nunito)',
              backgroundColor: primaryColor,
              boxShadow: `0 6px 22px ${primaryColor}38`,
            }}
          >
            {t(language, 'newBooking')}
          </button>
        </motion.div>
      </div>
    </>
  );
}

// ── Pre-submit confirmation ────────────────────────────────────────────────────
export default function ClassicConfirmation({ companySlug }: Props) {
  useSlotRecheck(companySlug);
  const {
    theme,
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
    language,
  } = useBookingStore();
  const showEmployee = useBookingStore((s) => s.prikazZaposlenih);

  const contrastMode = getContrastMode(theme.bgFrom, theme.bgTo);
  const textPrimary =
    contrastMode === 'light' ? 'rgba(255,255,255,0.95)' : 'rgba(0,0,0,0.9)';
  const textSecondary =
    contrastMode === 'light' ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.55)';

  const { activePromotion, serviceDiscounts, selectedAddOn } = usePromotionsStore();
  const [error, setError] = useState<string | null>(null);
  const [redirecting, setRedirecting] = useState(false);

  const services =
    selectedServices.length > 0
      ? selectedServices
      : selectedService
      ? [selectedService]
      : [];

  const totalDuration = services.reduce((s, sv) => s + sv.trajanjeMin, 0);
  const promotion = resolvePrimaryPromotion(
    services,
    serviceDiscounts,
    activePromotion
  );
  const pricing = getBookingPricing(services, promotion, selectedAddOn);
  const baseTotalPrice = pricing.originalTotal;
  const finalPrice = pricing.finalTotal;

  const selectedEmployee = employeesUI.find((e) => e.id === selectedEmployeeId);

  if (bookingConfirmation?.success) {
    return <SuccessView primaryColor={theme.primarySolid} />;
  }

  const handleConfirm = async () => {
    if (
      !companySlug ||
      services.length === 0 ||
      !selectedDate ||
      !selectedTime ||
      !customerDetails
    ) {
      setError(t(language, 'missingData'));
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const result = await submitCurrentBooking(companySlug);
      const { confirmation, serviceName } = result;
      const datumDisplay = format(selectedDate, 'd. MMMM yyyy', { locale: sl });

      // Online payment required → redirect to Stripe Checkout (via POS).
      // The appointment is already created server-side as 'pending_payment'.
      if (confirmation.requiresPayment === true) {
        setRedirecting(true);
        try {
          await startCheckout(result, companySlug, 'classic', datumDisplay);
          // On success the browser navigates away to Stripe; nothing more to do.
          return;
        } catch (err) {
          console.error('Classic booking: failed to start payment:', err);
          setRedirecting(false);
          setError(t(language, 'paymentStartFailed'));
          return;
        }
      }

      // No payment required → show the existing confirmation/success screen.
      setBookingConfirmation({
        success: true,
        message: confirmation.message || t(language, 'bookingConfirmed'),
        storitev: serviceName,
        datum: datumDisplay,
        cas: selectedTime,
      });
    } catch (err) {
      console.error('Classic booking: submit failed:', err);
      if (isSlotConflict(err)) {
        returnToTimeStep();
        return;
      }
      setError(bookingErrorMessage(err, t(language, 'bookingFailed')));
    } finally {
      setSubmitting(false);
    }
  };

  // Build review rows
  const rows = [
    {
      label: t(language, 'fieldSpecialist'),
      value: !showEmployee
        ? undefined
        : anyPerson
        ? t(language, 'anyone')
        : selectedEmployee?.label,
    },
    {
      label: t(language, 'fieldService'),
      value:
        services.length > 0
          ? services.map((s) => s.naziv).join(' + ')
          : undefined,
    },
    {
      label: t(language, 'fieldDuration'),
      value: services.length > 0 ? formatDuration(totalDuration) : undefined,
    },
    {
      label: t(language, 'fieldDate'),
      value: selectedDate
        ? format(selectedDate, 'EEEE, d. MMMM yyyy', { locale: sl })
        : undefined,
    },
    { label: t(language, 'fieldTime'), value: selectedTime },
    {
      label: t(language, 'fieldName'),
      value: customerDetails
        ? `${customerDetails.firstName} ${customerDetails.lastName}`
        : undefined,
    },
    { label: t(language, 'emailLabel'), value: customerDetails?.email },
    { label: t(language, 'phoneLabel'), value: customerDetails?.phone },
    {
      label: t(language, 'fieldAddon'),
      value: selectedAddOn
        ? `${selectedAddOn.naziv} (+${formatBookingPrice(selectedAddOn.finalCena)})`
        : undefined,
    },
  ].filter((r) => r.value);

  return (
    <div>
      {/* Title */}
      <div className="mb-5">
        <h2
          className="text-3xl font-bold mb-1.5"
          style={{ fontFamily: 'var(--font-nunito)', color: textPrimary }}
        >
          {t(language, 'reviewBooking')}
        </h2>
        <p
          style={{
            fontFamily: 'var(--font-nunito-sans)',
            fontSize: '0.9rem',
            color: textSecondary,
          }}
        >
          {t(language, 'checkDetails')}
        </p>
      </div>

      {/* Review card */}
      <div
        className="rounded-2xl overflow-hidden mb-5"
        style={{
          background: 'rgba(255,255,255,0.97)',
          boxShadow: `0 4px 20px rgba(0,0,0,0.08), 0 0 0 1px ${theme.primaryColor}0D`,
        }}
      >
        {/* Accent bar */}
        <div
          className="h-1"
          style={{
            background: `linear-gradient(90deg, ${theme.primarySolid}, ${theme.primaryColor}55)`,
          }}
        />

        <div className="px-5 py-3">
          {rows.map((row, i) => (
            <div
              key={i}
              className="flex items-start justify-between py-2.5"
              style={{
                borderBottom:
                  i < rows.length - 1 ? '1px solid #F3F4F6' : 'none',
              }}
            >
              <span
                className="text-xs text-gray-500 uppercase tracking-wide font-medium flex-shrink-0"
                style={{ fontFamily: 'var(--font-nunito-sans)' }}
              >
                {row.label}
              </span>
              <span
                className={`text-sm font-semibold text-gray-800 text-right ml-4 ${String(row.value).includes('@') ? '' : 'first-cap'}`}
                style={{
                  fontFamily: 'var(--font-nunito-sans)',
                  maxWidth: '65%',
                }}
              >
                {row.value}
              </span>
            </div>
          ))}
        </div>

        {/* Price footer */}
        {services.length > 0 && (
          <div
            className="px-5 py-3.5 flex items-center justify-between border-t"
            style={{
              borderColor: '#F3F4F6',
              background: `${theme.primaryColor}04`,
            }}
          >
            <span
              className="text-sm text-gray-500"
              style={{ fontFamily: 'var(--font-nunito-sans)' }}
            >
              {t(language, 'total')}
            </span>
            <div className="text-right">
              {pricing.hasDiscount && (
                <p
                  className="text-sm line-through text-gray-300 mb-0.5"
                  style={{ fontFamily: 'var(--font-nunito-sans)' }}
                >
                  {formatBookingPrice(baseTotalPrice)}
                </p>
              )}
              <span
                className="text-2xl font-bold"
                style={{
                  fontFamily: 'var(--font-nunito)',
                  color: theme.primaryOnLight,
                }}
              >
                {formatBookingPrice(finalPrice)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-5 px-4 py-3.5 rounded-2xl flex items-center gap-3"
            style={{
              background: 'rgba(254,242,242,0.95)',
              border: '1px solid #FECACA',
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              stroke="#DC2626"
              strokeWidth="1.8"
              strokeLinecap="round"
              className="flex-shrink-0"
            >
              <circle cx="8" cy="8" r="7" />
              <path d="M8 5v3.5M8 11h.01" />
            </svg>
            <p
              className="text-sm text-red-600"
              style={{ fontFamily: 'var(--font-nunito-sans)' }}
            >
              {error}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirm CTA */}
      <div className="flex justify-center">
        <motion.button
          onClick={handleConfirm}
          disabled={isSubmitting || redirecting}
          className="w-full max-w-sm py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-2.5"
          style={{
            fontFamily: 'var(--font-nunito)',
            backgroundColor: isSubmitting || redirecting
              ? `${theme.primaryColor}70`
              : theme.primarySolid,
            boxShadow: isSubmitting || redirecting
              ? 'none'
              : `0 8px 24px ${theme.primaryColor}38`,
            cursor: isSubmitting || redirecting ? 'not-allowed' : 'pointer',
          }}
          whileHover={!isSubmitting && !redirecting ? { scale: 1.02 } : {}}
          whileTap={!isSubmitting && !redirecting ? { scale: 0.98 } : {}}
        >
          {isSubmitting || redirecting ? (
            <>
              <motion.span
                className="w-4 h-4 border-2 rounded-full block"
                style={{
                  borderColor: 'rgba(255,255,255,0.35)',
                  borderTopColor: '#ffffff',
                }}
                animate={{ rotate: 360 }}
                transition={{
                  duration: 0.65,
                  repeat: Infinity,
                  ease: 'linear' as const,
                }}
              />
              {redirecting
                ? t(language, 'redirectingToPayment')
                : t(language, 'confirmingSending')}
            </>
          ) : (
            <>
              {t(language, 'confirmBooking')}
              <span>→</span>
            </>
          )}
        </motion.button>
      </div>

      <p
        className="text-center mt-3 text-xs"
        style={{
          fontFamily: 'var(--font-nunito-sans)',
          color: textSecondary,
        }}
      >
        {t(language, 'confirmationSentEmail')}
      </p>
      <CancellationPolicy />
    </div>
  );
}
