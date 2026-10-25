'use client';
import React, { useContext } from 'react';
import { Check } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { NAAssetFormContext } from '../NAAssetFormContext';
import { Badge } from '@/components/common';
import type { NAProgressStepsProps } from '@/types/asset/municipal-Asset/new-add-new-asset';

export function NAProgressSteps({ currentStep = 1, completedSteps = [], onStepClick, steps }: NAProgressStepsProps) {
  const t = useTranslations("newAddNewAsset");
  const context = useContext(NAAssetFormContext);
  const searchParams = useSearchParams();
  const assetIdStr = searchParams.get('assetId') || searchParams.get('id');
  const isEditing = searchParams.get('mode') === 'edit' && Boolean(assetIdStr && Number(assetIdStr) > 0);
  const displayAssetNo = context?.formData?.assetCode || context?.formData?.assetNo || assetIdStr;

  return (
    <div className="bg-[#FAFBFD] border-b border-slate-200 shrink-0 w-full">
      {/* Editing Mode Banner */}
      {isEditing && (
        <div className="bg-amber-50 border-b border-amber-200 px-3 py-1 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="warning" className="inline-flex items-center gap-1.5 text-[10.5px] font-black text-amber-900 bg-amber-200/70 border border-amber-300 px-2 py-0.5 rounded uppercase tracking-wide">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse"></span>
              {t("stepper.editingAsset", { assetNo: displayAssetNo || "" })}
            </Badge>
          </div>
        </div>
      )}
      {/* Steps row */}
      <div className="px-3 py-1.5 overflow-x-auto">
        <div className="flex items-stretch min-w-max">
          {steps?.map((step, index) => {
            const isCurrent = step.id === currentStep;
            const isCompleted = completedSteps.includes(step.id);
            const StepIcon = step.icon;

            // Stepper style conditional based on state
            let stepBg = 'bg-white border-slate-200';
            let stepText = 'text-slate-700';
            let iconText = 'text-[#2563EB]';
            let numCircleBg = 'bg-slate-100 text-slate-600 border-slate-200';
            let subText = 'text-slate-400';

            if (isCurrent) {
              stepBg = 'bg-[#101b87] text-white shadow-sm border-[#101b87]';
              stepText = 'text-white';
              iconText = 'text-white';
              numCircleBg = 'bg-white text-[#101b87] border-white';
              subText = 'text-blue-100';
            } else if (isCompleted) {
              stepBg = 'bg-[#F0FDF4] border-green-200';
              stepText = 'text-green-800';
              iconText = 'text-green-600';
              numCircleBg = 'bg-green-500 text-white border-green-500';
              subText = 'text-green-500';
            } else {
              // In progress but not current, or pending
              const isPrior = step.id < currentStep;
              if (isPrior) {
                stepBg = 'bg-white border-[#2563EB]/40';
                stepText = 'text-slate-800';
                iconText = 'text-[#2563EB]';
                numCircleBg = 'bg-[#2563EB] text-white border-[#2563EB]';
                subText = 'text-[#2563EB]/80';
              }
            }

            return (
              <React.Fragment key={step.id}>
                <div
                  onClick={() => onStepClick?.(step.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 cursor-pointer rounded-lg border transition-all duration-200 flex-1 ${stepBg}`}
                  style={{ minWidth: 145 }}
                >
                  {/* Step number circle */}
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black shrink-0 border ${numCircleBg}`}
                  >
                    {isCompleted ? <Check className="w-3.5 h-3.5" /> : step.id}
                  </div>

                  {/* Step info */}
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1">
                      <StepIcon className={`w-3 h-3 shrink-0 ${iconText}`} />
                      <span className={`text-[10px] font-bold leading-tight whitespace-nowrap ${stepText}`}>
                        {step.title}
                      </span>
                    </div>
                    <span className={`text-[8.5px] leading-tight whitespace-nowrap ${subText}`}>
                      {step.subtitle}
                    </span>
                  </div>
                </div>

                {index < steps.length - 1 && (
                  <div className="flex items-center px-0.5 text-slate-300 shrink-0">
                    <svg width="5" height="8" viewBox="0 0 6 10" fill="none">
                      <path d="M1 1L5 5L1 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}