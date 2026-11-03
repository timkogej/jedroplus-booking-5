'use client';

import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { useBookingStore } from '@/store/bookingStore';
import { LOCATION_TEXT } from '@/lib/booking/locations';
import { lookFor, type DesignName } from '../request/looks';

const PinIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

/**
 * Wraps the step content of a design. With one location it renders the steps
 * untouched. With several it first asks where, then shows the steps with a
 * small "Location · Change" line above the service list.
 */
export default function LocationFlow({ design, children }: { design: DesignName; children: ReactNode }) {
  const locations = useBookingStore((s) => s.locations);
  const selectedId = useBookingStore((s) => s.selectedLocationId);
  const currentStep = useBookingStore((s) => s.currentStep);
  const finished = useBookingStore((s) => !!s.bookingConfirmation?.success);
  const language = useBookingStore((s) => s.language);
  const theme = useBookingStore((s) => s.theme);
  const selectLocation = useBookingStore((s) => s.selectLocation);
  const clearLocation = useBookingStore((s) => s.clearLocation);

  if (locations.length < 2 || finished) return <>{children}</>;

  const T = LOCATION_TEXT[language === 'en' ? 'en' : 'sl'];
  const look = lookFor(design, theme);
  const selected = locations.find((l) => l.id === selectedId) ?? null;

  if (!selected) {
    return (
      <div>
        <h2 className="text-[26px] font-semibold leading-tight" style={{ color: look.text, fontFamily: look.fontHeading }}>
          {T.title}
        </h2>
        <p className="mb-6 mt-2 text-[16px] leading-6" style={{ color: look.muted, fontFamily: look.fontBody }}>
          {T.subtitle}
        </p>
        <div className="flex flex-col gap-3">
          {locations.map((l, i) => (
            <motion.button
              key={l.id}
              type="button"
              onClick={() => selectLocation(l.id)}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.99 }}
              className="flex w-full items-center gap-4 p-4 text-left"
              style={{
                background: look.surface,
                color: look.surfaceText,
                borderRadius: look.radius,
                border: `1px solid ${look.border}`,
                minHeight: 64,
              }}
            >
              <span
                className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full"
                style={{ background: `${look.accent}1A`, color: look.accentText }}
              >
                <PinIcon />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[17px] font-semibold" style={{ fontFamily: look.fontHeading }}>{l.naziv}</span>
                {l.naslov && (
                  <span className="mt-0.5 block text-[14px] leading-5" style={{ fontFamily: look.fontBody, color: look.surfaceMuted }}>{l.naslov}</span>
                )}
                {l.telefon && (
                  <span className="block text-[14px] leading-5" style={{ fontFamily: look.fontBody, color: look.surfaceMuted }}>{T.call} {l.telefon}</span>
                )}
              </span>
              <span aria-hidden="true" style={{ color: look.accentText }}>→</span>
            </motion.button>
          ))}
        </div>
      </div>
    );
  }

  // Steps 1–2 let the client change it; later steps only remind where the booking is.
  const canChange = currentStep === 1 || currentStep === 2;
  const showLine = true;
  return (
    <>
      {showLine && (
        <div
          className="mb-5 flex items-center gap-3 px-4 py-3"
          style={{ background: look.surface, color: look.surfaceText, borderRadius: look.radius, border: `1px solid ${look.border}` }}
        >
          <span style={{ color: look.accentText }}><PinIcon size={18} /></span>
          <span className="min-w-0 flex-1 truncate text-[15px]" style={{ fontFamily: look.fontBody }}>
            <span style={{ color: look.surfaceMuted }}>{T.label}: </span>
            <span className="font-semibold">{selected.naziv}</span>
          </span>
          {canChange && <button
            type="button"
            onClick={clearLocation}
            className="flex-shrink-0 px-2 py-1 text-[15px] font-semibold underline-offset-2 hover:underline"
            style={{ color: look.accentText, fontFamily: look.fontBody, minHeight: 32 }}
          >
            {T.change}
          </button>}
        </div>
      )}
      {children}
    </>
  );
}
