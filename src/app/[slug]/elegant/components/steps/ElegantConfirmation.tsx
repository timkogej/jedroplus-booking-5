'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { format } from 'date-fns';
import { useBookingStore } from '@/store/bookingStore';
import { bookingErrorMessage, isSlotConflict, returnToTimeStep, startCheckout, submitCurrentBooking } from '@/lib/booking/submit';
import { useSlotRecheck } from '@/lib/booking/useSlotRecheck';
import { dateLocale, datePattern, t } from '../../i18n';
import { addBookingToCalendar } from '@/lib/booking/calendar';
import CancellationPolicy from '@/components/shared/CancellationPolicy';
import { shareBooking } from '@/lib/booking/share';
import { startNewBooking } from '@/lib/booking/newBooking';
import { stickyCtaStyle } from '@/lib/booking/stickyCta';
import ElegantTicket from '../ElegantTicket';
import QuestionnaireSummary from '@/components/shared/questionnaire/QuestionnaireSummary';
import { elegantLook } from '@/components/shared/request/looks';

interface Props {
  companySlug?: string;
}

const EASE = [0.22, 1, 0.36, 1] as const;

const listVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const itemVariants: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
};

// "v četrtek, 29. oktobra" / "Thursday, October 29": as said in a sentence.
const SL_DAYS = ['v nedeljo', 'v ponedeljek', 'v torek', 'v sredo', 'v četrtek', 'v petek', 'v soboto'];
const SL_MONTHS = ['januarja', 'februarja', 'marca', 'aprila', 'maja', 'junija', 'julija', 'avgusta', 'septembra', 'oktobra', 'novembra', 'decembra'];
function spokenDate(d: Date, language: string): string {
  if (language === 'en') return format(d, 'EEEE, MMMM d', { locale: dateLocale('en') });
  return `${SL_DAYS[d.getDay()]}, ${d.getDate()}. ${SL_MONTHS[d.getMonth()]}`;
}

// ── Gold dust drifting up behind the mark ───────────────────────────────────
function GoldDust({ color }: { color: string }) {
  const [specks] = useState(() =>
    Array.from({ length: 18 }, (_, i) => ({
      id: i,
      left: 10 + Math.random() * 80,
      size: 2 + Math.random() * 4,
      dx: (Math.random() - 0.5) * 60,
      dur: 2.6 + Math.random() * 1.8,
      delay: 0.6 + Math.random() * 1.4,
      light: i % 3 === 0,
    })),
  );
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 h-48" aria-hidden="true">
      {specks.map((p) => (
        <span
          key={p.id}
          className="elegant-dust"
          style={{
            left: `${p.left}%`,
            bottom: 0,
            width: p.size,
            height: p.size,
            background: p.light ? '#F4E3C1' : color,
            boxShadow: `0 0 ${p.size * 2}px ${p.light ? '#F4E3C1' : color}`,
            ['--dx' as string]: `${p.dx}px`,
            ['--dur' as string]: `${p.dur}s`,
            ['--delay' as string]: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

// ── Thin gold circle and check that draw themselves ─────────────────────────
function SuccessMark({ color }: { color: string }) {
  return (
    <div className="relative mx-auto h-24 w-24">
      <motion.span
        className="absolute inset-0 rounded-full"
        style={{ background: `${color}10` }}
        initial={{ scale: 0.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.9, ease: EASE }}
      />
      <svg viewBox="0 0 96 96" className="absolute inset-0" aria-hidden="true">
        <motion.circle
          cx="48"
          cy="48"
          r="44"
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          initial={{ pathLength: 0, rotate: -90 }}
          animate={{ pathLength: 1 }}
          style={{ transformOrigin: '48px 48px', rotate: -90 }}
          transition={{ duration: 1.1, ease: EASE, delay: 0.15 }}
        />
        <motion.path
          d="M32 49l11 11 22-24"
          fill="none"
          stroke={color}
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.6, ease: EASE, delay: 0.95 }}
        />
      </svg>
    </div>
  );
}

const ICON_CAL = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M3 10h18M8 3v4M16 3v4M12 13.5v4M10 15.5h4" />
  </svg>
);
const ICON_SHARE = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 3v12M7.5 7.5L12 3l4.5 4.5" />
    <path d="M5 12v6a3 3 0 003 3h8a3 3 0 003-3v-6" />
  </svg>
);

// ── Success view ──────────────────────────────────────────────
function SuccessView() {
  const { bookingConfirmation, selectedDate, selectedTime, customerDetails, theme, language } = useBookingStore();
  const [copied, setCopied] = useState(false);
  const gold = theme.primarySolid;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleShare = async () => {
    if ((await shareBooking()) === 'copied') {
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  const firstName = customerDetails?.firstName?.trim();
  const when = selectedDate ? spokenDate(selectedDate, language) : bookingConfirmation?.datum ?? '';
  const seeYou = t(language, 'seeYou').replace('{date}', when).replace('{time}', selectedTime ?? bookingConfirmation?.cas ?? '');

  const outline = (label: string, icon: React.ReactNode, onClick: () => void) => (
    <motion.button
      onClick={onClick}
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.98 }}
      className="flex items-center justify-center gap-2 rounded-xl border bg-white py-3.5 text-sm font-medium transition-colors hover:border-current"
      style={{ fontFamily: 'var(--font-inter)', borderColor: '#E7E2D8', color: '#374151' }}
    >
      <span style={{ color: gold }}>{icon}</span>
      {label}
    </motion.button>
  );

  return (
    <div className="relative mx-auto max-w-lg pt-2">
      <GoldDust color={gold} />

      <div className="relative text-center">
        <SuccessMark color={gold} />
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1, duration: 0.7, ease: EASE }}
          className="mt-7 italic"
          style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.35rem', color: theme.primaryOnLight }}
        >
          {firstName ? t(language, 'thanksName').replace('{name}', firstName) : t(language, 'thanks')}
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.8, ease: EASE }}
          className="mt-1"
          style={{ fontFamily: 'var(--font-playfair)', fontSize: 'clamp(2.1rem, 6vw, 2.75rem)', fontWeight: 400, color: '#111111', lineHeight: 1.12 }}
        >
          {t(language, 'bookingConfirmed')}
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4, duration: 0.6 }}
          className="mx-auto mt-3 max-w-sm"
          style={{ fontFamily: 'var(--font-inter)', fontSize: '0.98rem', color: '#6B7280', lineHeight: 1.6 }}
        >
          {seeYou}
        </motion.p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 26 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.3, duration: 0.9, ease: EASE }}
        className="mt-10"
      >
        <ElegantTicket sealed dateText={bookingConfirmation?.datum} timeText={bookingConfirmation?.cas} />
      </motion.div>

      {customerDetails?.email && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.7 }}
          className="mt-5 text-center"
          style={{ fontFamily: 'var(--font-inter)', fontSize: '0.85rem', color: '#6B7280' }}
        >
          {t(language, 'willSendTo').replace('{email}', customerDetails.email)}
        </motion.p>
      )}

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.75, duration: 0.6, ease: EASE }}
        className="mt-7 space-y-3"
      >
        <div className="grid grid-cols-2 gap-3">
          {outline(t(language, 'addToCalendar'), ICON_CAL, () => addBookingToCalendar())}
          {outline(copied ? `✓ ${t(language, 'copied')}` : t(language, 'share'), ICON_SHARE, handleShare)}
        </div>
        <motion.button
          onClick={startNewBooking}
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.99 }}
          className="relative w-full overflow-hidden rounded-xl py-4 text-sm font-medium tracking-wide text-white"
          style={{ background: gold, fontFamily: 'var(--font-inter)', boxShadow: `0 12px 26px -12px ${gold}` }}
        >
          <span className="elegant-sheen" />
          <span className="relative">{t(language, 'newBooking')}</span>
        </motion.button>
      </motion.div>
    </div>
  );
}

// ── Pre-submit review ─────────────────────────────────────────
export default function ElegantConfirmation({ companySlug }: Props) {
  useSlotRecheck(companySlug);
  const {
    selectedService,
    selectedServices,
    selectedDate,
    selectedTime,
    customerDetails,
    bookingConfirmation,
    isSubmitting,
    setSubmitting,
    setBookingConfirmation,
    theme,
    language,
  } = useBookingStore();

  const [error, setError] = useState<string | null>(null);
  const [redirecting, setRedirecting] = useState(false);
  const services = selectedServices.length > 0 ? selectedServices : selectedService ? [selectedService] : [];

  if (bookingConfirmation?.success) {
    return <SuccessView />;
  }

  const handleConfirm = async () => {
    if (!companySlug || services.length === 0 || !selectedDate || !selectedTime || !customerDetails) {
      setError(t(language, 'missingData'));
      return;
    }
    setSubmitting(true);
    setError(null);

    try {
      const result = await submitCurrentBooking(companySlug);
      const response = result.confirmation;

      if (response.success) {
        const serviceName = result.serviceName;
        const datumDisplay = format(selectedDate, datePattern(language, 'd. MMMM yyyy'), { locale: dateLocale(language) });

        if (response.requiresPayment === true) {
          setRedirecting(true);

          try {
            await startCheckout(result, companySlug, 'elegant', datumDisplay);
            return;
          } catch (err) {
            console.error('Elegant booking: failed to start payment:', err);
            setRedirecting(false);
            setError(
              t(language, 'paymentStartFailed')
            );
            return;
          }
        }

        setBookingConfirmation({
          success: true,
          message: response.message || t(language, 'bookingSuccess'),
          storitev: serviceName,
          datum: datumDisplay,
          cas: selectedTime,
        });
      } else {
        setError(response.message || t(language, 'bookingFailed'));
      }
    } catch (err) {
      console.error('Elegant booking: submit failed:', err);
      if (isSlotConflict(err)) {
        returnToTimeStep();
        return;
      }
      setError(bookingErrorMessage(err, t(language, 'bookingFailedRetry')));
    } finally {
      setSubmitting(false);
    }
  };

  const busy = isSubmitting || redirecting;
  const gold = theme.primarySolid;

  const contactRows = [
    customerDetails ? `${customerDetails.firstName} ${customerDetails.lastName}` : undefined,
    customerDetails?.email,
    customerDetails?.phone,
    customerDetails?.notes,
  ].filter(Boolean) as string[];

  return (
    <motion.div variants={listVariants} initial="hidden" animate="visible" className="mx-auto max-w-lg">
      <motion.div variants={itemVariants} className="mb-8">
        <p className="mb-2 text-[11px] font-semibold uppercase" style={{ fontFamily: 'var(--font-inter)', letterSpacing: '0.24em', color: gold }}>
          {t(language, 'almostDone')}
        </p>
        <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: 'clamp(2rem, 5vw, 2.4rem)', fontWeight: 400, color: '#111111', lineHeight: 1.15 }}>
          {t(language, 'confirmTitleA')}{' '}
          <span className="italic" style={{ color: theme.primaryOnLight }}>
            {t(language, 'confirmTitleB')}
          </span>
        </h2>
        <p className="mt-2" style={{ fontFamily: 'var(--font-inter)', fontSize: '0.95rem', color: '#6B7280' }}>
          {t(language, 'confirmSubtitle')}
        </p>
        <div className="elegant-rule mt-5 h-px w-16" style={{ background: gold, transformOrigin: 'left' }} />
      </motion.div>

      <motion.div variants={itemVariants} className="mb-8">
        <ElegantTicket />
      </motion.div>

      {contactRows.length > 0 && (
        <motion.div variants={itemVariants} className="mb-8">
          <div className="mb-2.5 flex items-center gap-3">
            <p className="text-[11px] font-semibold uppercase" style={{ fontFamily: 'var(--font-inter)', letterSpacing: '0.16em', color: theme.primaryOnLight }}>
              {t(language, 'contactLabel')}
            </p>
            <span className="h-px flex-1" style={{ background: `linear-gradient(to right, ${theme.primaryColor}40, transparent)` }} />
          </div>
          <div className="space-y-1 px-1">
            {contactRows.map((v, i) => (
              <p
                key={i}
                className={i === 0 ? 'first-cap' : ''}
                style={{ fontFamily: i === 0 ? 'var(--font-playfair)' : 'var(--font-inter)', fontSize: i === 0 ? '1.15rem' : '0.92rem', color: i === 0 ? '#111111' : '#6B7280' }}
              >
                {v}
              </p>
            ))}
          </div>
        </motion.div>
      )}

      <QuestionnaireSummary look={elegantLook(theme)} className="mb-6" />

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-5 overflow-hidden rounded-xl border px-4 py-3"
            style={{ borderColor: '#FECACA', background: '#FEF2F2' }}
          >
            <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.875rem', color: '#B91C1C' }}>{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div variants={itemVariants} className="booking-sticky-cta" style={stickyCtaStyle('#ffffff', 24)}>
        <motion.button
          onClick={handleConfirm}
          disabled={busy || services.length === 0}
          whileHover={busy ? {} : { y: -1 }}
          whileTap={busy ? {} : { scale: 0.99 }}
          className="relative flex w-full items-center justify-center gap-2.5 overflow-hidden rounded-xl py-4 font-medium tracking-wide text-white"
          style={{
            background: gold,
            opacity: busy ? 0.8 : 1,
            fontFamily: 'var(--font-inter)',
            fontSize: '0.975rem',
            cursor: busy ? 'wait' : 'pointer',
            boxShadow: `0 14px 30px -14px ${gold}`,
          }}
        >
          {!busy && <span className="elegant-sheen" />}
          {busy && (
            <motion.span
              className="block h-4 w-4 rounded-full border-2"
              style={{ borderColor: 'rgba(255,255,255,0.35)', borderTopColor: '#fff' }}
              animate={{ rotate: 360 }}
              transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
            />
          )}
          <span className="relative">
            {busy ? (redirecting ? t(language, 'redirectingToPayment') : t(language, 'sendingBooking')) : t(language, 'confirmBooking')}
          </span>
        </motion.button>
      </motion.div>

      <motion.div variants={itemVariants} className="mt-3 text-center" style={{ fontFamily: 'var(--font-inter)', fontSize: '0.8rem', color: '#6B7280' }}>
        <p>
          {customerDetails?.email
            ? t(language, 'willSendTo').replace('{email}', customerDetails.email)
            : t(language, 'confirmationByEmail')}
        </p>
        <CancellationPolicy className="!mt-1 !text-[0.8rem]" />
      </motion.div>
    </motion.div>
  );
}
