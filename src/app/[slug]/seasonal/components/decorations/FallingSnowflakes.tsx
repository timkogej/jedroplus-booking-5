'use client';

import { motion } from 'framer-motion';
import { useMemo } from 'react';

interface Props {
  primaryColor: string;
  count?: number;
}

export default function FallingSnowflakes({ primaryColor: _primaryColor, count = 20 }: Props) {
  const snowflakes = useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => ({
        id: i,
        left: (i * 5.3 + 2) % 100,
        size: 10 + (i % 6) * 2.5,
        duration: 10 + (i % 8) * 2,
        delay: (i % 10) * 1.1,
        sway: Math.sin(i) * 100,
      })),
    [count]
  );

  return (
    <>
      {snowflakes.map((flake) => (
        <motion.div
          key={flake.id}
          className="absolute opacity-70"
          style={{
            left: `${flake.left}%`,
            top: '-5%',
            fontSize: `${flake.size}px`,
            color: 'white',
            textShadow: '0 0 5px rgba(255,255,255,0.5)',
            willChange: 'transform',
          }}
          animate={{
            y: ['0vh', '110vh'],
            x: [0, flake.sway, 0],
            rotate: [0, 360],
          }}
          transition={{
            duration: flake.duration,
            repeat: Infinity,
            ease: 'linear' as const,
            delay: flake.delay,
          }}
        >
          ❄️
        </motion.div>
      ))}
    </>
  );
}
