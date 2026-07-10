/**
 * Jedroplus Booking — Stripe Checkout helper (shared across all variants)
 *
 * When the n8n create response returns requiresPayment=true, the appointment
 * has been created server-side with Status='pending_payment'. The frontend then
 * asks the POS project to create a Stripe Checkout session and redirects the
 * browser to the returned URL. After payment, Stripe returns the customer to the
 * variant's success page (successUrl); on cancel, back to the booking page.
 */

// POS base URL — hosts POST /api/stripe/checkout. Override via NEXT_PUBLIC_POS_URL.
const POS_BASE_URL = process.env.NEXT_PUBLIC_POS_URL || 'https://pos.jedroplus.com';

// ─────────────────────────────────────────────────────────────────────────────
// CheckoutParams — body sent to {POS_URL}/api/stripe/checkout
// ─────────────────────────────────────────────────────────────────────────────
export interface CheckoutParams {
  companySlug: string;
  /** terminRowId from the create response, as a string */
  appointmentId: string;
  /** Amount to charge, in major currency units (e.g. 30 = €30.00) */
  amount: number;
  currency: string;
  /** Human-readable service name(s) shown on the Stripe Checkout page */
  serviceName: string;
  customerEmail: string;
  customerName: string;
  /** ISO language code e.g. 'sl' | 'en' */
  language: string;
  /** 'full' | 'deposit' */
  paymentMode: string;
  /** Absolute URL Stripe returns to on success */
  successUrl: string;
  /** Absolute URL Stripe returns to on cancel (back to booking to retry) */
  cancelUrl: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// redirectToCheckout — create a Checkout session via POS, then navigate the browser
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST the checkout params to the POS, then redirect the browser to the returned
 * Stripe Checkout URL. Throws a user-friendly Error on any failure so callers can
 * surface a localised message. Does nothing server-side (guards window access).
 */
export async function redirectToCheckout(params: CheckoutParams): Promise<void> {
  if (typeof window === 'undefined') return;

  let response: Response;
  try {
    response = await fetch(`${POS_BASE_URL}/api/stripe/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
  } catch {
    // Network / CORS / DNS failure
    throw new Error('PAYMENT_START_FAILED');
  }

  if (!response.ok) {
    // Try to extract a structured { error, message } from the POS response
    let message = `PAYMENT_START_FAILED (${response.status})`;
    try {
      const data = (await response.json()) as { error?: string; message?: string };
      if (data?.message) message = data.message;
    } catch {
      /* non-JSON error body — keep the generic message */
    }
    throw new Error(message);
  }

  let data: { url?: string; sessionId?: string };
  try {
    data = await response.json();
  } catch {
    throw new Error('PAYMENT_START_FAILED');
  }

  if (!data.url) {
    throw new Error('PAYMENT_START_FAILED');
  }

  // Navigate away to Stripe Checkout
  window.location.href = data.url;
}

// ─────────────────────────────────────────────────────────────────────────────
// URL helpers — build absolute success / cancel URLs for a given variant
// ─────────────────────────────────────────────────────────────────────────────

/** Extra booking details appended to the success URL as query params. */
export interface SuccessUrlDetails {
  /** ISO language code so the success page renders in the right language */
  lang: string;
  serviceName?: string;
  /** Date string (as displayed) */
  date?: string;
  /** Time 'HH:mm' */
  time?: string;
}

/**
 * Build the absolute success URL for this variant, e.g.
 *   {origin}/{slug}/classic/success?lang=sl&service=...&date=...&time=...
 * Returns '' on the server (guarded).
 */
export function buildSuccessUrl(
  slug: string,
  variant: string,
  details: SuccessUrlDetails
): string {
  if (typeof window === 'undefined') return '';
  const url = new URL(`/${slug}/${variant}/success`, window.location.origin);
  url.searchParams.set('lang', details.lang);
  if (details.serviceName) url.searchParams.set('service', details.serviceName);
  if (details.date) url.searchParams.set('date', details.date);
  if (details.time) url.searchParams.set('time', details.time);
  return url.toString();
}

/**
 * Build the absolute cancel URL for this variant (back to the booking page), e.g.
 *   {origin}/{slug}/classic
 * Returns '' on the server (guarded).
 */
export function buildCancelUrl(slug: string, variant: string): string {
  if (typeof window === 'undefined') return '';
  return new URL(`/${slug}/${variant}`, window.location.origin).toString();
}
