'use client';

import { FieldConfig } from '@/types/rule-engine';
import { SearchSelect } from '@/components/common';

interface DropdownValueInputProps {
  config: FieldConfig;
  value: string;
  onChange: (val: string) => void;
  disabled: boolean;
  apiLoading: boolean;
  effectiveOptions: { label: string; value: string }[];
  loadingPlaceholder: string;
  error?: string;
}

export default function DropdownValueInput({
  value,
  onChange,
  disabled,
  apiLoading,
  effectiveOptions,
  loadingPlaceholder,
  error,
}: DropdownValueInputProps) {
  const safeValue = value !== undefined && value !== null ? String(value) : '';

  return (
    <div className="flex flex-col gap-1 w-full">
      <SearchSelect
        options={effectiveOptions}
        value={safeValue}
        onChange={(_, val) => onChange(val)}
        placeholder={loadingPlaceholder}
        disabled={disabled || apiLoading}
        isLoading={apiLoading}
        error={error}
      />
    </div>
  );
}
