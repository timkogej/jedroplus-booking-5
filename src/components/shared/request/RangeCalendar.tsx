'use client';

import { useMemo, useState } from 'react';
import {
  addDays,
  addMonths,
  endOfMonth,
  format,
  isAfter,
  isBefore,
  isSameDay,
  isSameMonth,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { enUS, sl } from 'date-fns/locale';
import type { RequestLook } from './look';

interface Props {
  from: Date | null;
  to: Date | null;
  onChange: (from: Date, to: Date) => void;
  maxDays: number;
  lang: 'sl' | 'en';
  look: RequestLook;
}

/**
 * Month calendar for a day or a range: first tap picks a day, a later day
 * makes it a range, another tap starts over.
 */
export default function RangeCalendar({ from, to, onChange, maxDays, lang, look }: Props) {
  const today = startOfDay(new Date());
  const last = addDays(today, Math.max(1, maxDays));
  const [month, setMonth] = useState(() => startOfMonth(from ?? today));
  const locale = lang === 'en' ? enUS : sl;

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
    const end = endOfMonth(month);
    const list: Date[] = [];
    for (let d = start; !isAfter(d, end) || list.length % 7 !== 0; d = addDays(d, 1)) list.push(d);
    return list;
  }, [month]);

  const weekdays = useMemo(() => {
    const monday = startOfWeek(today, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => format(addDays(monday, i), 'EEEEEE', { locale }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  const pick = (d: Date) => {
    if (from && to && isSameDay(from, to) && isAfter(d, from)) {
      onChange(from, d);
    } else {
      onChange(d, d);
    }
  };

  const canPrev = isAfter(month, startOfMonth(today));
  const canNext = isBefore(endOfMonth(month), last);

  const navBtn = (enabled: boolean) => ({
    color: enabled ? look.surfaceText : look.surfaceMuted,
    opacity: enabled ? 1 : 0.35,
  });

  return (
    <div
      className="p-3 sm:p-4"
      style={{ background: look.surface, borderRadius: look.radius, border: `1px solid ${look.border}` }}
    >
      <div className="mb-2 flex items-center justify-between">
        <button
          type="button"
          aria-label={lang === 'en' ? 'Previous month' : 'Prejšnji mesec'}
          disabled={!canPrev}
          onClick={() => setMonth(addMonths(month, -1))}
          className="flex h-9 w-9 items-center justify-center rounded-full"
          style={navBtn(canPrev)}
        >
          ‹
        </button>
        <p className="first-cap text-sm font-semibold" style={{ color: look.surfaceText, fontFamily: look.fontHeading }}>
          {format(month, 'LLLL yyyy', { locale })}
        </p>
        <button
          type="button"
          aria-label={lang === 'en' ? 'Next month' : 'Naslednji mesec'}
          disabled={!canNext}
          onClick={() => setMonth(addMonths(month, 1))}
          className="flex h-9 w-9 items-center justify-center rounded-full"
          style={navBtn(canNext)}
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 text-center">
        {weekdays.map((w) => (
          <span key={w} className="pb-1 text-[11px] font-medium uppercase" style={{ color: look.surfaceMuted, fontFamily: look.fontBody }}>
            {w}
          </span>
        ))}
        {days.map((d) => {
          const outside = !isSameMonth(d, month);
          const disabled = isBefore(d, today) || isAfter(d, last);
          const isStart = !!from && isSameDay(d, from);
          const isEnd = !!to && isSameDay(d, to);
          const inRange = !!from && !!to && isAfter(d, from) && isBefore(d, to);
          const selected = isStart || isEnd;
          return (
            <div
              key={d.toISOString()}
              className="relative flex h-10 items-center justify-center"
              style={{
                background: inRange || (selected && from && to && !isSameDay(from, to))
                  ? `${look.accent}1F`
                  : 'transparent',
                borderTopLeftRadius: isStart ? 999 : 0,
                borderBottomLeftRadius: isStart ? 999 : 0,
                borderTopRightRadius: isEnd ? 999 : 0,
                borderBottomRightRadius: isEnd ? 999 : 0,
              }}
            >
              {!outside && (
                <button
                  type="button"
                  disabled={disabled}
                  aria-pressed={selected}
                  aria-label={format(d, 'EEEE, d. MMMM', { locale })}
                  onClick={() => pick(d)}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-sm transition-colors"
                  style={{
                    fontFamily: look.fontBody,
                    background: selected ? look.accent : 'transparent',
                    color: selected ? look.onAccent : disabled ? look.surfaceMuted : look.surfaceText,
                    opacity: disabled ? 0.35 : 1,
                    fontWeight: selected || isSameDay(d, today) ? 700 : 500,
                    textDecoration: isSameDay(d, today) && !selected ? 'underline' : 'none',
                    textUnderlineOffset: 3,
                  }}
                >
                  {format(d, 'd')}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
