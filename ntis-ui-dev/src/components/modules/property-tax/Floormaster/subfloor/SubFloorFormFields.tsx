'use client';

import { Input, ValidationMessage } from '@/components/common';
import type { SubFloorFormModel } from '@/types/floor.types';
import type React from 'react';
import { SUBFLOOR_CODE_MAX, DESCRIPTION_MAX, DESCRIPTION_ENGLISH_MAX } from './validation';

/* ================= TYPES ================= */
interface SubFloorFormFieldsProps {
  formData: SubFloorFormModel;
  errors: Partial<Record<keyof SubFloorFormModel, string>>;
  showError: (field: keyof SubFloorFormModel) => boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur: (e: React.FocusEvent<HTMLInputElement>) => void;
  labels: {
    code: string;
    codePlaceholder: string;
    descriptionEnglish: string;
    descriptionEnglishPlaceholder: string;
    description: string;
    descriptionPlaceholder: string;
    sequenceNo: string;
    sequenceNoPlaceholder: string;
  };
  isEdit?: boolean;
}

/* ================= COMPONENT ================= */
/**
 * Extracted form field group for SubFloorForm.
 * Handles: SubFloor Code, Description (English), Description inputs + their validation messages.
 * Parent (SubFloorForm) owns state, validation logic, and submit handler.
 */
export function SubFloorFormFields({
  formData,
  errors,
  showError,
  onChange,
  onBlur,
  labels,
  isEdit = false,
}: Readonly<SubFloorFormFieldsProps>) {
  return (
    <div className="rounded-xl border border-[#DCEAFF] bg-slate-50 p-5 space-y-4">
      <Input
        name="subFloorCode"
        label={labels.code}
        required
        value={formData.subFloorCode}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={labels.codePlaceholder}
        fullWidth
        maxLength={SUBFLOOR_CODE_MAX}
        className="text-gray-700"
      />
      <ValidationMessage
        message={errors.subFloorCode}
        visible={showError('subFloorCode')}
      />

      <Input
        name="descriptionEnglish"
        label={labels.descriptionEnglish}
        required
        value={formData.descriptionEnglish ?? ''}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={labels.descriptionEnglishPlaceholder}
        fullWidth
        maxLength={DESCRIPTION_ENGLISH_MAX}
        className="text-gray-700"
      />
      <ValidationMessage
        message={errors.descriptionEnglish}
        visible={showError('descriptionEnglish')}
      />

      <Input
        name="description"
        label={labels.description}
        required
        value={formData.description}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={labels.descriptionPlaceholder}
        fullWidth
        maxLength={DESCRIPTION_MAX}
        className="text-gray-700"
      />
      <ValidationMessage
        message={errors.description}
        visible={showError('description')}
      />

      <Input
        name="sequenceNo"
        type="number"
        label={labels.sequenceNo}
        required
        value={formData.sequenceNo ?? ''}
        onChange={onChange}
        onBlur={onBlur}
        disabled={!isEdit}
        placeholder={labels.sequenceNoPlaceholder}
        fullWidth
        className="text-gray-700"
      />
      <ValidationMessage
        message={errors.sequenceNo}
        visible={showError('sequenceNo')}
      />
    </div>
  );
}
