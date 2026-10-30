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

// ── Loading: a chip spinning on the dark table ────────────────────────────────
// Same dark colour as the page, so there is no white flash before it.
function CasinoLoadingScreen() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center" style={{ background: '#09090c' }}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.35 }} className="flex flex-col items-center gap-5">
        <motion.span
          className="block h-10 w-10 rounded-full"
          style={{ border: '3px dashed rgba(246,243,238,0.35)', boxShadow: 'inset 0 0 0 6px rgba(255,255,255,0.04)' }}
          animate={{ rotate: 360 }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'linear' }}
        />
        <p className="text-[11px] uppercase" style={{ color: 'rgba(246,243,238,0.4)', letterSpacing: '0.3em', fontFamily: 'var(--font-oswald)' }}>
          Nalaganje
        </p>
      </motion.div>
    </div>
  );
}

function CasinoErrorScreen({ error }: { error: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-6" style={{ background: '#09090c' }}>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="max-w-sm text-center">
        <div className="mx-auto mb-7 flex h-16 w-16 items-center justify-center rounded-full" style={{ boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.15)' }}>
          <span style={{ color: 'rgba(246,243,238,0.6)', fontSize: '1.4rem', fontFamily: 'Georgia, serif' }}>◆</span>
        </div>
        <h1 className="mb-3 text-[26px] font-bold" style={{ fontFamily: 'var(--font-playfair)', color: '#F6F3EE' }}>
          Rezervacije niso na voljo
        </h1>
        <p className="mb-8 text-[15px] leading-6" style={{ fontFamily: 'var(--font-inter)', color: 'rgba(246,243,238,0.62)' }}>
          {error}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="h-12 rounded-xl px-6 text-[13px] font-medium uppercase"
          style={{ fontFamily: 'var(--font-oswald)', letterSpacing: '0.16em', color: '#F6F3EE', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.2)' }}
        >
          Poskusite znova
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
        setError('Napaka pri nalaganju. Prosimo, poskusite znova.');
      } finally {
        setLoading(false);
        setTimeout(() => setHasLoaded(true), 250);
      }
    }

    loadInitData();
  }, [slug, setInitData, setLoading]);

  if (!hasLoaded) return <CasinoLoadingScreen />;
  if (error) return <CasinoErrorScreen error={error} />;

  return <CasinoLayout companySlug={slug} />;
}
