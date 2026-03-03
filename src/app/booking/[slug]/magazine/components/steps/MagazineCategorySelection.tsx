'use client';

import { motion, type Variants } from 'framer-motion';
import { useBookingStore } from '@/store/bookingStore';

const containerVariants: Variants = {
  animate: { transition: { staggerChildren: 0.06 } },
};

const itemVariants: Variants = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' as const } },
};

export default function MagazineCategorySelection() {
  const { categories, selectedCategory, selectCategory, theme } = useBookingStore();

  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={containerVariants}
      className="max-w-xl"
    >
      {/* Section header */}
      <motion.div variants={itemVariants} className="mb-10">
        <div className="w-8 h-[1px] mb-5" style={{ backgroundColor: theme.primaryColor }} />
        <h1 className="magazine-serif text-[2.5rem] md:text-[3rem] text-[#1A1A1A] tracking-[-0.02em] leading-[1.1] mb-4">
          Storitve
        </h1>
        <div className="h-[1px] w-full bg-black/10 mb-4" />
        <p className="magazine-body text-[#6B6B6B] text-[15px] italic leading-relaxed">
          Izberite kategorijo
        </p>
      </motion.div>

      {/* Table-of-contents style category list */}
      <div className="space-y-0">
        {categories.map((category, index) => {
          const isSelected = selectedCategory?.id === category.id;
          const paddedIndex = String(index + 1).padStart(2, '0');

          return (
            <motion.div
              key={category.id}
              variants={itemVariants}
              className="group cursor-pointer"
              onClick={() => selectCategory(category)}
              whileHover={{ x: 4 }}
              transition={{ duration: 0.2 }}
            >
              <div
                className="py-5 border-b transition-all duration-300 relative"
                style={{
                  borderColor: 'rgba(0,0,0,0.08)',
                  backgroundColor: isSelected ? `${theme.primaryColor}04` : 'transparent',
                }}
              >
                {/* Selected left accent */}
                <motion.div
                  className="absolute left-0 top-0 bottom-0 w-[2px]"
                  animate={{ scaleY: isSelected ? 1 : 0 }}
                  transition={{ duration: 0.3 }}
                  style={{ backgroundColor: theme.primaryColor, transformOrigin: 'top' }}
                />

                <div className="flex items-baseline pl-2">
                  {/* Category name */}
                  <span
                    className="magazine-serif text-[1.2rem] transition-colors duration-300 flex-shrink-0"
                    style={{ color: isSelected ? theme.primaryColor : '#1A1A1A' }}
                  >
                    {category.name}
                  </span>

                  {/* Dotted line */}
                  <span className="toc-dots" aria-hidden="true" />

                  {/* Page-number style index */}
                  <span
                    className="magazine-caps text-[9px] tracking-[0.2em] flex-shrink-0 tabular-nums"
                    style={{ color: isSelected ? theme.primaryColor : '#6B6B6B' }}
                  >
                    {paddedIndex}
                  </span>
                </div>

                {/* Subtitle / service count */}
                <p className="text-[#6B6B6B] text-[12px] mt-1.5 pl-2 leading-relaxed">
                  {category.service_count}{' '}
                  {category.service_count === 1 ? 'storitev' : 'storitev'} na voljo
                </p>

                {/* Hover underline on name */}
                <motion.div
                  className="absolute bottom-0 left-2 h-[1px]"
                  style={{ backgroundColor: theme.primaryColor }}
                  initial={{ width: 0 }}
                  animate={{ width: isSelected ? '40%' : 0 }}
                  whileHover={{ width: '30%' }}
                  transition={{ duration: 0.35 }}
                />
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
