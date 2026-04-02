'use client';

import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { useBookingStore } from '@/store/bookingStore';
import { EmployeeUI } from '@/types';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: 'easeOut' as const },
  },
};

function AnyEmployeeCard({ onSelect }: { onSelect: () => void }) {
  const { theme, anyPerson } = useBookingStore();

  return (
    <motion.button
      variants={itemVariants}
      onClick={onSelect}
      whileHover={{ boxShadow: '0 4px 16px rgba(0,0,0,0.07)' }}
      whileTap={{ scale: 0.99 }}
      className="w-full p-4 rounded-xl transition-all duration-200"
      style={{
        border: anyPerson ? `2px solid ${theme.primaryColor}` : '2px dashed #D1D5DB',
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
            stroke={theme.primaryColor}
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
              color: anyPerson ? theme.primaryColor : '#1F2937',
            }}
          >
            Kdorkoli
          </p>
          <p
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '0.8rem',
              color: '#9CA3AF',
            }}
          >
            Dodelimo vam prvega prostega specialista
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
              style={{ backgroundColor: theme.primaryColor }}
            >
              <span style={{ color: 'white', fontSize: '0.6rem', fontWeight: 700 }}>✓</span>
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
      whileHover={{ boxShadow: '0 4px 12px rgba(0,0,0,0.07)' }}
      whileTap={{ scale: 0.99 }}
      className="w-full p-4 rounded-xl border transition-all duration-200"
      style={{
        borderColor: isSelected ? theme.primaryColor : '#E5E7EB',
        backgroundColor: isSelected ? `${theme.primaryColor}06` : 'white',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}
    >
      <div className="flex items-center gap-4">
        {/* Avatar */}
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 text-white font-medium"
          style={{
            backgroundColor: theme.primaryColor,
            fontFamily: 'var(--font-inter)',
            fontSize: '0.9rem',
          }}
        >
          {employee.initials}
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
                color: '#9CA3AF',
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
              style={{ backgroundColor: theme.primaryColor }}
            >
              <span style={{ color: 'white', fontSize: '0.6rem', fontWeight: 700 }}>✓</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.button>
  );
}

export default function ElegantEmployeeSelection() {
  const { employeesUI, eligibleEmployeeIds, selectEmployee, theme } = useBookingStore();

  const eligibleSet = new Set(eligibleEmployeeIds);
  const filteredEmployees = employeesUI.filter((e) => eligibleSet.has(String(e.id)));

  if (eligibleEmployeeIds.length === 0) {
    return (
      <div className="text-center py-16">
        <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.9rem', color: '#9CA3AF' }}>
          Za to storitev ni razpoložljivega osebja.
        </p>
      </div>
    );
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      {/* Heading */}
      <motion.div variants={itemVariants} className="mb-6">
        <h2
          style={{
            fontFamily: 'var(--font-playfair)',
            fontSize: '1.75rem',
            fontWeight: 400,
            color: '#111111',
            lineHeight: 1.2,
          }}
        >
          Izberi <span style={{ color: theme.primaryColor }}>specialista</span>
        </h2>
        <p
          className="mt-2"
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '0.9rem',
            color: '#6B7280',
          }}
        >
          Kdo naj vas postreže?
        </p>
      </motion.div>

      {/* Cards */}
      <div className="space-y-3">
        <AnyEmployeeCard onSelect={() => selectEmployee(null, true)} />
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
