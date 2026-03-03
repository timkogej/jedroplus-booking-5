'use client';

import { motion, type Variants } from 'framer-motion';
import { useBookingStore } from '@/store/bookingStore';

const containerVariants: Variants = {
  animate: { transition: { staggerChildren: 0.07 } },
};

const itemVariants: Variants = {
  initial: { opacity: 0, x: -14 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.45, ease: 'easeOut' as const } },
};

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

export default function MagazineServiceSelection() {
  const {
    servicesByCategory,
    selectedCategory,
    selectedService,
    selectService,
    theme,
  } = useBookingStore();

  const services = selectedCategory
    ? servicesByCategory[selectedCategory.id] || []
    : [];

  const handleBack = () => useBookingStore.getState().prevStep();

  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={containerVariants}
      className="max-w-xl"
    >
      {/* Back navigation */}
      <motion.div variants={itemVariants} className="mb-8">
        <button
          onClick={handleBack}
          className="group flex items-center gap-2 magazine-caps text-[9px] tracking-[0.2em] text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors duration-200"
        >
          <span className="group-hover:-translate-x-1 transition-transform duration-200 inline-block">
            ←
          </span>
          Nazaj na vsebino
        </button>
      </motion.div>

      {/* Section header */}
      <motion.div variants={itemVariants} className="mb-10">
        <div className="w-8 h-[1px] mb-5" style={{ backgroundColor: theme.primaryColor }} />
        <h1 className="magazine-serif text-[2.5rem] md:text-[3rem] text-[#1A1A1A] tracking-[-0.02em] leading-[1.1] mb-2">
          {selectedCategory?.name}
        </h1>
        <div className="h-[1px] w-full bg-black/10 mb-4" />
        <p className="magazine-body text-[#6B6B6B] text-[15px] italic leading-relaxed">
          Izberite storitev
        </p>
      </motion.div>

      {/* Services as article cards */}
      <div className="space-y-3">
        {services.map((service) => {
          const isSelected = selectedService?.id === service.id;

          return (
            <motion.div
              key={service.id}
              variants={itemVariants}
              onClick={() => selectService(service)}
              className="group cursor-pointer relative"
              whileHover={{ y: -2 }}
              transition={{ duration: 0.25 }}
            >
              <div
                className="relative overflow-hidden border transition-all duration-350"
                style={{
                  borderColor: isSelected ? theme.primaryColor : 'rgba(0,0,0,0.1)',
                  borderLeftWidth: isSelected ? 3 : 1,
                  borderLeftColor: isSelected ? theme.primaryColor : 'rgba(0,0,0,0.1)',
                  backgroundColor: isSelected ? `${theme.primaryColor}04` : 'white',
                  boxShadow: isSelected
                    ? `0 4px 24px ${theme.primaryColor}10`
                    : '0 1px 8px rgba(0,0,0,0.03)',
                }}
              >
                <div className="p-5 flex items-start gap-4">
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h3
                      className="magazine-serif text-[1.15rem] leading-snug mb-1.5 transition-colors duration-300"
                      style={{ color: isSelected ? theme.primaryColor : '#1A1A1A' }}
                    >
                      {service.naziv}
                    </h3>
                    {service.opis && (
                      <p className="text-[#6B6B6B] text-[13px] leading-relaxed mb-3">
                        {service.opis}
                      </p>
                    )}
                    <p className="magazine-caps text-[9px] tracking-[0.18em] text-[#6B6B6B]">
                      {formatDuration(service.trajanjeMin)}
                    </p>
                  </div>

                  {/* Price as pull-quote accent */}
                  <div className="flex-shrink-0 text-right">
                    <span
                      className="magazine-serif text-[1.6rem] leading-none font-light tabular-nums transition-colors duration-300"
                      style={{ color: isSelected ? theme.primaryColor : '#1A1A1A' }}
                    >
                      €{service.cena}
                    </span>
                  </div>
                </div>

                {/* Bottom selection bar */}
                <motion.div
                  className="absolute bottom-0 left-0 h-[2px]"
                  style={{ backgroundColor: theme.primaryColor }}
                  animate={{ width: isSelected ? '100%' : '0%' }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                />
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
