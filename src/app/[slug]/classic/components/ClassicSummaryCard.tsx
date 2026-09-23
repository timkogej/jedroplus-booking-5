'use client';

import { AnimatePresence, motion } from 'framer-motion';
import type { SupportedLanguage } from '@/types';
import { formatBookingPrice } from '@/lib/pricing';
import { t } from '../i18n';

interface ServiceEntry {
  name: string;
  price: number;
  duration: number;
}

interface Props {
  services: ServiceEntry[];
  addOn?: ServiceEntry;
  employee?: string;
  dateTime?: string;
  customer?: string;
  primaryColor: string;
  language: SupportedLanguage;
  originalTotal?: number;
  finalTotal?: number;
  hasDiscount?: boolean;
}

function SummaryRow({
  label,
  value,
  primaryColor,
}: {
  label: string;
  value: string;
  primaryColor: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-start gap-3 py-2.5"
      style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}
    >
      <div
        className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
        style={{ backgroundColor: primaryColor }}
      />
      <div className="min-w-0">
        <p
          className="uppercase tracking-wide font-medium mb-0.5"
          style={{
            fontFamily: 'var(--font-nunito-sans)',
            color: '#9CA3AF',
            fontSize: '0.6rem',
            letterSpacing: '0.08em',
          }}
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
  services,
  addOn,
  employee,
  dateTime,
  customer,
  primaryColor,
  language,
  originalTotal,
  finalTotal,
  hasDiscount = false,
}: Props) {
  const hasAny = services.length > 0 || !!addOn || employee || dateTime || customer;

  const computedTotalPrice = services.reduce((sum, s) => sum + Number(s.price), 0);
  const totalPrice = finalTotal ?? computedTotalPrice;
  const originalPrice = originalTotal ?? computedTotalPrice;
  const showDiscount = hasDiscount && originalPrice > totalPrice;
  const totalDuration =
    services.reduce((sum, s) => sum + s.duration, 0) + (addOn?.duration ?? 0);

  const formatDuration = (min: number) => {
    if (min < 60) return `${min} min`;
    const h = Math.floor(min / 60);
    const m = min % 60;
    return m > 0 ? `${h}h ${m}min` : `${h}h`;
  };

  return (
    <div
      className="rounded-2xl overflow-hidden sticky top-6"
      style={{
        background: 'rgba(255,255,255,0.94)',
        backdropFilter: 'blur(12px)',
        border: `1px solid ${primaryColor}1A`,
        boxShadow: `0 6px 28px rgba(0,0,0,0.07), 0 0 0 1px ${primaryColor}0D`,
      }}
    >
      {/* Header */}
      <div
        className="px-5 py-3.5 border-b"
        style={{
          borderColor: 'rgba(0,0,0,0.05)',
          background: `linear-gradient(135deg, ${primaryColor}08, transparent)`,
        }}
      >
        <p
          className="uppercase tracking-widest font-bold"
          style={{
            fontFamily: 'var(--font-nunito)',
            color: '#6B7280',
            fontSize: '0.62rem',
            letterSpacing: '0.12em',
          }}
        >
          {t(language, 'yourBooking')}
        </p>
      </div>

      {/* Rows */}
      <div className="px-5 py-1">
        <AnimatePresence>
          {services.length > 0 && (
            <div key="services">
              {services.map((s, i) => (
                <SummaryRow
                  key={`svc-${i}`}
                  label={
                    services.length > 1
                      ? `${t(language, 'fieldService')} ${i + 1}`
                      : t(language, 'fieldService')
                  }
                  value={s.name}
                  primaryColor={primaryColor}
                />
              ))}
            </div>
          )}
          {addOn && (
            <SummaryRow
              key="addon"
              label={t(language, 'fieldAddon')}
              value={`${addOn.name} (+${formatBookingPrice(addOn.price)})`}
              primaryColor={primaryColor}
            />
          )}
          {employee && (
            <SummaryRow
              key="emp"
              label={t(language, 'stepPerson')}
              value={employee}
              primaryColor={primaryColor}
            />
          )}
          {dateTime && (
            <SummaryRow
              key="dt"
              label={t(language, 'stepAppointment')}
              value={dateTime}
              primaryColor={primaryColor}
            />
          )}
          {customer && (
            <SummaryRow
              key="cust"
              label={t(language, 'fieldName')}
              value={customer}
              primaryColor={primaryColor}
            />
          )}
        </AnimatePresence>

        {!hasAny && (
          <p
            className="text-sm text-center py-6"
            style={{ fontFamily: 'var(--font-nunito-sans)', color: '#D1D5DB' }}
          >
            {t(language, 'startSelectingOptions')}
          </p>
        )}
      </div>

      {/* Price footer */}
      {services.length > 0 && (
        <div
          className="px-5 py-3 flex items-center justify-between border-t"
          style={{ borderColor: 'rgba(0,0,0,0.05)' }}
        >
          <div>
            <p
              className="text-xs text-gray-400"
              style={{ fontFamily: 'var(--font-nunito-sans)' }}
            >
              {formatDuration(totalDuration)}
            </p>
            <p
              className="text-xs text-gray-400 mt-0.5"
              style={{ fontFamily: 'var(--font-nunito-sans)' }}
            >
              {t(language, 'total')}
            </p>
          </div>
          <div className="text-right">
            {showDiscount && (
              <p
                className="text-xs line-through text-gray-300"
                style={{ fontFamily: 'var(--font-nunito-sans)' }}
              >
                {formatBookingPrice(originalPrice)}
              </p>
            )}
            <p
              className="text-xl font-bold"
              style={{ fontFamily: 'var(--font-nunito)', color: primaryColor }}
            >
              {formatBookingPrice(totalPrice)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
