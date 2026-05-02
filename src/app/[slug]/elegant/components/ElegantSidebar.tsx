'use client';

import { useBookingStore } from '@/store/bookingStore';

const STEPS = [
  { number: 1, label: 'Storitev', visual: 1 },
  { number: 3, label: 'Specialist', visual: 2 },
  { number: 4, label: 'Datum in ura', visual: 3 },
  { number: 5, label: 'Podatki', visual: 4 },
  { number: 6, label: 'Potrditev', visual: 5 },
];

interface Props {
  currentStep: number;
  stepValues: Record<number, string | undefined>;
}

export default function ElegantSidebar({ currentStep, stepValues }: Props) {
  const { theme } = useBookingStore();

  return (
    <nav className="px-6 pb-8 flex-1">
      {STEPS.map((step, idx) => {
        const isDone = currentStep > step.number;
        const isActive = currentStep === step.number;
        const isLast = idx === STEPS.length - 1;
        const value = isDone ? stepValues[step.number] : undefined;

        return (
          <div key={step.number} className="flex items-start gap-3">
            {/* Indicator column */}
            <div className="flex flex-col items-center flex-shrink-0" style={{ paddingTop: '2px' }}>
              {/* Circle / checkmark */}
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300"
                style={{
                  background: isDone
                    ? `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor ?? theme.primaryColor})`
                    : 'transparent',
                  border: isDone
                    ? 'none'
                    : isActive
                    ? `2px solid ${theme.primaryColor}`
                    : '1.5px solid #D1D5DB',
                  color: isDone ? 'white' : isActive ? theme.primaryColor : '#9CA3AF',
                  fontSize: isDone ? '0.65rem' : '0.7rem',
                  fontWeight: isDone ? 700 : 500,
                  fontFamily: 'var(--font-inter)',
                }}
              >
                {isDone ? '✓' : step.visual}
              </div>

              {/* Connecting line */}
              {!isLast && (
                <div
                  className="w-px transition-all duration-300"
                  style={{
                    height: value ? '3rem' : '2.25rem',
                    marginTop: '3px',
                    backgroundColor: isDone ? theme.primaryColor : '#E5E7EB',
                    opacity: isDone ? 0.4 : 1,
                  }}
                />
              )}
            </div>

            {/* Step text */}
            <div className="min-w-0" style={{ paddingBottom: value ? '0.75rem' : '2.25rem' }}>
              <p
                className="leading-tight transition-colors duration-300"
                style={{
                  fontFamily: 'var(--font-inter)',
                  fontSize: '0.875rem',
                  fontWeight: isActive ? 500 : 400,
                  color: isDone ? '#6B7280' : isActive ? theme.primaryColor : '#9CA3AF',
                }}
              >
                {step.label}
              </p>
              {value && (
                <p
                  className="mt-0.5 truncate"
                  style={{
                    fontFamily: 'var(--font-inter)',
                    fontSize: '0.75rem',
                    color: '#9CA3AF',
                  }}
                >
                  {value}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </nav>
  );
}
