'use client';

import { motion } from 'framer-motion';

interface Props {
  primaryColor: string;
}

export default function SummerElements(_props: Props) {
  return (
    <>
      {/* Sun in corner */}
      <motion.div
        className="absolute -top-20 -right-20 text-[150px] opacity-30"
        animate={{
          rotate: [0, 360],
          scale: [1, 1.05, 1],
        }}
        transition={{
          rotate: { duration: 60, repeat: Infinity, ease: 'linear' as const },
          scale: { duration: 5, repeat: Infinity, ease: 'easeInOut' as const },
        }}
      >
        ☀️
      </motion.div>

      {/* Sun rays */}
      <div className="absolute top-0 right-0 w-96 h-96 overflow-hidden opacity-20">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute top-0 right-0 w-2 h-64"
            style={{
              backgroundColor: '#FFD700',
              transform: `rotate(${i * 45}deg)`,
              transformOrigin: 'bottom right',
            }}
            animate={{ opacity: [0.3, 0.7, 0.3] }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.2,
            }}
          />
        ))}
      </div>

      {/* Waves at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-20 overflow-hidden opacity-30">
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-10"
          style={{
            background: 'linear-gradient(to top, rgba(0,150,255,0.3), transparent)',
            borderRadius: '50% 50% 0 0',
          }}
          animate={{
            scaleY: [1, 1.2, 1],
            y: [0, -5, 0],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut' as const,
          }}
        />
      </div>

      {/* Beach elements */}
      <motion.div
        className="absolute bottom-5 left-10 text-3xl"
        animate={{ rotate: [-5, 5, -5] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        🏖️
      </motion.div>
      <motion.div
        className="absolute bottom-5 right-10 text-3xl"
        animate={{ rotate: [5, -5, 5] }}
        transition={{ duration: 2.5, repeat: Infinity }}
      >
        🌴
      </motion.div>
    </>
  );
}
