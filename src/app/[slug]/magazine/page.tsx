'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { useBookingStore } from '@/store/bookingStore';
import { fetchInitData } from '@/lib/api';
import { fetchActiveDiscounts, calculateDiscount } from '@/lib/promotionsApi';
import type { ServicePromotion } from '@/lib/promotionsApi';
import { usePromotionsStore } from '@/store/promotionsStore';
import MagazineLayout from './components/MagazineLayout';
import { t } from './i18n';

export default function MagazinePage() {
  const params = useParams();
  const slug = params.slug as string;

  const {
    theme,
    language,
    isLoading,
    setInitData,
    setLoading,
  } = useBookingStore();

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadInitData() {
      if (!slug) {
        setError(t(language, 'noSlug'));
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const data = await fetchInitData(slug);

        // setInitData handles all fields: company, theme, employees, services,
        // categories, resources, maxDniRezervacija, language, stripe, etc.
        setInitData(data);

        // Load promotions (non-critical)
        const companyId = data.company?.idPodjetja;
        const serviceIds = (data.services ?? []).map((s) => String(s.id));

        if (companyId && serviceIds.length) {
          try {
            const discounts = await fetchActiveDiscounts(companyId, serviceIds);
            const enriched: Record<string, ServicePromotion> = {};
            for (const [sId, promo] of Object.entries(discounts)) {
              const service = (data.services ?? []).find((s) => String(s.id) === sId);
              if (service) {
                const { finalCena, popustZnesek } = calculateDiscount(
                  Number(service.cena),
                  promo.tipPopusta,
                  promo.vrednost
                );
                enriched[sId] = { ...promo, originalCena: Number(service.cena), finalCena, popustZnesek };
              }
            }
            usePromotionsStore.getState().setServiceDiscounts(enriched);
          } catch {
            // Promotions are non-critical — ignore errors
          }
        }
      } catch (err) {
        console.error('Failed to load init data:', err);
        setError(t(language, 'loadingError'));
      } finally {
        setLoading(false);
      }
    }

    loadInitData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  // Keep CSS custom properties in sync when theme changes after init
  useEffect(() => {
    document.documentElement.style.setProperty('--mag-primary', theme.primaryColor);
    document.documentElement.style.setProperty('--mag-secondary', theme.secondaryColor);
    document.documentElement.style.setProperty('--mag-bg-from', theme.bgFrom);
    document.documentElement.style.setProperty('--mag-bg-to', theme.bgTo);
  }, [theme]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAFAF9] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <div
            className="w-8 h-8 rounded-full border border-t-transparent animate-spin mx-auto mb-6"
            style={{ borderColor: `${theme.primaryColor} transparent transparent transparent` }}
          />
          <p className="magazine-caps text-[10px] tracking-[0.25em] text-[#6B6B6B]">
            {t(language, 'loading')}
          </p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#FAFAF9] flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-sm"
        >
          <div className="h-[1px] bg-black/10 mb-8 w-16 mx-auto" />
          <p className="magazine-caps text-[10px] tracking-[0.25em] text-[#6B6B6B] mb-6">
            {t(language, 'error')}
          </p>
          <h1 className="magazine-serif text-3xl text-[#1A1A1A] mb-4 leading-tight">
            {t(language, 'errorTitle')}
          </h1>
          <p className="text-[#6B6B6B] text-sm leading-relaxed mb-10">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="magazine-caps text-[10px] tracking-[0.2em] px-8 py-3 border border-[#1A1A1A]/30 text-[#1A1A1A] hover:border-[#1A1A1A] transition-colors duration-300"
          >
            {t(language, 'retry')}
          </button>
          <div className="h-[1px] bg-black/10 mt-8 w-16 mx-auto" />
        </motion.div>
      </div>
    );
  }

  return <MagazineLayout companySlug={slug} />;
}
