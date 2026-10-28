// src/lib/booking/slots.ts
//
// Helpers for the free times every design shows on the date step.

import type { TimeOfDay } from '@/store/bookingStore';
import type { DaySlots } from '@/types';

const NOON = 12 * 60;

function minutesOf(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

/** Times that fall in the chosen part of the day (morning = before noon). */
export function filterTimes(times: string[], timeOfDay: TimeOfDay): string[] {
  if (timeOfDay === 'all') return times;
  return times.filter((t) => (timeOfDay === 'morning' ? minutesOf(t) < NOON : minutesOf(t) >= NOON));
}

/**
 * The earliest free time in the loaded range, respecting the part-of-day
 * filter. Times already past today are skipped.
 */
export function findFirstFreeSlot(
  slotsMap: Record<string, DaySlots>,
  timeOfDay: TimeOfDay,
  now: Date = new Date(),
): { dateKey: string; time: string } | null {
  const pad = (n: number) => String(n).padStart(2, '0');
  const todayKey = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const nowMin = now.getHours() * 60 + now.getMinutes();

  for (const dateKey of Object.keys(slotsMap).sort()) {
    if (dateKey < todayKey) continue;
    const day = slotsMap[dateKey];
    if (!Array.isArray(day)) continue;
    const times = filterTimes([...day].sort(), timeOfDay).filter(
      (t) => dateKey !== todayKey || minutesOf(t) > nowMin,
    );
    if (times.length > 0) return { dateKey, time: times[0] };
  }
  return null;
}
