'use client';

import { useState } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { format } from 'date-fns';
import { sl } from 'date-fns/locale';
import { useBookingStore } from '@/store/bookingStore';
import type { CustomerDetails } from '@/types';
import { getContrastMode } from '../ClassicLayout';
import { useSecureBooking } from '@/hooks/useSecureBooking';
import { usePromotionsStore } from '@/store/promotionsStore';
import {
  formatBookingPrice,
  getBookingPricing,
  resolvePrimaryPromotion,
} from '@/lib/pricing';
import { AddOnSelector } from '@/components/shared/AddOnSelector';
import { t } from '../../i18n';

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
  visible: { opacity: 1, transition: { staggerChildren: 0.055 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.28, ease: 'easeOut' as const },
  },
};

// ── Clean input component ─────────────────────────────────────────────────────
function FormInput({
  label,
  required,
  value,
  onChange,
  placeholder,
  type = 'text',
  error,
  primaryColor,
}: {
  label: string;
  required?: boolean;
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
        className="block text-xs font-semibold mb-1.5"
        style={{ fontFamily: 'var(--font-nunito-sans)', color: '#6B7280' }}
      >
        {label}
        {required && (
          <span style={{ color: '#EF4444', marginLeft: 3 }}>*</span>
        )}
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
          background: '#ffffff',
          border: error
            ? '2px solid #EF4444'
            : focused
            ? `2px solid ${primaryColor}`
            : '2px solid #E9ECEF',
          color: '#1F2937',
          boxShadow: focused
            ? `0 0 0 3px ${primaryColor}18`
            : error
            ? '0 0 0 3px rgba(239,68,68,0.1)'
            : 'none',
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

// ── Booking summary card (no emojis) ─────────────────────────────────────────
function BookingSummaryCard({ primaryColor }: { primaryColor: string }) {
  const {
    selectedServices,
    selectedService,
    selectedDate,
    selectedTime,
    selectedEmployeeId,
    anyPerson,
    employeesUI,
    language,
  } = useBookingStore();
  const { activePromotion, serviceDiscounts, selectedAddOn } = usePromotionsStore();

  const services =
    selectedServices.length > 0 ? selectedServices : selectedService ? [selectedService] : [];
  const promotion = resolvePrimaryPromotion(services, serviceDiscounts, activePromotion);
  const pricing = getBookingPricing(services, promotion, selectedAddOn);

  if (services.length === 0) return null;

  const selectedEmployee = employeesUI.find((e) => e.id === selectedEmployeeId);
  const totalDuration =
    services.reduce((sum, s) => sum + s.trajanjeMin, 0) +
    (selectedAddOn?.trajanjeMin ?? 0);

  const formatDur = (min: number) => {
    if (min < 60) return `${min} min`;
    const h = Math.floor(min / 60);
    const m = min % 60;
    return m > 0 ? `${h}h ${m}min` : `${h}h`;
  };

  const rows: Array<{ icon: React.ReactNode; text: string }> = [
    {
      icon: (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
          <rect x="9" y="3" width="6" height="4" rx="1" />
        </svg>
      ),
      text: services.map((s) => s.naziv).join(' + '),
    },
    ...(selectedAddOn
      ? [
          {
            icon: (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
            ),
            text: `${selectedAddOn.naziv} (+${formatBookingPrice(selectedAddOn.finalCena)})`,
          },
        ]
      : []),
    ...(selectedEmployee || anyPerson
      ? [
          {
            icon: (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            ),
            text: anyPerson ? t(language, 'anyone') : (selectedEmployee?.label ?? ''),
          },
        ]
      : []),
    ...(selectedDate && selectedTime
      ? [
          {
            icon: (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <path d="M16 2v4M8 2v4M3 10h18" />
              </svg>
            ),
            text: `${format(selectedDate, 'd. MMMM yyyy', { locale: sl })} ob ${selectedTime}`,
          },
        ]
      : []),
    {
      icon: (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v6l4 2" strokeLinecap="round" />
        </svg>
      ),
      text: formatDur(totalDuration),
    },
  ];

  return (
    <div
      className="rounded-2xl p-4 mb-5"
      style={{
        background: 'rgba(255,255,255,0.96)',
        border: `1px solid ${primaryColor}1A`,
        boxShadow: `0 2px 10px rgba(0,0,0,0.05)`,
      }}
    >
      <div className="flex items-start gap-4">
        <div className="flex-1 min-w-0 space-y-1.5">
          {rows.map((row, i) => (
            <div key={i} className="flex items-center gap-2">
              <span style={{ color: '#9CA3AF', flexShrink: 0 }}>{row.icon}</span>
              <span
                className="text-sm text-gray-600 truncate"
                style={{ fontFamily: 'var(--font-nunito-sans)' }}
              >
                {row.text}
              </span>
            </div>
          ))}
        </div>
        <div className="flex-shrink-0 text-right">
          {pricing.hasDiscount && (
            <p
              className="text-xs line-through text-gray-300"
              style={{ fontFamily: 'var(--font-nunito-sans)' }}
            >
              {formatBookingPrice(pricing.originalTotal)}
            </p>
          )}
          <p
            className="text-xl font-bold"
            style={{ fontFamily: 'var(--font-nunito)', color: primaryColor }}
          >
            {formatBookingPrice(pricing.finalTotal)}
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Checkbox ─────────────────────────────────────────────────────────────────
function Checkbox({
  checked,
  onChange,
  primaryColor,
  hasError,
  children,
}: {
  checked: boolean;
  onChange: () => void;
  primaryColor: string;
  hasError?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="flex items-start gap-3 cursor-pointer select-none">
      <button
        type="button"
        onClick={onChange}
        className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5 transition-all"
        style={{
          background: checked ? primaryColor : 'transparent',
          border: `2px solid ${
            hasError ? '#EF4444' : checked ? primaryColor : '#D1D5DB'
          }`,
          boxShadow: hasError ? '0 0 0 3px rgba(239,68,68,0.1)' : 'none',
        }}
      >
        {checked && (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path
              d="M1.5 5l2.5 2.5 5-5"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>
      <span
        className="text-sm leading-relaxed"
        style={{ fontFamily: 'var(--font-nunito-sans)', color: '#6B7280' }}
      >
        {children}
      </span>
    </label>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ClassicCustomerDetails() {
  const { theme, setCustomerDetails, nextStep, language } = useBookingStore();
  const { availableAddOns, isLoadingAddOns } = usePromotionsStore();

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
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [website, setWebsite] = useState(''); // honeypot
  const [errors, setErrors] = useState<FormErrors>({});

  const { isSubmitting, error, fieldErrors, submitBooking, sanitize } =
    useSecureBooking({ companyId: 'classic' });

  const GENDERS = [
    { value: 'male', label: t(language, 'salutationMr') },
    { value: 'female', label: t(language, 'salutationMs') },
    { value: 'other', label: t(language, 'salutationOther') },
  ];

  const validate = (): boolean => {
    const e: FormErrors = {};
    if (!firstName.trim()) e.firstName = t(language, 'firstNameRequired');
    if (!lastName.trim()) e.lastName = t(language, 'lastNameRequired');
    if (!email.trim()) e.email = t(language, 'emailRequired');
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      e.email = t(language, 'emailInvalid');
    if (!phone.trim()) e.phone = t(language, 'phoneRequired');
    if (!gender) e.gender = t(language, 'genderRequired');
    if (!privacyConsent)
      e.privacyConsent = t(language, 'privacyRequired');
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

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      {/* Title */}
      <motion.div variants={itemVariants} className="mb-5">
        <h2
          className="text-3xl font-bold mb-1.5"
          style={{ fontFamily: 'var(--font-nunito)', color: textPrimary }}
        >
          {t(language, 'yourDetails')}
        </h2>
        <p
          style={{
            fontFamily: 'var(--font-nunito-sans)',
            fontSize: '0.9rem',
            color: textSecondary,
          }}
        >
          {t(language, 'fillContact')}
        </p>
      </motion.div>

      {/* Booking summary */}
      <motion.div variants={itemVariants}>
        <BookingSummaryCard primaryColor={theme.primaryColor} />
      </motion.div>

      {/* Add-on selector */}
      {(availableAddOns.length > 0 || isLoadingAddOns) && (
        <motion.div variants={itemVariants}>
          <AddOnSelector
            addOns={availableAddOns}
            isLoading={isLoadingAddOns}
            primaryColor={theme.primaryColor}
            variantStyle="classic"
          />
        </motion.div>
      )}

      {/* Form card */}
      <motion.div
        variants={itemVariants}
        className="rounded-2xl p-5 sm:p-6"
        style={{
          background: 'rgba(255,255,255,0.97)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.07)',
        }}
      >
        <p
          className="text-xs uppercase tracking-widest font-bold mb-5"
          style={{
            fontFamily: 'var(--font-nunito)',
            color: '#9CA3AF',
            letterSpacing: '0.12em',
          }}
        >
          {t(language, 'contactSection')}
        </p>

        {/* Name row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <FormInput
            label={t(language, 'firstNameLabel')}
            required
            value={firstName}
            onChange={setFirstName}
            placeholder="Janez"
            error={errors.firstName}
            primaryColor={theme.primaryColor}
          />
          <FormInput
            label={t(language, 'lastNameLabel')}
            required
            value={lastName}
            onChange={setLastName}
            placeholder="Novak"
            error={errors.lastName}
            primaryColor={theme.primaryColor}
          />
        </div>

        <div className="mb-4">
          <FormInput
            label={t(language, 'emailLabel')}
            required
            value={email}
            onChange={setEmail}
            placeholder="janez@email.com"
            type="email"
            error={errors.email || fieldErrors.email}
            primaryColor={theme.primaryColor}
          />
        </div>

        <div className="mb-4">
          <FormInput
            label={t(language, 'phoneLabel')}
            required
            value={phone}
            onChange={setPhone}
            placeholder="041 123 456"
            type="tel"
            error={errors.phone}
            primaryColor={theme.primaryColor}
          />
        </div>

        {/* Salutation */}
        <div className="mb-4">
          <label
            className="block text-xs font-semibold mb-2"
            style={{ fontFamily: 'var(--font-nunito-sans)', color: '#6B7280' }}
          >
            {t(language, 'salutationLabel')}
            <span style={{ color: '#EF4444', marginLeft: 3 }}>*</span>
          </label>
          <div className="flex gap-2">
            {GENDERS.map((g) => {
              const isActive = gender === g.value;
              return (
                <motion.button
                  key={g.value}
                  type="button"
                  onClick={() => {
                    setGender(isActive ? '' : g.value);
                    if (errors.gender)
                      setErrors((p) => ({ ...p, gender: undefined }));
                  }}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all"
                  style={{
                    fontFamily: 'var(--font-nunito-sans)',
                    background: isActive ? `${theme.primaryColor}12` : '#F8F9FA',
                    border: isActive
                      ? `2px solid ${theme.primarySolid ?? theme.primaryColor}`
                      : errors.gender
                      ? '2px solid #EF4444'
                      : '2px solid #E9ECEF',
                    color: isActive ? theme.primaryColor : '#6B7280',
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {g.label}
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
                className="text-xs mt-1"
                style={{
                  fontFamily: 'var(--font-nunito-sans)',
                  color: '#EF4444',
                }}
              >
                {errors.gender}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Notes */}
        <div className="mb-5">
          <label
            className="block text-xs font-semibold mb-1.5"
            style={{ fontFamily: 'var(--font-nunito-sans)', color: '#6B7280' }}
          >
            {t(language, 'notesLabel')}
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t(language, 'notesPlaceholder')}
            rows={3}
            className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none transition-all"
            style={{
              fontFamily: 'var(--font-nunito-sans)',
              background: '#F8F9FA',
              border: '2px solid #E9ECEF',
              color: '#1F2937',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = theme.primaryColor;
              e.target.style.boxShadow = `0 0 0 3px ${theme.primaryColor}18`;
              e.target.style.background = '#ffffff';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#E9ECEF';
              e.target.style.boxShadow = 'none';
              e.target.style.background = '#F8F9FA';
            }}
          />
        </div>

        {/* Honeypot — keep hidden */}
        <input
          type="text"
          name="website"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          tabIndex={-1}
          aria-hidden="true"
          autoComplete="off"
          style={{ position: 'absolute', left: '-9999px', width: 1, height: 1 }}
        />

        {/* Checkboxes */}
        <div className="space-y-3.5">
          <Checkbox
            checked={gdprMarketing}
            onChange={() => setGdprMarketing((v) => !v)}
            primaryColor={theme.primaryColor}
          >
            {t(language, 'marketingLabel')}
          </Checkbox>

          <div>
            <Checkbox
              checked={privacyConsent}
              onChange={() => {
                setPrivacyConsent((v) => !v);
                if (errors.privacyConsent)
                  setErrors((p) => ({ ...p, privacyConsent: undefined }));
              }}
              primaryColor={theme.primaryColor}
              hasError={!!errors.privacyConsent}
            >
              {t(language, 'privacyLabel')}{' '}
              <a
                href="https://jedroplus.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="underline transition-opacity hover:opacity-70"
                style={{ color: theme.primaryOnLight ?? theme.primaryColor }}
              >
                {t(language, 'privacyLinkLabel')}
              </a>
              <span style={{ color: '#EF4444', marginLeft: 2 }}>*</span>
            </Checkbox>
            <AnimatePresence>
              {errors.privacyConsent && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-xs mt-1 ml-8"
                  style={{
                    fontFamily: 'var(--font-nunito-sans)',
                    color: '#EF4444',
                  }}
                >
                  {errors.privacyConsent}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      {/* Global error */}
      {error && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 text-sm text-center"
          style={{ fontFamily: 'var(--font-nunito-sans)', color: '#EF4444' }}
        >
          {error}
        </motion.p>
      )}

      {/* Submit */}
      <motion.div variants={itemVariants} className="mt-6 flex justify-end">
        <motion.button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="px-8 py-3.5 rounded-2xl font-bold text-white flex items-center gap-2"
          style={{
            fontFamily: 'var(--font-nunito)',
            backgroundColor: theme.primarySolid ?? theme.primaryColor,
            boxShadow: `0 6px 24px ${theme.primaryColor}38`,
            opacity: isSubmitting ? 0.65 : 1,
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
          }}
          whileHover={isSubmitting ? {} : { scale: 1.03 }}
          whileTap={isSubmitting ? {} : { scale: 0.97 }}
        >
          {isSubmitting ? (
            <>
              <motion.span
                className="w-4 h-4 border-2 rounded-full block"
                style={{
                  borderColor: 'rgba(255,255,255,0.35)',
                  borderTopColor: '#ffffff',
                }}
                animate={{ rotate: 360 }}
                transition={{
                  duration: 0.7,
                  repeat: Infinity,
                  ease: 'linear' as const,
                }}
              />
              {t(language, 'sending')}
            </>
          ) : (
            <>
              {t(language, 'nextToConfirm')}
              <span>→</span>
            </>
          )}
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
