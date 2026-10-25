'use client';

import React, { memo } from 'react';
import type { EvidenceItemCode } from '@/types/retrospective-rule.types';

interface ActionsRuleSummaryProps {
  t: (key: string, values?: Record<string, string>) => string;
  availableEvidence: EvidenceItemCode[];
  compareEvidenceDates: string;
  isSplitMultiplier: boolean;
  splitHigherRateStartsFrom: string;
  splitHigherRateContinuesUpTo: string;
  duringPeriodMultiplier: number | string;
  afterPeriodMultiplier: number | string;
  maximumYears: number | string;
  taxMultiplier: number | string;
  isAuthorized: boolean;
}

export const ActionsRuleSummary: React.FC<ActionsRuleSummaryProps> = memo(({
  t,
  availableEvidence,
  compareEvidenceDates,
  isSplitMultiplier,
  splitHigherRateStartsFrom,
  splitHigherRateContinuesUpTo,
  duringPeriodMultiplier,
  afterPeriodMultiplier,
  maximumYears,
  taxMultiplier,
  isAuthorized,
}) => {
  return (
    <div className="p-2.5 rounded-lg border border-gray-200/90 bg-gradient-to-r from-gray-50/50 via-white to-gray-50/30 space-y-2 shadow-2xs">
      <h3 className="text-[11px] font-bold text-gray-900 flex items-center gap-1.5">
        <span>📋</span>
        <span>{t('summaryTitle')}</span>
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[11px] pt-0.5">
        <div className="flex items-center gap-2 min-w-0 p-1.5 rounded-md bg-emerald-50/50 border border-emerald-100/80">
          <span className="font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded text-[10px] shrink-0 uppercase tracking-wide">
            {t('summaryWhen')}
          </span>
          <span
            className="text-gray-800 font-semibold truncate"
            title={t('summaryAvailable', {
              evidence: availableEvidence.length > 0 ? availableEvidence.join(', ') : 'None',
              compareDate: compareEvidenceDates || 'No date comparison',
            })}
          >
            {t('summaryAvailable', {
              evidence: availableEvidence.length > 0 ? availableEvidence.join(', ') : 'None',
              compareDate: compareEvidenceDates || 'No date comparison',
            })}
          </span>
        </div>

        <div className="flex items-center gap-2 min-w-0 p-1.5 rounded-md bg-sky-50/50 border border-sky-100/80">
          <span className="font-bold text-sky-800 bg-sky-100 px-1.5 py-0.5 rounded text-[10px] shrink-0 uppercase tracking-wide">
            {t('summaryTax')}
          </span>
          <span
            className="text-gray-800 font-semibold truncate"
            title={
              isSplitMultiplier
                ? `Split period: ${splitHigherRateStartsFrom} to ${splitHigherRateContinuesUpTo} at ${duringPeriodMultiplier}x, then ${afterPeriodMultiplier}x`
                : t('summaryTaxDetail', {
                    years: String(maximumYears || '6'),
                    multiplier: String(taxMultiplier || '1'),
                  })
            }
          >
            {isSplitMultiplier
              ? `Split period: ${splitHigherRateStartsFrom} to ${splitHigherRateContinuesUpTo} at ${duringPeriodMultiplier}x, then ${afterPeriodMultiplier}x`
              : t('summaryTaxDetail', {
                  years: String(maximumYears || '6'),
                  multiplier: String(taxMultiplier || '1'),
                })}
          </span>
        </div>

        <div className="flex items-center gap-2 min-w-0 p-1.5 rounded-md bg-amber-50/50 border border-amber-100/80">
          <span className="font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded text-[10px] shrink-0 uppercase tracking-wide">
            {t('summaryPenalty')}
          </span>
          <span
            className="text-gray-800 font-semibold truncate"
            title={isAuthorized ? t('summaryNotApplicable') : t('summaryApplyPenalty')}
          >
            {isAuthorized ? t('summaryNotApplicable') : t('summaryApplyPenalty')}
          </span>
        </div>
      </div>
    </div>
  );
});

ActionsRuleSummary.displayName = 'ActionsRuleSummary';
