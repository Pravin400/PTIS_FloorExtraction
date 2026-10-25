'use client';

import { useTranslations } from 'next-intl';
import { FieldConfig } from '@/types/rule-engine';
import { RadioGroup, RadioGroupItem } from '@/components/common';

interface RadioValueInputProps {
  config: FieldConfig;
  value: string;
  onChange: (val: string) => void;
  disabled: boolean;
  apiLoading: boolean;
  effectiveOptions: { label: string; value: string }[];
  error?: string;
}

export default function RadioValueInput({
  config,
  value,
  onChange,
  disabled,
  apiLoading,
  effectiveOptions,
  error,
}: RadioValueInputProps) {
  const t = useTranslations('ruleEngine');

  return (
    <div className="flex flex-col gap-2 py-1">
      <RadioGroup
        value={value}
        onValueChange={(val) => onChange(val)}
        disabled={disabled || apiLoading}
        className="flex flex-row flex-wrap gap-4"
      >
        {effectiveOptions.map((opt) => (
          <div key={opt.value} className="flex items-center gap-2">
            <RadioGroupItem value={opt.value} id={`radio-${config.fieldId}-${opt.value}`} />
            <label
              htmlFor={`radio-${config.fieldId}-${opt.value}`}
              className="text-sm font-medium text-gray-700 cursor-pointer"
            >
              {opt.label}
            </label>
          </div>
        ))}
      </RadioGroup>
      {apiLoading && <span className="text-xs text-blue-500 font-medium">{t('valueInput.loadingOptions')}</span>}
      {error && <span className="text-xs text-red-500 font-medium">{error}</span>}
    </div>
  );
}
