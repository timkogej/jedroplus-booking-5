'use client';

import { useEffect, useState } from 'react';
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
import ModernButton from '../ModernButton';
import ModernTicket from '../ModernTicket';
import { EASE, MODERN_BG, SPRING } from '../brand';
import { ErrorNote, FONT, GLASS, SectionLabel, Title, dateLocale, itemVariants, listVariants } from '../ui';
import QuestionnaireSummary from '@/components/shared/questionnaire/QuestionnaireSummary';
import { modernLook } from '@/components/shared/request/looks';

interface Props {
  companySlug?: string;
}

// "v četrtek, 29. oktobra" / "Thursday, October 29": as said in a sentence.
const SL_DAYS = ['v nedeljo', 'v ponedeljek', 'v torek', 'v sredo', 'v četrtek', 'v petek', 'v soboto'];
const SL_MONTHS = ['januarja', 'februarja', 'marca', 'aprila', 'maja', 'junija', 'julija', 'avgusta', 'septembra', 'oktobra', 'novembra', 'decembra'];
function spokenDate(d: Date, language: string): string {
  if (language === 'en') return format(d, 'EEEE, MMMM d', { locale: dateLocale('en') });
  return `${SL_DAYS[d.getDay()]}, ${d.getDate()}. ${SL_MONTHS[d.getMonth()]}`;
}

// ── Light burst: brand-coloured sparks flying out of the mark ───────────────
function Burst() {
  const [sparks] = useState(() =>
    Array.from({ length: 22 }, (_, i) => {
      const angle = (i / 22) * Math.PI * 2 + Math.random() * 0.3;
      const dist = 90 + Math.random() * 90;
      return { id: i, x: Math.cos(angle) * dist, y: Math.sin(angle) * dist, size: 3 + Math.random() * 4, alt: i % 3 === 0, delay: Math.random() * 0.12 };
    }),
  );
  return (
    <div className="pointer-events-none absolute left-1/2 top-1/2" aria-hidden="true">
      {sparks.map((p) => (
        <motion.span
          key={p.id}
          className="absolute rounded-full"
          style={{
            width: p.size,
            height: p.size,
            marginLeft: -p.size / 2,
            marginTop: -p.size / 2,
            background: p.alt ? 'var(--brand-glow2)' : 'var(--brand-glow)',
            boxShadow: `0 0 ${p.size * 3}px ${p.alt ? 'var(--brand-glow2)' : 'var(--brand-glow)'}`,
          }}
          initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
          animate={{ x: p.x, y: p.y, opacity: [0, 1, 0], scale: [0, 1.2, 0.6] }}
          transition={{ duration: 1.3, delay: 0.55 + p.delay, ease: [0.16, 1, 0.3, 1] }}
        />
      ))}
    </div>
  );
}

// ── Glowing orb with a rotating gradient rim and a check that draws itself ──
function SuccessOrb() {
  return (
    <div className="relative mx-auto mb-8 h-28 w-28">
      <motion.span
        className="absolute -inset-10 rounded-full"
        style={{ background: 'radial-gradient(closest-side, color-mix(in srgb, var(--brand-glow) 45%, transparent), transparent)' }}
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: [0, 1, 0.7], scale: [0.5, 1.15, 1] }}
        transition={{ duration: 1.4, delay: 0.2 }}
      />
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{ background: 'var(--brand-grad)', boxShadow: '0 20px 50px -14px var(--brand-a), inset 0 2px 0 rgba(255,255,255,0.35)' }}
        initial={{ scale: 0, rotate: -40 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 220, damping: 16, delay: 0.1 }}
      >
        <span className="modern-ring" style={{ ['--ring-a' as string]: '#FFFFFF', ['--ring-b' as string]: 'var(--brand-glow2)', inset: -6, padding: 2 }} />
      </motion.div>
      <svg viewBox="0 0 112 112" className="absolute inset-0" aria-hidden="true">
        <motion.path
          d="M34 58l15 15 30-33"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="7"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.5, delay: 0.5, ease: EASE }}
        />
      </svg>
      <Burst />
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

// ── Success screen ────────────────────────────────────────────────────────────
function SuccessView() {
  const { bookingConfirmation, customerDetails, selectedDate, selectedTime, language } = useBookingStore();
  const [copied, setCopied] = useState(false);

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

  const action = (label: string, icon: React.ReactNode, onClick: () => void) => (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.96 }}
      transition={SPRING}
      className="flex h-14 flex-1 items-center justify-center gap-2 rounded-[18px] text-[15px] font-bold"
      style={{ fontFamily: FONT, color: 'var(--t-primary)', background: 'rgba(255,255,255,0.07)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.1)' }}
    >
      <span style={{ color: 'var(--brand-glow)' }}>{icon}</span>
      {label}
    </motion.button>
  );

  return (
    <div className="relative mx-auto max-w-xl pt-4">
      <div className="text-center">
        <SuccessOrb />

        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.5, ease: EASE }}
          className="text-[15px] font-bold"
          style={{ fontFamily: FONT, color: 'var(--brand-glow)' }}
        >
          {firstName ? t(language, 'thanksName').replace('{name}', firstName) : t(language, 'bookingConfirmed')}
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 10, filter: 'blur(8px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ delay: 0.78, duration: 0.6, ease: EASE }}
          className="modern-shift-text mt-1 pb-2 text-[44px] font-extrabold leading-[1.05] sm:text-[56px]"
          style={{
            fontFamily: FONT,
            letterSpacing: '-0.05em',
            backgroundImage: 'linear-gradient(100deg, #FFFFFF 0%, #FFFFFF 35%, var(--brand-glow) 65%, var(--brand-glow2) 80%, #FFFFFF 100%)',
          }}
        >
          {t(language, 'booked')}
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.95 }}
          className="mx-auto mt-3 max-w-sm text-[16px] leading-6"
          style={{ fontFamily: FONT, color: 'var(--t-muted)' }}
        >
          {seeYou}
        </motion.p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30, rotateX: 12 }}
        animate={{ opacity: 1, y: 0, rotateX: 0 }}
        transition={{ delay: 0.85, duration: 0.8, ease: EASE }}
        className="mt-9"
        style={{ transformPerspective: 900 }}
      >
        <ModernTicket status={t(language, 'statusConfirmed')} dateText={bookingConfirmation?.datum} timeText={bookingConfirmation?.cas} />
      </motion.div>

      {customerDetails?.email && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.15 }}
          className="mx-auto mt-4 max-w-sm text-center text-[14px] leading-5"
          style={{ fontFamily: FONT, color: 'var(--t-faint)' }}
        >
          <svg className="mr-1.5 inline-block align-[-2px]" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="3" y="5" width="18" height="14" rx="3" />
            <path d="M4 7l8 6 8-6" />
          </svg>
          {t(language, 'willSendTo').replace('{email}', customerDetails.email)}
        </motion.p>
      )}

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2, duration: 0.5, ease: EASE }}
        className="mt-8 space-y-3"
      >
        <div className="flex gap-3">
          {action(t(language, 'addToCalendar'), ICON_CAL, () => addBookingToCalendar())}
          {action(copied ? `✓ ${t(language, 'copied')}` : t(language, 'share'), ICON_SHARE, handleShare)}
        </div>
        <ModernButton onClick={startNewBooking}>{t(language, 'newBooking')}</ModernButton>
      </motion.div>
    </div>
  );
}

// ── Pre-submit review ─────────────────────────────────────────────────────────
export default function ModernConfirmation({ companySlug }: Props) {
  useSlotRecheck(companySlug);
  const {
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
  const theme = useBookingStore((s) => s.theme);

  const [error, setError] = useState<string | null>(null);
  const [redirecting, setRedirecting] = useState(false);

  if (bookingConfirmation?.success) {
    return <SuccessView />;
  }

  const services =
    selectedServices.length > 0
      ? selectedServices
      : selectedService
      ? [selectedService]
      : [];

  const handleConfirm = async () => {
    if (!companySlug || services.length === 0 || !selectedDate || !selectedTime || !customerDetails) {
      setError(t(language, 'missingData'));
      return;
    }
    setSubmitting(true);
    setError(null);

    try {
      const result = await submitCurrentBooking(companySlug);
      const { confirmation, serviceName } = result;
      const datumDisplay = format(selectedDate, 'd. MMMM yyyy', { locale: sl });

      if (confirmation.requiresPayment === true) {
        setRedirecting(true);

        try {
          await startCheckout(result, companySlug, 'modern', datumDisplay);
          return;
        } catch (err) {
          console.error('Modern booking: failed to start payment:', err);
          setRedirecting(false);
          setError(t(language, 'paymentStartFailed'));
          return;
        }
      }

      setBookingConfirmation({
        success: true,
        message: confirmation.message || 'Rezervacija uspešna!',
        storitev: serviceName,
        datum: datumDisplay,
        cas: selectedTime,
      });
    } catch (err) {
      console.error('Modern booking: submit failed:', err);
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
    { key: 'name', icon: <path d="M20 21a8 8 0 00-16 0M12 13a5 5 0 100-10 5 5 0 000 10z" />, value: customerDetails ? `${customerDetails.firstName} ${customerDetails.lastName}` : undefined },
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
      <Title eyebrow={t(language, 'almostDone')} title={t(language, 'reviewBooking')} subtitle={t(language, 'checkDetails')} />

      <motion.div variants={itemVariants} className="mb-7">
        <ModernTicket />
      </motion.div>

      {contactRows.length > 0 && (
        <motion.div variants={itemVariants} className="mb-7">
          <SectionLabel>{t(language, 'contactLabel')}</SectionLabel>
          <div className="overflow-hidden" style={GLASS}>
            {contactRows.map((r, i) => (
              <div key={r.key} className="flex items-center gap-3.5 px-5 py-4" style={{ borderTop: i === 0 ? 'none' : '1px solid rgba(255,255,255,0.06)' }}>
                <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full" style={{ background: 'rgba(255,255,255,0.07)', color: 'var(--brand-glow)' }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    {r.icon}
                  </svg>
                </span>
                <span
                  className={`min-w-0 flex-1 truncate text-[16px] ${r.key === 'name' ? 'font-bold first-cap' : 'font-medium'}`}
                  style={{ fontFamily: FONT, color: r.key === 'name' ? 'var(--t-primary)' : 'var(--t-soft)' }}
                >
                  {r.value}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      <QuestionnaireSummary look={modernLook(theme)} className="mb-5" />

      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-5 overflow-hidden">
            <ErrorNote>{error}</ErrorNote>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div variants={itemVariants} className="booking-sticky-cta" style={stickyCtaStyle(MODERN_BG, 16)}>
        <ModernButton
          onClick={handleConfirm}
          loading={busy}
          loadingText={redirecting ? t(language, 'redirectingToPayment') : t(language, 'confirmingSending')}
          disabled={services.length === 0}
        >
          {t(language, 'confirmBooking')}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 12l5 5L20 7" />
          </svg>
        </ModernButton>
      </motion.div>

      <motion.div variants={itemVariants} className="mt-3 text-center text-[13px] leading-5" style={{ fontFamily: FONT, color: 'var(--t-faint)' }}>
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
