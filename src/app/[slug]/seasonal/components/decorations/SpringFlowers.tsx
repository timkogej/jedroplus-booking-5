'use client';

import { motion } from 'framer-motion';
import { useMemo } from 'react';

interface Props {
  primaryColor: string;
}

export default function SpringFlowers({}: Props) {
  const flowers = useMemo(
    () => [
      { emoji: '🌸', left: 5, top: 20, size: 30 },
      { emoji: '🌷', left: 90, top: 30, size: 28 },
      { emoji: '🌺', left: 8, top: 70, size: 25 },
      { emoji: '🌼', left: 92, top: 75, size: 26 },
      { emoji: '💐', left: 3, top: 45, size: 32 },
    ],
    []
  );

  const butterflies = useMemo(
    () => [
      { left: 20, top: 30 },
      { left: 70, top: 50 },
      { left: 40, top: 70 },
    ],
    []
  );

  return (
    <>
      {flowers.map((flower, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{
            left: `${flower.left}%`,
            top: `${flower.top}%`,
            fontSize: `${flower.size}px`,
          }}
          animate={{
            scale: [1, 1.1, 1],
            rotate: [-5, 5, -5],
          }}
          transition={{
            duration: 4 + i * 0.5,
            repeat: Infinity,
            ease: 'easeInOut' as const,
          }}
        >
          {flower.emoji}
        </motion.div>
      ))}

      {butterflies.map((butterfly, i) => (
        <motion.div
          key={`butterfly-${i}`}
          className="absolute text-2xl"
          style={{
            left: `${butterfly.left}%`,
            top: `${butterfly.top}%`,
          }}
          animate={{
            x: [0, 100, 200, 100, 0],
            y: [0, -30, 0, 30, 0],
            rotate: [0, 10, 0, -10, 0],
          }}
          transition={{
            duration: 15 + i * 3,
            repeat: Infinity,
            ease: 'easeInOut' as const,
            delay: i * 2,
          }}
        >
          🦋
        </motion.div>
      ))}
    </>
  );
}
