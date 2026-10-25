/* eslint-disable i18next/no-literal-string */
'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/common';
import { sanitizeName, sanitizeWingName, sanitizeEmailStrict, sanitizeNumericInput } from '@/lib/utils/input-sanitization';
import type { EditWingFormData } from './ApartmentEditWingModal';

export interface EditWingDetailsFormProps {
  formData: EditWingFormData;
  setFormData: React.Dispatch<React.SetStateAction<EditWingFormData>>;
  errors: Record<string, string>;
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

export const ApartmentEditWingForm: React.FC<EditWingDetailsFormProps> = ({
  formData,
  setFormData,
  errors,
  setErrors,
}) => {
  const t = useTranslations('quickDataEntry');

  return (
    <>
      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1">
          {t('wing.wingName') || 'Wing Name'} <span className="text-red-500">*</span>
        </label>
        <Input
          value={formData.wingName}
          onChange={(e) => {
            setFormData((prev) => ({ ...prev, wingName: sanitizeWingName(e.target.value) }));
            if (errors.wingName) setErrors((prev) => ({ ...prev, wingName: '' }));
          }}
          placeholder="e.g. A Wing"
          maxLength={30}
          className="w-full text-sm"
        />
        {errors.wingName && <p className="text-xs text-red-500 mt-1">{errors.wingName}</p>}
      </div>

      <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
          {t('wing.managerName') || 'Manager Details'}
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Manager Name (Regional / Marathi)</label>
            <Input value={formData.managerName} onChange={(e) => setFormData((prev) => ({ ...prev, managerName: sanitizeName(e.target.value) }))} placeholder="उदा. भूषण" maxLength={200} className="w-full text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Manager Name (English)</label>
            <Input value={formData.managerNameEnglish} onChange={(e) => setFormData((prev) => ({ ...prev, managerNameEnglish: sanitizeName(e.target.value) }))} placeholder="e.g. Bhushan" maxLength={200} className="w-full text-sm" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Manager Mobile No</label>
            <Input value={formData.managerMobileNo} onChange={(e) => { const num = sanitizeNumericInput(e.target.value).slice(0, 10); setFormData((prev) => ({ ...prev, managerMobileNo: num })); if (errors.managerMobileNo) setErrors((prev) => ({ ...prev, managerMobileNo: '' })); }} placeholder="e.g. 9876543211" maxLength={10} className="w-full text-sm" />
            {errors.managerMobileNo && <p className="text-xs text-red-500 mt-1">{errors.managerMobileNo}</p>}
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Manager Email ID</label>
            <Input type="email" value={formData.managerEmailId} onChange={(e) => { const em = sanitizeEmailStrict(e.target.value); setFormData((prev) => ({ ...prev, managerEmailId: em })); if (errors.managerEmailId) setErrors((prev) => ({ ...prev, managerEmailId: '' })); }} placeholder="e.g. manager@example.com" maxLength={100} className="w-full text-sm" />
            {errors.managerEmailId && <p className="text-xs text-red-500 mt-1">{errors.managerEmailId}</p>}
          </div>
        </div>
      </div>

      <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
          {t('wing.secretaryName') || 'Secretary Details'}
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Secretary Name (Regional / Marathi)</label>
            <Input value={formData.secretaryName} onChange={(e) => setFormData((prev) => ({ ...prev, secretaryName: sanitizeName(e.target.value) }))} placeholder="उदा. अमित" maxLength={200} className="w-full text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Secretary Name (English)</label>
            <Input value={formData.secretaryNameEnglish} onChange={(e) => setFormData((prev) => ({ ...prev, secretaryNameEnglish: sanitizeName(e.target.value) }))} placeholder="e.g. Amit" maxLength={200} className="w-full text-sm" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Secretary Mobile No</label>
            <Input value={formData.secretaryMobileNo} onChange={(e) => { const num = sanitizeNumericInput(e.target.value).slice(0, 10); setFormData((prev) => ({ ...prev, secretaryMobileNo: num })); if (errors.secretaryMobileNo) setErrors((prev) => ({ ...prev, secretaryMobileNo: '' })); }} placeholder="e.g. 9876543210" maxLength={10} className="w-full text-sm" />
            {errors.secretaryMobileNo && <p className="text-xs text-red-500 mt-1">{errors.secretaryMobileNo}</p>}
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Secretary Email ID</label>
            <Input type="email" value={formData.secretaryEmailId} onChange={(e) => { const em = sanitizeEmailStrict(e.target.value); setFormData((prev) => ({ ...prev, secretaryEmailId: em })); if (errors.secretaryEmailId) setErrors((prev) => ({ ...prev, secretaryEmailId: '' })); }} placeholder="e.g. secretary@example.com" maxLength={100} className="w-full text-sm" />
            {errors.secretaryEmailId && <p className="text-xs text-red-500 mt-1">{errors.secretaryEmailId}</p>}
          </div>
        </div>
      </div>
    </>
  );
};

export default ApartmentEditWingForm;
