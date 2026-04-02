'use client';

import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { useBookingStore } from '@/store/bookingStore';
import { EmployeeUI } from '@/types';
import ModernCard from '../ModernCard';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 360, damping: 24 },
  },
};

function AnyEmployeeCard({ onSelect }: { onSelect: () => void }) {
  const { theme, anyPerson } = useBookingStore();

  return (
    <motion.div variants={itemVariants}>
      <ModernCard selected={anyPerson} onClick={onSelect}>
        <div className="flex items-center gap-4">
          <motion.div
            className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{
              backgroundColor: anyPerson ? `${theme.primaryColor}22` : 'var(--s1)',
              border: `1px solid ${anyPerson ? theme.primaryColor : 'var(--b1)'}`,
            }}
            animate={anyPerson ? { rotate: [0, 8, -8, 0] } : {}}
            transition={{ duration: 0.5 }}
          >
            <svg
              className="w-6 h-6"
              style={{ color: anyPerson ? theme.primaryColor : 'var(--t-muted)' }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </motion.div>

          <div className="flex-1 min-w-0 text-left">
            <p
              className="font-semibold"
              style={{ color: 'var(--t-primary)', fontFamily: 'var(--font-inter)', fontSize: '0.975rem' }}
            >
              Kdorkoli
            </p>
            <p className="text-sm mt-0.5" style={{ color: 'var(--t-muted)', fontFamily: 'var(--font-inter)' }}>
              Dodelimo vam prvega prostega specialista
            </p>
          </div>
        </div>
      </ModernCard>
    </motion.div>
  );
}

function EmployeeCard({ employee, onSelect }: { employee: EmployeeUI; onSelect: (id: string) => void }) {
  const { theme, selectedEmployeeId, anyPerson } = useBookingStore();
  const isSelected = !anyPerson && selectedEmployeeId === employee.id;

  return (
    <motion.div variants={itemVariants}>
      <ModernCard selected={isSelected} onClick={() => onSelect(employee.id)}>
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-base"
              style={{ backgroundColor: theme.primaryColor, fontFamily: 'var(--font-dm-sans)' }}
            >
              {employee.initials}
            </div>
            {/* Pulse ring when selected */}
            <AnimatePresence>
              {isSelected && (
                <motion.div
                  className="absolute inset-0 rounded-full"
                  style={{ border: `2px solid ${theme.primaryColor}` }}
                  initial={{ scale: 1, opacity: 0.7 }}
                  animate={{ scale: 1.5, opacity: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
              )}
            </AnimatePresence>
          </div>

          <div className="flex-1 min-w-0 text-left">
            <p
              className="font-semibold"
              style={{ color: 'var(--t-primary)', fontFamily: 'var(--font-inter)', fontSize: '0.975rem' }}
            >
              {employee.label}
            </p>
            {employee.subtitle && (
              <p className="text-sm mt-0.5" style={{ color: 'var(--t-muted)', fontFamily: 'var(--font-inter)' }}>
                {employee.subtitle}
              </p>
            )}
          </div>
        </div>
      </ModernCard>
    </motion.div>
  );
}

export default function ModernEmployeeSelection() {
  const { employeesUI, eligibleEmployeeIds, selectEmployee, theme } = useBookingStore();

  const eligibleSet = new Set(eligibleEmployeeIds);
  const filteredEmployees = employeesUI.filter((e) => eligibleSet.has(String(e.id)));

  if (eligibleEmployeeIds.length === 0) {
    return (
      <div className="text-center py-16">
        <p style={{ color: 'var(--t-muted)', fontFamily: 'var(--font-inter)', fontSize: '0.9rem' }}>
          Za to storitev ni razpoložljivega osebja.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Heading */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8"
      >
        <h2
          className="text-3xl font-bold mb-2"
          style={{ color: 'var(--t-primary)', fontFamily: 'var(--font-dm-sans)' }}
        >
          Izberi{' '}
          <span
            className="modern-gradient-text"
            style={{
              backgroundImage: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})`,
            }}
          >
            specialista
          </span>
        </h2>
        <p className="text-sm" style={{ color: 'var(--t-muted)', fontFamily: 'var(--font-inter)' }}>
          Kdo naj vas postreže?
        </p>
      </motion.div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-3"
      >
        <AnyEmployeeCard onSelect={() => selectEmployee(null, true)} />

        {filteredEmployees.length > 0 && (
          <>
            <motion.div variants={itemVariants} className="flex items-center gap-3 my-2">
              <div className="flex-1 h-px" style={{ backgroundColor: 'var(--b1)' }} />
              <span className="text-xs" style={{ color: 'var(--t-faint)', fontFamily: 'var(--font-inter)' }}>
                ali izberi osebo
              </span>
              <div className="flex-1 h-px" style={{ backgroundColor: 'var(--b1)' }} />
            </motion.div>

            {filteredEmployees.map((emp) => (
              <EmployeeCard
                key={emp.id}
                employee={emp}
                onSelect={(id) => selectEmployee(id, false)}
              />
            ))}
          </>
        )}
      </motion.div>
    </div>
  );
}
