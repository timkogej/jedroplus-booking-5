'use client';

import { motion } from 'framer-motion';
import { useMemo } from 'react';

interface Props {
  primaryColor: string;
  count?: number;
}

export default function FloatingHearts({ count = 15 }: Props) {
  const hearts = useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => ({
        id: i,
        left: (i * 7.1 + 3) % 100,
        size: 15 + (i % 4) * 5,
        duration: 12 + (i % 5) * 2,
        delay: (i % 8) * 1.2,
        emoji: ['💕', '💖', '💗', '❤️', '💘'][i % 5],
        swayX: Math.sin(i) * 50,
      })),
    [count]
  );

  return (
    <>
      {hearts.map((heart) => (
        <motion.div
          key={heart.id}
          className="absolute opacity-60"
          style={{
            left: `${heart.left}%`,
            bottom: '-10%',
            fontSize: `${heart.size}px`,
            willChange: 'transform',
          }}
          animate={{
            y: [0, -1200],
            x: [0, heart.swayX, 0],
            rotate: [0, 20, -20, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: heart.duration,
            repeat: Infinity,
            ease: 'easeInOut' as const,
            delay: heart.delay,
          }}
        >
          {heart.emoji}
        </motion.div>
      ))}
    </>
  );
}
