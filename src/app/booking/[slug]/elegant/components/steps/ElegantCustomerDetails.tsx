'use client';

import { useState } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { useBookingStore } from '@/store/bookingStore';
import { CustomerDetails } from '@/types';

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  gender?: string;
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
  value,
  onChange,
  placeholder,
  type = 'text',
  hasError,
  primaryColor,
}: {
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
  const [errors, setErrors] = useState<FormErrors>({});

  const validate = (): boolean => {
    const e: FormErrors = {};
    if (!firstName.trim()) e.firstName = 'Ime je obvezno';
    if (!lastName.trim()) e.lastName = 'Priimek je obvezen';
    if (!email.trim()) e.email = 'Email je obvezen';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Email ni veljaven';
    if (!phone.trim()) e.phone = 'Telefon je obvezen';
    if (!gender) e.gender = 'Izberite nagovor';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    const details: CustomerDetails = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      gender: gender || undefined,
      notes: notes.trim() || undefined,
      gdprSendMarketing: gdprMarketing,
      privacyConsent,
    };
    setCustomerDetails(details);
    nextStep();
  };

  const isFormComplete = firstName && lastName && email && phone && gender;

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      {/* Heading */}
      <motion.div variants={itemVariants} className="mb-8">
        <h2
          style={{
            fontFamily: 'var(--font-playfair)',
            fontSize: '1.75rem',
            fontWeight: 400,
            color: '#111111',
            lineHeight: 1.2,
          }}
        >
          Vaši <span style={{ color: theme.primaryColor }}>podatki</span>
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
              value={firstName}
              onChange={setFirstName}
              placeholder="Janez"
              hasError={!!errors.firstName}
              primaryColor={theme.primaryColor}
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
              value={lastName}
              onChange={setLastName}
              placeholder="Novak"
              hasError={!!errors.lastName}
              primaryColor={theme.primaryColor}
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
            value={email}
            onChange={setEmail}
            placeholder="janez@email.com"
            type="email"
            hasError={!!errors.email}
            primaryColor={theme.primaryColor}
          />
          <AnimatePresence>
            {errors.email && (
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
                {errors.email}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Phone */}
        <div className="mb-5">
          <ElegantLabel required>Telefon</ElegantLabel>
          <ElegantInput
            value={phone}
            onChange={setPhone}
            placeholder="041 123 456"
            type="tel"
            hasError={!!errors.phone}
            primaryColor={theme.primaryColor}
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
          <ElegantLabel required>Nagovor</ElegantLabel>
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
                    border: `1px solid ${isSelected ? theme.primaryColor : errors.gender ? '#FECACA' : '#E5E7EB'}`,
                    color: isSelected ? theme.primaryColor : '#6B7280',
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

        {/* Checkboxes */}
        <div className="space-y-3">
          {/* GDPR marketing */}
          <label className="flex items-start gap-3 cursor-pointer group">
            <div
              className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5 transition-all"
              style={{
                backgroundColor: gdprMarketing ? theme.primaryColor : 'white',
                border: `2px solid ${gdprMarketing ? theme.primaryColor : '#D1D5DB'}`,
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
          <label className="flex items-start gap-3 cursor-pointer group">
            <div
              className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5 transition-all"
              style={{
                backgroundColor: privacyConsent ? theme.primaryColor : 'white',
                border: `2px solid ${privacyConsent ? theme.primaryColor : '#D1D5DB'}`,
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
              Strinjam se s pogoji uporabe in politiko zasebnosti
            </span>
          </label>
        </div>
      </motion.div>

      {/* Submit button */}
      <motion.div variants={itemVariants} className="mt-5">
        <motion.button
          onClick={handleSubmit}
          disabled={!isFormComplete}
          whileHover={isFormComplete ? { opacity: 0.92 } : {}}
          whileTap={isFormComplete ? { scale: 0.99 } : {}}
          className="w-full py-4 rounded-xl font-medium text-white transition-all"
          style={{
            backgroundColor: isFormComplete ? theme.primaryColor : '#E5E7EB',
            color: isFormComplete ? 'white' : '#9CA3AF',
            fontFamily: 'var(--font-inter)',
            fontSize: '0.975rem',
            cursor: isFormComplete ? 'pointer' : 'not-allowed',
            boxShadow: isFormComplete ? `0 4px 14px ${theme.primaryColor}30` : 'none',
          }}
        >
          Nadaljuj
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
