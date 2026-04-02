'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { useBookingStore } from '@/store/bookingStore';
import { fetchInitData } from '@/lib/api';
import type { Theme } from '@/types';
import SeasonalLayout from './components/SeasonalLayout';

function SeasonalLoadingScreen() {
  const { theme } = useBookingStore();

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{
        background: `linear-gradient(135deg, ${theme.bgFrom}, ${theme.bgTo})`,
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <div className="relative w-16 h-16 mx-auto mb-6">
          <div
            className="absolute inset-0 rounded-full"
            style={{ border: '2px solid rgba(255,255,255,0.15)' }}
          />
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{ border: '2px solid transparent', borderTopColor: 'rgba(255,255,255,0.8)' }}
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' as const }}
          />
        </div>
        <p
          className="text-lg font-medium"
          style={{ color: 'rgba(255,255,255,0.9)', fontFamily: 'var(--font-quicksand)' }}
        >
          Pripravljamo rezervacijo
        </p>
        <p
          className="mt-1 text-sm"
          style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'var(--font-quicksand)' }}
        >
          Prosimo počakajte&hellip;
        </p>
      </motion.div>
    </div>
  );
}

function SeasonalErrorScreen({ error }: { error: string }) {
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
          className="text-2xl font-bold mb-3"
          style={{ color: 'rgba(255,255,255,0.9)', fontFamily: 'var(--font-quicksand)' }}
        >
          Napaka pri nalaganju
        </h1>
        <p
          className="mb-8 text-sm leading-relaxed"
          style={{ color: 'rgba(255,255,255,0.6)', fontFamily: 'var(--font-quicksand)' }}
        >
          {error}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 rounded-xl text-white font-medium transition-opacity hover:opacity-90"
          style={{
            backgroundColor: theme.primaryColor,
            fontFamily: 'var(--font-quicksand)',
            boxShadow: `0 8px 25px ${theme.primaryColor}50`,
          }}
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

  const {
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

        if (data.theme) setTheme(data.theme as Theme);
        if (data.company) setCompany(data.company);
        if (data.employees_ui) setEmployeesUI(data.employees_ui);
        if (data.serviceCategories) setCategories(data.serviceCategories);
        if (data.services) setServices(data.services);
        if (data.servicesByCategory) setServicesByCategory(data.servicesByCategory);
        if (data.employeesByServiceId) setEmployeesByServiceId(data.employeesByServiceId);
      } catch (err) {
        console.error('Seasonal booking: failed to load init data:', err);
        setError('Napaka pri nalaganju. Prosimo poskusite znova.');
      } finally {
        setLoading(false);
        setTimeout(() => setHasLoaded(true), 300);
      }
    }

    loadInitData();
  }, [slug, setTheme, setCompany, setEmployeesUI, setCategories, setServices, setServicesByCategory, setEmployeesByServiceId, setLoading]);

  if (!hasLoaded) {
    return <SeasonalLoadingScreen />;
  }

  if (error) {
    return <SeasonalErrorScreen error={error} />;
  }

  return <SeasonalLayout companySlug={slug} />;
}
