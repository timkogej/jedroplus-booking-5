'use client';

import { useEffect } from 'react';
import { useBookingStore } from '@/store/bookingStore';
import { isSelectedSlotStillFree, returnToTimeStep } from '@/lib/booking/submit';

/**
 * On the review step, checks once that the chosen time is still free. Filling
 * the form takes a few minutes and someone else may book the time meanwhile;
 * better to say so now than after the client presses Confirm.
 */
export function useSlotRecheck(companySlug: string | undefined): void {
  const isSuccess = useBookingStore((s) => !!s.bookingConfirmation?.success);
  useEffect(() => {
    if (isSuccess) return;
    let cancelled = false;
    if (!companySlug) return;
    isSelectedSlotStillFree(companySlug).then((free) => {
      if (!cancelled && free === false) returnToTimeStep();
    });
    return () => {
      cancelled = true;
    };
  // Only when the review step opens.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
