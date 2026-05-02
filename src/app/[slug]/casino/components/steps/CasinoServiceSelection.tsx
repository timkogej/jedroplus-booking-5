'use client';

import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { useBookingStore } from '@/store/bookingStore';
import { Category, Service } from '@/types';

const SUITS = ['♠', '♥', '♦', '♣'];

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07 } },
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
    transition: { type: 'spring', stiffness: 400, damping: 15 },
  },
};

function ServiceCard({
  service,
  category,
  suitIndex,
}: {
  service: Service;
  category: Category;
  suitIndex: number;
}) {
  const { selectedService, selectCategoryAndService } = useBookingStore();
  const isSelected = selectedService?.id === service.id;
  const suit = SUITS[suitIndex % SUITS.length];

  return (
    <motion.button
      variants={itemVariants}
      onClick={() => selectCategoryAndService(category, service)}
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
      <motion.div
        className="absolute top-0 left-0 right-0 h-px"
        style={{ background: 'linear-gradient(to right, transparent, #c9a84c, transparent)' }}
        initial={{ scaleX: 0 }}
        whileHover={{ scaleX: 1 }}
        transition={{ duration: 0.3 }}
      />

      <AnimatePresence>
        {isSelected && (
          <motion.div
            variants={checkmarkVariants}
            initial="initial"
            animate="animate"
            exit="initial"
            className="absolute top-3 left-3 w-5 h-5 rounded-full flex items-center justify-center"
            style={{ background: '#c9a84c' }}
          >
            <span style={{ color: '#060f08', fontSize: '0.6rem', fontWeight: 700 }}>✓</span>
          </motion.div>
        )}
      </AnimatePresence>

      <span
        className="absolute top-3 right-4 transition-all duration-300 group-hover:opacity-50"
        style={{ fontFamily: 'Georgia, serif', fontSize: '0.95rem', color: 'rgba(201,168,76,0.15)', lineHeight: 1 }}
      >
        {suit}
      </span>

      <div className={`p-4 ${isSelected ? 'pl-10' : ''}`}>
        <div className="flex items-start justify-between gap-3 mb-1.5">
          <h3
            className="font-bold leading-tight flex-1"
            style={{ fontFamily: 'var(--font-playfair)', fontSize: '1rem', color: '#f5edd6' }}
          >
            {service.naziv}
          </h3>
          <span
            className="flex-shrink-0 font-bold"
            style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.05rem', color: '#e8c96d' }}
          >
            €{service.cena}
          </span>
        </div>

        {service.opis && (
          <p
            className="italic mb-2"
            style={{ fontFamily: 'var(--font-cormorant)', fontSize: '0.88rem', color: 'rgba(232, 217, 184, 0.55)', lineHeight: 1.5 }}
          >
            {service.opis}
          </p>
        )}

        <div className="flex items-center justify-between">
          <div
            className="flex items-center gap-2 px-2.5 py-0.5 rounded-full"
            style={{ background: 'rgba(13, 59, 30, 0.6)', border: '1px solid rgba(201, 168, 76, 0.15)' }}
          >
            <span style={{ fontFamily: 'var(--font-oswald)', fontSize: '0.58rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#a89060' }}>
              {formatDuration(service.trajanjeMin)}
            </span>
          </div>
          <span
            style={{ fontFamily: 'var(--font-oswald)', fontSize: '0.6rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: isSelected ? '#c9a84c' : 'rgba(201,168,76,0.4)', transition: 'color 0.3s' }}
          >
            {isSelected ? '◆ Izbrano' : 'Izberi ›'}
          </span>
        </div>
      </div>
    </motion.button>
  );
}

export default function CasinoServiceSelection() {
  const { categories, servicesByCategory } = useBookingStore();

  if (!categories || categories.length === 0) {
    return (
      <div className="text-center py-16">
        <span style={{ fontFamily: 'Georgia, serif', fontSize: '2rem', color: 'rgba(201,168,76,0.2)' }}>◆</span>
        <p className="mt-4 italic" style={{ fontFamily: 'var(--font-cormorant)', fontSize: '1rem', color: 'rgba(201,168,76,0.4)' }}>
          Ni razpoložljivih storitev.
        </p>
      </div>
    );
  }

  let globalServiceIndex = 0;

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      <motion.p
        variants={itemVariants}
        className="italic mb-7"
        style={{ fontFamily: 'var(--font-cormorant)', fontSize: '1.05rem', color: 'rgba(232, 217, 184, 0.65)', lineHeight: 1.7 }}
      >
        Vsaka storitev je stavka v igri. Izberite svojo potezo.
      </motion.p>

      <div className="space-y-7">
        {categories.map((category, catIndex) => {
          const services: Service[] = servicesByCategory[category.id] ?? [];
          if (services.length === 0) return null;
          const catSuit = SUITS[catIndex % SUITS.length];

          return (
            <motion.div key={category.id} variants={itemVariants}>
              {/* Category header */}
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(13, 59, 30, 0.8)', border: '1px solid rgba(201, 168, 76, 0.25)' }}
                >
                  <span style={{ fontFamily: 'Georgia, serif', fontSize: '1rem', color: 'rgba(201,168,76,0.7)' }}>
                    {catSuit}
                  </span>
                </div>
                <h3
                  className="font-bold"
                  style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.05rem', color: '#f5edd6' }}
                >
                  {category.name}
                </h3>
                <div
                  className="flex-1 h-px"
                  style={{ background: 'linear-gradient(to right, rgba(201,168,76,0.3), transparent)' }}
                />
              </div>

              <div className="space-y-2.5 pl-1">
                {services.map((service) => {
                  const idx = globalServiceIndex++;
                  return (
                    <ServiceCard key={service.id} service={service} category={category} suitIndex={idx} />
                  );
                })}
              </div>
            </motion.div>
          );
        })}
      </div>

      <motion.div
        variants={itemVariants}
        className="flex items-center justify-center gap-2 mt-8"
      >
        {['#922b21', '#1e6b30', '#1a1a1a', '#1a4480', '#e0d4b8'].map((color, i) => (
          <div key={i} className="mc-chip" style={{ background: color }} />
        ))}
      </motion.div>
    </motion.div>
  );
}
