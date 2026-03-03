'use client';

import { format } from 'date-fns';
import { sl } from 'date-fns/locale';
import { useBookingStore } from '@/store/bookingStore';

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

interface SummaryRow {
  label: string;
  value: React.ReactNode;
}

export default function MagazineSummary() {
  const {
    theme,
    employeesUI,
    selectedEmployeeId,
    anyPerson,
    selectedService,
    selectedDate,
    selectedTime,
  } = useBookingStore();

  const selectedEmployee = employeesUI.find((e) => e.id === selectedEmployeeId);

  const rows: SummaryRow[] = [];

  if (selectedEmployee || anyPerson) {
    rows.push({
      label: 'Specialist',
      value: selectedEmployee ? selectedEmployee.label : 'Kdorkoli prost',
    });
  }

  if (selectedService) {
    rows.push({ label: 'Storitev', value: selectedService.naziv });
    rows.push({ label: 'Trajanje', value: formatDuration(selectedService.trajanjeMin) });
  }

  if (selectedDate) {
    rows.push({
      label: 'Datum',
      value: format(selectedDate, 'd. MMMM yyyy', { locale: sl }),
    });
  }

  if (selectedTime) {
    rows.push({ label: 'Ura', value: selectedTime });
  }

  if (rows.length === 0) return null;

  return (
    <div>
      <p className="magazine-caps text-[9px] tracking-[0.22em] text-[#6B6B6B] mb-4">
        Vaša rezervacija
      </p>

      <div className="h-[1px] bg-black/10 mb-5" />

      <div className="space-y-4">
        {rows.map((row, i) => (
          <div key={i} className="flex justify-between items-baseline gap-4">
            <p className="magazine-caps text-[8px] tracking-[0.18em] text-[#6B6B6B] flex-shrink-0">
              {row.label}
            </p>
            <p className="magazine-body text-[13px] text-[#1A1A1A] text-right">{row.value}</p>
          </div>
        ))}
      </div>

      {selectedService && (
        <>
          <div className="h-[1px] bg-black/10 my-5" />
          <div className="flex justify-between items-baseline">
            <p className="magazine-caps text-[8px] tracking-[0.18em] text-[#6B6B6B]">
              Skupaj
            </p>
            <p
              className="magazine-serif text-[1.4rem] font-light tabular-nums"
              style={{ color: theme.primaryColor }}
            >
              €{selectedService.cena}
            </p>
          </div>
        </>
      )}
    </div>
  );
}
