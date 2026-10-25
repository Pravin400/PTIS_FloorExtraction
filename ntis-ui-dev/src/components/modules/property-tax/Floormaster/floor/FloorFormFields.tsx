'use client';

import { Input, Select, ValidationMessage } from '@/components/common';
import type { FloorFormModel } from '@/types/floor.types';
import type React from 'react';
import { FLOOR_CODE_MAX, DESCRIPTION_MAX } from './validation';

/* ================= TYPES ================= */
interface FloorFormFieldsProps {
  formData: FloorFormModel;
  errors: Partial<Record<keyof FloorFormModel, string>>;
  showError: (field: keyof FloorFormModel) => boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onGroupChange?: (groupId: number) => void;
  groupOptions?: { label: string; value: string }[];
  labels: {
    floorCode: string;
    floorCodePlaceholder: string;
    descriptionEnglish: string;
    descriptionEnglishPlaceholder: string;
    description: string;
    descriptionPlaceholder: string;
    sequenceNo: string;
    sequenceNoPlaceholder: string;
    flatGenerationGroup?: string;
    flatGenerationGroupPlaceholder?: string;
    flatGenerationSeq?: string;
    flatGenerationSeqPlaceholder?: string;
  };
  isEdit?: boolean;
}

/* ================= COMPONENT ================= */
/**
 * Extracted form field group for FloorForm.
 * Handles: Floor Code, Description (English), Description, Sequence No inputs + their validation messages.
 * Parent (FloorForm) owns state, validation logic, and submit handler.
 */
export function FloorFormFields({
  formData,
  errors,
  showError,
  onChange,
  onBlur,
  onGroupChange,
  groupOptions,
  labels,
  isEdit = false,
}: Readonly<FloorFormFieldsProps>) {
  return (
    <div className="rounded-xl border border-[#DCEAFF] bg-slate-50 p-5 space-y-4">
      <Input
        name="floorCode"
        label={labels.floorCode}
        required
        placeholder={labels.floorCodePlaceholder}
        value={formData.floorCode}
        onChange={onChange}
        onBlur={onBlur}
        fullWidth
        maxLength={FLOOR_CODE_MAX}
        className="text-gray-700"
      />
      <ValidationMessage
        message={errors.floorCode}
        visible={showError('floorCode')}
      />

      <Input
        name="descriptionEnglish"
        label={labels.descriptionEnglish}
        required
        placeholder={labels.descriptionEnglishPlaceholder}
        value={formData.descriptionEnglish ?? ''}
        onChange={onChange}
        onBlur={onBlur}
        fullWidth
        maxLength={DESCRIPTION_MAX}
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
        placeholder={labels.descriptionPlaceholder}
        value={formData.description}
        onChange={onChange}
        onBlur={onBlur}
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
        label={labels.sequenceNo}
        required
        type="number"
        placeholder={labels.sequenceNoPlaceholder}
        value={formData.sequenceNo === 0 ? '' : formData.sequenceNo}
        onChange={onChange}
        onBlur={onBlur}
        disabled={!isEdit}
        fullWidth
        min={1}
        max={999}
        step={1}
        className="text-gray-700"
        onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
          // Block minus, plus, decimal point, and e keys (only allow integers)
          if (e.key === '-' || e.key === '+' || e.key === 'e' || e.key === 'E' || e.key === '.') {
            e.preventDefault();
          }
        }}
      />
      <ValidationMessage
        message={errors.sequenceNo}
        visible={showError('sequenceNo')}
      />

      <Select
        name="fLatGenerationGroupId"
        label={labels.flatGenerationGroup || "Flat Generation Type"}
        required
        placeholder={labels.flatGenerationGroupPlaceholder || "Select Flat Generation Type"}
        value={formData.fLatGenerationGroupId ? String(formData.fLatGenerationGroupId) : ''}
        options={groupOptions || []}
        onChange={(_, val) => {
          onGroupChange?.(Number(val) || 0);
        }}
        onBlur={(e) => onBlur?.(e as unknown as React.FocusEvent<HTMLInputElement>)}
      />
      <ValidationMessage
        message={errors.fLatGenerationGroupId}
        visible={showError('fLatGenerationGroupId')}
      />

      <Input
        name="fLatGenerationSeq"
        label={labels.flatGenerationSeq || "Flat Generation Sequence"}
        required
        type="number"
        placeholder={labels.flatGenerationSeqPlaceholder || "Enter sequence"}
        value={!formData.fLatGenerationSeq ? '' : formData.fLatGenerationSeq}
        onChange={onChange}
        onBlur={onBlur}
        disabled
        fullWidth
        min={1}
        step={1}
        className="text-gray-700 bg-gray-50 cursor-not-allowed"
        onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
          if (e.key === '-' || e.key === '+' || e.key === 'e' || e.key === 'E' || e.key === '.') {
            e.preventDefault();
          }
        }}
      />
      <ValidationMessage
        message={errors.fLatGenerationSeq}
        visible={showError('fLatGenerationSeq')}
      />
    </div>
  );
}
