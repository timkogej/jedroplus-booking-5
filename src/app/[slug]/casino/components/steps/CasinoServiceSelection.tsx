'use client';

import { useRef, useCallback } from 'react';
import { servicePriceLabel } from '@/lib/text';
import { formatBookingPrice } from '@/lib/pricing';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { useBookingStore } from '@/store/bookingStore';
import type { Category, Service } from '@/types';
import { usePromotionsStore } from '@/store/promotionsStore';
import { PromotionBadge } from '@/components/shared/PromotionBadge';
import { t } from '../../i18n';

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

// ── Selected service chip ──────────────────────────────────────
function ServiceChip({ service, onRemove }: { service: Service; onRemove: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="flex items-center gap-2 px-3 py-1.5 rounded-full"
      style={{
        background: 'rgba(201,168,76,0.08)',
        border: '1px solid rgba(201,168,76,0.35)',
        color: '#c9a84c',
        fontFamily: 'var(--font-oswald)',
        fontSize: '0.62rem',
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
      }}
    >
      <span className="truncate max-w-[140px]">{service.naziv}</span>
      <button
        onClick={onRemove}
        className="flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center"
        style={{ background: 'rgba(201,168,76,0.18)' }}
      >
        <svg width="7" height="7" viewBox="0 0 8 8" fill="none">
          <path d="M1 1l6 6M7 1L1 7" stroke="#c9a84c" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>
    </motion.div>
  );
}

function ServiceCard({
  service,
  suitIndex,
  isSelected,
  onSelect,
}: {
  service: Service;
  suitIndex: number;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const { language } = useBookingStore();
  const { serviceDiscounts } = usePromotionsStore();
  const suit = SUITS[suitIndex % SUITS.length];
  const promo = serviceDiscounts[String(service.id)];

  return (
    <motion.button
      variants={itemVariants}
      onClick={onSelect}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.99 }}
      className="w-full text-left relative overflow-hidden group rounded-lg"
      style={{
        background: isSelected ? 'rgba(12, 50, 24, 0.95)' : 'rgba(10, 40, 20, 0.82)',
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
          {promo ? (
            <AnimatePresence>
              <PromotionBadge
                type={promo.type}
                naziv={promo.naziv}
                badgeLabel={promo.badgeLabel}
                originalCena={promo.originalCena}
                finalCena={promo.finalCena}
                size="sm"
                variantStyle="casino"
              />
            </AnimatePresence>
          ) : (
            <span
              className="flex-shrink-0 font-bold"
              style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.05rem', color: '#e8c96d' }}
            >
              {servicePriceLabel(service.cena, formatBookingPrice) ?? 'Po dogovoru'}
            </span>
          )}
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
            {isSelected ? t(language, 'serviceSelected') : t(language, 'serviceChoose')}
          </span>
        </div>
      </div>
    </motion.button>
  );
}

export default function CasinoServiceSelection() {
  const {
    categories,
    servicesByCategory,
    selectedServices,
    multipleServicesAllowed,
    noEmployeeForCombination,
    currentStep,
    language,
    addService,
    removeService,
    goToStep,
    selectCategoryAndService,
  } = useBookingStore();

  const categoryRefs = useRef<Record<string, HTMLElement | null>>({});
  const pillScrollRef = useRef<HTMLDivElement>(null);

  const scrollToCategory = useCallback((catId: string) => {
    const el = categoryRefs.current[catId];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  const isAddMoreMode = currentStep === 2 && multipleServicesAllowed;

  const handleServiceClick = (category: Category, service: Service) => {
    if (isAddMoreMode) {
      addService(service);
    } else {
      selectCategoryAndService(category, service);
      usePromotionsStore.getState().computeActivePromotion(String(service.id));
    }
  };

  const isServiceSelected = (serviceId: string) =>
    selectedServices.some((s) => s.id === serviceId);

  const canAddMore = multipleServicesAllowed && selectedServices.length < 3;

  if (!categories || categories.length === 0) {
    return (
      <div className="text-center py-16">
        <span style={{ fontFamily: 'Georgia, serif', fontSize: '2rem', color: 'rgba(201,168,76,0.2)' }}>◆</span>
        <p className="mt-4 italic" style={{ fontFamily: 'var(--font-cormorant)', fontSize: '1rem', color: 'rgba(201,168,76,0.4)' }}>
          {t(language, 'noServices')}
        </p>
      </div>
    );
  }

  let globalServiceIndex = 0;

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      <motion.p
        variants={itemVariants}
        className="italic mb-5"
        style={{ fontFamily: 'var(--font-cormorant)', fontSize: '1.05rem', color: 'rgba(232, 217, 184, 0.65)', lineHeight: 1.7 }}
      >
        {t(language, 'serviceIntro')}
      </motion.p>

      {/* ── Selected chips (multi-service add-more mode) ── */}
      {isAddMoreMode && selectedServices.length > 0 && (
        <motion.div variants={itemVariants} className="mb-4">
          <p
            className="mb-2"
            style={{ fontFamily: 'var(--font-oswald)', fontSize: '0.55rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'rgba(201,168,76,0.4)' }}
          >
            {t(language, 'selectedServices')}
          </p>
          <div className="flex flex-wrap gap-2">
            <AnimatePresence>
              {selectedServices.map((s) => (
                <ServiceChip key={s.id} service={s} onRemove={() => removeService(s.id)} />
              ))}
            </AnimatePresence>
          </div>

          {/* No-employee-for-combination warning */}
          <AnimatePresence>
            {noEmployeeForCombination && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 px-4 py-3 rounded-lg"
                style={{
                  background: 'rgba(192, 57, 43, 0.08)',
                  border: '1px solid rgba(192,57,43,0.3)',
                  fontFamily: 'var(--font-cormorant)',
                  fontSize: '0.9rem',
                  color: 'rgba(232,100,80,0.9)',
                  fontStyle: 'italic',
                }}
              >
                {t(language, 'noEmployeeForCombination')}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* ── Category pill strip ── */}
      {categories.length > 1 && (
        <motion.div variants={itemVariants} className="mb-5 -mx-1">
          <div
            ref={pillScrollRef}
            className="flex gap-2 overflow-x-auto pb-1 px-1 mc-scrollbar-hide"
          >
            {categories.map((cat) => {
              const catIndex = categories.indexOf(cat);
              const suit = SUITS[catIndex % SUITS.length];
              return (
                <button
                  key={cat.id}
                  onClick={() => scrollToCategory(cat.id)}
                  className="flex-shrink-0 px-4 py-2 rounded-full transition-all"
                  style={{
                    fontFamily: 'var(--font-oswald)',
                    fontSize: '0.65rem',
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    background: 'rgba(10, 40, 20, 0.75)',
                    border: '1px solid rgba(201,168,76,0.25)',
                    color: '#a89060',
                    whiteSpace: 'nowrap',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(201,168,76,0.55)';
                    (e.currentTarget as HTMLButtonElement).style.color = '#c9a84c';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(201,168,76,0.25)';
                    (e.currentTarget as HTMLButtonElement).style.color = '#a89060';
                  }}
                >
                  {suit} {cat.name}
                </button>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* ── Service sections by category ── */}
      <div className="space-y-7">
        {categories.map((category, catIndex) => {
          const services: Service[] = servicesByCategory[category.id] ?? [];
          if (services.length === 0) return null;
          const catSuit = SUITS[catIndex % SUITS.length];

          return (
            <motion.div
              key={category.id}
              variants={itemVariants}
              ref={(el) => { categoryRefs.current[category.id] = el; }}
            >
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
                    <ServiceCard
                      key={service.id}
                      service={service}
                      suitIndex={idx}
                      isSelected={isServiceSelected(service.id)}
                      onSelect={() => handleServiceClick(category, service)}
                    />
                  );
                })}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ── Step-2 actions (multi-service add-more mode) ── */}
      {isAddMoreMode && (
        <motion.div variants={itemVariants} className="mt-8">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            {canAddMore && (
              <p
                className="text-sm italic"
                style={{ fontFamily: 'var(--font-cormorant)', fontSize: '0.9rem', color: 'rgba(232,217,184,0.5)' }}
              >
                {t(language, 'addAnotherService')} ({selectedServices.length}/3)
              </p>
            )}
            <div className="sm:ml-auto">
              <motion.button
                onClick={() => goToStep(3)}
                disabled={selectedServices.length === 0 || noEmployeeForCombination}
                className="mc-btn-gold px-10 py-4"
                style={{
                  opacity: selectedServices.length === 0 || noEmployeeForCombination ? 0.45 : 1,
                  cursor: selectedServices.length === 0 || noEmployeeForCombination ? 'not-allowed' : 'pointer',
                }}
                whileHover={selectedServices.length > 0 && !noEmployeeForCombination ? { scale: 1.04 } : {}}
                whileTap={selectedServices.length > 0 && !noEmployeeForCombination ? { scale: 0.97 } : {}}
              >
                {t(language, 'next')} →
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── Chip divider ── */}
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
