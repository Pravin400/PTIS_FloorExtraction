'use client';
/* eslint-disable i18next/no-literal-string */

import React, { memo } from 'react';
import { useTranslations } from 'next-intl';
import { IndianRupee, Loader2 } from 'lucide-react';
import { SaveButton, Badge } from '@/components/common';
import { useTaxationModes } from '@/hooks/retrospective-rule-library/useTaxationModes';

import type { InitialTaxationData } from '@/types/retrospective-rule.types';

interface TaxationSectionProps {
  taxationRate: string;
  onTaxationRateChange: (rate: string) => void;
  taxPercentage: string;
  onTaxPercentageChange: (pct: string) => void;
  onSaveTaxation?: () => void;
  mode?: 'create' | 'edit';
  initialData?: InitialTaxationData;
}

export const TaxationSection: React.FC<TaxationSectionProps> = memo(({
  taxationRate,
  onTaxationRateChange,
  taxPercentage,
  onTaxPercentageChange,
  onSaveTaxation,
  mode = 'create',
  initialData,
}) => {
  const t = useTranslations('retrospectiveRuleLibrary.builder.taxation');
  const { rateModes, percentageModes, activePolicy, isConfigured, isLoading, error } = useTaxationModes({
    initialRateModes: initialData?.rateModes,
    initialPercentageModes: initialData?.percentageModes,
    initialActivePolicy: initialData?.activePolicy,
  });
  const isEditMode = mode === 'edit' || isConfigured;

  // Auto-populate parent state from active backend policy if available
  React.useEffect(() => {
    if (activePolicy) {
      if (activePolicy.rateMode && !taxationRate) {
        onTaxationRateChange(activePolicy.rateMode);
      }
      if (activePolicy.percentageMode && !taxPercentage) {
        onTaxPercentageChange(activePolicy.percentageMode);
      }
    }
  }, [activePolicy, taxationRate, taxPercentage, onTaxationRateChange, onTaxPercentageChange]);

  // Resolve rate value matching code or label or fallback to active policy or props
  const selectedRateValue = React.useMemo(() => {
    const rawVal = taxationRate || activePolicy?.rateMode || '';
    if (!rateModes || rateModes.length === 0) return rawVal;
    const match = rateModes.find((m) => m.code === rawVal || m.label === rawVal);
    return match ? match.code : rawVal;
  }, [rateModes, taxationRate, activePolicy]);

  // Resolve percentage value matching code or label or fallback to active policy or props
  const selectedPercentageValue = React.useMemo(() => {
    const rawVal = taxPercentage || activePolicy?.percentageMode || '';
    if (!percentageModes || percentageModes.length === 0) return rawVal;
    const match = percentageModes.find((m) => m.code === rawVal || m.label === rawVal);
    return match ? match.code : rawVal;
  }, [percentageModes, taxPercentage, activePolicy]);

  return (
    <section id="section-taxation" className="bg-white rounded-xl border border-gray-200/90 shadow-2xs overflow-hidden">
      <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-100">
            <IndianRupee className="w-3.5 h-3.5 stroke-[2]" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-gray-900 flex items-center gap-2">
              <span>{t('title')}</span>
              {isLoading && <Loader2 className="w-3 h-3 animate-spin text-amber-600" />}
            </h2>
            <p className="text-[11px] text-gray-500">{t('subtitle')}</p>
          </div>
        </div>
        {isConfigured ? (
          <Badge variant="success" size="sm">
            {t('configured')}
          </Badge>
        ) : (
          <Badge variant="warning" size="sm">
            Not Configured
          </Badge>
        )}
      </div>

      <div className="p-3">
        {error && (
          <div className="mb-2 text-[11px] font-medium text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
            ⚠️ {error}
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-end justify-between gap-3">
          <div className="flex-1 w-full">
            <label className="block text-[11px] font-bold text-gray-700 mb-1">{t('rateLabel')}</label>
            <select
              value={selectedRateValue}
              onChange={(e) => onTaxationRateChange(e.target.value)}
              disabled={isLoading || isConfigured}
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-xs font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#6B1F38]/20 focus:border-[#6B1F38] disabled:cursor-not-allowed disabled:bg-gray-100/80 disabled:text-gray-900 disabled:border-gray-300"
            >
              <option value="">Select...</option>
              {rateModes.map((modeItem) => (
                <option key={modeItem.code} value={modeItem.code}>
                  {modeItem.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1 w-full">
            <label className="block text-[11px] font-bold text-gray-700 mb-1">{t('percentageLabel')}</label>
            <select
              value={selectedPercentageValue}
              onChange={(e) => onTaxPercentageChange(e.target.value)}
              disabled={isLoading || isConfigured}
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-xs font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#6B1F38]/20 focus:border-[#6B1F38] disabled:cursor-not-allowed disabled:bg-gray-100/80 disabled:text-gray-900 disabled:border-gray-300"
            >
              <option value="">Select...</option>
              {percentageModes.map((modeItem) => (
                <option key={modeItem.code} value={modeItem.code}>
                  {modeItem.label}
                </option>
              ))}
            </select>
          </div>

          <div className="shrink-0">
            <SaveButton
              onClick={onSaveTaxation}
              disabled={isLoading || isConfigured}
              label={isEditMode ? t('updateTaxation') : t('saveButton')}
              size="sm"
              className="bg-[#047857] hover:bg-[#0369a1] text-white px-4 py-1.5 rounded-lg text-xs font-semibold shadow-xs h-[34px] disabled:bg-emerald-600/60 disabled:text-white disabled:cursor-not-allowed disabled:opacity-90"
            />
          </div>
        </div>
      </div>
    </section>
  );
});

TaxationSection.displayName = 'TaxationSection';
