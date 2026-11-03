// The salon's questionnaire before the appointment ("Vprašalnik pred terminom").
//
// Questions come from n8n init (company.vprasalnik). Each design shows them
// in its details step with <QuestionnaireFields>; the answers go with the
// booking (create) or the request (request-create) as vprasalnikOdgovori and
// are shown to the salon on the appointment in Jedro+.

import { create } from 'zustand';
import type { BookingQuestion, SupportedLanguage } from '@/types';
import { useBookingStore } from '@/store/bookingStore';

export interface QuestionAnswer {
  /** Text answer; 'da' | 'ne' for yes/no; the option index for a choice. */
  value: string;
  /** Extra detail after "yes". */
  detail?: string;
}

interface QuestionnaireState {
  answers: Record<string, QuestionAnswer>;
  /** Question ids still missing an answer after the client tried to continue. */
  missing: string[];
  setAnswer: (id: string, answer: QuestionAnswer) => void;
  setMissing: (ids: string[]) => void;
}

export const useQuestionnaireStore = create<QuestionnaireState>((set) => ({
  answers: {},
  missing: [],
  setAnswer: (id, answer) =>
    set((s) => ({ answers: { ...s.answers, [id]: answer }, missing: s.missing.filter((m) => m !== id) })),
  setMissing: (missing) => set({ missing }),
}));

export const QUESTION_TEXT = {
  sl: {
    title: 'Še nekaj vprašanj',
    subtitle: 'Salon vas prosi za nekaj podatkov pred obiskom.',
    optional: 'neobvezno',
    yes: 'Da',
    no: 'Ne',
    detail: 'Pojasnite (neobvezno)',
    placeholder: 'Vaš odgovor',
    missing: 'Prosimo, odgovorite na to vprašanje.',
    missingSome: 'Odgovorite še na označena vprašanja.',
    answersTitle: 'Vaši odgovori',
  },
  en: {
    title: 'A few questions',
    subtitle: 'The salon would like to know a few things before your visit.',
    optional: 'optional',
    yes: 'Yes',
    no: 'No',
    detail: 'Add details (optional)',
    placeholder: 'Your answer',
    missing: 'Please answer this question.',
    missingSome: 'Please answer the marked questions.',
    answersTitle: 'Your answers',
  },
} as const;

/** Questions that apply to the chosen services (all of them when none is chosen). */
export function questionsFor(all: BookingQuestion[] | undefined, serviceIds: string[]): BookingQuestion[] {
  if (!Array.isArray(all) || all.length === 0) return [];
  const chosen = new Set(serviceIds.map(String));
  return all.filter((q) => !q.storitve?.length || q.storitve.some((id) => chosen.has(String(id))));
}

export function questionLabel(q: BookingQuestion, lang: SupportedLanguage): string {
  return (lang === 'en' && q.vprasanje_en) || q.vprasanje;
}

export function optionLabel(q: BookingQuestion, index: number, lang: SupportedLanguage): string {
  const sl = q.moznosti?.[index] ?? '';
  return (lang === 'en' && q.moznosti_en?.[index]) || sl;
}

function isAnswered(q: BookingQuestion, a: QuestionAnswer | undefined): boolean {
  if (!a) return false;
  if (q.tip === 'da_ne') return a.value === 'da' || a.value === 'ne';
  if (q.tip === 'izbira') return a.value !== '' && Number.isInteger(Number(a.value)) && Boolean(q.moznosti?.[Number(a.value)]);
  return a.value.trim().length > 0;
}

/** The questions for the current booking, from the stores. */
export function currentQuestions(): BookingQuestion[] {
  const { company, selectedServices, selectedService } = useBookingStore.getState();
  const services = selectedServices.length > 0 ? selectedServices : selectedService ? [selectedService] : [];
  return questionsFor(company?.vprasalnik, services.map((s) => String(s.id)));
}

/**
 * Checks the required questions. Marks the missing ones (the fields show a
 * message) and returns the first one's id, or null when all is answered.
 * Designs call it before leaving the details step and scroll to that id.
 */
export function checkRequiredQuestions(): string | null {
  const { answers, setMissing } = useQuestionnaireStore.getState();
  const missing = currentQuestions()
    .filter((q) => q.obvezno && !isAnswered(q, answers[q.id]))
    .map((q) => q.id);
  setMissing(missing);
  if (missing.length === 0) return null;
  const el = document.getElementById(questionDomId(missing[0]));
  el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  return missing[0];
}

export const questionDomId = (id: string) => `vprasanje-${id}`;

/**
 * Answers for the API, written in the salon's language (the original question
 * text and Da/Ne), so the salon reads them the same way whatever language the
 * client booked in.
 */
export function questionnaireAnswersPayload(): { id: string; vprasanje: string; odgovor: string }[] {
  const { answers } = useQuestionnaireStore.getState();
  const salonLang: SupportedLanguage = useBookingStore.getState().company?.defaultLanguage === 'en' ? 'en' : 'sl';
  const words = QUESTION_TEXT[salonLang];

  return currentQuestions()
    .map((q) => {
      const a = answers[q.id];
      if (!isAnswered(q, a)) return null;
      let odgovor = a!.value.trim();
      if (q.tip === 'da_ne') {
        odgovor = a!.value === 'da' ? words.yes : words.no;
        const detail = a!.detail?.trim();
        if (a!.value === 'da' && detail) odgovor = `${odgovor} – ${detail}`;
      } else if (q.tip === 'izbira') {
        odgovor = q.moznosti?.[Number(a!.value)] ?? '';
      }
      return { id: q.id, vprasanje: q.vprasanje, odgovor: odgovor.slice(0, 1000) };
    })
    .filter((x): x is { id: string; vprasanje: string; odgovor: string } => Boolean(x && x.odgovor));
}

/** What the client answered, in their language, for the review step. */
export function questionnaireReview(lang: SupportedLanguage): { question: string; answer: string }[] {
  const { answers } = useQuestionnaireStore.getState();
  const words = QUESTION_TEXT[lang];
  return currentQuestions()
    .map((q) => {
      const a = answers[q.id];
      if (!isAnswered(q, a)) return null;
      let answer = a!.value.trim();
      if (q.tip === 'da_ne') {
        answer = a!.value === 'da' ? words.yes : words.no;
        if (a!.value === 'da' && a!.detail?.trim()) answer += ` – ${a!.detail.trim()}`;
      } else if (q.tip === 'izbira') {
        answer = optionLabel(q, Number(a!.value), lang);
      }
      return { question: questionLabel(q, lang), answer };
    })
    .filter((x): x is { question: string; answer: string } => Boolean(x));
}
