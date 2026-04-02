'use client';

import { motion, type Variants } from 'framer-motion';
import { useBookingStore } from '@/store/bookingStore';
import { Service } from '@/types';
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

export default function ClassicServiceSelection() {
  const {
    theme,
    selectedCategory,
    servicesByCategory,
    selectedService,
    selectService,
  } = useBookingStore();

  const contrastMode = getContrastMode(theme.bgFrom, theme.bgTo);
  const textPrimary =
    contrastMode === 'light' ? 'rgba(255,255,255,0.95)' : 'rgba(0,0,0,0.9)';
  const textSecondary =
    contrastMode === 'light' ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.55)';

  const services: Service[] = selectedCategory
    ? servicesByCategory[selectedCategory.id] ?? []
    : [];

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      {/* Page title */}
      <motion.div variants={itemVariants} className="mb-6">
        {selectedCategory && (
          <span
            className="inline-block text-xs font-semibold px-3 py-1 rounded-full mb-3"
            style={{
              fontFamily: 'var(--font-nunito-sans)',
              backgroundColor: `${theme.primaryColor}18`,
              color: theme.primaryColor,
            }}
          >
            {selectedCategory.name}
          </span>
        )}
        <h2
          className="text-3xl font-bold mb-2"
          style={{ fontFamily: 'var(--font-nunito)', color: textPrimary }}
        >
          Izberite storitev
        </h2>
        <p style={{ fontFamily: 'var(--font-nunito-sans)', color: textSecondary }}>
          Katero storitev želite?
        </p>
      </motion.div>

      {/* Service list */}
      {services.length === 0 ? (
        <motion.div variants={itemVariants} className="text-center py-10">
          <p
            style={{
              fontFamily: 'var(--font-nunito-sans)',
              color: textSecondary,
              fontSize: '0.9rem',
            }}
          >
            Ni storitev v tej kategoriji.
          </p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {services.map((service) => {
            const isSelected = selectedService?.id === service.id;
            const price = Number(service.cena);

            return (
              <motion.div key={service.id} variants={itemVariants}>
                <motion.button
                  onClick={() => selectService(service)}
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
          })}
        </div>
      )}
    </motion.div>
  );
}
