'use client';

import { RenterIdentityFields } from './RenterIdentityFields';
import { RenterLeaseFields } from './RenterLeaseFields';
import type { RenterDetailsFormProps } from '@/types/asset/renter.types';

export function RenterDetailsForm({
  form,
  errors,
  handleMonthlyRentChange,
  handleFieldChange,
  handleLocalNameBlur,
  t,
}: RenterDetailsFormProps) {
  return (
    <div className="space-y-4">
      {/* 1. Occupant Identity Card */}
      <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <h4 className="text-[13px] font-bold text-[#101b87] flex items-center gap-2 pb-2 border-b border-slate-100">
          <div className="w-1.5 h-4 bg-blue-600 rounded-full"></div> {'Occupant Identity'}
        </h4>
        <RenterIdentityFields
          form={form}
          errors={errors}
          handleFieldChange={handleFieldChange}
          handleLocalNameBlur={handleLocalNameBlur}
          t={t}
        />
      </div>

      {/* 2. Lease & Rent Agreement Card */}
      <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <h4 className="text-[13px] font-bold text-[#101b87] flex items-center gap-2 pb-2 border-b border-slate-100">
          <div className="w-1.5 h-4 bg-indigo-600 rounded-full"></div> {'Lease / Rent Agreement'}
        </h4>
        <RenterLeaseFields
          form={form}
          errors={errors}
          handleMonthlyRentChange={handleMonthlyRentChange}
          handleFieldChange={handleFieldChange}
          t={t}
        />
      </div>
    </div>
  );
}
