'use client';

import { useState } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { format } from 'date-fns';
import { sl } from 'date-fns/locale';
import { useBookingStore } from '@/store/bookingStore';
import { CustomerDetails } from '@/types';
import { getContrastMode } from '../ClassicLayout';

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}

const GENDERS = [
  { value: 'male', label: 'Gospod' },
  { value: 'female', label: 'Gospa' },
  { value: 'other', label: 'Drugo' },
];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: 'easeOut' as const },
  },
};

function ClassicInput({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  error,
  primaryColor,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  error?: string;
  primaryColor: string;
}) {
  const [focused, setFocused] = useState(false);

  return (
    <div>
      <label
        className="block text-xs font-semibold uppercase tracking-wide mb-1.5"
        style={{ fontFamily: 'var(--font-nunito-sans)', color: '#6B7280' }}
      >
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
        style={{
          fontFamily: 'var(--font-nunito-sans)',
          background: 'rgba(255,255,255,0.97)',
          border: error
            ? '2px solid #EF4444'
            : focused
            ? `2px solid ${primaryColor}`
            : '2px solid #E5E7EB',
          color: '#1F2937',
          boxShadow: focused ? `0 0 0 3px ${primaryColor}20` : 'none',
        }}
      />
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="text-xs mt-1"
            style={{ fontFamily: 'var(--font-nunito-sans)', color: '#EF4444' }}
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

// Booking mini-summary at top of form
function BookingMiniSummary({ primaryColor }: { primaryColor: string }) {
  const { selectedService, selectedDate, selectedTime, selectedEmployeeId, anyPerson, employeesUI } =
    useBookingStore();

  if (!selectedService) return null;

  const selectedEmployee = employeesUI.find((e) => e.id === selectedEmployeeId);

  return (
    <div
      className="rounded-2xl p-4 mb-6 flex items-start gap-4"
      style={{
        background: 'rgba(255,255,255,0.92)',
        border: `1px solid ${primaryColor}20`,
        boxShadow: `0 2px 12px rgba(0,0,0,0.05)`,
      }}
    >
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-sm"
        style={{ backgroundColor: primaryColor, fontFamily: 'var(--font-nunito)' }}
      >
        ✓
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-bold text-gray-900 mb-0.5" style={{ fontFamily: 'var(--font-nunito-sans)' }}>
          {selectedService.naziv}
        </p>
        <div className="flex flex-wrap gap-x-4 gap-y-0.5">
          {(anyPerson ? 'Kdorkoli' : selectedEmployee?.label) && (
            <span className="text-xs text-gray-500" style={{ fontFamily: 'var(--font-nunito-sans)' }}>
              👤 {anyPerson ? 'Kdorkoli' : selectedEmployee?.label}
            </span>
          )}
          {selectedDate && selectedTime && (
            <span className="text-xs text-gray-500" style={{ fontFamily: 'var(--font-nunito-sans)' }}>
              📅 {format(selectedDate, 'd. MMM', { locale: sl })} ob {selectedTime}
            </span>
          )}
          <span className="text-xs text-gray-500" style={{ fontFamily: 'var(--font-nunito-sans)' }}>
            ⏱ {selectedService.trajanjeMin} min
          </span>
        </div>
      </div>
      <p
        className="font-bold flex-shrink-0"
        style={{ fontFamily: 'var(--font-nunito)', color: primaryColor, fontSize: '1.1rem' }}
      >
        {Number(selectedService.cena).toFixed(2).replace('.', ',')} €
      </p>
    </div>
  );
}

export default function ClassicCustomerDetails() {
  const { theme, setCustomerDetails, nextStep } = useBookingStore();

  const contrastMode = getContrastMode(theme.bgFrom, theme.bgTo);
  const textPrimary =
    contrastMode === 'light' ? 'rgba(255,255,255,0.95)' : 'rgba(0,0,0,0.9)';
  const textSecondary =
    contrastMode === 'light' ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.55)';

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState('');
  const [notes, setNotes] = useState('');
  const [gdprMarketing, setGdprMarketing] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const validate = (): boolean => {
    const e: FormErrors = {};
    if (!firstName.trim()) e.firstName = 'Ime je obvezno';
    if (!lastName.trim()) e.lastName = 'Priimek je obvezen';
    if (!email.trim()) e.email = 'Email je obvezen';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Email ni veljaven';
    if (!phone.trim()) e.phone = 'Telefon je obvezen';
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
    };
    setCustomerDetails(details);
    nextStep();
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      {/* Page title */}
      <motion.div variants={itemVariants} className="mb-6">
        <h2
          className="text-3xl font-bold mb-2"
          style={{ fontFamily: 'var(--font-nunito)', color: textPrimary }}
        >
          Vaši podatki
        </h2>
        <p style={{ fontFamily: 'var(--font-nunito-sans)', color: textSecondary }}>
          Izpolnite kontaktne podatke za rezervacijo
        </p>
      </motion.div>

      {/* Booking mini-summary */}
      <motion.div variants={itemVariants}>
        <BookingMiniSummary primaryColor={theme.primaryColor} />
      </motion.div>

      {/* Form card */}
      <motion.div
        variants={itemVariants}
        className="rounded-2xl p-6"
        style={{
          background: 'rgba(255,255,255,0.95)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
        }}
      >
        <p
          className="text-xs uppercase tracking-widest font-bold mb-6"
          style={{ fontFamily: 'var(--font-nunito)', color: '#9CA3AF' }}
        >
          Kontaktni podatki
        </p>

        {/* Name row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <ClassicInput
            label="Ime *"
            value={firstName}
            onChange={setFirstName}
            placeholder="Janez"
            error={errors.firstName}
            primaryColor={theme.primaryColor}
          />
          <ClassicInput
            label="Priimek *"
            value={lastName}
            onChange={setLastName}
            placeholder="Novak"
            error={errors.lastName}
            primaryColor={theme.primaryColor}
          />
        </div>

        {/* Email */}
        <div className="mb-4">
          <ClassicInput
            label="Email *"
            value={email}
            onChange={setEmail}
            placeholder="janez@email.com"
            type="email"
            error={errors.email}
            primaryColor={theme.primaryColor}
          />
        </div>

        {/* Phone */}
        <div className="mb-4">
          <ClassicInput
            label="Telefon *"
            value={phone}
            onChange={setPhone}
            placeholder="041 123 456"
            type="tel"
            error={errors.phone}
            primaryColor={theme.primaryColor}
          />
        </div>

        {/* Gender */}
        <div className="mb-4">
          <label
            className="block text-xs font-semibold uppercase tracking-wide mb-2"
            style={{ fontFamily: 'var(--font-nunito-sans)', color: '#6B7280' }}
          >
            Nagovor (opcijsko)
          </label>
          <div className="flex gap-2">
            {GENDERS.map((g) => {
              const isSelected = gender === g.value;
              return (
                <motion.button
                  key={g.value}
                  type="button"
                  onClick={() => setGender(isSelected ? '' : g.value)}
                  className="flex-1 py-2 rounded-xl text-sm font-medium transition-all"
                  style={{
                    fontFamily: 'var(--font-nunito-sans)',
                    backgroundColor: isSelected ? `${theme.primaryColor}15` : '#F9FAFB',
                    border: isSelected
                      ? `2px solid ${theme.primaryColor}`
                      : '2px solid #E5E7EB',
                    color: isSelected ? theme.primaryColor : '#6B7280',
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {g.label}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Notes */}
        <div className="mb-5">
          <label
            className="block text-xs font-semibold uppercase tracking-wide mb-1.5"
            style={{ fontFamily: 'var(--font-nunito-sans)', color: '#6B7280' }}
          >
            Posebne želje (opcijsko)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Posebne opombe ali zahteve..."
            rows={3}
            className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none transition-all"
            style={{
              fontFamily: 'var(--font-nunito-sans)',
              background: '#F9FAFB',
              border: '2px solid #E5E7EB',
              color: '#1F2937',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = theme.primaryColor;
              e.target.style.boxShadow = `0 0 0 3px ${theme.primaryColor}20`;
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#E5E7EB';
              e.target.style.boxShadow = 'none';
            }}
          />
        </div>

        {/* GDPR */}
        <label className="flex items-start gap-3 cursor-pointer">
          <div
            className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5 transition-all"
            style={{
              backgroundColor: gdprMarketing ? theme.primaryColor : 'transparent',
              border: `2px solid ${gdprMarketing ? theme.primaryColor : '#D1D5DB'}`,
            }}
            onClick={() => setGdprMarketing(!gdprMarketing)}
          >
            {gdprMarketing && (
              <span style={{ color: '#ffffff', fontSize: '0.65rem', fontWeight: 700 }}>✓</span>
            )}
          </div>
          <span
            className="text-sm leading-relaxed"
            style={{ fontFamily: 'var(--font-nunito-sans)', color: '#6B7280' }}
          >
            Želim prejemati ekskluzivne ponudbe in novosti
          </span>
        </label>
      </motion.div>

      {/* Submit button */}
      <motion.div variants={itemVariants} className="mt-6 flex justify-end">
        <motion.button
          onClick={handleSubmit}
          className="px-8 py-4 rounded-2xl font-bold text-white flex items-center gap-2"
          style={{
            fontFamily: 'var(--font-nunito)',
            backgroundColor: theme.primaryColor,
            boxShadow: `0 8px 28px ${theme.primaryColor}40`,
          }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          Naprej na potrditev
          <span style={{ fontSize: '1rem' }}>→</span>
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
