'use client';

import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { useBookingStore } from '@/store/bookingStore';
import { Service } from '@/types';

const SUITS = ['♠', '♥', '♦', '♣'];

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, x: -14 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.4, ease: 'easeOut' as const },
  },
};

const checkmarkVariants: Variants = {
  initial: { scale: 0, opacity: 0 },
  animate: {
    scale: 1,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 15,
    },
  },
};

function ServiceCard({
  service,
  index,
  onSelect,
}: {
  service: Service;
  index: number;
  onSelect: (s: Service) => void;
}) {
  const { selectedService } = useBookingStore();
  const isSelected = selectedService?.id === service.id;
  const suit = SUITS[index % SUITS.length];

  return (
    <motion.button
      variants={itemVariants}
      onClick={() => onSelect(service)}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.99 }}
      className="w-full text-left relative overflow-hidden group rounded-lg"
      style={{
        background: isSelected
          ? 'rgba(12, 50, 24, 0.95)'
          : 'rgba(10, 40, 20, 0.82)',
        backdropFilter: 'blur(8px)',
        border: isSelected
          ? '1px solid rgba(201, 168, 76, 0.75)'
          : '1px solid rgba(201, 168, 76, 0.2)',
        boxShadow: isSelected
          ? '0 0 28px rgba(201, 168, 76, 0.18), inset 0 0 18px rgba(201, 168, 76, 0.04)'
          : '0 4px 16px rgba(0,0,0,0.25)',
        transition: 'all 0.3s ease',
      }}
    >
      {/* Top gold line on hover */}
      <motion.div
        className="absolute top-0 left-0 right-0 h-px"
        style={{ background: 'linear-gradient(to right, transparent, #c9a84c, transparent)' }}
        initial={{ scaleX: 0 }}
        whileHover={{ scaleX: 1 }}
        transition={{ duration: 0.3 }}
      />

      {/* Selected checkmark */}
      <AnimatePresence>
        {isSelected && (
          <motion.div
            variants={checkmarkVariants}
            initial="initial"
            animate="animate"
            exit="initial"
            className="absolute top-3 left-3 w-5 h-5 rounded-full flex items-center justify-center"
            style={{
              background: '#c9a84c',
            }}
          >
            <span style={{ color: '#060f08', fontSize: '0.6rem', fontWeight: 700 }}>✓</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Suit corner */}
      <span
        className="absolute top-3 right-4 transition-all duration-300 group-hover:opacity-50"
        style={{
          fontFamily: 'Georgia, serif',
          fontSize: '0.95rem',
          color: 'rgba(201,168,76,0.15)',
          lineHeight: 1,
        }}
      >
        {suit}
      </span>

      <div className={`p-5 ${isSelected ? 'pl-10' : ''}`}>
        {/* Service name + price */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <h3
            className="font-bold leading-tight flex-1"
            style={{
              fontFamily: 'var(--font-playfair)',
              fontSize: '1.1rem',
              color: '#f5edd6',
            }}
          >
            {service.naziv}
          </h3>
          <span
            className="flex-shrink-0 font-bold"
            style={{
              fontFamily: 'var(--font-playfair)',
              fontSize: '1.15rem',
              color: '#e8c96d',
            }}
          >
            €{service.cena}
          </span>
        </div>

        {/* Description */}
        {service.opis && (
          <p
            className="italic mb-3"
            style={{
              fontFamily: 'var(--font-cormorant)',
              fontSize: '0.9rem',
              color: 'rgba(232, 217, 184, 0.55)',
              lineHeight: 1.55,
            }}
          >
            {service.opis}
          </p>
        )}

        {/* Duration + CTA row */}
        <div className="flex items-center justify-between">
          <div
            className="flex items-center gap-2 px-3 py-1 rounded-full"
            style={{
              background: 'rgba(13, 59, 30, 0.6)',
              border: '1px solid rgba(201, 168, 76, 0.15)',
            }}
          >
            <span style={{ fontFamily: 'var(--font-oswald)', fontSize: '0.6rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#a89060' }}>
              {formatDuration(service.trajanjeMin)}
            </span>
          </div>

          <span
            style={{
              fontFamily: 'var(--font-oswald)',
              fontSize: '0.62rem',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: isSelected ? '#c9a84c' : 'rgba(201,168,76,0.4)',
              transition: 'color 0.3s',
            }}
          >
            {isSelected ? '◆ Izbrano' : 'Izberi ›'}
          </span>
        </div>
      </div>
    </motion.button>
  );
}

export default function CasinoServiceSelection() {
  const { selectedCategory, servicesByCategory, selectService } = useBookingStore();

  const services = selectedCategory
    ? (servicesByCategory[selectedCategory.id] ?? [])
    : [];

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      {/* Category badge */}
      <motion.div variants={itemVariants} className="flex items-center gap-3 mb-6">
        <div
          className="px-3 py-1.5 rounded-full flex items-center gap-2"
          style={{
            background: 'rgba(13, 59, 30, 0.6)',
            border: '1px solid rgba(201, 168, 76, 0.2)',
          }}
        >
          <span style={{ fontFamily: 'Georgia, serif', fontSize: '0.7rem', color: 'rgba(201,168,76,0.5)' }}>◆</span>
          <span
            style={{
              fontFamily: 'var(--font-oswald)',
              fontSize: '0.62rem',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: '#a89060',
            }}
          >
            {selectedCategory?.name ?? 'Kategorija'}
          </span>
        </div>
      </motion.div>

      {services.length === 0 ? (
        <motion.div variants={itemVariants} className="text-center py-16">
          <span
            style={{ fontFamily: 'Georgia, serif', fontSize: '2rem', color: 'rgba(201,168,76,0.2)' }}
          >
            ◆
          </span>
          <p
            className="mt-4 italic"
            style={{ fontFamily: 'var(--font-cormorant)', fontSize: '1rem', color: 'rgba(201,168,76,0.4)' }}
          >
            Ni razpoložljivih storitev.
          </p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {services.map((service, i) => (
            <ServiceCard key={service.id} service={service} index={i} onSelect={selectService} />
          ))}
        </div>
      )}

      {/* Note bar */}
      <motion.div
        variants={itemVariants}
        className="mt-7 flex items-center gap-2 px-4 py-2.5 rounded-lg"
        style={{
          background: 'rgba(39, 174, 96, 0.06)',
          border: '1px solid rgba(39, 174, 96, 0.2)',
        }}
      >
        <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#27ae60', flexShrink: 0 }} />
        <span
          style={{
            fontFamily: 'var(--font-oswald)',
            fontSize: '0.62rem',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color: 'rgba(39,174,96,0.7)',
          }}
        >
          Rezervacije odprte · Termini se polnijo
        </span>
      </motion.div>
    </motion.div>
  );
}
