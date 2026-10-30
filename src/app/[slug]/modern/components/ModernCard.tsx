'use client';

import { useRef } from 'react';
import { motion } from 'framer-motion';
import { SPRING } from './brand';

interface ModernCardProps {
  children: React.ReactNode;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
}

/**
 * Dark glass card. A soft brand-coloured light follows the pointer, and a
 * selected card gets a slowly rotating gradient rim.
 */
export default function ModernCard({ children, selected, onClick, className = '' }: ModernCardProps) {
  const ref = useRef<HTMLButtonElement>(null);

  const onMove = (e: React.PointerEvent) => {
    const el = ref.current;
    if (!el || e.pointerType !== 'mouse') return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', `${e.clientX - r.left}px`);
    el.style.setProperty('--my', `${e.clientY - r.top}px`);
  };

  return (
    <motion.button
      ref={ref}
      onClick={onClick}
      onPointerMove={onMove}
      aria-pressed={selected}
      className={`group relative w-full overflow-hidden rounded-[22px] p-5 text-left ${className}`}
      style={{
        background: selected
          ? 'linear-gradient(160deg, color-mix(in srgb, var(--brand-a) 22%, transparent), rgba(255,255,255,0.05))'
          : 'rgba(255,255,255,0.045)',
        boxShadow: selected
          ? '0 18px 40px -18px var(--brand-a), inset 0 1px 0 rgba(255,255,255,0.08)'
          : 'inset 0 0 0 1px rgba(255,255,255,0.08), inset 0 1px 0 rgba(255,255,255,0.05)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        transition: 'background 0.3s, box-shadow 0.3s',
      }}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.985 }}
      transition={SPRING}
    >
      {/* pointer light */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background:
            'radial-gradient(260px circle at var(--mx, 50%) var(--my, 50%), color-mix(in srgb, var(--brand-glow) 18%, transparent), transparent 70%)',
        }}
      />
      {selected && <span aria-hidden="true" className="modern-ring" style={{ ['--ring-a' as string]: 'var(--brand-glow)', ['--ring-b' as string]: 'var(--brand-glow2)' }} />}

      <span className="relative block">{children}</span>

      {/* Selection checkmark */}
      {selected && (
        <motion.span
          className="absolute right-3.5 top-3.5 flex h-6 w-6 items-center justify-center rounded-full"
          style={{ background: 'var(--brand-grad)', boxShadow: '0 4px 12px -2px var(--brand-a)' }}
          initial={{ scale: 0, rotate: -45 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 22 }}
        >
          <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.8} d="M5 13l4 4L19 7" />
          </svg>
        </motion.span>
      )}
    </motion.button>
  );
}
