'use client';

import { motion, type Variants } from 'framer-motion';
import { useBookingStore } from '@/store/bookingStore';
import { Category, Service } from '@/types';
import { getContrastMode } from '../ClassicLayout';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.28, ease: 'easeOut' as const },
  },
};

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

function ServiceCard({
  service,
  category,
}: {
  service: Service;
  category: Category;
}) {
  const { theme, selectedService, selectCategoryAndService } = useBookingStore();
  const isSelected = selectedService?.id === service.id;
  const price = Number(service.cena);

  return (
    <motion.div variants={itemVariants}>
      <motion.button
        onClick={() => selectCategoryAndService(category, service)}
        className="w-full p-5 rounded-2xl text-left"
        style={{
          background: 'rgba(255,255,255,0.97)',
          border: isSelected
            ? `2px solid ${theme.primaryColor}`
            : '2px solid transparent',
          boxShadow: isSelected
            ? `0 8px 28px ${theme.primaryColor}25`
            : '0 2px 12px rgba(0,0,0,0.06)',
        }}
        whileHover={{
          scale: 1.01,
          boxShadow: `0 6px 24px ${theme.primaryColor}20`,
        }}
        whileTap={{ scale: 0.99 }}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h3
              className="font-semibold text-gray-900 mb-1"
              style={{ fontFamily: 'var(--font-nunito-sans)' }}
            >
              {service.naziv}
            </h3>
            {service.opis && (
              <p
                className="text-sm text-gray-500 mb-2 line-clamp-2"
                style={{ fontFamily: 'var(--font-nunito-sans)' }}
              >
                {service.opis}
              </p>
            )}
            <p
              className="text-sm text-gray-400"
              style={{ fontFamily: 'var(--font-nunito-sans)' }}
            >
              ⏱ {formatDuration(service.trajanjeMin)}
            </p>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            <span
              className="text-xl font-bold"
              style={{ fontFamily: 'var(--font-nunito)', color: theme.primaryColor }}
            >
              {isNaN(price) ? service.cena : `${price.toFixed(2).replace('.', ',')} €`}
            </span>
            <span className="text-gray-300 text-lg">›</span>
          </div>
        </div>
      </motion.button>
    </motion.div>
  );
}

export default function ClassicServiceSelection() {
  const { theme, categories, servicesByCategory } = useBookingStore();
  const contrastMode = getContrastMode(theme.bgFrom, theme.bgTo);
  const textPrimary =
    contrastMode === 'light' ? 'rgba(255,255,255,0.95)' : 'rgba(0,0,0,0.9)';
  const textSecondary =
    contrastMode === 'light' ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.55)';

  if (!categories || categories.length === 0) {
    return (
      <div className="text-center py-20">
        <p style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '0.9rem', color: textSecondary }}>
          Ni razpoložljivih storitev.
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
          Izberite{' '}
          <span style={{ color: theme.primaryColor }}>storitev</span>
        </h2>
        <p style={{ fontFamily: 'var(--font-nunito-sans)', color: textSecondary }}>
          Katero storitev želite?
        </p>
      </motion.div>

      <div className="space-y-8">
        {categories.map((category) => {
          const services: Service[] = servicesByCategory[category.id] ?? [];
          if (services.length === 0) return null;

          return (
            <motion.div key={category.id} variants={itemVariants}>
              {/* Category header */}
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${theme.primaryColor}18` }}
                >
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={theme.primaryColor}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M4 6h16M4 12h16M4 18h7" />
                  </svg>
                </div>
                <h3
                  className="font-bold text-base tracking-wide"
                  style={{ fontFamily: 'var(--font-nunito)', color: textPrimary }}
                >
                  {category.name}
                </h3>
                <div
                  className="flex-1 h-px"
                  style={{
                    background: contrastMode === 'light'
                      ? 'rgba(255,255,255,0.18)'
                      : 'rgba(0,0,0,0.1)',
                  }}
                />
              </div>

              <div className="space-y-2.5 pl-2">
                {services.map((service) => (
                  <ServiceCard key={service.id} service={service} category={category} />
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
