'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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

const successItem = (i: number) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: i * 0.08, duration: 0.45, ease: 'easeOut' as const },
});

// ─── Success state ─────────────────────────────────────────────────────────
function SuccessView() {
  const {
    theme,
    language,
    bookingConfirmation,
    employeesUI,
    selectedEmployeeId,
    anyPerson,
    selectedService,
  } = useBookingStore();
  const showEmployee = useBookingStore((s) => s.prikazZaposlenih);
  const { activePromotion, serviceDiscounts, selectedAddOn } = usePromotionsStore();

  const [copied, setCopied] = useState(false);
  const selectedEmployee = employeesUI.find((e) => e.id === selectedEmployeeId);
  const services = selectedService ? [selectedService] : [];
  const promotion = resolvePrimaryPromotion(services, serviceDiscounts, activePromotion);
  const pricing = getBookingPricing(services, promotion, selectedAddOn);

  const handleAddToCalendar = () => addBookingToCalendar();

  const handleShare = async () => {
    if ((await shareBooking()) === 'copied') {
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-lg"
    >
      {/* Animated check circle */}
      <motion.div
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 180, damping: 18, delay: 0.1 }}
        className="mb-10 relative"
      >
        <svg width="80" height="80" viewBox="0 0 80 80" fill="none" className="overflow-visible">
          <motion.circle
            cx="40" cy="40" r="38"
            stroke={theme.primarySolid}
            strokeWidth="0.5"
            fill="none"
            initial={{ scale: 1, opacity: 0.4 }}
            animate={{ scale: 1.4, opacity: 0 }}
            transition={{ duration: 1.8, delay: 0.5, ease: 'easeOut' }}
            style={{ transformOrigin: '40px 40px' }}
          />
          <motion.circle
            cx="40" cy="40" r="38"
            stroke={theme.primarySolid}
            strokeWidth="0.5"
            fill="none"
            initial={{ scale: 1, opacity: 0.3 }}
            animate={{ scale: 1.7, opacity: 0 }}
            transition={{ duration: 2.2, delay: 0.7, ease: 'easeOut' }}
            style={{ transformOrigin: '40px 40px' }}
          />
          <circle
            cx="40" cy="40" r="38"
            stroke={`${theme.primaryColor}20`}
            strokeWidth="1"
            fill="none"
            className="circle-path"
          />
          <circle
            cx="40" cy="40" r="38"
            stroke={theme.primarySolid}
            strokeWidth="1.5"
            fill="none"
            className="circle-path"
          />
          <path
            d="M22 40L35 53L58 28"
            stroke={theme.primarySolid}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="check-path"
          />
        </svg>
      </motion.div>

      <motion.div {...successItem(0)} className="mb-3">
        <p
          className="magazine-caps text-[11px] tracking-[0.35em]"
          style={{ color: theme.primarySolid }}
        >
          {t(language, 'confirmed')}
        </p>
      </motion.div>

      <motion.h1
        {...successItem(1)}
        className="magazine-serif text-[2.5rem] md:text-[3rem] text-[#1A1A1A] tracking-[-0.02em] leading-[1.1] mb-3"
      >
        {t(language, 'successTitle')}<br />
        <span style={{ fontStyle: 'italic' }}>{t(language, 'successTitleItalic')}</span>
      </motion.h1>

      <motion.p
        {...successItem(2)}
        className="magazine-body text-[#6B6B6B] italic mb-10"
      >
        {t(language, 'successSubtitle')}
      </motion.p>

      {/* Details */}
      <motion.div {...successItem(3)}>
        <div className="h-[1px] bg-black/10 mb-6" />
        <div className="space-y-4">
          {showEmployee && (selectedEmployee || anyPerson) && (
            <div className="flex justify-between items-baseline">
              <p className="magazine-caps text-[8px] tracking-[0.18em] text-[#6B6B6B]">
                {t(language, 'specialist')}
              </p>
              <p className="magazine-body text-[14px] text-[#1A1A1A]">
                {selectedEmployee ? selectedEmployee.label : t(language, 'anyoneLabel')}
              </p>
            </div>
          )}
          {bookingConfirmation?.storitev && (
            <div className="flex justify-between items-baseline">
              <p className="magazine-caps text-[8px] tracking-[0.18em] text-[#6B6B6B]">
                {t(language, 'service')}
              </p>
              <p className="magazine-body text-[14px] text-[#1A1A1A]">
                {bookingConfirmation.storitev}
              </p>
            </div>
          )}
          {bookingConfirmation?.datum && (
            <div className="flex justify-between items-baseline">
              <p className="magazine-caps text-[8px] tracking-[0.18em] text-[#6B6B6B]">
                {t(language, 'date')}
              </p>
              <p className="magazine-body text-[14px] text-[#1A1A1A]">
                {bookingConfirmation.datum}
              </p>
            </div>
          )}
          {bookingConfirmation?.cas && (
            <div className="flex justify-between items-baseline">
              <p className="magazine-caps text-[8px] tracking-[0.18em] text-[#6B6B6B]">
                {t(language, 'time')}
              </p>
              <p className="magazine-body text-[14px] text-[#1A1A1A] tabular-nums">
                {bookingConfirmation.cas}
              </p>
            </div>
          )}
          {selectedService && (
            <div className="flex justify-between items-baseline">
              <p className="magazine-caps text-[8px] tracking-[0.18em] text-[#6B6B6B]">
                {t(language, 'price')}
              </p>
              <p
                className="magazine-serif text-[1.4rem] font-light tabular-nums"
                style={{ color: theme.primarySolid }}
              >
                {pricing.hasDiscount && (
                  <span className="block magazine-body text-[12px] text-[#6B6B6B] line-through">
                    {formatBookingPrice(pricing.originalTotal)}
                  </span>
                )}
                {formatBookingPrice(pricing.finalTotal)}
              </p>
            </div>
          )}
        </div>
        <div className="h-[1px] bg-black/10 mt-6" />
      </motion.div>

      {/* Action buttons */}
      <motion.div
        {...successItem(4)}
        className="mt-8 flex flex-wrap gap-3"
      >
        <motion.button
          onClick={handleAddToCalendar}
          className="flex items-center gap-2 px-6 py-3 text-white magazine-caps text-[9px] tracking-[0.18em] transition-opacity"
          style={{
            background: theme.primarySolid,
          }}
          whileHover={{ opacity: 0.9 }}
          whileTap={{ scale: 0.98 }}
        >
          {t(language, 'addToCalendar')}
        </motion.button>

        <motion.button
          onClick={handleShare}
          className="flex items-center gap-2 px-6 py-3 magazine-caps text-[9px] tracking-[0.18em] border transition-all duration-300"
          style={{ borderColor: theme.primarySolid, color: theme.primarySolid }}
          whileHover={{ backgroundColor: `${theme.primaryColor}08` }}
          whileTap={{ scale: 0.98 }}
        >
          {copied ? t(language, 'copied') : t(language, 'share')}
        </motion.button>

        <button
          onClick={startNewBooking}
          className="px-4 py-3 magazine-caps text-[9px] tracking-[0.18em] text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors duration-200"
        >
          {t(language, 'newBooking')}
        </button>
      </motion.div>
    </motion.div>
  );
}

// ─── Pre-confirmation (review) view ────────────────────────────────────────
export default function MagazineConfirmation({ companySlug }: Props) {
  useSlotRecheck(companySlug);
  const {
    theme,
    language,
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
        const datumDisplay = format(selectedDate, 'd. MMMM yyyy', { locale: sl });

        if (response.requiresPayment === true) {
          setRedirecting(true);

          try {
            await startCheckout(result, companySlug, 'magazine', datumDisplay);
            return;
          } catch (err) {
            console.error('Magazine booking: failed to start payment:', err);
            setRedirecting(false);
            setError(t(language, 'paymentStartFailed'));
            return;
          }
        }

        setBookingConfirmation({
          success: true,
          message: response.message || 'Rezervacija uspešna!',
          storitev: serviceName,
          datum: datumDisplay,
          cas: selectedTime,
        });
      } else {
        setError(response.message || t(language, 'bookingFailed'));
      }
    } catch (err) {
      console.error('Failed to submit booking:', err);
      if (isSlotConflict(err)) {
        returnToTimeStep();
        return;
      }
      setError(bookingErrorMessage(err, t(language, 'bookingFailed')));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-xl"
    >
      {/* Section header */}
      <div className="mb-10">
        <div className="w-8 h-[1px] mb-5" style={{ backgroundColor: theme.primarySolid }} />
        <h1 className="magazine-serif text-[2.5rem] md:text-[3rem] text-[#1A1A1A] tracking-[-0.02em] leading-[1.1] mb-4">
          {t(language, 'reviewTitle')}
        </h1>
        <div className="h-[1px] w-full bg-black/10 mb-4" />
        <p className="magazine-body text-[#6B6B6B] text-[15px] italic leading-relaxed">
          {t(language, 'reviewSubtitle')}
        </p>
      </div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 border-l-2 border-red-400 pl-4 py-2"
          >
            <p className="text-red-500 text-[13px]">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Summary details */}
      <div className="space-y-0 mb-10">
        <div className="h-[1px] bg-black/10" />

        {showEmployee && (selectedEmployee || anyPerson) && (
          <div className="flex items-start gap-4 py-5 border-b border-black/08">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 magazine-serif text-[11px]"
              style={{
                border: `1px solid ${theme.primaryColor}30`,
                color: theme.primarySolid,
                backgroundColor: `${theme.primaryColor}08`,
              }}
            >
              {selectedEmployee?.initials || '·'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="magazine-caps text-[8px] tracking-[0.18em] text-[#6B6B6B] mb-1">
                {t(language, 'specialist')}
              </p>
              <p className="magazine-serif text-[15px] text-[#1A1A1A]">
                {selectedEmployee ? selectedEmployee.label : t(language, 'anyoneLabel')}
              </p>
              {selectedEmployee?.subtitle && (
                <p className="magazine-caps text-[8px] tracking-[0.14em] text-[#6B6B6B] mt-0.5">
                  {selectedEmployee.subtitle}
                </p>
              )}
            </div>
          </div>
        )}

        {selectedService && (
          <div className="flex items-start gap-4 py-5 border-b border-black/08">
            <div
              className="w-8 h-8 flex items-center justify-center flex-shrink-0"
              style={{ color: `${theme.primaryColor}60` }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1" />
                <path d="M7 4V7.5L9.5 9" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="magazine-caps text-[8px] tracking-[0.18em] text-[#6B6B6B] mb-1">
                {t(language, 'service')}
              </p>
              <p className="magazine-serif text-[15px] text-[#1A1A1A] mb-0.5">
                {selectedService.naziv}
              </p>
              <p className="magazine-caps text-[8px] tracking-[0.14em] text-[#6B6B6B]">
                {formatDuration(selectedService.trajanjeMin)} · {formatBookingPrice(pricing.primaryFinalPrice)}
              </p>
              {selectedService.opis && (
                <p className="text-[#6B6B6B] text-[12px] mt-1 leading-relaxed">
                  {selectedService.opis}
                </p>
              )}
            </div>
          </div>
        )}

        {selectedDate && selectedTime && (
          <div className="flex items-start gap-4 py-5 border-b border-black/08">
            <div
              className="w-8 h-8 flex items-center justify-center flex-shrink-0 text-[11px] magazine-serif tabular-nums"
              style={{ color: `${theme.primaryColor}60` }}
            >
              {format(selectedDate, 'd')}
            </div>
            <div className="flex-1 min-w-0">
              <p className="magazine-caps text-[8px] tracking-[0.18em] text-[#6B6B6B] mb-1">
                {t(language, 'dateAndTime')}
              </p>
              <p className="magazine-serif text-[15px] text-[#1A1A1A]">
                {format(selectedDate, 'EEEE, d. MMMM yyyy', { locale: sl })}
              </p>
              <p
                className="magazine-body text-[13px] mt-0.5 tabular-nums"
                style={{ color: theme.primarySolid }}
              >
                {selectedTime}
              </p>
            </div>
          </div>
        )}

        {customerDetails && (
          <div className="flex items-start gap-4 py-5 border-b border-black/08">
            <div
              className="w-8 h-8 flex items-center justify-center flex-shrink-0"
              style={{ color: `${theme.primaryColor}60` }}
            >
              <svg width="12" height="14" viewBox="0 0 12 14" fill="none">
                <circle cx="6" cy="4" r="3" stroke="currentColor" strokeWidth="1" />
                <path d="M1 13c0-2.76 2.24-5 5-5s5 2.24 5 5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="magazine-caps text-[8px] tracking-[0.18em] text-[#6B6B6B] mb-1">
                {t(language, 'yourData')}
              </p>
              <p className="magazine-serif text-[15px] text-[#1A1A1A]">
                {customerDetails.firstName} {customerDetails.lastName}
              </p>
              <p className="text-[#6B6B6B] text-[12px] mt-0.5">{customerDetails.email}</p>
              <p className="text-[#6B6B6B] text-[12px]">{customerDetails.phone}</p>
              {customerDetails.notes && (
                <p className="magazine-body text-[12px] text-[#6B6B6B] mt-1.5 italic">
                  &ldquo;{customerDetails.notes}&rdquo;
                </p>
              )}
            </div>
          </div>
        )}

        {/* Total */}
        {selectedService && (
          <div className="flex justify-between items-baseline py-5">
            <p className="magazine-caps text-[8px] tracking-[0.2em] text-[#6B6B6B]">
              {t(language, 'total')}
            </p>
            <div className="text-right">
              {pricing.hasDiscount && (
                <p className="magazine-body text-[13px] text-[#6B6B6B] line-through tabular-nums">
                  {formatBookingPrice(pricing.originalTotal)}
                </p>
              )}
              <p
                className="magazine-serif text-[1.8rem] font-light tabular-nums"
                style={{ color: theme.primarySolid }}
              >
                {formatBookingPrice(pricing.finalTotal)}
              </p>
            </div>
          </div>
        )}
        {selectedAddOn && (
          <div className="flex justify-between items-baseline pb-2">
            <p className="magazine-caps text-[8px] tracking-[0.2em] text-[#6B6B6B]">
              {t(language, 'addon')}
            </p>
            <p className="magazine-body text-[13px] text-[#1A1A1A]">
              {selectedAddOn.naziv} (+{formatBookingPrice(selectedAddOn.finalCena ?? selectedAddOn.originalCena)})
            </p>
          </div>
        )}
      </div>

      {/* CTA */}
      <motion.button
        onClick={handleConfirm}
        disabled={isSubmitting}
        className="relative w-full md:w-auto px-12 py-4 text-white overflow-hidden transition-opacity"
        style={{
          // Was the page background (pale) under white text; the brand colour reads.
          background: theme.primarySolid,
        }}
        whileHover={{ opacity: isSubmitting ? 1 : 0.92, scale: isSubmitting ? 1 : 1.01 }}
        whileTap={{ scale: isSubmitting ? 1 : 0.99 }}
      >
        {/* Shine animation */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.15) 50%, transparent 60%)',
          }}
          initial={{ x: '-100%' }}
          whileHover={{ x: '100%' }}
          transition={{ duration: 0.55, ease: 'easeInOut' }}
        />

        {isSubmitting ? (
          <div className="flex items-center justify-center gap-3">
            <motion.div
              className="w-4 h-4 border border-white border-t-transparent rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
            />
            <span className="magazine-caps text-[10px] tracking-[0.2em]">
              {redirecting
                ? t(language, 'redirectingToPayment')
                : t(language, 'confirmingBtn')}
            </span>
          </div>
        ) : (
          <span className="magazine-serif text-lg italic">
            {t(language, 'confirmBtn')}
          </span>
        )}
      </motion.button>

      <p className="magazine-caps text-[9px] tracking-[0.18em] text-[#757575] mt-4">
        {t(language, 'emailNote')}
      </p>
      <CancellationPolicy className="!text-left text-[#757575]" />
    </motion.div>
  );
}
