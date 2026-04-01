'use client';

import { motion, type Variants } from 'framer-motion';
import { useBookingStore } from '@/store/bookingStore';
import { Service } from '@/types';
import { SeasonalTheme } from '../decorations/SeasonDetector';

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, x: -16 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.3, ease: 'easeOut' as const },
  },
};

function ServiceRow({ service, onSelect }: { service: Service; onSelect: (s: Service) => void }) {
  const { theme, selectedService } = useBookingStore();
  const isSelected = selectedService?.id === service.id;

  return (
    <motion.button
      variants={itemVariants}
      onClick={() => onSelect(service)}
      className="w-full text-left px-5 py-4 transition-colors duration-150 relative group"
      style={{
        backgroundColor: isSelected ? `${theme.primaryColor}10` : 'transparent',
        borderBottom: '1px solid var(--b1)',
      }}
      whileTap={{ scale: 0.995 }}
      whileHover={{ backgroundColor: isSelected ? `${theme.primaryColor}14` : 'var(--s1)' }}
    >
      {isSelected && (
        <motion.div
          className="absolute left-0 top-0 bottom-0 w-0.5 rounded-r"
          style={{ backgroundColor: theme.primaryColor }}
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ duration: 0.2 }}
        />
      )}

      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3
            className="font-semibold leading-snug mb-0.5"
            style={{
              fontFamily: 'var(--font-quicksand)',
              fontSize: '0.95rem',
              color: isSelected ? theme.primaryColor : 'var(--t-primary)',
            }}
          >
            {service.naziv}
          </h3>
          {service.opis && (
            <p
              className="line-clamp-2 text-sm leading-relaxed"
              style={{ color: 'var(--t-faint)', fontFamily: 'var(--font-quicksand)' }}
            >
              {service.opis}
            </p>
          )}
        </div>

        <div className="flex-shrink-0 text-right">
          <p
            className="font-bold"
            style={{
              fontFamily: 'var(--font-quicksand)',
              fontSize: '1.05rem',
              color: 'var(--t-primary)',
            }}
          >
            €{service.cena}
          </p>
          <p
            className="flex items-center justify-end gap-1 text-xs mt-0.5"
            style={{ color: 'var(--t-faint)', fontFamily: 'var(--font-quicksand)' }}
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            {formatDuration(service.trajanjeMin)}
          </p>
        </div>
      </div>
    </motion.button>
  );
}

interface Props {
  seasonalTheme: SeasonalTheme;
}

export default function SeasonalServiceSelection({ seasonalTheme }: Props) {
  const { selectedCategory, servicesByCategory, selectService, theme } = useBookingStore();

  const services = selectedCategory ? (servicesByCategory[selectedCategory.id] ?? []) : [];

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8"
      >
        {selectedCategory && (
          <p
            className="text-xs font-semibold mb-2 tracking-widest uppercase"
            style={{ color: theme.primaryColor, fontFamily: 'var(--font-quicksand)' }}
          >
            {selectedCategory.name}
          </p>
        )}
        <h2
          className="text-3xl font-bold mb-2"
          style={{
            color: 'var(--t-primary)',
            fontFamily: seasonalTheme.config.headingFont ?? 'var(--font-quicksand)',
          }}
        >
          Izberi{' '}
          <span
            className="seasonal-gradient-text"
            style={{
              backgroundImage: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})`,
            }}
          >
            storitev
          </span>
        </h2>
        <p className="text-sm" style={{ color: 'var(--t-muted)', fontFamily: 'var(--font-quicksand)' }}>
          Katera storitev te zanima?
        </p>
      </motion.div>

      {services.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16"
        >
          <p style={{ color: 'var(--t-muted)', fontFamily: 'var(--font-quicksand)', fontSize: '0.9rem' }}>
            Ni razpoložljivih storitev.
          </p>
        </motion.div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="rounded-2xl overflow-hidden seasonal-surface"
          style={{
            backgroundColor: 'var(--s2)',
            border: '1px solid var(--b2)',
          }}
        >
          {services.map((service, i) => (
            <div
              key={service.id}
              style={i === services.length - 1 ? { borderBottom: 'none' } : {}}
            >
              <ServiceRow service={service} onSelect={selectService} />
            </div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
