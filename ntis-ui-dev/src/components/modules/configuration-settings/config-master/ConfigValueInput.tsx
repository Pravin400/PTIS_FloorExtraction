'use client';

import { Input, Select, ToggleSwitch } from '@/components/common';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils/cn';
import type { ConfigItem } from '@/types/configMaster.types';
import { DateUtils } from '@/lib/utils/date-helpers';

interface ConfigValueInputProps {
  value: string;
  onChange: (value: string) => void;
  selectedKey?: ConfigItem | { controlType?: string; dataType?: string; options?: string[] };
  controlType?: string;
  dataType?: string;
  options?: string[];
  disabled?: boolean;
  error?: string;
  className?: string;
  inputRef?: React.RefObject<HTMLInputElement | null>;
}

export function ConfigValueInput({
  value,
  onChange,
  selectedKey,
  controlType: propControlType,
  dataType: propDataType,
  options: propOptions,
  disabled,
  error,
  className,
  inputRef,
}: ConfigValueInputProps) {
  const t = useTranslations('configMaster');
  
  const controlType = (propControlType || (selectedKey as { controlType?: string })?.controlType || '').toLowerCase();
  const dataType = (propDataType || (selectedKey as { dataType?: string })?.dataType || '').toLowerCase();
  const options = propOptions || (selectedKey as { options?: string[] })?.options || [];

  // 1. Toggle/Checkbox
  if (
    controlType === 'checkbox' ||
    controlType === 'toggle' ||
    dataType === 'boolean' ||
    dataType === 'bool'
  ) {
    const isChecked = value === 'true';
    return (
      <div className={cn("flex items-center gap-3 h-11 px-4 bg-slate-50 rounded-xl border border-slate-200", className)}>
        <ToggleSwitch
          checked={isChecked}
          onChange={(checked) => onChange(checked ? 'true' : 'false')}
          disabled={disabled}
          showPopup={false}
        />
        <span className="text-sm font-medium text-slate-600">
          {isChecked
            ? t('modals.departmentConfig.enabled')
            : t('modals.departmentConfig.disabled')}
        </span>
      </div>
    );
  }

  // 2. Dropdown
  if (controlType === 'dropdown' || controlType === 'select') {
    const selectOptions =
      options && options.length > 0
        ? options.map((o: string) => ({ value: o, label: o }))
        : [{ value: value || '', label: value || 'Select...' }];

    return (
      <Select
        value={value || ''}
        onChange={(_, val) => onChange(val)}
        options={selectOptions}
        disabled={disabled}
        className={cn("h-11 text-sm rounded-xl w-full cursor-pointer [&_button]:cursor-pointer", className)}
      />
    );
  }

  // 3. Calendar/Date
  const isDateTimeType = controlType === 'calendar' || controlType === 'date' || dataType === 'datetime' || dataType === 'date' || dataType === 'timestamp';
  if (isDateTimeType) {
    const isDateTime = dataType === 'datetime' || dataType === 'timestamp' || controlType === 'calendar';
    const currentYear = new Date().getFullYear();
    const formattedValue = DateUtils.formatForInput(value, isDateTime);

    return (
      <Input
        ref={inputRef}
        type={isDateTime ? 'datetime-local' : 'date'}
        min={isDateTime ? `${currentYear}-01-01T00:00` : `${currentYear}-01-01`}
        max={isDateTime ? '2100-12-31T23:59' : '2100-12-31'}
        value={formattedValue || value}
        onChange={(e) => {
          const val = e.target.value;
          onChange(val ? val.replace('T', ' ') : '');
        }}
        className={cn(error ? 'border-red-500' : '', className)}
        disabled={disabled}
      />
    );
  }

  // 4. Numeric: Integer vs Decimal vs Text
  const isIntegerType = controlType === 'number' || dataType === 'int' || dataType === 'integer';
  const isDecimalType = dataType === 'decimal' || dataType === 'float' || dataType === 'double' || dataType === 'number';

  return (
    <Input
      ref={inputRef}
      placeholder={t('modals.addValue.form.placeholders.value')}
      value={value}
      onChange={(e) => {
        let val = e.target.value;
        if (isIntegerType) {
          val = val.replace(/[^0-9]/g, '');
        } else if (isDecimalType) {
          val = val.replace(/[^0-9.]/g, '').replace(/(\..*?)\..*/g, '$1');
        }
        onChange(val);
      }}
      type={isIntegerType ? 'number' : isDecimalType ? 'number' : 'text'}
      min={isIntegerType ? 1 : isDecimalType ? 0.01 : undefined}
      step={isDecimalType ? 'any' : isIntegerType ? 1 : undefined}
      onKeyDown={(e) => {
        if (isIntegerType && /^[eE+\-.,]$/.test(e.key)) {
          e.preventDefault();
        }
        if (isDecimalType && /^[eE+\-]$/.test(e.key)) {
          e.preventDefault();
        }
      }}
      className={cn(error ? 'border-red-500' : '', className)}
      disabled={disabled}
      autoComplete="off"
    />
  );
}
