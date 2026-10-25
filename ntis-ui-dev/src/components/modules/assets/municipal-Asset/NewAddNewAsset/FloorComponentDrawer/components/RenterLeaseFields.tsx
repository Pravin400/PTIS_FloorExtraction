'use client';

import React, { useRef } from 'react';
import { Calendar, FileText, IndianRupee, Clock, ShieldCheck } from 'lucide-react';
import { SearchSelect, Input } from "@/components/common";
import type { RenterLeaseFieldsProps } from '@/types/asset/renter.types';
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

const DatePickerField = ({
  label,
  name,
  value,
  onChange,
  error,
  required,
  icon: Icon = Calendar,
}: { label: string; name?: string; value?: string; onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void; error?: string; required?: boolean; disabled?: boolean; icon?: React.ElementType }) => {
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
    if (onChange) { onChange({ target: { name: name || '', value: valDate } } as unknown as React.ChangeEvent<HTMLInputElement>); }
  };

  return (
    <div className="flex flex-col w-full">
      {label && (
        <label className="mb-1 text-[11px] font-bold text-slate-700 flex items-center gap-1">
          <Icon className="size-3 text-blue-600" />
          {label}
          {required && <span className="text-red-500">*</span>}
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
          className={`px-2.5 h-8.5 border rounded-lg text-[11px] font-bold text-slate-800 transition-colors placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 w-full pr-8 ${error ? '!border-red-500 ring-1 ring-red-500' : 'border-slate-300 hover:border-slate-400'}`}
        />
        <Calendar
          className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 hover:text-blue-600 cursor-pointer transition-colors"
          tabIndex={-1}
          onClick={triggerDatePicker}
        />
      </div>
      {error && <span className="mt-1 text-[10px] font-bold text-red-600">{error}</span>}
    </div>
  );
};

export function RenterLeaseFields({ form, errors, handleMonthlyRentChange, handleFieldChange, t }: RenterLeaseFieldsProps) {
  return (
    <div className="space-y-3.5">
      {/* Lease / Rent Type & Rent Frequency */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="flex flex-col">
          <label className="mb-1 text-[11px] font-bold text-slate-700 flex items-center gap-1">
            <FileText className="size-3 text-indigo-600" />
            {t('subunit.fields.rentType') || 'Lease / Rent Type'}
          </label>
          <SearchSelect
            name="rentType"
            options={withSelectPlaceholder([
              { label: 'Lease', value: 'Lease' },
              { label: 'Rent', value: 'Rent' }
            ])}
            value={form.rentType || ''}
            onChange={(_name, val) => handleFieldChange('rentType', val)}
            placeholder="--Select--"
          />
        </div>

        <div className="flex flex-col">
          <label className="mb-1 text-[11px] font-bold text-slate-700 flex items-center gap-1">
            <Clock className="size-3 text-cyan-600" />
            {t('subunit.fields.rentFrequency') || 'Rent Frequency'}
          </label>
          <SearchSelect
            name="rentFreq"
            options={withSelectPlaceholder([
              { label: t('subunit.fields.rentFreqOptions.monthly') || 'Monthly', value: 'Monthly' },
              { label: t('subunit.fields.rentFreqOptions.yearly') || 'Yearly', value: 'Yearly' }
            ])}
            value={form.rentFreq || ''}
            onChange={(_name, val) => handleFieldChange('rentFreq', val)}
            placeholder="--Select--"
          />
        </div>
      </div>

      {/* Dates: Agreement Start & End Date */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <DatePickerField
          label={t('floorDetails.agreementFromDate') || 'Agreement From Date'}
          name="agreementFromDate"
          value={form.agreementFromDate}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFieldChange('agreementFromDate', e.target.value)}
          error={errors.agreementFromDate}
          required={!!form.rentType}
        />

        <DatePickerField
          label={t('floorDetails.agreementToDate') || 'Agreement To Date'}
          name="agreementToDate"
          value={form.agreementToDate}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFieldChange('agreementToDate', e.target.value)}
          error={errors.agreementToDate}
          required={!!form.rentType}
        />
      </div>

      {/* Duration & Agreement No. */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="flex flex-col">
          <label className="mb-1 text-[11px] font-bold text-slate-700 flex items-center gap-1">
            <Clock className="size-3 text-amber-600" />
            {t('subunit.fields.duration') || 'Duration'}
          </label>
          <Input
            type="text"
            name="duration"
            value={form.duration || 'Auto-calculated'}
            readOnly
            className="h-8.5 text-[11px] font-bold bg-slate-100/90 text-slate-600 border-slate-200"
          />
        </div>

        <div className="flex flex-col">
          <label className="mb-1 text-[11px] font-bold text-slate-700 flex items-center gap-1">
            <FileText className="size-3 text-indigo-600" />
            {t('subunit.fields.agreementNo').includes('subunit.fields.') ? 'Agreement No.' : t('subunit.fields.agreementNo')}
          </label>
          <Input
            type="text"
            name="agreementId"
            value={form.agreementId || form.agreementNo || ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFieldChange('agreementId', e.target.value)}
            className={`h-8.5 text-[11px] font-bold text-slate-900 ${errors.agreementId ? '!border-red-500 ring-1 ring-red-500' : 'border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'} transition-shadow`}
            maxLength={25}
          />
          {errors.agreementId && (
            <span className="text-[10px] font-bold text-red-600 mt-1">{errors.agreementId}</span>
          )}
        </div>
      </div>

      {/* Monthly & Yearly Rent */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="flex flex-col">
          <label className="mb-1 text-[11px] font-bold text-slate-700 flex items-center gap-1">
            <IndianRupee className="size-3 text-emerald-600" />
            {t('floorDetails.rentMonthly') || 'Monthly Rent (₹)'}
            {form.rentType && <span className="text-red-500">*</span>}
          </label>
          <input
            type="text"
            inputMode="decimal"
            value={form.rentMonthly}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleMonthlyRentChange(e.target.value.replace(/[^\d.]/g, ''))}
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
              const allowed = ['Backspace','Delete','Tab','Enter','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'];
              if (allowed.includes(e.key)) return;
              if (e.key === '.' && !e.currentTarget.value.includes('.')) return;
              if (/^\d$/.test(e.key)) return;
              e.preventDefault();
            }}
            onPaste={(e: React.ClipboardEvent<HTMLInputElement>) => {
              const text = e.clipboardData.getData('text');
              if (!/^\d*\.?\d*$/.test(text)) e.preventDefault();
            }}
            placeholder="0.00"
            className={`px-2.5 h-8.5 w-full border rounded-lg text-[11px] font-bold text-slate-800 transition-colors focus:outline-none ${errors.rentMonthly ? '!border-red-500 ring-1 ring-red-500' : 'border-slate-300 hover:border-slate-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500'}`}
          />
          {errors.rentMonthly && <span className="mt-1 text-[10px] font-bold text-red-600">{errors.rentMonthly}</span>}
        </div>

        <div className="flex flex-col">
          <label className="mb-1 text-[11px] font-bold text-slate-700 flex items-center gap-1">
            <IndianRupee className="size-3 text-slate-500" />
            {t('floorDetails.rentYearly') || 'Yearly Rent (₹)'}
          </label>
          <Input
            type="text"
            value={form.rentYearly}
            readOnly
            placeholder="0.00"
            className="h-8.5 text-[11px] font-bold bg-slate-100/90 text-slate-600 border-slate-200"
          />
        </div>
      </div>

      {/* Security Deposit & Deposit Type */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="flex flex-col">
          <label className="mb-1 text-[11px] font-bold text-slate-700 flex items-center gap-1">
            <ShieldCheck className="size-3 text-blue-600" />
            {t('subunit.fields.securityDeposit') || 'Security Deposit (₹)'}
          </label>
          <input
            type="text"
            inputMode="decimal"
            name="securityDeposit"
            value={form.securityDeposit}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFieldChange('securityDeposit', e.target.value.replace(/[^\d.]/g, ''))}
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
              const allowed = ['Backspace','Delete','Tab','Enter','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'];
              if (allowed.includes(e.key)) return;
              if (e.key === '.' && !e.currentTarget.value.includes('.')) return;
              if (/^\d$/.test(e.key)) return;
              e.preventDefault();
            }}
            onPaste={(e: React.ClipboardEvent<HTMLInputElement>) => {
              const text = e.clipboardData.getData('text');
              if (!/^\d*\.?\d*$/.test(text)) e.preventDefault();
            }}
            placeholder="0.00"
            className={`px-2.5 h-8.5 w-full border rounded-lg text-[11px] font-bold text-slate-800 transition-colors focus:outline-none ${errors.securityDeposit ? '!border-red-500 ring-1 ring-red-500' : 'border-slate-300 hover:border-slate-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500'}`}
          />
          {errors.securityDeposit && <span className="mt-1 text-[10px] font-bold text-red-600">{errors.securityDeposit}</span>}
        </div>

        <div className="flex flex-col">
          <label className="mb-1 text-[11px] font-bold text-slate-700 flex items-center gap-1">
            <ShieldCheck className="size-3 text-purple-600" />
            {t('subunit.fields.depositType') || 'Deposit Type'}
          </label>
          <SearchSelect
            name="depositType"
            options={withSelectPlaceholder([
              { label: t('subunit.fields.depositTypeOptions.refundable') || 'Refundable', value: 'Refundable' },
              { label: t('subunit.fields.depositTypeOptions.nonRefundable') || 'Non-Refundable', value: 'Non-Refundable' }
            ])}
            value={form.depositType || ''}
            onChange={(_name, val) => handleFieldChange('depositType', val)}
            placeholder="--Select--"
          />
        </div>
      </div>
    </div>
  );
}
