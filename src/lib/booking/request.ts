// src/lib/booking/request.ts
//
// Request mode ("povpraševanje", company.booking_mode = 'request'). The client
// does not pick a free time: they say what they want and when it suits them,
// and the salon picks the time in Jedro+ ("Zahteve za termin"). n8n action
// 'request-create' stores it in "zahteve_termini".
//
// Designs only draw the screens (components/shared/request/*); what is sent is
// decided here, the same for every design.

import { addDays, endOfWeek, format, startOfDay, startOfWeek } from 'date-fns';
import { enUS, sl } from 'date-fns/locale';
import { create } from 'zustand';
import { API_BASE_URL } from '@/lib/api';
import { BookingSubmitError, getSelectedServices } from '@/lib/booking/submit';
import { useBookingStore } from '@/store/bookingStore';

export type RequestPreset = 'asap' | 'thisWeek' | 'nextWeek' | 'custom';
/** Values stored by n8n in zeljeni_del_dneva (Jedro+ reads them). */
export type PartOfDay = 'vseeno' | 'dopoldan' | 'popoldan';

interface RequestState {
  /** Client chose "I don't know exactly" instead of a service. */
  unsure: boolean;
  preset: RequestPreset | null;
  dateFrom: Date | null;
  dateTo: Date | null;
  partOfDay: PartOfDay;
  /** Preferred person; null = anyone. */
  employeeId: string | null;
  description: string;
  /** Set once the request was accepted by the server. */
  sent: boolean;
  setUnsure: (unsure: boolean) => void;
  setPreset: (preset: RequestPreset) => void;
  setRange: (from: Date | null, to: Date | null) => void;
  setPartOfDay: (value: PartOfDay) => void;
  setEmployeeId: (id: string | null) => void;
  setDescription: (text: string) => void;
  setSent: (sent: boolean) => void;
  reset: () => void;
}

const initial = {
  unsure: false,
  preset: null,
  dateFrom: null,
  dateTo: null,
  partOfDay: 'vseeno' as PartOfDay,
  employeeId: null,
  description: '',
  sent: false,
};

export const useRequestStore = create<RequestState>((set) => ({
  ...initial,
  setUnsure: (unsure) => set({ unsure }),
  setPreset: (preset) => {
    if (preset === 'custom') {
      set({ preset, dateFrom: null, dateTo: null });
      return;
    }
    const { from, to } = presetRange(preset, useBookingStore.getState().maxDniRezervacija);
    set({ preset, dateFrom: from, dateTo: to });
  },
  setRange: (dateFrom, dateTo) => set({ dateFrom, dateTo }),
  setPartOfDay: (partOfDay) => set({ partOfDay }),
  setEmployeeId: (employeeId) => set({ employeeId }),
  setDescription: (description) => set({ description: description.slice(0, MAX_DESCRIPTION) }),
  setSent: (sent) => set({ sent }),
  reset: () => set({ ...initial }),
}));

export const MAX_DESCRIPTION = 500;
export const MIN_DESCRIPTION = 5;

/** True when the company takes requests instead of instant bookings. */
export function useIsRequestMode(): boolean {
  return useBookingStore((s) => s.company?.booking_mode === 'request');
}

export function isRequestMode(): boolean {
  return useBookingStore.getState().company?.booking_mode === 'request';
}

/** Date range for a quick choice. Never past the booking window. */
export function presetRange(
  preset: Exclude<RequestPreset, 'custom'>,
  maxDays = 60,
  now: Date = new Date(),
): { from: Date; to: Date } {
  const today = startOfDay(now);
  const last = addDays(today, Math.max(1, maxDays));
  const clamp = (d: Date) => (d > last ? last : d);
  if (preset === 'asap') return { from: today, to: clamp(addDays(today, 6)) };
  if (preset === 'thisWeek') {
    return { from: today, to: clamp(endOfWeek(today, { weekStartsOn: 1 })) };
  }
  const nextMonday = addDays(startOfWeek(today, { weekStartsOn: 1 }), 7);
  return { from: clamp(nextMonday), to: clamp(addDays(nextMonday, 6)) };
}

/** Is everything on the "when and what" step filled in? */
export function requestWhenComplete(state = useRequestStore.getState()): boolean {
  return !!state.dateFrom && !!state.dateTo && state.description.trim().length >= MIN_DESCRIPTION;
}

// ── Display ──────────────────────────────────────────────────────────────────

export function formatRange(from: Date | null, to: Date | null, lang: 'sl' | 'en'): string {
  if (!from || !to) return '';
  const locale = lang === 'en' ? enUS : sl;
  const day = (d: Date) => {
    const text = format(d, lang === 'en' ? 'EEE d MMM' : 'EEEE, d. M.', { locale });
    return text.charAt(0).toUpperCase() + text.slice(1);
  };
  if (from.getTime() === to.getTime()) return day(from);
  return `${day(from)} – ${day(to)}`;
}

export function presetLabel(preset: RequestPreset | null, lang: 'sl' | 'en'): string {
  if (!preset) return '';
  return REQUEST_TEXT[lang].presets[preset];
}

export function partOfDayLabel(value: PartOfDay, lang: 'sl' | 'en'): string {
  return REQUEST_TEXT[lang].partsOfDay[value];
}

/** "Gel lak + Pedikura", or "not sure yet" when the client chose that. */
export function requestServiceLabel(lang: 'sl' | 'en'): string {
  const names = getSelectedServices().map((s) => s.naziv);
  if (names.length > 0) return names.join(' + ');
  return REQUEST_TEXT[lang].unsureShort;
}

export function requestEmployeeLabel(lang: 'sl' | 'en'): string {
  const { employeeId } = useRequestStore.getState();
  if (!employeeId) return REQUEST_TEXT[lang].anyone;
  return useBookingStore.getState().employeesUI.find((e) => e.id === employeeId)?.label ?? REQUEST_TEXT[lang].anyone;
}

// ── Sending ──────────────────────────────────────────────────────────────────

export function buildRequestBody(companySlug: string): Record<string, unknown> {
  const booking = useBookingStore.getState();
  const req = useRequestStore.getState();
  const details = booking.customerDetails;
  const lang = booking.language === 'en' ? 'en' : 'sl';
  if (!companySlug || !details || !req.dateFrom || !req.dateTo || req.description.trim().length < MIN_DESCRIPTION) {
    throw new BookingSubmitError('Missing request data', 'missing_data');
  }
  const services = getSelectedServices();
  return {
    action: 'request-create',
    companySlug,
    ime: details.firstName,
    priimek: details.lastName,
    email: details.email,
    telefon: details.phone,
    spol: details.gender || null,
    opisZelje: req.description.trim(),
    zeljeniDatumOd: format(req.dateFrom, 'yyyy-MM-dd'),
    zeljeniDatumDo: format(req.dateTo, 'yyyy-MM-dd'),
    zeljeniDelDneva: req.partOfDay,
    zeljeniCas: req.preset ? REQUEST_TEXT.sl.presets[req.preset] : null,
    serviceIds: services.map((s) => s.id),
    storitve: services.map((s) => s.naziv).join(' + ') || null,
    zeljeniZaposleniId: req.employeeId,
    zeljeniZaposleni: req.employeeId ? requestEmployeeLabel('sl') : null,
    language: lang,
    privacy_consent: details.privacyConsent ?? false,
    marketing_consent: details.gdprSendMarketing ?? false,
    consent_timestamp: new Date().toISOString(),
  };
}

/** Sends the request. Throws BookingSubmitError when it was not accepted. */
export async function submitRequest(companySlug: string): Promise<void> {
  const body = buildRequestBody(companySlug);
  const response = await fetch(API_BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new BookingSubmitError(`HTTP ${response.status}`, 'http_error');
  const text = await response.text();
  let parsed: Record<string, unknown> | null = null;
  try {
    parsed = text.trim() ? JSON.parse(text) : null;
  } catch {
    parsed = null;
  }
  if (!parsed || typeof parsed !== 'object') throw new BookingSubmitError('Empty response', 'empty_response');
  if (parsed.success !== true) {
    const code = parsed.success === false ? (parsed.error as string | undefined) : 'empty_response';
    throw new BookingSubmitError((parsed.message as string) || 'Request failed', code);
  }
  useRequestStore.getState().setSent(true);
}

/** Text when sending failed: clear, and never "just try again" when unsure. */
export function requestErrorMessage(err: unknown, lang: 'sl' | 'en'): string {
  const phone = useBookingStore.getState().company?.telefon;
  const T = REQUEST_TEXT[lang];
  if (err instanceof BookingSubmitError && (err.code === 'http_error' || err.code === 'empty_response')) {
    return T.errorUnknown(phone);
  }
  if (err instanceof TypeError) return T.errorUnknown(phone);
  if (err instanceof BookingSubmitError && err.code && err.code !== 'missing_data' && err.message) {
    return err.message;
  }
  return T.errorGeneric;
}

// ── Description help, by industry ────────────────────────────────────────────

type Industry = 'hair' | 'nails' | 'beauty' | 'massage' | 'health' | 'other';

function industryOf(panoga?: string): Industry {
  const p = (panoga || '').toLowerCase();
  if (/fris|frizer|hair|barber|brivn/.test(p)) return 'hair';
  if (/nohti|nail|manik|pedik/.test(p)) return 'nails';
  if (/kozmet|cosmet|beauty|lepot|lash|trep|obrv/.test(p)) return 'beauty';
  if (/mas[aš]|massage|wellness|spa/.test(p)) return 'massage';
  if (/fizio|physio|zdrav|health|terap|klinik|dental|zob/.test(p)) return 'health';
  return 'other';
}

export function descriptionPlaceholder(lang: 'sl' | 'en'): string {
  const industry = industryOf(useBookingStore.getState().company?.panoga);
  return REQUEST_TEXT[lang].placeholders[industry];
}

// ── Texts ────────────────────────────────────────────────────────────────────

export const REQUEST_TEXT = {
  sl: {
    unsureTitle: 'Ne vem točno, kaj potrebujem',
    unsureText: 'Opišite svojo željo, salon vam bo predlagal pravo storitev.',
    unsureShort: 'Še ne vem – opisal/a sem željo',
    whenTitle: 'Kdaj in kaj želite?',
    whenSubtitle: 'Povejte, kdaj vam ustreza. Salon bo izbral prosti termin in vam ga potrdil po emailu.',
    serviceLabel: 'Storitev',
    change: 'Spremeni',
    whenLabel: 'Kdaj vam ustreza?',
    presets: { asap: 'Čim prej', thisWeek: 'Ta teden', nextWeek: 'Naslednji teden', custom: 'Izberem datum' },
    pickHint: 'Kliknite en dan ali dva dneva za obdobje.',
    partOfDayLabel: 'Del dneva',
    partsOfDay: { vseeno: 'Kadarkoli', dopoldan: 'Dopoldne', popoldan: 'Popoldne' },
    employeeLabel: 'Pri kom?',
    anyone: 'Kdorkoli',
    descriptionLabel: 'Opišite svojo željo',
    descriptionHelp: 'Več kot napišete, lažje vam salon pripravi pravi termin.',
    quickAdds: ['Prvič sem pri vas', 'Imam alergijo', 'Želim posvet', 'Datum je prilagodljiv'],
    placeholders: {
      hair: 'Npr. želim osvežiti barvo in skrajšati konice, lasje so do ramen.',
      nails: 'Npr. želim gel lak v nežni barvi, imam tudi en odlomljen noht.',
      beauty: 'Npr. želim nego obraza, koža je občutljiva in suha.',
      massage: 'Npr. bolijo me ramena in vrat, želim sproščujočo masažo.',
      health: 'Npr. bolečina v kolenu po teku, traja približno dva tedna.',
      other: 'Npr. kaj želite, kaj je pomembno in morebitne posebnosti.',
    },
    next: 'Naprej',
    missingWhen: 'Izberite, kdaj vam ustreza.',
    missingDescription: 'Napišite nekaj besed o svoji želji.',
    reviewTitle: 'Pregled povpraševanja',
    reviewSubtitle: 'Preverite podatke in pošljite povpraševanje.',
    rowService: 'Storitev',
    rowWhen: 'Kdaj',
    rowPartOfDay: 'Del dneva',
    rowEmployee: 'Pri',
    rowDescription: 'Vaša želja',
    rowName: 'Ime in priimek',
    rowEmail: 'Email',
    rowPhone: 'Telefon',
    notYetBooked: 'To še ni potrjen termin. Salon bo izbral prosti termin in vam ga potrdil po emailu.',
    send: 'Pošlji povpraševanje',
    sending: 'Pošiljam …',
    errorGeneric: 'Povpraševanja ni bilo mogoče poslati. Poskusite znova.',
    errorUnknown: (phone?: string | null) =>
      `Ne vemo, ali je povpraševanje prispelo. Preden poskusite znova, preverite email ali pokličite salon${phone ? ` na ${phone}` : ''}.`,
    sentTitle: 'Povpraševanje je poslano',
    sentText: (salon: string, email: string) =>
      `${salon || 'Salon'} bo pregledal vašo željo in izbral prosti termin. Potrditev dobite na ${email}.`,
    timeline: ['Povpraševanje poslano', 'Salon izbere termin', 'Potrditev po emailu'],
    yourRequest: 'Vaše povpraševanje',
    newRequest: 'Novo povpraševanje',
    callSalon: 'Pokliči salon',
    stepLabel: 'Želja',
  },
  en: {
    unsureTitle: "I'm not sure what I need",
    unsureText: 'Describe what you want and the salon will suggest the right service.',
    unsureShort: 'Not sure yet – described my wish',
    whenTitle: 'When and what would you like?',
    whenSubtitle: 'Tell us when suits you. The salon will pick a free time and confirm it by email.',
    serviceLabel: 'Service',
    change: 'Change',
    whenLabel: 'When suits you?',
    presets: { asap: 'As soon as possible', thisWeek: 'This week', nextWeek: 'Next week', custom: 'Pick dates' },
    pickHint: 'Tap one day, or two days for a range.',
    partOfDayLabel: 'Time of day',
    partsOfDay: { vseeno: 'Any time', dopoldan: 'Morning', popoldan: 'Afternoon' },
    employeeLabel: 'With whom?',
    anyone: 'Anyone',
    descriptionLabel: 'Describe what you would like',
    descriptionHelp: 'The more you tell us, the easier it is to prepare the right appointment.',
    quickAdds: ["It's my first visit", 'I have an allergy', "I'd like a consultation", "I'm flexible with the date"],
    placeholders: {
      hair: 'E.g. I would like to refresh my colour and trim the ends, hair is shoulder length.',
      nails: 'E.g. gel polish in a soft colour, one nail is also broken.',
      beauty: 'E.g. a facial, my skin is sensitive and dry.',
      massage: 'E.g. my shoulders and neck hurt, I would like a relaxing massage.',
      health: 'E.g. knee pain after running, for about two weeks.',
      other: 'E.g. what you would like, what matters to you and anything special.',
    },
    next: 'Continue',
    missingWhen: 'Choose when suits you.',
    missingDescription: 'Write a few words about what you would like.',
    reviewTitle: 'Review your request',
    reviewSubtitle: 'Check the details and send your request.',
    rowService: 'Service',
    rowWhen: 'When',
    rowPartOfDay: 'Time of day',
    rowEmployee: 'With',
    rowDescription: 'Your wish',
    rowName: 'Name',
    rowEmail: 'Email',
    rowPhone: 'Phone',
    notYetBooked: 'This is not a confirmed appointment yet. The salon will pick a free time and confirm it by email.',
    send: 'Send request',
    sending: 'Sending …',
    errorGeneric: 'We could not send your request. Please try again.',
    errorUnknown: (phone?: string | null) =>
      `We do not know whether your request arrived. Before trying again, check your email or call the salon${phone ? ` at ${phone}` : ''}.`,
    sentTitle: 'Your request has been sent',
    sentText: (salon: string, email: string) =>
      `${salon || 'The salon'} will review your request and pick a free time. You will get the confirmation at ${email}.`,
    timeline: ['Request sent', 'Salon picks a time', 'Confirmation by email'],
    yourRequest: 'Your request',
    newRequest: 'New request',
    callSalon: 'Call the salon',
    stepLabel: 'Request',
  },
} as const;
