'use client';

import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { servicePriceLabel } from '@/lib/text';
import { formatBookingPrice } from '@/lib/pricing';
import { useBookingStore } from '@/store/bookingStore';
import { Category, Service } from '@/types';
import { usePromotionsStore } from '@/store/promotionsStore';
import { PromotionBadge } from '@/components/shared/PromotionBadge';
import { stickyCtaStyle } from '@/lib/booking/stickyCta';
import { t } from '../../i18n';
import RequestUnsureCard from '@/components/shared/request/RequestUnsureCard';

const EASE = [0.22, 1, 0.36, 1] as const;

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h} h ${m} min` : `${h} h`;
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
};

function ServiceRow({
  service,
  category,
  isFirst,
  isMultiMode,
}: {
  service: Service;
  category: Category;
  isFirst: boolean;
  isMultiMode: boolean;
}) {
  const { theme, selectedService, selectedServices, selectCategoryAndService, addService, multipleServicesAllowed, language } =
    useBookingStore();
  const { serviceDiscounts } = usePromotionsStore();
  const isSelected = isMultiMode
    ? selectedServices.some((s) => s.id === service.id)
    : selectedService?.id === service.id;
  const promo = serviceDiscounts[String(service.id)];

  const onClick = () => {
    if (isMultiMode) {
      addService(service);
      return;
    }
    // With several services allowed the store opens step 2 to add more;
    // otherwise it goes straight on.
    selectCategoryAndService(category, service, !multipleServicesAllowed);
    usePromotionsStore.getState().computeActivePromotion(String(service.id));
  };

  return (
    <motion.button
      onClick={onClick}
      aria-pressed={isMultiMode ? isSelected : undefined}
      whileTap={{ scale: 0.995 }}
      className="group relative w-full px-5 py-[18px] text-left transition-colors duration-300 hover:bg-[#FCFBF9]"
      style={{
        borderTop: isFirst ? 'none' : '1px solid #F3F4F6',
        backgroundColor: isSelected ? `${theme.primaryColor}0A` : undefined,
      }}
    >
      {/* thin accent line on the left: grows on hover, stays when selected */}
      <span
        aria-hidden="true"
        className={`absolute bottom-3 left-0 top-3 w-[2px] origin-center rounded-full transition-transform duration-500 ${isSelected ? 'scale-y-100' : 'scale-y-0 group-hover:scale-y-100'}`}
        style={{ background: theme.primarySolid, transitionTimingFunction: 'cubic-bezier(0.22,1,0.36,1)' }}
      />

      <div className="flex items-start justify-between gap-4">
        {isMultiMode && (
          <span
            className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border transition-colors duration-300"
            style={{ borderColor: isSelected ? theme.primarySolid : '#D1D5DB', background: isSelected ? theme.primarySolid : 'transparent' }}
          >
            <AnimatePresence>
              {isSelected && (
                <motion.svg
                  width="10"
                  height="8"
                  viewBox="0 0 12 10"
                  fill="none"
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.6 }}
                >
                  <motion.path d="M1 5L4.5 8.5L11 1" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.3 }} />
                </motion.svg>
              )}
            </AnimatePresence>
          </span>
        )}

        <div className="min-w-0 flex-1">
          <h3
            className="font-medium leading-snug transition-colors duration-300"
            style={{ fontFamily: 'var(--font-inter)', fontSize: '1rem', color: isSelected ? theme.primaryOnLight : '#1F2937' }}
          >
            {service.naziv}
          </h3>
          {service.opis && (
            <p className="mt-1 line-clamp-2" style={{ fontFamily: 'var(--font-inter)', fontSize: '0.84rem', color: '#6B7280', lineHeight: 1.55 }}>
              {service.opis}
            </p>
          )}
        </div>

        <div className="flex flex-shrink-0 items-start gap-3 text-right">
          <div>
            {promo ? (
              <PromotionBadge
                type={promo.type}
                naziv={promo.naziv}
                badgeLabel={promo.badgeLabel}
                originalCena={promo.originalCena}
                finalCena={promo.finalCena}
                size="sm"
                variantStyle="elegant"
                accentColor={theme.primarySolid}
              />
            ) : (
              <p style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.15rem', color: '#111111' }}>
                {servicePriceLabel(service.cena, formatBookingPrice) ?? t(language, 'priceOnRequest')}
              </p>
            )}
            <p className="mt-0.5 flex items-center justify-end gap-1" style={{ fontFamily: 'var(--font-inter)', fontSize: '0.75rem', color: '#6B7280' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              {formatDuration(service.trajanjeMin)}
            </p>
          </div>
          {!isMultiMode && (
            <span
              aria-hidden="true"
              className="mt-1.5 -translate-x-1 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100"
              style={{ color: theme.primarySolid }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </span>
          )}
        </div>
      </div>
    </motion.button>
  );
}

export default function ElegantServiceSelection() {
  const {
    theme,
    categories,
    servicesByCategory,
    language,
    currentStep,
    multipleServicesAllowed,
    selectedServices,
    removeService,
    noEmployeeForCombination,
    goToStep,
  } = useBookingStore();

  // Step 2: the client picked a service and may add up to two more.
  const isMultiMode = currentStep === 2 && multipleServicesAllowed;
  const canContinue = selectedServices.length > 0 && !noEmployeeForCombination;

  if (!categories || categories.length === 0) {
    return (
      <div className="py-20 text-center">
        <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.9rem', color: '#6B7280' }}>{t(language, 'noServices')}</p>
      </div>
    );
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      <motion.div variants={itemVariants} className="mb-7">
        <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: 'clamp(2rem, 5vw, 2.4rem)', fontWeight: 400, color: '#111111', lineHeight: 1.15 }}>
          {t(language, 'chooseServiceA')}{' '}
          <span className="italic" style={{ color: theme.primaryOnLight }}>
            {t(language, 'chooseServiceB')}
          </span>
        </h2>
        <p className="mt-2" style={{ fontFamily: 'var(--font-inter)', fontSize: '0.95rem', color: '#6B7280' }}>
          {t(language, 'serviceQuestion')}
        </p>
        <div className="elegant-rule mt-5 h-px w-16" style={{ background: theme.primarySolid, transformOrigin: 'left' }} />
      </motion.div>

      {/* Chosen services (several allowed) */}
      {isMultiMode && selectedServices.length > 0 && (
        <motion.div variants={itemVariants} className="mb-7">
          <p className="mb-2.5" style={{ fontFamily: 'var(--font-inter)', fontSize: '0.72rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6B7280', fontWeight: 600 }}>
            {t(language, 'selectedServices')} · {selectedServices.length}/3
          </p>
          <div className="flex flex-wrap gap-2">
            <AnimatePresence>
              {selectedServices.map((s) => (
                <motion.span
                  key={s.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="flex items-center gap-2 rounded-full border py-1.5 pl-3.5 pr-1.5 text-sm"
                  style={{ borderColor: `${theme.primarySolid}55`, background: `${theme.primaryColor}0A`, color: '#1F2937', fontFamily: 'var(--font-inter)' }}
                >
                  {s.naziv}
                  <button
                    onClick={() => removeService(s.id)}
                    aria-label={`${t(language, 'removeService')} ${s.naziv}`}
                    className="flex h-6 w-6 items-center justify-center rounded-full transition-colors hover:bg-black/5"
                    style={{ color: '#6B7280' }}
                  >
                    <svg width="8" height="8" viewBox="0 0 8 8" fill="none" aria-hidden="true">
                      <path d="M1 1l6 6M7 1L1 7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                    </svg>
                  </button>
                </motion.span>
              ))}
            </AnimatePresence>
          </div>
          <AnimatePresence>
            {noEmployeeForCombination && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 overflow-hidden rounded-lg border px-4 py-3 text-sm"
                style={{ borderColor: '#FECACA', background: '#FEF2F2', color: '#B91C1C', fontFamily: 'var(--font-inter)' }}
              >
                {t(language, 'noEmployeeForCombination')}
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Request mode: for clients who don't know which service they need */}
      <RequestUnsureCard design="elegant" />

      <div className="space-y-7">
        {categories.map((category) => {
          const services: Service[] = servicesByCategory[category.id] ?? [];
          if (services.length === 0) return null;

          return (
            <motion.div key={category.id} variants={itemVariants}>
              <div className="mb-2.5 flex items-center gap-3">
                <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.72rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: theme.primaryOnLight, fontWeight: 600 }}>
                  {category.name}
                </p>
                <span className="h-px flex-1" style={{ background: `linear-gradient(to right, ${theme.primaryColor}40, transparent)` }} />
              </div>

              <div className="overflow-hidden rounded-2xl border bg-white" style={{ borderColor: '#EEECE8', boxShadow: '0 1px 2px rgba(0,0,0,0.03), 0 12px 32px -20px rgba(60,40,10,0.15)' }}>
                {services.map((service, i) => (
                  <ServiceRow key={service.id} service={service} category={category} isFirst={i === 0} isMultiMode={isMultiMode} />
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>

      {isMultiMode && (
        <motion.div variants={itemVariants} className="booking-sticky-cta mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-between" style={stickyCtaStyle('#FFFFFF', 24)}>
          {selectedServices.length < 3 && (
            <p className="text-sm" style={{ color: '#6B7280', fontFamily: 'var(--font-inter)' }}>
              {t(language, 'addAnotherService')} ({selectedServices.length}/3)
            </p>
          )}
          <motion.button
            onClick={() => goToStep(3)}
            disabled={!canContinue}
            whileHover={canContinue ? { y: -1 } : undefined}
            whileTap={canContinue ? { scale: 0.98 } : undefined}
            className="relative w-full overflow-hidden rounded-xl px-10 py-4 text-sm font-medium tracking-wide text-white sm:ml-auto sm:w-auto"
            style={{
              fontFamily: 'var(--font-inter)',
              background: canContinue ? theme.primarySolid : '#D1D5DB',
              boxShadow: canContinue ? `0 10px 24px -10px ${theme.primarySolid}` : 'none',
              cursor: canContinue ? 'pointer' : 'not-allowed',
            }}
          >
            {canContinue && <span className="elegant-sheen" />}
            <span className="relative">{t(language, 'continue')} →</span>
          </motion.button>
        </motion.div>
      )}
    </motion.div>
  );
}
