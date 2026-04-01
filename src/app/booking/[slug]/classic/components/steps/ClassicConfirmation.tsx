'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { sl } from 'date-fns/locale';
import { useBookingStore } from '@/store/bookingStore';
import { submitBooking } from '@/lib/api';
import { getContrastMode } from '../ClassicLayout';

interface Props {
  companySlug?: string;
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

// ── Confetti particles on success ─────────────────────────────
function SuccessParticles({ active }: { active: boolean }) {
  const [particles, setParticles] = useState<Array<{
    id: number; x: number; color: string; delay: number; duration: number;
  }>>([]);

  useEffect(() => {
    if (!active) return;
    const colors = ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EC4899'];
    const newParticles = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: 5 + Math.random() * 90,
      color: colors[Math.floor(Math.random() * colors.length)],
      delay: Math.random() * 0.6,
      duration: 1.5 + Math.random() * 1.0,
    }));
    setParticles(newParticles);
    const t = setTimeout(() => setParticles([]), 3500);
    return () => clearTimeout(t);
  }, [active]);

  if (!particles.length) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute w-2 h-2 rounded-full"
          style={{ left: `${p.x}%`, bottom: '0%', backgroundColor: p.color }}
          initial={{ y: 0, opacity: 0, scale: 0 }}
          animate={{
            y: -(180 + Math.random() * 280),
            opacity: [0, 1, 0.8, 0],
            scale: [0, 1, 0.6, 0],
            x: (Math.random() - 0.5) * 60,
          }}
          transition={{ duration: p.duration, delay: p.delay, ease: 'easeOut' as const }}
        />
      ))}
    </div>
  );
}

// ── Success screen ─────────────────────────────────────────────
function SuccessView({ primaryColor }: { primaryColor: string }) {
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
  } = useBookingStore();

  const [copied, setCopied] = useState(false);
  const [showParticles, setShowParticles] = useState(false);
  const selectedEmployee = employeesUI.find((e) => e.id === selectedEmployeeId);

  useEffect(() => {
    const t = setTimeout(() => setShowParticles(true), 300);
    const t2 = setTimeout(() => setShowParticles(false), 4000);
    return () => { clearTimeout(t); clearTimeout(t2); };
  }, []);

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
        setTimeout(() => setCopied(false), 2000);
      } catch { /* unavailable */ }
    }
  };

  return (
    <>
      <SuccessParticles active={showParticles} />

      <div className="text-center py-4">
        {/* Success icon */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 220, damping: 18 }}
          className="mb-6"
        >
          <div
            className="w-20 h-20 rounded-full mx-auto flex items-center justify-center mb-4"
            style={{
              backgroundColor: `${primaryColor}15`,
              border: `2px solid ${primaryColor}40`,
              boxShadow: `0 0 0 8px ${primaryColor}08`,
            }}
          >
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: 'spring', stiffness: 300 }}
              className="text-3xl font-bold"
              style={{ color: primaryColor }}
            >
              ✓
            </motion.span>
          </div>

          <motion.h2
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-2xl font-bold text-gray-900 mb-1"
            style={{ fontFamily: 'var(--font-nunito)' }}
          >
            Rezervacija potrjena!
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-sm text-gray-500"
            style={{ fontFamily: 'var(--font-nunito-sans)' }}
          >
            Potrditev bo poslana na vaš email
          </motion.p>
        </motion.div>

        {/* Confirmation card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.4 }}
          className="rounded-2xl overflow-hidden mb-6 text-left"
          style={{
            background: 'rgba(255,255,255,0.97)',
            boxShadow: `0 8px 32px rgba(0,0,0,0.1), 0 0 0 1px ${primaryColor}15`,
          }}
        >
          {/* Color accent bar */}
          <div
            className="h-1.5"
            style={{ background: `linear-gradient(90deg, ${primaryColor}, ${primaryColor}80)` }}
          />

          <div className="px-6 py-5">
            {[
              { label: 'Storitev', value: bookingConfirmation?.storitev ?? selectedService?.naziv },
              { label: 'Specialist', value: anyPerson ? 'Kdorkoli prost' : selectedEmployee?.label },
              { label: 'Datum', value: bookingConfirmation?.datum },
              { label: 'Ura', value: bookingConfirmation?.cas },
              { label: 'Trajanje', value: selectedService ? formatDuration(selectedService.trajanjeMin) : undefined },
              { label: 'Stranka', value: customerDetails ? `${customerDetails.firstName} ${customerDetails.lastName}` : undefined },
            ]
              .filter((r) => r.value)
              .map((row, i, arr) => (
                <div
                  key={i}
                  className="flex items-start justify-between py-2.5"
                  style={{
                    borderBottom: i < arr.length - 1 ? '1px solid #F3F4F6' : 'none',
                  }}
                >
                  <span
                    className="text-xs text-gray-400 uppercase tracking-wide font-medium"
                    style={{ fontFamily: 'var(--font-nunito-sans)' }}
                  >
                    {row.label}
                  </span>
                  <span
                    className="text-sm font-semibold text-gray-800 text-right max-w-[60%]"
                    style={{ fontFamily: 'var(--font-nunito-sans)' }}
                  >
                    {row.value}
                  </span>
                </div>
              ))}
          </div>

          {/* Price */}
          {selectedService && (
            <div
              className="px-6 py-4 flex items-center justify-between border-t"
              style={{ borderColor: '#F3F4F6', backgroundColor: `${primaryColor}04` }}
            >
              <span
                className="text-sm text-gray-500"
                style={{ fontFamily: 'var(--font-nunito-sans)' }}
              >
                Skupaj
              </span>
              <span
                className="text-2xl font-bold"
                style={{ fontFamily: 'var(--font-nunito)', color: primaryColor }}
              >
                {Number(selectedService.cena).toFixed(2).replace('.', ',')} €
              </span>
            </div>
          )}
        </motion.div>

        {/* Action buttons */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="space-y-3"
        >
          <div className="flex gap-3">
            <button
              onClick={handleAddToCalendar}
              className="flex-1 py-3 rounded-2xl text-sm font-semibold border-2 transition-all hover:opacity-80"
              style={{
                fontFamily: 'var(--font-nunito)',
                borderColor: `${primaryColor}40`,
                color: primaryColor,
                backgroundColor: `${primaryColor}08`,
              }}
            >
              + Dodaj v Koledar
            </button>
            <button
              onClick={handleShare}
              className="flex-1 py-3 rounded-2xl text-sm font-semibold border-2 transition-all hover:opacity-80"
              style={{
                fontFamily: 'var(--font-nunito)',
                borderColor: `${primaryColor}40`,
                color: primaryColor,
                backgroundColor: `${primaryColor}08`,
              }}
            >
              {copied ? '✓ Kopirano' : 'Deli'}
            </button>
          </div>

          <button
            onClick={reset}
            className="w-full py-4 rounded-2xl font-bold text-white transition-opacity hover:opacity-90"
            style={{
              fontFamily: 'var(--font-nunito)',
              backgroundColor: primaryColor,
              boxShadow: `0 8px 28px ${primaryColor}40`,
            }}
          >
            Nova Rezervacija
          </button>
        </motion.div>
      </div>
    </>
  );
}

// ── Pre-submit confirmation ─────────────────────────────────────
export default function ClassicConfirmation({ companySlug }: Props) {
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

  const contrastMode = getContrastMode(theme.bgFrom, theme.bgTo);
  const textPrimary =
    contrastMode === 'light' ? 'rgba(255,255,255,0.95)' : 'rgba(0,0,0,0.9)';
  const textSecondary =
    contrastMode === 'light' ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.55)';

  const [error, setError] = useState<string | null>(null);
  const selectedEmployee = employeesUI.find((e) => e.id === selectedEmployeeId);

  if (bookingConfirmation?.success) {
    return <SuccessView primaryColor={theme.primaryColor} />;
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
      console.error('Classic booking: submit failed:', err);
      setError('Rezervacija ni uspela. Prosim poskusite znova.');
    } finally {
      setSubmitting(false);
    }
  };

  const rows = [
    { label: 'Oseba', value: anyPerson ? 'Kdorkoli prost' : selectedEmployee?.label },
    { label: 'Storitev', value: selectedService?.naziv },
    { label: 'Trajanje', value: selectedService ? formatDuration(selectedService.trajanjeMin) : undefined },
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
      {/* Page title */}
      <div className="mb-6">
        <h2
          className="text-3xl font-bold mb-2"
          style={{ fontFamily: 'var(--font-nunito)', color: textPrimary }}
        >
          Pregled rezervacije
        </h2>
        <p style={{ fontFamily: 'var(--font-nunito-sans)', color: textSecondary }}>
          Preverite podatke pred potrditvijo
        </p>
      </div>

      {/* Review card */}
      <div
        className="rounded-2xl overflow-hidden mb-6"
        style={{
          background: 'rgba(255,255,255,0.97)',
          boxShadow: `0 4px 24px rgba(0,0,0,0.09), 0 0 0 1px ${theme.primaryColor}10`,
        }}
      >
        {/* Top accent */}
        <div
          className="h-1"
          style={{ background: `linear-gradient(90deg, ${theme.primaryColor}, ${theme.primaryColor}60)` }}
        />

        <div className="px-6 py-5">
          {rows.map((row, i) => (
            <div
              key={i}
              className="flex items-start justify-between py-2.5"
              style={{ borderBottom: i < rows.length - 1 ? '1px solid #F3F4F6' : 'none' }}
            >
              <span
                className="text-xs text-gray-400 uppercase tracking-wide font-medium flex-shrink-0"
                style={{ fontFamily: 'var(--font-nunito-sans)' }}
              >
                {row.label}
              </span>
              <span
                className="text-sm font-semibold text-gray-800 text-right ml-4 capitalize"
                style={{ fontFamily: 'var(--font-nunito-sans)', maxWidth: '65%' }}
              >
                {row.value}
              </span>
            </div>
          ))}
        </div>

        {/* Price */}
        {selectedService && (
          <div
            className="px-6 py-4 flex items-center justify-between border-t"
            style={{ borderColor: '#F3F4F6', backgroundColor: `${theme.primaryColor}05` }}
          >
            <span
              className="text-sm text-gray-500"
              style={{ fontFamily: 'var(--font-nunito-sans)' }}
            >
              Skupaj
            </span>
            <span
              className="text-2xl font-bold"
              style={{ fontFamily: 'var(--font-nunito)', color: theme.primaryColor }}
            >
              {Number(selectedService.cena).toFixed(2).replace('.', ',')} €
            </span>
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
            className="mb-5 rounded-2xl px-5 py-4 flex items-center gap-3"
            style={{
              background: 'rgba(254,242,242,0.9)',
              border: '1px solid #FECACA',
            }}
          >
            <span style={{ color: '#EF4444', fontSize: '1.1rem', flexShrink: 0 }}>⚠</span>
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
          disabled={isSubmitting}
          className="w-full max-w-sm py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-3"
          style={{
            fontFamily: 'var(--font-nunito)',
            backgroundColor: isSubmitting ? `${theme.primaryColor}80` : theme.primaryColor,
            boxShadow: isSubmitting ? 'none' : `0 8px 28px ${theme.primaryColor}40`,
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
          }}
          whileHover={!isSubmitting ? { scale: 1.02 } : {}}
          whileTap={!isSubmitting ? { scale: 0.98 } : {}}
        >
          {isSubmitting ? (
            <>
              <motion.div
                className="w-5 h-5 border-2 rounded-full"
                style={{ borderColor: 'rgba(255,255,255,0.4)', borderTopColor: '#ffffff' }}
                animate={{ rotate: 360 }}
                transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' as const }}
              />
              <span>Pošiljam rezervacijo…</span>
            </>
          ) : (
            <>
              <span>Potrdi Rezervacijo</span>
              <span style={{ fontSize: '1rem' }}>→</span>
            </>
          )}
        </motion.button>
      </div>

      <p
        className="text-center mt-3 text-xs"
        style={{ fontFamily: 'var(--font-nunito-sans)', color: textSecondary }}
      >
        Potrditev bo poslana na vaš email
      </p>
    </div>
  );
}
