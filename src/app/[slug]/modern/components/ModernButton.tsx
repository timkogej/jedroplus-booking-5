'use client';

import { motion } from 'framer-motion';
import { useBookingStore } from '@/store/bookingStore';

interface ModernButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
  loading?: boolean;
  className?: string;
}

export default function ModernButton({
  children,
  onClick,
  disabled,
  variant = 'primary',
  loading,
  className = '',
}: ModernButtonProps) {
  const { theme } = useBookingStore();
  const isDisabled = disabled || loading;

  return (
    <motion.button
      onClick={isDisabled ? undefined : onClick}
      disabled={isDisabled}
      className={`relative overflow-hidden px-8 py-4 rounded-2xl font-semibold flex items-center justify-center gap-2 w-full ${className}`}
      style={{
        backgroundColor: variant === 'primary' ? theme.primaryColor : 'var(--s2)',
        color: variant === 'primary' ? '#ffffff' : 'var(--t-primary)',
        fontFamily: 'var(--font-inter)',
        fontSize: '0.975rem',
        border: variant === 'secondary' ? '1px solid var(--b2)' : 'none',
        boxShadow:
          !isDisabled && variant === 'primary'
            ? `0 8px 28px ${theme.primaryColor}40`
            : 'none',
        opacity: isDisabled ? 0.55 : 1,
        cursor: isDisabled ? 'not-allowed' : 'pointer',
      }}
      whileHover={
        !isDisabled
          ? {
              scale: 1.02,
              boxShadow:
                variant === 'primary'
                  ? `0 12px 36px ${theme.primaryColor}50`
                  : '0 6px 20px rgba(0,0,0,0.1)',
            }
          : {}
      }
      whileTap={!isDisabled ? { scale: 0.98 } : {}}
    >
      {/* Animated shine sweep */}
      {!isDisabled && variant === 'primary' && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.22) 50%, transparent 100%)',
            backgroundSize: '200% 100%',
          }}
          animate={{ backgroundPosition: ['-100% 0', '200% 0'] }}
          transition={{ duration: 2.4, repeat: Infinity, repeatDelay: 2.5 }}
        />
      )}

      {loading ? (
        <>
          <motion.div
            className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' as const }}
          />
          <span>Pošiljam&hellip;</span>
        </>
      ) : (
        children
      )}
    </motion.button>
  );
}
