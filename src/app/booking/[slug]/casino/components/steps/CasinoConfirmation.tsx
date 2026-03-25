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

// ── Confetti explosion on jackpot ─────────────────────────────
interface ConfettiPiece {
  id: number;
  symbol: string;
  x: number;
  y: number;
  delay: number;
  duration: number;
  rotate: number;
  size: number;
}

function JackpotConfetti({ active }: { active: boolean }) {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);
  const { theme } = useBookingStore();

  useEffect(() => {
    if (!active) return;
    const symbols = ['🪙', '⭐', '✨', '🎊', '🎉', '💎', '🃏', '7️⃣', '🍒'];
    const newPieces: ConfettiPiece[] = Array.from({ length: 40 }, (_, i) => ({
      id: i,
      symbol: symbols[Math.floor(Math.random() * symbols.length)],
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 0.8,
      duration: 1.5 + Math.random() * 1.5,
      rotate: Math.random() * 720 - 360,
      size: 16 + Math.floor(Math.random() * 16),
    }));
    setPieces(newPieces);
    const t = setTimeout(() => setPieces([]), 4000);
    return () => clearTimeout(t);
  }, [active]);

  if (!pieces.length) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {pieces.map((p) => (
        <motion.div
          key={p.id}
          className="absolute select-none"
          style={{ left: `${p.x}%`, top: `${p.y}%`, fontSize: p.size }}
          initial={{ scale: 0, opacity: 0, y: 0, x: 0, rotate: 0 }}
          animate={{
            scale: [0, 1.4, 1, 0.5, 0],
            opacity: [0, 1, 1, 0.6, 0],
            y: [0, -60 - Math.random() * 80],
            x: [(Math.random() - 0.5) * 120],
            rotate: p.rotate,
          }}
          transition={{ duration: p.duration, delay: p.delay, ease: 'easeOut' }}
        >
          {p.symbol}
        </motion.div>
      ))}
    </div>
  );
}

// ── Screen flash on jackpot ───────────────────────────────────
function FlashOverlay({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <motion.div
      className="fixed inset-0 bg-white z-40 pointer-events-none"
      initial={{ opacity: 0.8 }}
      animate={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    />
  );
}

// ── Success / Jackpot view ─────────────────────────────────────
function JackpotSuccessView() {
  const {
    theme,
    bookingConfirmation,
    selectedService,
    selectedDate,
    selectedTime,
    selectedEmployeeId,
    anyPerson,
    employeesUI,
    reset,
  } = useBookingStore();

  const [copied, setCopied] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showFlash, setShowFlash] = useState(false);
  const primary = theme.primaryColor;
  const selectedEmployee = employeesUI.find((e) => e.id === selectedEmployeeId);

  useEffect(() => {
    // Trigger the jackpot sequence
    const t1 = setTimeout(() => setShowFlash(true), 100);
    const t2 = setTimeout(() => setShowFlash(false), 500);
    const t3 = setTimeout(() => setShowConfetti(true), 300);
    const t4 = setTimeout(() => setShowConfetti(false), 4500);
    return () => {
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4);
    };
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

  return (
    <>
      <FlashOverlay active={showFlash} />
      <JackpotConfetti active={showConfetti} />

      <div className="text-center py-4">
        {/* JACKPOT header */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.5, type: 'spring', stiffness: 250, damping: 18 }}
          className="mb-6"
        >
          {/* Sparkle row */}
          <div className="flex items-center justify-center gap-2 mb-3">
            {['✨', '⭐', '✨', '⭐', '✨'].map((s, i) => (
              <motion.span
                key={i}
                className="text-lg"
                animate={{
                  opacity: [0.4, 1, 0.4],
                  scale: [0.8, 1.2, 0.8],
                }}
                transition={{
                  duration: 1.2,
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
              >
                {s}
              </motion.span>
            ))}
          </div>

          {/* The big JACKPOT text */}
          <div
            className="rounded-2xl p-6 mb-4 casino-neon-border"
            style={{ backgroundColor: '#16213E' }}
          >
            <motion.h1
              className="casino-jackpot-slam text-4xl md:text-5xl font-black tracking-[0.2em] uppercase mb-2"
              style={{
                fontFamily: 'var(--font-orbitron)',
                color: '#FFD700',
                textShadow: '0 0 10px #FFD700, 0 0 20px #FFD700, 0 0 40px #FFD700',
              }}
            >
              🎰 JACKPOT 🎰
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="text-lg font-bold tracking-[0.15em]"
              style={{
                fontFamily: 'var(--font-orbitron)',
                color: primary,
                textShadow: `0 0 8px ${primary}`,
              }}
            >
              ★ ★ ★ &nbsp; WINNER! &nbsp; ★ ★ ★
            </motion.p>
          </div>

          <div className="flex items-center justify-center gap-2 mt-3">
            {['✨', '⭐', '✨', '⭐', '✨'].map((s, i) => (
              <motion.span
                key={i}
                className="text-lg"
                animate={{ opacity: [0.4, 1, 0.4], scale: [0.8, 1.2, 0.8] }}
                transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 + 0.6 }}
              >
                {s}
              </motion.span>
            ))}
          </div>
        </motion.div>

        {/* Winning ticket */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.5 }}
          className="rounded-xl overflow-hidden mb-6 text-left"
          style={{
            backgroundColor: '#1A1A2E',
            border: `2px solid #FFD700`,
            boxShadow: '0 0 20px rgba(255,215,0,0.2)',
          }}
        >
          {/* Ticket header */}
          <div
            className="px-5 py-3 flex items-center justify-between"
            style={{
              background: 'linear-gradient(135deg, rgba(255,215,0,0.15), rgba(255,215,0,0.05))',
              borderBottom: '1px solid rgba(255,215,0,0.2)',
            }}
          >
            <span
              className="text-xs font-bold tracking-[0.25em] uppercase casino-neon-gold"
              style={{ fontFamily: 'var(--font-orbitron)' }}
            >
              🎫 DOBITNA VSTOPNICA
            </span>
            <span
              className="text-xs font-bold tracking-wider"
              style={{ fontFamily: 'var(--font-orbitron)', color: 'rgba(255,215,0,0.5)' }}
            >
              #WIN
            </span>
          </div>

          {/* Ticket body */}
          <div className="px-5 py-4 space-y-3">
            {(selectedEmployee || anyPerson) && (
              <div className="flex justify-between items-center">
                <span
                  className="text-[9px] tracking-widest uppercase"
                  style={{ fontFamily: 'var(--font-orbitron)', color: 'rgba(255,255,255,0.35)' }}
                >
                  👤 Mojster
                </span>
                <span
                  className="text-sm font-bold text-white"
                  style={{ fontFamily: 'var(--font-inter)' }}
                >
                  {selectedEmployee ? selectedEmployee.label : 'Kdorkoli prost'}
                </span>
              </div>
            )}

            {bookingConfirmation?.storitev && (
              <div className="flex justify-between items-center">
                <span
                  className="text-[9px] tracking-widest uppercase"
                  style={{ fontFamily: 'var(--font-orbitron)', color: 'rgba(255,255,255,0.35)' }}
                >
                  🎰 Storitev
                </span>
                <span
                  className="text-sm font-bold text-white text-right max-w-[180px] leading-tight"
                  style={{ fontFamily: 'var(--font-inter)' }}
                >
                  {bookingConfirmation.storitev}
                </span>
              </div>
            )}

            {bookingConfirmation?.datum && (
              <div className="flex justify-between items-center">
                <span
                  className="text-[9px] tracking-widest uppercase"
                  style={{ fontFamily: 'var(--font-orbitron)', color: 'rgba(255,255,255,0.35)' }}
                >
                  📅 Datum
                </span>
                <span
                  className="text-sm font-bold text-white"
                  style={{ fontFamily: 'var(--font-inter)' }}
                >
                  {bookingConfirmation.datum}
                </span>
              </div>
            )}

            {bookingConfirmation?.cas && (
              <div className="flex justify-between items-center">
                <span
                  className="text-[9px] tracking-widest uppercase"
                  style={{ fontFamily: 'var(--font-orbitron)', color: 'rgba(255,255,255,0.35)' }}
                >
                  ⏰ Ura
                </span>
                <span
                  className="text-sm font-bold"
                  style={{ fontFamily: 'var(--font-orbitron)', color: primary }}
                >
                  {bookingConfirmation.cas}
                </span>
              </div>
            )}

            {selectedService && (
              <div className="flex justify-between items-center">
                <span
                  className="text-[9px] tracking-widest uppercase"
                  style={{ fontFamily: 'var(--font-orbitron)', color: 'rgba(255,255,255,0.35)' }}
                >
                  ⏱️ Trajanje
                </span>
                <span
                  className="text-sm font-bold text-white"
                  style={{ fontFamily: 'var(--font-inter)' }}
                >
                  {formatDuration(selectedService.trajanjeMin)}
                </span>
              </div>
            )}
          </div>

          {/* Ticket tear line */}
          <div
            className="flex items-center gap-0 mx-3 my-0"
            style={{ borderTop: '2px dashed rgba(255,215,0,0.3)' }}
          />

          {/* Price */}
          {selectedService && (
            <div className="px-5 py-4 flex items-center justify-between">
              <span
                className="text-[10px] tracking-[0.3em] uppercase font-bold"
                style={{ fontFamily: 'var(--font-orbitron)', color: 'rgba(255,215,0,0.6)' }}
              >
                💰 JACKPOT
              </span>
              <span
                className="text-2xl font-black casino-neon-gold"
                style={{ fontFamily: 'var(--font-orbitron)' }}
              >
                €{selectedService.cena}
              </span>
            </div>
          )}
        </motion.div>

        {/* Action buttons */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1 }}
          className="space-y-3"
        >
          <div className="flex gap-3">
            <motion.button
              onClick={handleAddToCalendar}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className="flex-1 py-3 rounded-xl text-xs font-bold tracking-wider casino-btn-gold"
              style={{ fontFamily: 'var(--font-orbitron)' }}
            >
              📅 DODAJ V KOLEDAR
            </motion.button>
            <motion.button
              onClick={handleShare}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className="flex-1 py-3 rounded-xl text-xs font-bold tracking-wider casino-btn-outline"
              style={{ fontFamily: 'var(--font-orbitron)' }}
            >
              {copied ? '✓ KOPIRANO' : '📤 DELI'}
            </motion.button>
          </div>

          <motion.button
            onClick={reset}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-4 rounded-xl font-black text-sm tracking-[0.12em] uppercase casino-btn-primary"
            style={{ fontFamily: 'var(--font-orbitron)' }}
          >
            🎰 PLAY AGAIN — NOVA IGRA
          </motion.button>
        </motion.div>
      </div>
    </>
  );
}

// ── Confirmation review (pre-submit) view ─────────────────────
export default function CasinoConfirmation({ companySlug }: Props) {
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
  const primary = theme.primaryColor;
  const selectedEmployee = employeesUI.find((e) => e.id === selectedEmployeeId);

  // If already confirmed → show jackpot
  if (bookingConfirmation?.success) {
    return <JackpotSuccessView />;
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

  return (
    <div>
      {/* Title */}
      <p
        className="text-sm mb-5"
        style={{ fontFamily: 'var(--font-inter)', color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}
      >
        Preverite svojo dobitno kombinacijo pred potrditvijo.
      </p>

      {/* Review card */}
      <div
        className="rounded-xl overflow-hidden mb-5"
        style={{ backgroundColor: '#1A1A2E', border: `1px solid ${primary}30` }}
      >
        <div
          className="px-4 py-3 flex items-center gap-2"
          style={{
            background: `linear-gradient(135deg, ${primary}15, transparent)`,
            borderBottom: `1px solid ${primary}20`,
          }}
        >
          <span
            className="text-[9px] font-bold tracking-[0.3em] uppercase"
            style={{ fontFamily: 'var(--font-orbitron)', color: primary }}
          >
            🎰 WINNING COMBINATION
          </span>
        </div>

        <div className="px-4 py-4 space-y-3.5">
          {(selectedEmployee || anyPerson) && (
            <div className="flex items-start gap-3">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{
                  backgroundColor: `${primary}15`,
                  border: `1px solid ${primary}30`,
                  color: primary,
                  fontFamily: 'var(--font-orbitron)',
                }}
              >
                {selectedEmployee?.initials ?? '?'}
              </div>
              <div>
                <p className="text-[9px] tracking-widest uppercase mb-0.5"
                  style={{ fontFamily: 'var(--font-orbitron)', color: 'rgba(255,255,255,0.35)' }}>
                  Specialist
                </p>
                <p className="text-sm font-bold text-white"
                  style={{ fontFamily: 'var(--font-inter)' }}>
                  {selectedEmployee ? selectedEmployee.label : 'Kdorkoli prost'}
                </p>
              </div>
            </div>
          )}

          {selectedService && (
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 flex items-center justify-center text-base flex-shrink-0">
                🎰
              </div>
              <div>
                <p className="text-[9px] tracking-widest uppercase mb-0.5"
                  style={{ fontFamily: 'var(--font-orbitron)', color: 'rgba(255,255,255,0.35)' }}>
                  Storitev
                </p>
                <p className="text-sm font-bold text-white"
                  style={{ fontFamily: 'var(--font-inter)' }}>
                  {selectedService.naziv}
                </p>
                <p className="text-xs mt-0.5"
                  style={{ fontFamily: 'var(--font-inter)', color: 'rgba(255,255,255,0.35)' }}>
                  {formatDuration(selectedService.trajanjeMin)}
                </p>
              </div>
            </div>
          )}

          {selectedDate && selectedTime && (
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 flex items-center justify-center text-base flex-shrink-0">
                📅
              </div>
              <div>
                <p className="text-[9px] tracking-widest uppercase mb-0.5"
                  style={{ fontFamily: 'var(--font-orbitron)', color: 'rgba(255,255,255,0.35)' }}>
                  Datum in ura
                </p>
                <p className="text-sm font-bold text-white"
                  style={{ fontFamily: 'var(--font-inter)' }}>
                  {format(selectedDate, 'EEEE, d. MMMM yyyy', { locale: sl })}
                </p>
                <p className="text-sm font-bold mt-0.5"
                  style={{ fontFamily: 'var(--font-orbitron)', color: primary }}>
                  {selectedTime}
                </p>
              </div>
            </div>
          )}

          {customerDetails && (
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 flex items-center justify-center text-base flex-shrink-0">
                👤
              </div>
              <div>
                <p className="text-[9px] tracking-widest uppercase mb-0.5"
                  style={{ fontFamily: 'var(--font-orbitron)', color: 'rgba(255,255,255,0.35)' }}>
                  Igralec
                </p>
                <p className="text-sm font-bold text-white"
                  style={{ fontFamily: 'var(--font-inter)' }}>
                  {customerDetails.firstName} {customerDetails.lastName}
                </p>
                <p className="text-xs" style={{ fontFamily: 'var(--font-inter)', color: 'rgba(255,255,255,0.4)' }}>
                  {customerDetails.email} · {customerDetails.phone}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Price row */}
        {selectedService && (
          <>
            <div className="casino-divider-gold mx-4" />
            <div className="px-4 py-3 flex items-center justify-between">
              <span
                className="text-[10px] tracking-[0.3em] uppercase font-bold"
                style={{ fontFamily: 'var(--font-orbitron)', color: 'rgba(255,215,0,0.6)' }}
              >
                💰 JACKPOT
              </span>
              <span
                className="text-2xl font-black casino-neon-gold"
                style={{ fontFamily: 'var(--font-orbitron)' }}
              >
                €{selectedService.cena}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 rounded-lg p-3 flex items-center gap-2"
            style={{
              backgroundColor: 'rgba(255,51,102,0.1)',
              border: '1px solid rgba(255,51,102,0.4)',
            }}
          >
            <span>⚠️</span>
            <p
              className="text-xs font-bold tracking-wider"
              style={{ fontFamily: 'var(--font-orbitron)', color: '#FF3366' }}
            >
              {error}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirm button */}
      <motion.button
        onClick={handleConfirm}
        disabled={isSubmitting}
        whileHover={!isSubmitting ? { scale: 1.02 } : {}}
        whileTap={!isSubmitting ? { scale: 0.97 } : {}}
        className="w-full py-4 rounded-xl font-black text-sm tracking-[0.12em] uppercase casino-btn-primary relative overflow-hidden"
        style={{ fontFamily: 'var(--font-orbitron)', opacity: isSubmitting ? 0.8 : 1 }}
      >
        {/* Shine sweep */}
        {!isSubmitting && (
          <motion.div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.15) 50%, transparent 70%)',
            }}
            initial={{ x: '-100%' }}
            whileHover={{ x: '100%' }}
            transition={{ duration: 0.55 }}
          />
        )}

        {isSubmitting ? (
          <div className="flex items-center justify-center gap-3">
            <motion.div
              className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
            />
            <span>SPINNING FOR JACKPOT...</span>
          </div>
        ) : (
          '🎰 PULL TO WIN — POTRDI REZERVACIJO'
        )}
      </motion.button>

      <p
        className="text-center text-[9px] tracking-[0.2em] uppercase mt-3"
        style={{ fontFamily: 'var(--font-orbitron)', color: 'rgba(255,255,255,0.2)' }}
      >
        Potrditev bo poslana na vaš email
      </p>
    </div>
  );
}
