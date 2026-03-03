'use client';

import { motion } from 'framer-motion';
import { Layers } from 'lucide-react';
import { useBookingStore } from '@/store/bookingStore';

export default function CategorySelection() {
  const { categories, selectedCategory, selectCategory, theme } = useBookingStore();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="max-w-3xl"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="mb-16">
        <h1 className="font-serif text-3xl md:text-4xl mb-3 text-white">
          Izberi{' '}
          <span style={{ color: theme.primaryColor }}>
            kategorijo
          </span>
        </h1>
        <p className="text-white/60">
          Katero vrsto storitve iščeš?
        </p>
      </motion.div>

      {/* Category grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 md:gap-12">
        {categories.map((category) => {
          const isSelected = selectedCategory?.id === category.id;

          return (
            <motion.div
              key={category.id}
              variants={itemVariants}
              className="flex flex-col items-center text-center cursor-pointer group"
              onClick={() => selectCategory(category)}
              whileHover={{ y: -4 }}
              transition={{ duration: 0.2 }}
            >
              {/* Icon container */}
              <motion.div
                className="mb-5 relative"
                whileHover={{ scale: 1.1 }}
                transition={{ duration: 0.2 }}
              >
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300"
                  style={{
                    border: isSelected
                      ? `3px solid ${theme.primaryColor}`
                      : '2px solid rgba(255,255,255,0.3)',
                    backgroundColor: isSelected
                      ? `${theme.primaryColor}20`
                      : 'rgba(255,255,255,0.1)',
                  }}
                >
                  <Layers
                    className="w-7 h-7 transition-colors duration-300"
                    strokeWidth={1.5}
                    style={{
                      color: isSelected
                        ? theme.primaryColor
                        : 'rgba(255,255,255,0.7)',
                    }}
                  />
                </div>
              </motion.div>

              {/* Category name */}
              <h3
                className="font-serif text-lg mb-1 transition-colors duration-300"
                style={{
                  color: isSelected ? theme.primaryColor : 'white',
                }}
              >
                {category.name}
              </h3>

              {/* Service count */}
              <p className="text-sm text-white/50 mb-4">
                {category.service_count} storitev
              </p>

              {/* Underline indicator */}
              <motion.div
                className="h-[2px] w-12 rounded-full transition-all duration-300"
                style={{
                  backgroundColor: isSelected
                    ? theme.primaryColor
                    : 'transparent',
                }}
                whileHover={{
                  backgroundColor: theme.primaryColor,
                  width: '48px',
                }}
              />
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
