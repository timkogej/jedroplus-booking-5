'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { useBookingStore } from '@/store/bookingStore';
import { fetchInitData } from '@/lib/api';
import { fetchActiveDiscounts, calculateDiscount } from '@/lib/promotionsApi';
import type { ServicePromotion } from '@/lib/promotionsApi';
import { usePromotionsStore } from '@/store/promotionsStore';
import ClassicLayout from './components/ClassicLayout';

// ── Minimal white loading screen ────────────────────────────────────────────
// White bg, three-dot pulse, English text — designed to be reused across variants
function ClassicLoadingScreen() {
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
            fontFamily: 'var(--font-nunito-sans)',
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

// ── Error screen ─────────────────────────────────────────────────────────────
function ClassicErrorScreen({ error }: { error: string }) {
  const { theme } = useBookingStore();

  return (
    <div
      className="min-h-screen flex items-center justify-center px-6"
      style={{
        background: `linear-gradient(135deg, ${theme.bgFrom}, ${theme.bgTo})`,
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-sm"
      >
        <div
          className="w-14 h-14 rounded-full mx-auto mb-5 flex items-center justify-center"
          style={{
            background: 'rgba(255,255,255,0.12)',
            border: '1.5px solid rgba(255,255,255,0.25)',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path
              d="M10 6v5M10 14h.01"
              stroke="rgba(255,255,255,0.85)"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <circle cx="10" cy="10" r="8" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" />
          </svg>
        </div>

        <h1
          className="text-xl font-bold mb-2"
          style={{
            fontFamily: 'var(--font-nunito)',
            color: 'rgba(255,255,255,0.95)',
          }}
        >
          Napaka pri nalaganju
        </h1>

        <p
          className="text-sm mb-7 leading-relaxed"
          style={{
            fontFamily: 'var(--font-nunito-sans)',
            color: 'rgba(255,255,255,0.6)',
          }}
        >
          {error}
        </p>

        <button
          onClick={() => window.location.reload()}
          className="px-7 py-2.5 rounded-xl font-semibold text-sm transition-opacity hover:opacity-80"
          style={{
            fontFamily: 'var(--font-nunito)',
            background: 'rgba(255,255,255,0.18)',
            border: '1.5px solid rgba(255,255,255,0.3)',
            color: '#ffffff',
          }}
        >
          Poskusi znova
        </button>
      </motion.div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ClassicPage() {
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
        console.log('[DEBUG services]', JSON.stringify(data.services?.slice(0,2)));
        // Single call hydrates all store state at once
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
                  Number(service.cena),
                  promo.tipPopusta,
                  promo.vrednost
                );
                enriched[sId] = {
                  ...promo,
                  originalCena: Number(service.cena),
                  finalCena,
                  popustZnesek,
                };
              }
            }
            usePromotionsStore.getState().setServiceDiscounts(enriched);
          } catch {
            // Promotions are non-critical
          }
        }
      } catch (err) {
        console.error('Classic booking: failed to load init data:', err);
        setError('Napaka pri nalaganju. Prosimo poskusite znova.');
      } finally {
        setLoading(false);
        setTimeout(() => setHasLoaded(true), 250);
      }
    }

    loadInitData();
  }, [slug, setInitData, setLoading]);

  if (!hasLoaded) return <ClassicLoadingScreen />;
  if (error) return <ClassicErrorScreen error={error} />;

  return <ClassicLayout companySlug={slug} />;
}
