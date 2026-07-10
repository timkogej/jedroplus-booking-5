'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { useBookingStore } from '@/store/bookingStore';
import { fetchInitData } from '@/lib/api';
import { fetchActiveDiscounts, calculateDiscount } from '@/lib/promotionsApi';
import type { ServicePromotion } from '@/lib/promotionsApi';
import { usePromotionsStore } from '@/store/promotionsStore';
import CasinoLayout from './components/CasinoLayout';

// ── Minimal white loading screen (same pattern as other variants) ─────────────
function CasinoLoadingScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.35 }}
        className="flex flex-col items-center gap-5"
      >
        <div className="flex items-center gap-2">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="block w-2 h-2 rounded-full"
              style={{ backgroundColor: '#D1D5DB' }}
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{
                duration: 1.1,
                repeat: Infinity,
                delay: i * 0.18,
                ease: 'easeInOut' as const,
              }}
            />
          ))}
        </div>
        <p
          className="text-xs tracking-widest uppercase"
          style={{ color: '#9CA3AF', letterSpacing: '0.12em' }}
        >
          Loading
        </p>
      </motion.div>
    </div>
  );
}

function MonteCarloErrorScreen({ error }: { error: string }) {
  return (
    <div className="min-h-screen mc-bg flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-sm"
      >
        <div
          className="w-16 h-16 mx-auto mb-8 rounded-full flex items-center justify-center"
          style={{
            background: 'rgba(13, 59, 30, 0.8)',
            border: '1px solid rgba(201, 168, 76, 0.3)',
          }}
        >
          <span style={{ color: '#c9a84c', fontSize: '1.5rem', fontFamily: 'Georgia, serif' }}>◆</span>
        </div>

        <h1
          className="text-2xl font-bold tracking-[0.1em] italic mb-3"
          style={{ fontFamily: 'var(--font-playfair)', color: '#f5edd6' }}
        >
          Table Unavailable
        </h1>

        <div className="flex items-center gap-3 mb-4 justify-center">
          <div className="flex-1 h-px max-w-16" style={{ background: 'linear-gradient(to right, transparent, rgba(201,168,76,0.4))' }} />
          <span style={{ color: '#c9a84c', fontSize: '0.7rem' }}>◆</span>
          <div className="flex-1 h-px max-w-16" style={{ background: 'linear-gradient(to left, transparent, rgba(201,168,76,0.4))' }} />
        </div>

        <p
          className="text-sm italic mb-8"
          style={{ fontFamily: 'var(--font-cormorant)', color: 'rgba(232, 217, 184, 0.7)', lineHeight: 1.6 }}
        >
          {error}
        </p>

        <button
          onClick={() => window.location.reload()}
          className="mc-btn-secondary"
        >
          Try Again
        </button>
      </motion.div>
    </div>
  );
}

export default function CasinoPage() {
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
            // Promotions are non-critical
          }
        }
      } catch (err) {
        console.error('Casino booking: failed to load init data:', err);
        setError('Napaka pri nalaganju. Prosimo poskusite znova.');
      } finally {
        setLoading(false);
        setTimeout(() => setHasLoaded(true), 250);
      }
    }

    loadInitData();
  }, [slug, setInitData, setLoading]);

  if (!hasLoaded) return <CasinoLoadingScreen />;
  if (error) return <MonteCarloErrorScreen error={error} />;

  return <CasinoLayout companySlug={slug} />;
}
