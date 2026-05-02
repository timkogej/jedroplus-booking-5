'use client';

import { motion, type Variants } from 'framer-motion';
import { useBookingStore } from '@/store/bookingStore';
import { Category, Service } from '@/types';

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, x: -12 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.3, ease: 'easeOut' as const },
  },
};

function ServiceRow({
  service,
  category,
  isLast,
}: {
  service: Service;
  category: Category;
  isLast: boolean;
}) {
  const { theme, selectedService, selectCategoryAndService } = useBookingStore();
  const isSelected = selectedService?.id === service.id;

  return (
    <motion.button
      variants={itemVariants}
      onClick={() => selectCategoryAndService(category, service)}
      whileTap={{ scale: 0.995 }}
      className="w-full text-left px-5 py-4 transition-colors duration-150"
      style={{
        borderBottom: isLast ? 'none' : '1px solid #F3F4F6',
        backgroundColor: isSelected ? `${theme.primaryColor}06` : 'transparent',
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3
            className="font-medium leading-snug"
            style={{ fontFamily: 'var(--font-inter)', fontSize: '0.975rem', color: '#1F2937' }}
          >
            {service.naziv}
          </h3>
          {service.opis && (
            <p
              className="mt-0.5 line-clamp-2"
              style={{ fontFamily: 'var(--font-inter)', fontSize: '0.8rem', color: '#9CA3AF', lineHeight: 1.5 }}
            >
              {service.opis}
            </p>
          )}
        </div>

        <div className="flex-shrink-0 text-right">
          <p
            className="font-semibold"
            style={{ fontFamily: 'var(--font-inter)', fontSize: '1rem', color: '#111111' }}
          >
            €{service.cena}
          </p>
          <p
            className="mt-0.5 flex items-center justify-end gap-1"
            style={{ fontFamily: 'var(--font-inter)', fontSize: '0.75rem', color: '#9CA3AF' }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            {formatDuration(service.trajanjeMin)}
          </p>
        </div>
      </div>

      {isSelected && (
        <div className="mt-2 flex items-center gap-1.5" style={{ color: theme.primaryColor }}>
          <div
            className="w-4 h-4 rounded-full flex items-center justify-center"
            style={{ backgroundColor: theme.primaryColor }}
          >
            <span style={{ color: 'white', fontSize: '0.55rem', fontWeight: 700 }}>✓</span>
          </div>
          <span style={{ fontFamily: 'var(--font-inter)', fontSize: '0.75rem', color: theme.primaryColor }}>
            Izbrano
          </span>
        </div>
      )}
    </motion.button>
  );
}

export default function ElegantServiceSelection() {
  const { theme, categories, servicesByCategory } = useBookingStore();

  if (!categories || categories.length === 0) {
    return (
      <div className="text-center py-20">
        <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.9rem', color: '#9CA3AF' }}>
          Ni razpoložljivih storitev.
        </p>
      </div>
    );
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      <motion.div variants={itemVariants} className="mb-6">
        <h2
          style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.75rem', fontWeight: 400, color: '#111111', lineHeight: 1.2 }}
        >
          Izberi <span style={{ color: theme.primaryColor }}>storitev</span>
        </h2>
        <p className="mt-2" style={{ fontFamily: 'var(--font-inter)', fontSize: '0.9rem', color: '#6B7280' }}>
          Katera storitev te zanima?
        </p>
      </motion.div>

      <div className="space-y-5">
        {categories.map((category) => {
          const services: Service[] = servicesByCategory[category.id] ?? [];
          if (services.length === 0) return null;

          return (
            <motion.div key={category.id} variants={itemVariants}>
              {/* Category label */}
              <p
                className="mb-2"
                style={{
                  fontFamily: 'var(--font-inter)',
                  fontSize: '0.72rem',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: theme.primaryColor,
                  fontWeight: 600,
                }}
              >
                {category.name}
              </p>

              {/* Service list card */}
              <div
                className="rounded-xl border overflow-hidden"
                style={{ borderColor: '#E5E7EB', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
              >
                {services.map((service, i) => (
                  <ServiceRow
                    key={service.id}
                    service={service}
                    category={category}
                    isLast={i === services.length - 1}
                  />
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
