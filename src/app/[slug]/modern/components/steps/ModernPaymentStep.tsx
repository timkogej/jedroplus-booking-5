'use client';

// TODO: Stripe integration — wire up real Stripe SDK here.
// When stripeEnabled=true and booking succeeds with requiresPayment=true,
// ModernConfirmation routes here (step 7). Store has stripePaymentInfo with
// amount, currency, terminId, and paymentMode. Implement:
//   1. Load Stripe.js via @stripe/stripe-js
//   2. Create PaymentIntent client_secret via your backend
//   3. Render <Elements> + <PaymentElement> from @stripe/react-stripe-js
//   4. On successful payment, call booking API with stripe_payment_intent_id
//      to finalise the Termini record, then call setBookingConfirmation

import { motion } from 'framer-motion';
import { useBookingStore } from '@/store/bookingStore';
import { t } from '../../i18n';

export default function ModernPaymentStep() {
  const { theme, stripePaymentInfo, language, prevStep } = useBookingStore();

  const amount = stripePaymentInfo?.amount ?? 0;
  const currency = (stripePaymentInfo?.currency ?? 'EUR').toUpperCase();
  const paymentMode = stripePaymentInfo?.paymentMode ?? 'full';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Heading */}
      <div className="mb-8">
        <h2
          className="mb-2"
          style={{
            color: 'var(--t-primary)',
            fontFamily: 'var(--font-clash)',
            fontWeight: 400,
            fontSize: 'clamp(2rem, 5vw, 3.25rem)',
            letterSpacing: '-0.015em',
            lineHeight: 1.1,
          }}
        >
          {t(language, 'paymentTitle')}
        </h2>
        <p className="text-sm" style={{ color: 'var(--t-muted)', fontFamily: 'var(--font-inter)' }}>
          {paymentMode === 'deposit'
            ? `${t(language, 'paymentDue')} (predplačilo)`
            : t(language, 'paymentDue')}
        </p>
      </div>

      {/* Amount card */}
      <div
        className="rounded-2xl p-6 mb-6 text-center modern-glass"
        style={{
          backgroundColor: 'var(--s2)',
          border: '1px solid var(--b2)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
      >
        {/* Gradient bar */}
        <div
          className="h-1 -mx-6 -mt-6 mb-6 rounded-t-2xl"
          style={{
            background: `linear-gradient(to right, ${theme.primaryColor}, ${theme.secondaryColor})`,
          }}
        />
        <p
          className="text-xs uppercase tracking-widest mb-3"
          style={{
            fontFamily: 'var(--font-inter)',
            color: 'var(--t-faint)',
            letterSpacing: '0.12em',
          }}
        >
          {t(language, 'paymentDue')}
        </p>
        <p
          className="mb-1"
          style={{
            fontFamily: 'var(--font-clash)',
            fontWeight: 500,
            fontSize: 'clamp(2.25rem, 6vw, 3.75rem)',
            letterSpacing: '-0.015em',
            color: theme.primaryColor,
          }}
        >
          {amount.toFixed(2)} {currency}
        </p>
        {paymentMode === 'deposit' && (
          <p
            className="text-xs mt-2"
            style={{ fontFamily: 'var(--font-inter)', color: 'var(--t-faint)' }}
          >
            Predplačilo — preostanek plačate na mestu
          </p>
        )}
      </div>

      {/* Placeholder payment button — disabled until Stripe is wired */}
      <button
        disabled
        className="w-full py-4 rounded-2xl font-semibold cursor-not-allowed"
        style={{
          backgroundColor: 'var(--s3)',
          color: 'var(--t-disabled)',
          fontFamily: 'var(--font-inter)',
          fontSize: '0.975rem',
        }}
      >
        {t(language, 'payNow')}
      </button>

      <p
        className="text-center mt-3 text-xs"
        style={{ color: 'var(--t-faint)', fontFamily: 'var(--font-inter)' }}
      >
        {/* TODO: Stripe integration — replace button above with Stripe Elements */}
        Plačilna integracija v pripravi
      </p>

      {/* Back to confirmation */}
      <motion.button
        onClick={prevStep}
        className="w-full mt-4 py-3 rounded-xl text-sm font-medium"
        style={{
          fontFamily: 'var(--font-inter)',
          backgroundColor: 'var(--s2)',
          border: '1px solid var(--b2)',
          color: 'var(--t-muted)',
        }}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
      >
        ← {t(language, 'back')}
      </motion.button>
    </motion.div>
  );
}
