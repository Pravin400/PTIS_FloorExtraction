'use client';

import React, { memo } from 'react';
import { useTranslations } from 'next-intl';
import {
  Clover,
  Check,
  Building2,
  Zap as Bolt,
  Grid,
  Calendar,
  FileText,
  Lightbulb,
  Lock,
} from 'lucide-react';
import type { EvidenceItemCode, RuleComparatorCodeItem } from '@/types/retrospective-rule.types';

import { Select } from '@/components/common';
import { useRuleEvidenceState } from '@/hooks/retrospective-rule-library/useRuleEvidenceState';
import { useRuleComparatorCodes } from '@/hooks/retrospective-rule-library/useRuleComparatorCodes';

interface ConditionsSectionProps {
  ruleName: string;
  onRuleNameChange: (name: string) => void;
  availableEvidence: EvidenceItemCode[];
  unavailableEvidence: EvidenceItemCode[];
  onToggleAvailable: (item: EvidenceItemCode) => void;
  onToggleUnavailable: (item: EvidenceItemCode) => void;
  compareEvidenceDates: string;
  onCompareDatesChange: (dates: string) => void;
  isAuthorized: boolean;
  formError?: string;
  compareDatesError?: string;
  initialComparatorCodes?: RuleComparatorCodeItem[];
}

const getEvidenceIcon = (code: string) => {
  const normalized = code.toUpperCase();
  if (normalized === 'OC') return <FileText className="w-3.5 h-3.5 text-gray-700" />;
  if (normalized === 'CC') return <Building2 className="w-3.5 h-3.5 text-gray-700" />;
  if (normalized.includes('ELECTRI')) return <Bolt className="w-3.5 h-3.5 text-gray-700" />;
  if (normalized.includes('CHANGE')) return <Grid className="w-3.5 h-3.5 text-gray-700" />;
  if (normalized.includes('CONSTRUCT') || normalized.includes('YEAR')) return <Calendar className="w-3.5 h-3.5 text-gray-700" />;
  return <FileText className="w-3.5 h-3.5 text-gray-700" />;
};

export const ConditionsSection: React.FC<ConditionsSectionProps> = memo(({
  ruleName,
  onRuleNameChange,
  availableEvidence,
  unavailableEvidence,
  onToggleAvailable,
  onToggleUnavailable,
  compareEvidenceDates,
  onCompareDatesChange,
  isAuthorized,
  formError,
  compareDatesError,
  initialComparatorCodes,
}) => {
  const t = useTranslations('retrospectiveRuleLibrary.builder.conditions');
  const { evidenceItems } = useRuleEvidenceState('1');
  const { comparatorCodes, isLoading: isComparatorLoading } = useRuleComparatorCodes({
    initialComparatorCodes,
  });

  const displayList = React.useMemo(() => {
    return (evidenceItems || []).map((item) => ({
      code: item.evidenceCode as EvidenceItemCode,
      label: item.evidenceName,
    }));
  }, [evidenceItems]);

  const selectedCompareValue = React.useMemo(() => {
    if (!comparatorCodes || comparatorCodes.length === 0) return compareEvidenceDates;
    const match = comparatorCodes.find(
      (c) => c.code === compareEvidenceDates || c.label === compareEvidenceDates
    );
    return match ? match.code : compareEvidenceDates || '';
  }, [comparatorCodes, compareEvidenceDates]);

  const comparatorOptions = React.useMemo(() => {
    const opts = comparatorCodes.map((item) => ({
      label: item.label,
      value: item.code,
    }));
    if (selectedCompareValue && !opts.some((o) => o.value === selectedCompareValue)) {
      opts.push({ label: selectedCompareValue, value: selectedCompareValue });
    }
    return [{ label: 'Select...', value: '' }, ...opts];
  }, [comparatorCodes, selectedCompareValue]);

  const isItemChecked = (itemCode: string, list: EvidenceItemCode[]) => {
    const norm = itemCode.toUpperCase().replace(/[\s_]+/g, '');
    return list.some((i) => {
      const s = String(i).toUpperCase().replace(/[\s_]+/g, '');
      return s === norm;
    });
  };

  return (
    <section id="section-conditions" className="bg-white rounded-xl border border-gray-200/90 shadow-2xs flex flex-col flex-1 h-full">
      <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100">
            <Clover className="w-3.5 h-3.5 stroke-[2]" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-gray-900">{t('title')}</h2>
            <p className="text-[11px] text-gray-500">{t('subtitle')}</p>
          </div>
        </div>
        <span className="px-2.5 py-0.5 bg-sky-100/80 text-sky-800 border border-sky-200/60 rounded text-[11px] font-bold tracking-wider">
          {t('badge')}
        </span>
      </div>

      <div className="p-2.5 space-y-2 flex flex-col">
        <div>
          <label className="block text-[11px] font-bold text-gray-700 mb-0.5">
            ✏ {t('ruleNameLabel')} <span className="text-rose-500 font-bold">*</span>
          </label>
          <input
            type="text"
            value={ruleName}
            onChange={(e) => onRuleNameChange(e.target.value)}
            placeholder={t('ruleNamePlaceholder')}
            className="w-full bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-xs font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#6B1F38]/20 focus:border-[#6B1F38]"
          />
          {formError && <p className="text-[11px] text-rose-500 mt-0.5 font-medium">{formError}</p>}
        </div>

        <div className="p-2 bg-amber-50/60 border border-amber-200/60 rounded-lg flex items-start gap-2 text-[11px] text-gray-700">
          <Lightbulb className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-gray-900">{t('evidenceStateHeader')} </span>
            <span>{t('evidenceStateHelp')}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Available Evidence Card */}
          <div className="rounded-lg border border-emerald-200 bg-emerald-50/20 p-2.5 space-y-2">
            <div className="flex items-center justify-between border-b border-emerald-100 pb-1.5">
              <div className="flex items-center gap-1.5 text-emerald-800 text-[11px] font-bold">
                <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                <span>{t('availableEvidence')}</span>
              </div>
              <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[10px] font-bold">
                {t('selectedCount', { count: availableEvidence.length })}
              </span>
            </div>
            <p className="text-[10px] text-gray-500">{t('availableHelp')}</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-0.5">
              {displayList.map((item) => {
                const isChecked = isItemChecked(item.code, availableEvidence);
                return (
                  <button
                    key={`avail-${item.code}`}
                    type="button"
                    onClick={() => onToggleAvailable(item.code)}
                    className={`flex items-center justify-between p-1.5 px-2 rounded-lg border text-[11px] font-semibold transition-all cursor-pointer ${isChecked
                        ? 'bg-emerald-100/70 border-emerald-400 text-emerald-900 shadow-2xs'
                        : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                      }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => { }}
                        className="rounded text-emerald-600 focus:ring-emerald-500 w-3 h-3"
                      />
                      {getEvidenceIcon(item.code)}
                      <span>{item.label}</span>
                    </div>
                    {isChecked && <Check className="w-3 h-3 text-emerald-700 stroke-[3]" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Unavailable Evidence Card */}
          <div className="rounded-lg border border-rose-200 bg-rose-50/20 p-2.5 space-y-2">
            <div className="flex items-center justify-between border-b border-rose-100 pb-1.5">
              <div className="flex items-center gap-1.5 text-rose-800 text-[11px] font-bold">
                <span className="w-3 h-0.5 bg-rose-600 inline-block" />
                <span>{t('unavailableEvidence')}</span>
              </div>
              <span className="px-1.5 py-0.5 bg-rose-100 text-rose-800 rounded text-[10px] font-bold">
                {t('selectedCount', { count: unavailableEvidence.length })}
              </span>
            </div>
            <p className="text-[10px] text-gray-500">{t('unavailableHelp')}</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-0.5">
              {displayList.map((item) => {
                const isChecked = isItemChecked(item.code, unavailableEvidence);
                return (
                  <button
                    key={`unavail-${item.code}`}
                    type="button"
                    onClick={() => onToggleUnavailable(item.code)}
                    className={`flex items-center justify-between p-1.5 px-2 rounded-lg border text-[11px] font-semibold transition-all cursor-pointer ${isChecked
                        ? 'bg-rose-100/70 border-rose-400 text-rose-900 shadow-2xs'
                        : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                      }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => { }}
                        className="rounded text-rose-600 focus:ring-rose-500 w-3 h-3"
                      />
                      {getEvidenceIcon(item.code)}
                      <span>{item.label}</span>
                    </div>
                    {isChecked && <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="text-[10px] text-gray-400 flex items-center gap-1">
          <Lock className="w-3 h-3 text-gray-400" />
          <span>{t('mutuallyExclusiveNotice')}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-end">
          <div>
            <Select
              label={`📅 ${t('compareDatesLabel')}`}
              required
              options={comparatorOptions}
              value={selectedCompareValue}
              onChange={(_e, val) => onCompareDatesChange(val)}
              disabled={isComparatorLoading}
              error={compareDatesError}
              selectSize="sm"
              className="w-full text-xs"
            />
          </div>

          <div
            className={`h-10 px-3 border rounded-lg flex items-center justify-between ${isAuthorized
                ? 'bg-emerald-50/60 border-emerald-200/70'
                : 'bg-rose-50/60 border-rose-200/70'
              }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${isAuthorized ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}
              >
                <Building2 className="w-3.5 h-3.5" />
              </div>
              <div className="truncate">
                <h4 className="text-[11px] font-bold text-gray-900 leading-tight">
                  {isAuthorized ? t('authorizedConstruction') : t('unauthorizedConstruction')}
                </h4>
                <p className="text-[10px] text-gray-500 leading-tight truncate">
                  {isAuthorized ? t('authorizedDescription') : t('unauthorizedDescription')}
                </p>
              </div>
            </div>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold shrink-0 ml-2 ${isAuthorized
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-100 text-rose-800 border border-rose-200'
                }`}
            >
              {isAuthorized ? t('authorizedBadge') : t('unauthorizedBadge')}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
});

ConditionsSection.displayName = 'ConditionsSection';
