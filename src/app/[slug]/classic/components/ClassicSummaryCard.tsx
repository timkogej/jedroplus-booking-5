'use client';

import { AnimatePresence, motion } from 'framer-motion';
import type { SupportedLanguage } from '@/types';
import { formatBookingPrice } from '@/lib/pricing';
import { t } from '../i18n';
import { CARD, EASE, FILL, FONT, HAIRLINE, INK, INK_2, INK_3, formatDuration } from './ui';

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
  icon,
  primaryColor,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  primaryColor: string;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35, ease: EASE }}
      className="classic-row flex items-center gap-3 py-3"
      style={{ ['--row-inset' as string]: '44px' }}
    >
      <span
        className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[9px]"
        style={{ background: `${primaryColor}14`, color: primaryColor }}
      >
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[12px]" style={{ fontFamily: FONT, color: INK_2 }}>
          {label}
        </p>
        <p className="truncate text-[15px] font-semibold first-cap" style={{ fontFamily: FONT, color: INK }}>
          {value}
        </p>
      </div>
    </motion.div>
  );
}

const ICONS = {
  service: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l2.5 5.5L20 9.5l-4 4 1 6-5-3-5 3 1-6-4-4 5.5-1z" /></svg>
  ),
  addon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
  ),
  person: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0116 0" /></svg>
  ),
  time: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M3 10h18M8 3v4M16 3v4" /></svg>
  ),
  customer: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="16" rx="3" /><circle cx="9" cy="11" r="2.5" /><path d="M14 10h4M14 14h3M5.5 17a4 4 0 017 0" /></svg>
  ),
};

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

  return (
    <div className="sticky top-32 overflow-hidden" style={CARD}>
      {/* Header */}
      <div className="px-5 pb-1 pt-5">
        <p className="text-[19px] font-bold" style={{ fontFamily: FONT, color: INK, letterSpacing: '-0.02em' }}>
          {t(language, 'yourBooking')}
        </p>
      </div>

      {/* Rows */}
      <div className="px-5 pb-2">
        <AnimatePresence initial={false}>
          {services.map((s, i) => (
            <SummaryRow
              key={`svc-${i}-${s.name}`}
              label={
                services.length > 1
                  ? `${t(language, 'fieldService')} ${i + 1}`
                  : t(language, 'fieldService')
              }
              value={s.name}
              icon={ICONS.service}
              primaryColor={primaryColor}
            />
          ))}
          {addOn && (
            <SummaryRow
              key="addon"
              label={t(language, 'fieldAddon')}
              value={`${addOn.name} (+${formatBookingPrice(addOn.price)})`}
              icon={ICONS.addon}
              primaryColor={primaryColor}
            />
          )}
          {employee && (
            <SummaryRow key="emp" label={t(language, 'stepPerson')} value={employee} icon={ICONS.person} primaryColor={primaryColor} />
          )}
          {dateTime && (
            <SummaryRow key="dt" label={t(language, 'stepAppointment')} value={dateTime} icon={ICONS.time} primaryColor={primaryColor} />
          )}
          {customer && (
            <SummaryRow key="cust" label={t(language, 'fieldName')} value={customer} icon={ICONS.customer} primaryColor={primaryColor} />
          )}
        </AnimatePresence>

        {!hasAny && (
          <div className="flex flex-col items-center py-7 text-center">
            <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full" style={{ background: FILL, color: INK_3 }}>
              {ICONS.time}
            </span>
            <p className="max-w-[200px] text-[14px] leading-5" style={{ fontFamily: FONT, color: INK_3 }}>
              {t(language, 'startSelectingOptions')}
            </p>
          </div>
        )}
      </div>

      {/* Price footer */}
      <AnimatePresence initial={false}>
        {services.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mx-5 flex items-end justify-between py-4" style={{ borderTop: `0.5px solid ${HAIRLINE}` }}>
              <div>
                <p className="text-[13px]" style={{ fontFamily: FONT, color: INK_2 }}>
                  {t(language, 'total')}
                </p>
                <p className="text-[12px]" style={{ fontFamily: FONT, color: INK_3 }}>
                  {formatDuration(totalDuration)}
                </p>
              </div>
              <div className="text-right">
                {showDiscount && (
                  <p className="text-[13px] line-through" style={{ fontFamily: FONT, color: INK_3 }}>
                    {formatBookingPrice(originalPrice)}
                  </p>
                )}
                <motion.p
                  key={totalPrice}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-[24px] font-bold tabular-nums"
                  style={{ fontFamily: FONT, color: INK, letterSpacing: '-0.02em' }}
                >
                  {formatBookingPrice(totalPrice)}
                </motion.p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
