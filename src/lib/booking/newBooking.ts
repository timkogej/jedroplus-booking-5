// src/lib/booking/newBooking.ts
//
// "Nova rezervacija" on the success step, the same in every design. It used to
// wipe the salon's data too (or reload the page), so the client landed on an
// empty start page. Now only the client's choices are cleared.

import { useBookingStore } from '@/store/bookingStore';
import { usePromotionsStore } from '@/store/promotionsStore';
import { useRequestStore } from '@/lib/booking/request';

export function startNewBooking(): void {
  usePromotionsStore.getState().resetSelections();
  useBookingStore.getState().reset();
  useRequestStore.getState().reset();
  if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
}
