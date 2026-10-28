// src/lib/booking/share.ts
//
// "Share" on the success page, the same in every design. Before, it sent only
// "Booking confirmed" plus the service and time: no salon, no address and no
// link, so an email arrived as two bare lines and messengers had nothing to
// preview. Now it carries the salon, when, where and the booking link (which
// shows the salon's picture in iMessage, WhatsApp, Viber and Apple Mail).

import { format } from 'date-fns';
import { enUS, sl } from 'date-fns/locale';
import { useBookingStore } from '@/store/bookingStore';
import { getSelectedServices } from '@/lib/booking/submit';

export interface ShareContent {
  title: string;
  text: string;
  url: string;
}

/** Link to the salon's booking page in the design the client used. */
function bookingPageUrl(): string {
  const { company } = useBookingStore.getState();
  if (typeof window === 'undefined') return '';
  const slug = company?.slug;
  const [, first, second] = window.location.pathname.split('/');
  const variant = second && second !== 'success' ? `/${second}` : '';
  return `${window.location.origin}/${slug || first}${variant}`;
}

export function getShareContent(): ShareContent {
  const { company, language, selectedDate, selectedTime, bookingConfirmation } = useBookingStore.getState();
  const en = language === 'en';
  const salon = company?.naziv?.trim() || '';
  const services = getSelectedServices().map((s) => s.naziv).join(' + ') || bookingConfirmation?.storitev || '';

  const when = selectedDate
    ? `${format(selectedDate, en ? 'EEEE, d MMMM yyyy' : 'EEEE, d. MMMM yyyy', { locale: en ? enUS : sl })}${
        selectedTime ? ` ${en ? 'at' : 'ob'} ${selectedTime}` : ''
      }`
    : [bookingConfirmation?.datum, bookingConfirmation?.cas].filter(Boolean).join(en ? ' at ' : ' ob ');

  const lines = en
    ? [
        salon ? `I have an appointment at ${salon}.` : 'I have an appointment.',
        services && `Service: ${services}`,
        when && `When: ${when}`,
        company?.naslov && `Where: ${company.naslov}`,
      ]
    : [
        salon ? `Imam rezerviran termin pri ${salon}.` : 'Imam rezerviran termin.',
        services && `Storitev: ${services}`,
        when && `Kdaj: ${when}`,
        company?.naslov && `Kje: ${company.naslov}`,
      ];

  const title = en
    ? `Appointment${salon ? ` at ${salon}` : ''}${services ? ` – ${services}` : ''}`
    : `Termin${salon ? ` pri ${salon}` : ''}${services ? ` – ${services}` : ''}`;

  return { title, text: lines.filter(Boolean).join('\n'), url: bookingPageUrl() };
}

/**
 * Opens the phone's share sheet (email, SMS, WhatsApp …). Where there is none
 * (most desktop browsers) the text and link are copied instead.
 * Returns what happened so the design can show "Copied".
 */
export async function shareBooking(): Promise<'shared' | 'copied' | null> {
  const { title, text, url } = getShareContent();
  if (typeof navigator === 'undefined') return null;
  if (navigator.share) {
    try {
      // The link goes separately: apps then show it as a preview card.
      await navigator.share({ title, text, url });
      return 'shared';
    } catch {
      return null; // cancelled
    }
  }
  if (navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(`${text}\n${url}`);
      return 'copied';
    } catch {
      return null;
    }
  }
  return null;
}
