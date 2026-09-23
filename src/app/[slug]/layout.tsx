import type { Metadata } from 'next';
import { getCompanyName } from '@/lib/plan.server';

/**
 * The tab said "Book Your Appointment" for every company. People keep several
 * tabs open while booking, so the name of the business belongs there.
 */
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const name = await getCompanyName(params.slug);
  return {
    title: name ? `Rezervacija — ${name}` : 'Rezervacija termina',
    description: name ? `Rezervirajte termin: ${name}.` : 'Rezervacija termina',
  };
}

export default function BookingSlugLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
