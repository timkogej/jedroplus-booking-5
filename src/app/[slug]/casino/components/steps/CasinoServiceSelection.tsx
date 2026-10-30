'use client';

import { forwardRef, useRef, useCallback } from 'react';
import { servicePriceLabel } from '@/lib/text';
import { formatBookingPrice } from '@/lib/pricing';
import { motion, AnimatePresence } from 'framer-motion';
import { useBookingStore } from '@/store/bookingStore';
import type { Category, Service } from '@/types';
import { usePromotionsStore } from '@/store/promotionsStore';
import { PromotionBadge } from '@/components/shared/PromotionBadge';
import { stickyCtaStyle } from '@/lib/booking/stickyCta';
import { t } from '../../i18n';
import Photo, { anyPhoto } from '@/components/shared/Photo';
import RequestUnsureCard from '@/components/shared/request/RequestUnsureCard';
import {
  CREAM,
  CX_BG,
  ErrorNote,
  FAINT,
  FONT_BODY,
  FONT_HEAD,
  FONT_LABEL,
  MUTED,
  PointerGlow,
  SUITS,
  CheckMark,
  formatDuration,
  itemVariants,
  listVariants,
  mix,
  pointerLight,
} from '../ui';

// ── Selected service chip (step 2) ─────────────────────────────
// forwardRef: the chip list animates with AnimatePresence mode="popLayout", which needs the element.
const ServiceChip = forwardRef<HTMLDivElement, { service: Service; onRemove: () => void; label: string }>(function ServiceChip(
  { service, onRemove, label },
  ref
) {
  return (
    <motion.div
      ref={ref}
      layout
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.85 }}
      transition={{ type: 'spring', stiffness: 420, damping: 30 }}
      className="flex h-9 items-center gap-2 rounded-full pl-3.5 pr-1.5"
      style={{ background: mix('--cx-a', 22), boxShadow: `inset 0 0 0 1px ${mix('--cx-glow', 45)}` }}
    >
      <span className="max-w-[170px] truncate text-[13px] font-semibold" style={{ fontFamily: FONT_BODY, color: CREAM }}>
        {service.naziv}
      </span>
      <button
        onClick={onRemove}
        aria-label={`${label}: ${service.naziv}`}
        className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full"
        style={{ background: 'rgba(255,255,255,0.12)' }}
      >
        <svg width="8" height="8" viewBox="0 0 8 8" fill="none" aria-hidden="true">
          <path d="M1 1l6 6M7 1L1 7" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>
    </motion.div>
  );
});

function ServiceCard({
  service,
  suitIndex,
  isSelected,
  showCheck,
  onSelect,
  withThumb,
}: {
  service: Service;
  suitIndex: number;
  isSelected: boolean;
  showCheck: boolean;
  onSelect: () => void;
  /** Some service has a photo: every card gets the photo tile. */
  withThumb: boolean;
}) {
  const { serviceDiscounts } = usePromotionsStore();
  const theme = useBookingStore((s) => s.theme);
  const suit = SUITS[suitIndex % SUITS.length];
  const promo = serviceDiscounts[String(service.id)];

  return (
    <motion.button
      variants={itemVariants}
      onClick={onSelect}
      onPointerMove={pointerLight}
      whileTap={{ scale: 0.985 }}
      aria-pressed={isSelected}
      className={`cx-card is-hover group w-full overflow-hidden text-left ${isSelected ? 'is-on' : ''}`}
    >
      <PointerGlow />

      <div className="relative flex items-start gap-3.5 p-4">
        {withThumb ? (
          // Photo tile; the suit stays as a small badge in its corner.
          <span className="relative flex-shrink-0">
            <Photo
              src={service.slika_url}
              className="h-16 w-16 rounded-[12px]"
              style={{
                background: mix('--cx-glow', 10),
                boxShadow: isSelected ? `0 0 0 2px var(--cx-glow), 0 10px 22px -10px var(--cx-a)` : `inset 0 0 0 1px ${mix('--cx-glow', 22)}`,
                transition: 'box-shadow 0.3s',
              }}
              imgClassName="transition-transform duration-500 group-hover:scale-[1.07]"
              fallback={
                <span className="text-[28px] transition-transform duration-300 group-hover:-rotate-6" style={{ fontFamily: 'Georgia, serif', color: 'var(--cx-glow)' }} aria-hidden="true">
                  {suit}
                </span>
              }
            />
            {service.slika_url && (
              <span
                className="absolute -bottom-1.5 -right-1.5 flex h-6 w-6 items-center justify-center rounded-full text-[12px]"
                style={{
                  fontFamily: 'Georgia, serif',
                  color: '#fff',
                  background: 'var(--cx-grad)',
                  boxShadow: '0 0 0 2px #09090c, 0 4px 10px -4px var(--cx-a)',
                }}
                aria-hidden="true"
              >
                {suit}
              </span>
            )}
          </span>
        ) : (
          /* Suit corner, like on a playing card */
        <span
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[11px] text-[18px] transition-transform duration-300 group-hover:-rotate-6"
          style={{
            fontFamily: 'Georgia, serif',
            color: isSelected ? '#fff' : 'var(--cx-glow)',
            background: isSelected ? 'var(--cx-grad)' : mix('--cx-glow', 10),
            boxShadow: isSelected ? '0 6px 16px -6px var(--cx-a)' : `inset 0 0 0 1px ${mix('--cx-glow', 22)}`,
            transition: 'background 0.3s, color 0.3s',
          }}
          aria-hidden="true"
        >
          {suit}
        </span>

        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-[17px] font-bold leading-snug" style={{ fontFamily: FONT_HEAD, color: CREAM }}>
              {service.naziv}
            </h3>
            {promo ? (
              <PromotionBadge
                type={promo.type}
                naziv={promo.naziv}
                badgeLabel={promo.badgeLabel}
                originalCena={promo.originalCena}
                finalCena={promo.finalCena}
                size="sm"
                variantStyle="modern"
                accentColor={theme.primaryOnDark}
              />
            ) : (
              <span className="flex-shrink-0 text-[17px] font-bold" style={{ fontFamily: FONT_HEAD, color: 'var(--cx-glow)' }}>
                {servicePriceLabel(service.cena, formatBookingPrice) ?? 'Po dogovoru'}
              </span>
            )}
          </div>

          {service.opis && (
            <p className="mt-1 text-[14px] leading-[1.45]" style={{ fontFamily: FONT_BODY, color: MUTED }}>
              {service.opis}
            </p>
          )}

          <div className="mt-2.5 flex items-center justify-between gap-3">
            <span
              className="inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 text-[11px] font-medium uppercase"
              style={{ fontFamily: FONT_LABEL, letterSpacing: '0.12em', color: 'rgba(246,243,238,0.7)', background: 'rgba(255,255,255,0.06)' }}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 2" />
              </svg>
              {formatDuration(service.trajanjeMin)}
            </span>
            {showCheck ? (
              <CheckMark on={isSelected} size={24} />
            ) : (
              <svg width="8" height="13" viewBox="0 0 8 14" fill="none" className="transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden="true">
                <path d="M1 1l6 6-6 6" stroke={FAINT} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
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

  const scrollToCategory = useCallback((catId: string) => {
    const el = categoryRefs.current[catId];
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 16;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  }, []);

  const isAddMoreMode = currentStep === 2 && multipleServicesAllowed;

  const isServiceSelected = (serviceId: string) => selectedServices.some((s) => s.id === serviceId);
  const withThumbs = anyPhoto(Object.values(servicesByCategory ?? {}).flat());

  const handleServiceClick = (category: Category, service: Service) => {
    if (isAddMoreMode) {
      // In step 2 a tap toggles the service; the last one stays chosen.
      if (isServiceSelected(service.id)) {
        if (selectedServices.length > 1) removeService(service.id);
      } else {
        addService(service);
      }
    } else {
      selectCategoryAndService(category, service);
      usePromotionsStore.getState().computeActivePromotion(String(service.id));
    }
  };

  const canAddMore = multipleServicesAllowed && selectedServices.length < 3;
  const canContinue = selectedServices.length > 0 && !noEmployeeForCombination;

  if (!categories || categories.length === 0) {
    return (
      <div className="py-16 text-center">
        <span style={{ fontFamily: 'Georgia, serif', fontSize: '2rem', color: mix('--cx-glow', 30) }}>◆</span>
        <p className="mt-4 text-[15px]" style={{ fontFamily: FONT_BODY, color: MUTED }}>
          {t(language, 'noServices')}
        </p>
      </div>
    );
  }

  let globalServiceIndex = 0;

  return (
    <motion.div variants={listVariants} initial="hidden" animate="visible">
      <motion.p variants={itemVariants} className="mb-6 text-[16px] leading-6" style={{ fontFamily: FONT_BODY, color: MUTED }}>
        {isAddMoreMode ? `${t(language, 'addAnotherService')} (${selectedServices.length}/3)` : t(language, 'serviceIntro')}
      </motion.p>

      {/* ── Selected services (step 2) ── */}
      {isAddMoreMode && selectedServices.length > 0 && (
        <motion.div variants={itemVariants} className="mb-6">
          <p className="cx-label mb-2.5">{t(language, 'selectedServices')}</p>
          <div className="flex flex-wrap gap-2">
            <AnimatePresence mode="popLayout">
              {selectedServices.map((s) => (
                <ServiceChip key={s.id} service={s} label={t(language, 'removeService')} onRemove={() => removeService(s.id)} />
              ))}
            </AnimatePresence>
          </div>

          <AnimatePresence>
            {noEmployeeForCombination && (
              <div className="mt-3">
                <ErrorNote>{t(language, 'noEmployeeForCombination')}</ErrorNote>
              </div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Request mode: for clients who don't know which service they need */}
      <RequestUnsureCard design="casino" />

      {/* ── Category chips ── */}
      {categories.length > 1 && (
        <motion.div variants={itemVariants} className="-mx-4 mb-6">
          <div className="cx-scrollbar-hide flex gap-2 overflow-x-auto px-4 pb-1">
            {categories.map((cat, catIndex) => (
              <motion.button
                key={cat.id}
                onClick={() => scrollToCategory(cat.id)}
                whileTap={{ scale: 0.95 }}
                className="flex h-10 flex-shrink-0 items-center gap-2 whitespace-nowrap rounded-full px-4 text-[12px] font-medium uppercase transition-colors hover:text-white"
                style={{
                  fontFamily: FONT_LABEL,
                  letterSpacing: '0.12em',
                  color: 'rgba(246,243,238,0.72)',
                  background: 'rgba(255,255,255,0.05)',
                  boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.1)',
                }}
              >
                <span style={{ color: 'var(--cx-glow)', fontFamily: 'Georgia, serif' }}>{SUITS[catIndex % SUITS.length]}</span>
                {cat.name}
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}

      {/* ── Services by category ── */}
      <div className="space-y-8">
        {categories.map((category, catIndex) => {
          const services: Service[] = servicesByCategory[category.id] ?? [];
          if (services.length === 0) return null;

          return (
            <motion.section
              key={category.id}
              variants={itemVariants}
              ref={(el) => { categoryRefs.current[category.id] = el; }}
            >
              <div className="mb-3 flex items-center gap-3">
                <span style={{ fontFamily: 'Georgia, serif', fontSize: '1.05rem', color: 'var(--cx-glow)' }} aria-hidden="true">
                  {SUITS[catIndex % SUITS.length]}
                </span>
                <h3 className="text-[19px] font-bold" style={{ fontFamily: FONT_HEAD, color: CREAM }}>
                  {category.name}
                </h3>
                <div className="h-px flex-1" style={{ background: `linear-gradient(to right, ${mix('--cx-glow', 35)}, transparent)` }} />
              </div>

              <motion.div variants={listVariants} className="space-y-2.5">
                {services.map((service) => {
                  const idx = globalServiceIndex++;
                  return (
                    <ServiceCard
                      key={service.id}
                      service={service}
                      suitIndex={idx}
                      isSelected={isServiceSelected(service.id)}
                      showCheck={isAddMoreMode}
                      onSelect={() => handleServiceClick(category, service)}
                      withThumb={withThumbs}
                    />
                  );
                })}
              </motion.div>
            </motion.section>
          );
        })}
      </div>

      {/* ── Step 2: continue ── */}
      {isAddMoreMode && (
        <motion.div variants={itemVariants} className="booking-sticky-cta mt-8 flex flex-col items-center gap-2" style={stickyCtaStyle(CX_BG, 16)}>
          <button onClick={() => goToStep(3)} disabled={!canContinue} className="cx-btn w-full max-w-sm">
            {t(language, 'next')}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </button>
          {!canAddMore && (
            <p className="text-[12px]" style={{ fontFamily: FONT_BODY, color: FAINT }}>
              3/3
            </p>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}
