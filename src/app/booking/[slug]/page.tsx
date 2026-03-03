'use client';

import { useParams } from 'next/navigation';
import BookingPage from '@/components/BookingPage';

export default function BookingSlugPage() {
  const params = useParams();
  const slug = params.slug as string;

  // The slug can be used to fetch business-specific data
  // For now, we pass it to BookingPage for future API integration
  return <BookingPage businessSlug={slug} />;
}
