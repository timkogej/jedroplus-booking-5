'use client';

import { useRef, useCallback } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { useBookingStore } from '@/store/bookingStore';
import { Category, Service } from '@/types';
import { usePromotionsStore } from '@/store/promotionsStore';
import { PromotionBadge } from '@/components/shared/PromotionBadge';
import { t } from '../../i18n';

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

// ── Selected service chip (multi-service mode) ────────────────────────────────
function ServiceChip({
  service,
  onRemove,
  primaryColor,
}: {
  service: Service;
  onRemove: () => void;
  primaryColor: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium"
      style={{
        background: `${primaryColor}14`,
        border: `1.5px solid ${primaryColor}30`,
        color: primaryColor,
        fontFamily: 'var(--font-inter)',
      }}
    >
      <span className="truncate max-w-[140px]">{service.naziv}</span>
      <button
        onClick={onRemove}
        className="flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center"
        style={{ background: `${primaryColor}28` }}
        aria-label={`Odstrani ${service.naziv}`}
      >
        <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
          <path
            d="M1 1l6 6M7 1L1 7"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </motion.div>
  );
}

// ── Service row ───────────────────────────────────────────────────────────────
function ServiceRow({
  service,
  isLast,
  isMultiMode,
  isSelected,
  onSelect,
}: {
  service: Service;
  isLast: boolean;
  isMultiMode: boolean;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const { theme } = useBookingStore();
  const { serviceDiscounts } = usePromotionsStore();
  const promo = serviceDiscounts[String(service.id)];

  return (
    <motion.button
      variants={itemVariants}
      onClick={onSelect}
      className="w-full text-left px-5 py-4 transition-colors duration-150 relative group"
      style={{
        backgroundColor: isSelected ? `${theme.primaryColor}10` : 'transparent',
        borderBottom: isLast ? 'none' : '1px solid var(--b1)',
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

      <div className="flex items-start gap-3">
        {/* Multi-select checkbox */}
        {isMultiMode && (
          <div
            className="mt-0.5 w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 transition-all"
            style={{
              background: isSelected ? theme.primaryColor : 'transparent',
              border: `2px solid ${isSelected ? theme.primaryColor : 'var(--b2)'}`,
            }}
          >
            {isSelected && (
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path
                  d="M1.5 5l2.5 2.5 5-5"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <h3
            className="font-semibold leading-snug mb-0.5"
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '0.95rem',
              color: isSelected ? theme.primaryColor : 'var(--t-primary)',
            }}
          >
            {service.naziv}
          </h3>
          {service.opis && (
            <p
              className="line-clamp-2 text-sm leading-relaxed"
              style={{ color: 'var(--t-faint)', fontFamily: 'var(--font-inter)' }}
            >
              {service.opis}
            </p>
          )}
        </div>

        <div className="flex-shrink-0 text-right">
          {promo ? (
            <AnimatePresence>
              <PromotionBadge
                type={promo.type}
                naziv={promo.naziv}
                badgeLabel={promo.badgeLabel}
                originalCena={promo.originalCena}
                finalCena={promo.finalCena}
                size="sm"
                variantStyle="modern"
                accentColor={theme.primaryColor}
              />
            </AnimatePresence>
          ) : (
            <p
              style={{ fontFamily: 'var(--font-clash)', fontWeight: 500, fontSize: '1.05rem', color: 'var(--t-primary)' }}
            >
              €{service.cena}
            </p>
          )}
          <p
            className="flex items-center justify-end gap-1 text-xs mt-0.5"
            style={{ color: 'var(--t-faint)', fontFamily: 'var(--font-inter)' }}
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

// ── Main component ────────────────────────────────────────────────────────────
export default function ModernServiceSelection() {
  const {
    theme,
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

  const scrollToCategory = useCallback((catId: string) => {
    const el = categoryRefs.current[catId];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  // Step 2 = add-more mode (multi-service enabled, user returning to add more)
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
      <div className="text-center py-20">
        <p style={{ color: 'var(--t-muted)', fontFamily: 'var(--font-inter)', fontSize: '0.9rem' }}>
          {t(language, 'noServices')}
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* ── Heading ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-5"
      >
        <h2
          className="mb-2"
          style={{
            color: 'var(--t-primary)',
            fontFamily: 'var(--font-clash)',
            fontWeight: 400,
            fontSize: 'clamp(2rem, 5vw, 3.25rem)',
            letterSpacing: '-0.015em',
            lineHeight: 1.1,
          }}
        >
          {t(language, 'chooseService')}
        </h2>
        <p className="text-sm" style={{ color: 'var(--t-muted)', fontFamily: 'var(--font-inter)' }}>
          {t(language, 'whichService')}
        </p>
      </motion.div>

      {/* ── Selected chips (multi-service add-more mode) ── */}
      {isAddMoreMode && selectedServices.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4"
        >
          <p
            className="text-xs uppercase tracking-wide font-semibold mb-2"
            style={{ fontFamily: 'var(--font-inter)', color: 'var(--t-muted)' }}
          >
            {t(language, 'selectedServices')}
          </p>
          <div className="flex flex-wrap gap-2">
            <AnimatePresence>
              {selectedServices.map((s) => (
                <ServiceChip
                  key={s.id}
                  service={s}
                  onRemove={() => removeService(s.id)}
                  primaryColor={theme.primaryColor}
                />
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
                className="mt-3 px-4 py-3 rounded-xl text-sm"
                style={{
                  background: 'rgba(239,68,68,0.1)',
                  border: '1px solid rgba(239,68,68,0.25)',
                  color: '#FCA5A5',
                  fontFamily: 'var(--font-inter)',
                }}
              >
                {t(language, 'noEmployeeForCombination')}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* ── Category pill strip (scrollable, click to jump) ── */}
      {categories.length > 1 && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
          className="mb-5 -mx-1"
        >
          <div className="flex gap-2 overflow-x-auto pb-1 px-1 modern-scrollbar-hide">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => scrollToCategory(cat.id)}
                className="flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all"
                style={{
                  fontFamily: 'var(--font-inter)',
                  backgroundColor: 'var(--s2)',
                  border: '1px solid var(--b2)',
                  color: 'var(--t-soft)',
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                  whiteSpace: 'nowrap',
                }}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* ── Service sections by category ── */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-5"
      >
        {categories.map((category) => {
          const services: Service[] = servicesByCategory[category.id] ?? [];
          if (services.length === 0) return null;

          return (
            <motion.div
              key={category.id}
              variants={itemVariants}
              ref={(el) => { categoryRefs.current[category.id] = el; }}
            >
              {/* Category header */}
              <p
                className="text-xs font-semibold mb-2 tracking-widest uppercase"
                style={{ color: theme.primaryColor, fontFamily: 'var(--font-inter)' }}
              >
                {category.name}
              </p>

              {/* Service list */}
              <div
                className="rounded-2xl overflow-hidden modern-glass"
                style={{
                  backgroundColor: 'var(--s2)',
                  border: '1px solid var(--b2)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                }}
              >
                {services.map((service, i) => (
                  <ServiceRow
                    key={service.id}
                    service={service}
                    isLast={i === services.length - 1}
                    isMultiMode={isAddMoreMode}
                    isSelected={isServiceSelected(service.id)}
                    onSelect={() => handleServiceClick(category, service)}
                  />
                ))}
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* ── Step-2 actions (multi-service add-more mode) ── */}
      {isAddMoreMode && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className="mt-8"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            {canAddMore && (
              <p
                className="text-sm"
                style={{ fontFamily: 'var(--font-inter)', color: 'var(--t-muted)' }}
              >
                {t(language, 'addAnotherService')} ({selectedServices.length}/3)
              </p>
            )}
            <div className="sm:ml-auto w-full sm:w-auto">
              <motion.button
                onClick={() => goToStep(3)}
                disabled={selectedServices.length === 0 || noEmployeeForCombination}
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl font-semibold text-white relative overflow-hidden"
                style={{
                  fontFamily: 'var(--font-inter)',
                  backgroundColor:
                    selectedServices.length === 0 || noEmployeeForCombination
                      ? 'var(--s3)'
                      : theme.primaryColor,
                  color:
                    selectedServices.length === 0 || noEmployeeForCombination
                      ? 'var(--t-disabled)'
                      : '#ffffff',
                  boxShadow:
                    selectedServices.length > 0 && !noEmployeeForCombination
                      ? `0 6px 24px ${theme.primaryColor}38`
                      : 'none',
                  cursor:
                    selectedServices.length === 0 || noEmployeeForCombination
                      ? 'not-allowed'
                      : 'pointer',
                }}
                whileHover={
                  selectedServices.length > 0 && !noEmployeeForCombination
                    ? { scale: 1.02 }
                    : {}
                }
                whileTap={
                  selectedServices.length > 0 && !noEmployeeForCombination
                    ? { scale: 0.97 }
                    : {}
                }
              >
                {t(language, 'next')} →
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
