'use client';

import { useState } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { format } from 'date-fns';
import { sl } from 'date-fns/locale';
import { useBookingStore } from '@/store/bookingStore';
import { submitBooking } from '@/lib/api';
import { SeasonalTheme } from '../decorations/SeasonDetector';

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
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: 'easeOut' as const },
  },
};

// ── Success view ──────────────────────────────────────────────
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
  } = useBookingStore();

  const [copied, setCopied] = useState(false);
  const selectedEmployee = employeesUI.find((e) => e.id === selectedEmployeeId);

  const getSuccessEmoji = () => {
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
  };

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
    <div>
      {/* Success hero */}
      <motion.div
        initial={{ opacity: 0, scale: 0.88 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' as const }}
        className="text-center mb-8"
      >
        {/* Animated success ring */}
        <div className="relative w-20 h-20 mx-auto mb-6">
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{ border: `2px solid ${theme.primaryColor}25` }}
          />
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{ border: `2px solid ${theme.primaryColor}` }}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.15, type: 'spring', stiffness: 220, damping: 18 }}
          />
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{ border: `2px solid ${theme.primaryColor}` }}
            initial={{ scale: 1, opacity: 0.6 }}
            animate={{ scale: 1.6, opacity: 0 }}
            transition={{ delay: 0.4, duration: 1.2, repeat: 2 }}
          />
          <motion.div
            className="absolute inset-0 rounded-full flex items-center justify-center"
            style={{ backgroundColor: `${theme.primaryColor}18` }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 300, damping: 18 }}
          >
            <motion.span
              className="text-3xl"
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.35, type: 'spring', stiffness: 400, damping: 20 }}
            >
              {getSuccessEmoji()}
            </motion.span>
          </motion.div>
        </div>

        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="text-2xl font-bold mb-2"
          style={{
            color: 'var(--t-primary)',
            fontFamily: seasonalTheme.config.headingFont ?? 'var(--font-quicksand)',
          }}
        >
          Rezervacija potrjena!
        </motion.h2>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45 }}
        >
          {selectedService && (
            <p className="text-sm mb-1" style={{ color: 'var(--t-muted)', fontFamily: 'var(--font-quicksand)' }}>
              {selectedService.naziv}
              {(anyPerson || selectedEmployee) && (
                <> z {anyPerson ? 'razpoložljivim specialistom' : selectedEmployee?.label}</>
              )}
            </p>
          )}
          {selectedDate && selectedTime && (
            <p
              className="font-semibold capitalize text-sm"
              style={{ color: theme.primaryColor, fontFamily: 'var(--font-quicksand)' }}
            >
              {format(selectedDate, 'd. MMMM yyyy', { locale: sl })} ob {selectedTime}
            </p>
          )}
        </motion.div>
      </motion.div>

      {/* Info card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.4 }}
        className="rounded-2xl overflow-hidden mb-5 seasonal-surface"
        style={{
          backgroundColor: 'var(--s2)',
          border: '1px solid var(--b2)',
        }}
      >
        <div
          className="h-1"
          style={{ background: `linear-gradient(to right, ${theme.primaryColor}, ${theme.secondaryColor})` }}
        />
        <div className="px-5 py-4">
          {customerDetails?.email && (
            <p className="text-sm" style={{ color: 'var(--t-muted)', fontFamily: 'var(--font-quicksand)', lineHeight: 1.6 }}>
              Potrditev smo poslali na{' '}
              <span className="font-semibold" style={{ color: 'var(--t-soft)' }}>
                {customerDetails.email}
              </span>
            </p>
          )}
        </div>
      </motion.div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.65 }}
        className="space-y-3"
      >
        <div className="grid grid-cols-2 gap-3">
          <motion.button
            onClick={handleAddToCalendar}
            className="py-3 rounded-xl text-sm font-medium seasonal-surface"
            style={{
              fontFamily: 'var(--font-quicksand)',
              backgroundColor: 'var(--s2)',
              border: '1px solid var(--b2)',
              color: 'var(--t-soft)',
            }}
            whileHover={{ scale: 1.02, backgroundColor: 'var(--s2h)' }}
            whileTap={{ scale: 0.97 }}
          >
            Dodaj v koledar
          </motion.button>
          <motion.button
            onClick={handleShare}
            className="py-3 rounded-xl text-sm font-medium seasonal-surface"
            style={{
              fontFamily: 'var(--font-quicksand)',
              backgroundColor: 'var(--s2)',
              border: '1px solid var(--b2)',
              color: 'var(--t-soft)',
            }}
            whileHover={{ scale: 1.02, backgroundColor: 'var(--s2h)' }}
            whileTap={{ scale: 0.97 }}
          >
            {copied ? '✓ Kopirano' : 'Deli'}
          </motion.button>
        </div>

        <motion.button
          onClick={() => window.location.reload()}
          className="w-full py-4 rounded-2xl text-white font-semibold text-sm relative overflow-hidden"
          style={{
            backgroundColor: theme.primaryColor,
            fontFamily: 'var(--font-quicksand)',
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
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 2 }}
          />
          Nova rezervacija
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
  } = useBookingStore();

  const [error, setError] = useState<string | null>(null);
  const selectedEmployee = employeesUI.find((e) => e.id === selectedEmployeeId);

  if (bookingConfirmation?.success) {
    return <SuccessView seasonalTheme={seasonalTheme} />;
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
      console.error('Seasonal booking: submit failed:', err);
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
      value: selectedDate ? format(selectedDate, 'EEEE, d. MMMM yyyy', { locale: sl }) : undefined,
    },
    { label: 'Ura', value: selectedTime },
    {
      label: 'Ime in priimek',
      value: customerDetails ? `${customerDetails.firstName} ${customerDetails.lastName}` : undefined,
    },
    { label: 'Email', value: customerDetails?.email },
    { label: 'Telefon', value: customerDetails?.phone },
  ].filter((r) => r.value);

  return (
    <div>
      <motion.div variants={itemVariants} initial="hidden" animate="visible" className="mb-8">
        <h2
          className="text-3xl font-bold mb-2"
          style={{
            color: 'var(--t-primary)',
            fontFamily: seasonalTheme.config.headingFont ?? 'var(--font-quicksand)',
          }}
        >
          Potrdi{' '}
          <span
            className="seasonal-gradient-text"
            style={{
              backgroundImage: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})`,
            }}
          >
            rezervacijo
          </span>
        </h2>
        <p className="text-sm" style={{ color: 'var(--t-muted)', fontFamily: 'var(--font-quicksand)' }}>
          Preverite podatke pred potrditvijo
        </p>
      </motion.div>

      {/* Summary card */}
      <motion.div
        variants={itemVariants}
        initial="hidden"
        animate="visible"
        className="rounded-2xl overflow-hidden mb-5 seasonal-surface"
        style={{
          backgroundColor: 'var(--s2)',
          border: '1px solid var(--b2)',
        }}
      >
        <div
          className="h-1"
          style={{ background: `linear-gradient(to right, ${theme.primaryColor}, ${theme.secondaryColor})` }}
        />

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
            <div className="mx-5 h-px" style={{ backgroundColor: 'var(--b1)' }} />
            <div className="px-5 py-4 flex items-center justify-between">
              <span
                className="text-xs font-semibold tracking-widest uppercase"
                style={{ color: 'var(--t-faint)', fontFamily: 'var(--font-quicksand)' }}
              >
                Skupaj
              </span>
              <span
                className="text-2xl font-bold"
                style={{ color: 'var(--t-primary)', fontFamily: 'var(--font-quicksand)' }}
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
            style={{ backgroundColor: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)' }}
          >
            <span style={{ color: '#FCA5A5', flexShrink: 0 }}>!</span>
            <p className="text-sm" style={{ color: '#FCA5A5', fontFamily: 'var(--font-quicksand)' }}>
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
          fontFamily: 'var(--font-quicksand)',
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
            <span>Pošiljam rezervacijo&hellip;</span>
          </div>
        ) : (
          'Potrdi rezervacijo'
        )}
      </motion.button>

      <p
        className="text-center mt-3 text-xs"
        style={{ color: 'var(--t-faint)', fontFamily: 'var(--font-quicksand)' }}
      >
        Potrditev bo poslana na vaš email
      </p>
    </div>
  );
}
