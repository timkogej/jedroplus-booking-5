'use client';

import { motion, type Variants } from 'framer-motion';
import { useBookingStore } from '@/store/bookingStore';
import { Category } from '@/types';

const SUITS = ['♠', '♥', '♦', '♣'];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.09 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.42, ease: 'easeOut' as const },
  },
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
  const suit = SUITS[index % SUITS.length];

  return (
    <motion.button
      variants={itemVariants}
      onClick={() => onSelect(category)}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      className="mc-card w-full text-left p-5 relative overflow-hidden group"
    >
      {/* Suit corner decoration */}
      <span
        className="absolute top-3 right-4 transition-opacity duration-300"
        style={{
          fontFamily: 'Georgia, serif',
          fontSize: '1.1rem',
          color: 'rgba(201,168,76,0.15)',
          lineHeight: 1,
        }}
      >
        {suit}
      </span>

      {/* Hover top line */}
      <motion.div
        className="absolute top-0 left-0 right-0 h-px"
        style={{ background: 'linear-gradient(to right, transparent, #c9a84c, transparent)' }}
        initial={{ scaleX: 0 }}
        whileHover={{ scaleX: 1 }}
        transition={{ duration: 0.3 }}
      />

      <div className="flex items-center gap-4 pr-6">
        {/* Icon box */}
        <div
          className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{
            background: 'rgba(13, 59, 30, 0.8)',
            border: '1px solid rgba(201, 168, 76, 0.2)',
          }}
        >
          <span
            style={{
              fontFamily: 'Georgia, serif',
              fontSize: '1.3rem',
              color: 'rgba(201,168,76,0.6)',
            }}
          >
            {suit}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <h3
            className="font-bold mb-0.5 leading-tight"
            style={{
              fontFamily: 'var(--font-playfair)',
              fontSize: '1.05rem',
              color: '#f5edd6',
            }}
          >
            {category.name}
          </h3>
          <p
            style={{
              fontFamily: 'var(--font-oswald)',
              fontSize: '0.6rem',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: '#a89060',
            }}
          >
            {category.service_count} {category.service_count === 1 ? 'storitev' : 'storitev'}
          </p>
        </div>

        <motion.span
          className="flex-shrink-0 text-sm transition-colors"
          style={{ color: 'rgba(201,168,76,0.35)' }}
          whileHover={{ color: '#c9a84c', x: 3 }}
        >
          ›
        </motion.span>
      </div>
    </motion.button>
  );
}

export default function CasinoCategorySelection() {
  const { categories, selectCategory } = useBookingStore();

  if (!categories || categories.length === 0) {
    return (
      <div className="text-center py-16">
        <span
          style={{ fontFamily: 'Georgia, serif', fontSize: '2rem', color: 'rgba(201,168,76,0.2)' }}
        >
          ◆
        </span>
        <p
          className="mt-4 italic"
          style={{ fontFamily: 'var(--font-cormorant)', fontSize: '1rem', color: 'rgba(201,168,76,0.4)' }}
        >
          Ni razpoložljivih kategorij.
        </p>
      </div>
    );
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      {/* Intro */}
      <motion.p
        variants={itemVariants}
        className="italic mb-7"
        style={{
          fontFamily: 'var(--font-cormorant)',
          fontSize: '1.05rem',
          color: 'rgba(232, 217, 184, 0.65)',
          lineHeight: 1.7,
        }}
      >
        Vsaka kategorija je vstopnica na naše igrišče. Izberite svojo pot.
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

      {/* Chip divider */}
      <motion.div
        variants={itemVariants}
        className="flex items-center justify-center gap-2 mt-8"
      >
        {['#922b21', '#1e6b30', '#1a1a1a', '#1a4480', '#e0d4b8'].map((color, i) => (
          <div key={i} className="mc-chip" style={{ background: color }} />
        ))}
      </motion.div>
    </motion.div>
  );
}
