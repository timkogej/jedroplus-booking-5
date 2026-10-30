'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { useBookingStore } from '@/store/bookingStore';
import { bookingErrorMessage, isSlotConflict, returnToTimeStep, startCheckout, submitCurrentBooking } from '@/lib/booking/submit';
import { useSlotRecheck } from '@/lib/booking/useSlotRecheck';
import { t } from '../../i18n';
import { addBookingToCalendar } from '@/lib/booking/calendar';
import CancellationPolicy from '@/components/shared/CancellationPolicy';
import { shareBooking } from '@/lib/booking/share';
import { startNewBooking } from '@/lib/booking/newBooking';
import { stickyCtaStyle } from '@/lib/booking/stickyCta';
import CasinoTicket from '../CasinoTicket';
import { CREAM, CX_BG, EASE, ErrorNote, FAINT, FONT_BODY, FONT_HEAD, MUTED, Spinner, atWord, dateLocale, mix, spokenDate } from '../ui';
import QuestionnaireSummary from '@/components/shared/questionnaire/QuestionnaireSummary';
import { casinoLook } from '@/components/shared/request/looks';

interface Props {
  companySlug?: string;
}

const REEL_SYMBOLS = ['♠', '♥', '♦', '♣', '7', '◆'];
const REEL_H = 60;

// ── One slot machine reel that spins and lands on `value` ──────────
function Reel({ value, width, duration, delay }: { value: string; width: number; duration: number; delay: number }) {
  const strip = useMemo(() => {
    const n = 14;
    return [...Array.from({ length: n }, (_, i) => REEL_SYMBOLS[(i * 5 + value.length) % REEL_SYMBOLS.length]), value];
  }, [value]);

  return (
    <div
      className="relative overflow-hidden rounded-[12px]"
      style={{
        width,
        height: REEL_H,
        background: 'linear-gradient(180deg, #07070a 0%, #1b1b22 50%, #07070a 100%)',
        boxShadow: `inset 0 0 0 1px ${mix('--cx-glow', 35)}, inset 0 8px 14px -8px rgba(0,0,0,0.9), inset 0 -8px 14px -8px rgba(0,0,0,0.9)`,
      }}
    >
      <motion.div
        initial={{ y: 0 }}
        animate={{ y: -(strip.length - 1) * REEL_H }}
        transition={{ duration, delay, ease: [0.15, 0.6, 0.25, 1] }}
      >
        {strip.map((s, i) => {
          const last = i === strip.length - 1;
          return (
            <div
              key={i}
              className="flex items-center justify-center font-black tabular-nums"
              style={{
                height: REEL_H,
                fontFamily: FONT_HEAD,
                fontSize: last ? (value.length > 3 ? 28 : 30) : 30,
                color: last ? '#fff' : mix('--cx-glow', 55),
              }}
            >
              {s}
            </div>
          );
        })}
      </motion.div>
      <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-1/2" style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.06), transparent)' }} />
    </div>
  );
}

// ── Chips flying out when the reels land ───────────────────────────
function ChipBurst() {
  const [chips] = useState(() =>
    Array.from({ length: 26 }, (_, i) => {
      const angle = (i / 26) * Math.PI * 2 + Math.random() * 0.3;
      const dist = 120 + Math.random() * 140;
      return {
        id: i,
        dx: Math.cos(angle) * dist,
        dy: Math.sin(angle) * dist * 0.8 - 30,
        size: 9 + Math.random() * 9,
        rot: Math.random() * 540 - 270,
        dur: 1.3 + Math.random() * 0.8,
        delay: 2.05 + Math.random() * 0.15,
        tone: i % 3,
      };
    }),
  );
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      {chips.map((c) => (
        <span
          key={c.id}
          className="cx-confetti"
          style={{
            width: c.size,
            height: c.size,
            background: c.tone === 0 ? 'var(--cx-a)' : c.tone === 1 ? 'var(--cx-glow2)' : '#F6F3EE',
            border: `${Math.max(1.5, c.size * 0.16)}px dashed rgba(255,255,255,0.6)`,
            ['--dx' as string]: `${c.dx}px`,
            ['--dy' as string]: `${c.dy}px`,
            ['--rot' as string]: `${c.rot}deg`,
            ['--dur' as string]: `${c.dur}s`,
            ['--delay' as string]: `${c.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

const ICON_CAL = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M3 10h18M8 3v4M16 3v4M12 13.5v4M10 15.5h4" />
  </svg>
);
const ICON_SHARE = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 3v12M7.5 7.5L12 3l4.5 4.5" />
    <path d="M5 12v6a3 3 0 003 3h8a3 3 0 003-3v-6" />
  </svg>
);

// ── Success: jackpot ───────────────────────────────────────────────
function SuccessView() {
  const { bookingConfirmation, selectedDate, selectedTime, customerDetails, language } = useBookingStore();
  const [copied, setCopied] = useState(false);
  const [landed, setLanded] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => setLanded(true), 2050);
    return () => window.clearTimeout(id);
  }, []);

  const handleShare = async () => {
    if ((await shareBooking()) === 'copied') {
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  const loc = dateLocale(language);
  const reels = selectedDate && selectedTime
    ? [
        { value: String(selectedDate.getDate()), width: 70 },
        { value: format(selectedDate, 'MMM', { locale: loc }).replace('.', '').toUpperCase(), width: 92 },
        { value: selectedTime, width: 120 },
      ]
    : [
        { value: '♠', width: 70 },
        { value: '♦', width: 70 },
        { value: '♣', width: 70 },
      ];

  const firstName = customerDetails?.firstName?.trim();
  const time = selectedTime ?? bookingConfirmation?.cas ?? '';
  const when = selectedDate ? `${spokenDate(selectedDate, language)} ${atWord(language)} ${time}` : `${bookingConfirmation?.datum ?? ''} ${time}`;

  return (
    <div className="relative mx-auto max-w-lg pt-2">
      {/* The machine */}
      <div className="relative">
        <ChipBurst />
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: EASE }}
          className="relative mx-auto w-fit rounded-[20px] p-2.5"
          style={{
            background: 'linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))',
            boxShadow: `inset 0 0 0 1px ${mix('--cx-glow', 40)}`,
          }}
        >
          <motion.span
            aria-hidden="true"
            className="pointer-events-none absolute -inset-6 -z-10 rounded-[40px]"
            style={{ background: `radial-gradient(closest-side, ${mix('--cx-glow', 45)}, transparent)` }}
            initial={{ opacity: 0, scale: 0.6 }}
            animate={landed ? { opacity: [0, 1, 0.55], scale: [0.6, 1.15, 1] } : { opacity: 0 }}
            transition={{ duration: 1.1, ease: EASE }}
          />
          <div className="flex gap-2">
            {reels.map((r, i) => (
              <Reel key={i} value={r.value} width={r.width} duration={1.1 + i * 0.4} delay={0.25} />
            ))}
          </div>
          {/* Win line */}
          <motion.span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-1 top-1/2 h-[2px] -translate-y-1/2 rounded-full"
            style={{ background: 'var(--cx-grad)', boxShadow: '0 0 12px var(--cx-glow)', transformOrigin: 'left' }}
            initial={{ scaleX: 0, opacity: 0 }}
            animate={landed ? { scaleX: 1, opacity: [0, 1, 0.5] } : {}}
            transition={{ duration: 0.6, ease: EASE }}
          />
        </motion.div>
      </div>

      <div className="relative mt-9 text-center">
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.1, duration: 0.6, ease: EASE }}
          className="text-[20px] italic"
          style={{ fontFamily: FONT_HEAD, color: 'var(--cx-glow)' }}
        >
          {firstName ? t(language, 'thanksName').replace('{name}', firstName) : t(language, 'seatReserved')}
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 14, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 2.2, duration: 0.7, ease: EASE }}
          className="mt-1 font-black leading-none"
          style={{ fontFamily: FONT_HEAD, fontSize: 'clamp(2.6rem, 11vw, 3.6rem)', color: CREAM, letterSpacing: '-0.02em' }}
        >
          {t(language, 'bookingConfirmed')}
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.4, duration: 0.6 }}
          className="mx-auto mt-3 max-w-sm text-[16px] leading-6"
          style={{ fontFamily: FONT_BODY, color: MUTED }}
        >
          {t(language, 'seeYou')} {when}.
        </motion.p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2.5, duration: 0.8, ease: EASE }}
        className="mt-9"
      >
        <CasinoTicket mode="done" refNum={bookingConfirmation?.terminId} />
      </motion.div>

      {customerDetails?.email && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.8 }}
          className="mt-5 text-center text-[14px]"
          style={{ fontFamily: FONT_BODY, color: FAINT }}
        >
          {t(language, 'willSendTo')} <span style={{ color: MUTED }}>{customerDetails.email}</span>
        </motion.p>
      )}

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2.9, duration: 0.6, ease: EASE }}
        className="mt-7 space-y-3"
      >
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => addBookingToCalendar()} className="cx-btn-ghost">
            {ICON_CAL}
            {t(language, 'addToCalendar')}
          </button>
          <button onClick={handleShare} className="cx-btn-ghost">
            {ICON_SHARE}
            <AnimatePresence mode="wait" initial={false}>
              <motion.span key={copied ? 'c' : 's'} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.15 }}>
                {copied ? `✓ ${t(language, 'copied')}` : t(language, 'share')}
              </motion.span>
            </AnimatePresence>
          </button>
        </div>
        <button onClick={startNewBooking} className="cx-btn w-full">
          {t(language, 'newBooking')}
        </button>
      </motion.div>
    </div>
  );
}

// ── Pre-submit review ──────────────────────────────────────────────
export default function CasinoConfirmation({ companySlug }: Props) {
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
    goToStep,
    language,
  } = useBookingStore();
  const theme = useBookingStore((s) => s.theme);

  const [error, setError] = useState<string | null>(null);
  const [redirecting, setRedirecting] = useState(false);

  if (bookingConfirmation?.success) {
    return <SuccessView />;
  }

  const primaryService = selectedServices[0] ?? selectedService;

  const handleConfirm = async () => {
    if (!companySlug || !primaryService || !selectedDate || !selectedTime || !customerDetails) {
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
        const datumDisplay = format(selectedDate, language === 'en' ? 'MMMM d, yyyy' : 'd. MMMM yyyy', { locale: dateLocale(language) });

        if (response.requiresPayment === true) {
          setRedirecting(true);

          try {
            await startCheckout(result, companySlug, 'casino', datumDisplay);
            return;
          } catch (err) {
            console.error('Casino booking: failed to start payment:', err);
            setRedirecting(false);
            setError(t(language, 'paymentStartFailed'));
            return;
          }
        }

        setBookingConfirmation({
          success: true,
          message: response.message || 'Rezervacija uspešna!',
          storitev: serviceName,
          datum: datumDisplay,
          cas: selectedTime,
          terminId: response.terminId,
        });
      } else {
        setError(response.message || t(language, 'bookingFailed'));
      }
    } catch (err) {
      console.error('Casino booking: submit failed:', err);
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

  return (
    <div>
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE }}
        className="mb-6 text-[16px] leading-6"
        style={{ fontFamily: FONT_BODY, color: MUTED }}
      >
        {t(language, 'reviewIntro')}
      </motion.p>

      {/* The card is dealt face down and turns over */}
      <div style={{ perspective: 1400 }}>
        <motion.div
          initial={{ rotateY: -100, opacity: 0, y: 30 }}
          animate={{ rotateY: 0, opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: EASE, delay: 0.1 }}
          style={{ transformOrigin: 'center', backfaceVisibility: 'hidden' }}
        >
          <CasinoTicket mode="review" onEdit={(step) => goToStep(step)} />
        </motion.div>
      </div>

      <QuestionnaireSummary look={casinoLook(theme)} className="mb-5" />

      <AnimatePresence>
        {error && (
          <div className="mt-5">
            <ErrorNote>{error}</ErrorNote>
          </div>
        )}
      </AnimatePresence>

      <div className="booking-sticky-cta mt-7 flex flex-col items-center" style={stickyCtaStyle(CX_BG, 16)}>
        <motion.button
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5, ease: EASE }}
          onClick={handleConfirm}
          disabled={busy}
          className="cx-btn w-full max-w-md"
        >
          {busy ? (
            <>
              <Spinner />
              {redirecting ? t(language, 'redirectingToPayment') : t(language, 'confirmingBtn')}
            </>
          ) : (
            <>
              <span style={{ fontFamily: 'Georgia, serif', fontSize: '1rem' }} aria-hidden="true">♣</span>
              {t(language, 'confirmBtn')}
              <span style={{ fontFamily: 'Georgia, serif', fontSize: '1rem' }} aria-hidden="true">♣</span>
            </>
          )}
        </motion.button>
      </div>

      {customerDetails?.email && (
        <p className="mt-3 text-center text-[13px]" style={{ fontFamily: FONT_BODY, color: FAINT }}>
          {t(language, 'willSendTo')} <span style={{ color: MUTED }}>{customerDetails.email}</span>
        </p>
      )}
      <div className="mt-2">
        <CancellationPolicy />
      </div>
    </div>
  );
}
