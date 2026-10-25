'use client';

import { FieldConfig } from '@/types/rule-engine';
import { MultiSelect } from '@/components/common/MultiSelect';

interface MultiSelectValueInputProps {
  config: FieldConfig;
  value: string | string[];
  onChange: (val: string | string[]) => void;
  disabled: boolean;
  apiLoading: boolean;
  effectiveOptions: { label: string; value: string }[];
  loadingPlaceholder: string;
  error?: string;
}

export default function MultiSelectValueInput({
  value,
  onChange,
  disabled,
  apiLoading,
  effectiveOptions,
  loadingPlaceholder,
  error,
}: MultiSelectValueInputProps) {
  const activeList = Array.isArray(value)
    ? value.map((v) => String(v))
    : (value !== undefined && value !== null && value !== '' ? [String(value)] : []);

  return (
    <div className="flex flex-col gap-1 w-full">
      <MultiSelect
        options={effectiveOptions}
        value={activeList}
        onChange={(selected) => onChange(selected)}
        placeholder={loadingPlaceholder}
        disabled={disabled || apiLoading}
        error={!!error}
      />
    </div>
  );
}
