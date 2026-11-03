'use client';

// The salon's questions in a design's details step. Colours, fonts and corners
// come from the design's RequestLook, so it reads as part of that design.
// Renders nothing when the salon has no questions for the chosen services.

import { motion, AnimatePresence } from 'framer-motion';
import type { CSSProperties } from 'react';
import { useBookingStore } from '@/store/bookingStore';
import type { BookingQuestion } from '@/types';
import type { RequestLook } from '@/components/shared/request/look';
import {
  QUESTION_TEXT,
  optionLabel,
  questionDomId,
  questionLabel,
  questionsFor,
  useQuestionnaireStore,
} from '@/lib/booking/questionnaire';

const EASE = [0.22, 1, 0.36, 1] as const;
const ERROR = '#E5484D';

export default function QuestionnaireFields({ look, className = '' }: { look: RequestLook; className?: string }) {
  const company = useBookingStore((s) => s.company);
  const selectedServices = useBookingStore((s) => s.selectedServices);
  const selectedService = useBookingStore((s) => s.selectedService);
  const lang = useBookingStore((s) => s.language) === 'en' ? 'en' : 'sl';
  const answers = useQuestionnaireStore((s) => s.answers);
  const missing = useQuestionnaireStore((s) => s.missing);
  const setAnswer = useQuestionnaireStore((s) => s.setAnswer);

  const services = selectedServices.length > 0 ? selectedServices : selectedService ? [selectedService] : [];
  const questions = questionsFor(company?.vprasalnik, services.map((s) => String(s.id)));
  if (questions.length === 0) return null;

  const words = QUESTION_TEXT[lang];
  const radius = Math.min(look.radius, 14);

  const label: CSSProperties = look.capsLabels
    ? { fontFamily: look.fontBody, fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', color: look.text, fontWeight: 600 }
    : { fontFamily: look.fontBody, fontSize: 15, color: look.text, fontWeight: 600 };

  const field = (error: boolean): CSSProperties => ({
    width: '100%',
    background: look.surface,
    color: look.surfaceText,
    border: `1px solid ${error ? ERROR : look.border}`,
    borderRadius: radius,
    padding: '12px 14px',
    fontFamily: look.fontBody,
    fontSize: 16, // 16px: iOS does not zoom into the field
    lineHeight: 1.45,
    outline: 'none',
    resize: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  });

  const pill = (on: boolean, error: boolean): CSSProperties => ({
    background: on ? look.accent : look.surface,
    color: on ? look.onAccent : look.surfaceText,
    border: `1px solid ${on ? look.accent : error ? ERROR : look.border}`,
    borderRadius: Math.max(radius, 10) >= 12 ? 999 : radius,
    padding: '10px 18px',
    fontFamily: look.fontBody,
    fontSize: 15,
    fontWeight: on ? 600 : 500,
    minHeight: 44,
    transition: 'background 0.2s, color 0.2s, border-color 0.2s',
  });

  const focusRing = (e: React.FocusEvent<HTMLTextAreaElement>, on: boolean) => {
    e.currentTarget.style.boxShadow = on ? `0 0 0 3px color-mix(in srgb, ${look.accent} 22%, transparent)` : 'none';
    if (on) e.currentTarget.style.borderColor = look.accent;
    else e.currentTarget.style.borderColor = look.border;
  };

  const renderInput = (q: BookingQuestion, error: boolean) => {
    const a = answers[q.id] ?? { value: '' };
    if (q.tip === 'besedilo') {
      return (
        <textarea
          rows={2}
          maxLength={1000}
          value={a.value}
          placeholder={words.placeholder}
          aria-invalid={error || undefined}
          onChange={(e) => setAnswer(q.id, { value: e.target.value })}
          onFocus={(e) => focusRing(e, true)}
          onBlur={(e) => focusRing(e, false)}
          style={field(error)}
        />
      );
    }
    if (q.tip === 'da_ne') {
      return (
        <div>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={questionLabel(q, lang)}>
            {(['da', 'ne'] as const).map((v) => (
              <motion.button
                key={v}
                type="button"
                role="radio"
                aria-checked={a.value === v}
                whileTap={{ scale: 0.96 }}
                onClick={() => setAnswer(q.id, { value: v, detail: v === 'da' ? a.detail : undefined })}
                style={pill(a.value === v, error)}
              >
                {v === 'da' ? words.yes : words.no}
              </motion.button>
            ))}
          </div>
          <AnimatePresence initial={false}>
            {a.value === 'da' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.28, ease: EASE }}
                className="overflow-hidden"
              >
                <textarea
                  rows={2}
                  maxLength={600}
                  value={a.detail ?? ''}
                  placeholder={words.detail}
                  onChange={(e) => setAnswer(q.id, { value: 'da', detail: e.target.value })}
                  onFocus={(e) => focusRing(e, true)}
                  onBlur={(e) => focusRing(e, false)}
                  style={{ ...field(false), marginTop: 10 }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      );
    }
    return (
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={questionLabel(q, lang)}>
        {(q.moznosti ?? []).map((_, i) => {
          const on = a.value === String(i);
          return (
            <motion.button
              key={i}
              type="button"
              role="radio"
              aria-checked={on}
              whileTap={{ scale: 0.96 }}
              onClick={() => setAnswer(q.id, { value: String(i) })}
              style={pill(on, error)}
            >
              {optionLabel(q, i, lang)}
            </motion.button>
          );
        })}
      </div>
    );
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: EASE }}
      className={className}
      aria-label={words.title}
    >
      <h3 style={{ fontFamily: look.fontHeading, color: look.text, fontSize: 20, fontWeight: 600, lineHeight: 1.25 }}>
        {words.title}
      </h3>
      <p className="mt-1" style={{ fontFamily: look.fontBody, color: look.muted, fontSize: 14 }}>
        {words.subtitle}
      </p>

      <div className="mt-5 space-y-6">
        {questions.map((q, i) => {
          const error = missing.includes(q.id);
          return (
            <motion.div
              key={q.id}
              id={questionDomId(q.id)}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0, x: error ? [0, -6, 6, -3, 3, 0] : 0 }}
              transition={{ duration: 0.4, ease: EASE, delay: 0.05 + i * 0.05 }}
              className="scroll-mt-28"
            >
              <p className="mb-2.5" style={label}>
                {questionLabel(q, lang)}
                {q.obvezno ? (
                  <span style={{ color: look.accentText }}> *</span>
                ) : (
                  <span style={{ color: look.muted, fontWeight: 400, textTransform: 'none', letterSpacing: 0, fontSize: 13 }}>
                    {' '}
                    ({words.optional})
                  </span>
                )}
              </p>
              {renderInput(q, error)}
              <AnimatePresence>
                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="mt-2"
                    style={{ color: ERROR, fontFamily: look.fontBody, fontSize: 13 }}
                    role="alert"
                  >
                    {words.missing}
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </motion.section>
  );
}
