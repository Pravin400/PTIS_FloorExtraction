'use client';

import { CustomBoxedInput } from './CustomBoxedInput';
import { SubUnitContactIdentityFieldsProps } from '@/types/asset/sub-units.types';

/** Mobile/Aadhaar/PAN boxed-input trio — identical across every occupant
 * type (Flat, Shop, Office, Room, Department). */
export function SubUnitContactIdentityFields({ formData, setFormData, errors, t, isRequired }: SubUnitContactIdentityFieldsProps) {
  return (
    <>
      <div className="flex flex-col min-w-0">
        <label className="block text-[11px] font-medium text-gray-700 mb-1 truncate">
          {t('subunit.fields.mobileNo')}
          {isRequired && <span className="text-red-500"> *</span>}
        </label>
        <CustomBoxedInput
          value={formData.mobileNo || ''}
          onChange={(val) => setFormData((prev: Record<string, unknown>) => ({ ...prev, mobileNo: val }))}
          length={10}
          type="numeric"
          showPrefix="+91"
          className="w-full min-w-0"
        />
        {errors?.mobileNo && <span className="text-red-500 text-[10px] mt-0.5">{errors.mobileNo}</span>}
      </div>
      <div className="flex flex-col min-w-0">
        <label className="block text-[11px] font-medium text-gray-700 mb-1 truncate">
          {t('subunit.fields.aadhaarNo')}
        </label>
        <CustomBoxedInput
          value={formData.aadhaar || ''}
          onChange={(val) => setFormData((prev: Record<string, unknown>) => ({ ...prev, aadhaar: val }))}
          length={12}
          type="numeric"
          groupSizes={[4, 4, 4]}
          className="w-full min-w-0"
        />
        {errors?.aadhaar && <span className="text-red-500 text-[10px] mt-0.5">{errors.aadhaar}</span>}
      </div>
      <div className="flex flex-col min-w-0">
        <label className="block text-[11px] font-medium text-gray-700 mb-1 truncate">
          {t('subunit.fields.panNo')}
        </label>
        <CustomBoxedInput
          value={formData.pan || ''}
          onChange={(val) => setFormData((prev: Record<string, unknown>) => ({ ...prev, pan: val }))}
          length={10}
          type="alphanumeric"
          className="w-full min-w-0"
        />
        {errors?.pan && <span className="text-red-500 text-[10px] mt-0.5">{errors.pan}</span>}
      </div>
    </>
  );
}
