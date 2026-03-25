'use client';

import { motion } from 'framer-motion';
import { useBookingStore } from '@/store/bookingStore';
import { Category } from '@/types';

const CATEGORY_ICONS = ['🎰', '🃏', '🎲', '🍀', '⭐', '💎', '🔔', '🎯'];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

function CategoryCard({
  category,
  index,
  onSelect,
}: {
  category: Category;
  index: number;
  onSelect: (cat: Category) => void;
}) {
  const { theme } = useBookingStore();
  const primary = theme.primaryColor;
  const icon = CATEGORY_ICONS[index % CATEGORY_ICONS.length];

  return (
    <motion.button
      variants={itemVariants}
      onClick={() => onSelect(category)}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.97 }}
      className="w-full text-left rounded-xl p-5 transition-all casino-card relative overflow-hidden group"
      style={{
        backgroundColor: '#1A1A2E',
        border: `1px solid rgba(139,92,246,0.2)`,
      }}
    >
      {/* Background glow on hover */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"
        style={{ background: `radial-gradient(ellipse at left center, ${primary}10, transparent 70%)` }}
      />

      <div className="relative flex items-center gap-4">
        {/* Icon in slot-machine style box */}
        <div
          className="w-14 h-14 rounded-lg flex items-center justify-center text-2xl flex-shrink-0 casino-scanlines relative"
          style={{
            backgroundColor: '#0D1117',
            border: `1px solid ${primary}30`,
            boxShadow: `inset 0 0 10px rgba(0,0,0,0.5)`,
          }}
        >
          {icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3
            className="font-bold text-sm tracking-wide uppercase mb-1 text-white group-hover:text-white transition-colors"
            style={{ fontFamily: 'var(--font-orbitron)' }}
          >
            {category.name}
          </h3>
          <p
            className="text-xs tracking-widest uppercase"
            style={{ fontFamily: 'var(--font-inter)', color: 'rgba(255,255,255,0.4)' }}
          >
            {category.service_count} {category.service_count === 1 ? 'game' : 'games'} available
          </p>
        </div>

        {/* Arrow */}
        <motion.div
          className="flex-shrink-0 text-lg"
          initial={{ opacity: 0.3, x: 0 }}
          whileHover={{ opacity: 1, x: 4 }}
          style={{ color: primary }}
        >
          ▶
        </motion.div>
      </div>

      {/* Bottom neon accent line */}
      <motion.div
        className="absolute bottom-0 left-0 h-[2px] rounded-full"
        style={{ backgroundColor: primary, boxShadow: `0 0 6px ${primary}` }}
        initial={{ width: '0%' }}
        whileHover={{ width: '100%' }}
        transition={{ duration: 0.3 }}
      />
    </motion.button>
  );
}

export default function CasinoCategorySelection() {
  const { categories, selectCategory, theme } = useBookingStore();
  const primary = theme.primaryColor;

  if (!categories || categories.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-5xl mb-4">🎰</div>
        <p className="text-white/40 text-sm" style={{ fontFamily: 'var(--font-inter)' }}>
          Ni razpoložljivih kategorij
        </p>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Intro text */}
      <motion.p
        variants={itemVariants}
        className="text-sm mb-6"
        style={{ fontFamily: 'var(--font-inter)', color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}
      >
        Izberite kategorijo storitev, ki vas zanima.
        Vsaka kategorija je vaša vstopnica na igrišče.
      </motion.p>

      {/* Category cards */}
      <div className="space-y-3">
        {categories.map((cat, i) => (
          <CategoryCard
            key={cat.id}
            category={cat}
            index={i}
            onSelect={selectCategory}
          />
        ))}
      </div>

      {/* Flavor text */}
      <motion.div
        variants={itemVariants}
        className="mt-8 text-center"
      >
        <p
          className="text-[10px] tracking-[0.25em] uppercase"
          style={{ fontFamily: 'var(--font-orbitron)', color: `${primary}40` }}
        >
          ✦ Izberite svojo igro ✦
        </p>
      </motion.div>
    </motion.div>
  );
}
