'use client';

import { motion } from 'framer-motion';
import { useBookingStore } from '@/store/bookingStore';

const stepNames = ['Kategorija', 'Storitev', 'Specialist', 'Datum in ura', 'Podatki', 'Potrditev'];

export default function MobileStepIndicator() {
  const { currentStep, theme } = useBookingStore();

  return (
    <div className="lg:hidden flex flex-col items-center py-6 px-4">
      {/* Step indicator */}
      <div className="flex items-center gap-3 mb-3">
        {[1, 2, 3, 4, 5, 6].map((step) => {
          const isCompleted = currentStep > step;
          const isCurrent = currentStep === step;

          return (
            <div key={step} className="flex items-center">
              <motion.div
                className="h-2 rounded-full transition-all duration-300"
                style={{
                  backgroundColor:
                    isCompleted || isCurrent
                      ? theme.primaryColor
                      : 'rgba(255,255,255,0.3)',
                  width: isCurrent ? '24px' : '8px',
                }}
                layout
              />
              {step < 6 && (
                <div
                  className="w-4 h-[1px] mx-1"
                  style={{
                    backgroundColor: isCompleted ? theme.primaryColor : 'rgba(255,255,255,0.2)',
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Current step name */}
      <p className="font-serif text-lg" style={{ color: theme.primaryColor }}>
        {stepNames[currentStep - 1]}
      </p>
      <p className="text-sm text-white/50 font-mono">
        Korak {currentStep} od 6
      </p>
    </div>
  );
}
