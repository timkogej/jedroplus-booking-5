'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { useBookingStore } from '@/store/bookingStore';
import { fetchInitData } from '@/lib/api';
import ElegantLayout from './components/ElegantLayout';

function ElegantLoadingScreen() {
  const { theme } = useBookingStore();

  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: '#FAFAFA' }}>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' as const }}
        className="text-center"
      >
        {/* Loading ring */}
        <div className="relative w-14 h-14 mx-auto mb-8">
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{ border: `2px solid ${theme.primaryColor}20` }}
          />
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              border: `2px solid transparent`,
              borderTopColor: theme.primaryColor,
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' as const }}
          />
        </div>

        <h1
          style={{
            fontFamily: 'var(--font-playfair)',
            fontSize: '1.4rem',
            fontWeight: 400,
            color: '#1F2937',
          }}
        >
          Pripravljamo rezervacijo
        </h1>
        <p
          className="mt-2"
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '0.85rem',
            color: '#9CA3AF',
          }}
        >
          Prosimo počakajte&hellip;
        </p>
      </motion.div>
    </div>
  );
}

function ElegantErrorScreen({ error }: { error: string }) {
  const { theme } = useBookingStore();

  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: '#FAFAFA' }}>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-sm"
      >
        {/* Error icon */}
        <div
          className="w-14 h-14 rounded-full mx-auto mb-6 flex items-center justify-center"
          style={{
            background: '#FEF2F2',
            border: '1px solid #FECACA',
          }}
        >
          <span style={{ color: '#EF4444', fontSize: '1.3rem' }}>×</span>
        </div>

        <h1
          style={{
            fontFamily: 'var(--font-playfair)',
            fontSize: '1.5rem',
            fontWeight: 400,
            color: '#1F2937',
          }}
        >
          Napaka pri nalaganju
        </h1>

        <p
          className="mt-3 mb-8"
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '0.9rem',
            color: '#6B7280',
            lineHeight: 1.6,
          }}
        >
          {error}
        </p>

        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 rounded-lg text-white text-sm font-medium transition-opacity hover:opacity-90"
          style={{ backgroundColor: theme.primaryColor, fontFamily: 'var(--font-inter)' }}
        >
          Poskusi znova
        </button>
      </motion.div>
    </div>
  );
}

export default function ElegantPage() {
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
        console.error('Elegant booking: failed to load init data:', err);
        setError('Napaka pri nalaganju. Prosimo poskusite znova.');
      } finally {
        setLoading(false);
        setTimeout(() => setHasLoaded(true), 300);
      }
    }

    loadInitData();
  }, [slug, setTheme, setCompany, setEmployeesUI, setCategories, setServices, setServicesByCategory, setEmployeesByServiceId, setLoading]);

  if (!hasLoaded) {
    return <ElegantLoadingScreen />;
  }

  if (error) {
    return <ElegantErrorScreen error={error} />;
  }

  return <ElegantLayout companySlug={slug} />;
}
