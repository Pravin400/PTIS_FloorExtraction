'use client';

import React, { useRef } from 'react';
import { IndianRupee, Calendar } from 'lucide-react';
import { Input, SearchSelect, Card, CardContent, CardHeader, CardTitle } from '@/components/common';
import { AnimatedDigitInput } from '@/components/common/AnimatedDigitInput';
import { SubUnitOccupantFields } from './SubUnitOccupantFields';
import { SubUnitRentInfoCardProps } from '@/types/asset/sub-units.types';
import { withSelectPlaceholder } from '@/lib/utils/asset-utils/new-add-new-asset/dropdown-placeholder.utils';

const toDisplayDate = (val: string) => {
  if (!val) return '';
  const ymdMatch = val.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (ymdMatch) return `${ymdMatch[3]}/${ymdMatch[2]}/${ymdMatch[1]}`;
  const parts = val.split('/');
  if (parts.length === 3 && parts[0].length === 4) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return val;
};

const toValueDate = (val: string) => {
  if (!val) return '';
  const parts = val.split('/');
  if (parts.length === 3 && parts[0].length === 2 && parts[1].length === 2 && parts[2].length === 4) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return val;
};

const formatManualDate = (val: string) => {
  const digits = val.replace(/\D/g, '').slice(0, 8);
  let res = '';
  if (digits.length > 0) res += digits.slice(0, 2);
  if (digits.length > 2) res += '/' + digits.slice(2, 4);
  if (digits.length > 4) res += '/' + digits.slice(4, 8);
  return res;
};

interface DatePickerFieldProps {
  label?: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  className?: string;
  required?: boolean;
}

const DatePickerField = ({ label, name, value, onChange, error, className, required }: DatePickerFieldProps) => {
  const dateRef = useRef<HTMLInputElement>(null);
  
  const triggerDatePicker = () => {
    if (dateRef.current) {
      try {
        if (typeof dateRef.current.showPicker === 'function') dateRef.current.showPicker();
        else dateRef.current.click();
      } catch (_e) {
        dateRef.current.click();
      }
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatManualDate(e.target.value).slice(0, 10);
    const valDate = toValueDate(formatted);
    onChange({ target: { name, value: valDate } } as unknown as React.ChangeEvent<HTMLInputElement>);
  };

  return (
    <div className="flex flex-col w-full">
      {label && (
        <label className="mb-1.5 text-[11px] font-bold text-slate-600">
          {label}
          {required && <span className="text-red-500"> *</span>}
        </label>
      )}
      <div className="relative w-full">
        <input
          type="date"
          ref={dateRef}
          tabIndex={-1}
          name={name}
          className="absolute inset-0 opacity-0 pointer-events-none w-full h-full"
          value={value && value.length === 10 && value.includes('-') && value.split('-')[0].length === 4 ? value : ''}
          onChange={onChange}
        />
        <Input
          type="text"
          name={name}
          naked
          placeholder="dd/mm/yyyy"
          maxLength={10}
          value={toDisplayDate(value || '')}
          onChange={handleTextChange}
          className={`px-2 h-7 border rounded-md text-[11px] font-bold text-slate-700 transition-colors placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full pr-8 ${error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 hover:border-gray-400'} ${className}`}
        />
        <Calendar
          className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 cursor-pointer"
          tabIndex={-1}
          onClick={triggerDatePicker}
        />
      </div>
      {error && <span className="mt-1 text-[10px] font-bold text-red-600">{error}</span>}
    </div>
  );
};

export function SubUnitRentInfoCard({
  formData,
  setFormData,
  handleChange,
  handleLocalNameChange,
  handleLocalNameBlur,
  handleLocalRenterNameChange,
  handleLocalRenterNameBlur,
  selectOnFocus,
  errors,
  isShop,
  isOffice,
  isRoom,
  isDepartment,
  inp,
  t,
}: SubUnitRentInfoCardProps) {
  return (
    <Card
      variant="bordered"
      padding="sm"
      className="shadow-sm border-slate-200/80 bg-white rounded-2xl"
    >
      <CardHeader className="flex items-center justify-between gap-2 bg-gradient-to-r from-[#C8E1FC] via-[#DBEAFF] to-[#EDF5FF] border border-[#A3CBFA] rounded-xl py-1 px-2.5 mb-2.5 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="bg-[#1d4ed8] p-1 rounded-lg text-white shadow-sm flex items-center justify-center shrink-0">
            <IndianRupee className="size-3.5 text-white" />
          </div>
          <CardTitle className="text-xs font-bold text-[#1d4ed8] uppercase tracking-widest">
            {t('subunit.sections.rentInfo')}
          </CardTitle>
        </div>
      </CardHeader>

      <CardContent className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-2 items-start">
        <SubUnitOccupantFields
          formData={formData}
          setFormData={setFormData}
          errors={errors}
          handleChange={handleChange}
          handleLocalNameChange={handleLocalNameChange}
          handleLocalNameBlur={handleLocalNameBlur}
          handleLocalRenterNameChange={handleLocalRenterNameChange}
          handleLocalRenterNameBlur={handleLocalRenterNameBlur}
          selectOnFocus={selectOnFocus}
          isShop={isShop}
          isOffice={isOffice}
          isRoom={isRoom}
          isDepartment={isDepartment}
          inp={inp}
          t={t}
        />
        <SearchSelect
          label={t('subunit.fields.rentType')}
          required
          name="rentType"
          value={formData.rentType || ''}
          onChange={(_name, val) => setFormData((prev: Record<string, unknown>) => ({ ...prev, rentType: val }))}
          options={withSelectPlaceholder([
            {
              label: 'Lease',
              value: 'Lease',
            },
            {
              label: 'Rent',
              value: 'Rent',
            },
          ])}
          placeholder="--Select--"
        />
        <DatePickerField
          label={(t as { has?: (k: string) => boolean })?.has?.('subunit.fields.agreementStart') ? t('subunit.fields.agreementStart') : 'Agreement Start'}
          required
          name="leaseStart"
          value={formData.leaseStart || ''}
          error={errors?.leaseStart}
          onChange={handleChange}
          className={inp}
        />
        <DatePickerField
          label={(t as { has?: (k: string) => boolean })?.has?.('subunit.fields.agreementEnd') ? t('subunit.fields.agreementEnd') : 'Agreement End'}
          required
          name="leaseEnd"
          value={formData.leaseEnd || ''}
          error={errors?.leaseEnd}
          onChange={handleChange}
          className={inp}
        />
        <Input
          label={t('subunit.fields.duration')}
          name="duration"
          value={formData.duration || t('subunit.fields.durationAuto')}
          readOnly
          className={`${inp} bg-slate-100 text-slate-500 italic`}
        />
        <Input
          label={t('subunit.fields.agreementNo').includes('subunit.fields.') ? 'Agreement No.' : t('subunit.fields.agreementNo')}
          name="agreementId"
          value={formData.agreementId || formData.agreementNo || ''}
          onChange={handleChange}
          error={errors?.agreementId}
          className={inp}
          maxLength={25}
        />
        <SearchSelect
          label={t('subunit.fields.rentFrequency')}
          name="rentFreq"
          value={formData.rentFreq || ''}
          onChange={(_name, val) => setFormData((prev: Record<string, unknown>) => ({ ...prev, rentFreq: val }))}
          options={withSelectPlaceholder([
            { label: t('subunit.fields.rentFreqOptions.monthly'), value: 'Monthly' },
            { label: t('subunit.fields.rentFreqOptions.yearly'), value: 'Yearly' },
          ])}
          placeholder="--Select--"
        />
        <AnimatedDigitInput
          label={t('subunit.fields.rentAmount')}
          required
          name="rentAmount"
          error={errors?.rentAmount}
          onFocus={selectOnFocus}
          value={String(formData.rentAmount || '')}
          onChange={(val) => setFormData((prev: Record<string, unknown>) => ({ ...prev, rentAmount: val ? Number(val) : '' }))}
          className={`${inp} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
        />
        <AnimatedDigitInput
          label={t('subunit.fields.securityDeposit')}
          name="securityDeposit"
          onFocus={selectOnFocus}
          value={String(formData.securityDeposit || '')}
          onChange={(val) => setFormData((prev: Record<string, unknown>) => ({ ...prev, securityDeposit: val ? Number(val) : '' }))}
          className={`${inp} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
        />
        <SearchSelect
          label={t('subunit.fields.depositType')}
          name="depositType"
          value={formData.depositType || ''}
          onChange={(_name, val) => setFormData((prev: Record<string, unknown>) => ({ ...prev, depositType: val }))}
          options={withSelectPlaceholder([
            {
              label: t('subunit.fields.depositTypeOptions.refundable'),
              value: 'Refundable',
            },
            {
              label: t('subunit.fields.depositTypeOptions.nonRefundable'),
              value: 'Non-Refundable',
            },
          ])}
          placeholder="--Select--"
        />
      </CardContent>
    </Card>
  );
}
