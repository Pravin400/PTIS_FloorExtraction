'use client';

import React, { memo } from 'react';
import { ArrowLeftRight } from 'lucide-react';
import { Select, Input } from '@/components/common';

interface SplitPeriodTaxSectionProps {
  getLabel: (key: string, fallback: string) => string;
  evidenceDateOptions: { label: string; value: string }[];
  evidenceEndDateOptions: { label: string; value: string }[];
  selectedSplitStartsFromValue: string;
  onSplitHigherRateStartsFromChange: (val: string) => void;
  selectedSplitContinuesUpToValue: string;
  onSplitHigherRateContinuesUpToChange: (val: string) => void;
  duringPeriodMultiplier: number | string;
  onDuringPeriodMultiplierChange: (val: number | string) => void;
  afterPeriodMultiplier: number | string;
  onAfterPeriodMultiplierChange: (val: number | string) => void;
  isLoading: boolean;
  formErrors?: Record<string, string>;
}

export const SplitPeriodTaxSection: React.FC<SplitPeriodTaxSectionProps> = memo(({
  getLabel,
  evidenceDateOptions,
  evidenceEndDateOptions,
  selectedSplitStartsFromValue,
  onSplitHigherRateStartsFromChange,
  selectedSplitContinuesUpToValue,
  onSplitHigherRateContinuesUpToChange,
  duringPeriodMultiplier,
  onDuringPeriodMultiplierChange,
  afterPeriodMultiplier,
  onAfterPeriodMultiplierChange,
  isLoading,
  formErrors,
}) => {
  return (
    <div className="p-2.5 rounded-lg border border-purple-100 bg-purple-50/30 space-y-2 mt-1">
      <div className="flex items-center gap-1.5 text-purple-900">
        <ArrowLeftRight className="w-3.5 h-3.5 text-purple-700" />
        <h4 className="text-[11px] font-bold">{getLabel('splitPeriodTitle', 'Split-period tax multiplier')}</h4>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        <div>
          <Select
            label={getLabel('higherRateStartsFromLabel', 'Higher rate starts from')}
            required
            options={evidenceDateOptions}
            value={selectedSplitStartsFromValue}
            onChange={(_e, val) => onSplitHigherRateStartsFromChange(val)}
            disabled={isLoading}
            selectSize="sm"
            className="w-full text-xs bg-white"
          />
        </div>

        <div>
          <Select
            label={getLabel('higherRateContinuesUpToLabel', 'Higher rate continues up to')}
            required
            options={evidenceEndDateOptions}
            value={selectedSplitContinuesUpToValue}
            onChange={(_e, val) => onSplitHigherRateContinuesUpToChange(val)}
            disabled={isLoading}
            selectSize="sm"
            className="w-full text-xs bg-white"
          />
        </div>

        <div>
          <Input
            label={getLabel('duringPeriodLabel', 'During period')}
            required
            type="number"
            step="0.1"
            min={0.1}
            max={10}
            value={duringPeriodMultiplier}
            onChange={(e) => onDuringPeriodMultiplierChange(e.target.value === '' ? '' : Number(e.target.value))}
            error={formErrors?.duringPeriodMultiplier}
            className="w-full text-xs bg-white"
          />
        </div>

        <div>
          <Input
            label={getLabel('afterPeriodLabel', 'After period')}
            required
            type="number"
            step="0.1"
            min={0.1}
            max={10}
            value={afterPeriodMultiplier}
            onChange={(e) => onAfterPeriodMultiplierChange(e.target.value === '' ? '' : Number(e.target.value))}
            error={formErrors?.afterPeriodMultiplier}
            className="w-full text-xs bg-white"
          />
        </div>
      </div>

      <p className="text-[10px] text-purple-700/80 italic">
        {getLabel('splitExampleText', 'Example: CC - OC at 1.5x, then from OC onward at 1x')}
      </p>
    </div>
  );
});

SplitPeriodTaxSection.displayName = 'SplitPeriodTaxSection';
