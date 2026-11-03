'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
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
  CARD,
  FONT,
  INK,
  INK_2,
  INK_3,
  PageTitle,
  PrimaryButton,
  SPRING,
  SectionLabel,
  atWord,
  dateLocale,
  formatDuration,
  itemVariants,
  listVariants,
  shortDatePattern,
  useClassicColors,
} from '../ui';
import QuestionnaireFields from '@/components/shared/questionnaire/QuestionnaireFields';
import { checkRequiredQuestions } from '@/lib/booking/questionnaire';
import { classicLook } from '@/components/shared/request/looks';

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  gender?: string;
  privacyConsent?: string;
}

const RED = '#FF3B30';

// ── One field in a grouped card: label on top, borderless input ─────────────
function FormInput({
  field,
  label,
  required,
  value,
  onChange,
  placeholder,
  type = 'text',
  error,
  primaryColor,
}: {
  field?: ContactField;
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
    <label className="classic-row block cursor-text px-4 pb-2.5 pt-3 sm:px-5" style={{ ['--row-inset' as string]: '16px' }}>
      <span
        className="flex items-center gap-1 text-[13px] font-medium"
        style={{ fontFamily: FONT, color: error ? RED : focused ? primaryColor : INK_2, transition: 'color 0.2s' }}
      >
        {label}
        {required && <span aria-hidden="true" style={{ color: error ? RED : INK_3 }}>*</span>}
      </span>
      <input
        {...contactFieldAttrs(field)}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        aria-invalid={!!error}
        className="mt-0.5 block w-full bg-transparent text-[17px] outline-none"
        style={{ fontFamily: FONT, color: INK, caretColor: primaryColor }}
      />
      <AnimatePresence>
        {error && (
          <motion.span
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-1 block text-[13px]"
            style={{ fontFamily: FONT, color: RED }}
          >
            {error}
          </motion.span>
        )}
      </AnimatePresence>
      {/* focus underline */}
      <motion.span
        aria-hidden="true"
        className="absolute bottom-0 left-4 right-4 h-[2px] rounded-full sm:left-5 sm:right-5"
        style={{ background: error ? RED : primaryColor, originX: 0 }}
        initial={false}
        animate={{ scaleX: focused || error ? 1 : 0, opacity: focused || error ? 1 : 0 }}
        transition={{ duration: 0.25 }}
      />
    </label>
  );
}

// ── Compact booking summary on top of the form ──────────────────────────────
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
  const showEmployee = useBookingStore((s) => s.prikazZaposlenih);
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

  const meta = [
    selectedDate && selectedTime
      ? `${format(selectedDate, shortDatePattern(language), { locale: dateLocale(language) })} ${atWord(language)} ${selectedTime}`
      : null,
    showEmployee && (selectedEmployee || anyPerson) ? (anyPerson ? t(language, 'anyone') : selectedEmployee?.label) : null,
    formatDuration(totalDuration),
  ].filter(Boolean) as string[];

  return (
    <div className="mb-7 flex items-center gap-4 p-4 lg:hidden" style={CARD}>
      {selectedDate && (
        <div
          className="flex h-[52px] w-[52px] flex-shrink-0 flex-col items-center justify-center overflow-hidden rounded-[13px]"
          style={{ background: `${primaryColor}12` }}
        >
          <span className="text-[10px] font-bold uppercase" style={{ color: primaryColor, fontFamily: FONT, letterSpacing: '0.04em' }}>
            {format(selectedDate, 'MMM', { locale: dateLocale(language) }).replace('.', '')}
          </span>
          <span className="text-[21px] font-semibold leading-none" style={{ color: INK, fontFamily: FONT }}>
            {selectedDate.getDate()}
          </span>
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-[16px] font-semibold" style={{ fontFamily: FONT, color: INK }}>
          {services.map((s) => s.naziv).join(' + ')}
          {selectedAddOn ? ` + ${selectedAddOn.naziv}` : ''}
        </p>
        <p className="truncate text-[13px] first-cap" style={{ fontFamily: FONT, color: INK_2 }}>
          {meta.join(' · ')}
        </p>
      </div>
      <div className="flex-shrink-0 text-right">
        {pricing.hasDiscount && (
          <p className="text-[12px] line-through" style={{ fontFamily: FONT, color: INK_3 }}>
            {formatBookingPrice(pricing.originalTotal)}
          </p>
        )}
        <p className="text-[17px] font-semibold tabular-nums" style={{ fontFamily: FONT, color: INK }}>
          {formatBookingPrice(pricing.finalTotal)}
        </p>
      </div>
    </div>
  );
}

// ── iOS switch for consents ─────────────────────────────────────────────────
function Toggle({
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
    <div className="classic-row flex items-center gap-4 px-4 py-3.5 sm:px-5" style={{ ['--row-inset' as string]: '16px' }}>
      <span className="flex-1 text-[15px] leading-5" style={{ fontFamily: FONT, color: hasError ? RED : INK }}>
        {children}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={onChange}
        className="relative h-[31px] w-[51px] flex-shrink-0 rounded-full"
        style={{
          background: checked ? primaryColor : 'rgba(120,120,128,0.16)',
          boxShadow: hasError ? `0 0 0 2px ${RED}` : 'none',
          transition: 'background 0.25s',
        }}
      >
        <motion.span
          className="absolute top-[2px] h-[27px] w-[27px] rounded-full bg-white"
          style={{ boxShadow: '0 3px 8px rgba(0,0,0,0.15), 0 3px 1px rgba(0,0,0,0.06)' }}
          initial={false}
          animate={{ left: checked ? 22 : 2 }}
          transition={SPRING}
        />
      </button>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ClassicCustomerDetails() {
  const { theme, setCustomerDetails, nextStep, language } = useBookingStore();
  const { availableAddOns, isLoadingAddOns } = usePromotionsStore();

  const c = useClassicColors();

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
    if (!privacyConsent)
      e.privacyConsent = t(language, 'privacyRequired');
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

  return (
    <motion.div variants={listVariants} initial="hidden" animate="visible">
      <PageTitle title={t(language, 'yourDetails')} subtitle={t(language, 'fillContact')} />

      {/* Booking summary (phones; the side card shows it on desktop) */}
      <motion.div variants={itemVariants}>
        <BookingSummaryCard primaryColor={theme.primarySolid} />
      </motion.div>

      {/* Add-on selector */}
      {(availableAddOns.length > 0 || isLoadingAddOns) && (
        <motion.div variants={itemVariants} className="mb-6">
          <AddOnSelector
            addOns={availableAddOns}
            isLoading={isLoadingAddOns}
            primaryColor={theme.primarySolid}
            variantStyle="classic"
          />
        </motion.div>
      )}

      {/* Contact */}
      <motion.div variants={itemVariants} className="mb-7">
        <SectionLabel>{t(language, 'contactSection')}</SectionLabel>
        <div className="overflow-hidden" style={CARD}>
          <div className="classic-row grid grid-cols-1 sm:grid-cols-2">
            <FormInput
              field="firstName"
              label={t(language, 'firstNameLabel')}
              required
              value={firstName}
              onChange={setFirstName}
              placeholder="Janez"
              error={errors.firstName}
              primaryColor={theme.primarySolid}
            />
            <div className="classic-row sm:border-l sm:before:hidden" style={{ borderColor: 'rgba(60,60,67,0.12)' }}>
              <FormInput
                field="lastName"
                label={t(language, 'lastNameLabel')}
                required
                value={lastName}
                onChange={setLastName}
                placeholder="Novak"
                error={errors.lastName}
                primaryColor={theme.primarySolid}
              />
            </div>
          </div>
          <div className="classic-row">
            <FormInput
              field="email"
              label={t(language, 'emailLabel')}
              required
              value={email}
              onChange={setEmail}
              placeholder="janez@email.com"
              type="email"
              error={errors.email || fieldErrors.email}
              primaryColor={theme.primarySolid}
            />
          </div>
          <div className="classic-row">
            <FormInput
              field="phone"
              label={t(language, 'phoneLabel')}
              required
              value={phone}
              onChange={setPhone}
              placeholder="041 123 456"
              type="tel"
              error={errors.phone}
              primaryColor={theme.primarySolid}
            />
          </div>
        </div>
      </motion.div>

      {/* Salutation: segmented control */}
      <motion.div variants={itemVariants} className="mb-7">
        <SectionLabel>{t(language, 'salutationLabel')}</SectionLabel>
        <div className="relative flex rounded-[12px] p-[3px]" style={{ background: c.light ? 'rgba(118,118,128,0.12)' : 'rgba(255,255,255,0.16)' }}>
          {GENDERS.map((g) => {
            const isActive = gender === g.value;
            return (
              <button
                key={g.value}
                type="button"
                aria-pressed={isActive}
                onClick={() => {
                  setGender(isActive ? '' : g.value);
                  if (errors.gender) setErrors((p) => ({ ...p, gender: undefined }));
                }}
                className="relative h-9 flex-1 text-[14px] font-semibold"
                style={{ fontFamily: FONT, color: isActive ? INK : c.light ? 'rgba(29,29,31,0.6)' : 'rgba(255,255,255,0.8)', transition: 'color 0.2s' }}
              >
                {isActive && (
                  <motion.span
                    layoutId="classic-salutation"
                    className="absolute inset-0 rounded-[9px] bg-white"
                    style={{ boxShadow: '0 3px 8px rgba(0,0,0,0.12), 0 0 0 0.5px rgba(0,0,0,0.04)' }}
                    transition={SPRING}
                  />
                )}
                <span className="relative">{g.label}</span>
              </button>
            );
          })}
        </div>
        <AnimatePresence>
          {errors.gender && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-1.5 px-1 text-[13px]"
              style={{ fontFamily: FONT, color: RED }}
            >
              {errors.gender}
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Notes */}
      <motion.div variants={itemVariants} className="mb-7">
        <SectionLabel>{t(language, 'notesLabel')}</SectionLabel>
        <div className="overflow-hidden" style={CARD}>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t(language, 'notesPlaceholder')}
            rows={3}
            className="block w-full resize-none bg-transparent px-4 py-3.5 text-[17px] leading-6 outline-none sm:px-5"
            style={{ fontFamily: FONT, color: INK, caretColor: theme.primarySolid }}
          />
        </div>
      </motion.div>

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

      <QuestionnaireFields look={classicLook(theme)} />

      {/* Consents */}
      <motion.div variants={itemVariants}>
        <div className="overflow-hidden" style={CARD}>
          <Toggle
            checked={gdprMarketing}
            onChange={() => setGdprMarketing((v) => !v)}
            primaryColor={theme.primarySolid}
          >
            {t(language, 'marketingLabel')}
          </Toggle>
          <Toggle
            checked={privacyConsent}
            onChange={() => {
              setPrivacyConsent((v) => !v);
              if (errors.privacyConsent) setErrors((p) => ({ ...p, privacyConsent: undefined }));
            }}
            primaryColor={theme.primarySolid}
            hasError={!!errors.privacyConsent}
          >
            {t(language, 'privacyLabel')}
            <span aria-hidden="true" style={{ color: errors.privacyConsent ? RED : INK_3 }}> *</span>
          </Toggle>
        </div>
        <div className="mt-2 flex flex-wrap items-baseline justify-between gap-2 px-1">
          <a
            href="https://jedroplus.com/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[13px] font-medium hover:underline"
            style={{ color: c.light ? theme.primaryOnLight : '#FFFFFF', fontFamily: FONT }}
          >
            {t(language, 'privacyLinkLabel')} ›
          </a>
          <AnimatePresence>
            {errors.privacyConsent && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-[13px]"
                style={{ fontFamily: FONT, color: RED }}
              >
                {errors.privacyConsent}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Global error */}
      {error && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 text-center text-[14px]"
          style={{ fontFamily: FONT, color: RED }}
        >
          {error}
        </motion.p>
      )}

      {/* Submit */}
      <motion.div
        variants={itemVariants}
        className="booking-sticky-cta mt-8 flex justify-end"
        style={stickyCtaStyle(theme.bgTo, 16)}
      >
        <PrimaryButton onClick={handleSubmit} loading={isSubmitting} className="w-full sm:w-auto sm:min-w-[260px]">
          {isSubmitting ? t(language, 'sending') : t(language, 'nextToConfirm')}
        </PrimaryButton>
      </motion.div>
    </motion.div>
  );
}
