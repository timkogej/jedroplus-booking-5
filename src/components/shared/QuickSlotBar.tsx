'use client';

import { addDays, format, isSameDay } from 'date-fns';
import { enUS, sl } from 'date-fns/locale';
import { useBookingStore, type TimeOfDay } from '@/store/bookingStore';
import { findFirstFreeSlot } from '@/lib/booking/slots';

interface Props {
  /** Fill of the active filter and of the button. Defaults to the brand colour. */
  accent?: string;
  /** Text on `accent`. */
  onAccent?: string;
}

const LABELS = {
  sl: {
    all: 'Vse',
    morning: 'Dopoldne',
    afternoon: 'Popoldne',
    first: 'Prvi prosti termin',
    today: 'danes',
    tomorrow: 'jutri',
    at: 'ob',
    filter: 'Del dneva',
  },
  en: {
    all: 'Any time',
    morning: 'Morning',
    afternoon: 'Afternoon',
    first: 'First free time',
    today: 'today',
    tomorrow: 'tomorrow',
    at: 'at',
    filter: 'Time of day',
  },
};

/**
 * Top of the date step: a morning/afternoon filter and a one-tap button for
 * the first free time. Before, clients had to open day after day to find one.
 * Text and borders inherit the design's colour, so it fits light and dark pages.
 */
export default function QuickSlotBar({ accent, onAccent = '#FFFFFF' }: Props) {
  const { slotsMap, isLoadingSlots, timeOfDay, setTimeOfDay, selectDate, selectTime, language, theme } =
    useBookingStore();
  const L = LABELS[language === 'en' ? 'en' : 'sl'];
  const fill = accent ?? theme.primarySolid;
  const first = isLoadingSlots ? null : findFirstFreeSlot(slotsMap, timeOfDay);

  const options: TimeOfDay[] = ['all', 'morning', 'afternoon'];

  let firstLabel = '';
  let firstDate: Date | null = null;
  if (first) {
    const [y, m, d] = first.dateKey.split('-').map(Number);
    firstDate = new Date(y, m - 1, d);
    const today = new Date();
    const day = isSameDay(firstDate, today)
      ? L.today
      : isSameDay(firstDate, addDays(today, 1))
      ? L.tomorrow
      : format(firstDate, language === 'en' ? 'EEEE, d MMMM' : 'EEEE, d. MMMM', {
          locale: language === 'en' ? enUS : sl,
        });
    firstLabel = `${day} ${L.at} ${first.time}`;
  }

  return (
    <div className="mb-5 flex flex-wrap items-center gap-2">
      <div
        role="group"
        aria-label={L.filter}
        className="inline-flex rounded-full p-0.5"
        style={{ border: '1px solid color-mix(in srgb, currentColor 22%, transparent)' }}
      >
        {options.map((opt) => {
          const active = timeOfDay === opt;
          return (
            <button
              key={opt}
              type="button"
              aria-pressed={active}
              onClick={() => setTimeOfDay(opt)}
              className="rounded-full px-3 py-1.5 text-xs font-medium transition-colors"
              style={{
                background: active ? fill : 'transparent',
                color: active ? onAccent : 'inherit',
              }}
            >
              {L[opt]}
            </button>
          );
        })}
      </div>

      {first && firstDate && (
        <button
          type="button"
          onClick={() => {
            selectDate(firstDate as Date);
            selectTime(first.time);
          }}
          className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-opacity hover:opacity-90"
          style={{ background: fill, color: onAccent }}
        >
          <span aria-hidden="true">⚡</span>
          <span>
            {L.first}: <span className="font-normal">{firstLabel}</span>
          </span>
        </button>
      )}
    </div>
  );
}
