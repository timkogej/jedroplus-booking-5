'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { useBookingStore } from '@/store/bookingStore';
import { fetchInitData } from '@/lib/api';
import CasinoLayout from './components/CasinoLayout';

const LOAD_SYMBOLS = ['🎰', '🃏', '🍒', '7️⃣', '⭐', '🍀'];

function CasinoLoadingScreen({ primaryColor }: { primaryColor: string }) {
  return (
    <div
      className="min-h-screen flex items-center justify-center casino-bg-pattern"
      style={{ backgroundColor: '#0F0F1A' }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="text-center px-8"
      >
        {/* Floating symbols */}
        <div className="flex gap-5 justify-center mb-10">
          {LOAD_SYMBOLS.map((sym, i) => (
            <motion.span
              key={i}
              className="text-3xl select-none"
              animate={{
                y: [0, -18, 0],
                opacity: [0.4, 1, 0.4],
              }}
              transition={{
                duration: 1.4,
                repeat: Infinity,
                delay: i * 0.18,
                ease: 'easeInOut',
              }}
            >
              {sym}
            </motion.span>
          ))}
        </div>

        {/* Neon title */}
        <h1
          className="text-2xl font-bold tracking-[0.3em] mb-10 uppercase"
          style={{
            fontFamily: 'var(--font-orbitron)',
            color: primaryColor,
            textShadow: `0 0 10px ${primaryColor}, 0 0 20px ${primaryColor}, 0 0 40px ${primaryColor}`,
          }}
        >
          🎰 CASINO LOADING 🎰
        </h1>

        {/* Progress bar */}
        <div className="w-72 h-3 bg-white/10 rounded-full overflow-hidden mx-auto mb-5 border border-white/10">
          <motion.div
            className="h-full rounded-full"
            style={{
              background: `linear-gradient(90deg, ${primaryColor}, #FFD700)`,
              boxShadow: `0 0 10px ${primaryColor}`,
            }}
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ duration: 1.6, ease: 'easeInOut' }}
          />
        </div>

        <p
          className="text-sm tracking-[0.25em] uppercase"
          style={{
            fontFamily: 'var(--font-inter)',
            color: 'rgba(255,255,255,0.4)',
          }}
        >
          Entering the floor...
        </p>
      </motion.div>
    </div>
  );
}

function CasinoErrorScreen({ error, primaryColor }: { error: string; primaryColor: string }) {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-6 casino-bg-pattern"
      style={{ backgroundColor: '#0F0F1A' }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-sm"
      >
        <div className="text-6xl mb-8 casino-float" style={{ display: 'inline-block' }}>
          🎰
        </div>
        <h1
          className="text-2xl font-bold tracking-[0.2em] mb-4 uppercase"
          style={{
            fontFamily: 'var(--font-orbitron)',
            color: primaryColor,
          }}
        >
          GAME OVER
        </h1>
        <p
          className="mb-8 text-sm"
          style={{ fontFamily: 'var(--font-inter)', color: 'rgba(255,255,255,0.5)' }}
        >
          {error}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="casino-btn-outline px-8 py-3 rounded-lg text-sm tracking-[0.15em] uppercase font-bold"
          style={{ fontFamily: 'var(--font-orbitron)' }}
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
        // Small delay so the loading animation has a moment to show
        setTimeout(() => setHasLoaded(true), 400);
      }
    }

    loadInitData();
  }, [slug, setTheme, setCompany, setEmployeesUI, setCategories, setServices, setServicesByCategory, setEmployeesByServiceId, setLoading]);

  // Apply theme CSS custom properties for casino neon glow
  useEffect(() => {
    document.documentElement.style.setProperty('--casino-primary', theme.primaryColor);
    document.documentElement.style.setProperty('--casino-secondary', theme.secondaryColor);
    document.documentElement.style.setProperty('--casino-bg-from', theme.bgFrom);
    document.documentElement.style.setProperty('--casino-bg-to', theme.bgTo);
  }, [theme]);

  if (!hasLoaded) {
    return <CasinoLoadingScreen primaryColor={theme.primaryColor} />;
  }

  if (error) {
    return <CasinoErrorScreen error={error} primaryColor={theme.primaryColor} />;
  }

  return <CasinoLayout companySlug={slug} />;
}
