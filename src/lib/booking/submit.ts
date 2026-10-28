// src/lib/booking/submit.ts
//
// One place that sends a booking. Every design used to build the request on
// its own, and they drifted apart: some sent only the first service, some an
// empty list of resources, some always Slovenian. Designs now only draw the
// screens; what gets booked is decided here, from the two stores.

import { format } from 'date-fns';
import { API_BASE_URL } from '@/lib/api';
import {
  getBookingPricing,
  getPromotionPopustTip,
  resolvePrimaryPromotion,
  type BookingPricing,
} from '@/lib/pricing';
import { buildCancelUrl, buildSuccessUrl, redirectToCheckout } from '@/lib/checkout';
import { useBookingStore } from '@/store/bookingStore';
import { usePromotionsStore } from '@/store/promotionsStore';
import type { BookingConfirmation, Service } from '@/types';

export type BookingVariant = 'classic' | 'modern' | 'elegant' | 'magazine' | 'casino' | 'seasonal' | 'default';

/** Error from the booking API. `code` is the API error code, e.g. 'slot_taken'. */
export class BookingSubmitError extends Error {
  code?: string;
  constructor(message: string, code?: string) {
    super(message);
    this.name = 'BookingSubmitError';
    this.code = code;
  }
}

/**
 * Text to show when sending failed: the API's own message when it refused the
 * booking (e.g. the slot was just taken), otherwise the design's fallback.
 */
export function bookingErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof BookingSubmitError && err.code !== 'http_error' && err.code !== 'missing_data') {
    return err.message || fallback;
  }
  return fallback;
}

export interface SubmitResult {
  confirmation: BookingConfirmation;
  services: Service[];
  /** Name(s) to show: from the API, else the selected services joined with " + ". */
  serviceName: string;
  pricing: BookingPricing;
}

/** All selected services (1–3). Falls back to the single-select field. */
export function getSelectedServices(): Service[] {
  const { selectedServices, selectedService } = useBookingStore.getState();
  if (selectedServices.length > 0) return selectedServices;
  return selectedService ? [selectedService] : [];
}

/** Price of the current selection, the same way every design shows it. */
export function getCurrentPricing(services = getSelectedServices()): BookingPricing {
  const { serviceDiscounts, activePromotion, selectedAddOn } = usePromotionsStore.getState();
  const promotion = resolvePrimaryPromotion(services, serviceDiscounts, activePromotion);
  return getBookingPricing(services, promotion, selectedAddOn);
}

/** True when everything needed to send the booking is filled in. */
export function hasCompleteBooking(): boolean {
  const { selectedDate, selectedTime, customerDetails } = useBookingStore.getState();
  return getSelectedServices().length > 0 && !!selectedDate && !!selectedTime && !!customerDetails;
}

/** The request body for action 'create', built from the stores. */
export function buildCreateBody(companySlug: string): Record<string, unknown> {
  const state = useBookingStore.getState();
  const { selectedAddOn } = usePromotionsStore.getState();
  const services = getSelectedServices();
  const pricing = getCurrentPricing(services);
  const { customerDetails, selectedDate, selectedTime } = state;

  if (!companySlug || services.length === 0 || !selectedDate || !selectedTime || !customerDetails) {
    throw new BookingSubmitError('Missing booking data', 'missing_data');
  }

  // With the employee step hidden the client never picks a person.
  const anyPerson = !state.prikazZaposlenih || state.anyPerson;
  const employeeId = anyPerson ? null : state.selectedEmployeeId;

  const body: Record<string, unknown> = {
    action: 'create',
    companySlug,
    date: format(selectedDate, 'yyyy-MM-dd'),
    time: selectedTime,
    serviceIds: services.map((s) => s.id),
    employeeId,
    any_person: anyPerson,
    eligibleEmployeeIds: state.eligibleEmployeeIds,
    resursiIds: state.requiredResursiIds,
    firstName: customerDetails.firstName,
    lastName: customerDetails.lastName,
    email: customerDetails.email,
    phone: customerDetails.phone,
    gender: customerDetails.gender ?? '',
    notes: customerDetails.notes ?? '',
    privacy_consent: customerDetails.privacyConsent ?? false,
    marketing_consent: customerDetails.gdprSendMarketing ?? false,
    consent_timestamp: new Date().toISOString(),
    language: state.language,
    originalCena: pricing.originalTotal,
    finalCena: pricing.finalTotal,
  };

  const promotion = pricing.promotion;
  if (promotion) {
    body.promocijaTip = promotion.type;
    body.promocijaNaziv = promotion.naziv ?? null;
    body.popust = pricing.discountAmount;
    body.popustTip = getPromotionPopustTip(promotion);
    if (promotion.type === 'popust') body.popust_id = promotion.id;
    if (promotion.type === 'happy_hour') body.happy_hour_id = promotion.id;
  }

  if (selectedAddOn) {
    body.addOnServiceId = selectedAddOn.id;
    body.addOnNaziv = selectedAddOn.naziv ?? null;
    body.addOnFinalCena = selectedAddOn.finalCena;
    body.addOnOriginalCena = selectedAddOn.originalCena;
    body.addOnPopust = selectedAddOn.popustZnesek;
    body.addOnPopustTip = selectedAddOn.tipPopusta === 'percentage' ? '%' : 'valuta';
    body.addOnTrajanjeMin = selectedAddOn.trajanjeMin;
  }

  return body;
}

/**
 * Send the current booking. Throws BookingSubmitError when the API refuses it.
 * Does not touch any screen state; the design decides what to show.
 */
export async function submitCurrentBooking(companySlug: string): Promise<SubmitResult> {
  const body = buildCreateBody(companySlug);
  const services = getSelectedServices();
  const pricing = getCurrentPricing(services);

  const response = await fetch(API_BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new BookingSubmitError(`HTTP ${response.status}`, 'http_error');
  }

  // An empty or non-JSON 200 has always counted as success; kept as it was.
  const text = await response.text();
  let parsed: Record<string, unknown> = { success: true };
  if (text && text.trim() !== '') {
    try {
      parsed = JSON.parse(text);
    } catch {
      /* keep default */
    }
  }

  if (parsed.success === false) {
    throw new BookingSubmitError(
      (parsed.message as string) || 'Booking failed',
      parsed.error as string | undefined,
    );
  }

  const confirmation = { success: true, ...parsed } as unknown as BookingConfirmation;
  const serviceName = confirmation.storitev || services.map((s) => s.naziv).join(' + ');
  return { confirmation, services, serviceName, pricing };
}

/**
 * Sends the client to Stripe when the API asked for payment. The appointment
 * already exists as 'pending_payment'. Throws if the payment page could not be
 * opened; on success the browser leaves the page.
 */
export async function startCheckout(
  result: SubmitResult,
  companySlug: string,
  variant: BookingVariant,
  dateDisplay: string,
): Promise<void> {
  const { customerDetails, language, selectedTime } = useBookingStore.getState();
  const { confirmation, serviceName, pricing } = result;
  // The default design has no success page of its own; classic's works for any slug.
  const pageVariant = variant === 'default' ? 'classic' : variant;

  await redirectToCheckout({
    companySlug,
    appointmentId: String(
      confirmation.terminRowId ?? confirmation.terminId ?? confirmation.stripe?.terminId ?? '',
    ),
    amount: confirmation.paymentAmount ?? confirmation.stripe?.amount ?? pricing.finalTotal,
    currency: confirmation.currency ?? confirmation.stripe?.currency ?? 'EUR',
    serviceName,
    customerEmail: customerDetails?.email ?? '',
    customerName: customerDetails ? `${customerDetails.firstName} ${customerDetails.lastName}` : '',
    language,
    paymentMode: confirmation.paymentMode ?? confirmation.stripe?.paymentMode ?? 'full',
    successUrl: buildSuccessUrl(companySlug, pageVariant, {
      lang: language,
      serviceName,
      date: confirmation.datum || dateDisplay,
      time: confirmation.cas || selectedTime || undefined,
    }),
    cancelUrl: variant === 'default'
      ? new URL(`/${companySlug}`, window.location.origin).toString()
      : buildCancelUrl(companySlug, variant),
  });
}
