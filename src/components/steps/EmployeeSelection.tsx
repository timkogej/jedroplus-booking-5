'use client';

import { motion } from 'framer-motion';
import { ChevronRight, Users } from 'lucide-react';
import { useBookingStore } from '@/store/bookingStore';
import { EmployeeUI } from '@/types';

export default function EmployeeSelection() {
  const { employeesUI, eligibleEmployeeIds, selectedEmployeeId, anyPerson, selectEmployee, theme } = useBookingStore();

  // Always filter by eligibleEmployeeIds (populated by selectService in the store)
  const eligibleSet = new Set(eligibleEmployeeIds);
  const filteredEmployees = employeesUI.filter(emp => eligibleSet.has(String(emp.id)));
  const noEmployeesAvailable = eligibleEmployeeIds.length === 0;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
  };

  const renderEmployeeItem = (employee: EmployeeUI | null, isAnyOption = false) => {
    const isSelected = isAnyOption
      ? anyPerson
      : selectedEmployeeId === employee?.id;

    return (
      <motion.div
        key={employee?.id || 'any'}
        variants={itemVariants}
        className="group relative"
        onClick={() => {
          if (isAnyOption) {
            selectEmployee(null, true);
          } else if (employee) {
            selectEmployee(employee.id, false);
          }
        }}
      >
        {/* Left accent bar for selected state */}
        <motion.div
          className="absolute left-0 top-0 bottom-0 w-1 rounded-full"
          initial={{ scaleY: 0 }}
          animate={{ scaleY: isSelected ? 1 : 0 }}
          style={{ backgroundColor: theme.primaryColor }}
          transition={{ duration: 0.2 }}
        />

        <div
          className={`flex items-center gap-6 py-6 px-4 cursor-pointer transition-all duration-300 ${
            isSelected ? 'pl-6' : 'hover:pl-6'
          }`}
        >
          {/* Avatar/Initials */}
          <motion.div
            className="relative flex-shrink-0"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
          >
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 text-lg font-medium"
              style={{
                border: isSelected
                  ? `3px solid ${theme.primaryColor}`
                  : '2px solid rgba(255,255,255,0.3)',
                backgroundColor: isSelected
                  ? `${theme.primaryColor}20`
                  : 'rgba(255,255,255,0.1)',
                color: isSelected ? theme.primaryColor : 'white',
                boxShadow: isSelected ? `0 0 20px ${theme.primaryColor}40` : 'none',
              }}
            >
              {isAnyOption ? (
                <Users className="w-6 h-6" />
              ) : (
                employee?.initials || '?'
              )}
            </div>
          </motion.div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3
              className="font-serif text-xl mb-1 transition-colors duration-300"
              style={{
                color: isSelected ? theme.primaryColor : 'white',
              }}
            >
              {isAnyOption ? 'Kdorkoli' : employee?.label}
            </h3>
            <p className="text-white/60 text-sm">
              {isAnyOption
                ? 'Izberi najboljši termin zame'
                : employee?.subtitle}
            </p>
          </div>

          {/* Arrow */}
          <motion.div
            className="flex-shrink-0"
            initial={{ opacity: 0, x: -10 }}
            animate={{
              opacity: isSelected ? 1 : 0,
              x: isSelected ? 0 : -10,
            }}
            whileHover={{ opacity: 1, x: 0 }}
          >
            <ChevronRight
              className="w-5 h-5"
              style={{ color: theme.primaryColor }}
            />
          </motion.div>
        </div>

        {/* Bottom divider */}
        <div className="h-[1px] bg-white/10 ml-4" />
      </motion.div>
    );
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="max-w-2xl"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="mb-8">
        <h1 className="font-serif text-3xl md:text-4xl mb-3 text-white">
          Izberi{' '}
          <span style={{ color: theme.primaryColor }}>
            specialista
          </span>
        </h1>
        <p className="text-white/60">
          Izberi osebo, ki te bo postregel/a
        </p>
      </motion.div>

      {/* Employee list */}
      {noEmployeesAvailable ? (
        <motion.div variants={itemVariants} className="py-8 text-center">
          <p className="text-white/50 text-base">
            Za to storitev ni na voljo nobenega osebja.
          </p>
        </motion.div>
      ) : (
        <div className="space-y-0">
          {renderEmployeeItem(null, true)}
          {filteredEmployees.map((employee) => renderEmployeeItem(employee))}
        </div>
      )}
    </motion.div>
  );
}
