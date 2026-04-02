'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { useBookingStore } from '@/store/bookingStore';
import { fetchInitData } from '@/lib/api';
import MagazineLayout from './components/MagazineLayout';

export default function MagazinePage() {
  const params = useParams();
  const slug = params.slug as string;

  const {
    theme,
    isLoading,
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

  useEffect(() => {
    async function loadInitData() {
      if (!slug) {
        setError('Ni poslovnega slugsa');
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const data = await fetchInitData(slug);

        if (data.theme) {
          setTheme(data.theme as typeof theme);
        }
        if (data.company) setCompany(data.company);
        if (data.employees_ui) setEmployeesUI(data.employees_ui);
        if (data.serviceCategories) setCategories(data.serviceCategories);
        if (data.services) setServices(data.services);
        if (data.servicesByCategory) setServicesByCategory(data.servicesByCategory);
        if (data.employeesByServiceId) setEmployeesByServiceId(data.employeesByServiceId);
      } catch (err) {
        console.error('Failed to load init data:', err);
        setError('Napaka pri nalaganju. Prosimo poskusite znova.');
      } finally {
        setLoading(false);
      }
    }

    loadInitData();
  }, [slug, setTheme, setCompany, setEmployeesUI, setCategories, setServices, setServicesByCategory, setEmployeesByServiceId, setLoading]);

  // Apply theme CSS custom properties
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
            Nalaganje
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
            Napaka
          </p>
          <h1 className="magazine-serif text-3xl text-[#1A1A1A] mb-4 leading-tight">
            Ups, nekaj je šlo narobe
          </h1>
          <p className="text-[#6B6B6B] text-sm leading-relaxed mb-10">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="magazine-caps text-[10px] tracking-[0.2em] px-8 py-3 border border-[#1A1A1A]/30 text-[#1A1A1A] hover:border-[#1A1A1A] transition-colors duration-300"
          >
            Poskusi znova
          </button>
          <div className="h-[1px] bg-black/10 mt-8 w-16 mx-auto" />
        </motion.div>
      </div>
    );
  }

  return <MagazineLayout companySlug={slug} />;
}
