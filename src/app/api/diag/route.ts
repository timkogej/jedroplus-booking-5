// src/app/api/diag/route.ts
//
// Tells whether the server-side keys the booking page needs are configured.
// Never returns a key, only booleans and lengths — safe to call publicly.

import { NextResponse } from 'next/server';
import { getPlanCode, getCompanyName } from '@/lib/plan.server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const slug = new URL(request.url).searchParams.get('slug')?.trim() || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  return NextResponse.json({
    supabaseUrlSet: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    serviceKeySet: Boolean(key),
    serviceKeyLength: key ? key.length : 0,
    lookup: slug
      ? { slug, companyName: await getCompanyName(slug), planCode: await getPlanCode(slug) }
      : null,
  });
}
