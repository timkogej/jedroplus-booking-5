'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { useBookingStore } from '@/store/bookingStore';
import type { EmployeeUI } from '@/types';
import { t } from '../../i18n';
import { CREAM, Chip, EASE, FONT_BODY, FONT_HEAD, FONT_LABEL, MUTED, PointerGlow, SUITS, mix, pointerLight } from '../ui';

const deckVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.09, delayChildren: 0.1 } },
};

// Each card is dealt onto the table and turns face up.
const dealVariants: Variants = {
  hidden: { opacity: 0, y: 40, rotateY: -80, rotateZ: -4 },
  visible: { opacity: 1, y: 0, rotateY: 0, rotateZ: 0, transition: { duration: 0.7, ease: EASE } },
};

function CardCorner({ text, suit, flip }: { text: string; suit: string; flip?: boolean }) {
  return (
    <div
      className={`pointer-events-none absolute flex flex-col items-center leading-none ${flip ? 'bottom-2.5 right-3 rotate-180' : 'left-3 top-2.5'}`}
      style={{ color: mix('--cx-glow', 55) }}
      aria-hidden="true"
    >
      <span className="text-[12px] font-bold" style={{ fontFamily: FONT_HEAD }}>{text}</span>
      <span className="mt-0.5 text-[11px]" style={{ fontFamily: 'Georgia, serif' }}>{suit}</span>
    </div>
  );
}

function SpecialistCard({
  employee,
  index,
  onSelect,
  highlighted,
  dimmed,
}: {
  employee: EmployeeUI;
  index: number;
  onSelect: (id: string) => void;
  highlighted: boolean;
  dimmed: boolean;
}) {
  const selectedEmployeeId = useBookingStore((s) => s.selectedEmployeeId);
  const isSelected = selectedEmployeeId === employee.id;
  const suit = SUITS[index % SUITS.length];
  const on = highlighted || isSelected;

  return (
    <motion.div variants={dealVariants}>
    <motion.button
      onClick={() => onSelect(employee.id)}
      onPointerMove={pointerLight}
      whileHover={{ y: -5 }}
      whileTap={{ scale: 0.96 }}
      animate={{ opacity: dimmed ? 0.45 : 1, scale: highlighted ? 1.04 : 1 }}
      transition={{ duration: 0.12 }}
      aria-pressed={isSelected}
      className={`cx-card is-hover group relative w-full overflow-hidden text-left ${on ? 'is-on' : ''}`}
      style={{ aspectRatio: '3 / 4', minHeight: 176 }}
    >
      <PointerGlow />
      <CardCorner text={employee.initials} suit={suit} />
      <CardCorner text={employee.initials} suit={suit} flip />

      {/* Inner frame, like the border printed on a card */}
      <span
        className="pointer-events-none absolute inset-x-[30px] inset-y-[12px] rounded-[9px]"
        style={{ boxShadow: `inset 0 0 0 1px ${on ? mix('--cx-glow', 35) : 'rgba(255,255,255,0.05)'}`, transition: 'box-shadow 0.3s' }}
        aria-hidden="true"
      />

      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-3">
        <motion.div animate={{ rotate: on ? 360 : 0 }} transition={{ duration: 0.8, ease: EASE }}>
          <Chip size={58} on={isSelected && !highlighted}>
            {employee.initials}
          </Chip>
        </motion.div>
        <div className="text-center">
          <p className="text-[16px] font-bold leading-tight" style={{ fontFamily: FONT_HEAD, color: CREAM }}>
            {employee.label}
          </p>
          {employee.subtitle && (
            <p className="mt-1 text-[11px] uppercase" style={{ fontFamily: FONT_LABEL, letterSpacing: '0.14em', color: MUTED }}>
              {employee.subtitle}
            </p>
          )}
        </div>
      </div>
    </motion.button>
    </motion.div>
  );
}

// ── "Anyone available": spins like a roulette across the cards ──
function SurpriseCard({ isSpinning, onClick, language }: { isSpinning: boolean; onClick: () => void; language: 'sl' | 'en' }) {
  const anyPerson = useBookingStore((s) => s.anyPerson);

  return (
    <motion.button
      variants={dealVariants}
      onClick={onClick}
      onPointerMove={pointerLight}
      whileHover={!isSpinning ? { y: -5 } : {}}
      whileTap={!isSpinning ? { scale: 0.96 } : {}}
      disabled={isSpinning}
      aria-pressed={anyPerson}
      className={`cx-card is-hover group relative w-full overflow-hidden text-left ${anyPerson ? 'is-on' : ''}`}
      style={{ aspectRatio: '3 / 4', minHeight: 176, borderStyle: 'dashed', borderColor: mix('--cx-glow', 40) }}
    >
      <PointerGlow />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-3">
        <motion.svg
          width="58"
          height="58"
          viewBox="0 0 58 58"
          animate={{ rotate: isSpinning ? 720 : 0 }}
          transition={isSpinning ? { duration: 2.4, ease: [0.3, 0.1, 0.2, 1] } : { duration: 0.3 }}
          aria-hidden="true"
        >
          <circle cx="29" cy="29" r="27" fill="none" stroke="var(--cx-glow)" strokeWidth="1.5" />
          {Array.from({ length: 12 }).map((_, i) => (
            <path
              key={i}
              d="M29 29 L29 4 A25 25 0 0 1 41.5 7.35 Z"
              fill={i % 2 ? 'var(--cx-a)' : 'rgba(255,255,255,0.08)'}
              transform={`rotate(${i * 30} 29 29)`}
            />
          ))}
          <circle cx="29" cy="29" r="9" fill="#111" stroke="var(--cx-glow)" strokeWidth="1.5" />
          <circle cx="29" cy="29" r="3" fill="var(--cx-glow)" />
        </motion.svg>
        <div className="text-center">
          <p className="text-[16px] font-bold leading-tight" style={{ fontFamily: FONT_HEAD, color: CREAM }}>
            {t(language, 'surpriseMe')}
          </p>
          <p className="mt-1 text-[12px] leading-4" style={{ fontFamily: FONT_BODY, color: MUTED }}>
            {t(language, 'surpriseMeDesc')}
          </p>
        </div>
      </div>
    </motion.button>
  );
}

export default function CasinoEmployeeSelection() {
  const { employeesUI, eligibleEmployeeIds, selectEmployee, language } = useBookingStore();
  const [rouletteHighlight, setRouletteHighlight] = useState<string | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const timers = useRef<number[]>([]);

  useEffect(() => () => timers.current.forEach((id) => window.clearTimeout(id)), []);

  const eligibleSet = new Set(eligibleEmployeeIds);
  const filteredEmployees = employeesUI.filter((e) => eligibleSet.has(String(e.id)));
  const noEmployees = eligibleEmployeeIds.length === 0;

  const handleSurprise = useCallback(() => {
    if (isSpinning || filteredEmployees.length === 0) return;

    // The button says "anyone available": the spin is only a flourish, the
    // booking goes out as any_person so every specialist's free times show.
    setIsSpinning(true);
    const totalSteps = filteredEmployees.length === 1 ? 5 : 12 + filteredEmployees.length * 2;
    let step = 0;
    let prevId: string | null = null;

    const getDelay = (s: number): number => {
      const p = s / totalSteps;
      if (p < 0.5) return 80;
      if (p < 0.75) return 140;
      if (p < 0.9) return 230;
      return 360;
    };

    const later = (fn: () => void, ms: number) => {
      timers.current.push(window.setTimeout(fn, ms));
    };

    const cycle = () => {
      if (step >= totalSteps) {
        setRouletteHighlight(null);
        later(() => {
          setIsSpinning(false);
          selectEmployee(null, true);
        }, 300);
        return;
      }
      const pool = filteredEmployees.length > 1 ? filteredEmployees.filter((e) => e.id !== prevId) : filteredEmployees;
      const next = pool[Math.floor(Math.random() * pool.length)];
      prevId = next.id;
      setRouletteHighlight(next.id);
      step++;
      later(cycle, getDelay(step));
    };

    later(cycle, 80);
  }, [isSpinning, filteredEmployees, selectEmployee]);

  if (noEmployees) {
    return (
      <div className="py-16 text-center">
        <span style={{ fontFamily: 'Georgia, serif', fontSize: '2rem', color: mix('--cx-glow', 30) }}>◆</span>
        <p className="mt-4 text-[15px]" style={{ fontFamily: FONT_BODY, color: MUTED }}>
          {t(language, 'noStaff')}
        </p>
      </div>
    );
  }

  return (
    <div>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE }}
        className="mb-6 text-[16px] leading-6"
        style={{ fontFamily: FONT_BODY, color: MUTED }}
      >
        {t(language, 'employeeIntro')}
      </motion.p>

      <motion.div
        variants={deckVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 gap-3 sm:grid-cols-3"
        style={{ perspective: 1000 }}
      >
        <SurpriseCard isSpinning={isSpinning} onClick={handleSurprise} language={language} />
        <AnimatePresence>
          {filteredEmployees.map((emp, i) => (
            <SpecialistCard
              key={emp.id}
              employee={emp}
              index={i}
              onSelect={(id) => !isSpinning && selectEmployee(id, false)}
              highlighted={rouletteHighlight === emp.id}
              dimmed={isSpinning && rouletteHighlight !== emp.id}
            />
          ))}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
