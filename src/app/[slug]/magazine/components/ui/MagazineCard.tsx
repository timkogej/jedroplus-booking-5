'use client';

import { motion, HTMLMotionProps } from 'framer-motion';
import { useBookingStore } from '@/store/bookingStore';

interface MagazineCardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  selected?: boolean;
  children: React.ReactNode;
  lift?: boolean;
}

export default function MagazineCard({
  selected = false,
  lift = true,
  children,
  className = '',
  ...props
}: MagazineCardProps) {
  const { theme } = useBookingStore();

  return (
    <motion.div
      className={`relative border bg-white transition-all duration-300 ${className}`}
      style={{
        borderColor: selected ? theme.primaryColor : 'rgba(0,0,0,0.1)',
        borderLeftWidth: selected ? 3 : 1,
        borderLeftColor: selected ? theme.primaryColor : 'rgba(0,0,0,0.1)',
        backgroundColor: selected ? `${theme.primaryColor}04` : 'white',
        boxShadow: selected
          ? `0 4px 24px ${theme.primaryColor}12`
          : '0 1px 8px rgba(0,0,0,0.04)',
      }}
      whileHover={lift ? { y: -3, boxShadow: '0 12px 32px rgba(0,0,0,0.08)' } : undefined}
      transition={{ duration: 0.25 }}
      {...props}
    >
      {children}
    </motion.div>
  );
}
