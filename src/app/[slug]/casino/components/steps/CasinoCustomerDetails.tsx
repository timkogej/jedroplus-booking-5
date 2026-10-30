'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBookingStore } from '@/store/bookingStore';
import type { CustomerDetails } from '@/types';
import { useSecureBooking } from '@/hooks/useSecureBooking';
import { usePromotionsStore } from '@/store/promotionsStore';
import {
  formatBookingPrice,
  getBookingPricing,
  resolvePrimaryPromotion,
} from '@/lib/pricing';
import { AddOnSelector } from '@/components/shared/AddOnSelector';
import { t } from '../../i18n';
import { contactFieldAttrs, type ContactField } from '@/lib/booking/fieldAttrs';
import { stickyCtaStyle } from '@/lib/booking/stickyCta';
import {
  CREAM,
  CX_BG,
  FAINT,
  FONT_BODY,
  FONT_HEAD,
  FONT_LABEL,
  MUTED,
  SPRING,
  Spinner,
  Tick,
  atWord,
  formatDuration,
  itemVariants,
  listVariants,
  shortDate,
} from '../ui';

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  privacyConsent?: string;
}

function FieldError({ text }: { text?: string }) {
  return (
    <AnimatePresence>
      {text && (
        <motion.p
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-1.5 text-[13px]"
          style={{ fontFamily: FONT_BODY, color: '#FF8A80' }}
        >
          {text}
        </motion.p>
      )}
    </AnimatePresence>
  );
}

function Field({
  id,
  label,
  field,
  value,
  onChange,
  placeholder,
  type = 'text',
  error,
}: {
  id: string;
  label: string;
  field?: ContactField;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  error?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="cx-label block" style={{ color: error ? '#FF8A80' : undefined }}>
        {label}
      </label>
      <div className="cx-field">
        <input
          id={id}
          {...contactFieldAttrs(field)}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          aria-invalid={!!error}
          className={`cx-input ${error ? 'has-error' : ''}`}
        />
        <span className="cx-field-line" aria-hidden="true" />
      </div>
      <FieldError text={error} />
    </div>
  );
}

// ── The booking so far, above the form ─────────────────────────
function BookingSummary() {
  const {
    selectedService,
    selectedServices,
    selectedDate,
    selectedTime,
    selectedEmployeeId,
    anyPerson,
    employeesUI,
    totalDurationMin,
    language,
  } = useBookingStore();
  const showEmployee = useBookingStore((s) => s.prikazZaposlenih);
  const { activePromotion, serviceDiscounts, selectedAddOn } = usePromotionsStore();

  const selectedEmployee = employeesUI.find((e) => e.id === selectedEmployeeId);
  const primaryService = selectedServices[0] ?? selectedService;
  if (!primaryService) return null;
  const services = selectedServices.length > 0 ? selectedServices : [primaryService];
  const promotion = resolvePrimaryPromotion(services, serviceDiscounts, activePromotion);
  const pricing = getBookingPricing(services, promotion, selectedAddOn);
  const minutes = (totalDurationMin > 0 ? totalDurationMin : primaryService.trajanjeMin) + (selectedAddOn?.trajanjeMin ?? 0);
  const who = showEmployee ? (anyPerson ? t(language, 'anyoneAvailable') : selectedEmployee?.label) : undefined;

  return (
    <div className="cx-card mb-6 overflow-hidden">
      <div className="flex items-start justify-between gap-4 p-4 sm:p-5">
        <div className="min-w-0">
          <p className="cx-label" style={{ color: 'var(--cx-glow)' }}>{t(language, 'yourReservation')}</p>
          <p className="mt-1.5 text-[17px] font-bold leading-snug" style={{ fontFamily: FONT_HEAD, color: CREAM }}>
            {services.map((s) => s.naziv).join(' + ')}
          </p>
          <p className="mt-1 text-[14px] leading-5" style={{ fontFamily: FONT_BODY, color: MUTED }}>
            {[
              selectedDate && selectedTime ? `${shortDate(selectedDate, language)} ${atWord(language)} ${selectedTime}` : null,
              formatDuration(minutes),
              who,
            ]
              .filter(Boolean)
              .join(' · ')}
          </p>
          {selectedAddOn && (
            <p className="mt-1 text-[13px]" style={{ fontFamily: FONT_BODY, color: 'var(--cx-glow)' }}>
              + {selectedAddOn.naziv} ({formatBookingPrice(selectedAddOn.finalCena)})
            </p>
          )}
        </div>
        <div className="flex-shrink-0 text-right">
          {pricing.hasDiscount && (
            <p className="text-[13px] line-through" style={{ fontFamily: FONT_BODY, color: FAINT }}>
              {formatBookingPrice(pricing.originalTotal)}
            </p>
          )}
          <p className="text-[22px] font-bold" style={{ fontFamily: FONT_HEAD, color: 'var(--cx-glow)' }}>
            {formatBookingPrice(pricing.finalTotal)}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function CasinoCustomerDetails() {
  const { setCustomerDetails, nextStep, theme, language, customerDetails } = useBookingStore();

  // Coming back from the review keeps what was typed.
  const [firstName, setFirstName] = useState(customerDetails?.firstName ?? '');
  const [lastName, setLastName] = useState(customerDetails?.lastName ?? '');
  const [email, setEmail] = useState(customerDetails?.email ?? '');
  const [phone, setPhone] = useState(customerDetails?.phone ?? '');
  const [gender, setGender] = useState(customerDetails?.gender ?? '');
  const [notes, setNotes] = useState(customerDetails?.notes ?? '');
  const [gdprMarketing, setGdprMarketing] = useState(customerDetails?.gdprSendMarketing ?? false);
  const [privacyConsent, setPrivacyConsent] = useState(customerDetails?.privacyConsent ?? false);
  const [website, setWebsite] = useState(''); // honeypot
  const [errors, setErrors] = useState<FormErrors>({});

  const { isSubmitting, fieldErrors, submitBooking, sanitize } = useSecureBooking({
    companyId: 'casino',
  });
  const { availableAddOns, isLoadingAddOns } = usePromotionsStore();

  const GENDERS = [
    { value: 'male', label: t(language, 'salutMr'), suit: '♠' },
    { value: 'female', label: t(language, 'salutMs'), suit: '♥' },
    { value: 'other', label: t(language, 'salutOther'), suit: '♦' },
  ];

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
    if (!validate()) return;
    const formData = {
      ime: sanitize(firstName.trim()),
      priimek: sanitize(lastName.trim()),
      email: email.trim(),
      telefon: phone.trim(),
      opombe: notes.trim() || undefined,
      website,
    };
    const success = await submitBooking(formData);
    if (success) {
      const details: CustomerDetails = {
        firstName: formData.ime,
        lastName: formData.priimek,
        email: formData.email,
        phone: formData.telefon,
        gender: gender || undefined,
        notes: notes.trim() || undefined,
        gdprSendMarketing: gdprMarketing,
        privacyConsent,
      };
      setCustomerDetails(details);
      nextStep();
    }
  };

  const clear = (key: keyof FormErrors) => errors[key] && setErrors((e) => ({ ...e, [key]: undefined }));

  return (
    <motion.div variants={listVariants} initial="hidden" animate="visible">
      <motion.div variants={itemVariants}>
        <BookingSummary />
      </motion.div>

      <motion.div variants={itemVariants}>
        <AddOnSelector addOns={availableAddOns} isLoading={isLoadingAddOns} primaryColor={theme.primaryOnDark} variantStyle="modern" />
      </motion.div>

      <motion.div variants={itemVariants} className="cx-card p-5 sm:p-6">
        <p className="cx-label mb-5" style={{ color: 'var(--cx-glow)' }}>
          {t(language, 'registrationLabel')}
        </p>

        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-5">
            <Field id="cx-first" label={t(language, 'firstNameLabel')} field="firstName" value={firstName} onChange={(v) => { setFirstName(v); clear('firstName'); }} placeholder="Janez" error={errors.firstName} />
            <Field id="cx-last" label={t(language, 'lastNameLabel')} field="lastName" value={lastName} onChange={(v) => { setLastName(v); clear('lastName'); }} placeholder="Novak" error={errors.lastName} />
          </div>
          <Field id="cx-email" label={t(language, 'emailLabel')} field="email" type="email" value={email} onChange={(v) => { setEmail(v); clear('email'); }} placeholder="janez@email.com" error={errors.email || fieldErrors.email} />
          <Field id="cx-phone" label={t(language, 'phoneLabel')} field="phone" type="tel" value={phone} onChange={(v) => { setPhone(v); clear('phone'); }} placeholder="041 123 456" error={errors.phone} />

          {/* Salutation */}
          <div>
            <p className="cx-label mb-2.5">{t(language, 'salutationLabel')}</p>
            <div className="relative flex gap-2">
              {GENDERS.map((g) => {
                const isSelected = gender === g.value;
                return (
                  <motion.button
                    key={g.value}
                    type="button"
                    onClick={() => setGender(isSelected ? '' : g.value)}
                    whileTap={{ scale: 0.96 }}
                    aria-pressed={isSelected}
                    className="relative flex h-11 flex-1 items-center justify-center gap-1.5 rounded-[12px] text-[12px] font-medium uppercase"
                    style={{
                      fontFamily: FONT_LABEL,
                      letterSpacing: '0.1em',
                      color: isSelected ? '#fff' : 'rgba(246,243,238,0.7)',
                      background: 'rgba(255,255,255,0.04)',
                      boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.1)',
                      transition: 'color 0.2s',
                    }}
                  >
                    {isSelected && (
                      <motion.span layoutId="cx-salut" className="absolute inset-0 rounded-[12px]" style={{ background: 'var(--cx-grad)' }} transition={SPRING} />
                    )}
                    <span className="relative" style={{ fontFamily: 'Georgia, serif' }}>{g.suit}</span>
                    <span className="relative">{g.label}</span>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="cx-notes" className="cx-label mb-2.5 block">{t(language, 'notesLabel')}</label>
            <textarea id="cx-notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t(language, 'notesPlaceholder')} rows={3} className="cx-textarea" />
          </div>
        </div>

        {/* Honeypot */}
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

        <div className="my-6 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />

        {/* Consents: marketing first, the required one last */}
        <div className="space-y-4">
          <button
            type="button"
            role="checkbox"
            aria-checked={gdprMarketing}
            onClick={() => setGdprMarketing(!gdprMarketing)}
            className="flex w-full items-start gap-3 text-left"
          >
            <Tick on={gdprMarketing} />
            <span className="text-[14px] leading-5" style={{ fontFamily: FONT_BODY, color: MUTED }}>
              {t(language, 'marketingConsent')}
            </span>
          </button>

          <div>
            {/* Tapping the text ticks the box too (the label forwards the click). */}
            <label className="flex cursor-pointer items-start gap-3">
              <button
                type="button"
                role="checkbox"
                aria-checked={privacyConsent}
                onClick={() => { setPrivacyConsent(!privacyConsent); clear('privacyConsent'); }}
                className="flex-shrink-0"
              >
                <Tick on={privacyConsent} error={!!errors.privacyConsent} />
              </button>
              <span
                className="text-[14px] leading-5"
                style={{ fontFamily: FONT_BODY, color: errors.privacyConsent ? '#FF8A80' : 'rgba(246,243,238,0.8)' }}
              >
                {t(language, 'privacyConsentPre')}{' '}
                <a
                  href="https://jedroplus.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2"
                  style={{ color: 'var(--cx-glow)' }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {t(language, 'privacyPolicy')}
                </a>{' '}
                *
              </span>
            </label>
            <div className="ml-[34px]">
              <FieldError text={errors.privacyConsent} />
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="booking-sticky-cta mt-6 flex justify-center" style={stickyCtaStyle(CX_BG, 16)}>
        <button onClick={handleSubmit} disabled={isSubmitting} className="cx-btn w-full max-w-sm">
          {isSubmitting ? (
            <>
              <Spinner />
              {t(language, 'sending')}
            </>
          ) : (
            <>
              {t(language, 'nextToConfirm')}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </>
          )}
        </button>
      </motion.div>
    </motion.div>
  );
}
