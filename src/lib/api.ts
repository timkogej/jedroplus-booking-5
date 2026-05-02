import { InitResponse, SlotsResponse, BookingConfirmation, Theme } from '@/types';

const API_BASE_URL = 'https://n8n.jedroplus.com/webhook/booking';

// Default theme values
const DEFAULT_THEME: Theme = {
  primaryColor: '#8B5CF6',
  secondaryColor: '#A78BFA',
  bgFrom: '#7C3AED',
  bgTo: '#4F46E5',
};

// Initialize - fetch all business data
export async function fetchInitData(companySlug: string): Promise<InitResponse> {
  const response = await fetch(
    `${API_BASE_URL}?action=init&companySlug=${encodeURIComponent(companySlug)}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch init data: ${response.status}`);
  }

  const data = await response.json();

  // Merge theme with defaults
  data.theme = {
    ...DEFAULT_THEME,
    ...(data.theme || {}),
  };

  return data;
}

// Fetch available time slots for a specific date
export async function fetchTimeSlots(
  companySlug: string,
  date: string,
  serviceId: string,
  employeeId: string | null,
  anyPerson: boolean,
  eligibleEmployeeIds?: string[]
): Promise<string[]> {
  const response = await fetch(API_BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'slots',
      companySlug,
      date,
      serviceId,
      employeeId,
      any_person: anyPerson,
      ...(anyPerson && eligibleEmployeeIds ? { employeeIds: eligibleEmployeeIds } : {}),
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch time slots: ${response.status}`);
  }

  const data: SlotsResponse[] = await response.json();

  // Find slots for the requested date
  const dateSlots = data.find((item) => item.date === date);
  return dateSlots?.slots || [];
}

// Submit booking
export interface BookingSubmission {
  companySlug: string;
  date: string;
  time: string;
  serviceId: string;
  employeeId: string | null;
  anyPerson: boolean;
  eligibleEmployeeIds?: string[];
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  gender?: string;
  notes?: string;
  gdprSendMarketing?: boolean;
  privacyConsent?: boolean;
  marketingConsent?: boolean;
  consentTimestamp?: string;
}

export async function submitBooking(
  data: BookingSubmission
): Promise<BookingConfirmation> {
  const response = await fetch(API_BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'create',
      companySlug: data.companySlug,
      date: data.date,
      time: data.time,
      serviceId: data.serviceId,
      employeeId: data.employeeId,
      any_person: data.anyPerson,
      ...(data.anyPerson && data.eligibleEmployeeIds ? { employeeIds: data.eligibleEmployeeIds } : {}),
      firstName: data.firstName,
      lastName: data.lastName,
      customerName: `${data.firstName} ${data.lastName}`,
      customerEmail: data.email,
      customerPhone: data.phone,
      customerGender: data.gender || '',
      customerNote: data.notes || '',
      gdprSendMarketing: data.gdprSendMarketing || false,
      privacy_consent: data.privacyConsent || false,
      marketing_consent: data.marketingConsent || false,
      consent_timestamp: data.consentTimestamp || new Date().toISOString(),
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to submit booking: ${response.status}`);
  }

  const text = await response.text();
  if (!text || text.trim() === '') {
    return { success: true, message: 'Rezervacija uspešna!' } as BookingConfirmation;
  }

  try {
    return JSON.parse(text);
  } catch {
    // Non-JSON but 200 OK → treat as success
    return { success: true, message: 'Rezervacija uspešna!' } as BookingConfirmation;
  }
}

export { DEFAULT_THEME };
