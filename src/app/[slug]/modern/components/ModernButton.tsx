'use client';

import { motion } from 'framer-motion';
import { useBookingStore } from '@/store/bookingStore';
import { SPRING } from './brand';

interface ModernButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
  loading?: boolean;
  /** Text next to the spinner; defaults to "Pošiljam…" / "Sending…". */
  loadingText?: string;
  className?: string;
}

export default function ModernButton({
  children,
  onClick,
  disabled,
  variant = 'primary',
  loading,
  loadingText,
  className = '',
}: ModernButtonProps) {
  const language = useBookingStore((s) => s.language);
  const isDisabled = disabled || loading;
  const primary = variant === 'primary';

  return (
    <motion.button
      onClick={isDisabled ? undefined : onClick}
      disabled={isDisabled}
      className={`relative flex h-14 w-full items-center justify-center gap-2 overflow-hidden rounded-[18px] px-8 text-[16px] font-bold ${className}`}
      style={{
        background: primary ? (disabled && !loading ? 'rgba(255,255,255,0.1)' : 'var(--brand-grad)') : 'rgba(255,255,255,0.07)',
        color: primary && !(disabled && !loading) ? '#FFFFFF' : 'var(--t-soft)',
        fontFamily: 'var(--font-inter)',
        letterSpacing: '-0.01em',
        boxShadow:
          !isDisabled && primary
            ? '0 14px 34px -12px var(--brand-a), inset 0 1px 0 rgba(255,255,255,0.25)'
            : primary
            ? 'none'
            : 'inset 0 0 0 1px rgba(255,255,255,0.1)',
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        textShadow: primary ? '0 1px 2px rgba(0,0,0,0.18)' : undefined,
      }}
      whileHover={!isDisabled ? { y: -2, scale: 1.01 } : {}}
      whileTap={!isDisabled ? { scale: 0.98 } : {}}
      transition={SPRING}
    >
      {/* Light sweeping across now and then */}
      {!isDisabled && primary && (
        <motion.span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 skew-x-[-20deg]"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent)' }}
          animate={{ x: ['0%', '450%'] }}
          transition={{ duration: 1.4, repeat: Infinity, repeatDelay: 3, ease: 'easeInOut' }}
        />
      )}

      {loading ? (
        <>
          <motion.span
            className="block h-4 w-4 rounded-full border-2 border-white border-t-transparent"
            animate={{ rotate: 360 }}
            transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' as const }}
          />
          <span className="relative">{loadingText ?? (language === 'en' ? 'Sending…' : 'Pošiljam…')}</span>
        </>
      ) : (
        <span className="relative flex items-center gap-2">{children}</span>
      )}
    </motion.button>
  );
}
