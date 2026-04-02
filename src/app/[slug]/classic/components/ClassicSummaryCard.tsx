'use client';

import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  employee?: string;
  service?: { name: string; price: number; duration: number };
  dateTime?: string;
  customer?: string;
  primaryColor: string;
}

interface RowProps {
  label: string;
  value: string;
  primaryColor: string;
}

function SummaryRow({ label, value, primaryColor }: RowProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-start gap-3 py-2.5 border-b"
      style={{ borderColor: 'rgba(0,0,0,0.06)' }}
    >
      <div
        className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
        style={{ backgroundColor: primaryColor }}
      />
      <div className="min-w-0">
        <p
          className="text-xs uppercase tracking-wide font-medium mb-0.5"
          style={{ fontFamily: 'var(--font-nunito-sans)', color: '#9CA3AF', fontSize: '0.65rem' }}
        >
          {label}
        </p>
        <p
          className="text-sm font-semibold truncate"
          style={{ fontFamily: 'var(--font-nunito-sans)', color: '#1F2937' }}
        >
          {value}
        </p>
      </div>
    </motion.div>
  );
}

export default function ClassicSummaryCard({
  employee,
  service,
  dateTime,
  customer,
  primaryColor,
}: Props) {
  const hasAny = employee || service || dateTime || customer;

  return (
    <div
      className="rounded-2xl overflow-hidden sticky top-6"
      style={{
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(12px)',
        border: `1px solid ${primaryColor}20`,
        boxShadow: `0 8px 32px rgba(0,0,0,0.08), 0 0 0 1px ${primaryColor}10`,
      }}
    >
      {/* Header */}
      <div
        className="px-5 py-4 border-b"
        style={{
          borderColor: 'rgba(0,0,0,0.06)',
          background: `linear-gradient(135deg, ${primaryColor}08, transparent)`,
        }}
      >
        <p
          className="text-xs uppercase tracking-widest font-bold"
          style={{ fontFamily: 'var(--font-nunito)', color: '#6B7280' }}
        >
          Vaša Rezervacija
        </p>
      </div>

      {/* Rows */}
      <div className="px-5 py-2">
        <AnimatePresence>
          {employee && (
            <SummaryRow key="emp" label="Oseba" value={employee} primaryColor={primaryColor} />
          )}
          {service && (
            <SummaryRow key="svc" label="Storitev" value={service.name} primaryColor={primaryColor} />
          )}
          {dateTime && (
            <SummaryRow key="dt" label="Termin" value={dateTime} primaryColor={primaryColor} />
          )}
          {customer && (
            <SummaryRow key="cust" label="Stranka" value={customer} primaryColor={primaryColor} />
          )}
        </AnimatePresence>

        {!hasAny && (
          <p
            className="text-sm text-center py-6"
            style={{ fontFamily: 'var(--font-nunito-sans)', color: '#D1D5DB' }}
          >
            Izberite možnosti za začetek
          </p>
        )}
      </div>

      {/* Price footer */}
      {service && (
        <div
          className="px-5 py-3 flex items-center justify-between border-t"
          style={{ borderColor: 'rgba(0,0,0,0.06)' }}
        >
          <div>
            <p
              className="text-xs text-gray-400"
              style={{ fontFamily: 'var(--font-nunito-sans)' }}
            >
              {service.duration} min
            </p>
            <p
              className="text-xs text-gray-400 mt-0.5"
              style={{ fontFamily: 'var(--font-nunito-sans)' }}
            >
              Skupaj
            </p>
          </div>
          <p
            className="text-xl font-bold"
            style={{ fontFamily: 'var(--font-nunito)', color: primaryColor }}
          >
            {Number(service.price).toFixed(2).replace('.', ',')} €
          </p>
        </div>
      )}
    </div>
  );
}
