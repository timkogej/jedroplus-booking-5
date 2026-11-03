import { redirect } from 'next/navigation';
import { getBranding } from '@/lib/branding.server';
import { proDesignsAllowed } from '@/lib/plan.server';

const PRO_DESIGNS = ['seasonal', 'magazine', 'casino'];

/**
 * /{slug} without a design lands on the design the company picked as its main
 * one in Jedro+ (main_booking_link), or on classic when none is picked. That
 * lets a company hand out one short link. A Pro design the plan no longer
 * allows redirects to classic in its own layout. The query string (e.g.
 * ?lang=en) is kept.
 */
export default async function BookingSlugPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (Array.isArray(value)) value.forEach((v) => query.append(key, v));
    else if (value !== undefined) query.set(key, value);
  }
  const qs = query.toString();
  let { mainDesign } = await getBranding(params.slug);
  if (mainDesign && PRO_DESIGNS.includes(mainDesign) && !(await proDesignsAllowed(params.slug))) mainDesign = null;
  redirect(`/${encodeURIComponent(params.slug)}/${mainDesign ?? 'classic'}${qs ? `?${qs}` : ''}`);
}
