'use client';

import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { useBookingStore } from '@/store/bookingStore';
import { BookingStep } from '@/types';

interface Step {
  number: BookingStep;
  title: string;
  description?: string;
}

const steps: Step[] = [
  { number: 1, title: 'Kategorija' },
  { number: 2, title: 'Storitev' },
  { number: 3, title: 'Specialist' },
  { number: 4, title: 'Datum in ura' },
  { number: 5, title: 'Podatki' },
  { number: 6, title: 'Potrditev' },
];

export default function TimelineStepper() {
  const {
    currentStep,
    theme,
    employeesUI,
    selectedEmployeeId,
    anyPerson,
    selectedCategory,
    selectedService,
    selectedDate,
    selectedTime,
    customerDetails,
    bookingConfirmation,
    goToStep,
  } = useBookingStore();

  // Find selected employee from employeesUI
  const selectedEmployee = employeesUI.find(e => e.id === selectedEmployeeId);

  const getStepDescription = (stepNumber: BookingStep): string | undefined => {
    switch (stepNumber) {
      case 1:
        return selectedCategory?.name;
      case 2:
        return selectedService?.naziv;
      case 3:
        if (anyPerson) return 'Kdorkoli';
        return selectedEmployee?.label;
      case 4:
        if (selectedDate && selectedTime) {
          return `${selectedDate.toLocaleDateString('sl-SI', { month: 'short', day: 'numeric' })} ob ${selectedTime}`;
        }
        return undefined;
      case 5:
        if (customerDetails?.firstName) {
          return `${customerDetails.firstName} ${customerDetails.lastName}`;
        }
        return undefined;
      default:
        return undefined;
    }
  };

  const canNavigateToStep = (stepNumber: BookingStep): boolean => {
    if (bookingConfirmation?.success) return false;
    return stepNumber < currentStep;
  };

  return (
    <div className="hidden lg:flex flex-col py-8 pr-12">
      <div className="relative">
        {steps.map((step, index) => {
          const isCompleted = currentStep > step.number;
          const isCurrent = currentStep === step.number;
          const description = getStepDescription(step.number);
          const canNavigate = canNavigateToStep(step.number);

          return (
            <div key={step.number} className="relative">
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div
                  className="absolute left-[11px] top-[28px] w-[2px] h-[60px]"
                  style={{
                    backgroundColor: isCompleted ? theme.primaryColor : 'rgba(255,255,255,0.2)',
                  }}
                />
              )}

              {/* Step item */}
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`flex items-start gap-4 mb-12 ${
                  canNavigate ? 'cursor-pointer group' : ''
                }`}
                onClick={() => canNavigate && goToStep(step.number)}
              >
                {/* Circle indicator */}
                <div className="relative flex-shrink-0">
                  <motion.div
                    className="w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all duration-300"
                    style={{
                      borderColor: isCompleted || isCurrent ? theme.primaryColor : 'rgba(255,255,255,0.3)',
                      backgroundColor: isCompleted ? theme.primaryColor : 'transparent',
                    }}
                    whileHover={canNavigate ? { scale: 1.1 } : {}}
                  >
                    {isCompleted ? (
                      <Check className="w-3 h-3 text-white" strokeWidth={3} />
                    ) : isCurrent ? (
                      <motion.div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: theme.primaryColor }}
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                      />
                    ) : null}
                  </motion.div>
                </div>

                {/* Content */}
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className="text-xs font-mono uppercase tracking-wider"
                      style={{
                        color: isCurrent ? theme.primaryColor : 'rgba(255,255,255,0.5)',
                      }}
                    >
                      {step.number}.
                    </span>
                    <span
                      className={`font-serif text-base transition-colors ${
                        canNavigate ? 'group-hover:underline' : ''
                      }`}
                      style={{
                        color: isCompleted || isCurrent ? 'white' : 'rgba(255,255,255,0.5)',
                      }}
                    >
                      {step.title}
                    </span>
                  </div>

                  {/* Description for completed steps */}
                  {description && isCompleted && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="text-sm text-white/50 mt-1 truncate max-w-[180px]"
                    >
                      {description}
                    </motion.p>
                  )}
                </div>
              </motion.div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
