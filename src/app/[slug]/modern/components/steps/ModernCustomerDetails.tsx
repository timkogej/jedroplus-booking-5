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
  privacyConsent?: string;
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.32, ease: 'easeOut' as const },
  },
};

function ModernLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label
      className="block mb-1.5 text-xs font-semibold tracking-wide"
      style={{ color: 'var(--t-muted)', fontFamily: 'var(--font-inter)' }}
    >
      {children}
      {required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
  );
}

function ModernInput({
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
      className={`modern-input ${hasError ? 'error' : ''}`}
      style={{
        borderColor: hasError ? '#EF4444' : focused ? primaryColor : 'var(--b2)',
        boxShadow: focused && !hasError ? `0 0 0 3px ${primaryColor}18` : undefined,
        outline: 'none',
      }}
    />
  );
}

export default function ModernCustomerDetails() {
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
    if (!privacyConsent) e.privacyConsent = 'Strinjanje s pogoji je obvezno';
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

  const isFormComplete = firstName && lastName && email && phone && gender && privacyConsent;

  const errorText = (msg?: string) =>
    msg ? (
      <motion.p
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        className="text-xs mt-1"
        style={{ color: '#EF4444', fontFamily: 'var(--font-inter)' }}
      >
        {msg}
      </motion.p>
    ) : null;

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      {/* Heading */}
      <motion.div variants={itemVariants} className="mb-8">
        <h2
          className="text-3xl font-bold mb-2"
          style={{ color: 'var(--t-primary)', fontFamily: 'var(--font-dm-sans)' }}
        >
          Vaši{' '}
          <span
            className="modern-gradient-text"
            style={{
              backgroundImage: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})`,
            }}
          >
            podatki
          </span>
        </h2>
        <p className="text-sm" style={{ color: 'var(--t-muted)', fontFamily: 'var(--font-inter)' }}>
          Izpolnite podatke za rezervacijo
        </p>
      </motion.div>

      {/* Form card */}
      <motion.div
        variants={itemVariants}
        className="rounded-2xl p-6 modern-glass mb-4"
        style={{
          backgroundColor: 'var(--s2)',
          border: '1px solid var(--b2)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
      >
        {/* Name row */}
        <div className="grid grid-cols-2 gap-4 mb-5">
          <div>
            <ModernLabel required>Ime</ModernLabel>
            <ModernInput
              value={firstName}
              onChange={setFirstName}
              placeholder="Janez"
              hasError={!!errors.firstName}
              primaryColor={theme.primaryColor}
            />
            <AnimatePresence>{errorText(errors.firstName)}</AnimatePresence>
          </div>
          <div>
            <ModernLabel required>Priimek</ModernLabel>
            <ModernInput
              value={lastName}
              onChange={setLastName}
              placeholder="Novak"
              hasError={!!errors.lastName}
              primaryColor={theme.primaryColor}
            />
            <AnimatePresence>{errorText(errors.lastName)}</AnimatePresence>
          </div>
        </div>

        {/* Email */}
        <div className="mb-5">
          <ModernLabel required>Email</ModernLabel>
          <ModernInput
            value={email}
            onChange={setEmail}
            placeholder="janez@email.com"
            type="email"
            hasError={!!errors.email}
            primaryColor={theme.primaryColor}
          />
          <AnimatePresence>{errorText(errors.email)}</AnimatePresence>
        </div>

        {/* Phone */}
        <div className="mb-5">
          <ModernLabel required>Telefon</ModernLabel>
          <ModernInput
            value={phone}
            onChange={setPhone}
            placeholder="041 123 456"
            type="tel"
            hasError={!!errors.phone}
            primaryColor={theme.primaryColor}
          />
          <AnimatePresence>{errorText(errors.phone)}</AnimatePresence>
        </div>

        {/* Gender */}
        <div className="mb-5">
          <ModernLabel required>Nagovor</ModernLabel>
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
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
                  style={{
                    fontFamily: 'var(--font-inter)',
                    backgroundColor: isSelected ? `${theme.primaryColor}20` : 'var(--s1)',
                    border: `1px solid ${isSelected ? theme.primaryColor : errors.gender ? '#EF4444' : 'var(--b2)'}`,
                    color: isSelected ? theme.primaryColor : 'var(--t-muted)',
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                >
                  {opt.label}
                </motion.button>
              );
            })}
          </div>
          <AnimatePresence>{errorText(errors.gender)}</AnimatePresence>
        </div>

        {/* Notes */}
        <div className="mb-6">
          <ModernLabel>Opombe</ModernLabel>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Posebne želje ali opombe..."
            rows={3}
            className="modern-textarea"
          />
        </div>

        {/* Checkboxes */}
        <div className="space-y-3">
          {/* Marketing — optional */}
          <label className="flex items-start gap-3 cursor-pointer">
            <motion.div
              className="w-5 h-5 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 transition-all"
              style={{
                backgroundColor: gdprMarketing ? theme.primaryColor : 'var(--s1)',
                border: `1.5px solid ${gdprMarketing ? theme.primaryColor : 'var(--b2)'}`,
              }}
              onClick={() => setGdprMarketing(!gdprMarketing)}
              whileTap={{ scale: 0.9 }}
            >
              {gdprMarketing && (
                <motion.svg
                  className="w-3 h-3 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </motion.svg>
              )}
            </motion.div>
            <span
              className="text-sm leading-relaxed"
              style={{ color: 'var(--t-muted)', fontFamily: 'var(--font-inter)' }}
            >
              Želim prejemati obvestila o ponudbah in novostih
            </span>
          </label>

          {/* Privacy consent — required */}
          <div>
            <label className="flex items-start gap-3 cursor-pointer">
              <motion.div
                className="w-5 h-5 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 transition-all"
                style={{
                  backgroundColor: privacyConsent ? theme.primaryColor : 'var(--s1)',
                  border: `1.5px solid ${
                    errors.privacyConsent
                      ? '#EF4444'
                      : privacyConsent
                      ? theme.primaryColor
                      : 'var(--b2)'
                  }`,
                  boxShadow: errors.privacyConsent ? '0 0 0 3px rgba(239,68,68,0.12)' : 'none',
                }}
                onClick={() => {
                  setPrivacyConsent(!privacyConsent);
                  if (errors.privacyConsent) setErrors((prev) => ({ ...prev, privacyConsent: undefined }));
                }}
                whileTap={{ scale: 0.9 }}
              >
                {privacyConsent && (
                  <motion.svg
                    className="w-3 h-3 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </motion.svg>
                )}
              </motion.div>
              <span
                className="text-sm leading-relaxed"
                style={{ color: 'var(--t-muted)', fontFamily: 'var(--font-inter)' }}
              >
                Strinjam se z obdelavo osebnih podatkov za namen rezervacije termina.{' '}
                <a
                  href="https://jedroplus.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline transition-colors"
                  style={{ color: theme.primaryColor }}
                >
                  Preberi politiko zasebnosti
                </a>
                <span className="text-red-400 ml-0.5">*</span>
              </span>
            </label>
            <AnimatePresence>{errorText(errors.privacyConsent)}</AnimatePresence>
          </div>
        </div>
      </motion.div>

      {/* Submit */}
      <motion.div variants={itemVariants}>
        <motion.button
          onClick={handleSubmit}
          disabled={!isFormComplete}
          className="w-full py-4 rounded-2xl font-semibold text-white transition-all relative overflow-hidden"
          style={{
            backgroundColor: isFormComplete ? theme.primaryColor : 'var(--s3)',
            color: isFormComplete ? '#ffffff' : 'var(--t-disabled)',
            fontFamily: 'var(--font-inter)',
            fontSize: '0.975rem',
            cursor: isFormComplete ? 'pointer' : 'not-allowed',
            boxShadow: isFormComplete ? `0 8px 28px ${theme.primaryColor}40` : 'none',
          }}
          whileHover={isFormComplete ? { scale: 1.02, boxShadow: `0 12px 36px ${theme.primaryColor}50` } : {}}
          whileTap={isFormComplete ? { scale: 0.98 } : {}}
        >
          {isFormComplete && (
            <motion.div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.18) 50%, transparent 100%)',
                backgroundSize: '200% 100%',
              }}
              animate={{ backgroundPosition: ['-100% 0', '200% 0'] }}
              transition={{ duration: 2.2, repeat: Infinity, repeatDelay: 2 }}
            />
          )}
          Nadaljuj
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
