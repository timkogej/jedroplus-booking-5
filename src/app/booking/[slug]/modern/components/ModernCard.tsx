'use client';

import { motion } from 'framer-motion';
import { useBookingStore } from '@/store/bookingStore';

interface ModernCardProps {
  children: React.ReactNode;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
}

export default function ModernCard({ children, selected, onClick, className = '' }: ModernCardProps) {
  const { theme } = useBookingStore();

  return (
    <motion.button
      onClick={onClick}
      className={`relative w-full p-5 rounded-2xl text-left modern-glass overflow-hidden ${className}`}
      style={{
        backgroundColor: selected ? `${theme.primaryColor}18` : 'var(--s2)',
        border: selected
          ? `2px solid ${theme.primaryColor}`
          : '1px solid var(--b2)',
        boxShadow: selected
          ? `0 8px 32px ${theme.primaryColor}20`
          : '0 2px 12px rgba(0,0,0,0.06)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
      whileHover={{
        scale: 1.015,
        backgroundColor: selected ? `${theme.primaryColor}22` : 'var(--s2h)',
        boxShadow: selected
          ? `0 12px 40px ${theme.primaryColor}28`
          : '0 8px 28px rgba(0,0,0,0.1)',
      }}
      whileTap={{ scale: 0.985 }}
      transition={{ duration: 0.15 }}
    >
      {/* Shimmer on hover */}
      <motion.div
        className="absolute inset-0 rounded-2xl pointer-events-none"
        style={{
          background: `linear-gradient(105deg, transparent 35%, ${theme.primaryColor}0a 50%, transparent 65%)`,
          backgroundSize: '200% 100%',
        }}
        initial={{ backgroundPosition: '-100% 0' }}
        whileHover={{ backgroundPosition: '200% 0' }}
        transition={{ duration: 0.7, ease: 'easeInOut' as const }}
      />

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
