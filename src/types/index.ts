// ─────────────────────────────────────────────────────────────────────────────
// Core visual theme — colors applied to gradient backgrounds, buttons, accents
// ─────────────────────────────────────────────────────────────────────────────
export interface Theme {
  primaryColor: string;
  secondaryColor: string;
  bgFrom: string;
  bgTo: string;
  /**
   * The company colour darkened until it is readable as TEXT on the light
   * backgrounds of the classic and elegant designs. Decorative uses (borders,
   * shadows, tinted fills) keep `primaryColor`.
   */
  primaryOnLight?: string;
  /**
   * The company colour darkened just enough to carry white text (buttons and
   * other solid fills). Keeps the hue, unlike `primaryOnLight`.
   */
  primarySolid?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Employee — full record from "Osebe" table
// ─────────────────────────────────────────────────────────────────────────────
export interface Employee {
  id: string;
  name: string;
  title: string;
  avatar?: string;
  specializations: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// EmployeeUI — display-only shape used in employee selection step
// ─────────────────────────────────────────────────────────────────────────────
export interface EmployeeUI {
  id: string;
  /** Full display name e.g. "Ana Novak" */
  label: string;
  /** Job title e.g. "Senior Stylist" */
  subtitle: string;
  /** Two-letter initials for avatar fallback e.g. "AN" */
  initials: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Category — derived from distinct "Kategorija" values on "Storitve" table
// ─────────────────────────────────────────────────────────────────────────────
export interface Category {
  id: string;
  name: string;
  service_count: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Service — one bookable service from "Storitve" table
// ─────────────────────────────────────────────────────────────────────────────
export interface Service {
  id: string;
  category_id: string;
  naziv: string;
  opis: string;
  trajanjeMin: number;
  cena: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// TimeSlot — legacy type; slots API returns string[] not TimeSlot[]
// Kept for backwards compatibility — not actively used in new code
// ─────────────────────────────────────────────────────────────────────────────
export interface TimeSlot {
  time: string;
  available: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// CustomerDetails — collected in step 5 (CustomerDetails component)
// ─────────────────────────────────────────────────────────────────────────────
export interface CustomerDetails {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  gender?: string;
  notes?: string;
  gdprSendMarketing?: boolean;
  privacyConsent: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// BookingData — legacy shape used in older BookingPage component
// Kept for backwards compatibility
// ─────────────────────────────────────────────────────────────────────────────
export interface BookingData {
  employeeId: string | null;
  categoryId: string | null;
  serviceId: string | null;
  date: Date | null;
  time: string | null;
  customer: CustomerDetails | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// BookingStep — includes step 7 for Stripe payment gate
//   1 = CategorySelection
//   2 = ServiceSelection
//   3 = EmployeeSelection
//   4 = DateTimeSelection
//   5 = CustomerDetails
//   6 = Confirmation (review + submit)
//   7 = Payment (Stripe — only shown when company.stripe_enabled=true)
// ─────────────────────────────────────────────────────────────────────────────
export type BookingStep = 1 | 2 | 3 | 4 | 5 | 6 | 7;

// ─────────────────────────────────────────────────────────────────────────────
// SupportedLanguage — ISO codes for notification language selection
// ─────────────────────────────────────────────────────────────────────────────
export type SupportedLanguage = 'sl' | 'en';

// ─────────────────────────────────────────────────────────────────────────────
// Company — data from "Podatki podjetij" table
// Fields marked NEW COLUMN must be added via ALTER TABLE before use
// ─────────────────────────────────────────────────────────────────────────────
export interface Company {
  idPodjetja?: string;
  naziv?: string;
  slug: string;
  email?: string;
  panoga?: string;
  /** ISO 2-letter country code e.g. 'SI'. NEW COLUMN — run ALTER TABLE */
  country?: string;
  /** Subscription plan identifier. Must be 'active' to allow bookings */
  plan?: string;
  /** Public URL of the company logo, added by /api/branding. */
  logo_url?: string | null;
  /**
   * When false, employee selection step is hidden and all bookings use any_person=true.
   * NEW COLUMN — run ALTER TABLE
   */
  prikaz_zaposlenih_rezervacija?: boolean;
  /** Maximum days ahead a customer can book. Default 60. NEW COLUMN — run ALTER TABLE */
  max_dnevi_rezervacija?: number;
  /** When true, payment is required before booking is confirmed. NEW COLUMN — run ALTER TABLE */
  stripe_enabled?: boolean;
  /** 'full' = charge full amount upfront, 'deposit' = charge deposit_percent only. NEW COLUMN */
  stripe_payment_mode?: 'full' | 'deposit';
  /** Deposit percentage (0–100), used when stripe_payment_mode='deposit'. NEW COLUMN */
  stripe_deposit_percent?: number;
  /** Currency code e.g. 'EUR' */
  valuta?: string;
  /** When true, up to 3 services can be selected per booking. NEW COLUMN — run ALTER TABLE */
  multiple_services_online?: boolean;
  /** Default ISO language code for notification emails e.g. 'sl'. NEW COLUMN — run ALTER TABLE */
  defaultLanguage?: SupportedLanguage;
}

// ─────────────────────────────────────────────────────────────────────────────
// Resurs — a bookable physical resource (room, equipment, etc.)
// Data from "Resursi" table. NEW — not previously in codebase.
// ─────────────────────────────────────────────────────────────────────────────
export interface Resurs {
  /** Bigint row ID from "Resursi".id — used as FK in Termini_Resursi */
  id: number;
  naziv: string;
  /** Number of physical units of this resource */
  kolicina: number;
  /** Max concurrent bookings per unit (usually 1) */
  kapaciteta: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// InitResponse — full payload returned by GET /webhook/booking?action=init
// ─────────────────────────────────────────────────────────────────────────────
export interface InitResponse {
  company: Company;
  employees: Employee[];
  employees_ui: EmployeeUI[];
  services: Service[];
  /** Alias for categories — used by variants that read serviceCategories */
  serviceCategories: Category[];
  servicesByCategory: Record<string, Service[]>;
  /**
   * Maps service text ID → array of employee text IDs that can perform it.
   * Computed from "Osebe"."Storitve" JSON column.
   */
  employeesByServiceId: Record<string, (string | number)[]>;
  /** Physical resources (rooms, equipment). NEW field. */
  resursi: Resurs[];
  /**
   * Maps service text ID → array of resurs row IDs (bigint).
   * Built from "Storitve_Resursi" table. NEW field.
   */
  storitveResursiMap: Record<string, number[]>;
  ui: {
    employeeSelection: {
      /** 'single' when prikaz_zaposlenih_rezervacija=true, 'multi' otherwise */
      mode: 'single' | 'multi';
    };
  };
  theme?: Partial<Theme>;
}

// ─────────────────────────────────────────────────────────────────────────────
// SlotsResponse — legacy per-date format used by current fetchTimeSlots() in api.ts
// Kept as-is so api.ts compiles without modification
// ─────────────────────────────────────────────────────────────────────────────
export interface SlotsResponse {
  date: string;
  slots: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// DaySlots — possible values for a single date in the new range-based slots API
//   string[]       — available time slots (may be empty if all taken)
//   'fully_booked' — workday but every slot is occupied
//   'unavailable'  — not a workday, outside booking window, or employee absent
// ─────────────────────────────────────────────────────────────────────────────
export type DaySlots = string[] | 'fully_booked' | 'unavailable';

// ─────────────────────────────────────────────────────────────────────────────
// RangeSlotsResponse — new range-based format returned by the updated slots action
// Replaces SlotsResponse in new code — SlotsResponse kept above for api.ts compat
// ─────────────────────────────────────────────────────────────────────────────
export interface RangeSlotsResponse {
  /** Key: 'yyyy-MM-dd' string. Value: available times, or status string */
  slots: Record<string, DaySlots>;
  /** Sum of all selected service durations in minutes */
  totalDurationMin: number;
  /** Resolved employee ID when any_person=false — echoed back from request */
  employeeId?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// SlotsRequest — payload for POST /webhook/booking action='slots'
// ─────────────────────────────────────────────────────────────────────────────
export interface SlotsRequest {
  action: 'slots';
  companySlug: string;
  /** 1–3 service text IDs. Total duration = sum of all their trajanjeMin. */
  serviceIds: string[];
  /** Specific employee text ID. Null when any_person=true. */
  employeeId: string | null;
  /** When true, use eligibleEmployeeIds to find any available employee */
  any_person: boolean;
  /** Intersection of employees that can perform ALL selected services */
  eligibleEmployeeIds: string[];
  /** Range start in 'yyyy-MM-dd' format */
  startDate: string;
  /** Range end in 'yyyy-MM-dd' format */
  endDate: string;
  /** Optional: resurs row IDs needed — used for capacity checks in n8n */
  resursiIds?: number[];
}

// ─────────────────────────────────────────────────────────────────────────────
// StripePaymentInfo — returned with create response when payment is required
// ─────────────────────────────────────────────────────────────────────────────
export interface StripePaymentInfo {
  requiresPayment: boolean;
  /** Amount to charge in the given currency */
  amount: number;
  currency: string;
  /** Text ID of the created "Termini" record — passed as Stripe metadata */
  terminId: string;
  paymentMode: 'full' | 'deposit';
}

// ─────────────────────────────────────────────────────────────────────────────
// BookingConfirmation — response from POST /webhook/booking action='create'
// ─────────────────────────────────────────────────────────────────────────────
export interface BookingConfirmation {
  success: boolean;
  message: string;
  storitev: string;
  /** Formatted date string as returned by the API */
  datum: string;
  /** Start time 'HH:mm' */
  cas: string;
  /** End time 'HH:mm' — calculated as start + totalDurationMin */
  konec?: string;
  /** Text ID of the created Termini record e.g. "OB-000007" */
  terminId?: string;
  /** Numeric row ID of the created Termini record — passed to POS as appointmentId */
  terminRowId?: number;
  /** When true, frontend must initiate Stripe payment before confirming */
  requiresPayment?: boolean;
  /** Amount to charge via Stripe (in valuta currency) */
  paymentAmount?: number;
  /** 'full' or 'deposit' */
  paymentMode?: 'full' | 'deposit';
  /** Currency code e.g. 'EUR' */
  currency?: string;
  /** True if this is the customer's first booking with this company */
  je_nova_stranka?: boolean;
  /** Full Stripe payment details — only present when requiresPayment=true */
  stripe?: StripePaymentInfo;
}

// ─────────────────────────────────────────────────────────────────────────────
// BookingSubmission — payload sent to POST /webhook/booking action='create'
// All optional fields should be omitted (not sent as null) when not applicable
// ─────────────────────────────────────────────────────────────────────────────
export interface BookingSubmission {
  action: 'create';
  companySlug: string;
  /** Booking date in 'yyyy-MM-dd' format */
  date: string;
  /** Booking start time in 'HH:mm' format */
  time: string;
  /** 1–3 service text IDs. Maps to "ID storitve", "ID storitve 2", "ID storitve 3". */
  serviceIds: string[];
  /** Specific employee text ID. Null when any_person=true. */
  employeeId: string | null;
  /** When true, n8n resolves the employee from eligibleEmployeeIds */
  any_person: boolean;
  /** Intersection of employees that can perform ALL selected services */
  eligibleEmployeeIds: string[];
  /** Resurs row IDs (bigint) from "Resursi".id — empty array if no resources needed */
  resursiIds: number[];
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  gender?: string;
  notes?: string;
  /** Must be true — booking rejected if false */
  privacy_consent: boolean;
  marketing_consent: boolean;
  /** ISO 8601 timestamp of consent capture */
  consent_timestamp: string;
  language: SupportedLanguage;

  // ── Promotion fields (from promotionsStore) ───────────────────────────────
  /** 'popust' = fixed-period discount, 'happy_hour' = time-based discount */
  promocijaTip?: 'popust' | 'happy_hour' | null;
  /** Human-readable promotion name e.g. "Poletna akcija" */
  promocijaNaziv?: string | null;
  /** Discount amount (numeric, in either % or currency depending on popustTip) */
  popust?: number;
  /** 'valuta' = fixed EUR amount, '%' = percentage */
  popustTip?: 'valuta' | '%';
  /** Final price after discount applied */
  finalCena?: number;
  /** Original price before discount */
  originalCena?: number;

  // ── Add-on service fields ─────────────────────────────────────────────────
  /** Text ID of the add-on service selected (from add_on_storitve) */
  addOnServiceId?: string | null;
  addOnNaziv?: string | null;
  addOnFinalCena?: number;
  addOnOriginalCena?: number;
  addOnPopust?: number;
  addOnPopustTip?: '%' | 'valuta';
  /** Duration of add-on service in minutes */
  addOnTrajanjeMin?: number;

  // ── Stripe ────────────────────────────────────────────────────────────────
  /** Provided when frontend has already collected payment. Null on first create call. */
  stripe_payment_intent_id?: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// BookingError — error response from POST /webhook/booking
// ─────────────────────────────────────────────────────────────────────────────
export interface BookingError {
  success: false;
  error:
    | 'company_not_found'
    | 'plan_invalid'
    | 'slot_taken'
    | 'resurs_taken'
    | 'no_employee_available'
    | 'no_employee_for_combination'
    | 'validation_error';
  message: string;
  /** Only present for 'no_employee_for_combination' errors */
  serviceIds?: string[];
  /** Only present for 'validation_error' errors */
  fields?: string[];
}
