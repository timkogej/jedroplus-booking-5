'use client';

import { motion, type Variants } from 'framer-motion';
import { useBookingStore } from '@/store/bookingStore';
import { EmployeeUI } from '@/types';

const containerVariants: Variants = {
  animate: { transition: { staggerChildren: 0.08 } },
};

const itemVariants: Variants = {
  initial: { opacity: 0, x: -16 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.45, ease: 'easeOut' as const } },
};

export default function MagazineEmployeeSelection() {
  const { employeesUI, selectedEmployeeId, anyPerson, selectEmployee, theme } =
    useBookingStore();

  const renderCard = (employee: EmployeeUI | null, isAnyOption = false) => {
    const isSelected = isAnyOption ? anyPerson : selectedEmployeeId === employee?.id;

    if (isAnyOption) {
      // "Kdorkoli" styled as pull-quote box
      return (
        <motion.div
          key="any"
          variants={itemVariants}
          onClick={() => selectEmployee(null, true)}
          className="group cursor-pointer mb-3"
        >
          <div
            className="relative overflow-hidden p-6 border transition-all duration-400"
            style={{
              borderColor: isSelected ? theme.primaryColor : 'rgba(0,0,0,0.1)',
              backgroundColor: isSelected ? `${theme.primaryColor}06` : 'transparent',
            }}
          >
            {/* Decorative quote mark */}
            <span
              className="absolute -top-2 left-4 font-serif text-6xl leading-none pointer-events-none select-none"
              style={{
                color: isSelected ? `${theme.primaryColor}30` : 'rgba(0,0,0,0.06)',
                fontFamily: 'var(--font-playfair), Georgia, serif',
              }}
              aria-hidden
            >
              &ldquo;
            </span>

            <div className="flex items-center justify-between">
              <div className="relative z-10">
                <p
                  className="magazine-caps text-[9px] tracking-[0.22em] mb-2"
                  style={{ color: isSelected ? theme.primaryColor : '#6B6B6B' }}
                >
                  Priporočamo
                </p>
                <h3
                  className="magazine-serif text-xl text-[#1A1A1A] leading-snug"
                  style={{ fontStyle: 'italic' }}
                >
                  Prepustite nam izbiro
                </h3>
                <p className="text-[#6B6B6B] text-sm mt-1.5">
                  Povežemo vas z najboljšim prostim specialistom
                </p>
              </div>

              {/* Selection indicator */}
              <div
                className="w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 ml-4 transition-all duration-300"
                style={{
                  borderColor: isSelected ? theme.primaryColor : 'rgba(0,0,0,0.2)',
                  backgroundColor: isSelected ? theme.primaryColor : 'transparent',
                }}
              >
                {isSelected && (
                  <motion.svg
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    width="10"
                    height="8"
                    viewBox="0 0 10 8"
                    fill="none"
                  >
                    <path
                      d="M1 3.5L4 6.5L9 1"
                      stroke="white"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </motion.svg>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      );
    }

    // Regular employee card
    return (
      <motion.div
        key={employee!.id}
        variants={itemVariants}
        onClick={() => selectEmployee(employee!.id, false)}
        className="group cursor-pointer relative"
        whileHover={{ y: -2 }}
        transition={{ duration: 0.25 }}
      >
        {/* Selected left border */}
        <motion.div
          className="absolute left-0 top-0 bottom-0 w-[2px] origin-top"
          animate={{ scaleY: isSelected ? 1 : 0 }}
          transition={{ duration: 0.3 }}
          style={{ backgroundColor: theme.primaryColor }}
        />

        <div
          className="flex items-center gap-5 py-5 px-5 border-b transition-all duration-300"
          style={{
            borderColor: 'rgba(0,0,0,0.07)',
            backgroundColor: isSelected ? `${theme.primaryColor}04` : 'transparent',
            paddingLeft: isSelected ? '20px' : '20px',
          }}
        >
          {/* Avatar / initials */}
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 magazine-serif text-sm"
            style={{
              border: `1.5px solid ${isSelected ? theme.primaryColor : 'rgba(0,0,0,0.12)'}`,
              backgroundColor: isSelected ? `${theme.primaryColor}10` : 'transparent',
              color: isSelected ? theme.primaryColor : '#6B6B6B',
            }}
          >
            {employee!.initials || '?'}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h3
              className="magazine-serif text-lg text-[#1A1A1A] leading-snug transition-colors duration-300"
              style={{ color: isSelected ? theme.primaryColor : '#1A1A1A' }}
            >
              {employee!.label}
            </h3>
            <p className="magazine-caps text-[9px] tracking-[0.18em] mt-1 text-[#6B6B6B]">
              {employee!.subtitle}
            </p>
          </div>

          {/* Arrow indicator */}
          <motion.div
            initial={{ opacity: 0, x: -6 }}
            animate={{
              opacity: isSelected ? 1 : 0,
              x: isSelected ? 0 : -6,
            }}
            className="flex-shrink-0 text-[10px]"
            style={{ color: theme.primaryColor }}
          >
            →
          </motion.div>
        </div>
      </motion.div>
    );
  };

  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={containerVariants}
      className="max-w-xl"
    >
      {/* Section header */}
      <motion.div variants={itemVariants} className="mb-10">
        <div
          className="w-8 h-[1px] mb-5"
          style={{ backgroundColor: theme.primaryColor }}
        />
        <h1 className="magazine-serif text-[2.5rem] md:text-[3rem] text-[#1A1A1A] tracking-[-0.02em] leading-[1.1] mb-4">
          Naši Specialisti
        </h1>
        <div className="h-[1px] w-full bg-black/10 mb-4" />
        <p className="magazine-body text-[#6B6B6B] text-[15px] italic leading-relaxed">
          Izberite svojega strokovnjaka
        </p>
      </motion.div>

      {/* "Kdorkoli" option */}
      {renderCard(null, true)}

      {/* Divider */}
      <motion.div variants={itemVariants} className="my-6 flex items-center gap-4">
        <div className="flex-1 h-[1px] bg-black/08" />
        <span className="magazine-caps text-[9px] tracking-[0.2em] text-black/25">
          ali
        </span>
        <div className="flex-1 h-[1px] bg-black/08" />
      </motion.div>

      {/* Employee list */}
      <div>
        {employeesUI.map((employee) => renderCard(employee))}
      </div>
    </motion.div>
  );
}
