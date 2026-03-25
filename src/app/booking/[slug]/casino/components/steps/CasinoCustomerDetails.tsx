'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { sl } from 'date-fns/locale';
import { useBookingStore } from '@/store/bookingStore';
import { CustomerDetails } from '@/types';

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}

const GENDERS = [
  { value: 'male', label: 'Gospod', suit: '♠' },
  { value: 'female', label: 'Gospa', suit: '♥' },
  { value: 'other', label: 'Drugo', suit: '♦' },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

function NeonLabel({ children }: { children: React.ReactNode }) {
  const { theme } = useBookingStore();
  return (
    <label
      className="block text-[9px] font-bold tracking-[0.3em] uppercase mb-1.5"
      style={{ fontFamily: 'var(--font-orbitron)', color: `${theme.primaryColor}80` }}
    >
      {children}
    </label>
  );
}

function NeonInput({
  value,
  onChange,
  placeholder,
  type = 'text',
  hasError,
  icon,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  type?: string;
  hasError?: boolean;
  icon?: string;
}) {
  const { theme } = useBookingStore();
  const [focused, setFocused] = useState(false);
  const primary = theme.primaryColor;

  return (
    <div className="relative">
      {icon && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm pointer-events-none">
          {icon}
        </span>
      )}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className={`w-full rounded-lg py-2.5 text-sm transition-all casino-input ${hasError ? 'error' : ''}`}
        style={{
          fontFamily: 'var(--font-inter)',
          paddingLeft: icon ? '2.25rem' : '0.875rem',
          paddingRight: '0.875rem',
          backgroundColor: '#0D1117',
          border: `1px solid ${hasError ? '#FF3366' : focused ? primary : 'rgba(139,92,246,0.3)'}`,
          color: 'white',
          boxShadow: focused
            ? `0 0 0 1px ${primary}, 0 0 10px ${primary}40`
            : hasError
            ? '0 0 8px rgba(255,51,102,0.4)'
            : 'none',
          outline: 'none',
        }}
      />
    </div>
  );
}

function NeonTextarea({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  const { theme } = useBookingStore();
  const [focused, setFocused] = useState(false);
  const primary = theme.primaryColor;

  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={3}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      className="w-full rounded-lg p-3 text-sm transition-all casino-input resize-none"
      style={{
        fontFamily: 'var(--font-inter)',
        backgroundColor: '#0D1117',
        border: `1px solid ${focused ? primary : 'rgba(139,92,246,0.3)'}`,
        color: 'white',
        boxShadow: focused ? `0 0 0 1px ${primary}, 0 0 10px ${primary}40` : 'none',
        outline: 'none',
      }}
    />
  );
}

function BookingSummary() {
  const {
    theme,
    selectedService,
    selectedDate,
    selectedTime,
    selectedEmployeeId,
    anyPerson,
    employeesUI,
  } = useBookingStore();

  const primary = theme.primaryColor;
  const selectedEmployee = employeesUI.find((e) => e.id === selectedEmployeeId);

  if (!selectedService) return null;

  return (
    <div
      className="rounded-xl p-4"
      style={{ backgroundColor: '#16213E', border: `1px solid ${primary}25` }}
    >
      <p
        className="text-[9px] tracking-[0.3em] uppercase font-bold mb-4"
        style={{ fontFamily: 'var(--font-orbitron)', color: `${primary}70` }}
      >
        ⭐ YOUR JACKPOT
      </p>

      <div className="space-y-2.5">
        {(selectedEmployee || anyPerson) && (
          <div className="flex justify-between items-center">
            <span
              className="text-[10px] tracking-wider uppercase"
              style={{ fontFamily: 'var(--font-orbitron)', color: 'rgba(255,255,255,0.35)' }}
            >
              👤 Mojster
            </span>
            <span
              className="text-xs font-bold text-white"
              style={{ fontFamily: 'var(--font-inter)' }}
            >
              {selectedEmployee ? selectedEmployee.label : 'Kdorkoli prost'}
            </span>
          </div>
        )}

        <div className="flex justify-between items-center">
          <span
            className="text-[10px] tracking-wider uppercase"
            style={{ fontFamily: 'var(--font-orbitron)', color: 'rgba(255,255,255,0.35)' }}
          >
            🎰 Storitev
          </span>
          <span
            className="text-xs font-bold text-white text-right max-w-[160px] leading-tight"
            style={{ fontFamily: 'var(--font-inter)' }}
          >
            {selectedService.naziv}
          </span>
        </div>

        {selectedDate && (
          <div className="flex justify-between items-center">
            <span
              className="text-[10px] tracking-wider uppercase"
              style={{ fontFamily: 'var(--font-orbitron)', color: 'rgba(255,255,255,0.35)' }}
            >
              📅 Datum
            </span>
            <span
              className="text-xs font-bold text-white"
              style={{ fontFamily: 'var(--font-inter)' }}
            >
              {format(selectedDate, 'd. MMM yyyy', { locale: sl })}
            </span>
          </div>
        )}

        {selectedTime && (
          <div className="flex justify-between items-center">
            <span
              className="text-[10px] tracking-wider uppercase"
              style={{ fontFamily: 'var(--font-orbitron)', color: 'rgba(255,255,255,0.35)' }}
            >
              ⏰ Ura
            </span>
            <span
              className="text-xs font-bold"
              style={{ fontFamily: 'var(--font-orbitron)', color: primary }}
            >
              {selectedTime}
            </span>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="casino-divider-gold my-3" />

      {/* Total */}
      <div className="flex justify-between items-center">
        <span
          className="text-[10px] tracking-[0.25em] uppercase font-bold"
          style={{ fontFamily: 'var(--font-orbitron)', color: 'rgba(255,215,0,0.7)' }}
        >
          💰 TOTAL
        </span>
        <span
          className="text-xl font-black casino-neon-gold"
          style={{ fontFamily: 'var(--font-orbitron)' }}
        >
          €{selectedService.cena}
        </span>
      </div>
    </div>
  );
}

export default function CasinoCustomerDetails() {
  const { setCustomerDetails, nextStep, theme } = useBookingStore();
  const primary = theme.primaryColor;

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState('');
  const [notes, setNotes] = useState('');
  const [gdprMarketing, setGdprMarketing] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!firstName.trim()) newErrors.firstName = 'Ime je obvezno';
    if (!lastName.trim()) newErrors.lastName = 'Priimek je obvezen';
    if (!email.trim()) newErrors.email = 'Email je obvezen';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = 'Email ni veljaven';
    if (!phone.trim()) newErrors.phone = 'Telefon je obvezen';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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
      {/* Summary */}
      <motion.div variants={itemVariants} className="mb-5">
        <BookingSummary />
      </motion.div>

      {/* Form card */}
      <motion.div
        variants={itemVariants}
        className="rounded-xl p-5 space-y-4"
        style={{ backgroundColor: '#1A1A2E', border: `1px solid ${primary}20` }}
      >
        {/* Name row */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <NeonLabel>Ime</NeonLabel>
            <NeonInput
              value={firstName}
              onChange={setFirstName}
              placeholder="Janez"
              hasError={!!errors.firstName}
            />
            <AnimatePresence>
              {errors.firstName && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-[10px] mt-1 font-bold tracking-wider"
                  style={{ color: '#FF3366', fontFamily: 'var(--font-orbitron)' }}
                >
                  ⚠ {errors.firstName}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
          <div>
            <NeonLabel>Priimek</NeonLabel>
            <NeonInput
              value={lastName}
              onChange={setLastName}
              placeholder="Novak"
              hasError={!!errors.lastName}
            />
            <AnimatePresence>
              {errors.lastName && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-[10px] mt-1 font-bold tracking-wider"
                  style={{ color: '#FF3366', fontFamily: 'var(--font-orbitron)' }}
                >
                  ⚠ {errors.lastName}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Email */}
        <div>
          <NeonLabel>Email</NeonLabel>
          <NeonInput
            value={email}
            onChange={setEmail}
            placeholder="janez@email.com"
            type="email"
            hasError={!!errors.email}
            icon="📧"
          />
          <AnimatePresence>
            {errors.email && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="text-[10px] mt-1 font-bold tracking-wider"
                style={{ color: '#FF3366', fontFamily: 'var(--font-orbitron)' }}
              >
                ⚠ {errors.email}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Phone */}
        <div>
          <NeonLabel>Telefon</NeonLabel>
          <NeonInput
            value={phone}
            onChange={setPhone}
            placeholder="041 123 456"
            type="tel"
            hasError={!!errors.phone}
            icon="📱"
          />
          <AnimatePresence>
            {errors.phone && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="text-[10px] mt-1 font-bold tracking-wider"
                style={{ color: '#FF3366', fontFamily: 'var(--font-orbitron)' }}
              >
                ⚠ {errors.phone}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Gender pills */}
        <div>
          <NeonLabel>VIP Status (opcijsko)</NeonLabel>
          <div className="flex gap-2">
            {GENDERS.map((g) => {
              const isSelected = gender === g.value;
              return (
                <motion.button
                  key={g.value}
                  onClick={() => setGender(isSelected ? '' : g.value)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex-1 py-2 rounded-lg text-xs font-bold tracking-wider transition-all"
                  style={{
                    fontFamily: 'var(--font-orbitron)',
                    backgroundColor: isSelected ? primary : `${primary}10`,
                    border: `1px solid ${isSelected ? primary : `${primary}30`}`,
                    color: isSelected ? 'white' : `${primary}80`,
                    boxShadow: isSelected ? `0 0 10px ${primary}50` : 'none',
                  }}
                >
                  {g.suit} {g.label}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Notes */}
        <div>
          <NeonLabel>Posebne želje (opcijsko)</NeonLabel>
          <NeonTextarea
            value={notes}
            onChange={setNotes}
            placeholder="Posebne želje ali opombe..."
          />
        </div>

        {/* GDPR checkbox */}
        <label className="flex items-center gap-3 cursor-pointer group">
          <div
            className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 transition-all"
            style={{
              backgroundColor: gdprMarketing ? primary : 'transparent',
              border: `2px solid ${gdprMarketing ? primary : 'rgba(255,255,255,0.2)'}`,
              boxShadow: gdprMarketing ? `0 0 8px ${primary}60` : 'none',
            }}
            onClick={() => setGdprMarketing(!gdprMarketing)}
          >
            {gdprMarketing && <span className="text-white text-xs">✓</span>}
          </div>
          <span
            className="text-xs"
            style={{ fontFamily: 'var(--font-inter)', color: 'rgba(255,255,255,0.5)' }}
          >
            🎁 Pošljite mi ekskluzivne ponudbe
          </span>
        </label>
      </motion.div>

      {/* Submit button */}
      <motion.div variants={itemVariants} className="mt-5">
        <motion.button
          onClick={handleSubmit}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          className="w-full py-4 rounded-xl font-black text-sm tracking-[0.15em] uppercase casino-btn-primary"
          style={{ fontFamily: 'var(--font-orbitron)' }}
        >
          🎰 PROCEED TO JACKPOT 🎰
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
