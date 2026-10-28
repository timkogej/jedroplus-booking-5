import type { Metadata } from 'next';
import { getCompanyName } from '@/lib/plan.server';

/**
 * The tab said "Book Your Appointment" for every company. People keep several
 * tabs open while booking, so the name of the business belongs there.
 */
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const name = await getCompanyName(params.slug);
  const title = name ? `Rezervacija — ${name}` : 'Rezervacija termina';
  const description = name ? `Rezervirajte termin pri ${name} na spletu.` : 'Rezervirajte termin na spletu.';
  // The picture comes from opengraph-image.tsx next to this file.
  return {
    title,
    description,
    openGraph: { title, description, type: 'website', locale: 'sl_SI', siteName: name ?? 'Jedro+' },
    twitter: { card: 'summary_large_image', title, description },
  };
}

export default function BookingSlugLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
