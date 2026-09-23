// src/app/api/diag/route.ts
//
// Tells whether the server-side keys the booking page needs are configured.
// Never returns a key, only booleans and lengths — safe to call publicly.

import { NextResponse } from 'next/server';
import { getPlanCode, getCompanyName } from '@/lib/plan.server';
import { SUPABASE_URL } from '@/lib/supabaseEnv';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const slug = new URL(request.url).searchParams.get('slug')?.trim() || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  return NextResponse.json({
    supabaseUrlSet: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    anonKeySet: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    n8nUrlSet: Boolean(process.env.NEXT_PUBLIC_N8N_BOOKING_URL),
    serviceKeySet: Boolean(key),
    serviceKeyLength: key ? key.length : 0,
    probe: slug ? await probe(slug) : null,
    lookup: slug
      ? { slug, companyName: await getCompanyName(slug), planCode: await getPlanCode(slug) }
      : null,
  });
}

/** Raw status of the REST calls, so a 401/404 is visible instead of a null. */
async function probe(slug: string) {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  const headers = { apikey: key, Authorization: `Bearer ${key}` };
  const url = `${SUPABASE_URL}/rest/v1/companies?select=name&slug=eq.${encodeURIComponent(slug)}&limit=1`;
  try {
    const res = await fetch(url, { headers, cache: 'no-store' });
    const body = (await res.text()).slice(0, 200);
    return { status: res.status, body, host: new URL(SUPABASE_URL).host };
  } catch (e) {
    return { status: 0, body: e instanceof Error ? e.message : 'fetch failed', host: SUPABASE_URL };
  }
}
