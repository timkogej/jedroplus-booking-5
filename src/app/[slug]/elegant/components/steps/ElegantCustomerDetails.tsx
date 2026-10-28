'use client';

import { useState } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { useBookingStore } from '@/store/bookingStore';
import { CustomerDetails } from '@/types';
import { useSecureBooking } from '@/hooks/useSecureBooking';
import { usePromotionsStore } from '@/store/promotionsStore';
import { AddOnSelector } from '@/components/shared/AddOnSelector';
import { contactFieldAttrs, type ContactField } from '@/lib/booking/fieldAttrs';
import { stickyCtaStyle } from '@/lib/booking/stickyCta';

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  gender?: string;
  privacyConsent?: string;
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.28, ease: 'easeOut' as const },
  },
};

function ElegantLabel({
  children,
  required,
}: {
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label
      className="block mb-1.5"
      style={{
        fontFamily: 'var(--font-inter)',
        fontSize: '0.8rem',
        fontWeight: 500,
        color: '#374151',
      }}
    >
      {children}
      {required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
  );
}

function ElegantInput({
  field,
  value,
  onChange,
  placeholder,
  type = 'text',
  hasError,
  primaryColor,
}: {
  field?: ContactField;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  hasError?: boolean;
  primaryColor: string;
}) {
  const [focused, setFocused] = useState(false);

  return (
    <input
      {...contactFieldAttrs(field)}
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      className={`elegant-input ${hasError ? 'error' : ''}`}
      style={{
        borderColor: hasError ? '#EF4444' : focused ? primaryColor : '#E5E7EB',
        boxShadow: focused && !hasError ? `0 0 0 3px ${primaryColor}12` : undefined,
      }}
    />
  );
}

export default function ElegantCustomerDetails() {
  const { setCustomerDetails, nextStep, theme } = useBookingStore();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState('');
  const [notes, setNotes] = useState('');
  const [gdprMarketing, setGdprMarketing] = useState(false);
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [website, setWebsite] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});

  const { isSubmitting, error, fieldErrors, submitBooking, sanitize } = useSecureBooking({ companyId: 'elegant' });
  const { availableAddOns, isLoadingAddOns } = usePromotionsStore();

  const validate = (): boolean => {
    const e: FormErrors = {};
    if (!firstName.trim()) e.firstName = 'Ime je obvezno';
    if (!lastName.trim()) e.lastName = 'Priimek je obvezen';
    if (!email.trim()) e.email = 'Email je obvezen';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Email ni veljaven';
    if (!phone.trim()) e.phone = 'Telefon je obvezen';
    if (!privacyConsent) e.privacyConsent = 'Strinjanje s pogoji je obvezno';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    const fd = {
      ime: sanitize(firstName.trim()),
      priimek: sanitize(lastName.trim()),
      email: email.trim(),
      telefon: phone.trim(),
      opombe: notes.trim() || undefined,
      website,
    };
    const success = await submitBooking(fd);
    if (success) {
      const details: CustomerDetails = {
        firstName: fd.ime,
        lastName: fd.priimek,
        email: fd.email,
        phone: fd.telefon,
        gender: gender || undefined,
        notes: notes.trim() || undefined,
        gdprSendMarketing: gdprMarketing,
        privacyConsent,
      };
      setCustomerDetails(details);
      nextStep();
    }
  };

  const isFormComplete = firstName && lastName && email && phone && privacyConsent && !isSubmitting;

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      {/* Heading */}
      <motion.div variants={itemVariants} className="mb-8">
        <h2
          style={{
            fontFamily: 'var(--font-playfair)',
            fontSize: '2.1rem',
            fontWeight: 400,
            color: '#111111',
            lineHeight: 1.2,
          }}
        >
          Vaši <span style={{ color: theme.primaryOnLight }}>podatki</span>
        </h2>
        <p
          className="mt-2"
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '0.9rem',
            color: '#6B7280',
          }}
        >
          Izpolnite podatke za rezervacijo
        </p>
      </motion.div>

      {/* Add-on selector */}
      <motion.div variants={itemVariants}>
        <AddOnSelector
          addOns={availableAddOns}
          isLoading={isLoadingAddOns}
          primaryColor={theme.primarySolid}
          variantStyle="elegant"
        />
      </motion.div>

      {/* Form card */}
      <motion.div
        variants={itemVariants}
        className="rounded-xl border p-6"
        style={{
          borderColor: '#E5E7EB',
          backgroundColor: 'white',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}
      >
        {/* Name row */}
        <div className="grid grid-cols-2 gap-4 mb-5">
          <div>
            <ElegantLabel required>Ime</ElegantLabel>
            <ElegantInput
              field="firstName"
              value={firstName}
              onChange={setFirstName}
              placeholder="Janez"
              hasError={!!errors.firstName}
              primaryColor={theme.primarySolid}
            />
            <AnimatePresence>
              {errors.firstName && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{
                    fontFamily: 'var(--font-inter)',
                    fontSize: '0.75rem',
                    color: '#EF4444',
                    marginTop: '0.25rem',
                  }}
                >
                  {errors.firstName}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
          <div>
            <ElegantLabel required>Priimek</ElegantLabel>
            <ElegantInput
              field="lastName"
              value={lastName}
              onChange={setLastName}
              placeholder="Novak"
              hasError={!!errors.lastName}
              primaryColor={theme.primarySolid}
            />
            <AnimatePresence>
              {errors.lastName && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{
                    fontFamily: 'var(--font-inter)',
                    fontSize: '0.75rem',
                    color: '#EF4444',
                    marginTop: '0.25rem',
                  }}
                >
                  {errors.lastName}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Email */}
        <div className="mb-5">
          <ElegantLabel required>Email</ElegantLabel>
          <ElegantInput
            field="email"
            value={email}
            onChange={setEmail}
            placeholder="janez@email.com"
            type="email"
            hasError={!!errors.email}
            primaryColor={theme.primarySolid}
          />
          <AnimatePresence>
            {(errors.email || fieldErrors.email) && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{
                  fontFamily: 'var(--font-inter)',
                  fontSize: '0.75rem',
                  color: '#EF4444',
                  marginTop: '0.25rem',
                }}
              >
                {errors.email || fieldErrors.email}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Phone */}
        <div className="mb-5">
          <ElegantLabel required>Telefon</ElegantLabel>
          <ElegantInput
            field="phone"
            value={phone}
            onChange={setPhone}
            placeholder="041 123 456"
            type="tel"
            hasError={!!errors.phone}
            primaryColor={theme.primarySolid}
          />
          <AnimatePresence>
            {errors.phone && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{
                  fontFamily: 'var(--font-inter)',
                  fontSize: '0.75rem',
                  color: '#EF4444',
                  marginTop: '0.25rem',
                }}
              >
                {errors.phone}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Gender */}
        <div className="mb-5">
          <ElegantLabel>Nagovor (neobvezno)</ElegantLabel>
          <div className="flex gap-2 mt-1">
            {[
              { value: 'male', label: 'Gospod' },
              { value: 'female', label: 'Gospa' },
              { value: 'other', label: 'Nevtralno' },
            ].map((opt) => {
              const isSelected = gender === opt.value;
              return (
                <motion.button
                  key={opt.value}
                  type="button"
                  onClick={() => setGender(isSelected ? '' : opt.value)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 py-2.5 rounded-lg text-sm transition-all duration-200"
                  style={{
                    fontFamily: 'var(--font-inter)',
                    backgroundColor: isSelected ? `${theme.primaryColor}10` : '#F9FAFB',
                    border: `1px solid ${isSelected ? theme.primarySolid : errors.gender ? '#FECACA' : '#E5E7EB'}`,
                    color: isSelected ? theme.primarySolid : '#6B7280',
                    fontWeight: isSelected ? 500 : 400,
                  }}
                >
                  {opt.label}
                </motion.button>
              );
            })}
          </div>
          <AnimatePresence>
            {errors.gender && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{
                  fontFamily: 'var(--font-inter)',
                  fontSize: '0.75rem',
                  color: '#EF4444',
                  marginTop: '0.25rem',
                }}
              >
                {errors.gender}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Notes */}
        <div className="mb-6">
          <ElegantLabel>Opombe</ElegantLabel>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Posebne želje ali opombe..."
            rows={3}
            className="elegant-textarea"
          />
        </div>

        {/* Honeypot */}
        <input
          type="text"
          name="website"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          tabIndex={-1}
          aria-hidden="true"
          autoComplete="off"
          style={{ position: 'absolute', left: '-9999px' }}
        />

        {/* Checkboxes */}
        <div className="space-y-3">
          {/* GDPR marketing */}
          <label className="flex items-start gap-3 cursor-pointer group">
            <div
              className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5 transition-all"
              style={{
                backgroundColor: gdprMarketing ? theme.primarySolid : 'white',
                border: `2px solid ${gdprMarketing ? theme.primarySolid : '#D1D5DB'}`,
              }}
              onClick={() => setGdprMarketing(!gdprMarketing)}
            >
              {gdprMarketing && (
                <span style={{ color: 'white', fontSize: '0.6rem', fontWeight: 700 }}>✓</span>
              )}
            </div>
            <span
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: '0.85rem',
                color: '#6B7280',
                lineHeight: 1.5,
              }}
            >
              Želim prejemati obvestila o ponudbah in novostih
            </span>
          </label>

          {/* Privacy consent */}
          <div>
            <label className="flex items-start gap-3 cursor-pointer group">
              <div
                className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5 transition-all"
                style={{
                  backgroundColor: privacyConsent ? theme.primarySolid : 'white',
                  border: `2px solid ${
                    privacyConsent
                      ? theme.primarySolid
                      : errors.privacyConsent
                      ? '#EF4444'
                      : '#D1D5DB'
                  }`,
                }}
                onClick={() => setPrivacyConsent(!privacyConsent)}
              >
                {privacyConsent && (
                  <span style={{ color: 'white', fontSize: '0.6rem', fontWeight: 700 }}>✓</span>
                )}
              </div>
              <span
                style={{
                  fontFamily: 'var(--font-inter)',
                  fontSize: '0.85rem',
                  color: '#6B7280',
                  lineHeight: 1.5,
                }}
              >
                Strinjam se z obdelavo osebnih podatkov za namen rezervacije termina.{' '}
                <a
                  href="https://jedroplus.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline transition-colors"
                  style={{ color: theme.primaryOnLight }}
                >
                  Preberite politiko zasebnosti
                </a>
                <span className="text-red-400 ml-0.5">*</span>
              </span>
            </label>
            <AnimatePresence>
              {errors.privacyConsent && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{
                    fontFamily: 'var(--font-inter)',
                    fontSize: '0.75rem',
                    color: '#EF4444',
                    marginTop: '0.25rem',
                    marginLeft: '2rem',
                  }}
                >
                  {errors.privacyConsent}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      {/* Submit button */}
      {error && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 text-sm text-center"
          style={{ fontFamily: 'var(--font-inter)', color: '#EF4444' }}
        >
          {error}
        </motion.p>
      )}
      <motion.div
        variants={itemVariants}
        className="booking-sticky-cta mt-5"
        style={stickyCtaStyle('#ffffff', 24)}
      >
        <motion.button
          onClick={handleSubmit}
          disabled={!isFormComplete}
          whileHover={isFormComplete ? { opacity: 0.92 } : {}}
          whileTap={isFormComplete ? { scale: 0.99 } : {}}
          className="w-full py-4 rounded-xl font-medium text-white transition-all"
          style={{
            backgroundColor: isFormComplete ? theme.primarySolid : '#E5E7EB',
            color: isFormComplete ? 'white' : '#6B7280',
            fontFamily: 'var(--font-inter)',
            fontSize: '0.975rem',
            cursor: isFormComplete ? 'pointer' : 'not-allowed',
            boxShadow: isFormComplete ? `0 4px 14px ${theme.primaryColor}30` : 'none',
          }}
        >
          {isSubmitting ? 'Pošiljam...' : 'Nadaljuj'}
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
