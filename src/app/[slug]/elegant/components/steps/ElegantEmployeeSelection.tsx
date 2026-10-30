'use client';

import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { useBookingStore } from '@/store/bookingStore';
import { EmployeeUI } from '@/types';
import { t } from '../../i18n';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
};

function AnyEmployeeCard({ onSelect }: { onSelect: () => void }) {
  const { theme, anyPerson, language } = useBookingStore();

  return (
    <motion.button
      variants={itemVariants}
      onClick={onSelect}
      whileHover={{ y: -2, boxShadow: '0 14px 30px -18px rgba(60,40,10,0.35)' }}
      whileTap={{ scale: 0.99 }}
      className="w-full rounded-2xl p-4 transition-colors duration-300"
      style={{
        border: anyPerson ? `2px solid ${theme.primarySolid}` : '2px dashed #D1D5DB',
        backgroundColor: anyPerson ? `${theme.primaryColor}06` : 'white',
      }}
    >
      <div className="flex items-center gap-4">
        {/* Icon */}
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${theme.primaryColor}12` }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke={theme.primaryOnLight}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        </div>

        <div className="text-left flex-1">
          <p
            className="font-medium"
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '0.975rem',
              color: anyPerson ? theme.primarySolid : '#1F2937',
            }}
          >
            {t(language, 'anyone')}
          </p>
          <p
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '0.8rem',
              color: '#6B7280',
            }}
          >
            {t(language, 'anyoneDesc')}
          </p>
        </div>

        {/* Check */}
        <AnimatePresence>
          {anyPerson && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: theme.primarySolid }}
            >
              <svg width="11" height="9" viewBox="0 0 12 10" fill="none" aria-hidden="true"><motion.path d="M1 5L4.5 8.5L11 1" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.3, delay: 0.05 }} /></svg>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.button>
  );
}

function EmployeeCard({
  employee,
  onSelect,
}: {
  employee: EmployeeUI;
  onSelect: (id: string) => void;
}) {
  const { theme, selectedEmployeeId, anyPerson } = useBookingStore();
  const isSelected = !anyPerson && selectedEmployeeId === employee.id;

  return (
    <motion.button
      variants={itemVariants}
      onClick={() => onSelect(employee.id)}
      whileHover={{ y: -2, boxShadow: '0 14px 30px -18px rgba(60,40,10,0.35)' }}
      whileTap={{ scale: 0.99 }}
      className="w-full rounded-2xl border bg-white p-4 transition-colors duration-300"
      style={{
        borderColor: isSelected ? theme.primarySolid : '#E5E7EB',
        backgroundColor: isSelected ? `${theme.primaryColor}06` : 'white',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}
    >
      <div className="flex items-center gap-4">
        {/* Avatar */}
        <div
          className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full p-[2px] transition-all duration-500"
          style={{ background: isSelected ? `conic-gradient(from 140deg, ${theme.primarySolid}, ${theme.primaryColor}, ${theme.primarySolid})` : '#EEECE8' }}
        >
          <span
            className="flex h-full w-full items-center justify-center rounded-full border-2 border-white text-white"
            style={{ background: `linear-gradient(145deg, ${theme.primaryColor}, ${theme.primarySolid})`, fontFamily: 'var(--font-playfair)', fontSize: '1rem' }}
          >
            {employee.initials}
          </span>
        </div>

        <div className="text-left flex-1">
          <p
            className="font-medium"
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '0.975rem',
              color: '#1F2937',
            }}
          >
            {employee.label}
          </p>
          {employee.subtitle && (
            <p
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: '0.8rem',
                color: '#6B7280',
              }}
            >
              {employee.subtitle}
            </p>
          )}
        </div>

        {/* Check */}
        <AnimatePresence>
          {isSelected && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: theme.primarySolid }}
            >
              <svg width="11" height="9" viewBox="0 0 12 10" fill="none" aria-hidden="true"><motion.path d="M1 5L4.5 8.5L11 1" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.3, delay: 0.05 }} /></svg>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.button>
  );
}

export default function ElegantEmployeeSelection() {
  const { employeesUI, eligibleEmployeeIds, selectEmployee, theme, language } = useBookingStore();

  const eligibleSet = new Set(eligibleEmployeeIds);
  const filteredEmployees = employeesUI.filter((e) => eligibleSet.has(String(e.id)));

  if (eligibleEmployeeIds.length === 0) {
    return (
      <div className="text-center py-16">
        <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.9rem', color: '#6B7280' }}>
          {t(language, 'noStaff')}
        </p>
      </div>
    );
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      {/* Heading */}
      <motion.div variants={itemVariants} className="mb-7">
        <h2
          style={{
            fontFamily: 'var(--font-playfair)',
            fontSize: 'clamp(2rem, 5vw, 2.4rem)',
            fontWeight: 400,
            color: '#111111',
            lineHeight: 1.15,
          }}
        >
          {t(language, 'chooseSpecialistA')} <span className="italic" style={{ color: theme.primaryOnLight }}>{t(language, 'chooseSpecialistB')}</span>
        </h2>
        <p
          className="mt-2"
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '0.9rem',
            color: '#6B7280',
          }}
        >
          {t(language, 'specialistQuestion')}
        </p>
        <div className="elegant-rule mt-5 h-px w-16" style={{ background: theme.primarySolid, transformOrigin: 'left' }} />
      </motion.div>

      {/* Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2"><AnyEmployeeCard onSelect={() => selectEmployee(null, true)} /></div>
        {filteredEmployees.map((emp) => (
          <EmployeeCard
            key={emp.id}
            employee={emp}
            onSelect={(id) => selectEmployee(id, false)}
          />
        ))}
      </div>
    </motion.div>
  );
}
