'use client';

import { Check } from 'lucide-react';
import { Card } from '@/components/common';
import type { ReportWorkspaceCopy, Step } from '@/types/report.types';

// Each step gets its own accent color
const STEP_COLORS = [
  { active: 'bg-[#800000] border-[#800000] shadow-[#800000]/30', done: 'bg-green-500 border-green-500', text: 'text-[#800000]' },
  { active: 'bg-[#004c8c] border-[#004c8c] shadow-[#004c8c]/30', done: 'bg-green-500 border-green-500', text: 'text-[#004c8c]' },
  { active: 'bg-emerald-600 border-emerald-600 shadow-emerald-400/40', done: 'bg-green-500 border-green-500', text: 'text-emerald-600' },
  { active: 'bg-violet-600 border-violet-600 shadow-violet-400/40', done: 'bg-green-500 border-green-500', text: 'text-violet-600' },
];

interface StepperProps {
  currentStep: Step;
  copy: ReportWorkspaceCopy;
}

export function Stepper({ currentStep, copy }: StepperProps) {
  const steps = [
    { label: copy.steps.selectCategory },
    { label: copy.steps.selectReport },
    { label: copy.steps.setParameters },
    { label: copy.steps.generateReport },
  ];
  return (
    <Card padding="none" className="rounded-xl px-4 py-3 shadow-sm border border-gray-100 bg-gradient-to-r from-gray-50 to-white">
      <div className="flex items-center w-full">
        {steps.map((step, idx) => {
          const stepNum = (idx + 1) as Step;
          const isDone = stepNum < currentStep;
          const isActive = stepNum === currentStep;
          const sc = STEP_COLORS[idx];
          return (
            <div key={stepNum} className="flex items-center flex-1 last:flex-none">
              <div className="flex items-center gap-2 min-w-0">
                <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold border-2 transition-all duration-300
                  ${isDone ? `${sc.done} text-white shadow-sm` : ''}
                  ${isActive ? `${sc.active} text-white shadow-md` : ''}
                  ${!isDone && !isActive ? 'bg-white border-gray-200 text-gray-400' : ''}
                `}>
                  {isDone ? <Check className="w-3.5 h-3.5" /> : stepNum}
                </div>
                <div className="min-w-0">
                  <p className={`text-[11px] font-semibold leading-tight truncate transition-colors duration-300
                    ${isActive ? sc.text : isDone ? 'text-green-600' : 'text-gray-400'}`}>
                    {step.label}
                  </p>
                </div>
              </div>
              {idx < steps.length - 1 && (
                <div className="flex-1 mx-3">
                  <div className={`h-0.5 rounded-full transition-all duration-500
                    ${isDone ? 'bg-gradient-to-r from-green-400 to-green-300' : 'bg-gray-200'}`} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
