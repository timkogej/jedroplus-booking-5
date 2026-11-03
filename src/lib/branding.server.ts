// src/lib/branding.server.ts
//
// Public branding of a company (logo, address, phone), read with the
// service-role key because the anon key cannot read "Podatki podjetij".
// Used by /api/branding and by the link preview image.

import { SUPABASE_URL } from '@/lib/supabaseEnv';

const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export interface Branding {
  name: string | null;
  logoUrl: string | null;
  address: string | null;
  phone: string | null;
  /** Days before the appointment until which clients may cancel (Jedro+ setting). */
  cancelDays: number | null;
  /** Days before the appointment until which clients may reschedule. */
  rescheduleDays: number | null;
  /** ISO country code from Jedro+ ("country_code"), e.g. SI. */
  country: string | null;
  /** Design picked as the main one in Jedro+ ("main_booking_link"), e.g. magazine. */
  mainDesign: string | null;
}

/** Designs a main link may point at; anything else falls back to classic. */
const DESIGN_KEYS = ['classic', 'modern', 'elegant', 'magazine', 'seasonal', 'casino'];

/**
 * The design is the last path segment of the main link. The slug in that link
 * is ignored on purpose: some companies have a main link that was copied from
 * another company, and the visitor already stands on the right slug.
 */
export function designFromMainLink(link: unknown): string | null {
  if (typeof link !== 'string' || !link.trim()) return null;
  let path = link.trim();
  try {
    path = new URL(path).pathname;
  } catch {
    /* not a full URL — treat it as a path */
  }
  const last = path.split('/').filter(Boolean).pop()?.toLowerCase() ?? '';
  return DESIGN_KEYS.includes(last) ? last : null;
}

const EMPTY: Branding = {
  name: null,
  logoUrl: null,
  address: null,
  phone: null,
  cancelDays: null,
  rescheduleDays: null,
  country: null,
  mainDesign: null,
};

export async function getBranding(slug: string): Promise<Branding> {
  if (!slug || !SUPABASE_URL || !SERVICE_KEY) return EMPTY;
  const headers = { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` };
  const table = `${SUPABASE_URL}/rest/v1/${encodeURIComponent('Podatki podjetij')}`;
  const byCompany = (id: string) => `${encodeURIComponent('ID Podjetja')}=eq.${encodeURIComponent(id)}&limit=1`;

  try {
    const companyRes = await fetch(
      `${SUPABASE_URL}/rest/v1/companies?select=company_id,name&slug=eq.${encodeURIComponent(slug)}&limit=1`,
      { headers, next: { revalidate: 300 } },
    );
    const companies = (await companyRes.json()) as { company_id?: string; name?: string | null }[];
    const company = Array.isArray(companies) ? companies[0] : undefined;
    const companyId = company?.company_id;
    if (!companyId) return EMPTY;
    const name = company?.name ? String(company.name) : null;

    const logoRes = await fetch(`${table}?select=logo_url&${byCompany(companyId)}`, {
      headers,
      next: { revalidate: 300 },
    });
    const logoRows = (await logoRes.json()) as { logo_url?: string | null }[];
    const logoUrl = Array.isArray(logoRows) ? logoRows[0]?.logo_url ?? null : null;

    // Read separately so a problem with these columns never costs the logo.
    let address: string | null = null;
    let phone: string | null = null;
    try {
      const select = encodeURIComponent('"Naslov podjetja","Kontaktni telefon"');
      const contactRes = await fetch(`${table}?select=${select}&${byCompany(companyId)}`, {
        headers,
        next: { revalidate: 300 },
      });
      const rows = (await contactRes.json()) as Record<string, unknown>[];
      const row = Array.isArray(rows) ? rows[0] : undefined;
      const text = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : null);
      address = text(row?.['Naslov podjetja']);
      phone = text(row?.['Kontaktni telefon']);
    } catch {
      /* contact details are optional */
    }

    // Cancellation policy from "Nastavitve rezervacij"; also read on its own.
    let cancelDays: number | null = null;
    let rescheduleDays: number | null = null;
    try {
      const policyRes = await fetch(
        `${table}?select=cancel_appt_days,reschedule_appt_days&${byCompany(companyId)}`,
        { headers, next: { revalidate: 300 } },
      );
      const rows = (await policyRes.json()) as Record<string, unknown>[];
      const row = Array.isArray(rows) ? rows[0] : undefined;
      const days = (v: unknown) => {
        const n = typeof v === 'number' ? v : parseInt(String(v ?? ''), 10);
        return Number.isFinite(n) && n >= 0 ? n : null;
      };
      cancelDays = days(row?.cancel_appt_days);
      rescheduleDays = days(row?.reschedule_appt_days);
    } catch {
      /* policy is optional */
    }

    let country: string | null = null;
    try {
      const countryRes = await fetch(`${table}?select=country_code&${byCompany(companyId)}`, {
        headers,
        next: { revalidate: 300 },
      });
      const rows = (await countryRes.json()) as { country_code?: string | null }[];
      const code = Array.isArray(rows) ? rows[0]?.country_code : null;
      country = typeof code === 'string' && code.trim() ? code.trim().toUpperCase() : null;
    } catch {
      /* country is optional */
    }

    let mainDesign: string | null = null;
    try {
      const mainRes = await fetch(`${table}?select=main_booking_link&${byCompany(companyId)}`, {
        headers,
        next: { revalidate: 60 },
      });
      const rows = (await mainRes.json()) as { main_booking_link?: string | null }[];
      mainDesign = designFromMainLink(Array.isArray(rows) ? rows[0]?.main_booking_link : null);
    } catch {
      /* without a main design the visitor gets classic */
    }

    return { name, logoUrl, address, phone, cancelDays, rescheduleDays, country, mainDesign };
  } catch {
    return EMPTY;
  }
}
