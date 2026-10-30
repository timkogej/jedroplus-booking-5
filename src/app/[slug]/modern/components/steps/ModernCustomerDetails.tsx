'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBookingStore } from '@/store/bookingStore';
import { CustomerDetails } from '@/types';
import { useSecureBooking } from '@/hooks/useSecureBooking';
import { usePromotionsStore } from '@/store/promotionsStore';
import { AddOnSelector } from '@/components/shared/AddOnSelector';
import { t } from '../../i18n';
import { contactFieldAttrs, type ContactField } from '@/lib/booking/fieldAttrs';
import { stickyCtaStyle } from '@/lib/booking/stickyCta';
import ModernButton from '../ModernButton';
import { MODERN_BG, SPRING } from '../brand';
import { FONT, GLASS, SectionLabel, Title, itemVariants, listVariants } from '../ui';
import QuestionnaireFields from '@/components/shared/questionnaire/QuestionnaireFields';
import { checkRequiredQuestions } from '@/lib/booking/questionnaire';
import { modernLook } from '@/components/shared/request/looks';

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  gender?: string;
  privacyConsent?: string;
}

function ModernLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label
      className="mb-2 block px-1 text-[13px] font-semibold"
      style={{ color: 'var(--t-soft)', fontFamily: FONT }}
    >
      {children}
      {required && <span className="ml-0.5" style={{ color: 'var(--t-faint)' }}>*</span>}
    </label>
  );
}

function ModernInput({
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
  return (
    <input
      {...contactFieldAttrs(field)}
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      aria-invalid={hasError}
      data-accent={primaryColor}
      className={`modern-input ${hasError ? 'error' : ''}`}
    />
  );
}

export default function ModernCustomerDetails() {
  const { setCustomerDetails, nextStep, theme, language } = useBookingStore();

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

  const { isSubmitting, error, fieldErrors, submitBooking, sanitize } = useSecureBooking({ companyId: 'modern' });
  const { availableAddOns, isLoadingAddOns } = usePromotionsStore();

  const validate = (): boolean => {
    const e: FormErrors = {};
    if (!firstName.trim()) e.firstName = t(language, 'firstNameRequired');
    if (!lastName.trim()) e.lastName = t(language, 'lastNameRequired');
    if (!email.trim()) e.email = t(language, 'emailRequired');
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = t(language, 'emailInvalid');
    if (!phone.trim()) e.phone = t(language, 'phoneRequired');
    if (!privacyConsent) e.privacyConsent = t(language, 'privacyRequired');
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate() || checkRequiredQuestions()) return;
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


  const errorText = (msg?: string) =>
    msg ? (
      <motion.p
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        className="mt-1.5 px-1 text-[13px]"
        style={{ color: '#FF8A80', fontFamily: FONT }}
      >
        {msg}
      </motion.p>
    ) : null;

  const salutations = [
    { value: 'male', label: t(language, 'salutationMr') },
    { value: 'female', label: t(language, 'salutationMs') },
    { value: 'other', label: t(language, 'salutationOther') },
  ];

  const toggle = (on: boolean, onClick: () => void, label: React.ReactNode, hasError?: boolean, first?: boolean) => (
    <div className="flex items-center gap-4 px-5 py-4" style={{ borderTop: first ? 'none' : '1px solid rgba(255,255,255,0.06)' }}>
      <span className="flex-1 text-[15px] leading-5" style={{ color: hasError ? '#FF8A80' : 'var(--t-soft)', fontFamily: FONT }}>
        {label}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        onClick={onClick}
        className="relative h-[31px] w-[51px] flex-shrink-0 rounded-full"
        style={{
          background: on ? 'var(--brand-grad)' : 'rgba(255,255,255,0.14)',
          boxShadow: hasError ? '0 0 0 2px #FF453A' : on ? '0 0 16px -4px var(--brand-glow)' : 'none',
          transition: 'background 0.25s, box-shadow 0.25s',
        }}
      >
        <motion.span
          className="absolute top-[2px] h-[27px] w-[27px] rounded-full bg-white"
          style={{ boxShadow: '0 3px 8px rgba(0,0,0,0.3)' }}
          initial={false}
          animate={{ left: on ? 22 : 2 }}
          transition={SPRING}
        />
      </button>
    </div>
  );

  return (
    <motion.div variants={listVariants} initial="hidden" animate="visible">
      <Title title={t(language, 'yourDetails')} subtitle={t(language, 'fillContact')} />

      {/* Add-on selector */}
      <motion.div variants={itemVariants}>
        <AddOnSelector
          addOns={availableAddOns}
          isLoading={isLoadingAddOns}
          primaryColor={theme.primarySolid}
          variantStyle="modern"
        />
      </motion.div>

      {/* Contact */}
      <motion.div variants={itemVariants} className="mb-6 p-5 sm:p-6" style={GLASS}>
        <div className="mb-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <ModernLabel required>{t(language, 'firstNameLabel')}</ModernLabel>
            <ModernInput field="firstName" value={firstName} onChange={setFirstName} placeholder="Janez" hasError={!!errors.firstName} primaryColor={theme.primarySolid} />
            <AnimatePresence>{errorText(errors.firstName)}</AnimatePresence>
          </div>
          <div>
            <ModernLabel required>{t(language, 'lastNameLabel')}</ModernLabel>
            <ModernInput field="lastName" value={lastName} onChange={setLastName} placeholder="Novak" hasError={!!errors.lastName} primaryColor={theme.primarySolid} />
            <AnimatePresence>{errorText(errors.lastName)}</AnimatePresence>
          </div>
        </div>

        <div className="mb-5">
          <ModernLabel required>{t(language, 'emailLabel')}</ModernLabel>
          <ModernInput field="email" value={email} onChange={setEmail} placeholder="janez@email.com" type="email" hasError={!!errors.email} primaryColor={theme.primarySolid} />
          <AnimatePresence>{errorText(errors.email || fieldErrors.email)}</AnimatePresence>
        </div>

        <div>
          <ModernLabel required>{t(language, 'phoneLabel')}</ModernLabel>
          <ModernInput field="phone" value={phone} onChange={setPhone} placeholder="041 123 456" type="tel" hasError={!!errors.phone} primaryColor={theme.primarySolid} />
          <AnimatePresence>{errorText(errors.phone)}</AnimatePresence>
        </div>
      </motion.div>

      {/* Salutation */}
      <motion.div variants={itemVariants} className="mb-6">
        <SectionLabel>{t(language, 'salutationLabel')}</SectionLabel>
        <div className="flex rounded-full p-1" style={{ background: 'rgba(255,255,255,0.06)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.08)' }}>
          {salutations.map((opt) => {
            const isSelected = gender === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                aria-pressed={isSelected}
                onClick={() => setGender(isSelected ? '' : opt.value)}
                className="relative h-10 flex-1 rounded-full text-[14px] font-bold"
                style={{ fontFamily: FONT, color: isSelected ? '#FFFFFF' : 'var(--t-muted)', transition: 'color 0.2s' }}
              >
                {isSelected && (
                  <motion.span
                    layoutId="modern-salutation"
                    className="absolute inset-0 rounded-full"
                    style={{ background: 'var(--brand-grad)', boxShadow: '0 6px 16px -6px var(--brand-a)' }}
                    transition={SPRING}
                  />
                )}
                <span className="relative">{opt.label}</span>
              </button>
            );
          })}
        </div>
        <AnimatePresence>{errorText(errors.gender)}</AnimatePresence>
      </motion.div>

      {/* Notes */}
      <motion.div variants={itemVariants} className="mb-6">
        <SectionLabel>{t(language, 'notesLabel')}</SectionLabel>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={t(language, 'notesPlaceholder')}
          rows={3}
          className="modern-textarea"
        />
      </motion.div>

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

      <QuestionnaireFields look={modernLook(theme)} className="pt-2" />

      {/* Consents */}
      <motion.div variants={itemVariants} className="overflow-hidden" style={{ ...GLASS, borderRadius: 22 }}>
        {toggle(gdprMarketing, () => setGdprMarketing(!gdprMarketing), t(language, 'marketingLabel'), false, true)}
        {toggle(
          privacyConsent,
          () => {
            setPrivacyConsent(!privacyConsent);
            if (errors.privacyConsent) setErrors((prev) => ({ ...prev, privacyConsent: undefined }));
          },
          <>
            {t(language, 'privacyLabel')}
            <span style={{ color: 'var(--t-faint)' }}> *</span>
          </>,
          !!errors.privacyConsent,
        )}
      </motion.div>
      <div className="mt-2 flex flex-wrap items-baseline justify-between gap-2 px-1">
        <a
          href="https://jedroplus.com/privacy"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[13px] font-semibold hover:underline"
          style={{ color: 'var(--brand-glow)', fontFamily: FONT }}
        >
          {t(language, 'privacyLinkLabel')} ›
        </a>
        <AnimatePresence>{errorText(errors.privacyConsent)}</AnimatePresence>
      </div>

      {/* Submit error */}
      {error && (
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 text-center text-[14px]" style={{ color: '#FF8A80', fontFamily: FONT }}>
          {error}
        </motion.p>
      )}

      <motion.div variants={itemVariants} className="booking-sticky-cta mt-8" style={stickyCtaStyle(MODERN_BG, 16)}>
        <ModernButton
          onClick={handleSubmit}
          loading={isSubmitting}
          loadingText={t(language, 'sending')}
        >
          {t(language, 'nextToConfirm')}
          <span aria-hidden="true">→</span>
        </ModernButton>
      </motion.div>
    </motion.div>
  );
}
