'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { useBookingStore } from '@/store/bookingStore';
import { fetchInitData } from '@/lib/api';
import { fetchActiveDiscounts, calculateDiscount } from '@/lib/promotionsApi';
import type { ServicePromotion } from '@/lib/promotionsApi';
import { usePromotionsStore } from '@/store/promotionsStore';
import SeasonalLayout from './components/SeasonalLayout';

function SeasonalLoadingScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white">
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        {/* Minimal dark spinner */}
        <motion.div
          className="w-6 h-6 rounded-full border-2 border-gray-200 border-t-gray-700"
          animate={{ rotate: 360 }}
          transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' as const }}
        />
        <p
          className="text-sm text-gray-400 tracking-wide"
          style={{ fontFamily: 'var(--font-inter, Inter, sans-serif)', fontWeight: 500 }}
        >
          Loading
        </p>
      </div>

      {/* Powered by Jedro+ — always at the very bottom */}
      <p
        className="pb-8 text-xs text-gray-300 tracking-wide"
        style={{ fontFamily: 'var(--font-inter, Inter, sans-serif)' }}
      >
        Powered by Jedro+
      </p>
    </div>
  );
}

function SeasonalErrorScreen({ error }: { error: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center max-w-sm"
      >
        <div className="w-12 h-12 rounded-full bg-red-50 border border-red-100 mx-auto mb-5 flex items-center justify-center">
          <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
        </div>
        <h2
          className="text-lg font-semibold text-gray-800 mb-2"
          style={{ fontFamily: 'var(--font-stardom, serif)' }}
        >
          Napaka pri nalaganju
        </h2>
        <p
          className="text-sm text-gray-500 mb-7 leading-relaxed"
          style={{ fontFamily: 'var(--font-inter, Inter, sans-serif)' }}
        >
          {error}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2.5 rounded-xl text-sm font-medium bg-gray-900 text-white hover:bg-gray-800 transition-colors"
          style={{ fontFamily: 'var(--font-inter, Inter, sans-serif)' }}
        >
          Poskusi znova
        </button>
      </motion.div>
    </div>
  );
}

export default function SeasonalPage() {
  const params = useParams();
  const slug = params.slug as string;

  const { setInitData, setLoading } = useBookingStore();

  const [error, setError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    async function loadInitData() {
      if (!slug) {
        setError('Ni poslovnega slug-a');
        setHasLoaded(true);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const data = await fetchInitData(slug);
        setInitData(data);

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
                  Number(service.cena), promo.tipPopusta, promo.vrednost
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
        console.error('Seasonal booking: failed to load init data:', err);
        setError('Napaka pri nalaganju. Prosimo poskusite znova.');
      } finally {
        setLoading(false);
        setTimeout(() => setHasLoaded(true), 300);
      }
    }

    loadInitData();
  }, [slug, setInitData, setLoading]);

  if (!hasLoaded) return <SeasonalLoadingScreen />;
  if (error) return <SeasonalErrorScreen error={error} />;

  return <SeasonalLayout companySlug={slug} />;
}
