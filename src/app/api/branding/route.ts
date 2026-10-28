// src/app/api/branding/route.ts
//
// Company logo, address and phone for the booking page. The booking init
// webhook does not carry them; see lib/branding.server.ts. Address goes into
// the calendar event, the phone into the "call the salon" message.

import { NextResponse } from 'next/server';
import { getBranding } from '@/lib/branding.server';

export const revalidate = 300;

export async function GET(request: Request) {
  const slug = new URL(request.url).searchParams.get('slug')?.trim() ?? '';
  const { logoUrl, address, phone, cancelDays, rescheduleDays } = await getBranding(slug);
  return NextResponse.json({ logoUrl, address, phone, cancelDays, rescheduleDays });
}
