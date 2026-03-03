'use client';

import { motion } from 'framer-motion';
import { ChevronLeft, Clock } from 'lucide-react';
import { useBookingStore } from '@/store/bookingStore';

export default function ServiceSelection() {
  const {
    servicesByCategory,
    selectedCategory,
    selectedService,
    selectService,
    theme,
  } = useBookingStore();

  // Get services for the selected category
  const categoryServices = selectedCategory
    ? servicesByCategory[selectedCategory.id] || []
    : [];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
  };

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  };

  // Handle back to categories
  const handleBack = () => {
    useBookingStore.getState().prevStep();
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="max-w-2xl"
    >
      {/* Header with back navigation */}
      <motion.div variants={itemVariants} className="mb-12">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-white/50 hover:text-white/80 transition-colors mb-6 group"
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm">Nazaj na kategorije</span>
        </button>

        <div className="flex items-center gap-3 mb-3">
          <h1 className="font-serif text-3xl md:text-4xl text-white">
            <span style={{ color: theme.primaryColor }}>
              {selectedCategory?.name}
            </span>
          </h1>
        </div>
        <p className="text-white/60">Izberi storitev</p>
      </motion.div>

      {/* Service list */}
      <div className="space-y-0">
        {categoryServices.map((service) => {
          const isSelected = selectedService?.id === service.id;

          return (
            <motion.div
              key={service.id}
              variants={itemVariants}
              className="group relative"
              onClick={() => selectService(service)}
            >
              {/* Left accent dot */}
              <motion.div
                className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full"
                initial={{ scale: 0 }}
                animate={{ scale: isSelected ? 1 : 0 }}
                style={{ backgroundColor: theme.primaryColor }}
                transition={{ duration: 0.2 }}
              />

              <div
                className={`py-6 cursor-pointer transition-all duration-300 ${
                  isSelected ? 'pl-6' : 'hover:pl-6'
                }`}
              >
                <div className="flex justify-between items-start gap-4">
                  {/* Service info */}
                  <div className="flex-1 min-w-0">
                    <h3
                      className="font-serif text-xl mb-2 transition-colors duration-300"
                      style={{
                        color: isSelected ? theme.primaryColor : 'white',
                      }}
                    >
                      {service.naziv}
                    </h3>
                    {service.opis && (
                      <p className="text-white/50 text-sm leading-relaxed">
                        {service.opis}
                      </p>
                    )}
                  </div>

                  {/* Price and duration */}
                  <div className="flex flex-col items-end flex-shrink-0">
                    <span
                      className="font-light text-xl tracking-wider"
                      style={{
                        color: isSelected ? theme.primaryColor : 'white',
                      }}
                    >
                      €{service.cena}
                    </span>
                    <span className="text-white/40 text-sm flex items-center gap-1 mt-1">
                      <Clock className="w-3 h-3" />
                      <span className="font-light tracking-wider">{formatDuration(service.trajanjeMin)}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom divider */}
              <div className="h-[1px] bg-white/10" />
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
