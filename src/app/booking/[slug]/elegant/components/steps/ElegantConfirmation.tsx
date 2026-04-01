'use client';

import { useState } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
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
    bookingConfirmation,
    selectedService,
    selectedDate,
    selectedTime,
    selectedEmployeeId,
    anyPerson,
    employeesUI,
    customerDetails,
    reset,
    theme,
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
    a.href = url;
    a.download = 'rezervacija.ics';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    const text = `Moja rezervacija:\n${bookingConfirmation?.storitev}\n${bookingConfirmation?.datum} ob ${bookingConfirmation?.cas}`;
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: 'Rezervacija potrjena', text });
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
          <span style={{ color: theme.primaryColor, fontSize: '1.5rem' }}>✓</span>
        </motion.div>

        <h2
          style={{
            fontFamily: 'var(--font-playfair)',
            fontSize: '1.75rem',
            fontWeight: 400,
            color: '#111111',
          }}
        >
          Rezervacija potrjena!
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
              <> z {anyPerson ? 'razpoložljivim specialistom' : selectedEmployee?.label}</>
            )}
          </p>
        )}

        {selectedDate && selectedTime && (
          <p
            className="mt-1 capitalize"
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '0.9rem',
              color: theme.primaryColor,
              fontWeight: 500,
            }}
          >
            {format(selectedDate, 'd. MMMM yyyy', { locale: sl })} ob {selectedTime}
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
          style={{ background: `linear-gradient(to right, ${theme.primaryColor}, ${theme.primaryColor}40)` }}
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
            Dodaj v koledar
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
          onClick={reset}
          className="w-full py-4 rounded-xl text-white font-medium text-sm transition-opacity hover:opacity-90"
          style={{
            backgroundColor: theme.primaryColor,
            fontFamily: 'var(--font-inter)',
            boxShadow: `0 4px 14px ${theme.primaryColor}30`,
          }}
        >
          Nova rezervacija
        </button>
      </motion.div>
    </div>
  );
}

// ── Pre-submit confirmation ───────────────────────────────────
export default function ElegantConfirmation({ companySlug }: Props) {
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
  } = useBookingStore();

  const [error, setError] = useState<string | null>(null);
  const selectedEmployee = employeesUI.find((e) => e.id === selectedEmployeeId);

  if (bookingConfirmation?.success) {
    return <SuccessView />;
  }

  const handleConfirm = async () => {
    if (!companySlug || !selectedService || !selectedDate || !selectedTime || !customerDetails) {
      setError('Manjkajo podatki za rezervacijo');
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
      console.error('Elegant booking: submit failed:', err);
      setError('Rezervacija ni uspela. Prosim poskusite znova.');
    } finally {
      setSubmitting(false);
    }
  };

  const rows = [
    { label: 'Storitev', value: selectedService?.naziv },
    { label: 'Trajanje', value: selectedService ? formatDuration(selectedService.trajanjeMin) : undefined },
    { label: 'Specialist', value: anyPerson ? 'Kdorkoli prost' : selectedEmployee?.label },
    {
      label: 'Datum',
      value: selectedDate
        ? format(selectedDate, 'EEEE, d. MMMM yyyy', { locale: sl })
        : undefined,
    },
    { label: 'Ura', value: selectedTime },
    {
      label: 'Ime in priimek',
      value: customerDetails
        ? `${customerDetails.firstName} ${customerDetails.lastName}`
        : undefined,
    },
    { label: 'Email', value: customerDetails?.email },
    { label: 'Telefon', value: customerDetails?.phone },
  ].filter((r) => r.value);

  return (
    <div>
      {/* Heading */}
      <motion.div variants={itemVariants} initial="hidden" animate="visible" className="mb-6">
        <h2
          style={{
            fontFamily: 'var(--font-playfair)',
            fontSize: '1.75rem',
            fontWeight: 400,
            color: '#111111',
            lineHeight: 1.2,
          }}
        >
          Potrditev <span style={{ color: theme.primaryColor }}>rezervacije</span>
        </h2>
        <p
          className="mt-2"
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '0.9rem',
            color: '#6B7280',
          }}
        >
          Preverite podatke pred potrditvijo
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
          style={{ background: `linear-gradient(to right, ${theme.primaryColor}, ${theme.primaryColor}30)` }}
        />

        <div className="px-5 py-1">
          {rows.map((row, i) => (
            <div key={i} className="elegant-summary-row">
              <span className="elegant-summary-label">{row.label}</span>
              <span
                className="elegant-summary-value capitalize"
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
                  color: '#9CA3AF',
                }}
              >
                Skupaj
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-playfair)',
                  fontSize: '1.5rem',
                  fontWeight: 500,
                  color: '#111111',
                }}
              >
                €{selectedService.cena}
              </span>
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
          backgroundColor: theme.primaryColor,
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
            <span>Pošiljam rezervacijo&hellip;</span>
          </div>
        ) : (
          'Potrdi rezervacijo'
        )}
      </motion.button>

      <p
        className="text-center mt-3"
        style={{
          fontFamily: 'var(--font-inter)',
          fontSize: '0.8rem',
          color: '#9CA3AF',
        }}
      >
        Potrditev bo poslana na vaš email
      </p>
    </div>
  );
}
