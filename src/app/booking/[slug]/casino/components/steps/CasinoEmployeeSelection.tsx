'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBookingStore } from '@/store/bookingStore';
import { EmployeeUI } from '@/types';

// Playing card suits cycling per employee
const SUITS = ['♠', '♥', '♦', '♣'];
const SUIT_COLORS = ['#C0C0C0', '#FF6B9D', '#FF6B9D', '#C0C0C0'];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.35 } },
};

function PlayingCard({
  employee,
  index,
  onSelect,
}: {
  employee: EmployeeUI;
  index: number;
  onSelect: (id: string) => void;
}) {
  const { theme } = useBookingStore();
  const primary = theme.primaryColor;
  const suit = SUITS[index % SUITS.length];
  const suitColor = SUIT_COLORS[index % SUIT_COLORS.length];

  return (
    <motion.button
      variants={itemVariants}
      onClick={() => onSelect(employee.id)}
      whileHover={{ scale: 1.04, y: -4 }}
      whileTap={{ scale: 0.97 }}
      className="relative rounded-xl overflow-hidden group text-left transition-all"
      style={{
        backgroundColor: '#1A1A2E',
        border: `1px solid rgba(139,92,246,0.25)`,
        aspectRatio: '2/3',
        minHeight: 160,
      }}
    >
      {/* Card corner suit (top-left) */}
      <div className="absolute top-2 left-2.5 leading-none">
        <p className="text-xl font-bold" style={{ color: suitColor, fontFamily: 'Georgia, serif' }}>
          {suit}
        </p>
      </div>

      {/* Card corner suit (bottom-right, rotated) */}
      <div className="absolute bottom-2 right-2.5 rotate-180 leading-none">
        <p className="text-xl font-bold" style={{ color: suitColor, fontFamily: 'Georgia, serif' }}>
          {suit}
        </p>
      </div>

      {/* Hover glow */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: `radial-gradient(ellipse at center, ${primary}12, transparent 70%)` }}
      />

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-2">
        {/* Initials circle */}
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold transition-all duration-300"
          style={{
            border: `2px solid ${primary}60`,
            backgroundColor: `${primary}15`,
            color: primary,
            fontFamily: 'var(--font-orbitron)',
            boxShadow: `0 0 12px ${primary}30`,
          }}
        >
          {employee.initials}
        </div>

        {/* Name */}
        <div className="text-center">
          <p
            className="text-xs font-bold tracking-wide text-white leading-tight"
            style={{ fontFamily: 'var(--font-orbitron)' }}
          >
            {employee.label}
          </p>
          {employee.subtitle && (
            <p
              className="text-[9px] mt-0.5 tracking-wider"
              style={{ fontFamily: 'var(--font-inter)', color: 'rgba(255,255,255,0.4)' }}
            >
              {employee.subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Bottom neon line on hover */}
      <motion.div
        className="absolute bottom-0 inset-x-0 h-[2px] rounded-full"
        style={{ background: `linear-gradient(to right, transparent, ${primary}, transparent)` }}
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 1 }}
      />

      {/* Border glow on hover */}
      <div
        className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
        style={{
          border: `1px solid ${primary}`,
          boxShadow: `0 0 10px ${primary}50, inset 0 0 8px ${primary}10`,
        }}
      />
    </motion.button>
  );
}

function RandomSpinCard({ onSelect }: { onSelect: () => void }) {
  const { theme } = useBookingStore();
  const primary = theme.primaryColor;
  const [isShuffling, setIsShuffling] = useState(false);

  const handleClick = () => {
    setIsShuffling(true);
    setTimeout(() => {
      setIsShuffling(false);
      onSelect();
    }, 800);
  };

  return (
    <motion.button
      variants={itemVariants}
      onClick={handleClick}
      whileHover={{ scale: 1.04, y: -4 }}
      whileTap={{ scale: 0.97 }}
      className="relative rounded-xl overflow-hidden group text-left transition-all"
      style={{
        backgroundColor: '#16213E',
        border: `2px dashed ${primary}50`,
        aspectRatio: '2/3',
        minHeight: 160,
      }}
    >
      {/* Animated background */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          background: `radial-gradient(ellipse at center, ${primary}20, transparent 70%)`,
          animation: 'casino-border-pulse 2s ease-in-out infinite',
        }}
      />

      {/* Center */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-2">
        <AnimatePresence mode="wait">
          {isShuffling ? (
            <motion.div
              key="shuffling"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.span
                className="text-3xl block"
                animate={{ rotate: [0, 180, 360], scale: [1, 1.3, 1] }}
                transition={{ duration: 0.6, repeat: 1 }}
              >
                🎲
              </motion.span>
            </motion.div>
          ) : (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-2"
            >
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center text-2xl"
                style={{
                  border: `2px solid ${primary}50`,
                  backgroundColor: `${primary}10`,
                }}
              >
                🎲
              </div>
              <div className="text-center">
                <p
                  className="text-[9px] font-bold tracking-widest uppercase text-white"
                  style={{ fontFamily: 'var(--font-orbitron)' }}
                >
                  KDORKOLI
                </p>
                <p
                  className="text-[8px] mt-0.5 tracking-wider leading-tight"
                  style={{ fontFamily: 'var(--font-inter)', color: `${primary}70` }}
                >
                  Feeling lucky?
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
  const { employeesUI, eligibleEmployeeIds, selectEmployee, theme } = useBookingStore();
  const primary = theme.primaryColor;

  const eligibleSet = new Set(eligibleEmployeeIds);
  const filteredEmployees = employeesUI.filter((e) => eligibleSet.has(String(e.id)));
  const noEmployees = eligibleEmployeeIds.length === 0;

  if (noEmployees) {
    return (
      <div className="text-center py-16">
        <div className="text-5xl mb-4">🎰</div>
        <p
          className="text-sm"
          style={{ fontFamily: 'var(--font-inter)', color: 'rgba(255,255,255,0.4)' }}
        >
          Za to storitev ni razpoložljivega osebja.
        </p>
      </div>
    );
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      {/* Intro */}
      <motion.p
        variants={itemVariants}
        className="text-sm mb-6"
        style={{ fontFamily: 'var(--font-inter)', color: 'rgba(255,255,255,0.45)', lineHeight: 1.6 }}
      >
        Izberite svojega mojstra ali prepustite usodi!
      </motion.p>

      {/* Cards grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
        {/* Random / Lucky option */}
        <RandomSpinCard onSelect={() => selectEmployee(null, true)} />

        {/* Employee cards */}
        {filteredEmployees.map((emp, i) => (
          <PlayingCard
            key={emp.id}
            employee={emp}
            index={i}
            onSelect={(id) => selectEmployee(id, false)}
          />
        ))}
      </div>

      {/* Flavor text */}
      <motion.div variants={itemVariants} className="mt-4 text-center">
        <p
          className="text-[10px] tracking-[0.25em] uppercase"
          style={{ fontFamily: 'var(--font-orbitron)', color: `${primary}40` }}
        >
          ✦ Vsak mojster je zmagovalec ✦
        </p>
      </motion.div>
    </motion.div>
  );
}
