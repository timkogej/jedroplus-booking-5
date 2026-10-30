'use client';

import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { useBookingStore } from '@/store/bookingStore';
import { EmployeeUI } from '@/types';
import ModernCard from '../ModernCard';
import { t } from '../../i18n';
import { Avatar, FONT, Title, listVariants } from '../ui';

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
  const { anyPerson, language } = useBookingStore();

  return (
    <motion.div variants={itemVariants} className="sm:col-span-2">
      <ModernCard selected={anyPerson} onClick={onSelect}>
        <div className="flex items-center gap-4">
          <motion.div
            className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
            style={{
              background: anyPerson ? 'var(--brand-grad)' : 'rgba(255,255,255,0.07)',
              boxShadow: anyPerson ? '0 8px 20px -8px var(--brand-a)' : 'inset 0 0 0 1px rgba(255,255,255,0.1)',
            }}
            animate={anyPerson ? { rotate: [0, 8, -8, 0] } : {}}
            transition={{ duration: 0.5 }}
          >
            <svg
              className="w-6 h-6"
              style={{ color: anyPerson ? '#FFFFFF' : 'var(--t-soft)' }}
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
              className="font-bold"
              style={{ color: 'var(--t-primary)', fontFamily: FONT, fontSize: '1.0625rem', letterSpacing: '-0.015em' }}
            >
              {t(language, 'anyone')}
            </p>
            <p className="text-sm mt-0.5" style={{ color: 'var(--t-muted)', fontFamily: 'var(--font-inter)' }}>
              {t(language, 'anyoneDesc')}
            </p>
          </div>
        </div>
      </ModernCard>
    </motion.div>
  );
}

function EmployeeCard({
  employee,
  onSelect,
}: {
  employee: EmployeeUI;
  onSelect: (id: string) => void;
}) {
  const { selectedEmployeeId, anyPerson } = useBookingStore();
  const isSelected = !anyPerson && selectedEmployeeId === employee.id;

  return (
    <motion.div variants={itemVariants}>
      <ModernCard selected={isSelected} onClick={() => onSelect(employee.id)}>
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <Avatar initials={employee.initials} size={48} />
            {/* Pulse ring when selected — slowed to 3 s cycle for a calm feel */}
            <AnimatePresence>
              {isSelected && (
                <motion.div
                  className="absolute inset-0 rounded-full"
                  style={{ border: '2px solid var(--brand-glow)' }}
                  initial={{ scale: 1, opacity: 0.7 }}
                  animate={{ scale: 1.55, opacity: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: 'easeOut' as const,
                  }}
                />
              )}
            </AnimatePresence>
          </div>

          <div className="flex-1 min-w-0 text-left">
            <p
              className="font-bold"
              style={{ color: 'var(--t-primary)', fontFamily: FONT, fontSize: '1.0625rem', letterSpacing: '-0.015em' }}
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
  const { employeesUI, eligibleEmployeeIds, selectEmployee, language } = useBookingStore();

  const eligibleSet = new Set(eligibleEmployeeIds);
  const filteredEmployees = employeesUI.filter((e) => eligibleSet.has(String(e.id)));

  if (eligibleEmployeeIds.length === 0) {
    return (
      <div className="text-center py-16">
        <p style={{ color: 'var(--t-muted)', fontFamily: 'var(--font-inter)', fontSize: '0.9rem' }}>
          {t(language, 'noStaff')}
        </p>
      </div>
    );
  }

  return (
    <div>
      <motion.div variants={listVariants} initial="hidden" animate="visible">
        <Title title={t(language, 'choosePerson')} subtitle={t(language, 'whoPerson')} />
      </motion.div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 gap-3 sm:grid-cols-2"
      >
        <AnyEmployeeCard onSelect={() => selectEmployee(null, true)} />

        {filteredEmployees.length > 0 && (
          <>
            <motion.div variants={itemVariants} className="my-2 flex items-center gap-3 sm:col-span-2">
              <div className="flex-1 h-px" style={{ backgroundColor: 'var(--b1)' }} />
              <span className="text-[12px] font-bold uppercase" style={{ color: 'var(--t-faint)', fontFamily: FONT, letterSpacing: '0.12em' }}>
                {t(language, 'orChoosePerson').replace(/:$/, '')}
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
