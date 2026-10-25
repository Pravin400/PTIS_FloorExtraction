'use client';

import { User, Phone, Mail, CreditCard, FileText, MapPin } from 'lucide-react';
import { Input, AnimatedDigitInput } from "@/components/common";
import type { RenterIdentityFieldsProps } from '@/types/asset/renter.types';

export function RenterIdentityFields({ form, errors, handleFieldChange, handleLocalNameBlur, t }: RenterIdentityFieldsProps) {
  return (
    <div className="space-y-3.5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Renter Name English */}
        <div className="flex flex-col">
          <label className="mb-1 text-[11px] font-bold text-slate-700 flex items-center gap-1">
            <User className="size-3 text-blue-600" />
            {t('floorDetails.renterNameEnglish') || 'Renter / Tenant Name'}
            <span className="text-red-500">*</span>
          </label>
          <Input
            type="text"
            value={form.renterNameEnglish}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFieldChange('renterNameEnglish', e.target.value)}
            placeholder="Enter full name of renter/tenant"
            className={`h-8.5 text-[11px] font-bold rounded-lg ${errors.renterNameEnglish ? '!border-red-500 ring-1 ring-red-500' : 'border-slate-300'}`}
          />
          {errors.renterNameEnglish && (
            <span className="mt-1 text-[10px] font-bold text-red-600">{errors.renterNameEnglish}</span>
          )}
        </div>

        {/* Renter Name Local */}
        <div className="flex flex-col">
          <label className="mb-1 text-[11px] font-bold text-slate-700 flex items-center gap-1">
            <User className="size-3 text-indigo-600" />
            {t('floorDetails.renterNameLocal') || 'Renter Name (Local)'}
          </label>
          <Input
            type="text"
            value={form.renterNameLocal || ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFieldChange('renterNameLocal', e.target.value)}
            onBlur={(e: React.FocusEvent<HTMLInputElement>) => handleLocalNameBlur?.(e.target.value)}
            placeholder="प्रादेशिक नाव"
            className={`h-8.5 text-[11px] font-bold rounded-lg ${errors.renterNameLocal ? '!border-red-500 ring-1 ring-red-500' : 'border-slate-300'}`}
          />
          {errors.renterNameLocal && (
            <span className="mt-1 text-[10px] font-bold text-red-600">{errors.renterNameLocal}</span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Mobile No. */}
        <div className="flex flex-col">
          <label className="mb-1 text-[11px] font-bold text-slate-700 flex items-center gap-1">
            <Phone className="size-3 text-emerald-600" />
            {t('subunit.fields.mobileNo') || 'Mobile No.'}
          </label>
          <AnimatedDigitInput
            value={form.mobileNo || ''}
            onChange={(val) => handleFieldChange('mobileNo', val)}
            maxLength={10}
            className={`h-8.5 font-bold ${errors.mobileNo ? '!border-red-500 ring-1 ring-red-500' : ''}`}
          />
          {errors.mobileNo && (
            <span className="mt-1 text-[10px] font-bold text-red-600">{errors.mobileNo}</span>
          )}
        </div>

        {/* Email ID */}
        <div className="flex flex-col">
          <label className="mb-1 text-[11px] font-bold text-slate-700 flex items-center gap-1">
            <Mail className="size-3 text-indigo-600" />
            {t('subunit.fields.emailId') || 'Email ID'}
          </label>
          <Input
            type="email"
            value={form.emailId}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFieldChange('emailId', e.target.value)}
            placeholder="tenant@example.com"
            className={`h-8.5 text-[11px] font-bold rounded-lg ${errors.emailId ? '!border-red-500 ring-1 ring-red-500' : 'border-slate-300'}`}
          />
          {errors.emailId && (
            <span className="mt-1 text-[10px] font-bold text-red-600">{errors.emailId}</span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Aadhaar No. */}
        <div className="flex flex-col">
          <label className="mb-1 text-[11px] font-bold text-slate-700 flex items-center gap-1">
            <CreditCard className="size-3 text-cyan-600" />
            {t('subunit.fields.aadhaarNo') || 'Aadhaar No.'}
          </label>
          <AnimatedDigitInput
            value={form.aadhaar || ''}
            onChange={(val) => handleFieldChange('aadhaar', val)}
            maxLength={12}
            className={`h-8.5 font-bold ${errors.aadhaar ? '!border-red-500 ring-1 ring-red-500' : ''}`}
          />
          {errors.aadhaar && (
            <span className="mt-1 text-[10px] font-bold text-red-600">{errors.aadhaar}</span>
          )}
        </div>

        {/* PAN No. */}
        <div className="flex flex-col">
          <label className="mb-1 text-[11px] font-bold text-slate-700 flex items-center gap-1">
            <FileText className="size-3 text-amber-600" />
            {t('subunit.fields.panNo') || 'PAN No.'}
          </label>
          <AnimatedDigitInput
            value={form.pan || ''}
            onChange={(val) => handleFieldChange('pan', val.toUpperCase())}
            maxLength={10}
            allowedPattern={/^[a-zA-Z0-9]$/}
            className={`h-8.5 font-bold uppercase ${errors.pan ? '!border-red-500 ring-1 ring-red-500' : ''}`}
          />
          {errors.pan && (
            <span className="mt-1 text-[10px] font-bold text-red-600">{errors.pan}</span>
          )}
        </div>
      </div>

      {/* Tenant Address */}
      <div className="flex flex-col">
        <label className="mb-1 text-[11px] font-bold text-slate-700 flex items-center gap-1">
          <MapPin className="size-3 text-rose-600" />
          {t('floorDetails.tenantAddress') || 'Tenant Address'}
        </label>
        <Input
          type="text"
          value={form.tenantAddress || ''}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFieldChange('tenantAddress', e.target.value)}
          placeholder="Enter tenant's residential address"
          className={`h-8.5 text-[11px] font-bold rounded-lg ${errors.tenantAddress ? '!border-red-500 ring-1 ring-red-500' : 'border-slate-300'}`}
        />
        {errors.tenantAddress && (
          <span className="mt-1 text-[10px] font-bold text-red-600">{errors.tenantAddress}</span>
        )}
      </div>
    </div>
  );
}
