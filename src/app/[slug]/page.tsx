import { redirect } from 'next/navigation';

/**
 * /{slug} without a design used to show an old booking page that was not in
 * the design catalog and did not get any of the fixes. Old shared links now
 * land on the classic design instead (query string, e.g. ?lang=en, kept).
 */
export default function BookingSlugPage({
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
  redirect(`/${encodeURIComponent(params.slug)}/classic${qs ? `?${qs}` : ''}`);
}
