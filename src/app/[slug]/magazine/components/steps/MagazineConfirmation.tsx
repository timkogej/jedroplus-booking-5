'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { sl } from 'date-fns/locale';
import { useBookingStore } from '@/store/bookingStore';
import { submitBooking } from '@/lib/api';

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

// ─── Success state ────────────────────────────────────────────
function SuccessView() {
  const {
    theme,
    bookingConfirmation,
    employeesUI,
    selectedEmployeeId,
    anyPerson,
    selectedService,
    selectedDate,
    selectedTime,
    reset,
  } = useBookingStore();

  const [copied, setCopied] = useState(false);
  const selectedEmployee = employeesUI.find((e) => e.id === selectedEmployeeId);

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
    a.href = url; a.download = 'rezervacija.ics';
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    const text = `Moja rezervacija:\n${bookingConfirmation?.storitev}\n${bookingConfirmation?.datum} ob ${bookingConfirmation?.cas}`;
    if (typeof navigator !== 'undefined' && navigator.share) {
      try { await navigator.share({ title: 'Rezervacija potrjena', text }); } catch { /* cancelled */ }
    } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2200);
      } catch { /* unavailable */ }
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
          {/* Radiating rings */}
          <motion.circle
            cx="40" cy="40" r="38"
            stroke={theme.primaryColor}
            strokeWidth="0.5"
            fill="none"
            initial={{ scale: 1, opacity: 0.4 }}
            animate={{ scale: 1.4, opacity: 0 }}
            transition={{ duration: 1.8, delay: 0.5, ease: 'easeOut' }}
            style={{ transformOrigin: '40px 40px' }}
          />
          <motion.circle
            cx="40" cy="40" r="38"
            stroke={theme.primaryColor}
            strokeWidth="0.5"
            fill="none"
            initial={{ scale: 1, opacity: 0.3 }}
            animate={{ scale: 1.7, opacity: 0 }}
            transition={{ duration: 2.2, delay: 0.7, ease: 'easeOut' }}
            style={{ transformOrigin: '40px 40px' }}
          />
          {/* Circle */}
          <circle
            cx="40" cy="40" r="38"
            stroke={`${theme.primaryColor}20`}
            strokeWidth="1"
            fill="none"
            className="circle-path"
          />
          <circle
            cx="40" cy="40" r="38"
            stroke={theme.primaryColor}
            strokeWidth="1.5"
            fill="none"
            className="circle-path"
          />
          {/* Check */}
          <path
            d="M22 40L35 53L58 28"
            stroke={theme.primaryColor}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="check-path"
          />
        </svg>
      </motion.div>

      {/* POTRJENO */}
      <motion.div
        {...successItem(0)}
        className="mb-3"
      >
        <p
          className="magazine-caps text-[11px] tracking-[0.35em]"
          style={{ color: theme.primaryColor }}
        >
          Potrjeno
        </p>
      </motion.div>

      <motion.h1
        {...successItem(1)}
        className="magazine-serif text-[2.5rem] md:text-[3rem] text-[#1A1A1A] tracking-[-0.02em] leading-[1.1] mb-3"
      >
        Rezervacija<br />
        <span style={{ fontStyle: 'italic' }}>potrjena</span>
      </motion.h1>

      <motion.p
        {...successItem(2)}
        className="magazine-body text-[#6B6B6B] italic mb-10"
      >
        Veselimo se vašega obiska!
      </motion.p>

      {/* Details */}
      <motion.div
        {...successItem(3)}
      >
        <div className="h-[1px] bg-black/10 mb-6" />
        <div className="space-y-4">
          {(selectedEmployee || anyPerson) && (
            <div className="flex justify-between items-baseline">
              <p className="magazine-caps text-[8px] tracking-[0.18em] text-[#6B6B6B]">
                Specialist
              </p>
              <p className="magazine-body text-[14px] text-[#1A1A1A]">
                {selectedEmployee ? selectedEmployee.label : 'Kdorkoli prost'}
              </p>
            </div>
          )}
          {bookingConfirmation?.storitev && (
            <div className="flex justify-between items-baseline">
              <p className="magazine-caps text-[8px] tracking-[0.18em] text-[#6B6B6B]">
                Storitev
              </p>
              <p className="magazine-body text-[14px] text-[#1A1A1A]">
                {bookingConfirmation.storitev}
              </p>
            </div>
          )}
          {bookingConfirmation?.datum && (
            <div className="flex justify-between items-baseline">
              <p className="magazine-caps text-[8px] tracking-[0.18em] text-[#6B6B6B]">
                Datum
              </p>
              <p className="magazine-body text-[14px] text-[#1A1A1A]">
                {bookingConfirmation.datum}
              </p>
            </div>
          )}
          {bookingConfirmation?.cas && (
            <div className="flex justify-between items-baseline">
              <p className="magazine-caps text-[8px] tracking-[0.18em] text-[#6B6B6B]">
                Ura
              </p>
              <p className="magazine-body text-[14px] text-[#1A1A1A] tabular-nums">
                {bookingConfirmation.cas}
              </p>
            </div>
          )}
          {selectedService && (
            <div className="flex justify-between items-baseline">
              <p className="magazine-caps text-[8px] tracking-[0.18em] text-[#6B6B6B]">
                Cena
              </p>
              <p
                className="magazine-serif text-[1.4rem] font-light tabular-nums"
                style={{ color: theme.primaryColor }}
              >
                €{selectedService.cena}
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
        {/* Dodaj v koledar — gradient fill */}
        <motion.button
          onClick={handleAddToCalendar}
          className="flex items-center gap-2 px-6 py-3 text-white magazine-caps text-[9px] tracking-[0.18em] transition-opacity"
          style={{
            background: `linear-gradient(135deg, var(--mag-bg-from, ${theme.bgFrom}), var(--mag-bg-to, ${theme.bgTo}))`,
          }}
          whileHover={{ opacity: 0.9 }}
          whileTap={{ scale: 0.98 }}
        >
          + Dodaj v Koledar
        </motion.button>

        {/* Deli — outlined */}
        <motion.button
          onClick={handleShare}
          className="flex items-center gap-2 px-6 py-3 magazine-caps text-[9px] tracking-[0.18em] border transition-all duration-300"
          style={{ borderColor: theme.primaryColor, color: theme.primaryColor }}
          whileHover={{ backgroundColor: `${theme.primaryColor}08` }}
          whileTap={{ scale: 0.98 }}
        >
          {copied ? 'Kopirano ✓' : '↗ Deli'}
        </motion.button>

        {/* Nova rezervacija — text link */}
        <button
          onClick={reset}
          className="px-4 py-3 magazine-caps text-[9px] tracking-[0.18em] text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors duration-200"
        >
          Nova rezervacija
        </button>
      </motion.div>
    </motion.div>
  );
}

// ─── Pre-confirmation (review) view ──────────────────────────
export default function MagazineConfirmation({ companySlug }: Props) {
  const {
    theme,
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
  } = useBookingStore();

  const [error, setError] = useState<string | null>(null);
  const selectedEmployee = employeesUI.find((e) => e.id === selectedEmployeeId);

  // If already confirmed, show success
  if (bookingConfirmation?.success) {
    return <SuccessView />;
  }

  const handleConfirm = async () => {
    if (!companySlug || !selectedService || !selectedDate || !selectedTime || !customerDetails) {
      setError('Manjkajo potrebni podatki za rezervacijo');
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
        privacyConsent: customerDetails.privacyConsent,
        marketingConsent: customerDetails.gdprSendMarketing,
        consentTimestamp: new Date().toISOString(),
      });

      if (response.success) {
        setBookingConfirmation({
          success: true,
          message: response.message || 'Rezervacija uspešna!',
          storitev: selectedService.naziv,
          datum: format(selectedDate, 'd. MMMM yyyy', { locale: sl }),
          cas: selectedTime,
        });
      } else {
        setError(response.message || 'Rezervacija ni uspela');
      }
    } catch (err) {
      console.error('Failed to submit booking:', err);
      setError('Rezervacija ni uspela. Prosim poskusi znova.');
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
        <div className="w-8 h-[1px] mb-5" style={{ backgroundColor: theme.primaryColor }} />
        <h1 className="magazine-serif text-[2.5rem] md:text-[3rem] text-[#1A1A1A] tracking-[-0.02em] leading-[1.1] mb-4">
          Pregled Rezervacije
        </h1>
        <div className="h-[1px] w-full bg-black/10 mb-4" />
        <p className="magazine-body text-[#6B6B6B] text-[15px] italic leading-relaxed">
          Preverite podrobnosti pred potrditvijo
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

        {(selectedEmployee || anyPerson) && (
          <div className="flex items-start gap-4 py-5 border-b border-black/08">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 magazine-serif text-[11px]"
              style={{
                border: `1px solid ${theme.primaryColor}30`,
                color: theme.primaryColor,
                backgroundColor: `${theme.primaryColor}08`,
              }}
            >
              {selectedEmployee?.initials || '·'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="magazine-caps text-[8px] tracking-[0.18em] text-[#6B6B6B] mb-1">
                Specialist
              </p>
              <p className="magazine-serif text-[15px] text-[#1A1A1A]">
                {selectedEmployee ? selectedEmployee.label : 'Kdorkoli prost'}
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
                Storitev
              </p>
              <p className="magazine-serif text-[15px] text-[#1A1A1A] mb-0.5">
                {selectedService.naziv}
              </p>
              <p className="magazine-caps text-[8px] tracking-[0.14em] text-[#6B6B6B]">
                {formatDuration(selectedService.trajanjeMin)} · €{selectedService.cena}
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
                Datum in ura
              </p>
              <p className="magazine-serif text-[15px] text-[#1A1A1A]">
                {format(selectedDate, 'EEEE, d. MMMM yyyy', { locale: sl })}
              </p>
              <p
                className="magazine-body text-[13px] mt-0.5 tabular-nums"
                style={{ color: theme.primaryColor }}
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
                Vaši podatki
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
              Skupaj
            </p>
            <p
              className="magazine-serif text-[1.8rem] font-light tabular-nums"
              style={{ color: theme.primaryColor }}
            >
              €{selectedService.cena}
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
          background: `linear-gradient(135deg, var(--mag-bg-from, ${theme.bgFrom}), var(--mag-bg-to, ${theme.bgTo}))`,
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
              Potrjujem...
            </span>
          </div>
        ) : (
          <span className="magazine-serif text-lg italic">
            Potrdi Rezervacijo
          </span>
        )}
      </motion.button>

      <p className="magazine-caps text-[9px] tracking-[0.18em] text-black/30 mt-4">
        Potrditev bo poslana na vaš email
      </p>
    </motion.div>
  );
}
