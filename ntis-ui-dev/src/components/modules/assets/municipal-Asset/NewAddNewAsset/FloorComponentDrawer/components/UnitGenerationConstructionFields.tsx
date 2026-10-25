'use client';
import React from 'react';
import { Plus, Loader2 } from 'lucide-react';
import type { UnitGenerationConstructionFieldsProps } from '@/types/asset/floor-details.types';

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
  type = "text",
  placeholder = "",
  readOnly = false,
  maxLength,
  disabled = false,
}: {
  name: string;
  value: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  placeholder?: string;
  readOnly?: boolean;
  maxLength?: number;
  disabled?: boolean;
}) {
  return (
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      readOnly={readOnly}
      maxLength={maxLength}
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

export function UnitGenerationConstructionFields({
  dropdownOptions,
  genConYear,
  setGenConYear,
  genConType,
  setGenConType,
  genUseType,
  setGenUseType,
  genSubUseType,
  setGenSubUseType,
  dynamicSubUseTypes = [],
  isSubUseTypesLoading = false,
  isGenerating,
  isGenerateDisabled,
  handleGenerate,
  totalCount,
  t,
}: UnitGenerationConstructionFieldsProps) {
  const subUseOptions = React.useMemo(() => {
    if (dynamicSubUseTypes && dynamicSubUseTypes.length > 0) {
      return dynamicSubUseTypes.map((o: { label?: string; value?: string | number; [key: string]: unknown }) => ({
        label: o.label,
        value: String(o.value),
      }));
    }
    const staticList = (dropdownOptions?.subUseTypes || []).filter(
      (o: { label?: string; value?: string | number; [key: string]: unknown }) => String(o.typeOfUseId) === String(genUseType)
    );
    return staticList.map((o: { label?: string; value?: string | number; [key: string]: unknown }) => ({
      label: o.label,
      value: String(o.value),
    }));
  }, [dynamicSubUseTypes, dropdownOptions?.subUseTypes, genUseType]);

  return (
    <>
      <Field label={t('subunit.fields.conYr') || 'Con Yr'}>
        <CompactInput
          name="genConYear"
          maxLength={4}
          placeholder={`e.g. ${new Date().getFullYear()}`}
          value={genConYear}
          onChange={(e) => {
            const cleanedVal = e.target.value.replace(/\D/g, '');
            setGenConYear(cleanedVal);
          }}
        />
      </Field>
      <Field label={t('subunit.fields.conType') || 'Con Type'}>
        <NativeSelect
          name="genConType"
          value={genConType || ''}
          onChange={(e) => setGenConType(e.target.value)}
          options={(dropdownOptions?.constructionTypes || []).map((o: { label?: string; value?: string | number; [key: string]: unknown }) => ({
            label: o.label,
            value: String(o.value),
          }))}
          placeholder={t('subunit.fields.constructionTypePlaceholder') || 'Select Type'}
        />
      </Field>
      <Field label={t('subunit.fields.typeOfUse') || 'Type of Use'}>
        <NativeSelect
          name="genUseType"
          value={genUseType || ''}
          onChange={(e) => setGenUseType(e.target.value)}
          options={(dropdownOptions?.useTypes || []).map((o: { label?: string; value?: string | number; [key: string]: unknown }) => ({
            label: o.label,
            value: String(o.value),
          }))}
          placeholder={t('subunit.fields.typeOfUsePlaceholder') || 'Select Use'}
        />
      </Field>
      <Field label={t('floorDetails.subTypeOfUse') || t('subunit.fields.subTypeOfUse') || 'Sub Type of Use'}>
        <NativeSelect
          name="genSubUseType"
          value={genSubUseType || ''}
          onChange={(e) => setGenSubUseType?.(e.target.value)}
          options={subUseOptions}
          placeholder={
            isSubUseTypesLoading
              ? (t('common.loading') || 'Loading...')
              : (t('floorDetails.subTypeOfUsePlaceholder') || 'Select Sub Type')
          }
          disabled={!genUseType || isSubUseTypesLoading}
          isLoading={isSubUseTypesLoading}
        />
      </Field>

      <div className="flex flex-col w-full h-[25px] justify-end">
        <button
          type="button"
          onClick={handleGenerate}
          disabled={isGenerateDisabled}
          className={`w-full h-[25px] rounded-md text-[9.5px] font-black uppercase tracking-wider flex items-center justify-center gap-1 transition-all shadow-sm cursor-pointer active:scale-98 ${
            isGenerateDisabled
              ? 'bg-blue-300 cursor-not-allowed text-white'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {isGenerating ? (
            <>
              <Loader2 className="size-3.5 animate-spin" /> {t('floorDetails.generating')}
            </>
          ) : (
            <>
              <Plus className="size-3.5" strokeWidth={3} />{' '}
              {t('floorDetails.generateUnitsCount', { count: totalCount || '' })}
            </>
          )}
        </button>
      </div>
    </>
  );
}
