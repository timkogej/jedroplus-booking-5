'use client';

import { format } from 'date-fns';
import { useBookingStore } from '@/store/bookingStore';
import { usePromotionsStore } from '@/store/promotionsStore';
import { formatBookingPrice, getBookingPricing, resolvePrimaryPromotion } from '@/lib/pricing';
import { dateLocale, datePattern, t } from '../i18n';

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

/**
 * Booking summary in the right column on wide screens. The page used to leave
 * that half empty and never showed the price until the last step.
 */
export default function ElegantSummary() {
  const {
    theme,
    language,
    selectedService,
    selectedServices,
    selectedEmployeeId,
    anyPerson,
    employeesUI,
    prikazZaposlenih,
    selectedDate,
    selectedTime,
  } = useBookingStore();
  const { activePromotion, serviceDiscounts, selectedAddOn } = usePromotionsStore();

  const services =
    selectedServices.length > 0 ? selectedServices : selectedService ? [selectedService] : [];
  const promotion = resolvePrimaryPromotion(services, serviceDiscounts, activePromotion);
  const pricing = getBookingPricing(services, promotion, selectedAddOn);
  const employee = employeesUI.find((e) => e.id === selectedEmployeeId);
  const duration =
    services.reduce((sum, s) => sum + s.trajanjeMin, 0) + (selectedAddOn?.trajanjeMin ?? 0);

  const rows = [
    { label: t(language, 'fieldService'), value: services.map((s) => s.naziv).join(' + ') },
    { label: t(language, 'fieldAddOn'), value: selectedAddOn?.naziv },
    { label: t(language, 'fieldDuration'), value: duration > 0 ? formatDuration(duration) : undefined },
    {
      label: t(language, 'fieldSpecialist'),
      value: prikazZaposlenih
        ? anyPerson
          ? t(language, 'anyoneAvailable')
          : employee?.label
        : undefined,
    },
    {
      label: t(language, 'fieldDate'),
      value: selectedDate
        ? format(selectedDate, datePattern(language, 'EEEE, d. MMMM'), { locale: dateLocale(language) })
        : undefined,
    },
    { label: t(language, 'fieldTime'), value: selectedTime ?? undefined },
  ].filter((r) => r.value);

  return (
    <aside
      className="hidden xl:block w-72 flex-shrink-0 self-start sticky top-10 rounded-2xl border p-6"
      style={{ borderColor: '#F3F4F6', background: '#FFFFFF' }}
      aria-label={t(language, 'summaryTitle')}
    >
      <p
        className="mb-4"
        style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.05rem', color: '#111111' }}
      >
        {t(language, 'summaryTitle')}
      </p>

      {services.length === 0 ? (
        <p className="text-sm" style={{ color: '#6B7280' }}>
          {t(language, 'summaryEmpty')}
        </p>
      ) : (
        <>
          <dl className="space-y-3">
            {rows.map((row) => (
              <div key={row.label}>
                <dt className="text-xs uppercase tracking-wide" style={{ color: '#6B7280' }}>
                  {row.label}
                </dt>
                <dd className="text-sm mt-0.5 first-cap" style={{ color: '#111111' }}>
                  {row.value}
                </dd>
              </div>
            ))}
          </dl>

          <div
            className="mt-5 pt-4 border-t flex items-baseline justify-between"
            style={{ borderColor: '#F3F4F6' }}
          >
            <span className="text-sm" style={{ color: '#6B7280' }}>
              {t(language, 'total')}
            </span>
            <span className="text-right">
              {pricing.hasDiscount && (
                <span className="block text-xs line-through" style={{ color: '#6B7280' }}>
                  {formatBookingPrice(pricing.originalTotal)}
                </span>
              )}
              <span
                style={{
                  fontFamily: 'var(--font-playfair)',
                  fontSize: '1.35rem',
                  color: theme.primarySolid,
                }}
              >
                {formatBookingPrice(pricing.finalTotal)}
              </span>
            </span>
          </div>
        </>
      )}
    </aside>
  );
}
