'use client';

import { useState } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { useBookingStore } from '@/store/bookingStore';
import { getContrastMode } from '../ClassicLayout';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.32, ease: 'easeOut' as const },
  },
};

export default function ClassicEmployeeSelection() {
  const { theme, employeesUI, eligibleEmployeeIds } = useBookingStore();

  const contrastMode = getContrastMode(theme.bgFrom, theme.bgTo);
  const textPrimary =
    contrastMode === 'light' ? 'rgba(255,255,255,0.95)' : 'rgba(0,0,0,0.9)';
  const textSecondary =
    contrastMode === 'light' ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.55)';
  const textMuted =
    contrastMode === 'light' ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.35)';
  const dividerColor =
    contrastMode === 'light' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)';

  // Filter employees to those eligible for the selected service
  const eligibleSet = new Set(eligibleEmployeeIds);
  const filteredEmployees = employeesUI.filter((e) => eligibleSet.has(String(e.id)));
  const noEmployees = eligibleEmployeeIds.length === 0;

  // Local selection — committed to store on "Naprej"
  const [localEmployeeId, setLocalEmployeeId] = useState<string | null>(null);
  const [localAnyPerson, setLocalAnyPerson] = useState(false);

  const canProceed = localAnyPerson || localEmployeeId !== null;

  const handleNext = () => {
    if (!canProceed) return;
    useBookingStore.setState({
      selectedEmployeeId: localAnyPerson ? null : localEmployeeId,
      anyPerson: localAnyPerson,
    });
    useBookingStore.getState().nextStep();
  };

  if (noEmployees) {
    return (
      <div className="text-center py-16">
        <p
          style={{
            fontFamily: 'var(--font-nunito-sans)',
            color: textMuted,
            fontSize: '0.9rem',
          }}
        >
          Za to storitev ni razpoložljivega osebja.
        </p>
      </div>
    );
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      {/* Page title */}
      <motion.div variants={itemVariants} className="mb-8">
        <h2
          className="text-3xl font-bold mb-2"
          style={{ fontFamily: 'var(--font-nunito)', color: textPrimary }}
        >
          Izberite osebo
        </h2>
        <p style={{ fontFamily: 'var(--font-nunito-sans)', color: textSecondary }}>
          Kdo naj izvede vašo storitev?
        </p>
      </motion.div>

      {/* "Kdorkoli" card */}
      <motion.div variants={itemVariants}>
        <motion.button
          onClick={() => {
            setLocalAnyPerson(true);
            setLocalEmployeeId(null);
          }}
          className="w-full p-5 rounded-2xl mb-2 text-left"
          style={{
            background: localAnyPerson ? 'rgba(255,255,255,0.97)' : 'rgba(255,255,255,0.88)',
            border: localAnyPerson
              ? `2px solid ${theme.primaryColor}`
              : '2px dashed rgba(255,255,255,0.4)',
            boxShadow: localAnyPerson
              ? `0 8px 30px ${theme.primaryColor}30`
              : '0 2px 12px rgba(0,0,0,0.06)',
          }}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 text-xl"
              style={{
                backgroundColor: `${theme.primaryColor}15`,
                color: theme.primaryColor,
              }}
            >
              ✦
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 mb-0.5" style={{ fontFamily: 'var(--font-nunito-sans)' }}>
                Kdorkoli
              </p>
              <p className="text-sm text-gray-500" style={{ fontFamily: 'var(--font-nunito-sans)' }}>
                Vseeno mi je, kdo me postreže
              </p>
            </div>
            <AnimatePresence>
              {localAnyPerson && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: theme.primaryColor, color: '#fff' }}
                >
                  ✓
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.button>
      </motion.div>

      {/* Divider */}
      <motion.div variants={itemVariants} className="flex items-center gap-4 my-5">
        <div className="flex-1 h-px" style={{ backgroundColor: dividerColor }} />
        <span
          className="text-sm"
          style={{ fontFamily: 'var(--font-nunito-sans)', color: textMuted }}
        >
          Ali izberi osebo:
        </span>
        <div className="flex-1 h-px" style={{ backgroundColor: dividerColor }} />
      </motion.div>

      {/* Employee cards */}
      <div className="space-y-3">
        {filteredEmployees.map((emp) => {
          const isSelected = localEmployeeId === emp.id && !localAnyPerson;
          return (
            <motion.div key={emp.id} variants={itemVariants}>
              <motion.button
                onClick={() => {
                  setLocalEmployeeId(emp.id);
                  setLocalAnyPerson(false);
                }}
                className="w-full p-5 rounded-2xl text-left"
                style={{
                  background: 'rgba(255,255,255,0.97)',
                  border: isSelected
                    ? `2px solid ${theme.primaryColor}`
                    : '2px solid transparent',
                  boxShadow: isSelected
                    ? `0 8px 30px ${theme.primaryColor}25`
                    : '0 2px 12px rgba(0,0,0,0.06)',
                }}
                whileHover={{ scale: 1.01, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                whileTap={{ scale: 0.99 }}
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm text-white flex-shrink-0"
                    style={{
                      backgroundColor: theme.primaryColor,
                      fontFamily: 'var(--font-nunito)',
                    }}
                  >
                    {emp.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 mb-0.5" style={{ fontFamily: 'var(--font-nunito-sans)' }}>
                      {emp.label}
                    </p>
                    {emp.subtitle && (
                      <p className="text-sm text-gray-500" style={{ fontFamily: 'var(--font-nunito-sans)' }}>
                        {emp.subtitle}
                      </p>
                    )}
                  </div>
                  <AnimatePresence>
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: theme.primaryColor, color: '#fff' }}
                      >
                        ✓
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.button>
            </motion.div>
          );
        })}
      </div>

      {/* Naprej button */}
      <motion.div variants={itemVariants} className="mt-8 flex justify-end">
        <motion.button
          onClick={handleNext}
          disabled={!canProceed}
          className="px-8 py-4 rounded-2xl font-bold text-white flex items-center gap-2"
          style={{
            fontFamily: 'var(--font-nunito)',
            backgroundColor: canProceed ? theme.primaryColor : 'rgba(0,0,0,0.15)',
            boxShadow: canProceed ? `0 8px 28px ${theme.primaryColor}40` : 'none',
            cursor: canProceed ? 'pointer' : 'not-allowed',
          }}
          whileHover={canProceed ? { scale: 1.03 } : {}}
          whileTap={canProceed ? { scale: 0.97 } : {}}
        >
          Naprej
          <span style={{ fontSize: '1rem' }}>→</span>
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
