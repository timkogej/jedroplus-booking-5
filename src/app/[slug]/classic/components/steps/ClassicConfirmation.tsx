'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { sl } from 'date-fns/locale';
import { useBookingStore } from '@/store/bookingStore';
import { bookingErrorMessage, isSlotConflict, returnToTimeStep, startCheckout, submitCurrentBooking } from '@/lib/booking/submit';
import { useSlotRecheck } from '@/lib/booking/useSlotRecheck';
import { t } from '../../i18n';
import { addBookingToCalendar } from '@/lib/booking/calendar';
import CancellationPolicy from '@/components/shared/CancellationPolicy';
import { shareBooking } from '@/lib/booking/share';
import { startNewBooking } from '@/lib/booking/newBooking';
import { stickyCtaStyle } from '@/lib/booking/stickyCta';
import ClassicTicket from '../ClassicTicket';
import {
  CARD,
  EASE,
  ErrorNote,
  FONT,
  INK,
  INK_2,
  PageTitle,
  PrimaryButton,
  SPRING,
  SectionLabel,
  dateLocale,
  itemVariants,
  listVariants,
  useClassicColors,
} from '../ui';
import QuestionnaireSummary from '@/components/shared/questionnaire/QuestionnaireSummary';
import { classicLook } from '@/components/shared/request/looks';

interface Props {
  companySlug?: string;
}

// ── Brand-coloured confetti, once ───────────────────────────────────────────
function Confetti({ color }: { color: string }) {
  const [pieces] = useState(() =>
    Array.from({ length: 28 }, (_, i) => ({
      id: i,
      x: 50 + (Math.random() - 0.5) * 30,
      dx: (Math.random() - 0.5) * 520,
      dy: -(180 + Math.random() * 260),
      rotate: (Math.random() - 0.5) * 720,
      size: 5 + Math.random() * 5,
      round: Math.random() > 0.55,
      tint: ['FF', 'B3', '80', 'FF'][i % 4],
      delay: Math.random() * 0.15,
    })),
  );
  return (
    <div className="pointer-events-none absolute inset-x-0 top-10 z-10 h-0" aria-hidden="true">
      {pieces.map((p) => (
        <motion.span
          key={p.id}
          className="absolute block"
          style={{
            left: `${p.x}%`,
            width: p.size,
            height: p.round ? p.size : p.size * 0.45,
            borderRadius: p.round ? 999 : 2,
            background: p.id % 5 === 0 ? '#FFD60A' : `${color}${p.tint}`,
          }}
          initial={{ x: 0, y: 0, opacity: 0, rotate: 0, scale: 0.4 }}
          animate={{ x: p.dx, y: [0, p.dy, p.dy + 420], opacity: [0, 1, 1, 0], rotate: p.rotate, scale: 1 }}
          transition={{ duration: 2.4, delay: 0.35 + p.delay, ease: [0.15, 0.6, 0.35, 1], times: [0, 0.35, 0.8, 1] }}
        />
      ))}
    </div>
  );
}

// ── Check mark that draws itself ─────────────────────────────────────────────
function SuccessMark({ color }: { color: string }) {
  return (
    <div className="relative mx-auto mb-6 h-[92px] w-[92px]">
      {/* ripples */}
      {[0, 1].map((i) => (
        <motion.span
          key={i}
          className="absolute inset-0 rounded-full"
          style={{ border: `2px solid ${color}` }}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1.9, opacity: [0, 0.35, 0] }}
          transition={{ duration: 1.6, delay: 0.55 + i * 0.35, ease: 'easeOut' }}
        />
      ))}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{ background: color, boxShadow: `0 18px 40px -12px ${color}` }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 17, delay: 0.1 }}
      />
      <svg viewBox="0 0 92 92" className="absolute inset-0" aria-hidden="true">
        <motion.path
          d="M28 47.5l12 12 24-26"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.45, delay: 0.45, ease: EASE }}
        />
      </svg>
    </div>
  );
}

const ICON_CAL = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="5" width="18" height="16" rx="3" />
    <path d="M3 10h18M8 3v4M16 3v4M12 13.5v4M10 15.5h4" />
  </svg>
);
const ICON_SHARE = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 3v12M7.5 7.5L12 3l4.5 4.5" />
    <path d="M5 12v6a3 3 0 003 3h8a3 3 0 003-3v-6" />
  </svg>
);

// "v četrtek, 29. oktobra" / "Thursday, October 29": as said in a sentence.
const SL_DAYS = ['v nedeljo', 'v ponedeljek', 'v torek', 'v sredo', 'v četrtek', 'v petek', 'v soboto'];
const SL_MONTHS = ['januarja', 'februarja', 'marca', 'aprila', 'maja', 'junija', 'julija', 'avgusta', 'septembra', 'oktobra', 'novembra', 'decembra'];
function spokenDate(d: Date, language: string): string {
  if (language === 'en') return format(d, 'EEEE, MMMM d', { locale: dateLocale('en') });
  return `${SL_DAYS[d.getDay()]}, ${d.getDate()}. ${SL_MONTHS[d.getMonth()]}`;
}

// ── Success screen ────────────────────────────────────────────────────────────
function SuccessView({ primaryColor }: { primaryColor: string }) {
  const { bookingConfirmation, customerDetails, selectedDate, selectedTime, language } = useBookingStore();
  const c = useClassicColors();
  const [copied, setCopied] = useState(false);

  // Start at the top so the check mark is the first thing seen.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleAddToCalendar = () => addBookingToCalendar();

  const handleShare = async () => {
    if ((await shareBooking()) === 'copied') {
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  const firstName = customerDetails?.firstName?.trim();
  const when = selectedDate ? spokenDate(selectedDate, language) : bookingConfirmation?.datum ?? '';
  const seeYou = t(language, 'seeYou')
    .replace('{date}', when)
    .replace('{time}', selectedTime ?? bookingConfirmation?.cas ?? '');

  const action = (label: string, icon: React.ReactNode, onClick: () => void) => (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.96 }}
      transition={SPRING}
      className="flex h-[54px] flex-1 items-center justify-center gap-2 rounded-[16px] text-[16px] font-semibold"
      style={{ fontFamily: FONT, background: '#FFFFFF', color: INK, boxShadow: '0 0 0 0.5px rgba(0,0,0,0.08), 0 4px 14px -6px rgba(0,0,0,0.14)' }}
    >
      <span style={{ color: primaryColor }}>{icon}</span>
      {label}
    </motion.button>
  );

  return (
    <div className="relative mx-auto max-w-xl">
      <Confetti color={primaryColor} />

      <div className="pt-2 text-center">
        <SuccessMark color={primaryColor} />

        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.4, ease: EASE }}
          className="text-[15px] font-semibold"
          style={{ fontFamily: FONT, color: c.light ? c.accentText : c.text2 }}
        >
          {firstName ? t(language, 'thanksName').replace('{name}', firstName) : t(language, 'bookingConfirmed')}
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.68, duration: 0.45, ease: EASE }}
          className="mt-1 text-[32px] font-bold leading-[1.1] sm:text-[36px]"
          style={{ fontFamily: FONT, color: c.text, letterSpacing: '-0.03em' }}
        >
          {t(language, 'bookingConfirmed')}
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mx-auto mt-2 max-w-sm text-[16px] leading-6"
          style={{ fontFamily: FONT, color: c.text2 }}
        >
          {seeYou}
        </motion.p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.75, duration: 0.6, ease: EASE }}
        className="mt-8"
      >
        <ClassicTicket
          status={{ label: t(language, 'statusConfirmed'), tone: 'success' }}
          dateText={bookingConfirmation?.datum}
          timeText={bookingConfirmation?.cas}
        />
      </motion.div>

      {customerDetails?.email && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mx-auto mt-4 max-w-sm text-center text-[14px] leading-5"
          style={{ fontFamily: FONT, color: c.text2 }}
        >
          <svg className="mr-1.5 inline-block align-[-2px]" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="3" y="5" width="18" height="14" rx="3" />
            <path d="M4 7l8 6 8-6" />
          </svg>
          {t(language, 'willSendTo').replace('{email}', customerDetails.email)}
        </motion.p>
      )}

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.05, duration: 0.4, ease: EASE }}
        className="mt-7 space-y-3"
      >
        <div className="flex gap-3">
          {action(t(language, 'addToCalendar'), ICON_CAL, handleAddToCalendar)}
          {action(copied ? `✓ ${t(language, 'copied')}` : t(language, 'share'), ICON_SHARE, handleShare)}
        </div>
        <PrimaryButton onClick={startNewBooking} className="w-full">
          {t(language, 'newBooking')}
        </PrimaryButton>
      </motion.div>
    </div>
  );
}

// ── Pre-submit review ─────────────────────────────────────────────────────────
export default function ClassicConfirmation({ companySlug }: Props) {
  useSlotRecheck(companySlug);
  const {
    theme,
    selectedServices,
    selectedService,
    selectedDate,
    selectedTime,
    customerDetails,
    bookingConfirmation,
    isSubmitting,
    setSubmitting,
    setBookingConfirmation,
    language,
  } = useBookingStore();
  const c = useClassicColors();

  const [error, setError] = useState<string | null>(null);
  const [redirecting, setRedirecting] = useState(false);

  const services =
    selectedServices.length > 0
      ? selectedServices
      : selectedService
      ? [selectedService]
      : [];

  if (bookingConfirmation?.success) {
    return <SuccessView primaryColor={theme.primarySolid} />;
  }

  const handleConfirm = async () => {
    if (
      !companySlug ||
      services.length === 0 ||
      !selectedDate ||
      !selectedTime ||
      !customerDetails
    ) {
      setError(t(language, 'missingData'));
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const result = await submitCurrentBooking(companySlug);
      const { confirmation, serviceName } = result;
      const datumDisplay = format(selectedDate, 'd. MMMM yyyy', { locale: sl });

      // Online payment required → redirect to Stripe Checkout (via POS).
      // The appointment is already created server-side as 'pending_payment'.
      if (confirmation.requiresPayment === true) {
        setRedirecting(true);
        try {
          await startCheckout(result, companySlug, 'classic', datumDisplay);
          // On success the browser navigates away to Stripe; nothing more to do.
          return;
        } catch (err) {
          console.error('Classic booking: failed to start payment:', err);
          setRedirecting(false);
          setError(t(language, 'paymentStartFailed'));
          return;
        }
      }

      // No payment required → show the existing confirmation/success screen.
      setBookingConfirmation({
        success: true,
        message: confirmation.message || t(language, 'bookingConfirmed'),
        storitev: serviceName,
        datum: datumDisplay,
        cas: selectedTime,
      });
    } catch (err) {
      console.error('Classic booking: submit failed:', err);
      if (isSlotConflict(err)) {
        returnToTimeStep();
        return;
      }
      setError(bookingErrorMessage(err, t(language, 'bookingFailed')));
    } finally {
      setSubmitting(false);
    }
  };

  const busy = isSubmitting || redirecting;

  const contactRows = [
    {
      key: 'name',
      icon: <path d="M20 21a8 8 0 00-16 0M12 13a5 5 0 100-10 5 5 0 000 10z" />,
      value: customerDetails ? `${customerDetails.firstName} ${customerDetails.lastName}` : undefined,
    },
    { key: 'email', icon: <><rect x="3" y="5" width="18" height="14" rx="3" /><path d="M4 7l8 6 8-6" /></>, value: customerDetails?.email },
    {
      key: 'phone',
      icon: <path d="M22 16.9v3a2 2 0 01-2.2 2 19.8 19.8 0 01-8.6-3.1 19.5 19.5 0 01-6-6A19.8 19.8 0 012.1 4.2 2 2 0 014.1 2h3a2 2 0 012 1.7c.1.9.4 1.8.7 2.7a2 2 0 01-.5 2.1L8 9.8a16 16 0 006 6l1.3-1.3a2 2 0 012.1-.4c.9.3 1.8.6 2.7.7a2 2 0 011.7 2z" />,
      value: customerDetails?.phone,
    },
    { key: 'notes', icon: <path d="M4 5h16M4 10h16M4 15h10" />, value: customerDetails?.notes },
  ].filter((r) => r.value);

  return (
    <motion.div variants={listVariants} initial="hidden" animate="visible" className="mx-auto max-w-xl">
      <PageTitle eyebrow={t(language, 'almostDone')} title={t(language, 'reviewBooking')} subtitle={t(language, 'checkDetails')} />

      <motion.div variants={itemVariants} className="mb-7">
        <ClassicTicket />
      </motion.div>

      {contactRows.length > 0 && (
        <motion.div variants={itemVariants} className="mb-7">
          <SectionLabel>{t(language, 'contactLabel')}</SectionLabel>
          <div className="overflow-hidden" style={CARD}>
            {contactRows.map((r) => (
              <div key={r.key} className="classic-row flex items-center gap-3.5 px-4 py-3.5 sm:px-5" style={{ ['--row-inset' as string]: '52px' }}>
                <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-[8px]" style={{ background: `${theme.primarySolid}14`, color: theme.primarySolid }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    {r.icon}
                  </svg>
                </span>
                <span
                  className={`min-w-0 flex-1 truncate text-[16px] ${r.key === 'name' ? 'font-semibold first-cap' : ''}`}
                  style={{ fontFamily: FONT, color: r.key === 'name' ? INK : INK_2 }}
                >
                  {r.value}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Error */}
      <QuestionnaireSummary look={classicLook(theme)} className="mb-5" />

      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-5 overflow-hidden">
            <ErrorNote>{error}</ErrorNote>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirm */}
      <motion.div variants={itemVariants} className="booking-sticky-cta" style={stickyCtaStyle(theme.bgTo, 16)}>
        <PrimaryButton onClick={handleConfirm} loading={busy} disabled={services.length === 0} className="w-full">
          {busy ? (
            redirecting ? t(language, 'redirectingToPayment') : t(language, 'confirmingSending')
          ) : (
            <>
              {t(language, 'confirmBooking')}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12l5 5L20 7" />
              </svg>
            </>
          )}
        </PrimaryButton>
      </motion.div>

      <motion.div variants={itemVariants} className="mt-3 text-center text-[13px] leading-5" style={{ fontFamily: FONT, color: c.text2 }}>
        <p>
          {customerDetails?.email
            ? t(language, 'willSendTo').replace('{email}', customerDetails.email)
            : t(language, 'confirmationSentEmail')}
        </p>
        <CancellationPolicy className="!mt-1 !text-[13px]" />
      </motion.div>
    </motion.div>
  );
}
