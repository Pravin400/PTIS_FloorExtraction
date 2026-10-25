'use client';

/**
 * Grievance Wizard Animated Progress Indicator
 * Path: src/components/modules/grievance/citizen/wizard/GrievanceWizardProgress.tsx
 */

import { Fragment } from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface GrievanceWizardProgressProps {
  currentStep: 1 | 2 | 3;
  onStepClick?: (step: 1 | 2 | 3) => void;
  maxUnlockedStep?: number;
}

export function GrievanceWizardProgress({
  currentStep,
  onStepClick,
  maxUnlockedStep = 1,
}: GrievanceWizardProgressProps) {
  const t = useTranslations('grievance');

  const steps: Array<{ step: 1 | 2 | 3; label: string; fullLabel: string }> = [
    { step: 1, label: t('stepPhotos'), fullLabel: t('evidencePhotos') },
    { step: 2, label: t('stepDetails'), fullLabel: t('departmentSpecifics') },
    { step: 3, label: t('stepCitizen'), fullLabel: t('citizenInfo') },
  ];

  return (
    <div className="w-full px-3 sm:px-8 py-2.5 sm:py-3.5 border-b border-slate-100 bg-slate-50/50">
      <div className="flex items-start max-w-sm sm:max-w-xl md:max-w-2xl mx-auto">
        {steps.map(({ step, label, fullLabel }, idx) => {
          const isCompleted = step < currentStep;
          const isActive = step === currentStep;
          const isClickable = step <= maxUnlockedStep && onStepClick;
          const isNotLast = idx < steps.length - 1;

          return (
            <Fragment key={step}>
              {/* Step Node (Circle + Label) */}
              <div
                onClick={() => isClickable && onStepClick(step)}
                className={`flex flex-col items-center shrink-0 ${
                  isClickable ? 'cursor-pointer' : 'cursor-default'
                }`}
              >
                <motion.div
                  initial={false}
                  animate={{
                    scale: isActive ? 1.08 : 1,
                    backgroundColor: isCompleted || isActive ? '#16a34a' : '#ffffff',
                    borderColor: isCompleted || isActive ? '#16a34a' : '#cbd5e1',
                    color: isCompleted || isActive ? '#ffffff' : '#64748b',
                  }}
                  whileHover={isClickable ? { scale: 1.15 } : {}}
                  whileTap={isClickable ? { scale: 0.95 } : {}}
                  className="w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-black border-2 shadow-2xs transition-colors bg-white relative z-10"
                >
                  {isCompleted ? <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[3]" /> : step}
                </motion.div>

                <span
                  className={`text-[10px] sm:text-[11.5px] font-bold mt-1 sm:mt-1.5 text-center whitespace-nowrap transition-colors tracking-wide ${
                    isActive
                      ? 'text-green-700 font-black'
                      : isCompleted
                      ? 'text-slate-800'
                      : 'text-slate-400'
                  }`}
                >
                  <span className="sm:hidden">{label}</span>
                  <span className="hidden sm:inline">{fullLabel}</span>
                </span>
              </div>

              {/* In-Between Connector Line (Strictly between adjacent steps, never before Step 1 or after Step 3) */}
              {isNotLast && (
                <div className="flex-1 mt-3 sm:mt-3.5 mx-2 sm:mx-4 h-0.5 sm:h-[2px] bg-slate-200 rounded-full relative overflow-hidden self-start">
                  <motion.div
                    className="absolute inset-y-0 left-0 bg-green-600 rounded-full origin-left"
                    initial={false}
                    animate={{
                      width: currentStep > step ? '100%' : '0%',
                    }}
                    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  />
                </div>
              )}
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}
