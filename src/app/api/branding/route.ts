// src/app/api/branding/route.ts
//
// Company logo for the booking page. The booking init webhook does not carry
// it and the anon key cannot read "Podatki podjetij", so we read it here with
// the service-role key and hand the browser just the public logo URL.

import { NextResponse } from 'next/server';

import { SUPABASE_URL } from '@/lib/supabaseEnv';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const revalidate = 300;

export async function GET(request: Request) {
  const slug = new URL(request.url).searchParams.get('slug')?.trim();
  if (!slug) return NextResponse.json({ logoUrl: null });
  if (!SUPABASE_URL || !SERVICE_KEY) return NextResponse.json({ logoUrl: null });

  const headers = { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` };

  try {
    const companyRes = await fetch(
      `${SUPABASE_URL}/rest/v1/companies?select=company_id&slug=eq.${encodeURIComponent(slug)}&limit=1`,
      { headers, next: { revalidate: 300 } },
    );
    const companies = (await companyRes.json()) as { company_id?: string }[];
    const companyId = companies?.[0]?.company_id;
    if (!companyId) return NextResponse.json({ logoUrl: null });

    const brandingRes = await fetch(
      `${SUPABASE_URL}/rest/v1/${encodeURIComponent('Podatki podjetij')}?select=logo_url&${encodeURIComponent('ID Podjetja')}=eq.${encodeURIComponent(companyId)}&limit=1`,
      { headers, next: { revalidate: 300 } },
    );
    const rows = (await brandingRes.json()) as { logo_url?: string | null }[];
    return NextResponse.json({ logoUrl: rows?.[0]?.logo_url ?? null });
  } catch {
    return NextResponse.json({ logoUrl: null });
  }
}
