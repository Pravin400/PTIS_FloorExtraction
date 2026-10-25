'use client';

import { useTranslations } from 'next-intl';
import { Input, ValidationMessage, Select } from '@/components/common';

/* ================= TYPES ================= */
import type { FloorRangeFieldsProps } from '@/types/floor.types';

/* ================= COMPONENT ================= */
/**
 * Range-specific form fields for FloorForm.
 * Handles: Range Start, Range End inputs, Flat Generation Type, Flat Generation Sequence + their validation messages.
 * Parent (FloorForm) owns state, validation logic, and submit handler.
 */
export function FloorRangeFields({
  formData,
  errors,
  showError,
  onChange,
  onBlur,
  groupOptions,
  onGroupChange,
  labels,
}: Readonly<FloorRangeFieldsProps>) {
  const t = useTranslations('floor.floor');

  return (
    <div className="rounded-xl border border-[#DCEAFF] bg-slate-50 p-5 space-y-4">
      <div>
        <Input
          label={labels?.rangeStart || String(t('form.range.start'))}
          type="number"
          min={1}
          max={999}
          required
          placeholder={labels?.rangeStartPlaceholder || String(t('form.range.startPlaceholder'))}
          value={formData.rangeFrom || ''}
          onChange={(e) => {
            const value = e.target.value;
            if (value.length <= 3) {
              onChange('rangeFrom', parseInt(value, 10) || 0);
            }
          }}
          onBlur={() => onBlur('rangeFrom')}
          fullWidth
          className="text-gray-700"
        />
        <ValidationMessage
          message={errors.rangeFrom}
          visible={showError('rangeFrom')}
        />
      </div>

      <div>
        <Input
          label={labels?.rangeEnd || String(t('form.range.end'))}
          type="number"
          min={1}
          max={999}
          required
          placeholder={labels?.rangeEndPlaceholder || String(t('form.range.endPlaceholder'))}
          value={formData.rangeTo || ''}
          onChange={(e) => {
            const value = e.target.value;
            if (value.length <= 3) {
              onChange('rangeTo', parseInt(value, 10) || 0);
            }
          }}
          onBlur={() => onBlur('rangeTo')}
          fullWidth
          className="text-gray-700"
        />
        <ValidationMessage
          message={errors.rangeTo}
          visible={showError('rangeTo')}
        />
      </div>


      <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg border border-blue-100">
        {t('form.rangeExample')}
      </div>

      <div>
        <Select
          name="fLatGenerationGroupId"
          label={labels?.flatGenerationGroup || "Flat Generation Type"}
          required
          placeholder={labels?.flatGenerationGroupPlaceholder || "Select Flat Generation Type"}
          value={formData.fLatGenerationGroupId ? String(formData.fLatGenerationGroupId) : ''}
          options={groupOptions || []}
          onChange={(_, val) => {
            onGroupChange?.(Number(val) || 0);
          }}
          onBlur={() => onBlur('fLatGenerationGroupId')}
        />
        <ValidationMessage
          message={errors.fLatGenerationGroupId}
          visible={showError('fLatGenerationGroupId')}
        />
      </div>

      <div>
        <Input
          name="fLatGenerationSeq"
          label={labels?.flatGenerationSeq || "Flat Generation Sequence"}
          required
          type="number"
          placeholder={labels?.flatGenerationSeqPlaceholder || "Enter sequence"}
          value={!formData.fLatGenerationSeq ? '' : formData.fLatGenerationSeq}
          onChange={(e) => onChange('fLatGenerationSeq', parseInt(e.target.value, 10) || 0)}
          onBlur={() => onBlur('fLatGenerationSeq')}
          disabled
          fullWidth
          min={1}
          step={1}
          className="text-gray-700 bg-gray-100 cursor-not-allowed"
        />
        <ValidationMessage
          message={errors.fLatGenerationSeq}
          visible={showError('fLatGenerationSeq')}
        />
      </div>
    </div>
  );
}
