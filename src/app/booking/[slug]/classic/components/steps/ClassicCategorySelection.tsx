'use client';

import { motion, type Variants } from 'framer-motion';
import { useBookingStore } from '@/store/bookingStore';
import { Category } from '@/types';
import { getContrastMode } from '../ClassicLayout';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: 'easeOut' as const },
  },
};

function CategoryCard({ category, onSelect }: { category: Category; onSelect: (cat: Category) => void }) {
  const { theme, servicesByCategory } = useBookingStore();
  const serviceCount = servicesByCategory[category.id]?.length ?? category.service_count ?? 0;

  return (
    <motion.button
      variants={itemVariants}
      onClick={() => onSelect(category)}
      className="w-full p-5 rounded-2xl text-left relative"
      style={{
        background: 'rgba(255,255,255,0.97)',
        border: '2px solid transparent',
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
      }}
      whileHover={{
        scale: 1.01,
        boxShadow: `0 6px 24px ${theme.primaryColor}20`,
        border: `2px solid ${theme.primaryColor}40`,
      }}
      whileTap={{ scale: 0.99 }}
    >
      <div className="flex items-center gap-4">
        {/* Icon */}
        <div
          className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${theme.primaryColor}15` }}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke={theme.primaryColor}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 6h16M4 12h16M4 18h7" />
          </svg>
        </div>

        <div className="flex-1 min-w-0">
          <h3
            className="font-semibold text-gray-900 mb-0.5"
            style={{ fontFamily: 'var(--font-nunito-sans)' }}
          >
            {category.name}
          </h3>
          <p
            className="text-sm text-gray-400"
            style={{ fontFamily: 'var(--font-nunito-sans)' }}
          >
            {serviceCount} {serviceCount === 1 ? 'storitev' : 'storitve'}
          </p>
        </div>

        <span className="text-gray-300 text-xl flex-shrink-0">›</span>
      </div>
    </motion.button>
  );
}

export default function ClassicCategorySelection() {
  const { categories, selectCategory, theme } = useBookingStore();
  const contrastMode = getContrastMode(theme.bgFrom, theme.bgTo);
  const textPrimary =
    contrastMode === 'light' ? 'rgba(255,255,255,0.95)' : 'rgba(0,0,0,0.9)';
  const textSecondary =
    contrastMode === 'light' ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.55)';

  if (!categories || categories.length === 0) {
    return (
      <div className="text-center py-20">
        <p style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '0.9rem', color: 'rgba(255,255,255,0.5)' }}>
          Ni razpoložljivih kategorij.
        </p>
      </div>
    );
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      <motion.div variants={itemVariants} className="mb-8">
        <h2
          className="text-3xl font-bold mb-2"
          style={{ fontFamily: 'var(--font-nunito)', color: textPrimary }}
        >
          Izberi{' '}
          <span style={{ color: theme.primaryColor }}>kategorijo</span>
        </h2>
        <p style={{ fontFamily: 'var(--font-nunito-sans)', color: textSecondary }}>
          Katero vrsto storitve iščeš?
        </p>
      </motion.div>

      <div className="space-y-3">
        {categories.map((category) => (
          <CategoryCard key={category.id} category={category} onSelect={selectCategory} />
        ))}
      </div>
    </motion.div>
  );
}
