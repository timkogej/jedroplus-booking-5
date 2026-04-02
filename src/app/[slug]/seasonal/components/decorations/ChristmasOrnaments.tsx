'use client';

import { motion } from 'framer-motion';
import { useMemo } from 'react';

interface Props {
  primaryColor: string;
}

export default function ChristmasOrnaments((_props: Props)) {
  const ornaments = useMemo(
    () => [
      { emoji: '🎄', left: 5, top: 10, size: 40 },
      { emoji: '🎁', left: 92, top: 15, size: 30 },
      { emoji: '⭐', left: 10, top: 85, size: 25 },
      { emoji: '🔔', left: 88, top: 80, size: 28 },
      { emoji: '🎅', left: 50, top: 5, size: 35 },
    ],
    []
  );

  return (
    <>
      {ornaments.map((ornament, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{
            left: `${ornament.left}%`,
            top: `${ornament.top}%`,
            fontSize: `${ornament.size}px`,
            willChange: 'transform',
          }}
          animate={{
            rotate: [-5, 5, -5],
            y: [0, -5, 0],
          }}
          transition={{
            duration: 3 + i * 0.5,
            repeat: Infinity,
            ease: 'easeInOut' as const,
          }}
        >
          {ornament.emoji}
        </motion.div>
      ))}

      {/* Hanging ornaments from top */}
      {[0, 1, 2].map((i) => (
        <motion.div
          key={`hanging-${i}`}
          className="absolute"
          style={{
            left: `${20 + i * 30}%`,
            top: 0,
          }}
          animate={{ rotate: [-3, 3, -3] }}
          transition={{
            duration: 2 + i * 0.3,
            repeat: Infinity,
            ease: 'easeInOut' as const,
          }}
        >
          <div className="flex flex-col items-center">
            <div className="w-px h-8 bg-gray-400" />
            <span className="text-2xl">🎄</span>
          </div>
        </motion.div>
      ))}
    </>
  );
}
