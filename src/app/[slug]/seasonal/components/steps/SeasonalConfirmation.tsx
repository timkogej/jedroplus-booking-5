'use client';

import { useState } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { format } from 'date-fns';
import { sl } from 'date-fns/locale';
import { useBookingStore } from '@/store/bookingStore';
import { submitBooking } from '@/lib/api';
import type { SeasonalTheme } from '../decorations/SeasonDetector';
import { usePromotionsStore } from '@/store/promotionsStore';
import {
  formatBookingPrice,
  getBookingPricing,
  getPromotionPopustTip,
  resolvePrimaryPromotion,
} from '@/lib/pricing';
import {
  buildCancelUrl,
  buildSuccessUrl,
  redirectToCheckout,
} from '@/lib/checkout';

interface Props {
  companySlug?: string;
  seasonalTheme: SeasonalTheme;
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' as const } },
};

// ── Elegant success screen ────────────────────────────────────
function SuccessView({ seasonalTheme }: { seasonalTheme: SeasonalTheme }) {
  const {
    bookingConfirmation,
    selectedService,
    selectedDate,
    selectedTime,
    selectedEmployeeId,
    anyPerson,
    employeesUI,
    customerDetails,
    theme,
    language,
    reset,
  } = useBookingStore();

  const [copied, setCopied] = useState(false);
  const selectedEmployee = employeesUI.find((e) => e.id === selectedEmployeeId);

  const successEmoji = (() => {
    const { holiday, season } = seasonalTheme;
    if (holiday === 'christmas') return '🎄';
    if (holiday === 'newyear') return '🎉';
    if (holiday === 'valentine') return '💕';
    if (holiday === 'easter') return '🐣';
    if (holiday === 'halloween') return '🎃';
    if (season === 'spring') return '🌸';
    if (season === 'summer') return '☀️';
    if (season === 'autumn') return '🍁';
    return '❄️';
  })();

  const handleAddToCalendar = () => {
    if (!selectedDate || !selectedTime || !selectedService) return;
    const [hours, minutes] = selectedTime.split(':').map(Number);
    const yr = selectedDate.getFullYear();
    const mo = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const dy = String(selectedDate.getDate()).padStart(2, '0');
    const hh = String(hours).padStart(2, '0');
    const mm = String(minutes).padStart(2, '0');
    const totalMin = hours * 60 + minutes + selectedService.trajanjeMin;
    const endH = String(Math.floor(totalMin / 60) % 24).padStart(2, '0');
    const endM = String(totalMin % 60).padStart(2, '0');
    const ics = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Jedro+//Booking//SL',
      'BEGIN:VEVENT',
      `DTSTART:${yr}${mo}${dy}T${hh}${mm}00`,
      `DTEND:${yr}${mo}${dy}T${endH}${endM}00`,
      `SUMMARY:${selectedService.naziv}`,
      `DESCRIPTION:Rezervacija storitve ${selectedService.naziv}`,
      'END:VEVENT', 'END:VCALENDAR',
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
    const text = `${language === 'en' ? 'My booking' : 'Moja rezervacija'}:\n${bookingConfirmation?.storitev}\n${bookingConfirmation?.datum} ${language === 'en' ? 'at' : 'ob'} ${bookingConfirmation?.cas}`;
    if (typeof navigator !== 'undefined' && navigator.share) {
      try { await navigator.share({ title: language === 'en' ? 'Booking confirmed' : 'Rezervacija potrjena', text }); } catch { /* cancelled */ }
    } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2200);
      } catch { /* unavailable */ }
    }
  };

  const handleNewBooking = () => {
    usePromotionsStore.getState().resetSelections();
    reset();
    if (typeof window !== 'undefined') window.location.reload();
  };

  const t = {
    confirmed: language === 'en' ? 'Booking confirmed!' : 'Rezervacija potrjena!',
    with: language === 'en' ? 'with' : 'z',
    anyExpert: language === 'en' ? 'any available expert' : 'razpoložljivim specialistom',
    sentTo: language === 'en' ? 'We sent a confirmation to' : 'Potrditev smo poslali na',
    addToCalendar: language === 'en' ? 'Add to calendar' : 'Dodaj v koledar',
    share: language === 'en' ? 'Share' : 'Deli',
    copied: language === 'en' ? '✓ Copied' : '✓ Kopirano',
    newBooking: language === 'en' ? 'New booking' : 'Nova rezervacija',
  };

  return (
    <div>
      {/* Success hero */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.45, ease: 'easeOut' as const }}
        className="text-center mb-7"
      >
        {/* Animated check ring */}
        <div className="relative w-20 h-20 mx-auto mb-5">
          {/* Outer pulse ring */}
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{ border: `2px solid ${theme.primaryColor}20` }}
            initial={{ scale: 1 }}
            animate={{ scale: [1, 1.55, 1], opacity: [0.7, 0, 0.7] }}
            transition={{ duration: 2.5, repeat: 3, ease: 'easeOut' as const }}
          />
          {/* Middle ring */}
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{ border: `1.5px solid ${theme.primaryColor}` }}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.12, type: 'spring', stiffness: 240, damping: 18 }}
          />
          {/* Inner filled circle with emoji */}
          <motion.div
            className="absolute inset-0 rounded-full flex items-center justify-center"
            style={{ backgroundColor: `${theme.primaryColor}14` }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 320, damping: 18 }}
          >
            <motion.span
              className="text-3xl leading-none"
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.32, type: 'spring', stiffness: 400, damping: 20 }}
            >
              {successEmoji}
            </motion.span>
          </motion.div>
        </div>

        <motion.h2
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28, duration: 0.38 }}
          className="text-2xl font-bold mb-2 text-gray-900"
          style={{ fontFamily: 'var(--font-stardom, serif)' }}
        >
          {t.confirmed}
        </motion.h2>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.42 }}
        >
          {selectedService && (
            <p className="text-sm text-gray-500 mb-0.5" style={{ fontFamily: 'var(--font-inter)' }}>
              {selectedService.naziv}
              {(anyPerson || selectedEmployee) && (
                <> {t.with} {anyPerson ? t.anyExpert : selectedEmployee?.label}</>
              )}
            </p>
          )}
          {selectedDate && selectedTime && (
            <p className="font-semibold text-sm capitalize" style={{ color: theme.primaryColor, fontFamily: 'var(--font-inter)' }}>
              {format(selectedDate, 'd. MMMM yyyy', { locale: sl })} {language === 'en' ? 'at' : 'ob'} {selectedTime}
            </p>
          )}
        </motion.div>
      </motion.div>

      {/* Confirmation email card */}
      {customerDetails?.email && (
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.36 }}
          className="rounded-2xl mb-5 overflow-hidden"
          style={{
            background: '#FAFAFA',
            border: '1px solid rgba(0,0,0,0.07)',
          }}
        >
          {/* Accent top line */}
          <div className="h-0.5" style={{ background: `linear-gradient(to right, ${theme.primaryColor}, ${theme.secondaryColor ?? theme.primaryColor}80)` }} />
          <div className="px-5 py-4 flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: `${theme.primaryColor}12` }}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke={theme.primaryColor} strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed" style={{ fontFamily: 'var(--font-inter)' }}>
              {t.sentTo}{' '}
              <span className="font-semibold text-gray-800">{customerDetails.email}</span>
            </p>
          </div>
        </motion.div>
      )}

      {/* Action buttons */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.62 }}
        className="space-y-3"
      >
        <div className="grid grid-cols-2 gap-3">
          <motion.button
            onClick={handleAddToCalendar}
            className="py-3 rounded-xl text-sm font-medium text-gray-600 border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
            style={{ fontFamily: 'var(--font-inter)' }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
          >
            {t.addToCalendar}
          </motion.button>
          <motion.button
            onClick={handleShare}
            className="py-3 rounded-xl text-sm font-medium text-gray-600 border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
            style={{ fontFamily: 'var(--font-inter)' }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
          >
            {copied ? t.copied : t.share}
          </motion.button>
        </div>

        <motion.button
          onClick={handleNewBooking}
          className="w-full py-4 rounded-2xl text-white font-semibold text-sm relative overflow-hidden"
          style={{
            backgroundColor: theme.primaryColor,
            fontFamily: 'var(--font-inter)',
            boxShadow: `0 8px 28px ${theme.primaryColor}38`,
          }}
          whileHover={{ scale: 1.02, boxShadow: `0 12px 36px ${theme.primaryColor}48` }}
          whileTap={{ scale: 0.98 }}
        >
          {/* Shimmer */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent)', backgroundSize: '200% 100%' }}
            animate={{ backgroundPosition: ['-100% 0', '200% 0'] }}
            transition={{ duration: 2.4, repeat: Infinity, repeatDelay: 2.5 }}
          />
          {t.newBooking}
        </motion.button>
      </motion.div>
    </div>
  );
}

// ── Pre-submit confirmation ───────────────────────────────────
export default function SeasonalConfirmation({ companySlug, seasonalTheme }: Props) {
  const {
    employeesUI,
    selectedEmployeeId,
    anyPerson,
    eligibleEmployeeIds,
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
  const services = selectedService ? [selectedService] : [];
  const promotion = resolvePrimaryPromotion(services, serviceDiscounts, activePromotion);
  const pricing = getBookingPricing(services, promotion, selectedAddOn);

  if (bookingConfirmation?.success) {
    return <SuccessView seasonalTheme={seasonalTheme} />;
  }

  const t = {
    title: language === 'en' ? 'Confirm booking' : 'Potrdi rezervacijo',
    subtitle: language === 'en' ? 'Review your details before confirming' : 'Preverite podatke pred potrditvijo',
    service: language === 'en' ? 'Service' : 'Storitev',
    duration: language === 'en' ? 'Duration' : 'Trajanje',
    expert: language === 'en' ? 'Expert' : 'Specialist',
    anyone: language === 'en' ? 'Anyone available' : 'Kdorkoli prost',
    date: language === 'en' ? 'Date' : 'Datum',
    time: language === 'en' ? 'Time' : 'Ura',
    name: language === 'en' ? 'Name' : 'Ime in priimek',
    email: language === 'en' ? 'Email' : 'Email',
    phone: language === 'en' ? 'Phone' : 'Telefon',
    addon: language === 'en' ? 'Add-on' : 'Dodatek',
    total: language === 'en' ? 'Total' : 'Skupaj',
    confirm: language === 'en' ? 'Confirm booking' : 'Potrdi rezervacijo',
    sending: language === 'en' ? 'Sending…' : 'Pošiljam rezervacijo…',
    redirectingToPayment: language === 'en' ? 'Redirecting to payment…' : 'Preusmerjamo na plačilo…',
    paymentStartFailed:
      language === 'en'
        ? 'We could not start the payment. Your booking is saved but not yet confirmed. Please try again.'
        : 'Plačila ni bilo mogoče začeti. Vaša rezervacija je shranjena, a še ni potrjena. Prosimo, poskusite znova.',
    emailNote: language === 'en' ? 'Confirmation will be sent to your email' : 'Potrditev bo poslana na vaš email',
    missingData: language === 'en' ? 'Missing booking data' : 'Manjkajo podatki za rezervacijo',
  };

  const handleConfirm = async () => {
    if (!companySlug || !selectedService || !selectedDate || !selectedTime || !customerDetails) {
      setError(t.missingData);
      return;
    }
    setSubmitting(true);
    setError(null);

    try {
      const response = await submitBooking({
        companySlug,
        date: format(selectedDate, 'yyyy-MM-dd'),
        time: selectedTime,
        serviceId: selectedService.id,
        employeeId: selectedEmployeeId,
        anyPerson,
        eligibleEmployeeIds,
        firstName: customerDetails.firstName,
        lastName: customerDetails.lastName,
        email: customerDetails.email,
        phone: customerDetails.phone,
        gender: customerDetails.gender,
        notes: customerDetails.notes,
        gdprSendMarketing: customerDetails.gdprSendMarketing,
        privacyConsent: customerDetails.privacyConsent ?? false,
        marketingConsent: customerDetails.gdprSendMarketing ?? false,
        consentTimestamp: new Date().toISOString(),
        originalCena: pricing.originalTotal,
        finalCena: pricing.finalTotal,
        ...(promotion ? {
          promocijaTip: promotion.type,
          promocijaNaziv: promotion.naziv,
          popust: pricing.discountAmount,
          popustTip: getPromotionPopustTip(promotion),
          ...(promotion.type === 'popust' && { popust_id: promotion.id }),
          ...(promotion.type === 'happy_hour' && { happy_hour_id: promotion.id }),
        } : {}),
        ...(selectedAddOn ? {
          addOnServiceId: selectedAddOn.id,
          addOnNaziv: selectedAddOn.naziv,
          addOnFinalCena: selectedAddOn.finalCena,
          addOnOriginalCena: selectedAddOn.originalCena,
          addOnPopust: selectedAddOn.popustZnesek,
          addOnPopustTip: selectedAddOn.tipPopusta === 'percentage' ? '%' : 'valuta',
          addOnTrajanjeMin: selectedAddOn.trajanjeMin,
        } : {}),
      });

      if (response.success) {
        const serviceName = response.storitev || selectedService.naziv;
        const datumDisplay = format(selectedDate, 'd. MMMM yyyy', { locale: sl });

        if (response.requiresPayment === true) {
          const appointmentId = String(response.terminRowId ?? response.terminId ?? '');
          setRedirecting(true);

          try {
            await redirectToCheckout({
              companySlug,
              appointmentId,
              amount: response.paymentAmount ?? pricing.finalTotal,
              currency: response.currency ?? 'EUR',
              serviceName,
              customerEmail: customerDetails.email,
              customerName: `${customerDetails.firstName} ${customerDetails.lastName}`,
              language,
              paymentMode: response.paymentMode ?? 'full',
              successUrl: buildSuccessUrl(companySlug, 'seasonal', {
                lang: language,
                serviceName,
                date: response.datum || datumDisplay,
                time: response.cas || selectedTime,
              }),
              cancelUrl: buildCancelUrl(companySlug, 'seasonal'),
            });
            return;
          } catch (err) {
            console.error('Seasonal booking: failed to start payment:', err);
            setRedirecting(false);
            setError(t.paymentStartFailed);
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
        setError(response.message || 'Rezervacija ni uspela');
      }
    } catch (err) {
      console.error('Seasonal booking: submit failed:', err);
      setError(language === 'en' ? 'Booking failed. Please try again.' : 'Rezervacija ni uspela. Prosim poskusite znova.');
    } finally {
      setSubmitting(false);
    }
  };

  const rows = [
    { label: t.service, value: selectedService?.naziv },
    { label: t.duration, value: selectedService ? formatDuration(selectedService.trajanjeMin) : undefined },
    { label: t.expert, value: anyPerson ? t.anyone : selectedEmployee?.label },
    { label: t.date, value: selectedDate ? format(selectedDate, 'EEEE, d. MMMM yyyy', { locale: sl }) : undefined },
    { label: t.time, value: selectedTime },
    { label: t.name, value: customerDetails ? `${customerDetails.firstName} ${customerDetails.lastName}` : undefined },
    { label: t.email, value: customerDetails?.email },
    { label: t.phone, value: customerDetails?.phone },
    { label: t.addon, value: selectedAddOn ? `${selectedAddOn.naziv} (+${Number(selectedAddOn.finalCena ?? selectedAddOn.originalCena).toFixed(2).replace('.', ',')} €)` : undefined },
  ].filter((r) => r.value);

  return (
    <div>
      <motion.div variants={itemVariants} initial="hidden" animate="visible" className="mb-6">
        <h2
          className="text-2xl font-bold mb-1 text-gray-900"
          style={{ fontFamily: 'var(--font-stardom, serif)' }}
        >
          {t.title}
        </h2>
        <p className="text-sm text-gray-500" style={{ fontFamily: 'var(--font-inter)' }}>
          {t.subtitle}
        </p>
      </motion.div>

      {/* Summary card */}
      <motion.div
        variants={itemVariants}
        initial="hidden"
        animate="visible"
        className="rounded-2xl overflow-hidden mb-5"
        style={{ background: '#FAFAFA', border: '1px solid rgba(0,0,0,0.07)' }}
      >
        {/* Accent top bar */}
        <div className="h-0.5" style={{ background: `linear-gradient(to right, ${theme.primaryColor}, ${theme.secondaryColor ?? theme.primaryColor}80)` }} />

        <div className="px-5 py-2">
          {rows.map((row, i) => (
            <div key={i} className="seasonal-summary-row">
              <span className="seasonal-summary-label">{row.label}</span>
              <span className="seasonal-summary-value capitalize" style={{ maxWidth: '65%' }}>
                {row.value}
              </span>
            </div>
          ))}
        </div>

        {selectedService && (
          <>
            <div className="mx-5 h-px bg-gray-100" />
            <div className="px-5 py-4 flex items-center justify-between">
              <span
                className="text-xs font-semibold tracking-widest uppercase text-gray-400"
                style={{ fontFamily: 'var(--font-inter)' }}
              >
                {t.total}
              </span>
              <div className="text-right">
                {pricing.hasDiscount && (
                  <div className="text-sm line-through text-gray-400" style={{ fontFamily: 'var(--font-inter)' }}>
                    €{formatBookingPrice(pricing.originalTotal)}
                  </div>
                )}
                <span
                  className="text-2xl font-bold text-gray-900"
                  style={{ fontFamily: 'var(--font-inter)' }}
                >
                  €{formatBookingPrice(pricing.finalTotal)}
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
            style={{ backgroundColor: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.18)' }}
          >
            <span className="text-red-400 flex-shrink-0 text-sm">!</span>
            <p className="text-sm text-red-500" style={{ fontFamily: 'var(--font-inter)' }}>
              {error}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirm button */}
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
          boxShadow: `0 8px 28px ${theme.primaryColor}38`,
        }}
        whileHover={!isSubmitting ? { scale: 1.02, boxShadow: `0 12px 36px ${theme.primaryColor}48` } : {}}
        whileTap={!isSubmitting ? { scale: 0.98 } : {}}
      >
        {!isSubmitting && (
          <motion.div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent)', backgroundSize: '200% 100%' }}
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
            <span>{redirecting ? t.redirectingToPayment : t.sending}</span>
          </div>
        ) : t.confirm}
      </motion.button>

      <p className="text-center mt-3 text-xs text-gray-400" style={{ fontFamily: 'var(--font-inter)' }}>
        {t.emailNote}
      </p>
    </div>
  );
}
