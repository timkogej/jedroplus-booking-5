'use client';

import { motion, type Variants } from 'framer-motion';
import { useBookingStore } from '@/store/bookingStore';
import { Category } from '@/types';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: 'easeOut' as const },
  },
};

function CategoryCard({
  category,
  onSelect,
}: {
  category: Category;
  onSelect: (cat: Category) => void;
}) {
  const { theme, servicesByCategory } = useBookingStore();
  const serviceCount = servicesByCategory[category.id]?.length ?? category.service_count ?? 0;

  return (
    <motion.button
      variants={itemVariants}
      onClick={() => onSelect(category)}
      whileHover={{ y: -2, boxShadow: '0 6px 20px rgba(0,0,0,0.07)' }}
      whileTap={{ scale: 0.98 }}
      className="relative p-6 rounded-xl border text-left w-full transition-all duration-200"
      style={{
        backgroundColor: 'white',
        borderColor: '#E5E7EB',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}
    >
      {/* Icon circle */}
      <div
        className="w-11 h-11 rounded-full flex items-center justify-center mb-4"
        style={{ backgroundColor: `${theme.primaryColor}12` }}
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

      {/* Name */}
      <h3
        className="font-medium mb-1 leading-snug"
        style={{
          fontFamily: 'var(--font-inter)',
          fontSize: '0.975rem',
          color: '#1F2937',
        }}
      >
        {category.name}
      </h3>

      {/* Service count */}
      <p
        style={{
          fontFamily: 'var(--font-inter)',
          fontSize: '0.8rem',
          color: '#9CA3AF',
        }}
      >
        {serviceCount} {serviceCount === 1 ? 'storitev' : 'storitve'}
      </p>

      {/* Arrow */}
      <span
        className="absolute top-1/2 right-5 -translate-y-1/2"
        style={{ color: '#D1D5DB', fontSize: '1.1rem', lineHeight: 1 }}
      >
        →
      </span>
    </motion.button>
  );
}

export default function ElegantCategorySelection() {
  const { categories, selectCategory, theme } = useBookingStore();

  if (!categories || categories.length === 0) {
    return (
      <div className="text-center py-20">
        <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.9rem', color: '#9CA3AF' }}>
          Ni razpoložljivih kategorij.
        </p>
      </div>
    );
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      {/* Heading */}
      <motion.div variants={itemVariants} className="mb-8">
        <h2
          style={{
            fontFamily: 'var(--font-playfair)',
            fontSize: '1.75rem',
            fontWeight: 400,
            color: '#111111',
            lineHeight: 1.2,
          }}
        >
          Izberi{' '}
          <span style={{ color: theme.primaryColor }}>kategorijo</span>
        </h2>
        <p
          className="mt-2"
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '0.9rem',
            color: '#6B7280',
          }}
        >
          Katero vrsto storitve iščeš?
        </p>
      </motion.div>

      {/* Cards grid */}
      <motion.div
        variants={containerVariants}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        {categories.map((category) => (
          <CategoryCard
            key={category.id}
            category={category}
            onSelect={selectCategory}
          />
        ))}
      </motion.div>
    </motion.div>
  );
}
