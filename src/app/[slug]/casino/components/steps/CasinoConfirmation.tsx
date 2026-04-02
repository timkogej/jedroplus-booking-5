'use client';

import { useState, useEffect } from 'react';
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

// ── Gold particle effect (subtle, elegant) ────────────────────
function GoldParticles({ active }: { active: boolean }) {
  const [particles, setParticles] = useState<Array<{
    id: number; x: number; delay: number; duration: number;
  }>>([]);

  useEffect(() => {
    if (!active) return;
    const newParticles = Array.from({ length: 18 }, (_, i) => ({
      id: i,
      x: 10 + Math.random() * 80,
      delay: Math.random() * 0.8,
      duration: 1.8 + Math.random() * 1.2,
    }));
    setParticles(newParticles);
    const t = setTimeout(() => setParticles([]), 4000);
    return () => clearTimeout(t);
  }, [active]);

  if (!particles.length) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute select-none"
          style={{ left: `${p.x}%`, bottom: '0%', color: '#c9a84c' }}
          initial={{ y: 0, opacity: 0, scale: 0 }}
          animate={{
            y: -(200 + Math.random() * 300),
            opacity: [0, 0.8, 0.6, 0],
            scale: [0, 1, 0.7, 0],
          }}
          transition={{ duration: p.duration, delay: p.delay, ease: 'easeOut' as const }}
        >
          ◆
        </motion.div>
      ))}
    </div>
  );
}

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
    reset,
    customerDetails,
  } = useBookingStore();

  const [copied, setCopied] = useState(false);
  const [showParticles, setShowParticles] = useState(false);
  const selectedEmployee = employeesUI.find((e) => e.id === selectedEmployeeId);

  useEffect(() => {
    const t = setTimeout(() => setShowParticles(true), 400);
    const t2 = setTimeout(() => setShowParticles(false), 4500);
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
        setTimeout(() => setCopied(false), 2200);
      } catch { /* unavailable */ }
    }
  };

  // Generate a reference number
  const refNum = bookingConfirmation?.cas
    ? `MCB-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`
    : 'MCB-2026';

  return (
    <>
      <GoldParticles active={showParticles} />

      <div className="text-center py-2">
        {/* Success icon */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 220, damping: 18 }}
          className="mb-6"
        >
          {/* Gold diamond row */}
          <div className="flex items-center justify-center gap-2 mb-4">
            {['◆', '◆', '◆'].map((s, i) => (
              <motion.span
                key={i}
                style={{ color: '#c9a84c', fontFamily: 'Georgia, serif', fontSize: i === 1 ? '1.2rem' : '0.7rem' }}
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
              >
                {s}
              </motion.span>
            ))}
          </div>

          {/* Checkmark circle */}
          <div
            className="w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-4"
            style={{
              background: 'rgba(13, 59, 30, 0.8)',
              border: '2px solid rgba(201, 168, 76, 0.6)',
              boxShadow: '0 0 24px rgba(201, 168, 76, 0.2)',
            }}
          >
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.6, type: 'spring', stiffness: 350 }}
              style={{ color: '#c9a84c', fontSize: '1.6rem' }}
            >
              ✓
            </motion.span>
          </div>

          <motion.h2
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="font-bold italic"
            style={{
              fontFamily: 'var(--font-playfair)',
              fontSize: '1.6rem',
              color: '#f5edd6',
              letterSpacing: '0.02em',
            }}
          >
            Rezervacija Potrjena
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            style={{
              fontFamily: 'var(--font-oswald)',
              fontSize: '0.58rem',
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              color: '#a89060',
              marginTop: '0.4rem',
            }}
          >
            Vaš sedež pri mizi je rezerviran
          </motion.p>
        </motion.div>

        {/* Confirmation ticket */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          className="rounded-lg overflow-hidden mb-6 text-left"
          style={{
            background: 'rgba(8, 30, 15, 0.85)',
            border: '1px solid rgba(201, 168, 76, 0.45)',
            boxShadow: '0 0 30px rgba(201, 168, 76, 0.08)',
          }}
        >
          {/* Top accent */}
          <div
            className="h-px"
            style={{ background: 'linear-gradient(to right, transparent, #c9a84c, #e8c96d, #c9a84c, transparent)' }}
          />

          {/* Ticket header */}
          <div
            className="px-5 py-3 flex items-center justify-between"
            style={{
              background: 'rgba(13, 59, 30, 0.4)',
              borderBottom: '1px solid rgba(201,168,76,0.12)',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-oswald)',
                fontSize: '0.58rem',
                letterSpacing: '0.25em',
                textTransform: 'uppercase',
                color: '#c9a84c',
              }}
            >
              ◆ Dobitna Vstopnica
            </span>
            <span
              style={{
                fontFamily: 'var(--font-oswald)',
                fontSize: '0.55rem',
                letterSpacing: '0.12em',
                color: 'rgba(201,168,76,0.4)',
              }}
            >
              #{refNum}
            </span>
          </div>

          {/* Booking details */}
          <div className="px-5 py-4">
            {[
              { label: 'Storitev',   value: bookingConfirmation?.storitev ?? selectedService?.naziv },
              { label: 'Specialist', value: anyPerson ? 'Kdorkoli prost' : selectedEmployee?.label },
              { label: 'Datum',      value: bookingConfirmation?.datum },
              { label: 'Ura',        value: bookingConfirmation?.cas },
              { label: 'Trajanje',   value: selectedService ? formatDuration(selectedService.trajanjeMin) : undefined },
            ]
              .filter((r) => r.value)
              .map((row, i) => (
                <div key={i} className="mc-summary-row">
                  <span className="mc-summary-label">{row.label}</span>
                  <span
                    className="text-right"
                    style={{
                      fontFamily: 'var(--font-cormorant)',
                      fontSize: '0.95rem',
                      color: '#f5edd6',
                      maxWidth: '60%',
                    }}
                  >
                    {row.value}
                  </span>
                </div>
              ))}

            {customerDetails && (
              <div className="mc-summary-row">
                <span className="mc-summary-label">Gost</span>
                <span
                  style={{
                    fontFamily: 'var(--font-cormorant)',
                    fontSize: '0.95rem',
                    color: '#f5edd6',
                  }}
                >
                  {customerDetails.firstName} {customerDetails.lastName}
                </span>
              </div>
            )}
          </div>

          {/* Tear line */}
          <div
            className="mx-5"
            style={{ borderTop: '1px dashed rgba(201,168,76,0.2)' }}
          />

          {/* Price */}
          {selectedService && (
            <div className="px-5 py-3 flex items-center justify-between">
              <span
                style={{
                  fontFamily: 'var(--font-oswald)',
                  fontSize: '0.6rem',
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  color: '#a89060',
                }}
              >
                Skupaj
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-playfair)',
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  color: '#e8c96d',
                }}
              >
                €{selectedService.cena}
              </span>
            </div>
          )}

          {/* Bottom accent */}
          <div
            className="h-px"
            style={{ background: 'linear-gradient(to right, transparent, #c9a84c, #e8c96d, #c9a84c, transparent)' }}
          />
        </motion.div>

        {/* Action buttons */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
          className="space-y-3"
        >
          <div className="flex gap-3">
            <button
              onClick={handleAddToCalendar}
              className="mc-btn-secondary flex-1"
              style={{ fontSize: '0.65rem', letterSpacing: '0.15em' }}
            >
              Dodaj v Koledar
            </button>
            <button
              onClick={handleShare}
              className="mc-btn-secondary flex-1"
              style={{ fontSize: '0.65rem', letterSpacing: '0.15em' }}
            >
              {copied ? '✓ Kopirano' : 'Deli'}
            </button>
          </div>

          <button
            onClick={reset}
            className="mc-btn-gold w-full"
          >
            Nova Rezervacija
          </button>
        </motion.div>
      </div>
    </>
  );
}

// ── Pre-submit confirmation view ──────────────────────────────
export default function CasinoConfirmation({ companySlug }: Props) {
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
      console.error('Casino booking: submit failed:', err);
      setError('Rezervacija ni uspela. Prosim poskusite znova.');
    } finally {
      setSubmitting(false);
    }
  };

  const rows = [
    { label: 'Specialist', value: anyPerson ? 'Kdorkoli prost' : selectedEmployee?.label },
    { label: 'Storitev',   value: selectedService?.naziv },
    { label: 'Trajanje',   value: selectedService ? formatDuration(selectedService.trajanjeMin) : undefined },
    { label: 'Datum',      value: selectedDate ? format(selectedDate, 'EEEE, d. MMMM yyyy', { locale: sl }) : undefined },
    { label: 'Ura',        value: selectedTime },
    { label: 'Ime',        value: customerDetails ? `${customerDetails.firstName} ${customerDetails.lastName}` : undefined },
    { label: 'Email',      value: customerDetails?.email },
    { label: 'Telefon',    value: customerDetails?.phone },
  ].filter((r) => r.value);

  return (
    <div>
      <p
        className="italic mb-6"
        style={{
          fontFamily: 'var(--font-cormorant)',
          fontSize: '1.05rem',
          color: 'rgba(232,217,184,0.6)',
          lineHeight: 1.7,
        }}
      >
        Preverite svojo rezervacijo pred dokončno potrditvijo.
      </p>

      {/* Review card */}
      <div
        className="rounded-lg overflow-hidden mb-6"
        style={{
          background: 'rgba(8, 30, 15, 0.85)',
          border: '1px solid rgba(201, 168, 76, 0.35)',
          boxShadow: '0 0 24px rgba(201, 168, 76, 0.06)',
        }}
      >
        {/* Top accent */}
        <div
          className="h-px"
          style={{ background: 'linear-gradient(to right, transparent, #c9a84c, #e8c96d, #c9a84c, transparent)' }}
        />

        {/* Header */}
        <div
          className="px-5 py-3"
          style={{
            background: 'rgba(13, 59, 30, 0.4)',
            borderBottom: '1px solid rgba(201,168,76,0.1)',
          }}
        >
          <p
            style={{
              fontFamily: 'var(--font-oswald)',
              fontSize: '0.6rem',
              letterSpacing: '0.25em',
              textTransform: 'uppercase',
              color: '#a89060',
            }}
          >
            ◆ Pregled Rezervacije
          </p>
        </div>

        {/* Details table */}
        <div className="px-5 py-4">
          {rows.map((row, i) => (
            <div key={i} className="mc-summary-row" style={{ borderBottomColor: 'rgba(201,168,76,0.07)' }}>
              <span className="mc-summary-label">{row.label}</span>
              <span
                className="text-right"
                style={{
                  fontFamily: 'var(--font-cormorant)',
                  fontSize: '0.95rem',
                  color: '#f5edd6',
                  maxWidth: '65%',
                }}
              >
                {row.value}
              </span>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="mx-5" style={{ borderTop: '1px solid rgba(201,168,76,0.12)' }} />

        {/* Price */}
        {selectedService && (
          <div className="px-5 py-3 flex items-center justify-between">
            <span
              style={{
                fontFamily: 'var(--font-oswald)',
                fontSize: '0.6rem',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: '#a89060',
              }}
            >
              Skupaj
            </span>
            <span
              style={{
                fontFamily: 'var(--font-playfair)',
                fontSize: '1.5rem',
                fontWeight: 700,
                color: '#e8c96d',
              }}
            >
              €{selectedService.cena}
            </span>
          </div>
        )}

        {/* Bottom accent */}
        <div
          className="h-px"
          style={{ background: 'linear-gradient(to right, transparent, rgba(201,168,76,0.3), transparent)' }}
        />
      </div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-5 rounded-lg px-4 py-3 flex items-center gap-3"
            style={{
              background: 'rgba(192, 57, 43, 0.08)',
              border: '1px solid rgba(192,57,43,0.3)',
            }}
          >
            <span style={{ color: '#c0392b', flexShrink: 0 }}>◆</span>
            <p className="mc-error">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirm CTA */}
      <div className="flex justify-center">
        <button
          onClick={handleConfirm}
          disabled={isSubmitting}
          className="mc-btn-gold w-full max-w-sm py-4 relative overflow-hidden"
        >
          {isSubmitting ? (
            <div className="flex items-center justify-center gap-3">
              <motion.div
                className="w-4 h-4 border-2 rounded-full"
                style={{ borderColor: '#060f08', borderTopColor: 'transparent' }}
                animate={{ rotate: 360 }}
                transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' as const }}
              />
              <span>Pošiljam rezervacijo&hellip;</span>
            </div>
          ) : (
            '♣ Potrdi Rezervacijo ♣'
          )}
        </button>
      </div>

      <p
        className="text-center mt-3 italic"
        style={{
          fontFamily: 'var(--font-cormorant)',
          fontSize: '0.82rem',
          color: 'rgba(201,168,76,0.3)',
        }}
      >
        Potrditev bo poslana na vaš email
      </p>
    </div>
  );
}
