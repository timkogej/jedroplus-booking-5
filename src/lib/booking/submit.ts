// src/lib/booking/submit.ts
//
// One place that sends a booking. Every design used to build the request on
// its own, and they drifted apart: some sent only the first service, some an
// empty list of resources, some always Slovenian. Designs now only draw the
// screens; what gets booked is decided here, from the two stores.

import { format } from 'date-fns';
import { API_BASE_URL, checkSlotAvailable } from '@/lib/api';
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
import { questionnaireAnswersPayload } from '@/lib/booking/questionnaire';

export type BookingVariant = 'classic' | 'modern' | 'elegant' | 'magazine' | 'casino' | 'seasonal';

/** Error from the booking API. `code` is the API error code, e.g. 'slot_taken'. */
export class BookingSubmitError extends Error {
  code?: string;
  constructor(message: string, code?: string) {
    super(message);
    this.name = 'BookingSubmitError';
    this.code = code;
  }
}

function unconfirmedMessage(lang: 'sl' | 'en', phone?: string | null): string {
  if (lang === 'en') {
    return `We could not confirm your booking. Before trying again, check whether you received a confirmation email, or call the salon${phone ? ` at ${phone}` : ''}.`;
  }
  return `Rezervacije ni bilo mogoče potrditi. Preden poskusite znova, preverite, ali ste prejeli potrditveni email, ali pokličite salon${phone ? ` na ${phone}` : ''}.`;
}

const SLOT_TAKEN_MESSAGE = {
  sl: 'Izbrani termin je bil medtem zaseden. Izberite drug termin.',
  en: 'That time has just been taken. Please choose another time.',
};

/** API codes that mean the chosen time is no longer free. */
const SLOT_CONFLICT_CODES = new Set(['slot_taken', 'resurs_taken', 'no_employee_available']);

/**
 * Errors after which we cannot tell whether the booking was saved: the server
 * failed (5xx), answered with nothing, or the connection dropped. Telling the
 * client to simply try again could create a second booking.
 */
function isUnconfirmed(err: unknown): boolean {
  if (err instanceof BookingSubmitError) {
    return err.code === 'http_error' || err.code === 'empty_response';
  }
  return err instanceof TypeError; // fetch network failure
}

/**
 * Text to show when sending failed: the API's own message when it refused the
 * booking, a "check your email or call" message when we do not know whether
 * it was saved, otherwise the design's fallback.
 */
export function bookingErrorMessage(err: unknown, fallback: string): string {
  const { language, company } = useBookingStore.getState();
  const lang = language === 'en' ? 'en' : 'sl';
  if (isUnconfirmed(err)) return unconfirmedMessage(lang, company?.telefon);
  if (err instanceof BookingSubmitError && err.code !== 'missing_data') {
    return err.message || fallback;
  }
  return fallback;
}

/** True when the booking was refused because the time is no longer free. */
export function isSlotConflict(err: unknown): boolean {
  return err instanceof BookingSubmitError && !!err.code && SLOT_CONFLICT_CODES.has(err.code);
}

/**
 * Sends the client back to the date step with a notice. Times are fetched
 * again when that step opens, so the taken time disappears from the list.
 */
export function returnToTimeStep(): void {
  const state = useBookingStore.getState();
  const lang = state.language === 'en' ? 'en' : 'sl';
  useBookingStore.setState({ selectedTime: null, slotNotice: SLOT_TAKEN_MESSAGE[lang] });
  state.goToStep(4);
}

/**
 * Asks the API whether the chosen time is still free. Returns null when the
 * check itself fails; the booking request checks again on the server anyway.
 */
export async function isSelectedSlotStillFree(companySlug: string): Promise<boolean | null> {
  const state = useBookingStore.getState();
  const services = getSelectedServices();
  if (!companySlug || services.length === 0 || !state.selectedDate || !state.selectedTime) return null;
  const anyPerson = !state.prikazZaposlenih || state.anyPerson;
  try {
    const res = await checkSlotAvailable({
      companySlug,
      serviceIds: services.map((s) => s.id),
      employeeId: anyPerson ? null : state.selectedEmployeeId,
      anyPerson,
      eligibleEmployeeIds: state.eligibleEmployeeIds,
      date: format(state.selectedDate, 'yyyy-MM-dd'),
      time: state.selectedTime,
      resursiIds: state.requiredResursiIds,
    });
    return typeof res.available === 'boolean' ? res.available : null;
  } catch {
    return null;
  }
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
    vprasalnikOdgovori: questionnaireAnswersPayload(),
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

  // n8n answers every create with JSON. An empty or unreadable answer means
  // the workflow stopped half way, so we cannot tell the client it worked.
  const text = await response.text();
  let parsed: Record<string, unknown> | null = null;
  try {
    parsed = text.trim() ? JSON.parse(text) : null;
  } catch {
    parsed = null;
  }
  if (!parsed || typeof parsed !== 'object') {
    throw new BookingSubmitError('Empty response', 'empty_response');
  }

  if (parsed.success !== true) {
    // A clear refusal carries success:false; anything else is unexpected.
    const code = parsed.success === false ? (parsed.error as string | undefined) : 'empty_response';
    throw new BookingSubmitError((parsed.message as string) || 'Booking failed', code);
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
    successUrl: buildSuccessUrl(companySlug, variant, {
      lang: language,
      serviceName,
      date: confirmation.datum || dateDisplay,
      time: confirmation.cas || selectedTime || undefined,
    }),
    cancelUrl: buildCancelUrl(companySlug, variant),
  });
}
