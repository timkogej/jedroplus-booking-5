'use client';

import { useBookingStore } from '@/store/bookingStore';

/**
 * "That time was just taken" message on the date step. Same look in every
 * design (dark text on amber) so it stays readable on light and dark pages.
 */
export default function SlotNotice() {
  const slotNotice = useBookingStore((s) => s.slotNotice);
  if (!slotNotice) return null;
  return (
    <div
      role="alert"
      className="mb-5 rounded-xl px-4 py-3 text-sm"
      style={{
        background: '#FEF3C7',
        border: '1px solid #F59E0B',
        color: '#78350F',
        fontFamily: 'var(--font-inter), system-ui, sans-serif',
      }}
    >
      {slotNotice}
    </div>
  );
}
