'use client';

import { useRef, useCallback } from 'react';
import { servicePriceLabel } from '@/lib/text';
import { formatBookingPrice } from '@/lib/pricing';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { useBookingStore } from '@/store/bookingStore';
import type { Category, Service } from '@/types';
import { usePromotionsStore } from '@/store/promotionsStore';
import { getContrastMode } from '../ClassicLayout';
import { t } from '../../i18n';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.045 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.26, ease: 'easeOut' as const },
  },
};

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

// ── Promotion ribbon ─────────────────────────────────────────────────────────
function PromoRibbon({
  label,
  color,
}: {
  label: string;
  color: string;
}) {
  return (
    <div className="classic-promo-ribbon">
      <span style={{ backgroundColor: color }}>{label}</span>
    </div>
  );
}

// ── Service card ─────────────────────────────────────────────────────────────
function ServiceCard({
  service,
  isMultiMode,
  isSelected,
  onSelect,
}: {
  service: Service;
  isMultiMode: boolean;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const { theme } = useBookingStore();
  const { serviceDiscounts } = usePromotionsStore();
  const price = Number(service.cena);
  const promo = serviceDiscounts[String(service.id)];

  return (
    <motion.div variants={itemVariants} className="relative">
      {/* Promo ribbon */}
      {promo?.badgeLabel && (
        <PromoRibbon label={promo.badgeLabel} color={theme.primaryColor} />
      )}

      <motion.button
        onClick={onSelect}
        className="w-full p-5 rounded-2xl text-left relative overflow-hidden"
        style={{
          background: 'rgba(255,255,255,0.97)',
          border: isSelected
            ? `2px solid ${theme.primarySolid ?? theme.primaryColor}`
            : '2px solid rgba(0,0,0,0.04)',
          boxShadow: isSelected
            ? `0 6px 24px ${theme.primaryColor}28`
            : '0 2px 10px rgba(0,0,0,0.05)',
          transition: 'border-color 0.15s, box-shadow 0.15s',
        }}
        whileHover={{
          scale: 1.008,
          boxShadow: `0 5px 20px ${theme.primaryColor}1A`,
        }}
        whileTap={{ scale: 0.992 }}
      >
        <div className="flex items-start gap-3">
          {/* Multi-select indicator */}
          {isMultiMode && (
            <div
              className="mt-0.5 w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 transition-all"
              style={{
                background: isSelected ? theme.primaryColor : 'transparent',
                border: `2px solid ${isSelected ? theme.primaryColor : '#D1D5DB'}`,
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
              className="font-semibold text-gray-900 mb-0.5"
              style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '0.95rem' }}
            >
              {service.naziv}
            </h3>
            {service.opis && (
              <p
                className="text-sm text-gray-400 mb-2 line-clamp-2"
                style={{ fontFamily: 'var(--font-nunito-sans)' }}
              >
                {service.opis}
              </p>
            )}
            <p
              className="text-xs text-gray-400 flex items-center gap-1"
              style={{ fontFamily: 'var(--font-nunito-sans)' }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" strokeLinecap="round" />
              </svg>
              {formatDuration(service.trajanjeMin)}
            </p>
          </div>

          {/* Price */}
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            {promo ? (
              <>
                <span
                  className="text-xs line-through text-gray-300"
                  style={{ fontFamily: 'var(--font-nunito-sans)' }}
                >
                  {formatBookingPrice(promo.originalCena)}
                </span>
                <span
                  className="text-lg font-bold"
                  style={{ fontFamily: 'var(--font-nunito)', color: theme.primaryOnLight ?? theme.primaryColor }}
                >
                  {formatBookingPrice(promo.finalCena)}
                </span>
              </>
            ) : (
              <span
                className="text-lg font-bold"
                style={{ fontFamily: 'var(--font-nunito)', color: theme.primaryOnLight ?? theme.primaryColor }}
              >
                {isNaN(price)
                  ? String(service.cena)
                  : `${servicePriceLabel(price, formatBookingPrice) ?? 'Po dogovoru'}`}
              </span>
            )}

            {!isMultiMode && (
              <span style={{ color: '#D1D5DB', fontSize: '1rem' }}>›</span>
            )}
          </div>
        </div>
      </motion.button>
    </motion.div>
  );
}

// ── Selected service chip ─────────────────────────────────────────────────────
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
      className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium"
      style={{
        background: `${primaryColor}14`,
        border: `1.5px solid ${primaryColor}30`,
        color: primaryColor,
        fontFamily: 'var(--font-nunito-sans)',
      }}
    >
      <span className="truncate max-w-[140px]">{service.naziv}</span>
      <button
        onClick={onRemove}
        className="flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center"
        style={{ background: `${primaryColor}28` }}
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

// ── Main component ────────────────────────────────────────────────────────────
export default function ClassicServiceSelection() {
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

  const contrastMode = getContrastMode(theme.bgFrom, theme.bgTo);
  const textPrimary =
    contrastMode === 'light' ? 'rgba(255,255,255,0.95)' : 'rgba(0,0,0,0.9)';
  const textSecondary =
    contrastMode === 'light' ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.55)';

  const categoryRefs = useRef<Record<string, HTMLElement | null>>({});
  const pillScrollRef = useRef<HTMLDivElement>(null);

  const scrollToCategory = useCallback((catId: string) => {
    const el = categoryRefs.current[catId];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  // Step 2 = multi-service add-more mode
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

  const canAddMore =
    multipleServicesAllowed && selectedServices.length < 3;

  if (!categories || categories.length === 0) {
    return (
      <div className="text-center py-20">
        <p
          style={{
            fontFamily: 'var(--font-nunito-sans)',
            fontSize: '0.9rem',
            color: textSecondary,
          }}
        >
          {t(language, 'noServices')}
        </p>
      </div>
    );
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      {/* ── Page title ── */}
      <motion.div variants={itemVariants} className="mb-5">
        <h2
          className="text-3xl font-bold mb-1.5"
          style={{ fontFamily: 'var(--font-nunito)', color: textPrimary }}
        >
          {t(language, 'chooseService')}
        </h2>
        <p style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '0.9rem', color: textSecondary }}>
          {t(language, 'whichService')}
        </p>
      </motion.div>

      {/* ── Selected chips (multi mode) ── */}
      {isAddMoreMode && selectedServices.length > 0 && (
        <motion.div variants={itemVariants} className="mb-4">
          <p
            className="text-xs uppercase tracking-wide font-semibold mb-2"
            style={{ fontFamily: 'var(--font-nunito-sans)', color: textSecondary }}
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
                  background: 'rgba(254,242,242,0.95)',
                  border: '1px solid #FECACA',
                  color: '#DC2626',
                  fontFamily: 'var(--font-nunito-sans)',
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
            className="flex gap-2 overflow-x-auto pb-1 px-1 classic-scrollbar-hide"
          >
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => scrollToCategory(cat.id)}
                className="flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all"
                style={{
                  fontFamily: 'var(--font-nunito-sans)',
                  background: contrastMode === 'light'
                    ? 'rgba(255,255,255,0.18)'
                    : 'rgba(255,255,255,0.88)',
                  border: `1.5px solid ${contrastMode === 'light' ? 'rgba(255,255,255,0.28)' : 'rgba(0,0,0,0.06)'}`,
                  color: contrastMode === 'light' ? 'rgba(255,255,255,0.88)' : '#374151',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
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
      <div className="space-y-7">
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
              <div className="flex items-center gap-3 mb-3">
                <h3
                  className="font-bold text-sm tracking-wide uppercase"
                  style={{
                    fontFamily: 'var(--font-nunito)',
                    color: textPrimary,
                    letterSpacing: '0.07em',
                  }}
                >
                  {category.name}
                </h3>
                <div
                  className="flex-1 h-px"
                  style={{
                    background:
                      contrastMode === 'light'
                        ? 'rgba(255,255,255,0.15)'
                        : 'rgba(0,0,0,0.08)',
                  }}
                />
                <span
                  className="text-xs"
                  style={{
                    fontFamily: 'var(--font-nunito-sans)',
                    color: contrastMode === 'light'
                      ? 'rgba(255,255,255,0.38)'
                      : 'rgba(0,0,0,0.28)',
                  }}
                >
                  {services.length}
                </span>
              </div>

              <div className="space-y-2.5">
                {services.map((service) => (
                  <ServiceCard
                    key={service.id}
                    service={service}
                    isMultiMode={isAddMoreMode}
                    isSelected={isServiceSelected(service.id)}
                    onSelect={() => handleServiceClick(category, service)}
                  />
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ── Step-2 actions (multi-service add-more mode) ── */}
      {isAddMoreMode && (
        <motion.div variants={itemVariants} className="mt-8">
          <div className="flex flex-col sm:flex-row gap-3">
            {canAddMore && (
              <p
                className="text-sm text-center sm:text-left"
                style={{ fontFamily: 'var(--font-nunito-sans)', color: textSecondary }}
              >
                {t(language, 'addAnotherService')} ({selectedServices.length}/3)
              </p>
            )}
            <div className="sm:ml-auto">
              <motion.button
                onClick={() => goToStep(3)}
                disabled={selectedServices.length === 0 || noEmployeeForCombination}
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl font-bold text-white"
                style={{
                  fontFamily: 'var(--font-nunito)',
                  background:
                    selectedServices.length === 0 || noEmployeeForCombination
                      ? 'rgba(0,0,0,0.15)'
                      : theme.primaryColor,
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
                    ? { scale: 1.03 }
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
    </motion.div>
  );
}
