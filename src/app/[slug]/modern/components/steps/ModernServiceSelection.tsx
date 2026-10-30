'use client';

import { useRef, useCallback, useEffect, useState } from 'react';
import { servicePriceLabel } from '@/lib/text';
import { formatBookingPrice } from '@/lib/pricing';
import { motion, AnimatePresence } from 'framer-motion';
import { useBookingStore } from '@/store/bookingStore';
import { Category, Service } from '@/types';
import { usePromotionsStore } from '@/store/promotionsStore';
import { PromotionBadge } from '@/components/shared/PromotionBadge';
import { t } from '../../i18n';
import RequestUnsureCard from '@/components/shared/request/RequestUnsureCard';
import { stickyCtaStyle } from '@/lib/booking/stickyCta';
import ModernButton from '../ModernButton';
import { MODERN_BG, SPRING } from '../brand';
import {
  CheckDot,
  FONT,
  GLASS,
  PointerGlow,
  Title,
  formatDuration,
  itemVariants,
  listVariants,
  pointerLight,
} from '../ui';

// ── Selected service chip (multi-service mode) ────────────────────────────────
function ServiceChip({ service, onRemove }: { service: Service; onRemove: () => void }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.85 }}
      transition={SPRING}
      className="flex items-center gap-2 rounded-full py-1.5 pl-3.5 pr-1.5 text-[14px] font-semibold"
      style={{
        background: 'color-mix(in srgb, var(--brand-a) 22%, rgba(255,255,255,0.05))',
        boxShadow: 'inset 0 0 0 1px color-mix(in srgb, var(--brand-glow) 35%, transparent)',
        color: 'var(--t-primary)',
        fontFamily: FONT,
      }}
    >
      <span className="max-w-[160px] truncate">{service.naziv}</span>
      <button
        onClick={onRemove}
        className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full"
        style={{ background: 'rgba(255,255,255,0.12)' }}
        aria-label={`✕ ${service.naziv}`}
      >
        <svg width="8" height="8" viewBox="0 0 8 8" fill="none" aria-hidden="true">
          <path d="M1 1l6 6M7 1L1 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </button>
    </motion.div>
  );
}

// ── Service row ───────────────────────────────────────────────────────────────
function ServiceRow({
  service,
  isFirst,
  isMultiMode,
  isSelected,
  onSelect,
}: {
  service: Service;
  isFirst: boolean;
  isMultiMode: boolean;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const { theme } = useBookingStore();
  const { serviceDiscounts } = usePromotionsStore();
  const promo = serviceDiscounts[String(service.id)];

  return (
    <motion.button
      onClick={onSelect}
      onPointerMove={pointerLight}
      aria-pressed={isMultiMode ? isSelected : undefined}
      className="group relative flex w-full items-center gap-4 px-5 py-[18px] text-left"
      style={{
        borderTop: isFirst ? 'none' : '1px solid rgba(255,255,255,0.06)',
        background: isSelected ? 'color-mix(in srgb, var(--brand-a) 16%, transparent)' : 'transparent',
        transition: 'background 0.25s',
      }}
      whileTap={{ scale: 0.99 }}
    >
      <PointerGlow />
      {isSelected && (
        <motion.span
          layoutId={isMultiMode ? undefined : 'modern-svc-bar'}
          className="absolute bottom-3 left-0 top-3 w-[3px] rounded-r-full"
          style={{ background: 'var(--brand-grad)', boxShadow: '0 0 12px var(--brand-glow)' }}
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
        />
      )}

      {isMultiMode && <CheckDot on={isSelected} />}

      <div className="relative min-w-0 flex-1">
        <h3 className="text-[16px] font-bold leading-snug sm:text-[17px]" style={{ fontFamily: FONT, color: 'var(--t-primary)', letterSpacing: '-0.015em' }}>
          {service.naziv}
        </h3>
        {service.opis && (
          <p className="mt-0.5 line-clamp-2 text-[14px] leading-5" style={{ color: 'var(--t-muted)', fontFamily: FONT }}>
            {service.opis}
          </p>
        )}
        <p className="mt-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-[3px] text-[12px] font-semibold" style={{ color: 'var(--t-soft)', background: 'rgba(255,255,255,0.06)', fontFamily: FONT }}>
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
            <circle cx="12" cy="12" r="9.5" />
            <path d="M12 7v5l3 2" strokeLinecap="round" />
          </svg>
          {formatDuration(service.trajanjeMin)}
        </p>
      </div>

      <div className="relative flex flex-shrink-0 items-center gap-3 text-right">
        {promo ? (
          <PromotionBadge
            type={promo.type}
            naziv={promo.naziv}
            badgeLabel={promo.badgeLabel}
            originalCena={promo.originalCena}
            finalCena={promo.finalCena}
            size="sm"
            variantStyle="modern"
            accentColor={theme.primarySolid}
          />
        ) : (
          <p className="text-[17px] font-bold tabular-nums" style={{ fontFamily: FONT, color: 'var(--t-primary)', letterSpacing: '-0.02em' }}>
            {servicePriceLabel(service.cena, formatBookingPrice) ?? 'Po dogovoru'}
          </p>
        )}
        {!isMultiMode && (
          <span
            className="flex h-8 w-8 items-center justify-center rounded-full transition-transform duration-300 group-hover:translate-x-0.5"
            style={{ background: 'rgba(255,255,255,0.07)', color: 'var(--t-soft)' }}
          >
            <svg width="7" height="12" viewBox="0 0 8 14" fill="none" aria-hidden="true">
              <path d="M1 1l6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        )}
      </div>
    </motion.button>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ModernServiceSelection() {
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
  const stripRef = useRef<HTMLDivElement>(null);
  const [activeCat, setActiveCat] = useState<string | null>(categories?.[0]?.id ?? null);

  const scrollToCategory = useCallback((catId: string) => {
    const el = categoryRefs.current[catId];
    if (el) {
      setActiveCat(catId);
      window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 170, behavior: 'smooth' });
    }
  }, []);

  // Highlight the category in view.
  useEffect(() => {
    if (!categories || categories.length < 2) return;
    const io = new IntersectionObserver(
      (entries) => {
        const seen = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        const id = seen[0]?.target.getAttribute('data-cat');
        if (id) setActiveCat(id);
      },
      { rootMargin: '-170px 0px -55% 0px' },
    );
    Object.values(categoryRefs.current).forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, [categories]);

  useEffect(() => {
    const strip = stripRef.current;
    const pill = strip?.querySelector<HTMLElement>(`[data-pill="${activeCat}"]`);
    if (strip && pill) strip.scrollTo({ left: pill.offsetLeft - strip.offsetWidth / 2 + pill.offsetWidth / 2, behavior: 'smooth' });
  }, [activeCat]);

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

  const isServiceSelected = (serviceId: string) => selectedServices.some((s) => s.id === serviceId);
  const canAddMore = multipleServicesAllowed && selectedServices.length < 3;
  const canContinue = selectedServices.length > 0 && !noEmployeeForCombination;

  if (!categories || categories.length === 0) {
    return (
      <div className="py-20 text-center">
        <p style={{ color: 'var(--t-muted)', fontFamily: FONT, fontSize: 15 }}>{t(language, 'noServices')}</p>
      </div>
    );
  }

  return (
    <motion.div variants={listVariants} initial="hidden" animate="visible">
      <Title title={t(language, 'chooseService')} subtitle={t(language, 'whichService')} />

      {/* ── Selected chips (multi-service add-more mode) ── */}
      {isAddMoreMode && selectedServices.length > 0 && (
        <motion.div variants={itemVariants} className="mb-6">
          <p className="mb-2.5 px-1 text-[12px] font-bold uppercase" style={{ fontFamily: FONT, color: 'var(--t-faint)', letterSpacing: '0.12em' }}>
            {t(language, 'selectedServices')} · {selectedServices.length}/3
          </p>
          <div className="flex flex-wrap gap-2">
            <AnimatePresence>
              {selectedServices.map((s) => (
                <ServiceChip key={s.id} service={s} onRemove={() => removeService(s.id)} />
              ))}
            </AnimatePresence>
          </div>

          <AnimatePresence>
            {noEmployeeForCombination && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <p
                  className="mt-3 rounded-[16px] px-4 py-3 text-[14px] leading-5"
                  style={{ background: 'rgba(255,69,58,0.12)', boxShadow: 'inset 0 0 0 1px rgba(255,69,58,0.3)', color: '#FFB4AE', fontFamily: FONT }}
                >
                  {t(language, 'noEmployeeForCombination')}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Request mode: for clients who don't know which service they need */}
      <RequestUnsureCard design="modern" />

      {/* ── Category pills: stay under the header ── */}
      {categories.length > 1 && (
        <motion.div variants={itemVariants} className="sticky top-[104px] z-20 -mx-4 mb-6 px-4 py-2 sm:-mx-6 sm:px-6">
          <div
            ref={stripRef}
            className="modern-scrollbar-hide flex gap-1 overflow-x-auto rounded-full p-1"
            style={{
              width: 'fit-content',
              maxWidth: '100%',
              background: 'rgba(20,20,26,0.7)',
              boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.08), 0 10px 30px -10px rgba(0,0,0,0.6)',
              backdropFilter: 'blur(18px)',
              WebkitBackdropFilter: 'blur(18px)',
            }}
          >
            {categories.map((cat) => {
              const on = activeCat === cat.id;
              return (
                <button
                  key={cat.id}
                  data-pill={cat.id}
                  onClick={() => scrollToCategory(cat.id)}
                  className="relative flex-shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-[14px] font-bold"
                  style={{ fontFamily: FONT, color: on ? '#FFFFFF' : 'var(--t-muted)', transition: 'color 0.2s' }}
                >
                  {on && (
                    <motion.span
                      layoutId="modern-cat"
                      className="absolute inset-0 rounded-full"
                      style={{ background: 'var(--brand-grad)', boxShadow: '0 6px 18px -6px var(--brand-a)' }}
                      transition={SPRING}
                    />
                  )}
                  <span className="relative">{cat.name}</span>
                </button>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* ── Service sections by category ── */}
      <div className="space-y-8">
        {categories.map((category) => {
          const services: Service[] = servicesByCategory[category.id] ?? [];
          if (services.length === 0) return null;

          return (
            <motion.section
              key={category.id}
              variants={itemVariants}
              data-cat={category.id}
              ref={(el) => { categoryRefs.current[category.id] = el; }}
            >
              <div className="mb-3 flex items-baseline justify-between px-1">
                <h3 className="text-[22px] font-extrabold" style={{ color: 'var(--t-primary)', fontFamily: FONT, letterSpacing: '-0.03em' }}>
                  {category.name}
                </h3>
                <span className="text-[13px] font-semibold tabular-nums" style={{ color: 'var(--t-faint)', fontFamily: FONT }}>
                  {services.length}
                </span>
              </div>

              <div className="overflow-hidden" style={GLASS}>
                {services.map((service, i) => (
                  <ServiceRow
                    key={service.id}
                    service={service}
                    isFirst={i === 0}
                    isMultiMode={isAddMoreMode}
                    isSelected={isServiceSelected(service.id)}
                    onSelect={() => handleServiceClick(category, service)}
                  />
                ))}
              </div>
            </motion.section>
          );
        })}
      </div>

      {/* ── Step-2 actions (multi-service add-more mode) ── */}
      {isAddMoreMode && (
        <motion.div
          variants={itemVariants}
          className="booking-sticky-cta mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-between"
          style={stickyCtaStyle(MODERN_BG, 16)}
        >
          {canAddMore && (
            <p className="text-[14px]" style={{ fontFamily: FONT, color: 'var(--t-muted)' }}>
              {t(language, 'addAnotherService')} ({selectedServices.length}/3)
            </p>
          )}
          <div className="w-full sm:ml-auto sm:w-auto sm:min-w-[220px]">
            <ModernButton onClick={() => goToStep(3)} disabled={!canContinue}>
              {t(language, 'next')}
              <span aria-hidden="true">→</span>
            </ModernButton>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
