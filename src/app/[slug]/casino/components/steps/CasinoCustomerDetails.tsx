'use client';

import { useState } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { format } from 'date-fns';
import { sl } from 'date-fns/locale';
import { useBookingStore } from '@/store/bookingStore';
import { CustomerDetails } from '@/types';
import { useSecureBooking } from '@/hooks/useSecureBooking';

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  privacyConsent?: string;
}

const GENDERS = [
  { value: 'male',   label: 'Gospod', suit: '♠' },
  { value: 'female', label: 'Gospa',  suit: '♥' },
  { value: 'other',  label: 'Drugo',  suit: '♦' },
];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: 'easeOut' as const },
  },
};

// Gold underline label
function MCLabel({ children }: { children: React.ReactNode }) {
  return (
    <label
      className="block mb-1.5"
      style={{
        fontFamily: 'var(--font-oswald)',
        fontSize: '0.6rem',
        letterSpacing: '0.2em',
        textTransform: 'uppercase',
        color: '#a89060',
      }}
    >
      {children}
    </label>
  );
}

// Gold underline input
function MCInput({
  value,
  onChange,
  placeholder,
  type = 'text',
  hasError,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  hasError?: boolean;
}) {
  const [focused, setFocused] = useState(false);

  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      className={`mc-input ${hasError ? 'error' : ''}`}
      style={{
        borderBottomColor: hasError
          ? '#c0392b'
          : focused
          ? '#c9a84c'
          : 'rgba(201, 168, 76, 0.3)',
      }}
    />
  );
}

// Booking summary sidebar strip
function BookingSummary() {
  const {
    selectedService,
    selectedDate,
    selectedTime,
    selectedEmployeeId,
    anyPerson,
    employeesUI,
  } = useBookingStore();

  const selectedEmployee = employeesUI.find((e) => e.id === selectedEmployeeId);
  if (!selectedService) return null;

  const rows = [
    { label: 'Storitev',    value: selectedService.naziv },
    { label: 'Specialist',  value: anyPerson ? 'Kdorkoli prost' : selectedEmployee?.label ?? '—' },
    { label: 'Datum',       value: selectedDate ? format(selectedDate, 'd. MMM yyyy', { locale: sl }) : '—' },
    { label: 'Čas',         value: selectedTime ?? '—' },
    { label: 'Trajanje',    value: `${selectedService.trajanjeMin} min` },
  ];

  return (
    <div
      className="rounded-lg overflow-hidden mb-6"
      style={{
        background: 'rgba(8, 30, 15, 0.75)',
        border: '1px solid rgba(201, 168, 76, 0.2)',
      }}
    >
      {/* Header */}
      <div
        className="px-4 py-2.5"
        style={{
          background: 'rgba(13, 59, 30, 0.5)',
          borderBottom: '1px solid rgba(201,168,76,0.12)',
        }}
      >
        <p
          style={{
            fontFamily: 'var(--font-oswald)',
            fontSize: '0.6rem',
            letterSpacing: '0.25em',
            textTransform: 'uppercase',
            color: '#a89060',
          }}
        >
          ◆ Vaša Rezervacija
        </p>
      </div>

      <div className="px-4 py-3 space-y-0">
        {rows.map((row, i) => (
          <div key={i} className="mc-summary-row">
            <span className="mc-summary-label">{row.label}</span>
            <span className="mc-summary-value text-sm">{row.value}</span>
          </div>
        ))}
      </div>

      {/* Total */}
      <div
        className="px-4 py-3 flex items-center justify-between"
        style={{ borderTop: '1px solid rgba(201,168,76,0.15)' }}
      >
        <span
          style={{
            fontFamily: 'var(--font-oswald)',
            fontSize: '0.6rem',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: '#a89060',
          }}
        >
          Skupaj
        </span>
        <span
          style={{
            fontFamily: 'var(--font-playfair)',
            fontSize: '1.3rem',
            fontWeight: 700,
            color: '#e8c96d',
          }}
        >
          €{selectedService.cena}
        </span>
      </div>
    </div>
  );
}

export default function CasinoCustomerDetails() {
  const { setCustomerDetails, nextStep } = useBookingStore();

  const [firstName, setFirstName] = useState('');
  const [lastName,  setLastName]  = useState('');
  const [email,     setEmail]     = useState('');
  const [phone,     setPhone]     = useState('');
  const [gender,    setGender]    = useState('');
  const [notes,     setNotes]     = useState('');
  const [gdprMarketing, setGdprMarketing] = useState(false);
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [website, setWebsite] = useState(''); // honeypot
  const [errors, setErrors] = useState<FormErrors>({});

  const { isSubmitting, fieldErrors, submitBooking, sanitize } = useSecureBooking({
    companyId: 'casino',
  });

  const validate = (): boolean => {
    const e: FormErrors = {};
    if (!firstName.trim()) e.firstName = 'Ime je obvezno';
    if (!lastName.trim())  e.lastName  = 'Priimek je obvezen';
    if (!email.trim())     e.email     = 'Email je obvezen';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Email ni veljaven';
    if (!phone.trim())     e.phone     = 'Telefon je obvezen';
    if (!privacyConsent)   e.privacyConsent = 'Strinjanje z obdelavo podatkov je obvezno';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    const formData = {
      ime:     sanitize(firstName.trim()),
      priimek: sanitize(lastName.trim()),
      email:   email.trim(),
      telefon: phone.trim(),
      opombe:  notes.trim() || undefined,
      website, // honeypot
    };
    const success = await submitBooking(formData);
    if (success) {
      const details: CustomerDetails = {
        firstName: formData.ime,
        lastName:  formData.priimek,
        email:     formData.email,
        phone:     formData.telefon,
        gender:    gender || undefined,
        notes:     notes.trim() || undefined,
        gdprSendMarketing: gdprMarketing,
      };
      setCustomerDetails(details);
      nextStep();
    }
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      {/* Booking summary */}
      <motion.div variants={itemVariants}>
        <BookingSummary />
      </motion.div>

      {/* Form card */}
      <motion.div
        variants={itemVariants}
        className="rounded-lg p-5"
        style={{
          background: 'rgba(10, 40, 20, 0.82)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(201, 168, 76, 0.2)',
        }}
      >
        {/* Section label */}
        <p
          className="mb-5"
          style={{
            fontFamily: 'var(--font-oswald)',
            fontSize: '0.6rem',
            letterSpacing: '0.25em',
            textTransform: 'uppercase',
            color: '#a89060',
          }}
        >
          ◆ Registracija Igralca
        </p>

        {/* Name row */}
        <div className="grid grid-cols-2 gap-4 mb-5">
          <div>
            <MCLabel>Ime</MCLabel>
            <MCInput value={firstName} onChange={setFirstName} placeholder="Janez" hasError={!!errors.firstName} />
            <AnimatePresence>
              {errors.firstName && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mc-error mt-1"
                >
                  {errors.firstName}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
          <div>
            <MCLabel>Priimek</MCLabel>
            <MCInput value={lastName} onChange={setLastName} placeholder="Novak" hasError={!!errors.lastName} />
            <AnimatePresence>
              {errors.lastName && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mc-error mt-1"
                >
                  {errors.lastName}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Email */}
        <div className="mb-5">
          <MCLabel>Email</MCLabel>
          <MCInput value={email} onChange={setEmail} placeholder="janez@email.com" type="email" hasError={!!errors.email} />
          <AnimatePresence>
            {(errors.email || fieldErrors.email) && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mc-error mt-1"
              >
                {errors.email || fieldErrors.email}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Phone */}
        <div className="mb-5">
          <MCLabel>Telefon</MCLabel>
          <MCInput value={phone} onChange={setPhone} placeholder="041 123 456" type="tel" hasError={!!errors.phone} />
          <AnimatePresence>
            {errors.phone && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mc-error mt-1"
              >
                {errors.phone}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Nagovor / Gender */}
        <div className="mb-5">
          <MCLabel>Nagovor (opcijsko)</MCLabel>
          <div className="flex gap-2 mt-1">
            {GENDERS.map((g) => {
              const isSelected = gender === g.value;
              return (
                <motion.button
                  key={g.value}
                  type="button"
                  onClick={() => setGender(isSelected ? '' : g.value)}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="flex-1 py-2 rounded-lg transition-all"
                  style={{
                    fontFamily: 'var(--font-oswald)',
                    fontSize: '0.65rem',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    background: isSelected ? 'rgba(201,168,76,0.15)' : 'rgba(13,59,30,0.5)',
                    border: isSelected ? '1px solid rgba(201,168,76,0.6)' : '1px solid rgba(201,168,76,0.15)',
                    color: isSelected ? '#c9a84c' : '#a89060',
                    transition: 'all 0.25s ease',
                  }}
                >
                  {g.suit} {g.label}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Notes */}
        <div className="mb-5">
          <MCLabel>Posebne želje (opcijsko)</MCLabel>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Posebne želje ali opombe..."
            rows={3}
            className="mc-textarea mt-1"
          />
        </div>

        {/* Honeypot — skrito pred boti */}
        <input
          type="text"
          name="website"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          tabIndex={-1}
          aria-hidden="true"
          style={{ display: 'none' }}
          autoComplete="off"
        />

        {/* Privacy consent — OBVEZNO */}
        <div className="mb-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <div
              className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0 mt-0.5 transition-all"
              style={{
                background: privacyConsent ? '#c9a84c' : 'transparent',
                border: `1.5px solid ${errors.privacyConsent ? '#c0392b' : privacyConsent ? '#c9a84c' : 'rgba(201,168,76,0.3)'}`,
                transition: 'all 0.25s ease',
              }}
              onClick={() => setPrivacyConsent(!privacyConsent)}
            >
              {privacyConsent && (
                <span style={{ color: '#060f08', fontSize: '0.55rem', fontWeight: 700 }}>✓</span>
              )}
            </div>
            <span
              style={{
                fontFamily: 'var(--font-cormorant)',
                fontSize: '0.88rem',
                color: errors.privacyConsent ? '#c0392b' : 'rgba(232,217,184,0.75)',
                lineHeight: 1.5,
              }}
            >
              Strinjam se z obdelavo osebnih podatkov v skladu z{' '}
              <a
                href="https://jedroplus.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#c9a84c', textDecoration: 'underline' }}
                onClick={(e) => e.stopPropagation()}
              >
                politiko zasebnosti
              </a>
              {' '}*
            </span>
          </label>
          <AnimatePresence>
            {errors.privacyConsent && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mc-error mt-1 ml-7"
              >
                {errors.privacyConsent}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* GDPR checkbox — opcijsko */}
        <label className="flex items-start gap-3 cursor-pointer">
          <div
            className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0 mt-0.5 transition-all"
            style={{
              background: gdprMarketing ? '#c9a84c' : 'transparent',
              border: `1.5px solid ${gdprMarketing ? '#c9a84c' : 'rgba(201,168,76,0.3)'}`,
              transition: 'all 0.25s ease',
            }}
            onClick={() => setGdprMarketing(!gdprMarketing)}
          >
            {gdprMarketing && (
              <span style={{ color: '#060f08', fontSize: '0.55rem', fontWeight: 700 }}>✓</span>
            )}
          </div>
          <span
            className="italic"
            style={{
              fontFamily: 'var(--font-cormorant)',
              fontSize: '0.88rem',
              color: 'rgba(232,217,184,0.55)',
              lineHeight: 1.5,
            }}
          >
            Želim prejemati ekskluzivne ponudbe in novosti
          </span>
        </label>
      </motion.div>

      {/* CTA */}
      <motion.div variants={itemVariants} className="mt-6 flex justify-center">
        <button
          onClick={handleSubmit}
          disabled={!privacyConsent || isSubmitting}
          className="mc-btn-gold w-full max-w-sm py-4"
          style={{ opacity: (!privacyConsent || isSubmitting) ? 0.5 : 1, cursor: (!privacyConsent || isSubmitting) ? 'not-allowed' : 'pointer' }}
        >
          {isSubmitting ? 'Pošiljam...' : 'Nadaljuj na Potrditev'}
        </button>
      </motion.div>
    </motion.div>
  );
}
