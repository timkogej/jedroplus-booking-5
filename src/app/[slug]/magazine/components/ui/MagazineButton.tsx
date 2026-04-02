'use client';

import { motion, HTMLMotionProps } from 'framer-motion';
import { useBookingStore } from '@/store/bookingStore';

type Variant = 'primary' | 'outline' | 'ghost' | 'gradient';

interface MagazineButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: Variant;
  children: React.ReactNode;
}

export default function MagazineButton({
  variant = 'outline',
  children,
  className = '',
  ...props
}: MagazineButtonProps) {
  const { theme } = useBookingStore();

  const base =
    'relative overflow-hidden magazine-caps text-[9px] tracking-[0.2em] px-8 py-3 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed';

  const styles: Record<Variant, React.CSSProperties> = {
    primary: {
      backgroundColor: theme.primaryColor,
      color: 'white',
      border: `1px solid ${theme.primaryColor}`,
    },
    outline: {
      backgroundColor: 'transparent',
      color: theme.primaryColor,
      border: `1px solid ${theme.primaryColor}`,
    },
    ghost: {
      backgroundColor: 'transparent',
      color: '#6B6B6B',
      border: '1px solid rgba(0,0,0,0.12)',
    },
    gradient: {
      background: `linear-gradient(135deg, ${theme.bgFrom}, ${theme.bgTo})`,
      color: 'white',
      border: 'none',
    },
  };

  return (
    <motion.button
      className={`${base} ${className}`}
      style={styles[variant]}
      whileHover={{ scale: 1.02, opacity: 0.92 }}
      whileTap={{ scale: 0.98 }}
      {...props}
    >
      {/* Shine overlay for gradient variant */}
      {variant === 'gradient' && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.15) 50%, transparent 60%)',
          }}
          initial={{ x: '-100%' }}
          whileHover={{ x: '100%' }}
          transition={{ duration: 0.5 }}
        />
      )}
      <span className="relative z-10">{children}</span>
    </motion.button>
  );
}
