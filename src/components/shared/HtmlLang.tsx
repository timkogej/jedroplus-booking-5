'use client';

import { useEffect } from 'react';
import { useBookingStore } from '@/store/bookingStore';

/**
 * Keeps <html lang> in step with the SL/EN switch, so screen readers read the
 * page in the right voice and the browser does not offer to translate it.
 */
export default function HtmlLang() {
  const language = useBookingStore((s) => s.language);
  useEffect(() => {
    document.documentElement.lang = language || 'sl';
  }, [language]);
  return null;
}
