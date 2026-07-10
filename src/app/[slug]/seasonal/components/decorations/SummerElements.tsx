'use client';

import { motion } from 'framer-motion';

interface Props {
  primaryColor: string;
}

export default function SummerElements({}: Props) {
  return (
    <>
      {/* Sun emoji in corner — gently rotating and breathing */}
      <motion.div
        className="absolute -top-16 -right-16 text-[140px] opacity-20 select-none pointer-events-none"
        animate={{
          rotate: [0, 360],
          scale: [1, 1.04, 1],
        }}
        transition={{
          rotate: { duration: 80, repeat: Infinity, ease: 'linear' as const },
          scale: { duration: 6, repeat: Infinity, ease: 'easeInOut' as const },
        }}
      >
        ☀️
      </motion.div>

      {/* Gentle wave shimmer at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-16 overflow-hidden opacity-15 pointer-events-none">
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-8"
          style={{
            background: 'linear-gradient(to top, rgba(217,119,6,0.25), transparent)',
            borderRadius: '60% 60% 0 0',
          }}
          animate={{
            scaleY: [1, 1.18, 1],
            y: [0, -4, 0],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut' as const,
          }}
        />
      </div>
    </>
  );
}
