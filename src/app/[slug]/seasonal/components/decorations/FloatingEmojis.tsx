'use client';

import { motion } from 'framer-motion';
import { useMemo } from 'react';
import { SeasonalTheme } from './SeasonDetector';

const SEASON_EMOJIS: Record<string, string[]> = {
  christmas:    ['🎄', '❄️', '🎁', '⭐', '🔔', '🦌', '🎅', '🕯️', '🧦', '🤶'],
  newyear:      ['🎉', '🥂', '✨', '🎊', '🎆', '🎇', '🥳', '🍾', '🌟', '💫'],
  valentine:    ['❤️', '💕', '💖', '🌹', '💌', '💝', '💗', '🌸', '💘', '🫶'],
  easter:       ['🐰', '🥚', '🌷', '🐣', '🌸', '🐇', '🌼', '🦋', '🌻', '🍀'],
  halloween:    ['🎃', '👻', '🦇', '🕷️', '🕸️', '💀', '🌙', '⚡', '🦉', '🍬'],
  thanksgiving: ['🍂', '🍁', '🦃', '🌽', '🎑', '🧡', '🍄', '🌰', '🍃', '🏡'],
  winter:       ['❄️', '⛄', '🌨️', '🏔️', '🌬️', '🧊', '🌟', '🦢', '🌙', '💙'],
  spring:       ['🌸', '🌷', '🦋', '🌼', '🌻', '🐝', '🌱', '🍃', '🌈', '🌿'],
  summer:       ['☀️', '🌊', '🏖️', '🌴', '🐚', '🦀', '🍦', '🌺', '🐠', '⛵'],
  autumn:       ['🍂', '🍁', '🍄', '🌰', '🦊', '🍎', '🌾', '🌿', '🍇', '🦔'],
};

function getEmojiSet(seasonalTheme: SeasonalTheme): string[] {
  if (seasonalTheme.holiday) return SEASON_EMOJIS[seasonalTheme.holiday] ?? SEASON_EMOJIS[seasonalTheme.season];
  return SEASON_EMOJIS[seasonalTheme.season];
}

interface Particle {
  id: number;
  emoji: string;
  size: number;
  opacity: number;
  duration: number;
  delay: number;
  // start and end positions as vw/vh
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  rotate: number;
}

interface Props {
  seasonalTheme: SeasonalTheme;
  count?: number;
}

export default function FloatingEmojis({ seasonalTheme, count = 22 }: Props) {
  const emojis = getEmojiSet(seasonalTheme);

  const particles: Particle[] = useMemo(() => {
    return Array.from({ length: count }).map((_, i) => {
      // Pick a random edge to enter from: 0=top, 1=right, 2=bottom, 3=left
      const enterEdge = i % 4;
      const exitEdge = (enterEdge + 2) % 4; // opposite edge

      const rand = (min: number, max: number, seed: number) => {
        // deterministic-ish pseudo-random using index
        const x = Math.sin(i * 9.301 + seed * 7.919) * 0.5 + 0.5;
        return min + x * (max - min);
      };

      const edgePos = rand(5, 95, i);

      const startX =
        enterEdge === 3 ? -12 :
        enterEdge === 1 ? 112 :
        edgePos;
      const startY =
        enterEdge === 0 ? -12 :
        enterEdge === 2 ? 112 :
        edgePos;

      const endPos = rand(5, 95, i + 100);
      const endX =
        exitEdge === 3 ? -12 :
        exitEdge === 1 ? 112 :
        endPos;
      const endY =
        exitEdge === 0 ? -12 :
        exitEdge === 2 ? 112 :
        endPos;

      return {
        id: i,
        emoji: emojis[i % emojis.length],
        size: rand(18, 42, i + 1),
        opacity: rand(0.25, 0.65, i + 2),
        duration: rand(18, 38, i + 3),
        delay: rand(0, 20, i + 4),
        startX,
        startY,
        endX,
        endY,
        rotate: rand(-180, 180, i + 5),
      };
    });
  }, [count, emojis]);

  return (
    <div className="fixed inset-0 z-[2] pointer-events-none overflow-hidden">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute select-none"
          style={{
            fontSize: p.size,
            opacity: p.opacity,
            left: 0,
            top: 0,
            willChange: 'transform',
          }}
          initial={{
            x: `${p.startX}vw`,
            y: `${p.startY}vh`,
            rotate: 0,
            scale: 0.7,
          }}
          animate={{
            x: `${p.endX}vw`,
            y: `${p.endY}vh`,
            rotate: p.rotate,
            scale: [0.7, 1.05, 0.85, 1, 0.7],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            repeatType: 'reverse',
            ease: 'easeInOut',
            delay: p.delay,
          }}
        >
          {p.emoji}
        </motion.div>
      ))}
    </div>
  );
}
