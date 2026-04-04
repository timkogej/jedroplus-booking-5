'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { useBookingStore } from '@/store/bookingStore';
import { fetchInitData } from '@/lib/api';
import type { Theme } from '@/types';
import ClassicLayout from './components/ClassicLayout';

function ClassicLoadingScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' as const }}
        className="flex flex-col items-center"
      >
        {/* Gradient spinning ring */}
        <motion.div
          className="mb-8 flex-shrink-0"
          style={{
            width: 60,
            height: 60,
            borderRadius: '50%',
            background: 'conic-gradient(from 0deg, #7C3AED, #3B82F6, #14B8A6, transparent 75%)',
            padding: 3,
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' as const }}
        >
          <div style={{ width: '100%', height: '100%', borderRadius: '50%', backgroundColor: '#ffffff' }} />
        </motion.div>

        <h1
          className="text-xl font-bold text-gray-900 mb-2"
          style={{ fontFamily: 'var(--font-nunito)' }}
        >
          Pripravljamo rezervacijo
        </h1>
        <p
          className="text-sm text-gray-400 mb-10"
          style={{ fontFamily: 'var(--font-nunito-sans)' }}
        >
          Prosimo počakajte&hellip;
        </p>

        <p
          className="text-xs text-gray-400"
          style={{ fontFamily: 'var(--font-nunito-sans)' }}
        >
          Powered by{' '}
          <a
            href="https://jedroplus.si"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold hover:underline"
            style={{ color: '#7C3AED' }}
          >
            Jedro+
          </a>
        </p>
      </motion.div>
    </div>
  );
}

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
          className="w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center"
          style={{
            background: 'rgba(255,255,255,0.1)',
            border: '1.5px solid rgba(255,255,255,0.3)',
          }}
        >
          <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '1.5rem' }}>×</span>
        </div>

        <h1
          className="text-2xl font-bold mb-3"
          style={{
            fontFamily: 'var(--font-nunito)',
            color: 'rgba(255,255,255,0.95)',
          }}
        >
          Napaka pri nalaganju
        </h1>

        <p
          className="mb-8"
          style={{
            fontFamily: 'var(--font-nunito-sans)',
            fontSize: '0.9rem',
            color: 'rgba(255,255,255,0.65)',
            lineHeight: 1.6,
          }}
        >
          {error}
        </p>

        <button
          onClick={() => window.location.reload()}
          className="px-8 py-3 rounded-2xl font-bold text-sm transition-opacity hover:opacity-90"
          style={{
            fontFamily: 'var(--font-nunito)',
            background: 'rgba(255,255,255,0.2)',
            border: '1.5px solid rgba(255,255,255,0.4)',
            color: '#ffffff',
          }}
        >
          Poskusi znova
        </button>
      </motion.div>
    </div>
  );
}

export default function ClassicPage() {
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
        console.error('Classic booking: failed to load init data:', err);
        setError('Napaka pri nalaganju. Prosimo poskusite znova.');
      } finally {
        setLoading(false);
        setTimeout(() => setHasLoaded(true), 350);
      }
    }

    loadInitData();
  }, [slug, setTheme, setCompany, setEmployeesUI, setCategories, setServices, setServicesByCategory, setEmployeesByServiceId, setLoading]);

  if (!hasLoaded) {
    return <ClassicLoadingScreen />;
  }

  if (error) {
    return <ClassicErrorScreen error={error} />;
  }

  return <ClassicLayout companySlug={slug} />;
}
