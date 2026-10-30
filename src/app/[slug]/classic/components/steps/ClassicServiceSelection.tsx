'use client';

import { useRef, useCallback, useEffect, useState } from 'react';
import { servicePriceLabel } from '@/lib/text';
import { formatBookingPrice } from '@/lib/pricing';
import { motion, AnimatePresence } from 'framer-motion';
import { useBookingStore } from '@/store/bookingStore';
import type { Category, Service } from '@/types';
import { usePromotionsStore } from '@/store/promotionsStore';
import { t } from '../../i18n';
import Photo, { anyPhoto } from '@/components/shared/Photo';
import RequestUnsureCard from '@/components/shared/request/RequestUnsureCard';
import { stickyCtaStyle } from '@/lib/booking/stickyCta';
import {
  CARD,
  CheckCircle,
  Chevron,
  FONT,
  INK,
  INK_2,
  INK_3,
  PageTitle,
  PrimaryButton,
  SPRING,
  formatDuration,
  itemVariants,
  listVariants,
  useClassicColors,
} from '../ui';

// ── Service row inside a grouped card ───────────────────────────────────────
function ServiceRow({
  service,
  isMultiMode,
  isSelected,
  onSelect,
  withThumb,
}: {
  service: Service;
  isMultiMode: boolean;
  isSelected: boolean;
  onSelect: () => void;
  /** Some service has a photo: every row gets the thumbnail slot. */
  withThumb: boolean;
}) {
  const { theme } = useBookingStore();
  const { serviceDiscounts } = usePromotionsStore();
  const price = Number(service.cena);
  const promo = serviceDiscounts[String(service.id)];

  return (
    <motion.button
      onClick={onSelect}
      aria-pressed={isMultiMode ? isSelected : undefined}
      whileTap={{ scale: 0.985, backgroundColor: 'rgba(0,0,0,0.03)' }}
      transition={SPRING}
      className="classic-row group flex w-full items-center gap-3.5 px-4 py-4 text-left sm:px-5"
      style={{
        ['--row-inset' as string]: `${(isMultiMode ? 54 : 16) + (withThumb ? 70 : 0)}px`,
        background: isSelected ? `${theme.primarySolid}0A` : 'transparent',
        transition: 'background 0.2s',
      }}
    >
      {isMultiMode && <CheckCircle on={isSelected} color={theme.primarySolid} />}

      {withThumb && (
        <Photo
          src={service.slika_url}
          className="h-14 w-14 flex-shrink-0 rounded-[12px]"
          style={{
            background: `${theme.primarySolid}12`,
            boxShadow: isSelected ? `0 0 0 2px #fff, 0 0 0 4px ${theme.primarySolid}` : 'inset 0 0 0 0.5px rgba(0,0,0,0.08)',
            transition: 'box-shadow 0.25s',
          }}
          imgClassName="transition-transform duration-500 group-hover:scale-[1.05]"
          fallback={
            <span className="text-[22px] font-semibold" style={{ fontFamily: FONT, color: theme.primaryOnLight }} aria-hidden="true">
              {service.naziv.trim().charAt(0).toUpperCase()}
            </span>
          }
        />
      )}

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="text-[16px] font-semibold leading-snug sm:text-[17px]" style={{ fontFamily: FONT, color: INK }}>
            {service.naziv}
          </h3>
          {promo?.badgeLabel && (
            <span
              className="flex-shrink-0 rounded-full px-2 py-[2px] text-[11px] font-bold"
              style={{ background: theme.primarySolid, color: '#fff', fontFamily: FONT }}
            >
              {promo.badgeLabel}
            </span>
          )}
        </div>
        {service.opis && (
          <p className="mt-0.5 line-clamp-2 text-[14px] leading-5" style={{ fontFamily: FONT, color: INK_2 }}>
            {service.opis}
          </p>
        )}
        <p className="mt-1.5 flex items-center gap-1 text-[13px]" style={{ fontFamily: FONT, color: INK_3 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
            <circle cx="12" cy="12" r="9.5" />
            <path d="M12 7v5l3 2" strokeLinecap="round" />
          </svg>
          {formatDuration(service.trajanjeMin)}
        </p>
      </div>

      <div className="flex flex-shrink-0 items-center gap-3">
        <div className="text-right">
          {promo ? (
            <>
              <span className="block text-[13px] line-through" style={{ fontFamily: FONT, color: INK_3 }}>
                {formatBookingPrice(promo.originalCena)}
              </span>
              <span className="block text-[17px] font-semibold tabular-nums" style={{ fontFamily: FONT, color: theme.primaryOnLight }}>
                {formatBookingPrice(promo.finalCena)}
              </span>
            </>
          ) : (
            <span className="block text-[17px] font-semibold tabular-nums" style={{ fontFamily: FONT, color: INK }}>
              {isNaN(price)
                ? String(service.cena)
                : `${servicePriceLabel(price, formatBookingPrice) ?? 'Po dogovoru'}`}
            </span>
          )}
        </div>
        {!isMultiMode && (
          <span className="transition-transform duration-200 group-hover:translate-x-0.5">
            <Chevron />
          </span>
        )}
      </div>
    </motion.button>
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
      layout
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.85 }}
      transition={SPRING}
      className="flex items-center gap-1.5 rounded-full py-1.5 pl-3.5 pr-1.5 text-[14px] font-semibold"
      style={{ background: '#FFFFFF', color: INK, fontFamily: FONT, boxShadow: '0 0 0 0.5px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.06)' }}
    >
      <span className="h-2 w-2 flex-shrink-0 rounded-full" style={{ background: primaryColor }} />
      <span className="max-w-[160px] truncate">{service.naziv}</span>
      <button
        onClick={onRemove}
        aria-label="✕"
        className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full"
        style={{ background: 'rgba(118,118,128,0.14)', color: INK_2 }}
      >
        <svg width="8" height="8" viewBox="0 0 8 8" fill="none" aria-hidden="true">
          <path d="M1 1l6 6M7 1L1 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
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

  const c = useClassicColors();

  const categoryRefs = useRef<Record<string, HTMLElement | null>>({});
  const pillScrollRef = useRef<HTMLDivElement>(null);
  const [activeCat, setActiveCat] = useState<string | null>(categories?.[0]?.id ?? null);

  const scrollToCategory = useCallback((catId: string) => {
    const el = categoryRefs.current[catId];
    if (el) {
      setActiveCat(catId);
      const top = el.getBoundingClientRect().top + window.scrollY - 150;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  }, []);

  // Highlight the category the client is looking at.
  useEffect(() => {
    if (!categories || categories.length < 2) return;
    const io = new IntersectionObserver(
      (entries) => {
        const seen = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        const id = seen[0]?.target.getAttribute('data-cat');
        if (id) setActiveCat(id);
      },
      { rootMargin: '-160px 0px -55% 0px' },
    );
    Object.values(categoryRefs.current).forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, [categories]);

  // Keep the active pill in view.
  useEffect(() => {
    const strip = pillScrollRef.current;
    const pill = strip?.querySelector<HTMLElement>(`[data-pill="${activeCat}"]`);
    if (strip && pill) {
      strip.scrollTo({ left: pill.offsetLeft - strip.offsetWidth / 2 + pill.offsetWidth / 2, behavior: 'smooth' });
    }
  }, [activeCat]);

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
  const withThumbs = anyPhoto(Object.values(servicesByCategory ?? {}).flat());

  const canAddMore =
    multipleServicesAllowed && selectedServices.length < 3;
  const canContinue = selectedServices.length > 0 && !noEmployeeForCombination;

  if (!categories || categories.length === 0) {
    return (
      <div className="py-20 text-center">
        <p style={{ fontFamily: FONT, fontSize: 15, color: c.text2 }}>{t(language, 'noServices')}</p>
      </div>
    );
  }

  return (
    <motion.div variants={listVariants} initial="hidden" animate="visible">
      <PageTitle title={t(language, 'chooseService')} subtitle={t(language, 'whichService')} />

      {/* ── Selected chips (multi mode) ── */}
      {isAddMoreMode && selectedServices.length > 0 && (
        <motion.div variants={itemVariants} className="mb-6">
          <p className="mb-2.5 px-1 text-[13px] font-semibold uppercase" style={{ fontFamily: FONT, color: c.text2, letterSpacing: '0.04em' }}>
            {t(language, 'selectedServices')} · {selectedServices.length}/3
          </p>
          <div className="flex flex-wrap gap-2">
            <AnimatePresence>
              {selectedServices.map((s) => (
                <ServiceChip
                  key={s.id}
                  service={s}
                  onRemove={() => removeService(s.id)}
                  primaryColor={theme.primarySolid}
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
                className="overflow-hidden"
              >
                <p
                  className="mt-3 rounded-[14px] px-4 py-3 text-[14px] leading-5"
                  style={{ background: '#FFF1F0', color: '#C4170C', fontFamily: FONT }}
                >
                  {t(language, 'noEmployeeForCombination')}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Request mode: for clients who don't know which service they need */}
      <RequestUnsureCard design="classic" />

      {/* ── Category pills: stay under the header while scrolling ── */}
      {categories.length > 1 && (
        <motion.div
          variants={itemVariants}
          className="sticky z-20 -mx-4 mb-5 px-4 py-2 sm:-mx-5 sm:px-5"
          style={{ top: 'var(--classic-header-h, 104px)' }}
        >
          <div
            ref={pillScrollRef}
            className="classic-scrollbar-hide flex gap-1 overflow-x-auto rounded-full p-1"
            style={{
              background: c.light ? 'rgba(255,255,255,0.72)' : 'rgba(255,255,255,0.16)',
              backdropFilter: 'saturate(180%) blur(20px)',
              WebkitBackdropFilter: 'saturate(180%) blur(20px)',
              boxShadow: c.light ? '0 0 0 0.5px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.06)' : 'none',
              width: 'fit-content',
              maxWidth: '100%',
            }}
          >
            {categories.map((cat) => {
              const on = activeCat === cat.id;
              return (
                <button
                  key={cat.id}
                  data-pill={cat.id}
                  onClick={() => scrollToCategory(cat.id)}
                  className="relative flex-shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-[14px] font-semibold"
                  style={{
                    fontFamily: FONT,
                    color: on ? '#FFFFFF' : c.light ? 'rgba(29,29,31,0.7)' : 'rgba(255,255,255,0.85)',
                    transition: 'color 0.2s',
                  }}
                >
                  {on && (
                    <motion.span
                      layoutId="classic-cat"
                      className="absolute inset-0 rounded-full"
                      style={{ background: theme.primarySolid }}
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
      <div className="space-y-7">
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
              <div className="mb-2 flex items-baseline justify-between px-1">
                <h3 className="text-[20px] font-bold" style={{ fontFamily: FONT, color: c.text, letterSpacing: '-0.02em' }}>
                  {category.name}
                </h3>
                <span className="text-[13px] font-medium tabular-nums" style={{ fontFamily: FONT, color: c.text3 }}>
                  {services.length}
                </span>
              </div>

              <div className="overflow-hidden" style={CARD}>
                {services.map((service) => (
                  <ServiceRow
                    key={service.id}
                    service={service}
                    isMultiMode={isAddMoreMode}
                    isSelected={isServiceSelected(service.id)}
                    onSelect={() => handleServiceClick(category, service)}
                    withThumb={withThumbs}
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
          style={stickyCtaStyle(theme.bgTo, 16)}
        >
          {canAddMore && (
            <p className="text-[14px]" style={{ fontFamily: FONT, color: c.text2 }}>
              {t(language, 'addAnotherService')} ({selectedServices.length}/3)
            </p>
          )}
          <PrimaryButton onClick={() => goToStep(3)} disabled={!canContinue} className="w-full sm:ml-auto sm:w-auto sm:min-w-[220px]">
            {t(language, 'next')}
          </PrimaryButton>
        </motion.div>
      )}
    </motion.div>
  );
}
