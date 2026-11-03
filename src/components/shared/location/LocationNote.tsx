'use client';

import { useBookingStore } from '@/store/bookingStore';
import { LOCATION_TEXT } from '@/lib/booking/locations';
import { lookFor, type DesignName } from '../request/looks';

/**
 * Where the booking is: name, address and phone of the chosen location, for the
 * "booked" screen. Renders nothing with one location (nothing changes there).
 */
export default function LocationNote({ design, className = 'mt-5' }: { design: DesignName; className?: string }) {
  const locations = useBookingStore((s) => s.locations);
  const selectedId = useBookingStore((s) => s.selectedLocationId);
  const language = useBookingStore((s) => s.language);
  const theme = useBookingStore((s) => s.theme);

  const selected = locations.length > 1 ? locations.find((l) => l.id === selectedId) : null;
  if (!selected) return null;

  const T = LOCATION_TEXT[language === 'en' ? 'en' : 'sl'];
  const look = lookFor(design, theme);

  return (
    <div
      className={`flex items-start gap-3 px-4 py-3 ${className}`}
      style={{ background: look.surface, color: look.surfaceText, borderRadius: look.radius, border: `1px solid ${look.border}` }}
    >
      <span className="mt-0.5 flex-shrink-0" style={{ color: look.accentText }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
      </span>
      <span className="min-w-0 flex-1 text-[15px] leading-5" style={{ fontFamily: look.fontBody }}>
        <span className="block font-semibold">{selected.naziv}</span>
        {selected.naslov && <span className="block" style={{ color: look.surfaceMuted }}>{selected.naslov}</span>}
        {selected.telefon && <span className="block" style={{ color: look.surfaceMuted }}>{T.call} {selected.telefon}</span>}
      </span>
    </div>
  );
}
