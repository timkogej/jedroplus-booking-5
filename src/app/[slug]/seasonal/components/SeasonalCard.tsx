'use client';

import { motion } from 'framer-motion';
import { useBookingStore } from '@/store/bookingStore';

interface SeasonalCardProps {
  children: React.ReactNode;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
}

export default function SeasonalCard({ children, selected, onClick, className = '' }: SeasonalCardProps) {
  const { theme } = useBookingStore();

  return (
    <motion.button
      onClick={onClick}
      className={`relative w-full p-5 rounded-2xl text-left overflow-hidden ${className}`}
      style={{
        backgroundColor: selected ? `${theme.primaryColor}22` : 'var(--s2)',
        border: selected
          ? `2px solid ${theme.primaryColor}`
          : '1px solid var(--b2)',
        boxShadow: selected
          ? `0 0 0 1px ${theme.primaryColor}30, 0 8px 24px rgba(0,0,0,0.3)`
          : '0 2px 8px rgba(0,0,0,0.25)',
      }}
      whileHover={{
        scale: 1.012,
        backgroundColor: selected ? `${theme.primaryColor}2a` : 'var(--s2h)',
      }}
      whileTap={{ scale: 0.985 }}
      transition={{ duration: 0.14 }}
    >
      {children}

      {/* Selection checkmark */}
      {selected && (
        <motion.div
          className="absolute top-3.5 right-3.5 w-5 h-5 rounded-full flex items-center justify-center"
          style={{ backgroundColor: theme.primaryColor }}
          initial={{ scale: 0, rotate: -45 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 22 }}
        >
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </motion.div>
      )}
    </motion.button>
  );
}
