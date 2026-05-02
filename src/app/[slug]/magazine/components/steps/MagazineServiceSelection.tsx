'use client';

import { motion, type Variants } from 'framer-motion';
import { useBookingStore } from '@/store/bookingStore';
import { Category, Service } from '@/types';

const containerVariants: Variants = {
  animate: { transition: { staggerChildren: 0.06 } },
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

function ServiceCard({
  service,
  category,
}: {
  service: Service;
  category: Category;
}) {
  const { selectedService, selectCategoryAndService, theme } = useBookingStore();
  const isSelected = selectedService?.id === service.id;

  return (
    <motion.div
      variants={itemVariants}
      onClick={() => selectCategoryAndService(category, service)}
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
        <div className="p-4 flex items-start gap-4">
          <div className="flex-1 min-w-0">
            <h3
              className="magazine-serif text-[1.05rem] leading-snug mb-1 transition-colors duration-300"
              style={{ color: isSelected ? theme.primaryColor : '#1A1A1A' }}
            >
              {service.naziv}
            </h3>
            {service.opis && (
              <p className="text-[#6B6B6B] text-[13px] leading-relaxed mb-2">{service.opis}</p>
            )}
            <p className="magazine-caps text-[9px] tracking-[0.18em] text-[#6B6B6B]">
              {formatDuration(service.trajanjeMin)}
            </p>
          </div>

          <div className="flex-shrink-0 text-right">
            <span
              className="magazine-serif text-[1.4rem] leading-none font-light tabular-nums transition-colors duration-300"
              style={{ color: isSelected ? theme.primaryColor : '#1A1A1A' }}
            >
              €{service.cena}
            </span>
          </div>
        </div>

        <motion.div
          className="absolute bottom-0 left-0 h-[2px]"
          style={{ backgroundColor: theme.primaryColor }}
          animate={{ width: isSelected ? '100%' : '0%' }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
      </div>
    </motion.div>
  );
}

export default function MagazineServiceSelection() {
  const { categories, servicesByCategory, theme } = useBookingStore();

  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={containerVariants}
      className="max-w-xl"
    >
      {/* Section header */}
      <motion.div variants={itemVariants} className="mb-10">
        <div className="w-8 h-[1px] mb-5" style={{ backgroundColor: theme.primaryColor }} />
        <h1 className="magazine-serif text-[2.5rem] md:text-[3rem] text-[#1A1A1A] tracking-[-0.02em] leading-[1.1] mb-2">
          Storitve
        </h1>
        <div className="h-[1px] w-full bg-black/10 mb-4" />
        <p className="magazine-body text-[#6B6B6B] text-[15px] italic leading-relaxed">
          Izberite storitev
        </p>
      </motion.div>

      <div className="space-y-8">
        {categories.map((category, catIndex) => {
          const services: Service[] = servicesByCategory[category.id] ?? [];
          if (services.length === 0) return null;
          const paddedIndex = String(catIndex + 1).padStart(2, '0');

          return (
            <motion.div key={category.id} variants={itemVariants}>
              {/* Category heading */}
              <div className="flex items-baseline gap-3 mb-4 pb-3 border-b" style={{ borderColor: 'rgba(0,0,0,0.08)' }}>
                <span
                  className="magazine-caps text-[9px] tracking-[0.2em] tabular-nums"
                  style={{ color: theme.primaryColor }}
                >
                  {paddedIndex}
                </span>
                <h2
                  className="magazine-serif text-[1.4rem] leading-tight flex-1"
                  style={{ color: '#1A1A1A' }}
                >
                  {category.name}
                </h2>
              </div>

              <div className="space-y-2.5">
                {services.map((service) => (
                  <ServiceCard key={service.id} service={service} category={category} />
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
