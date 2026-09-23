/**
 * Jedroplus Booking — API layer (v2)
 *
 * All actions use POST to the booking-v2 webhook.
 * Init was previously GET — it is now POST with { action: 'init', companySlug }.
 * Slots are now range-based: send startDate+endDate, receive a map of all dates → DaySlots.
 *
 * TODO: The n8n INIT code node must return `multiple_services_online` from the
 *       "Podatki podjetij" table. Confirm this field is exposed before relying on
 *       Company.multiple_services_online in the store.
 */

import { ensureReadable, readableInkOnLight } from '@/lib/color';
import {
  InitResponse,
  RangeSlotsResponse,
  DaySlots,
  BookingConfirmation,
  Theme,
} from '@/types';

// Base URL — override via NEXT_PUBLIC_N8N_BOOKING_URL environment variable
const API_BASE_URL =
  process.env.NEXT_PUBLIC_N8N_BOOKING_URL ||
  'https://n8n.jedroplus.com/webhook/booking-v2';

/** Default visual theme — individual API-returned fields override these */
export const DEFAULT_THEME: Theme = {
  primaryColor: '#6D5EF7',
  secondaryColor: '#2AD4C5',
  bgFrom: '#F7F4FF',
  bgTo: '#EEFFFB',
};

// ─────────────────────────────────────────────────────────────────────────────
// Legacy parameter shape used by variant Confirmation components (Phase 2 compat).
// These components pass serviceId (string) and old consent fields; they will be
// upgraded to the new BookingSubmission shape in Phase 3.
// ─────────────────────────────────────────────────────────────────────────────
interface LegacyBookingParams {
  companySlug: string;
  date: string;
  time: string;
  /** Single service ID — legacy field; use serviceIds[] in new code */
  serviceId: string;
  employeeId: string | null;
  anyPerson: boolean;
  eligibleEmployeeIds?: string[];
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  gender?: string;
  notes?: string;
  gdprSendMarketing?: boolean;
  privacyConsent: boolean;
  marketingConsent?: boolean;
  consentTimestamp?: string;
  // Promotion fields (passed through from promotionsStore)
  promocijaTip?: 'popust' | 'happy_hour' | null;
  promocijaNaziv?: string | null;
  popust?: number;
  popustTip?: 'valuta' | '%';
  finalCena?: number;
  originalCena?: number;
  popust_id?: string;
  happy_hour_id?: string;
  // Add-on fields
  addOnServiceId?: string | null;
  addOnNaziv?: string | null;
  addOnFinalCena?: number;
  addOnOriginalCena?: number;
  addOnPopust?: number;
  addOnPopustTip?: 'valuta' | '%';
  addOnTrajanjeMin?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// fetchInitData
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch all company init data: company config, employees, services, resursi, theme.
 * Changed from GET to POST in v2 — body carries { action: 'init', companySlug }.
 * Returned theme is merged on top of DEFAULT_THEME (API values override defaults).
 */
export async function fetchInitData(companySlug: string): Promise<InitResponse> {
  const response = await fetch(API_BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'init', companySlug }),
  });

  if (!response.ok) {
    throw new Error(`fetchInitData failed: ${response.status}`);
  }

  const data = await response.json();

  if (data.success === false) {
    throw new Error(data.message || 'Init request failed');
  }

  // Normalize the company ID field: n8n returns the Supabase column name
  // "ID Podjetja" (with a space), but Company interface uses camelCase idPodjetja.
  if (data.company && !data.company.idPodjetja) {
    const raw = data.company as Record<string, unknown>;
    const fromSpaced = raw['ID Podjetja'] as string | undefined;
    if (fromSpaced) {
      data.company.idPodjetja = fromSpaced;
    }
  }

  // Merge returned theme on top of defaults (API values win)
  data.theme = { ...DEFAULT_THEME, ...(data.theme || {}) };

  // A very light company colour (e.g. #aaaaaa) is unreadable as text on the
  // light designs, so they use this darkened variant. Dark designs keep the
  // original colour.
  // Logo lives in a table the anon key cannot read; our own route returns it.
  if (data.company) {
    try {
      const res = await fetch(`/api/branding?slug=${encodeURIComponent(companySlug)}`);
      if (res.ok) {
        const branding = (await res.json()) as { logoUrl?: string | null };
        data.company.logo_url = branding.logoUrl ?? null;
      }
    } catch {
      // a missing logo must never break the booking page
    }
  }

  const rawPrimary = data.theme.primaryColor || DEFAULT_THEME.primaryColor;
  data.theme.primaryOnLight = readableInkOnLight(rawPrimary);
  data.theme.primarySolid = ensureReadable(rawPrimary);

  return data as InitResponse;
}

// ─────────────────────────────────────────────────────────────────────────────
// fetchTimeSlotsRange — new range-based slots API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch available time slots for a date range (new range-based API).
 * Returns a map of 'yyyy-MM-dd' → DaySlots for every day in [startDate, endDate].
 * DaySlots is string[] (available times), 'fully_booked', or 'unavailable'.
 */
export async function fetchTimeSlotsRange(params: {
  companySlug: string;
  /** 1–3 service IDs — total duration = sum of their trajanjeMin */
  serviceIds: string[];
  /** Specific employee text ID; null when anyPerson=true */
  employeeId: string | null;
  anyPerson: boolean;
  /** Intersection of employees that can perform ALL selected services */
  eligibleEmployeeIds: string[];
  /** Range start in 'yyyy-MM-dd' format */
  startDate: string;
  /** Range end in 'yyyy-MM-dd' format */
  endDate: string;
  /** Optional resurs row IDs — used for resource capacity checks in n8n */
  resursiIds?: number[];
}): Promise<RangeSlotsResponse> {
  const body: Record<string, unknown> = {
    action: 'slots',
    companySlug: params.companySlug,
    serviceIds: params.serviceIds,
    employeeId: params.employeeId,
    any_person: params.anyPerson,
    eligibleEmployeeIds: params.eligibleEmployeeIds,
    startDate: params.startDate,
    endDate: params.endDate,
  };

  if (params.resursiIds && params.resursiIds.length > 0) {
    body.resursiIds = params.resursiIds;
  }

  const response = await fetch(API_BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`fetchTimeSlotsRange failed: ${response.status}`);
  }

  const data = await response.json();

  if (data.success === false) {
    throw new Error(data.message || 'Slots request failed');
  }

  return data as RangeSlotsResponse;
}

// ─────────────────────────────────────────────────────────────────────────────
// fetchTimeSlots — backward-compatible single-day wrapper (used by variant components)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Backward-compatible single-day slots wrapper.
 * Calls fetchTimeSlotsRange with startDate=endDate=date, extracts that day's
 * slots and returns string[]. Returns empty array for 'fully_booked'/'unavailable'.
 * Variant components call this; do not remove until Phase 3 is complete.
 */
export async function fetchTimeSlots(
  companySlug: string,
  date: string,
  serviceId: string,
  employeeId: string | null,
  anyPerson: boolean,
  eligibleEmployeeIds?: string[]
): Promise<string[]> {
  const result = await fetchTimeSlotsRange({
    companySlug,
    serviceIds: [serviceId],
    employeeId,
    anyPerson,
    eligibleEmployeeIds: eligibleEmployeeIds ?? [],
    startDate: date,
    endDate: date,
  });

  const daySlots: DaySlots | undefined = result.slots[date];

  if (!daySlots || daySlots === 'fully_booked' || daySlots === 'unavailable') {
    return [];
  }

  return daySlots;
}

// ─────────────────────────────────────────────────────────────────────────────
// checkSlotAvailable
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Check whether a specific date+time slot is still available before submitting.
 * Prevents double-bookings when the calendar is busy.
 */
export async function checkSlotAvailable(params: {
  companySlug: string;
  /** 1–3 service IDs */
  serviceIds: string[];
  employeeId: string | null;
  anyPerson: boolean;
  eligibleEmployeeIds: string[];
  /** Date in 'yyyy-MM-dd' format */
  date: string;
  /** Time in 'HH:mm' format */
  time: string;
  resursiIds?: number[];
}): Promise<{ available: boolean; reason?: string }> {
  const body: Record<string, unknown> = {
    action: 'check-slots',
    companySlug: params.companySlug,
    serviceIds: params.serviceIds,
    employeeId: params.employeeId,
    any_person: params.anyPerson,
    eligibleEmployeeIds: params.eligibleEmployeeIds,
    date: params.date,
    time: params.time,
  };

  if (params.resursiIds && params.resursiIds.length > 0) {
    body.resursiIds = params.resursiIds;
  }

  const response = await fetch(API_BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`checkSlotAvailable failed: ${response.status}`);
  }

  const data = await response.json();

  if (data.success === false) {
    throw new Error(data.message || 'Slot check failed');
  }

  return data as { available: boolean; reason?: string };
}

// ─────────────────────────────────────────────────────────────────────────────
// submitBooking — legacy-compatible wrapper (Phase 2)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Submit a confirmed booking.
 *
 * Accepts the legacy single-serviceId shape used by variant Confirmation components
 * (Phase 2 backward compat). Internally maps to the v2 API body. Phase 3 will
 * update variant components to pass the full BookingSubmission from types/index.ts.
 *
 * On structured error responses (success:false + error code), throws an Error
 * with the localised message; attaches the error code as `.code` so the UI
 * can react to 'no_employee_for_combination', 'slot_taken', etc.
 */
export async function submitBooking(
  data: LegacyBookingParams
): Promise<BookingConfirmation> {
  const body: Record<string, unknown> = {
    action: 'create',
    companySlug: data.companySlug,
    date: data.date,
    time: data.time,
    // Map legacy serviceId → new serviceIds array
    serviceIds: [data.serviceId],
    employeeId: data.employeeId,
    any_person: data.anyPerson,
    eligibleEmployeeIds: data.eligibleEmployeeIds ?? [],
    resursiIds: [],
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    phone: data.phone,
    gender: data.gender ?? '',
    notes: data.notes ?? '',
    privacy_consent: data.privacyConsent,
    marketing_consent: data.marketingConsent ?? data.gdprSendMarketing ?? false,
    consent_timestamp: data.consentTimestamp ?? new Date().toISOString(),
    language: 'sl',
  };

  if (data.originalCena !== undefined) body.originalCena = data.originalCena;
  if (data.finalCena !== undefined) body.finalCena = data.finalCena;

  // Promotion fields — only include when present
  if (data.promocijaTip) {
    body.promocijaTip = data.promocijaTip;
    body.promocijaNaziv = data.promocijaNaziv ?? null;
    body.popust = data.popust;
    body.popustTip = data.popustTip;
    if (data.popust_id) body.popust_id = data.popust_id;
    if (data.happy_hour_id) body.happy_hour_id = data.happy_hour_id;
  }

  // Add-on fields — only include when present
  if (data.addOnServiceId) {
    body.addOnServiceId = data.addOnServiceId;
    body.addOnNaziv = data.addOnNaziv ?? null;
    body.addOnFinalCena = data.addOnFinalCena;
    body.addOnOriginalCena = data.addOnOriginalCena;
    body.addOnPopust = data.addOnPopust;
    body.addOnPopustTip = data.addOnPopustTip;
    body.addOnTrajanjeMin = data.addOnTrajanjeMin;
  }

  const response = await fetch(API_BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`submitBooking failed: ${response.status}`);
  }

  const text = await response.text();

  // Empty/non-JSON body → treat as success
  if (!text || text.trim() === '') {
    return { success: true, message: 'Rezervacija uspešna!', storitev: '', datum: '', cas: '' };
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(text);
  } catch {
    // Non-JSON 200 OK → treat as success
    return { success: true, message: 'Rezervacija uspešna!', storitev: '', datum: '', cas: '' };
  }

  if (parsed.success === false) {
    const err = new Error(
      (parsed.message as string) || 'Booking failed'
    ) as Error & { code?: string };
    err.code = parsed.error as string | undefined;
    throw err;
  }

  return parsed as unknown as BookingConfirmation;
}
