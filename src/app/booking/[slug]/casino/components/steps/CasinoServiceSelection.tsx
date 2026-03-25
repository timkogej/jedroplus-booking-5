'use client';

import { motion } from 'framer-motion';
import { useBookingStore } from '@/store/bookingStore';
import { Service } from '@/types';

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07 } },
};

const itemVariants = {
  hidden: { opacity: 0, x: -16 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.35 } },
};

function ServiceCard({ service, onSelect }: { service: Service; onSelect: (s: Service) => void }) {
  const { theme } = useBookingStore();
  const primary = theme.primaryColor;

  // Mark expensive services as "High Roller"
  const isHighRoller = service.cena >= 30;

  return (
    <motion.button
      variants={itemVariants}
      onClick={() => onSelect(service)}
      whileHover={{ scale: 1.015, y: -2 }}
      whileTap={{ scale: 0.98 }}
      className="w-full text-left rounded-xl overflow-hidden group relative transition-all"
      style={{
        backgroundColor: '#1A1A2E',
        border: `1px solid ${isHighRoller ? 'rgba(255,215,0,0.25)' : 'rgba(139,92,246,0.2)'}`,
      }}
    >
      {/* High Roller ribbon */}
      {isHighRoller && (
        <div
          className="absolute top-0 right-0 px-3 py-1 text-[8px] font-bold tracking-widest uppercase rounded-bl-lg"
          style={{
            fontFamily: 'var(--font-orbitron)',
            backgroundColor: 'rgba(255,215,0,0.15)',
            borderLeft: '1px solid rgba(255,215,0,0.3)',
            borderBottom: '1px solid rgba(255,215,0,0.3)',
            color: '#FFD700',
          }}
        >
          ★ HIGH ROLLER
        </div>
      )}

      {/* Hover glow */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background: `radial-gradient(ellipse at left top, ${isHighRoller ? 'rgba(255,215,0,0.06)' : `${primary}08`}, transparent 70%)`,
        }}
      />

      <div className="relative p-5">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-xl flex-shrink-0">🎰</span>
            <h3
              className="font-bold text-sm tracking-wide uppercase text-white leading-tight"
              style={{ fontFamily: 'var(--font-orbitron)' }}
            >
              {service.naziv}
            </h3>
          </div>

          {/* Price chip */}
          <div
            className="flex-shrink-0 px-3 py-1.5 rounded-lg font-bold text-sm"
            style={{
              fontFamily: 'var(--font-orbitron)',
              backgroundColor: isHighRoller ? 'rgba(255,215,0,0.12)' : `${primary}15`,
              border: `1px solid ${isHighRoller ? 'rgba(255,215,0,0.4)' : `${primary}40`}`,
              color: isHighRoller ? '#FFD700' : primary,
              textShadow: isHighRoller ? '0 0 8px rgba(255,215,0,0.6)' : `0 0 8px ${primary}80`,
            }}
          >
            €{service.cena}
          </div>
        </div>

        {/* Description */}
        {service.opis && (
          <p
            className="text-xs mb-3 leading-relaxed"
            style={{ fontFamily: 'var(--font-inter)', color: 'rgba(255,255,255,0.45)' }}
          >
            {service.opis}
          </p>
        )}

        {/* Footer row: duration + CTA */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>⏱️</span>
            <span
              className="text-xs tracking-wider"
              style={{ fontFamily: 'var(--font-inter)', color: 'rgba(255,255,255,0.4)' }}
            >
              {formatDuration(service.trajanjeMin)} play time
            </span>
          </div>

          <motion.div
            className="text-xs font-bold tracking-wider px-4 py-1.5 rounded-lg"
            style={{
              fontFamily: 'var(--font-orbitron)',
              backgroundColor: `${primary}20`,
              border: `1px solid ${primary}40`,
              color: primary,
            }}
            whileHover={{
              backgroundColor: `${primary}30`,
              boxShadow: `0 0 10px ${primary}40`,
            }}
          >
            BET NOW
          </motion.div>
        </div>
      </div>

      {/* Bottom accent line */}
      <motion.div
        className="h-[2px]"
        style={{
          background: isHighRoller
            ? 'linear-gradient(to right, transparent, #FFD700, transparent)'
            : `linear-gradient(to right, transparent, ${primary}, transparent)`,
        }}
        initial={{ opacity: 0.3 }}
        whileHover={{ opacity: 1 }}
      />
    </motion.button>
  );
}

export default function CasinoServiceSelection() {
  const { selectedCategory, servicesByCategory, selectService, theme } = useBookingStore();
  const primary = theme.primaryColor;

  const services = selectedCategory
    ? (servicesByCategory[selectedCategory.id] ?? [])
    : [];

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      {/* Category label */}
      <motion.div variants={itemVariants} className="flex items-center gap-3 mb-5">
        <div
          className="px-3 py-1.5 rounded-lg text-xs font-bold tracking-widest uppercase"
          style={{
            fontFamily: 'var(--font-orbitron)',
            backgroundColor: `${primary}15`,
            border: `1px solid ${primary}30`,
            color: primary,
          }}
        >
          📂 {selectedCategory?.name ?? 'Kategorija'}
        </div>
      </motion.div>

      {/* Services */}
      {services.length === 0 ? (
        <motion.div variants={itemVariants} className="text-center py-16">
          <div className="text-5xl mb-4">🎰</div>
          <p
            className="text-sm"
            style={{ fontFamily: 'var(--font-inter)', color: 'rgba(255,255,255,0.4)' }}
          >
            Ni razpoložljivih storitev
          </p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {services.map((service) => (
            <ServiceCard key={service.id} service={service} onSelect={selectService} />
          ))}
        </div>
      )}

      {/* Flavor text */}
      <motion.div variants={itemVariants} className="mt-8 text-center">
        <p
          className="text-[10px] tracking-[0.25em] uppercase"
          style={{ fontFamily: 'var(--font-orbitron)', color: `${primary}40` }}
        >
          ✦ Izberite svojo stavo ✦
        </p>
      </motion.div>
    </motion.div>
  );
}
