'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { useBookingStore } from '@/store/bookingStore';
import { fetchInitData } from '@/lib/api';
import CasinoLayout from './components/CasinoLayout';

function MonteCarloLoadingScreen({ primaryColor }: { primaryColor: string }) {
  return (
    <div className="min-h-screen mc-bg flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: 'easeOut' as const }}
        className="text-center max-w-xs"
      >
        {/* Roulette ring */}
        <div className="relative w-24 h-24 mx-auto mb-10">
          <div
            className="absolute inset-0 rounded-full mc-roulette"
            style={{
              border: '1px solid rgba(201, 168, 76, 0.3)',
              boxShadow: `
                inset 0 0 0 8px transparent,
                inset 0 0 0 9px rgba(201, 168, 76, 0.15),
                inset 0 0 0 20px transparent,
                inset 0 0 0 21px rgba(201, 168, 76, 0.1)
              `,
            }}
          />
          <div
            className="absolute inset-4 rounded-full flex items-center justify-center"
            style={{
              background: 'rgba(13, 59, 30, 0.8)',
              border: '1px solid rgba(201, 168, 76, 0.2)',
            }}
          >
            <span style={{ color: '#c9a84c', fontSize: '1.5rem', fontFamily: 'Georgia, serif' }}>◆</span>
          </div>
        </div>

        <h1
          className="text-2xl font-black tracking-[0.18em] uppercase mb-3"
          style={{ fontFamily: 'var(--font-playfair)', color: '#c9a84c' }}
        >
          Monte Carlo
        </h1>
        <p
          className="text-xs tracking-[0.35em] uppercase mb-8"
          style={{ fontFamily: 'var(--font-oswald)', color: 'rgba(201, 168, 76, 0.45)' }}
        >
          Booking Suite
        </p>

        {/* Gold progress bar */}
        <div
          className="w-56 h-px mx-auto overflow-hidden"
          style={{ background: 'rgba(201, 168, 76, 0.15)' }}
        >
          <motion.div
            className="h-full"
            style={{ background: 'linear-gradient(90deg, transparent, #c9a84c, #e8c96d, #c9a84c, transparent)' }}
            initial={{ x: '-100%' }}
            animate={{ x: '100%' }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' as const }}
          />
        </div>

        <p
          className="mt-6 text-xs tracking-[0.2em] uppercase"
          style={{ fontFamily: 'var(--font-oswald)', color: 'rgba(201, 168, 76, 0.25)' }}
        >
          Preparing your table&hellip;
        </p>
      </motion.div>
    </div>
  );
}

function MonteCarloErrorScreen({ error, primaryColor }: { error: string; primaryColor: string }) {
  return (
    <div className="min-h-screen mc-bg flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-sm"
      >
        {/* Diamond icon */}
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

  const {
    theme,
    setTheme,
    setCompany,
    setEmployeesUI,
    setCategories,
    setServices,
    setServicesByCategory,
    setEmployeesByServiceId,
    setLoading,
  } = useBookingStore();

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

        if (data.theme) setTheme(data.theme as typeof theme);
        if (data.company) setCompany(data.company);
        if (data.employees_ui) setEmployeesUI(data.employees_ui);
        if (data.serviceCategories) setCategories(data.serviceCategories);
        if (data.services) setServices(data.services);
        if (data.servicesByCategory) setServicesByCategory(data.servicesByCategory);
        if (data.employeesByServiceId) setEmployeesByServiceId(data.employeesByServiceId);
      } catch (err) {
        console.error('Casino booking: failed to load init data:', err);
        setError('Napaka pri nalaganju. Prosimo poskusite znova.');
      } finally {
        setLoading(false);
        setTimeout(() => setHasLoaded(true), 400);
      }
    }

    loadInitData();
  }, [slug, setTheme, setCompany, setEmployeesUI, setCategories, setServices, setServicesByCategory, setEmployeesByServiceId, setLoading]);

  useEffect(() => {
    document.documentElement.style.setProperty('--mc-primary', theme.primaryColor);
  }, [theme]);

  if (!hasLoaded) {
    return <MonteCarloLoadingScreen primaryColor={theme.primaryColor} />;
  }

  if (error) {
    return <MonteCarloErrorScreen error={error} primaryColor={theme.primaryColor} />;
  }

  return <CasinoLayout companySlug={slug} />;
}
