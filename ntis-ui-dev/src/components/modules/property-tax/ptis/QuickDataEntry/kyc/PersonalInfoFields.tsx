import React from 'react';
import { Input, Label, SearchSelect, PTISTransliteratedInput, Tooltip } from '@/components/common';
import {
  KYC_VALIDATION_RULES,
  KYC_TITLE_OPTIONS,
  kycValidators,
} from '@/lib/utils/kyc-validation/kyc-validation.constants';
import { sanitizeName, capitalizeEachWordKycSociety } from '@/lib/utils/input-sanitization';
import { KycFormData } from '@/types/property-kyc.types';

interface PersonalInfoFieldsProps {
  t: (key: string) => string;
  formData: KycFormData;
  setFormData: React.Dispatch<React.SetStateAction<KycFormData>>;
  ownerTypeOptions: { label: string; value: string }[];
  showError: (field: keyof KycFormData, isValid: boolean) => boolean;
  onFocusField: (field: keyof KycFormData) => void;
  onBlurField: () => void;
}

export const PersonalInfoFields: React.FC<PersonalInfoFieldsProps> = ({
  t,
  formData,
  setFormData,
  ownerTypeOptions,
  showError,
  onFocusField,
  onBlurField,
}) => {
  const titleOptions = [...KYC_TITLE_OPTIONS];
  const ownerNameError = showError(
    'ownerName',
    kycValidators.isValidName(formData.ownerName ?? '')
  );
  const ownerNameEnglishError = showError(
    'ownerNameEnglish',
    kycValidators.isValidName(formData.ownerNameEnglish ?? '')
  );

  const preventEnterSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
    }
  };

  return (
    <>
      {/* Owner Category */}
      <div className="col-span-12 sm:col-span-6 md:col-span-2 space-y-1.5 relative focus-within:z-50">
        <Label htmlFor="kyc-ownertype" className="text-xs font-semibold text-gray-700">
          {t('kyc.ownerType')}
        </Label>
        <Tooltip content={ownerTypeOptions.find(opt => opt.value === formData.ownerTypeId?.toString())?.label || ''} placement="top">
          <div className="w-full">
            <SearchSelect
              id="kyc-ownertype"
              name="ownerType"
              autoFocus
              options={ownerTypeOptions}
              value={formData.ownerTypeId?.toString() ?? ''}
              placeholder={t('kyc.select')}
              onChange={(_name, value) => {
                setFormData((prev) => ({
                  ...prev,
                  ownerTypeId: value ? Number(value) : null,
                }));
              }}
              className="h-9 text-sm border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
          </div>
        </Tooltip>
      </div>

      {/* Title */}
      <div className="col-span-12 sm:col-span-6 md:col-span-2 space-y-1.5 relative focus-within:z-40">
        <Label htmlFor="kyc-title" className="text-xs font-semibold text-gray-700">
          {t('kyc.titleLabel')}
        </Label>
        <Tooltip content={titleOptions.find(opt => opt.value === formData.ownerTitle)?.label || ''} placement="top">
          <div className="w-full">
            <SearchSelect
              id="kyc-title"
              name="title"
              options={titleOptions}
              value={formData.ownerTitle ?? ''}
              placeholder={t('kyc.select')}
              onChange={(_name, value) => {
                setFormData((prev) => ({ ...prev, ownerTitle: value }));
              }}
              className="h-9 text-sm border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
          </div>
        </Tooltip>
      </div>

      {/* Owner Name Regional */}
      <div className="col-span-12 sm:col-span-6 md:col-span-4 space-y-1.5">
        <Label htmlFor="kyc-ownername" className="text-xs font-semibold text-gray-700">
          {t('kyc.ownerNameRegional')}
          <span className="text-red-500 ml-0.5">*</span>
        </Label>
        <PTISTransliteratedInput
          type="text"
          id="kyc-ownername"
          placeholder={t('kyc.enterFullNameMarathi')}
          value={formData.ownerName ?? ''}
          maxLength={KYC_VALIDATION_RULES.NAME_MAX_LENGTH}
          className={`h-9 text-sm border-gray-300 focus:border-gray-600 focus:ring-2 focus:ring-gray-200 ${ownerNameError ? 'border-red-300 focus:border-red-500' : ''}`}
          onFocus={() => onFocusField('ownerName')}
          onKeyDown={preventEnterSubmit}
          onBlur={() => {
            onBlurField();
            setFormData((prev) => ({
              ...prev,
              ownerName: capitalizeEachWordKycSociety(
                (prev.ownerName ?? '').trim().replace(/\s+/g, ' '),
                true
              ),
            }));
          }}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            const val = e.target.value;
            const start = e.target.selectionStart ?? val.length;
            const isAtEnd = start >= val.length;
            const sanitized = sanitizeName(val);
            const finalVal = isAtEnd ? capitalizeEachWordKycSociety(sanitized, false) : sanitized;
            if (finalVal.length <= KYC_VALIDATION_RULES.NAME_MAX_LENGTH) {
              setFormData((prev) => ({ ...prev, ownerName: finalVal }));
            }
          }}
        />
        {ownerNameError && (
          <span className="text-xs text-red-500">
            {!(formData.ownerName ?? '').trim()
              ? t('kyc.errors.ownerNameRequired')
              : (formData.ownerName ?? '').trim().length < KYC_VALIDATION_RULES.NAME_MIN_LENGTH ||
                (formData.ownerName ?? '').trim().length > KYC_VALIDATION_RULES.NAME_MAX_LENGTH
                ? t('society.validation.invalidNameLength')
                : t('kyc.validation.invalidName')}
          </span>
        )}
      </div>

      {/* Owner Name English */}
      <div className="col-span-12 sm:col-span-6 md:col-span-4 space-y-1.5">
        <Label htmlFor="kyc-ownername-english" className="text-xs font-semibold text-gray-700">
          {t('kyc.ownerNameEnglish')}
          <span className="text-red-500 ml-0.5">*</span>
        </Label>
        <Input
          type="text"
          id="kyc-ownername-english"
          placeholder={t('kyc.enterFullNameEnglish')}
          value={formData.ownerNameEnglish ?? ''}
          maxLength={KYC_VALIDATION_RULES.NAME_MAX_LENGTH}
          className={`h-9 text-sm border-gray-300 focus:border-gray-600 focus:ring-2 focus:ring-gray-200 ${ownerNameEnglishError ? 'border-red-300 focus:border-red-500' : ''}`}
          onFocus={() => onFocusField('ownerNameEnglish')}
          onKeyDown={preventEnterSubmit}
          onBlur={() => {
            onBlurField();
            setFormData((prev) => ({
              ...prev,
              ownerNameEnglish: capitalizeEachWordKycSociety(
                (prev.ownerNameEnglish ?? '').trim().replace(/\s+/g, ' '),
                true
              ),
            }));
          }}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            const val = e.target.value;
            const start = e.target.selectionStart ?? val.length;
            const isAtEnd = start >= val.length;
            const sanitized = sanitizeName(val);
            const finalVal = isAtEnd ? capitalizeEachWordKycSociety(sanitized, false) : sanitized;
            if (finalVal.length <= KYC_VALIDATION_RULES.NAME_MAX_LENGTH) {
              setFormData((prev) => ({ ...prev, ownerNameEnglish: finalVal }));
            }
          }}
        />
        {ownerNameEnglishError && (
          <span className="text-xs text-red-500">
            {!(formData.ownerNameEnglish ?? '').trim()
              ? t('kyc.errors.ownerNameRequired')
              : (formData.ownerNameEnglish ?? '').trim().length <
                KYC_VALIDATION_RULES.NAME_MIN_LENGTH ||
                (formData.ownerNameEnglish ?? '').trim().length >
                KYC_VALIDATION_RULES.NAME_MAX_LENGTH
                ? t('society.validation.invalidNameLength')
                : t('kyc.validation.invalidName')}
          </span>
        )}
      </div>
    </>
  );
};
