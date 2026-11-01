// src/app/[slug]/seasonal/i18n.ts
//
// Texts of the seasonal design in Slovenian and English. Before this file the
// service, specialist and details steps were Slovenian only, so the EN switch
// left half of the page untranslated.

import type { SupportedLanguage } from '@/types';

const translations = {
  sl: {
    next: 'Naprej',
    sending: 'Pošiljam…',
    footer: 'Rezervacijski sistem',
    // Service
    noServices: 'Ni razpoložljivih storitev.',
    priceOnRequest: 'Po dogovoru',
    serviceA: 'Izberite',
    serviceB: 'storitev',
    serviceHint: 'Katera storitev vas zanima?',
    // Specialist
    noStaff: 'Za to storitev ni razpoložljivega osebja.',
    staffA: 'Izberite',
    staffB: 'specialista',
    staffHint: 'Kdo naj vas postreže?',
    anyone: 'Kdorkoli',
    anyoneHint: 'Dodelimo vam prvega prostega specialista',
    orPick: 'ali izberite osebo',
    // Details
    detailsA: 'Vaši',
    detailsB: 'podatki',
    detailsHint: 'Izpolnite podatke za rezervacijo',
    firstName: 'Ime',
    lastName: 'Priimek',
    email: 'Email',
    phone: 'Telefon',
    salutation: 'Nagovor (neobvezno)',
    mr: 'Gospod',
    mrs: 'Gospa',
    neutral: 'Nevtralno',
    notes: 'Opombe',
    notesPlaceholder: 'Posebne želje ali opombe…',
    marketing: 'Želim prejemati obvestila o ponudbah in novostih',
    privacyA: 'Strinjam se z obdelavo osebnih podatkov za namen rezervacije termina.',
    privacyLink: 'Preberite politiko zasebnosti',
    firstNameRequired: 'Ime je obvezno',
    lastNameRequired: 'Priimek je obvezen',
    emailRequired: 'Email je obvezen',
    emailInvalid: 'Email ni veljaven',
    phoneRequired: 'Telefon je obvezen',
    privacyRequired: 'Strinjanje s pogoji je obvezno',
    toConfirm: 'Naprej na potrditev',
  },
  en: {
    next: 'Continue',
    sending: 'Sending…',
    footer: 'Booking system',
    noServices: 'No services available.',
    priceOnRequest: 'On request',
    serviceA: 'Choose a',
    serviceB: 'service',
    serviceHint: 'Which service are you interested in?',
    noStaff: 'No staff available for this service.',
    staffA: 'Choose a',
    staffB: 'specialist',
    staffHint: 'Who should look after you?',
    anyone: 'Anyone',
    anyoneHint: 'We will assign the first available specialist',
    orPick: 'or choose a person',
    detailsA: 'Your',
    detailsB: 'details',
    detailsHint: 'Fill in your details for the booking',
    firstName: 'First name',
    lastName: 'Last name',
    email: 'Email',
    phone: 'Phone',
    salutation: 'Title (optional)',
    mr: 'Mr',
    mrs: 'Ms',
    neutral: 'Neutral',
    notes: 'Notes',
    notesPlaceholder: 'Special requests or notes…',
    marketing: 'I would like to receive news and offers',
    privacyA: 'I agree to the processing of my personal data for the purpose of booking an appointment.',
    privacyLink: 'Read the privacy policy',
    firstNameRequired: 'First name is required',
    lastNameRequired: 'Last name is required',
    emailRequired: 'Email is required',
    emailInvalid: 'Email is not valid',
    phoneRequired: 'Phone is required',
    privacyRequired: 'You need to agree to continue',
    toConfirm: 'Continue to confirmation',
  },
} as const;

type Dict = typeof translations.sl;
export type SeasonalKey = keyof Dict;

/** Text for `key` in `lang` (Slovenian when the language is unknown). */
export function t(lang: SupportedLanguage | undefined, key: SeasonalKey): string {
  const dict = (translations[lang === 'en' ? 'en' : 'sl'] ?? translations.sl) as Record<SeasonalKey, string>;
  return dict[key];
}
