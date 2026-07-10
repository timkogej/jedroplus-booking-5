'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { useBookingStore } from '@/store/bookingStore';
import { fetchInitData } from '@/lib/api';
import { fetchActiveDiscounts, calculateDiscount } from '@/lib/promotionsApi';
import type { ServicePromotion } from '@/lib/promotionsApi';
import { usePromotionsStore } from '@/store/promotionsStore';
import ModernLayout from './components/ModernLayout';

// Minimal white loading screen — same pattern as classic variant
function ModernLoadingScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.35 }}
        className="flex flex-col items-center gap-5"
      >
        {/* Three pulsing dots */}
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
          style={{
            fontFamily: 'var(--font-inter)',
            color: '#9CA3AF',
            letterSpacing: '0.12em',
          }}
        >
          Loading
        </p>
      </motion.div>
    </div>
  );
}

function ModernErrorScreen({ error }: { error: string }) {
  const { theme } = useBookingStore();

  return (
    <div
      className="min-h-screen flex items-center justify-center px-6"
      style={{
        background: `linear-gradient(135deg, ${theme.bgFrom}, ${theme.bgTo})`,
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-sm"
      >
        <div
          className="w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center"
          style={{ backgroundColor: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.4)' }}
        >
          <span style={{ color: '#FCA5A5', fontSize: '1.5rem' }}>×</span>
        </div>
        <h1
          className="text-2xl mb-3"
          style={{ color: 'rgba(255,255,255,0.9)', fontFamily: 'var(--font-clash)', fontWeight: 400 }}
        >
          Napaka pri nalaganju
        </h1>
        <p
          className="mb-8 text-sm leading-relaxed"
          style={{ color: 'rgba(255,255,255,0.6)', fontFamily: 'var(--font-inter)' }}
        >
          {error}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 rounded-xl text-white font-medium transition-opacity hover:opacity-90"
          style={{
            backgroundColor: theme.primaryColor,
            fontFamily: 'var(--font-inter)',
            boxShadow: `0 8px 25px ${theme.primaryColor}50`,
          }}
        >
          Poskusi znova
        </button>
      </motion.div>
    </div>
  );
}

export default function ModernPage() {
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
        // Single call hydrates all store state (multipleServicesAllowed, maxDniRezervacija, etc.)
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
        console.error('Modern booking: failed to load init data:', err);
        setError('Napaka pri nalaganju. Prosimo poskusite znova.');
      } finally {
        setLoading(false);
        setTimeout(() => setHasLoaded(true), 300);
      }
    }

    loadInitData();
  }, [slug, setInitData, setLoading]);

  if (!hasLoaded) return <ModernLoadingScreen />;
  if (error) return <ModernErrorScreen error={error} />;

  return <ModernLayout companySlug={slug} />;
}
