'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { useBookingStore } from '@/store/bookingStore';
import { EmployeeUI } from '@/types';
import { t } from '../../i18n';

const SUITS = ['♠', '♥', '♦', '♣'];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.09 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, scale: 0.93, y: 12 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' as const },
  },
};

const checkmarkVariants: Variants = {
  initial: { scale: 0, opacity: 0 },
  animate: {
    scale: 1,
    opacity: 1,
    transition: { type: 'spring', stiffness: 400, damping: 15 },
  },
};

function SpecialistCard({
  employee,
  index,
  onSelect,
  isRouletteHighlighted,
}: {
  employee: EmployeeUI;
  index: number;
  onSelect: (id: string) => void;
  isRouletteHighlighted: boolean;
}) {
  const { selectedEmployeeId } = useBookingStore();
  const isSelected = selectedEmployeeId === employee.id;
  const suit = SUITS[index % SUITS.length];
  const suitIsRed = suit === '♥' || suit === '♦';

  return (
    <motion.button
      variants={itemVariants}
      onClick={() => onSelect(employee.id)}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.97 }}
      className="relative rounded-lg text-left overflow-hidden group"
      style={{
        background: isSelected
          ? 'rgba(12, 50, 24, 0.95)'
          : 'rgba(10, 40, 20, 0.82)',
        backdropFilter: 'blur(8px)',
        border: isRouletteHighlighted
          ? '2px solid rgba(201, 168, 76, 0.95)'
          : isSelected
          ? '1px solid rgba(201, 168, 76, 0.75)'
          : '1px solid rgba(201, 168, 76, 0.2)',
        boxShadow: isRouletteHighlighted
          ? '0 0 28px rgba(201, 168, 76, 0.55), inset 0 0 20px rgba(201, 168, 76, 0.1)'
          : isSelected
          ? '0 0 24px rgba(201, 168, 76, 0.15), inset 0 0 16px rgba(201, 168, 76, 0.04)'
          : '0 4px 16px rgba(0,0,0,0.2)',
        transition: 'all 0.15s ease',
        aspectRatio: '2/3',
        minHeight: '160px',
      }}
    >
      {/* Card suit top-left */}
      <div
        className="absolute top-2.5 left-3 transition-opacity duration-300 group-hover:opacity-50"
        style={{
          fontFamily: 'Georgia, serif',
          fontSize: '0.9rem',
          color: suitIsRed ? 'rgba(180,60,60,0.2)' : 'rgba(201,168,76,0.15)',
          lineHeight: 1,
        }}
      >
        {suit}
      </div>

      {/* Card suit bottom-right rotated */}
      <div
        className="absolute bottom-2.5 right-3 rotate-180 transition-opacity duration-300 group-hover:opacity-50"
        style={{
          fontFamily: 'Georgia, serif',
          fontSize: '0.9rem',
          color: suitIsRed ? 'rgba(180,60,60,0.2)' : 'rgba(201,168,76,0.15)',
          lineHeight: 1,
        }}
      >
        {suit}
      </div>

      {/* Selected checkmark */}
      <AnimatePresence>
        {isSelected && !isRouletteHighlighted && (
          <motion.div
            variants={checkmarkVariants}
            initial="initial"
            animate="animate"
            exit="initial"
            className="absolute top-2.5 right-3 w-5 h-5 rounded-full flex items-center justify-center z-10"
            style={{ background: '#c9a84c' }}
          >
            <span style={{ color: '#060f08', fontSize: '0.6rem', fontWeight: 700 }}>✓</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Roulette glow overlay */}
      <AnimatePresence>
        {isRouletteHighlighted && (
          <motion.div
            key="roulette-glow"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.08 }}
            className="absolute inset-0 pointer-events-none rounded-lg"
            style={{
              background: 'radial-gradient(ellipse at center, rgba(201,168,76,0.18) 0%, transparent 70%)',
            }}
          />
        )}
      </AnimatePresence>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 px-2">
        {/* Avatar */}
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center font-bold transition-all duration-200"
          style={{
            background: '#1a6b35',
            border: `2px solid ${isRouletteHighlighted ? '#e8c96d' : isSelected ? '#c9a84c' : 'rgba(201, 168, 76, 0.3)'}`,
            fontFamily: 'var(--font-playfair)',
            fontSize: '0.85rem',
            color: isRouletteHighlighted || isSelected ? '#c9a84c' : '#e8c96d',
            boxShadow: isRouletteHighlighted
              ? '0 0 20px rgba(201,168,76,0.5)'
              : isSelected
              ? '0 0 12px rgba(201,168,76,0.3)'
              : 'none',
            transition: 'all 0.15s ease',
          }}
        >
          {employee.initials}
        </div>

        {/* Name & title */}
        <div className="text-center px-1">
          <p
            className="font-bold leading-tight"
            style={{
              fontFamily: 'var(--font-playfair)',
              fontSize: '0.78rem',
              color: '#f5edd6',
            }}
          >
            {employee.label}
          </p>
          {employee.subtitle && (
            <p
              className="mt-0.5"
              style={{
                fontFamily: 'var(--font-oswald)',
                fontSize: '0.52rem',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: '#a89060',
              }}
            >
              {employee.subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Bottom gold line on hover */}
      <motion.div
        className="absolute bottom-0 inset-x-0 h-px"
        style={{ background: 'linear-gradient(to right, transparent, #c9a84c, transparent)' }}
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 1 }}
      />
    </motion.button>
  );
}

// ── Presenečenje / Surprise card ───────────────────────────────
function SurpriseCard({
  isSpinning,
  onClick,
  language,
}: {
  isSpinning: boolean;
  onClick: () => void;
  language: string;
}) {
  return (
    <motion.button
      variants={itemVariants}
      onClick={onClick}
      whileHover={!isSpinning ? { y: -4 } : {}}
      whileTap={!isSpinning ? { scale: 0.97 } : {}}
      disabled={isSpinning}
      className="relative rounded-lg text-left overflow-hidden group"
      style={{
        background: 'rgba(8, 30, 15, 0.7)',
        backdropFilter: 'blur(8px)',
        border: '1.5px dashed rgba(201, 168, 76, 0.35)',
        transition: 'all 0.3s ease',
        aspectRatio: '2/3',
        minHeight: '160px',
        cursor: isSpinning ? 'default' : 'pointer',
      }}
    >
      {/* Subtle bg */}
      <div
        className="absolute inset-0 rounded-lg"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(201,168,76,0.04), transparent 70%)',
        }}
      />

      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 px-2">
        <AnimatePresence mode="wait">
          {isSpinning ? (
            <motion.div
              key="spinning"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-3"
            >
              {/* Cycling diamonds */}
              <div className="flex gap-1.5 items-center">
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    style={{ color: '#c9a84c', fontFamily: 'Georgia, serif', fontSize: i === 1 ? '1.1rem' : '0.65rem' }}
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' as const }}
                  >
                    ◆
                  </motion.span>
                ))}
              </div>
              <motion.div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{
                  background: 'rgba(13, 59, 30, 0.7)',
                  border: '2px solid rgba(201,168,76,0.5)',
                }}
                animate={{ boxShadow: ['0 0 8px rgba(201,168,76,0.2)', '0 0 20px rgba(201,168,76,0.55)', '0 0 8px rgba(201,168,76,0.2)'] }}
                transition={{ duration: 0.7, repeat: Infinity, ease: 'easeInOut' as const }}
              >
                <span style={{ color: '#c9a84c', fontSize: '1rem', fontFamily: 'Georgia, serif' }}>🎲</span>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-2.5"
            >
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{
                  background: 'rgba(13, 59, 30, 0.7)',
                  border: '2px solid rgba(201,168,76,0.25)',
                }}
              >
                <span style={{ fontFamily: 'Georgia, serif', fontSize: '1.2rem', color: 'rgba(201,168,76,0.5)' }}>
                  🎲
                </span>
              </div>
              <div className="text-center">
                <p
                  className="font-bold"
                  style={{
                    fontFamily: 'var(--font-playfair)',
                    fontSize: '0.72rem',
                    color: '#f5edd6',
                  }}
                >
                  {t(language as 'sl' | 'en', 'surpriseMe')}
                </p>
                <p
                  className="mt-0.5 italic"
                  style={{
                    fontFamily: 'var(--font-cormorant)',
                    fontSize: '0.7rem',
                    color: 'rgba(201,168,76,0.45)',
                  }}
                >
                  {t(language as 'sl' | 'en', 'surpriseMeDesc')}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.button>
  );
}

export default function CasinoEmployeeSelection() {
  const { employeesUI, eligibleEmployeeIds, selectEmployee, language } = useBookingStore();
  const [rouletteHighlight, setRouletteHighlight] = useState<string | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);

  const eligibleSet = new Set(eligibleEmployeeIds);
  const filteredEmployees = employeesUI.filter((e) => eligibleSet.has(String(e.id)));
  const noEmployees = eligibleEmployeeIds.length === 0;

  const handleSurprise = useCallback(() => {
    if (isSpinning || filteredEmployees.length === 0) return;

    // Randomly pick the winner from eligible employees
    const winner = filteredEmployees[Math.floor(Math.random() * filteredEmployees.length)];
    setIsSpinning(true);

    const totalSteps = filteredEmployees.length === 1
      ? 5
      : 14 + filteredEmployees.length * 3;

    let step = 0;
    let prevId: string | null = null;

    const getDelay = (s: number): number => {
      const p = s / totalSteps;
      if (p < 0.5) return 75;
      if (p < 0.7) return 140;
      if (p < 0.85) return 240;
      if (p < 0.95) return 400;
      return 580;
    };

    const cycle = () => {
      if (step >= totalSteps) {
        // Land on winner
        setRouletteHighlight(winner.id);
        // Hold the winner highlight, then advance
        setTimeout(() => {
          setIsSpinning(false);
          setRouletteHighlight(null);
          // any_person = false — concrete employee chosen locally at random
          selectEmployee(winner.id, false);
        }, 850);
        return;
      }

      const pool = filteredEmployees.length > 1
        ? filteredEmployees.filter((e) => e.id !== prevId)
        : filteredEmployees;
      const next = pool[Math.floor(Math.random() * pool.length)];
      prevId = next.id;
      setRouletteHighlight(next.id);
      step++;
      setTimeout(cycle, getDelay(step));
    };

    setTimeout(cycle, 80);
  }, [isSpinning, filteredEmployees, selectEmployee]);

  if (noEmployees) {
    return (
      <div className="text-center py-16">
        <span style={{ fontFamily: 'Georgia, serif', fontSize: '2rem', color: 'rgba(201,168,76,0.2)' }}>◆</span>
        <p
          className="mt-4 italic"
          style={{ fontFamily: 'var(--font-cormorant)', fontSize: '1rem', color: 'rgba(201,168,76,0.4)' }}
        >
          {t(language, 'noStaff')}
        </p>
      </div>
    );
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      <motion.p
        variants={itemVariants}
        className="italic mb-7"
        style={{
          fontFamily: 'var(--font-cormorant)',
          fontSize: '1.05rem',
          color: 'rgba(232,217,184,0.65)',
          lineHeight: 1.7,
        }}
      >
        {t(language, 'employeeIntro')}
      </motion.p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
        <SurpriseCard
          isSpinning={isSpinning}
          onClick={handleSurprise}
          language={language}
        />
        {filteredEmployees.map((emp, i) => (
          <SpecialistCard
            key={emp.id}
            employee={emp}
            index={i}
            onSelect={(id) => selectEmployee(id, false)}
            isRouletteHighlighted={rouletteHighlight === emp.id}
          />
        ))}
      </div>

      {/* Chip divider */}
      <motion.div
        variants={itemVariants}
        className="flex items-center justify-center gap-2 mt-6"
      >
        {['#922b21', '#1e6b30', '#1a1a1a', '#1a4480', '#e0d4b8'].map((color, i) => (
          <div key={i} className="mc-chip" style={{ background: color }} />
        ))}
      </motion.div>
    </motion.div>
  );
}
