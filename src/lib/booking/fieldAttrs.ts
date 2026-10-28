// src/lib/booking/fieldAttrs.ts
//
// Browser hints for the contact fields, shared by every design. With these the
// phone offers the saved name, email and number in one tap, and opens the right
// keyboard (@ for email, digits for phone).

export type ContactField = 'firstName' | 'lastName' | 'email' | 'phone';

export const CONTACT_FIELD_ATTRS = {
  firstName: { name: 'firstName', autoComplete: 'given-name', autoCapitalize: 'words' },
  lastName: { name: 'lastName', autoComplete: 'family-name', autoCapitalize: 'words' },
  email: {
    name: 'email',
    autoComplete: 'email',
    inputMode: 'email',
    autoCapitalize: 'off',
    autoCorrect: 'off',
    spellCheck: false,
  },
  phone: { name: 'phone', autoComplete: 'tel', inputMode: 'tel' },
} as const satisfies Record<ContactField, React.InputHTMLAttributes<HTMLInputElement>>;

/** Attributes for a field by name; nothing for fields that are not contact fields. */
export function contactFieldAttrs(field?: string) {
  return field && field in CONTACT_FIELD_ATTRS
    ? CONTACT_FIELD_ATTRS[field as ContactField]
    : {};
}
