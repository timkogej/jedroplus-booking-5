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

interface Props {
  seasonalTheme: SeasonalTheme;
  count?: number;
}

export default function FloatingEmojis({ seasonalTheme, count = 14 }: Props) {
  const emojis = getEmojiSet(seasonalTheme);

  const particles = useMemo(() => {
    // Evenly divide the screen into a grid so emojis spread out nicely.
    // We place each particle in its own zone to avoid clustering.
    const cols = 4;
    const rows = Math.ceil(count / cols);

    return Array.from({ length: count }).map((_, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);

      // Deterministic pseudo-random within the zone
      const seed = (n: number) => {
        const x = Math.sin(i * 13.37 + n * 7.91) * 0.5 + 0.5;
        return x;
      };

      const zoneW = 100 / cols;
      const zoneH = 100 / rows;

      // Start position within this zone (add small inset so emojis don't hug edges)
      const startX = col * zoneW + zoneW * 0.1 + seed(1) * zoneW * 0.8;
      const startY = row * zoneH + zoneH * 0.1 + seed(2) * zoneH * 0.8;

      // Drift — gentle, within ±12vw / ±10vh of start position
      const driftX = (seed(3) - 0.5) * 24;
      const driftY = (seed(4) - 0.5) * 20;

      return {
        id: i,
        emoji: emojis[i % emojis.length],
        size: 16 + seed(5) * 18,           // 16–34px
        opacity: 0.18 + seed(6) * 0.25,    // 0.18–0.43 — subtle on light bg
        duration: 8 + seed(7) * 8,           // 8–16s — lively but smooth
        delay: seed(8) * 6,                 // stagger up to 6s
        startX,
        startY,
        endX: startX + driftX,
        endY: startY + driftY,
        rotate: (seed(9) - 0.5) * 60,      // ±30°
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
            left: 0,
            top: 0,
            willChange: 'transform',
          }}
          initial={{
            x: `${p.startX}vw`,
            y: `${p.startY}vh`,
            rotate: 0,
            opacity: 0,
          }}
          animate={{
            x: [`${p.startX}vw`, `${p.endX}vw`, `${p.startX}vw`],
            y: [`${p.startY}vh`, `${p.endY}vh`, `${p.startY}vh`],
            rotate: [0, p.rotate, 0],
            opacity: [0, p.opacity, p.opacity, 0],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: p.delay,
            times: [0, 0.06, 0.94, 1],
          }}
        >
          {p.emoji}
        </motion.div>
      ))}
    </div>
  );
}
