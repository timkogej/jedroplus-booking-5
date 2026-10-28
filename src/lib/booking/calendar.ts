// src/lib/booking/calendar.ts
//
// "Add to calendar" for every design. Each design used to build its own .ics
// file: without the fields Outlook and some phones require (UID, DTSTAMP),
// with only the first service's duration, without the salon's name or address,
// and in the phone's own time zone. On Android a downloaded .ics often opens
// nothing, so there we open Google Calendar instead.

import { useBookingStore } from '@/store/bookingStore';
import { usePromotionsStore } from '@/store/promotionsStore';
import { getSelectedServices } from '@/lib/booking/submit';

/** Salons are in Slovenia; booked times are local times there. */
const SALON_TIME_ZONE = 'Europe/Ljubljana';

export interface BookingEvent {
  start: Date;
  end: Date;
  title: string;
  details: string;
  location: string | null;
}

/** Offset of `timeZone` from UTC at `date`, in minutes. */
function zoneOffsetMinutes(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(date);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  const asUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'));
  return Math.round((asUtc - date.getTime()) / 60000);
}

/** The moment when the clock in `timeZone` shows this date and time. */
function wallTimeToDate(y: number, m: number, d: number, hh: number, mm: number, timeZone: string): Date {
  const guess = new Date(Date.UTC(y, m, d, hh, mm));
  const offset = zoneOffsetMinutes(guess, timeZone);
  const first = new Date(guess.getTime() - offset * 60000);
  // Correct once more in case the offset changed in between (DST switch).
  const offset2 = zoneOffsetMinutes(first, timeZone);
  return offset2 === offset ? first : new Date(guess.getTime() - offset2 * 60000);
}

/** The booked appointment as a calendar event, or null when incomplete. */
export function getBookingEvent(): BookingEvent | null {
  const { selectedDate, selectedTime, company, language, totalDurationMin } = useBookingStore.getState();
  const { selectedAddOn } = usePromotionsStore.getState();
  const services = getSelectedServices();
  if (!selectedDate || !selectedTime || services.length === 0) return null;

  const [hh, mm] = selectedTime.split(':').map(Number);
  if (!Number.isFinite(hh) || !Number.isFinite(mm)) return null;

  const servicesMin = totalDurationMin > 0 ? totalDurationMin : services.reduce((sum, s) => sum + s.trajanjeMin, 0);
  const duration = Math.max(15, servicesMin + (selectedAddOn?.trajanjeMin ?? 0));

  const start = wallTimeToDate(
    selectedDate.getFullYear(),
    selectedDate.getMonth(),
    selectedDate.getDate(),
    hh,
    mm,
    SALON_TIME_ZONE,
  );
  const end = new Date(start.getTime() + duration * 60000);

  const serviceNames = [...services.map((s) => s.naziv), ...(selectedAddOn?.naziv ? [selectedAddOn.naziv] : [])].join(' + ');
  const salon = company?.naziv?.trim();
  const title = salon ? `${serviceNames} – ${salon}` : serviceNames;
  const en = language === 'en';
  const lines = [
    `${en ? 'Booking' : 'Rezervacija'}: ${serviceNames}`,
    ...(company?.telefon ? [`${en ? 'Phone' : 'Telefon'}: ${company.telefon}`] : []),
  ];

  return { start, end, title, details: lines.join('\n'), location: company?.naslov ?? null };
}

/** 20261028T080000Z */
function utcStamp(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

/** Escape text for an .ics field (RFC 5545). */
function icsText(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/([,;])/g, '\\$1');
}

export function buildIcs(event: BookingEvent): string {
  const uid = `${utcStamp(event.start)}-${Math.random().toString(36).slice(2, 10)}@booking.jedroplus.com`;
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Jedro+//Booking//SL',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${utcStamp(new Date())}`,
    `DTSTART:${utcStamp(event.start)}`,
    `DTEND:${utcStamp(event.end)}`,
    `SUMMARY:${icsText(event.title)}`,
    `DESCRIPTION:${icsText(event.details)}`,
    ...(event.location ? [`LOCATION:${icsText(event.location)}`] : []),
    // Reminder one hour before.
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    `DESCRIPTION:${icsText(event.title)}`,
    'TRIGGER:-PT1H',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

export function googleCalendarUrl(event: BookingEvent): string {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${utcStamp(event.start)}/${utcStamp(event.end)}`,
    details: event.details,
    ctz: SALON_TIME_ZONE,
  });
  if (event.location) params.set('location', event.location);
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Adds the booked appointment to the client's calendar: Google Calendar on
 * Android, an .ics file everywhere else (iPhone and Mac open it in Calendar,
 * Windows in Outlook).
 */
export function addBookingToCalendar(): void {
  const event = getBookingEvent();
  if (!event) return;

  if (/Android/i.test(navigator.userAgent)) {
    window.open(googleCalendarUrl(event), '_blank', 'noopener');
    return;
  }

  const blob = new Blob([buildIcs(event)], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'rezervacija.ics';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
