import React from 'react';
import type { UnitGenerationFloorRangeFieldsProps } from '@/types/asset/floor-details.types';

function NativeSelect({
  name,
  value,
  onChange,
  options,
  placeholder,
  disabled = false,
  required = false,
  isLoading = false,
}: {
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: { label: string; value: string }[];
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  isLoading?: boolean;
}) {
  return (
    <div className="relative">
      <select
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled || isLoading}
        required={required}
        className="w-full appearance-none px-2 py-0.5 pr-7 text-[10px] font-semibold text-slate-900 border border-slate-200 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer h-[25px] disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
      >
        {placeholder && <option value="">{isLoading ? "Loading..." : placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </div>
    </div>
  );
}

function CompactInput({
  name,
  value,
  onChange,
  onKeyDown,
  onPaste,
  type = "text",
  placeholder = "",
  readOnly = false,
  maxLength,
  min,
  max,
  step,
  disabled = false,
}: {
  name: string;
  value: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onPaste?: (e: React.ClipboardEvent<HTMLInputElement>) => void;
  type?: string;
  placeholder?: string;
  readOnly?: boolean;
  maxLength?: number;
  min?: number | string;
  max?: number | string;
  step?: number | string;
  disabled?: boolean;
}) {
  return (
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      onKeyDown={onKeyDown}
      onPaste={onPaste}
      placeholder={placeholder}
      readOnly={readOnly}
      maxLength={maxLength}
      min={min}
      max={max}
      step={step}
      disabled={disabled}
      className="w-full px-2 py-0.5 text-[10px] font-semibold text-slate-900 border border-slate-200 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 h-[25px] read-only:bg-slate-50 read-only:text-slate-500 read-only:cursor-default disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
    />
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex-grow min-w-0 flex flex-col gap-0.5 w-full">
      <label className="text-[9.5px] font-bold text-slate-600">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

export function UnitGenerationFloorRangeFields({
  dropdownOptions,
  genType,
  setGenType,
  genFromFloor,
  setGenFromFloor,
  genToFloor,
  setGenToFloor,
  toFloorOptions,
  genCountPerFloor,
  setGenCountPerFloor,
  totalCount,
  TYPE_OPTIONS,
  t,
}: UnitGenerationFloorRangeFieldsProps) {
  return (
    <>
      <Field label={t('floorDetails.type')}>
        <NativeSelect
          name="genType"
          value={genType || ''}
          onChange={(e) => setGenType(e.target.value)}
          options={TYPE_OPTIONS}
          placeholder="--Select--"
        />
      </Field>
      <Field label={t('floorDetails.fromFloor') || 'From Floor'}>
        <NativeSelect
          name="genFromFloor"
          value={genFromFloor || ''}
          onChange={(e) => setGenFromFloor(e.target.value)}
          options={(dropdownOptions?.floorLevels || []).map((o: { label: string; value: string | number }) => ({
            label: o.label,
            value: String(o.value),
          }))}
          placeholder="--Select--"
        />
      </Field>
      <Field label={t('floorDetails.toFloor') || 'To Floor'}>
        <NativeSelect
          name="genToFloor"
          value={genToFloor || ''}
          onChange={(e) => setGenToFloor(e.target.value)}
          options={toFloorOptions}
          placeholder="--Select--"
        />
      </Field>
      <Field label={t('floorDetails.unitsPerFloor') || 'Units / Floor'}>
        <CompactInput
          name="genCountPerFloor"
          value={String(genCountPerFloor ?? '')}
          type="number"
          min={1}
          max={999}
          step={1}
          maxLength={3}
          onKeyDown={(e) => {
            // Disallow dot, comma, e, E, signs
            if (['.', ',', 'e', 'E', '+', '-'].includes(e.key)) {
              e.preventDefault();
              return;
            }
            if (
              !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter', 'ArrowUp', 'ArrowDown'].includes(e.key) &&
              !e.ctrlKey &&
              !e.metaKey
            ) {
              if (!/^[0-9]$/.test(e.key)) {
                e.preventDefault();
                return;
              }
              const currentVal = String(genCountPerFloor ?? '');
              const target = e.target as HTMLInputElement;
              const selectionLength = (target.selectionEnd ?? 0) - (target.selectionStart ?? 0);
              if (currentVal.length >= 3 && selectionLength === 0) {
                e.preventDefault();
              }
            }
          }}
          onPaste={(e) => {
            e.preventDefault();
            const paste = e.clipboardData.getData('text');
            const cleaned = paste.replace(/[^0-9]/g, '').slice(0, 3);
            if (cleaned === '') {
              setGenCountPerFloor('');
            } else {
              const num = Math.min(999, parseInt(cleaned, 10) || 0);
              setGenCountPerFloor(num > 0 ? num : '');
            }
          }}
          onChange={(e) => {
            const raw = e.target.value;
            const cleaned = raw.replace(/[^0-9]/g, '').slice(0, 3);
            if (cleaned === '') {
              setGenCountPerFloor('');
            } else {
              const num = Math.min(999, parseInt(cleaned, 10) || 0);
              setGenCountPerFloor(num > 0 ? num : '');
            }
          }}
        />
      </Field>
      <Field label={t('floorDetails.totalUnits') || 'Total Units'}>
        <CompactInput
          name="totalCount"
          value={String(totalCount || '')}
          readOnly
        />
      </Field>
    </>
  );
}
