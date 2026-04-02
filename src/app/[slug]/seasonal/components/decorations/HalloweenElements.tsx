'use client';

import { motion } from 'framer-motion';
import { useMemo } from 'react';

interface Props {
  showPumpkins?: boolean;
  showGhosts?: boolean;
  showBats?: boolean;
}

export default function HalloweenElements({ showPumpkins, showGhosts, showBats }: Props) {
  const ghosts = useMemo(
    () => [
      { left: 10, top: 20 },
      { left: 85, top: 30 },
      { left: 15, top: 60 },
      { left: 80, top: 70 },
    ],
    []
  );

  const bats = useMemo(
    () => [
      { top: 20 },
      { top: 50 },
      { top: 35 },
    ],
    []
  );

  return (
    <>
      {showPumpkins && (
        <>
          <motion.div
            className="absolute bottom-5 left-5 text-5xl"
            animate={{
              scale: [1, 1.05, 1],
              filter: [
                'drop-shadow(0 0 10px #ff6600)',
                'drop-shadow(0 0 20px #ff6600)',
                'drop-shadow(0 0 10px #ff6600)',
              ],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            🎃
          </motion.div>
          <motion.div
            className="absolute bottom-5 right-5 text-4xl"
            animate={{
              scale: [1, 1.05, 1],
              filter: [
                'drop-shadow(0 0 10px #ff6600)',
                'drop-shadow(0 0 20px #ff6600)',
                'drop-shadow(0 0 10px #ff6600)',
              ],
            }}
            transition={{ duration: 2.5, repeat: Infinity }}
          >
            🎃
          </motion.div>

          {/* Spooky moon */}
          <motion.div
            className="absolute top-10 right-10 text-6xl opacity-40"
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ duration: 4, repeat: Infinity }}
          >
            🌕
          </motion.div>

          {/* Spider web in corner */}
          <div className="absolute top-0 left-0 w-32 h-32 opacity-20">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <path
                d="M0,0 Q50,50 0,100 M0,0 Q50,25 100,0 M0,0 L100,100 M0,50 Q50,50 100,50 M50,0 Q50,50 50,100"
                fill="none"
                stroke="white"
                strokeWidth="0.5"
              />
            </svg>
          </div>
        </>
      )}

      {showGhosts &&
        ghosts.map((ghost, i) => (
          <motion.div
            key={`ghost-${i}`}
            className="absolute text-4xl"
            style={{
              left: `${ghost.left}%`,
              top: `${ghost.top}%`,
            }}
            animate={{
              y: [0, -20, 0],
              x: [0, 10, 0],
              opacity: [0.3, 0.6, 0.3],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 4 + i * 0.5,
              repeat: Infinity,
              ease: 'easeInOut' as const,
              delay: i * 0.5,
            }}
          >
            👻
          </motion.div>
        ))}

      {showBats &&
        bats.map((bat, i) => (
          <motion.div
            key={`bat-${i}`}
            className="absolute text-2xl"
            style={{ top: `${bat.top}%` }}
            animate={{
              x: ['-10vw', '110vw'],
              y: [0, -30, 0, 30, 0],
            }}
            transition={{
              duration: 8 + i * 2,
              repeat: Infinity,
              ease: 'linear' as const,
              delay: i * 3,
            }}
          >
            🦇
          </motion.div>
        ))}
    </>
  );
}
