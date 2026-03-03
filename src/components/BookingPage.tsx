'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBookingStore } from '@/store/bookingStore';
import { fetchInitData } from '@/lib/api';

import TimelineStepper from './TimelineStepper';
import MobileStepIndicator from './MobileStepIndicator';
import NavigationBar from './NavigationBar';
import {
  EmployeeSelection,
  CategorySelection,
  ServiceSelection,
  DateTimeSelection,
  CustomerDetails,
  Confirmation,
} from './steps';

interface BookingPageProps {
  businessSlug?: string;
}

export default function BookingPage({ businessSlug }: BookingPageProps) {
  const {
    currentStep,
    serviceSubStep,
    theme,
    company,
    isLoading,
    setTheme,
    setCompany,
    setEmployeesUI,
    setCategories,
    setServices,
    setServicesByCategory,
    setLoading,
  } = useBookingStore();

  const [error, setError] = useState<string | null>(null);

  // Fetch business data from API
  useEffect(() => {
    async function loadInitData() {
      if (!businessSlug) {
        setError('No business specified');
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const data = await fetchInitData(businessSlug);

        // Set theme (already merged with defaults in API)
        if (data.theme) {
          setTheme(data.theme as typeof theme);
        }

        // Set company info
        if (data.company) {
          setCompany(data.company);
        }

        // Set employees
        if (data.employees_ui) {
          setEmployeesUI(data.employees_ui);
        }

        // Set categories
        if (data.serviceCategories) {
          setCategories(data.serviceCategories);
        }

        // Set services
        if (data.services) {
          setServices(data.services);
        }

        // Set services by category
        if (data.servicesByCategory) {
          setServicesByCategory(data.servicesByCategory);
        }
      } catch (err) {
        console.error('Failed to load init data:', err);
        setError('Failed to load booking data. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    loadInitData();
  }, [businessSlug, setTheme, setCompany, setEmployeesUI, setCategories, setServices, setServicesByCategory, setLoading]);

  // Apply theme CSS variables
  useEffect(() => {
    document.documentElement.style.setProperty('--primary-color', theme.primaryColor);
    document.documentElement.style.setProperty('--secondary-color', theme.secondaryColor);
    document.documentElement.style.setProperty('--bg-from', theme.bgFrom);
    document.documentElement.style.setProperty('--bg-to', theme.bgTo);
  }, [theme]);

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <EmployeeSelection />;
      case 2:
        return serviceSubStep === 'category' ? (
          <CategorySelection />
        ) : (
          <ServiceSelection />
        );
      case 3:
        return <DateTimeSelection companySlug={businessSlug} />;
      case 4:
        return <CustomerDetails />;
      case 5:
        return <Confirmation companySlug={businessSlug} />;
      default:
        return null;
    }
  };

  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  };

  // Loading state
  if (isLoading) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #f5f0ff 0%, #eff6ff 40%, #f0fdfa 100%)' }}
      >
        <div
          className="animate-spin"
          style={{
            width: 52,
            height: 52,
            borderRadius: '50%',
            background: 'conic-gradient(from 0deg, #8b5cf6, #3b82f6, #14b8a6, transparent 75%)',
            WebkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 5px), black calc(100% - 5px))',
            mask: 'radial-gradient(farthest-side, transparent calc(100% - 5px), black calc(100% - 5px))',
          }}
        />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center px-6"
        style={{
          background: `linear-gradient(135deg, ${theme.bgFrom}, ${theme.bgTo})`,
        }}
      >
        <div className="text-center max-w-md bg-white/10 backdrop-blur-lg rounded-2xl p-8">
          <h1 className="font-serif text-2xl mb-4 text-white">
            Napaka pri nalaganju
          </h1>
          <p className="text-white/70 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 rounded-full border-2 border-white text-white hover:bg-white hover:text-gray-800 transition-all duration-300"
          >
            Poskusi znova
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen"
      style={{
        background: `linear-gradient(135deg, ${theme.bgFrom}, ${theme.bgTo})`,
      }}
    >
      {/* Header */}
      <header className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="font-serif text-xl font-bold text-white">
              {company?.naziv || 'Rezervacija'}
            </h1>
          </div>

          <div className="hidden lg:block text-sm text-white/60 font-light tracking-wide">
            Korak {currentStep} od 5
          </div>
        </div>
      </header>

      {/* Mobile step indicator */}
      <MobileStepIndicator />

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-6 py-8 lg:py-12">
        <div className="flex gap-8 lg:gap-16">
          {/* Timeline stepper (desktop) */}
          <TimelineStepper />

          {/* Step content */}
          <div className="flex-1 pb-24 lg:pb-0">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 lg:p-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${currentStep}-${serviceSubStep}`}
                  variants={pageVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={{ duration: 0.3 }}
                >
                  {renderStep()}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </main>

      {/* Navigation bar */}
      <NavigationBar />
    </div>
  );
}
