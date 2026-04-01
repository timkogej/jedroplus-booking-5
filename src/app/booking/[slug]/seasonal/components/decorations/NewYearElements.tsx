'use client';

import { motion } from 'framer-motion';
import { useMemo, useState, useEffect } from 'react';

interface Props {
  primaryColor: string;
}

export default function NewYearElements({ primaryColor: _primaryColor }: Props) {
  const [fireworks, setFireworks] = useState<Array<{ id: number; x: number; y: number }>>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setFireworks((prev) => [
        ...prev.slice(-5),
        {
          id: Date.now(),
          x: 20 + Math.random() * 60,
          y: 20 + Math.random() * 40,
        },
      ]);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const confetti = useMemo(
    () =>
      Array.from({ length: 30 }).map((_, i) => ({
        id: i,
        left: (i * 3.4 + 1) % 100,
        color: ['#FFD700', '#FF6B6B', '#4ECDC4', '#9B59B6', '#3498DB'][i % 5],
        size: 8 + (i % 4) * 2,
        duration: 8 + (i % 5) * 1.5,
        delay: (i % 5) * 1,
        swayX: Math.sin(i) * 50,
      })),
    []
  );

  return (
    <>
      {/* Confetti */}
      {confetti.map((piece) => (
        <motion.div
          key={piece.id}
          className="absolute"
          style={{
            left: `${piece.left}%`,
            top: '-5%',
            width: piece.size,
            height: piece.size * 0.6,
            backgroundColor: piece.color,
            borderRadius: '2px',
          }}
          animate={{
            y: ['0vh', '110vh'],
            x: [0, piece.swayX],
            rotate: [0, 360 * 3],
          }}
          transition={{
            duration: piece.duration,
            repeat: Infinity,
            ease: 'linear' as const,
            delay: piece.delay,
          }}
        />
      ))}

      {/* Firework bursts */}
      {fireworks.map((fw) => (
        <motion.div
          key={fw.id}
          className="absolute"
          style={{
            left: `${fw.x}%`,
            top: `${fw.y}%`,
          }}
          initial={{ scale: 0, opacity: 1 }}
          animate={{ scale: 2, opacity: 0 }}
          transition={{ duration: 1 }}
        >
          <div className="relative w-20 h-20">
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 rounded-full"
                style={{
                  backgroundColor: ['#FFD700', '#FF6B6B', '#4ECDC4'][i % 3],
                  left: '50%',
                  top: '50%',
                }}
                animate={{
                  x: Math.cos((i * 45 * Math.PI) / 180) * 40,
                  y: Math.sin((i * 45 * Math.PI) / 180) * 40,
                  opacity: [1, 0],
                }}
                transition={{ duration: 0.8 }}
              />
            ))}
          </div>
        </motion.div>
      ))}

      {/* Champagne */}
      <motion.div
        className="absolute bottom-10 right-10 text-4xl"
        animate={{ rotate: [-5, 5, -5] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        🥂
      </motion.div>

      {/* Party */}
      <motion.div
        className="absolute top-10 left-10 text-3xl"
        animate={{ rotate: [0, 15, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        🎉
      </motion.div>
    </>
  );
}
