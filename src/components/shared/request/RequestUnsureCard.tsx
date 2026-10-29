'use client';

import { motion } from 'framer-motion';
import { useBookingStore } from '@/store/bookingStore';
import { REQUEST_TEXT, useIsRequestMode, useRequestStore } from '@/lib/booking/request';
import type { RequestLook } from './look';
import { casinoLook, classicLook, elegantLook, magazineLook, modernLook, seasonalLook } from './looks';

export type DesignName = 'classic' | 'modern' | 'elegant' | 'seasonal' | 'casino' | 'magazine';

function lookFor(design: DesignName, theme: Parameters<typeof classicLook>[0]): RequestLook {
  switch (design) {
    case 'modern': return modernLook(theme);
    case 'elegant': return elegantLook(theme);
    case 'seasonal': return seasonalLook(theme);
    case 'casino': return casinoLook();
    case 'magazine': return magazineLook(theme);
    default: return classicLook(theme);
  }
}

/**
 * Top of the service list in request mode: for clients who don't know which
 * service they need. Skips straight to "when and what", without a service.
 */
export default function RequestUnsureCard({ design }: { design: DesignName }) {
  const isRequest = useIsRequestMode();
  const language = useBookingStore((s) => s.language);
  const theme = useBookingStore((s) => s.theme);
  const look = lookFor(design, theme);
  if (!isRequest) return null;
  const T = REQUEST_TEXT[language === 'en' ? 'en' : 'sl'];

  const choose = () => {
    useBookingStore.setState({ selectedServices: [], selectedService: null, totalDurationMin: 0, requiredResursiIds: [] });
    useRequestStore.getState().setUnsure(true);
    useBookingStore.getState().goToStep(4);
  };

  return (
    <motion.button
      type="button"
      onClick={choose}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.99 }}
      className="mb-5 flex w-full items-center gap-4 p-4 text-left transition-shadow"
      style={{
        background: look.surface,
        color: look.surfaceText,
        borderRadius: look.radius,
        border: `1.5px dashed ${look.accent}66`,
      }}
    >
      <span
        aria-hidden="true"
        className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full"
        style={{ background: `${look.accent}1A`, color: look.accentText }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          <path d="M8 9h8M8 13h5" />
        </svg>
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-semibold" style={{ fontFamily: look.fontHeading }}>
          {T.unsureTitle}
        </span>
        <span className="mt-0.5 block text-[13px] leading-5" style={{ fontFamily: look.fontBody, color: look.surfaceMuted }}>
          {T.unsureText}
        </span>
      </span>
      <span aria-hidden="true" style={{ color: look.accentText }}>
        →
      </span>
    </motion.button>
  );
}
