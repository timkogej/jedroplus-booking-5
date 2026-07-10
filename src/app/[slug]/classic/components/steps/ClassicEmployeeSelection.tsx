'use client';

import { useState } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { useBookingStore } from '@/store/bookingStore';
import { getContrastMode } from '../ClassicLayout';
import { t } from '../../i18n';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: 'easeOut' as const },
  },
};

export default function ClassicEmployeeSelection() {
  const {
    theme,
    employeesUI,
    eligibleEmployeeIds,
    language,
  } = useBookingStore();

  const contrastMode = getContrastMode(theme.bgFrom, theme.bgTo);
  const textPrimary =
    contrastMode === 'light' ? 'rgba(255,255,255,0.95)' : 'rgba(0,0,0,0.9)';
  const textSecondary =
    contrastMode === 'light' ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.55)';
  const textMuted =
    contrastMode === 'light' ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.32)';
  const dividerColor =
    contrastMode === 'light' ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.08)';

  const eligibleSet = new Set(eligibleEmployeeIds);
  const filteredEmployees = employeesUI.filter((e) =>
    eligibleSet.has(String(e.id))
  );
  const noEmployees = eligibleEmployeeIds.length === 0;

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
          {t(language, 'noStaff')}
        </p>
      </div>
    );
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      {/* Title */}
      <motion.div variants={itemVariants} className="mb-7">
        <h2
          className="text-3xl font-bold mb-1.5"
          style={{ fontFamily: 'var(--font-nunito)', color: textPrimary }}
        >
          {t(language, 'choosePerson')}
        </h2>
        <p style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '0.9rem', color: textSecondary }}>
          {t(language, 'whoPerson')}
        </p>
      </motion.div>

      {/* "Anyone" card */}
      <motion.div variants={itemVariants}>
        <motion.button
          onClick={() => {
            setLocalAnyPerson(true);
            setLocalEmployeeId(null);
          }}
          className="w-full p-4 rounded-2xl mb-2 text-left"
          style={{
            background: localAnyPerson
              ? 'rgba(255,255,255,0.97)'
              : 'rgba(255,255,255,0.88)',
            border: localAnyPerson
              ? `2px solid ${theme.primaryColor}`
              : '2px dashed rgba(255,255,255,0.35)',
            boxShadow: localAnyPerson
              ? `0 6px 24px ${theme.primaryColor}28`
              : '0 2px 10px rgba(0,0,0,0.05)',
          }}
          whileHover={{ scale: 1.008 }}
          whileTap={{ scale: 0.992 }}
        >
          <div className="flex items-center gap-4">
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: `${theme.primaryColor}14` }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke={theme.primaryColor}
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p
                className="font-semibold text-gray-900 mb-0.5"
                style={{ fontFamily: 'var(--font-nunito-sans)' }}
              >
                {t(language, 'anyone')}
              </p>
              <p
                className="text-sm text-gray-400"
                style={{ fontFamily: 'var(--font-nunito-sans)' }}
              >
                {t(language, 'anyoneDesc')}
              </p>
            </div>
            <AnimatePresence>
              {localAnyPerson && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  transition={{ type: 'spring', stiffness: 380, damping: 18 }}
                  className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: theme.primaryColor }}
                >
                  <svg
                    width="11"
                    height="11"
                    viewBox="0 0 11 11"
                    fill="none"
                    stroke="white"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M1.5 5.5l3 3 5-5" />
                  </svg>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.button>
      </motion.div>

      {/* Divider */}
      <motion.div
        variants={itemVariants}
        className="flex items-center gap-3 my-5"
      >
        <div className="flex-1 h-px" style={{ backgroundColor: dividerColor }} />
        <span
          className="text-xs"
          style={{
            fontFamily: 'var(--font-nunito-sans)',
            color: textMuted,
          }}
        >
          {t(language, 'orChoosePerson')}
        </span>
        <div className="flex-1 h-px" style={{ backgroundColor: dividerColor }} />
      </motion.div>

      {/* Employee cards */}
      <div className="space-y-2.5">
        {filteredEmployees.map((emp) => {
          const isSelected = localEmployeeId === emp.id && !localAnyPerson;
          return (
            <motion.div key={emp.id} variants={itemVariants}>
              <motion.button
                onClick={() => {
                  setLocalEmployeeId(emp.id);
                  setLocalAnyPerson(false);
                }}
                className="w-full p-4 rounded-2xl text-left"
                style={{
                  background: 'rgba(255,255,255,0.97)',
                  border: isSelected
                    ? `2px solid ${theme.primaryColor}`
                    : '2px solid rgba(0,0,0,0.04)',
                  boxShadow: isSelected
                    ? `0 6px 24px ${theme.primaryColor}25`
                    : '0 2px 10px rgba(0,0,0,0.05)',
                }}
                whileHover={{ scale: 1.008 }}
                whileTap={{ scale: 0.992 }}
              >
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <div
                    className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm text-white flex-shrink-0"
                    style={{
                      backgroundColor: theme.primaryColor,
                      fontFamily: 'var(--font-nunito)',
                    }}
                  >
                    {emp.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className="font-semibold text-gray-900 mb-0.5"
                      style={{ fontFamily: 'var(--font-nunito-sans)' }}
                    >
                      {emp.label}
                    </p>
                    {emp.subtitle && (
                      <p
                        className="text-sm text-gray-400"
                        style={{ fontFamily: 'var(--font-nunito-sans)' }}
                      >
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
                        transition={{
                          type: 'spring',
                          stiffness: 380,
                          damping: 18,
                        }}
                        className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: theme.primaryColor }}
                      >
                        <svg
                          width="11"
                          height="11"
                          viewBox="0 0 11 11"
                          fill="none"
                          stroke="white"
                          strokeWidth="2.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M1.5 5.5l3 3 5-5" />
                        </svg>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.button>
            </motion.div>
          );
        })}
      </div>

      {/* Continue button */}
      <motion.div variants={itemVariants} className="mt-8 flex justify-end">
        <motion.button
          onClick={handleNext}
          disabled={!canProceed}
          className="px-8 py-3.5 rounded-2xl font-bold text-white flex items-center gap-2"
          style={{
            fontFamily: 'var(--font-nunito)',
            backgroundColor: canProceed
              ? theme.primaryColor
              : 'rgba(0,0,0,0.14)',
            boxShadow: canProceed
              ? `0 6px 24px ${theme.primaryColor}38`
              : 'none',
            cursor: canProceed ? 'pointer' : 'not-allowed',
          }}
          whileHover={canProceed ? { scale: 1.03 } : {}}
          whileTap={canProceed ? { scale: 0.97 } : {}}
        >
          {t(language, 'next')}
          <span>→</span>
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
