'use client';

// TODO: Stripe integration — wire up real Stripe SDK here.
// When stripeEnabled=true and booking succeeds (requiresPayment=true), the
// confirmation step routes here (step 7). Store has stripePaymentInfo with
// amount, currency, terminId, and paymentMode. Implement:
//   1. Load Stripe.js via @stripe/stripe-js
//   2. Create PaymentIntent client_secret via your backend
//   3. Render <Elements> + <PaymentElement> from @stripe/react-stripe-js
//   4. On successful payment, call booking API with stripe_payment_intent_id
//      to finalise the Termini record, then show SuccessView

import { motion } from 'framer-motion';
import { useBookingStore } from '@/store/bookingStore';
import { getContrastMode } from '../ClassicLayout';
import { t } from '../../i18n';

export default function ClassicPaymentStep() {
  const {
    theme,
    stripePaymentInfo,
    language,
    prevStep,
  } = useBookingStore();

  const contrastMode = getContrastMode(theme.bgFrom, theme.bgTo);
  const textPrimary =
    contrastMode === 'light' ? 'rgba(255,255,255,0.95)' : 'rgba(0,0,0,0.9)';
  const textSecondary =
    contrastMode === 'light' ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.55)';

  const amount = stripePaymentInfo?.amount ?? 0;
  const currency = (stripePaymentInfo?.currency ?? 'EUR').toUpperCase();

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Title */}
      <div className="mb-6">
        <h2
          className="text-3xl font-bold mb-1.5"
          style={{ fontFamily: 'var(--font-nunito)', color: textPrimary }}
        >
          {t(language, 'paymentTitle')}
        </h2>
        <p
          style={{
            fontFamily: 'var(--font-nunito-sans)',
            fontSize: '0.9rem',
            color: textSecondary,
          }}
        >
          {t(language, 'paymentDue')}
        </p>
      </div>

      {/* Amount card */}
      <div
        className="rounded-2xl p-6 mb-5 text-center"
        style={{
          background: 'rgba(255,255,255,0.97)',
          boxShadow: `0 4px 20px rgba(0,0,0,0.08), 0 0 0 1px ${theme.primaryColor}0D`,
        }}
      >
        <p
          className="text-xs uppercase tracking-widest font-bold mb-3"
          style={{
            fontFamily: 'var(--font-nunito)',
            color: '#9CA3AF',
            letterSpacing: '0.12em',
          }}
        >
          {t(language, 'paymentDue')}
        </p>
        <p
          className="text-4xl font-bold mb-1"
          style={{ fontFamily: 'var(--font-nunito)', color: theme.primaryColor }}
        >
          {(amount / 100).toFixed(2).replace('.', ',')} {currency}
        </p>
        {stripePaymentInfo?.paymentMode === 'deposit' && (
          <p
            className="text-xs text-gray-400 mt-1"
            style={{ fontFamily: 'var(--font-nunito-sans)' }}
          >
            Predplačilo / Deposit
          </p>
        )}

        {/* Stripe form placeholder */}
        <div
          className="mt-5 rounded-xl p-4 border-2 border-dashed"
          style={{
            borderColor: `${theme.primaryColor}30`,
            background: `${theme.primaryColor}06`,
          }}
        >
          <p
            className="text-sm text-gray-400"
            style={{ fontFamily: 'var(--font-nunito-sans)' }}
          >
            {/* TODO: Replace with <Elements> + <PaymentElement> */}
            Stripe payment form — integration pending
          </p>
        </div>
      </div>

      {/* Pay button */}
      <motion.button
        onClick={() => {
          /* TODO: trigger Stripe payment */
          alert('Stripe integration pending');
        }}
        className="w-full py-4 rounded-2xl font-bold text-white mb-3"
        style={{
          fontFamily: 'var(--font-nunito)',
          backgroundColor: theme.primaryColor,
          boxShadow: `0 6px 22px ${theme.primaryColor}38`,
        }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {t(language, 'payNow')} →
      </motion.button>

      {/* Back */}
      <button
        onClick={prevStep}
        className="w-full py-3 rounded-2xl text-sm font-medium transition-opacity hover:opacity-70"
        style={{
          fontFamily: 'var(--font-nunito-sans)',
          color: textSecondary,
          border: `1.5px solid ${contrastMode === 'light' ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.1)'}`,
          background: 'transparent',
        }}
      >
        {t(language, 'back')}
      </button>
    </motion.div>
  );
}
