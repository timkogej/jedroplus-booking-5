'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBookingStore } from '@/store/bookingStore';

// Symbols that spin when a reel is active
const SPIN_SYMBOLS = ['🎰', '7️⃣', '🍒', '⭐', '🃏', '🍀', '💎', '🎲', '🔔', '🌟'];

interface ReelProps {
  emoji: string;
  value: string;
  label: string;
  locked: boolean;
  isSpinning: boolean;
  index: number;
}

function SingleReel({ emoji, value, label, locked, isSpinning, index }: ReelProps) {
  const { theme } = useBookingStore();
  const primary = theme.primaryColor;

  return (
    <div className="flex flex-col items-center gap-1.5 flex-1">
      {/* Label above reel */}
      <p
        className="text-[9px] tracking-[0.25em] uppercase font-bold"
        style={{ fontFamily: 'var(--font-orbitron)', color: `${primary}70` }}
      >
        {label}
      </p>

      {/* Reel window */}
      <div
        className="relative w-full rounded-lg overflow-hidden casino-scanlines"
        style={{
          height: 88,
          backgroundColor: '#0D1117',
          border: `2px solid ${locked ? primary : '#2a2a4a'}`,
          boxShadow: locked
            ? `0 0 12px ${primary}60, 0 0 25px ${primary}30, inset 0 0 12px ${primary}10`
            : 'inset 0 0 15px rgba(0,0,0,0.6)',
          transition: 'border-color 0.3s, box-shadow 0.5s',
        }}
      >
        {/* Horizontal win-line marker */}
        <div
          className="absolute inset-x-0 top-1/2 -translate-y-1/2 z-20 pointer-events-none"
          style={{
            height: 2,
            background: locked ? `${primary}60` : 'rgba(255,255,255,0.04)',
          }}
        />

        <AnimatePresence mode="wait">
          {isSpinning ? (
            /* ── Spinning State ── */
            <motion.div
              key="spinning"
              className="absolute inset-0 flex flex-col items-center gap-0 overflow-hidden"
              initial={{ filter: 'blur(0px)' }}
              animate={{ filter: ['blur(0px)', 'blur(4px)', 'blur(4px)', 'blur(0px)'] }}
              transition={{ duration: 0.8, times: [0, 0.1, 0.9, 1] }}
            >
              <motion.div
                className="flex flex-col items-center"
                animate={{ y: [-264, 0] }}
                transition={{ duration: 0.5, ease: 'linear', repeat: Infinity }}
              >
                {[...SPIN_SYMBOLS, ...SPIN_SYMBOLS, ...SPIN_SYMBOLS].map((sym, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-center select-none"
                    style={{ width: '100%', height: 28 }}
                  >
                    <span className="text-lg">{sym}</span>
                  </div>
                ))}
              </motion.div>
            </motion.div>
          ) : (
            /* ── Locked / Idle State ── */
            <motion.div
              key={`locked-${value}`}
              className="absolute inset-0 flex flex-col items-center justify-center gap-0.5 px-1"
              initial={locked ? { scale: 1.3, opacity: 0 } : { opacity: 1 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={locked ? { type: 'spring', stiffness: 350, damping: 22 } : {}}
            >
              <motion.span
                className="text-3xl select-none leading-none"
                animate={locked ? { rotate: [0, -8, 8, -4, 4, 0] } : {}}
                transition={{ duration: 0.4 }}
              >
                {emoji}
              </motion.span>
              <p
                className={`text-center leading-tight font-bold px-1 truncate w-full text-[10px] tracking-wider`}
                style={{
                  fontFamily: 'var(--font-orbitron)',
                  color: locked ? primary : 'rgba(255,255,255,0.3)',
                }}
              >
                {value}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Top/bottom fade overlay */}
        <div
          className="absolute inset-x-0 top-0 h-5 z-10 pointer-events-none"
          style={{ background: 'linear-gradient(to bottom, #0D1117, transparent)' }}
        />
        <div
          className="absolute inset-x-0 bottom-0 h-5 z-10 pointer-events-none"
          style={{ background: 'linear-gradient(to top, #0D1117, transparent)' }}
        />
      </div>

      {/* Lock badge */}
      <AnimatePresence>
        {locked && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-bold tracking-widest"
            style={{
              fontFamily: 'var(--font-orbitron)',
              backgroundColor: `${primary}20`,
              border: `1px solid ${primary}50`,
              color: primary,
            }}
          >
            ✓ LOCKED
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Jackpot celebration particles
function JackpotParticles({ active }: { active: boolean }) {
  const { theme } = useBookingStore();
  if (!active) return null;

  const particles = [
    ...Array(12).fill(null).map((_, i) => ({ id: i, symbol: '⭐', delay: i * 0.06 })),
    ...Array(8).fill(null).map((_, i) => ({ id: i + 12, symbol: '🪙', delay: i * 0.08 + 0.1 })),
    ...Array(6).fill(null).map((_, i) => ({ id: i + 20, symbol: '✨', delay: i * 0.1 + 0.05 })),
  ];

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl z-30">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute text-lg select-none"
          style={{
            left: `${10 + Math.random() * 80}%`,
            top: `${10 + Math.random() * 80}%`,
          }}
          initial={{ scale: 0, opacity: 0, y: 0 }}
          animate={{
            scale: [0, 1.5, 1, 0],
            opacity: [0, 1, 1, 0],
            y: [0, -30 - Math.random() * 40],
            x: [(Math.random() - 0.5) * 60],
            rotate: [0, Math.random() * 360],
          }}
          transition={{
            duration: 1.5,
            delay: p.delay,
            ease: 'easeOut',
          }}
        >
          {p.symbol}
        </motion.div>
      ))}
    </div>
  );
}

export default function SlotMachine() {
  const {
    theme,
    selectedService,
    selectedEmployeeId,
    anyPerson,
    selectedTime,
    employeesUI,
  } = useBookingStore();

  const [spinningReel, setSpinningReel] = useState<0 | 1 | 2 | 3>(0);
  const [showJackpot, setShowJackpot] = useState(false);

  const prevService = useRef(selectedService?.id ?? null);
  const prevEmployee = useRef<string | null>(selectedEmployeeId);
  const prevAnyPerson = useRef(anyPerson);
  const prevTime = useRef<string | null>(selectedTime);

  const triggerSpin = (reel: 1 | 2 | 3) => {
    setSpinningReel(reel);
    setTimeout(() => setSpinningReel(0), 900);
  };

  useEffect(() => {
    const newId = selectedService?.id ?? null;
    if (newId !== prevService.current) {
      prevService.current = newId;
      if (newId) triggerSpin(1);
    }
  }, [selectedService]);

  useEffect(() => {
    if (selectedEmployeeId !== prevEmployee.current || anyPerson !== prevAnyPerson.current) {
      prevEmployee.current = selectedEmployeeId;
      prevAnyPerson.current = anyPerson;
      if (selectedEmployeeId || anyPerson) triggerSpin(2);
    }
  }, [selectedEmployeeId, anyPerson]);

  useEffect(() => {
    if (selectedTime !== prevTime.current) {
      prevTime.current = selectedTime;
      if (selectedTime) {
        triggerSpin(3);
        // All 3 locked → jackpot sparkle
        if (selectedService && (selectedEmployeeId || anyPerson)) {
          setTimeout(() => {
            setShowJackpot(true);
            setTimeout(() => setShowJackpot(false), 2500);
          }, 1000);
        }
      }
    }
  }, [selectedTime, selectedService, selectedEmployeeId, anyPerson]);

  const selectedEmployee = employeesUI.find((e) => e.id === selectedEmployeeId);

  const reels = [
    {
      emoji: selectedService ? '🎰' : '❓',
      value: selectedService ? selectedService.naziv.slice(0, 9) : '???',
      label: 'IGRA',
      locked: !!selectedService,
      isSpinning: spinningReel === 1,
    },
    {
      emoji: anyPerson ? '🎲' : selectedEmployee ? '👤' : '❓',
      value: anyPerson ? 'KDORKOLI' : selectedEmployee ? selectedEmployee.label.split(' ')[0].toUpperCase().slice(0, 9) : '???',
      label: 'MOJSTER',
      locked: !!selectedEmployeeId || anyPerson,
      isSpinning: spinningReel === 2,
    },
    {
      emoji: selectedTime ? '🕐' : '❓',
      value: selectedTime ?? '???',
      label: 'ČAS',
      locked: !!selectedTime,
      isSpinning: spinningReel === 3,
    },
  ];

  const allLocked = reels.every((r) => r.locked);
  const primary = theme.primaryColor;

  return (
    <div
      className="relative rounded-2xl p-4 border-2"
      style={{
        backgroundColor: '#16213E',
        borderColor: allLocked ? '#FFD700' : `${primary}40`,
        boxShadow: allLocked
          ? '0 0 20px rgba(255,215,0,0.3), 0 0 40px rgba(255,215,0,0.15)'
          : `0 0 15px ${primary}20`,
        transition: 'border-color 0.6s, box-shadow 0.6s',
      }}
    >
      {/* Top chrome bar */}
      <div className="casino-slot-chrome h-2 rounded-t-lg -mx-4 -mt-4 mb-4" />

      {/* Top decorative dots */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex gap-1.5">
          {['#FF3366', '#FFD700', '#00FF87'].map((c, i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full"
              style={{
                backgroundColor: c,
                boxShadow: `0 0 6px ${c}`,
                animation: `casino-twinkle ${1.2 + i * 0.4}s ease-in-out infinite`,
              }}
            />
          ))}
        </div>
        <span
          className="text-[8px] tracking-[0.3em] uppercase font-bold"
          style={{ fontFamily: 'var(--font-orbitron)', color: `${primary}60` }}
        >
          🎰 BOOKING CASINO
        </span>
        <div className="flex gap-1.5">
          {['#00FF87', '#FFD700', '#FF3366'].map((c, i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full"
              style={{
                backgroundColor: c,
                boxShadow: `0 0 6px ${c}`,
                animation: `casino-twinkle ${1.6 - i * 0.4}s ease-in-out infinite`,
              }}
            />
          ))}
        </div>
      </div>

      {/* ─── The 3 Reels ─── */}
      <div className="flex gap-3">
        {reels.map((reel, i) => (
          <SingleReel key={i} {...reel} index={i} />
        ))}
      </div>

      {/* Winning line — when all reels locked */}
      <AnimatePresence>
        {allLocked && (
          <motion.div
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            exit={{ scaleX: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="casino-win-line rounded-full mx-2 mt-3"
            style={{ height: 2 }}
          />
        )}
      </AnimatePresence>

      {/* Jackpot label */}
      <AnimatePresence>
        {allLocked && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mt-3"
          >
            <span
              className="text-[10px] tracking-[0.35em] font-bold casino-neon-gold"
              style={{ fontFamily: 'var(--font-orbitron)' }}
            >
              ★ ★ ★ &nbsp;WINNING LINE&nbsp; ★ ★ ★
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Celebration particles */}
      <JackpotParticles active={showJackpot} />

      {/* Bottom chrome bar */}
      <div className="casino-slot-chrome h-2 rounded-b-lg -mx-4 -mb-4 mt-4" />
    </div>
  );
}
