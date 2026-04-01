'use client';

import { motion, type Variants } from 'framer-motion';
import { useBookingStore } from '@/store/bookingStore';
import { Category } from '@/types';
import ModernCard from '../ModernCard';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 380, damping: 24 },
  },
};

function CategoryIcon({ selected }: { selected: boolean }) {
  const { theme } = useBookingStore();

  return (
    <motion.div
      className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 mx-auto"
      style={{
        backgroundColor: selected ? `${theme.primaryColor}22` : 'var(--s1)',
        border: `1px solid ${selected ? theme.primaryColor : 'var(--b1)'}`,
      }}
      animate={selected ? { scale: [1, 1.08, 1], rotate: [0, 3, -3, 0] } : {}}
      transition={{ duration: 0.45 }}
    >
      <svg
        className="w-7 h-7"
        style={{ color: selected ? theme.primaryColor : 'var(--t-muted)' }}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4 6h16M4 12h16M4 18h7" />
      </svg>
    </motion.div>
  );
}

function CategoryCard({ category, onSelect }: { category: Category; onSelect: (c: Category) => void }) {
  const { theme, servicesByCategory, selectedCategory } = useBookingStore();
  const isSelected = selectedCategory?.id === category.id;
  const serviceCount = servicesByCategory[category.id]?.length ?? category.service_count ?? 0;

  return (
    <motion.div variants={itemVariants}>
      <ModernCard selected={isSelected} onClick={() => onSelect(category)} className="text-center">
        <CategoryIcon selected={isSelected} />
        <h3
          className="font-semibold text-base mb-1"
          style={{ color: 'var(--t-primary)', fontFamily: 'var(--font-inter)' }}
        >
          {category.name}
        </h3>
        <p className="text-sm" style={{ color: 'var(--t-faint)', fontFamily: 'var(--font-inter)' }}>
          {serviceCount} {serviceCount === 1 ? 'storitev' : serviceCount < 5 ? 'storitve' : 'storitev'}
        </p>
      </ModernCard>
    </motion.div>
  );
}

export default function ModernCategorySelection() {
  const { categories, selectCategory, theme } = useBookingStore();

  if (!categories || categories.length === 0) {
    return (
      <div className="text-center py-20">
        <p style={{ color: 'var(--t-muted)', fontFamily: 'var(--font-inter)', fontSize: '0.9rem' }}>
          Ni razpoložljivih kategorij.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Heading */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center mb-8"
      >
        <h2
          className="text-3xl font-bold mb-3"
          style={{ color: 'var(--t-primary)', fontFamily: 'var(--font-dm-sans)' }}
        >
          Izberi{' '}
          <span
            className="modern-gradient-text"
            style={{
              backgroundImage: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})`,
            }}
          >
            kategorijo
          </span>
        </h2>
        <p className="text-sm" style={{ color: 'var(--t-muted)', fontFamily: 'var(--font-inter)' }}>
          Katero vrsto storitve iščeš?
        </p>
      </motion.div>

      {/* Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        {categories.map((category) => (
          <CategoryCard key={category.id} category={category} onSelect={selectCategory} />
        ))}
      </motion.div>
    </div>
  );
}
