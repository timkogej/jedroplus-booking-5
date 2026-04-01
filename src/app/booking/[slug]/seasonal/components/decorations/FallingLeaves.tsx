'use client';

import { motion } from 'framer-motion';
import { useMemo } from 'react';

interface Props {
  primaryColor: string;
  count?: number;
}

export default function FallingLeaves({ primaryColor: _primaryColor, count = 15 }: Props) {
  const leaves = useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => ({
        id: i,
        left: (i * 6.8 + 1.5) % 100,
        size: 20 + (i % 4) * 4,
        duration: 12 + (i % 6) * 2,
        delay: (i % 8) * 1.1,
        emoji: ['🍂', '🍁', '🍃', '🌿'][i % 4],
        rotateAmount: 360 + (i % 4) * 90,
        swayAmount: 50 + (i % 5) * 20,
      })),
    [count]
  );

  return (
    <>
      {leaves.map((leaf) => (
        <motion.div
          key={leaf.id}
          className="absolute opacity-70"
          style={{
            left: `${leaf.left}%`,
            top: '-10%',
            fontSize: `${leaf.size}px`,
            willChange: 'transform',
          }}
          animate={{
            y: ['0vh', '110vh'],
            x: [0, leaf.swayAmount, 0, -leaf.swayAmount, 0],
            rotate: [0, leaf.rotateAmount],
          }}
          transition={{
            duration: leaf.duration,
            repeat: Infinity,
            ease: 'easeInOut' as const,
            delay: leaf.delay,
          }}
        >
          {leaf.emoji}
        </motion.div>
      ))}
    </>
  );
}
