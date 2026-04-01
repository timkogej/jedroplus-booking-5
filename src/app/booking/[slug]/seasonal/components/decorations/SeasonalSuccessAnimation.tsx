'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { SeasonalTheme } from './SeasonDetector';

interface Props {
  isActive: boolean;
  seasonalTheme: SeasonalTheme;
  primaryColor: string;
}

export default function SeasonalSuccessAnimation({ isActive, seasonalTheme, primaryColor: _primaryColor }: Props) {
  const { season, holiday } = seasonalTheme;

  const getParticles = (): string[] => {
    if (holiday === 'christmas') return ['🎄', '⭐', '🎁', '❄️', '🔔'];
    if (holiday === 'halloween') return ['🎃', '👻', '🦇', '⭐', '✨'];
    if (holiday === 'valentine') return ['💕', '💖', '💗', '❤️', '💘'];
    if (holiday === 'easter') return ['🥚', '🐰', '🌷', '🐣', '✨'];
    if (holiday === 'newyear') return ['🎉', '🥂', '✨', '🎊', '⭐'];
    if (season === 'winter') return ['❄️', '⭐', '✨', '❄️', '⭐'];
    if (season === 'spring') return ['🌸', '🌷', '🦋', '🌼', '✨'];
    if (season === 'summer') return ['☀️', '🌊', '⭐', '✨', '🌴'];
    if (season === 'autumn') return ['🍂', '🍁', '🍃', '⭐', '✨'];
    return ['✨', '⭐', '🎉', '💫', '✨'];
  };

  const particles = getParticles();

  return (
    <AnimatePresence>
      {isActive && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {[...Array(20)].map((_, i) => {
            const angle = (i / 20) * Math.PI * 2;
            const distance = 150 + (i % 5) * 25;

            return (
              <motion.div
                key={i}
                className="absolute left-1/2 top-1/2 text-2xl"
                initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
                animate={{
                  x: Math.cos(angle) * distance,
                  y: Math.sin(angle) * distance,
                  scale: [0, 1.5, 1],
                  opacity: [1, 1, 0],
                  rotate: [0, 360],
                }}
                transition={{
                  duration: 1.5,
                  ease: 'easeOut' as const,
                  delay: (i % 5) * 0.06,
                }}
              >
                {particles[i % particles.length]}
              </motion.div>
            );
          })}

          {/* Flash */}
          <motion.div
            className="absolute inset-0 bg-white"
            initial={{ opacity: 0.5 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          />
        </div>
      )}
    </AnimatePresence>
  );
}
