import { useTranslations } from 'next-intl';
import { Select, SearchSelect, Input, ApplyButton } from '@/components/common';
import { useAliasLabel } from '@/lib/providers/AliasLabelsProvider';
import { ResultMode, ResultBase } from '@/types/dynamic-tax-register.types';
import { clampResultValueInput } from '@/lib/utils/dynamic-tax-register/dynamicTaxFormatters';

interface RuleSelectOption {
  value: string;
  label: string;
  ruleType: string;
  attachedReference: string | null;
}

export interface MasterFilterBarProps {
  ruleOptions: RuleSelectOption[];
  ruleNameValue: string;
  onRuleNameChange: (value: string) => void;
  /**
   * Hide the Rule Name selector — the standalone Data tab's rule IS the tax's only
   * rule (already editable on the General tab), so showing it again here would just
   * duplicate that field. Hybrid's nested Data section keeps it: there it picks a
   * SEPARATE "Choose from List" rule independent of the tax's own linked rule.
   */
  showRuleName?: boolean;
  mstYearId: number;
  mstYearSelectOptions: { label: string; value: string }[];
  onMstYearChange: (v: string) => void;
  mstBulkMode: ResultMode;
  setMstBulkMode: (v: ResultMode) => void;
  mstBulkBase: ResultBase;
  setMstBulkBase: (v: ResultBase) => void;
  mstBulk: string;
  setMstBulk: (v: string) => void;
  mstBusy: boolean;
  handleMstBulkApply: () => void;
}

/**
 * Master/Data tab's toolbar — Rule Name (filtered to MASTER_BASED), Assessment Year,
 * and Bulk Result Mode/Base/Value/Apply, in one unified row. Shared verbatim by the
 * standalone Data tab and Hybrid's nested Data section — each passes its OWN
 * `ruleNameValue`/`onRuleNameChange` (never the tax's overall Rule Name for Hybrid,
 * or picking a master rule there would overwrite the tax's overall linked rule).
 */
export function MasterFilterBar({
  ruleOptions, ruleNameValue, onRuleNameChange, showRuleName = true, mstYearId, mstYearSelectOptions, onMstYearChange,
  mstBulkMode, setMstBulkMode, mstBulkBase, setMstBulkBase, mstBulk, setMstBulk, mstBusy, handleMstBulkApply,
}: MasterFilterBarProps) {
  const t = useTranslations('dynamicTaxRegister');
  const assessmentYearRangeLabel = `${useAliasLabel('Assessment', t('aliasFallback.assessment'))} ${t('aliasFallback.yearRangeSuffix')}`;
  return (
    <div className="grid grid-cols-2 gap-x-5 gap-y-3">
      {showRuleName && (
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">{t('master.ruleName')}</span>
          <SearchSelect
            value={ruleNameValue}
            onChange={(_, v) => onRuleNameChange(v)}
            placeholder={t('master.selectARule')}
            options={[{ label: t('master.selectARule'), value: '' }, ...ruleOptions.filter((o) => o.ruleType === 'MASTER_BASED')]}
          />
        </div>
      )}
      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">{assessmentYearRangeLabel}</span>
        <SearchSelect
          value={mstYearId ? String(mstYearId) : ''}
          onChange={(_, v) => onMstYearChange(v)}
          options={mstYearSelectOptions}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">{t('master.bulkResultMode')}</span>
        <Select
          value={mstBulkMode}
          // Reset bulk Result Base to NONE when leaving PERCENT so the (disabled) Base never keeps a stale value.
          onChange={(_, v) => {
            const mode = v as ResultMode;
            setMstBulkMode(mode);
            if (mode !== 'PERCENT') setMstBulkBase('NONE');
          }}
          options={[
            { label: 'FIXED', value: 'FIXED' },
            { label: 'PERCENT', value: 'PERCENT' },
          ]}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">{t('master.bulkResultBase')}</span>
        <Select
          // Non-percent modes have no base — show NONE regardless of the retained bulk base.
          value={mstBulkMode !== 'PERCENT' ? 'NONE' : mstBulkBase}
          onChange={(_, v) => setMstBulkBase(v as ResultBase)}
          options={[
            { label: 'NONE', value: 'NONE' },
            { label: 'RV', value: 'RV' },
            { label: 'ALV', value: 'ALV' },
          ]}
          // Result Base only applies to PERCENT results; disable it when bulk mode is FIXED.
          disabled={mstBulkMode !== 'PERCENT'}
        />
      </div>
      <div className="flex items-end gap-3">
        <div className="flex flex-col gap-1.5 flex-1">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">{t('master.bulkValue')}</span>
          <Input
            value={mstBulk}
            onChange={(e) => setMstBulk(clampResultValueInput(e.target.value, mstBulkMode))}
            type="number"
            min="0"
            placeholder={t('master.bulkValuePlaceholder')}
            className="h-9 text-sm font-bold"
          />
        </div>
        <ApplyButton label={t('master.bulkApply')} size="sm" disabled={mstBusy} onClick={handleMstBulkApply} className="self-end" />
      </div>
    </div>
  );
}
