'use client';

import { useBookingStore } from '@/store/bookingStore';

function deadline(days: number, en: boolean): string {
  if (days === 0) return en ? 'until the appointment starts' : 'do začetka termina';
  if (en) return `up to ${days === 1 ? '1 day' : `${days} days`} before the appointment`;
  return `najkasneje ${days === 1 ? '1 dan' : `${days} dni`} pred terminom`;
}

/**
 * The salon's cancellation and rescheduling deadline (Jedro+ → Nastavitve
 * rezervacij), shown under the Confirm button so the client knows it before
 * booking. Nothing is shown when the salon has no setting.
 */
export default function CancellationPolicy({ className = '' }: { className?: string }) {
  const { company, language } = useBookingStore();
  const en = language === 'en';
  const cancel = company?.cancelDays;
  const resched = company?.rescheduleDays;
  if (cancel == null && resched == null) return null;

  let text: string;
  if (cancel != null && resched != null && cancel === resched) {
    text = en
      ? `You can cancel or reschedule ${deadline(cancel, en)}.`
      : `Termin lahko odpoveste ali prestavite ${deadline(cancel, en)}.`;
  } else if (cancel != null && resched != null) {
    text = en
      ? `You can cancel ${deadline(cancel, en)} and reschedule ${deadline(resched, en)}.`
      : `Termin lahko odpoveste ${deadline(cancel, en)}, prestavite pa ${deadline(resched, en)}.`;
  } else if (cancel != null) {
    text = en ? `You can cancel ${deadline(cancel, en)}.` : `Termin lahko odpoveste ${deadline(cancel, en)}.`;
  } else {
    text = en
      ? `You can reschedule ${deadline(resched as number, en)}.`
      : `Termin lahko prestavite ${deadline(resched as number, en)}.`;
  }

  return (
    <p className={`text-center text-xs mt-2 ${className}`} style={{ opacity: 0.85 }}>
      {text}
    </p>
  );
}
