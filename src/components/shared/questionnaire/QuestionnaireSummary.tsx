'use client';

// "Your answers" on the review step, in the design's look. Nothing when the
// client answered no questions.

import { motion } from 'framer-motion';
import { useBookingStore } from '@/store/bookingStore';
import type { RequestLook } from '@/components/shared/request/look';
import { QUESTION_TEXT, questionnaireReview, useQuestionnaireStore } from '@/lib/booking/questionnaire';

export default function QuestionnaireSummary({ look, className = '' }: { look: RequestLook; className?: string }) {
  const lang = useBookingStore((s) => s.language) === 'en' ? 'en' : 'sl';
  // Subscribe so the list follows the answers.
  useQuestionnaireStore((s) => s.answers);
  const rows = questionnaireReview(lang);
  if (rows.length === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
      className={className}
      style={{ background: look.surface, border: `1px solid ${look.border}`, borderRadius: look.radius, padding: '16px 18px' }}
    >
      <p
        style={
          look.capsLabels
            ? { fontFamily: look.fontBody, fontSize: 12, letterSpacing: '0.14em', textTransform: 'uppercase', color: look.surfaceMuted }
            : { fontFamily: look.fontHeading, fontSize: 16, fontWeight: 600, color: look.surfaceText }
        }
      >
        {QUESTION_TEXT[lang].answersTitle}
      </p>
      <dl className="mt-3 space-y-3">
        {rows.map((r) => (
          <div key={r.question}>
            <dt style={{ fontFamily: look.fontBody, fontSize: 13, color: look.surfaceMuted }}>{r.question}</dt>
            <dd className="mt-0.5 whitespace-pre-wrap" style={{ fontFamily: look.fontBody, fontSize: 15, color: look.surfaceText, fontWeight: 500 }}>
              {r.answer}
            </dd>
          </div>
        ))}
      </dl>
    </motion.section>
  );
}
