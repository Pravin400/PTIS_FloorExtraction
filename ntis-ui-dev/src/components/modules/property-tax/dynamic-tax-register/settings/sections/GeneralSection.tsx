import { useTranslations } from 'next-intl';
import { FileText, Settings, ListPlus } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { Card, Label, Input, Select, Badge, Button } from '@/components/common';
import { DynamicTaxRegisterRow, TaxCategoryOption } from '@/types/dynamic-tax-register.types';
import { sanitizeAlphanumericPunctuation, sanitizeMultilingualText } from '@/lib/utils/validation-rules';
import type { DynamicTaxGeneral } from '@/hooks/dynamic-tax-register/general/useDynamicTaxGeneral';
import { ConfigureButton } from '@/components/common/ActionButtons';
import { useAliasLabel } from '@/lib/providers/AliasLabelsProvider';

interface RuleSelectOption {
  value: string;
  label: string;
  ruleType: string;
  attachedReference: string | null;
}

export interface GeneralSectionProps {
  isNew: boolean;
  taxRow: DynamicTaxRegisterRow | null;
  ruleOptions: RuleSelectOption[];
  taxCategoryOptions: TaxCategoryOption[];
  general: DynamicTaxGeneral;
}

export function GeneralSection({ isNew, taxRow, ruleOptions, taxCategoryOptions, general }: GeneralSectionProps) {
  const t = useTranslations('dynamicTaxRegister');
  const assessmentStatusLabel = `${useAliasLabel('Assessment', t('aliasFallback.assessment'))} ${t('aliasFallback.statusSuffix')}`;
  const {
    status, assessmentStatus, setAssessmentStatus, oldTaxStatus, setOldTaxStatus,
    ruleDefinitionId, taxName, setTaxName, taxNameAlias, setTaxNameAlias, taxCode, setTaxCode, taxCategoryId, setTaxCategoryId,
    ruleLabel, handleRuleDefinitionChange, handleStatusChange, handleConfigureClick, handleManageRuleCategoryClick,
  } = general;
  const isTaxActive = status === 'active';

  const activeDeactiveOptions = [
    { label: t('general.activeOption'), value: 'active' },
    { label: t('general.deactiveOption'), value: 'deactive' },
  ];

  return (
    <div className="p-5 flex flex-col gap-4">
      <Card className="border border-slate-200 shadow-sm bg-white overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-100 bg-slate-50/60">
          <FileText className="w-3.5 h-3.5 text-blue-500" />
          <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">{t('general.identity')}</span>
        </div>
        {/* Tax Name and its alias are identical on both paths — only Tax Code differs (editable
            while creating, immutable afterwards), so just that one field branches. */}
        <div className="p-4 grid grid-cols-3 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">{t('general.taxName')} <span className="text-red-500">*</span></Label>
            <Input
              value={taxName}
              onChange={(e) => setTaxName(sanitizeMultilingualText(e.target.value, 200))}
              placeholder={t('general.taxNamePlaceholder')}
              className="h-9 text-sm"
              maxLength={200}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            {/* Optional regional-language name. Uses the multilingual sanitizer (not the ASCII-only
                one behind Tax Code) — holding a Marathi/Hindi name is the entire point of it. */}
            <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">{t('general.taxNameAlias')}</Label>
            <Input
              value={taxNameAlias}
              onChange={(e) => setTaxNameAlias(sanitizeMultilingualText(e.target.value, 200))}
              placeholder={t('general.taxNameAliasPlaceholder')}
              className="h-9 text-sm"
              maxLength={200}
            />
          </div>
          {isNew ? (
            <div className="flex flex-col gap-1.5">
              <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">{t('general.taxCode')} <span className="text-red-500">*</span></Label>
              <Input
                value={taxCode}
                onChange={(e) => setTaxCode(sanitizeAlphanumericPunctuation(e.target.value, 20).toUpperCase())}
                placeholder={t('general.taxCodePlaceholder')}
                className="h-9 text-sm font-mono"
                maxLength={20}
              />
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              {/* Tax Code stays read-only — it's an immutable identifier once the tax exists. */}
              <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">{t('general.taxCode')}</Label>
              <Input value={taxRow?.taxCode ?? ''} readOnly className="bg-slate-50 text-slate-500 h-9 text-sm font-mono cursor-not-allowed" />
            </div>
          )}
        </div>
      </Card>

      {isNew && (
        <Card className="border border-slate-200 shadow-sm bg-white">
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-100 bg-slate-50/60 rounded-t-lg">
            <FileText className="w-3.5 h-3.5 text-blue-500" />
            <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">{t('general.taxCategorySection')}</span>
          </div>
          <div className="p-4">
            <div className="flex flex-col gap-1.5 max-w-xs">
              <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">{t('general.category')} <span className="text-red-500">*</span></Label>
              <Select
                value={taxCategoryId}
                onChange={(_, v) => setTaxCategoryId(v)}
                options={taxCategoryOptions.map((o) => ({ label: o.label, value: String(o.value) }))}
              />
            </div>
          </div>
        </Card>
      )}

      <Card className="border border-slate-200 shadow-sm bg-white">
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-100 bg-slate-50/60 rounded-t-lg">
          <Settings className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">{t('general.statusFlags')}</span>
        </div>
        <div className="p-4 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">{t('general.status')}</Label>
            <div className="flex items-center gap-3">
              <div className="w-52">
                <Select
                  value={status}
                  onChange={(_, v) => handleStatusChange(v)}
                  options={activeDeactiveOptions}
                />
              </div>
              <div className="flex-1 text-[11px] text-slate-600 bg-slate-50 px-3 py-2 rounded border border-slate-100 font-medium min-h-[36px] flex items-center">
                {t(`general.statusInfo.${status}`)}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">{assessmentStatusLabel}</Label>
              <Select
                value={assessmentStatus}
                onChange={(_, v) => setAssessmentStatus(v)}
                options={activeDeactiveOptions}
                disabled={!isTaxActive}
              />
              <span
                className={cn(
                  'text-[11px] px-2.5 py-1.5 rounded border font-medium mt-0.5',
                  isTaxActive ? 'text-blue-600 bg-blue-50 border-blue-100' : 'text-slate-400 bg-slate-50 border-slate-100'
                )}
              >
                {isTaxActive ? t(`general.assessmentInfo.${assessmentStatus}`) : t('general.assessmentStatusLockedHint')}
              </span>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">{t('general.oldTaxStatus')}</Label>
              <Select
                value={oldTaxStatus}
                onChange={(_, v) => setOldTaxStatus(v)}
                options={activeDeactiveOptions}
              />
              <span className="text-[11px] text-slate-500 bg-slate-50 px-2.5 py-1.5 rounded border border-slate-100 font-medium mt-0.5">
                {t(`general.oldTaxInfo.${oldTaxStatus}`)}
              </span>
            </div>
          </div>
        </div>
      </Card>

      <Card className="border border-slate-200 shadow-sm bg-white">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 bg-slate-50/60 rounded-t-lg">
          <div className="flex items-center gap-2">
            <Settings className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">{t('general.ruleConfiguration')}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              icon={ListPlus}
              onClick={handleManageRuleCategoryClick}
              className="h-7 px-3 text-[11px] active:scale-95 transition-all"
            >
              {t('general.manageRuleCategory')}
            </Button>
            <ConfigureButton
              size="sm"
              disabled={isNew}
              title={isNew ? t('general.saveThisTaxFirst') : undefined}
              onClick={handleConfigureClick}
              className="h-7 px-3 text-[11px] active:scale-95 transition-all"
            />
          </div>
        </div>
        <div className="p-4 flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
              {t('general.ruleName')} {isNew && <span className="text-red-500">*</span>}
            </Label>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <Select
                  value={ruleDefinitionId}
                  onChange={(_, v) => handleRuleDefinitionChange(v)}
                  placeholder={t('general.selectARule')}
                  options={[{ label: t('general.selectARule'), value: '' }, ...ruleOptions]}
                />
              </div>
              <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 font-bold text-[10px] px-3 py-1 whitespace-nowrap">
                {ruleDefinitionId ? ruleLabel : t('general.pickARule')}
              </Badge>
            </div>
          </div>
          {taxRow?.ruleSummary && (
            <div className="text-[11px] text-slate-600 bg-slate-50 px-3 py-2 rounded border border-slate-100 font-medium">
              {taxRow.ruleSummary}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
