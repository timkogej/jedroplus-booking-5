// src/lib/plan.server.ts
//
// Server-only plan lookup. The seasonal, magazine and casino designs are part
// of Jedro Pro; without this check anyone with the link could use them on any
// plan. The booking init webhook does not return the plan, and the anon key
// cannot read the subscription tables (by design), so we read them here with
// the service-role key.
//
// If SUPABASE_SERVICE_ROLE_KEY is not configured the check cannot run: we then
// allow the page rather than locking every company out by accident.


import { SUPABASE_URL } from '@/lib/supabaseEnv';

const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const PRO_PLAN_CODES = new Set(['JEDRO_PRO', 'JEDRO_PREMIUM', 'ENTERPRISE']);

async function restGet<T>(path: string): Promise<T | null> {
  if (!SUPABASE_URL || !SERVICE_KEY) return null;
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
      headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
      // Plans change rarely; a short cache keeps the page fast.
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

/** Display name of the company behind `slug` (for the page title). */
export async function getCompanyName(slug: string): Promise<string | null> {
  if (!slug) return null;
  const rows = await restGet<{ name: string | null }[]>(
    `companies?select=name&slug=eq.${encodeURIComponent(slug)}&limit=1`,
  );
  const name = rows?.[0]?.name;
  return name ? String(name) : null;
}

/** The plan code of the company behind `slug`, or null when unknown. */
export async function getPlanCode(slug: string): Promise<string | null> {
  if (!slug) return null;

  const companies = await restGet<{ id: string }[]>(
    `companies?select=id&slug=eq.${encodeURIComponent(slug)}&limit=1`,
  );
  const companyId = companies?.[0]?.id;
  if (!companyId) return null;

  const subs = await restGet<{ plans: { code: string } | null }[]>(
    `company_subscriptions?select=plans(code)&company_id=eq.${companyId}&status=eq.active&limit=1`,
  );
  const code = subs?.[0]?.plans?.code;
  return code ? String(code).toUpperCase() : null;
}

/**
 * True when the Pro designs may be shown. Unknown plan (no service key, no
 * subscription row, lookup failed) counts as allowed — a booking page that
 * silently stops working would be worse than a design used a plan too early.
 */
export async function proDesignsAllowed(slug: string): Promise<boolean> {
  const code = await getPlanCode(slug);
  if (!code) return true;
  return PRO_PLAN_CODES.has(code);
}
