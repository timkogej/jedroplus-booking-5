'use client';

import { useEffect } from 'react';
import { useBookingStore } from '@/store/bookingStore';
import { downloadIcs, openInGoogleCalendar, useCalendarChooser } from '@/lib/booking/calendar';

const LABELS = {
  sl: { title: 'Dodaj v koledar', google: 'Google Koledar', apple: 'Apple Koledar ali Outlook', close: 'Zapri' },
  en: { title: 'Add to calendar', google: 'Google Calendar', apple: 'Apple Calendar or Outlook', close: 'Close' },
};

/** Desktop choice of calendar; opened by addBookingToCalendar(). */
export default function CalendarChooser() {
  const { open, setOpen } = useCalendarChooser();
  const language = useBookingStore((s) => s.language);
  const L = LABELS[language === 'en' ? 'en' : 'sl'];

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, setOpen]);

  if (!open) return null;

  const choose = (action: () => void) => {
    action();
    setOpen(false);
  };

  const button =
    'w-full rounded-xl border px-4 py-3 text-left text-sm font-medium transition-colors hover:bg-gray-50';

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: 'rgba(17,24,39,0.45)' }}
      onClick={() => setOpen(false)}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={L.title}
        className="w-full max-w-xs rounded-2xl bg-white p-5 shadow-xl"
        style={{ color: '#111827', fontFamily: 'var(--font-inter), system-ui, sans-serif' }}
        onClick={(e) => e.stopPropagation()}
      >
        <p className="mb-4 text-base font-semibold">{L.title}</p>
        <div className="space-y-2">
          <button type="button" autoFocus className={button} style={{ borderColor: '#E5E7EB' }} onClick={() => choose(openInGoogleCalendar)}>
            {L.google}
          </button>
          <button type="button" className={button} style={{ borderColor: '#E5E7EB' }} onClick={() => choose(downloadIcs)}>
            {L.apple}
          </button>
        </div>
        <button type="button" className="mt-4 w-full text-center text-sm" style={{ color: '#4B5563' }} onClick={() => setOpen(false)}>
          {L.close}
        </button>
      </div>
    </div>
  );
}
