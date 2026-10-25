'use client';

import { useTranslations } from 'next-intl';
import { Select, SearchSelect, Input, Label } from '@/components/common';
import { ResultBase, ResultMode } from '@/types/dynamic-tax-register.types';
import type { FieldConfig } from '@/types/rule-engine';
import { clampResultValueInput } from '@/lib/utils/dynamic-tax-register/dynamicTaxFormatters';

export interface ConditionEffectInputsProps {
  resultMode: ResultMode;
  resultBase: ResultBase;
  resultValue: number;
  /** Only meaningful when resultBase is 'OTHER_TAX'. */
  referenceTaxId: number | null;
  /** Only meaningful when resultMode is 'PER_UNIT'. */
  unitFieldId: string | null;
  /** Active taxes (excluding this row's own tax) selectable for 'OTHER_TAX'. A non-VALUE_BASED
   *  reference currently evaluates to 0 (see TaxConditionRuleService.EvaluateAsync) until the
   *  calculation engine wires up those modes. */
  taxOptions: { value: number; label: string }[];
  /** The same condition-field list the IF rows use — PER_UNIT picks its multiplier from it, so a
   *  field usable in a condition is usable as a multiplier. */
  fields: FieldConfig[];
  onChange: (patch: {
    resultMode?: ResultMode;
    resultBase?: ResultBase;
    resultValue?: number;
    referenceTaxId?: number | null;
    unitFieldId?: string | null;
  }) => void;
  readOnly?: boolean;
}

const RESULT_MODE_OPTIONS = [
  { label: 'Fixed', value: 'FIXED' },
  { label: 'Percent', value: 'PERCENT' },
  { label: 'Per Unit', value: 'PER_UNIT' },
];

const RESULT_BASE_OPTIONS = [
  { label: 'None', value: 'NONE' },
  { label: 'RV', value: 'RV' },
  { label: 'ALV', value: 'ALV' },
  { label: 'Other Tax', value: 'OTHER_TAX' },
];

/** ResultMode/ResultBase/ResultValue(/ReferenceTax) inputs — reused both inside a row's
 *  expanded editor and read-only inside the Test panel's matched-row display. */
export function ConditionEffectInputs({
  resultMode,
  resultBase,
  resultValue,
  referenceTaxId,
  unitFieldId,
  taxOptions,
  fields,
  onChange,
  readOnly,
}: ConditionEffectInputsProps) {
  const t = useTranslations('dynamicTaxRegister');
  const showReferenceTax = resultMode === 'PERCENT' && resultBase === 'OTHER_TAX';
  const showUnitField = resultMode === 'PER_UNIT';

  // Only numeric fields can be multiplied. The fallback matters: dataType is derived from
  // RulesField.FieldType (free text, unconstrained), so an environment using e.g. "Numeric"
  // instead of "INTEGER" maps everything to STRING — filtering strictly would leave the picker
  // mysteriously empty and PER_UNIT unusable. Better to show all fields than to show none.
  const numericFields = fields.filter((f) => f.dataType === 'INTEGER' || f.dataType === 'DECIMAL');
  const unitFieldChoices = numericFields.length > 0 ? numericFields : fields;
  const noNumericFieldsDetected = numericFields.length === 0 && fields.length > 0;
  // Returns bare grid items (no wrapping grid of its own) so the caller can lay these out
  // together with sibling fields (e.g. Assessment Year Range) in one shared grid — keeping
  // every field's label style, input height, and column edges consistent across the row.
  return (
    <>
      <div className="flex flex-col gap-1">
        <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">{t('master.columns.resultMode')}</Label>
        <Select
          options={RESULT_MODE_OPTIONS}
          value={resultMode}
          // Each mode owns a different extra field, so switching clears whatever belonged to the
          // previous one — otherwise a hidden, stale value would still be saved (and would make
          // this row's duplicate signature differ from an identical-looking one).
          onChange={(_, v) => {
            const mode = v as ResultMode;
            onChange({
              resultMode: mode,
              ...(mode !== 'PERCENT' ? { resultBase: 'NONE' as ResultBase, referenceTaxId: null } : {}),
              ...(mode !== 'PER_UNIT' ? { unitFieldId: null } : {}),
            });
          }}
          disabled={readOnly}
          selectSize="sm"
        />
      </div>
      <div className="flex flex-col gap-1">
        <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">{t('master.columns.resultBase')}</Label>
        <Select
          options={RESULT_BASE_OPTIONS}
          // Non-percent modes have no base — show NONE even for legacy rows stored with a base.
          value={resultMode !== 'PERCENT' ? 'NONE' : resultBase}
          onChange={(_, v) => {
            const base = v as ResultBase;
            onChange(base !== 'OTHER_TAX' ? { resultBase: base, referenceTaxId: null } : { resultBase: base });
          }}
          disabled={readOnly || resultMode !== 'PERCENT'}
          selectSize="sm"
        />
      </div>
      {showReferenceTax && (
        <div className="flex flex-col gap-1">
          <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
            {t('condition.referenceTax')}
          </Label>
          <SearchSelect
            options={taxOptions.map((o) => ({ label: o.label, value: String(o.value) }))}
            value={referenceTaxId != null ? String(referenceTaxId) : ''}
            onChange={(_, v) => onChange({ referenceTaxId: v ? Number(v) : null })}
            disabled={readOnly}
          />
        </div>
      )}
      <div className="flex flex-col gap-1">
        <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">{t('master.columns.resultValue')}</Label>
        <Input
          value={String(resultValue)}
          onChange={(e) => onChange({ resultValue: Number(clampResultValueInput(e.target.value, resultMode)) || 0 })}
          disabled={readOnly}
          className="h-9 text-xs"
          type="number"
          min="0"
          max={resultMode === 'PER_UNIT' ? '99999' : '999'}
        />
      </div>
      {showUnitField && (
        // col-span-full because field names like "No Of Residential Toilets" need more room than
        // a single grid cell, and this is always the last field rendered in the row.
        <div className="flex flex-col gap-1 col-span-full">
          <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
            {t('condition.multiplyBy')}
          </Label>
          <SearchSelect
            options={[
              { label: t('condition.selectUnitField'), value: '' },
              ...unitFieldChoices.map((f) => ({ label: f.fieldName || f.fieldId, value: f.fieldId })),
            ]}
            value={unitFieldId ?? ''}
            onChange={(_, v) => onChange({ unitFieldId: v || null })}
            disabled={readOnly}
          />
          <span className="text-[10px] text-slate-500">
            {noNumericFieldsDetected
              ? t('condition.multiplyByNoNumericHint')
              : t('condition.multiplyByHint', { value: resultValue })}
          </span>
        </div>
      )}
    </>
  );
}
