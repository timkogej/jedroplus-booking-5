'use client';

import { motion } from 'framer-motion';
import { useMemo } from 'react';

interface Props {
  primaryColor: string;
}

export default function EasterElements((_props: Props)) {
  const elements = useMemo(
    () => [
      { emoji: '🥚', left: 10, top: 80, size: 25 },
      { emoji: '🐣', left: 85, top: 75, size: 28 },
      { emoji: '🥚', left: 15, top: 20, size: 22 },
      { emoji: '🐰', left: 90, top: 25, size: 35 },
      { emoji: '🌷', left: 5, top: 50, size: 30 },
    ],
    []
  );

  return (
    <>
      {elements.map((el, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{
            left: `${el.left}%`,
            top: `${el.top}%`,
            fontSize: `${el.size}px`,
          }}
          animate={{
            rotate: [-10, 10, -10],
            y: [0, -5, 0],
          }}
          transition={{
            duration: 2 + i * 0.3,
            repeat: Infinity,
            ease: 'easeInOut' as const,
          }}
        >
          {el.emoji}
        </motion.div>
      ))}

      {/* Hopping bunny */}
      <motion.div
        className="absolute text-4xl"
        style={{ bottom: '10%', left: '5%' }}
        animate={{
          x: [0, 50, 100, 50, 0],
          y: [0, -20, 0, -20, 0],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut' as const,
        }}
      >
        🐰
      </motion.div>
    </>
  );
}
