import React from 'react';
import { AnimatedDigitInput, Input, PTISTransliteratedInput, Tooltip } from '@/components/common';
import { Label } from '@/components/common/label';
import {
  KYC_VALIDATION_RULES,
  enhancedKycValidators,
  kycValidators,
} from '@/lib/utils/kyc-validation/kyc-validation.constants';
import {
  sanitizeAddress,
  sanitizeShopName,
  sanitizeEmailStrict,
  sanitizeName,
  capitalizeEachWordKycSociety,
} from '@/lib/utils/input-sanitization';
import { KycFormData } from '@/types/property-kyc.types';

interface AddressInfoFieldsProps {
  t: (key: string) => string;
  formData: KycFormData;
  setFormData: React.Dispatch<React.SetStateAction<KycFormData>>;
  showError: (field: keyof KycFormData, isValid: boolean) => boolean;
  onFocusField: (field: keyof KycFormData) => void;
  onBlurField: () => void;
  section?: 'occupier-shop' | 'address-email-pincode';
}

export const AddressInfoFields: React.FC<AddressInfoFieldsProps> = ({
  t,
  formData,
  setFormData,
  showError,
  onFocusField,
  onBlurField,
  section,
}) => {
  const shopNameError = showError(
    'flatOrShopName',
    enhancedKycValidators.isValidShopName(formData.flatOrShopName ?? '')
  );
  const shopNameEnglishError = showError(
    'flatOrShopNameEnglish',
    enhancedKycValidators.isValidShopName(formData.flatOrShopNameEnglish ?? '')
  );
  const occupierNameError = showError(
    'occupierName',
    enhancedKycValidators.isValidOccupierName(formData.occupierName ?? '')
  );
  const occupierNameEnglishError = showError(
    'occupierNameEnglish',
    enhancedKycValidators.isValidOccupierName(formData.occupierNameEnglish ?? '')
  );
  const emailIdError = showError(
    'emailId',
    enhancedKycValidators.isValidEmail(formData.emailId ?? '', true)
  );
  const addressError = showError(
    'address',
    enhancedKycValidators.isValidAddress(formData.address ?? '')
  );
  const addressEnglishError = showError(
    'addressEnglish',
    enhancedKycValidators.isValidAddress(formData.addressEnglish ?? '')
  );
  const pinCodeError =
    showError('pinCode', kycValidators.isValidPinCode(formData.pinCode ?? '')) ||
    !!(
      formData.pinCode && !kycValidators.isValidPinCode(formData.pinCode)
    );

  const preventEnterSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
    }
  };

  return (
    <>
      {(!section || section === 'occupier-shop') && (
        <>
          {/* Occupier Name Regional */}
          <div className="col-span-12 sm:col-span-6 md:col-span-3 space-y-1.5">
            <Label htmlFor="kyc-occupier" className="text-xs font-semibold text-gray-700">
              {t('kyc.occupierNameMarathi')}
            </Label>
            <PTISTransliteratedInput
              type="text"
              id="kyc-occupier"
              placeholder={t('kyc.enterOccupierNameMarathi')}
              value={formData.occupierName ?? ''}
              maxLength={KYC_VALIDATION_RULES.NAME_MAX_LENGTH}
              className={`h-9 text-sm border-gray-300 focus:border-gray-600 focus:ring-2 focus:ring-gray-200 ${occupierNameError ? 'border-red-300 focus:border-red-500' : ''}`}
              onFocus={() => onFocusField('occupierName')}
              onKeyDown={preventEnterSubmit}
              onBlur={() => {
                onBlurField();
                setFormData((prev) => ({
                  ...prev,
                  occupierName: capitalizeEachWordKycSociety(
                    (prev.occupierName ?? '').trim().replace(/\s+/g, ' '),
                    true
                  ),
                }));
              }}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                const val = e.target.value;
                const start = e.target.selectionStart ?? val.length;
                const isAtEnd = start >= val.length;
                const sanitized = sanitizeName(val);
                const finalVal = isAtEnd
                  ? capitalizeEachWordKycSociety(sanitized, false)
                  : sanitized;
                if (finalVal.length <= KYC_VALIDATION_RULES.NAME_MAX_LENGTH) {
                  setFormData((prev) => ({ ...prev, occupierName: finalVal }));
                }
              }}
            />
            {occupierNameError && (
              <span className="text-xs text-red-500">{t('kyc.validation.invalidName')}</span>
            )}
          </div>

          {/* Occupier Name English */}
          <div className="col-span-12 sm:col-span-6 md:col-span-3 space-y-1.5">
            <Label htmlFor="kyc-occupier-english" className="text-xs font-semibold text-gray-700">
              {t('kyc.occupierNameEnglish')}
            </Label>
            <Input
              type="text"
              id="kyc-occupier-english"
              placeholder={t('kyc.enterOccupierNameEnglish')}
              value={formData.occupierNameEnglish ?? ''}
              maxLength={KYC_VALIDATION_RULES.NAME_MAX_LENGTH}
              className={`h-9 text-sm border-gray-300 focus:border-gray-600 focus:ring-2 focus:ring-gray-200 ${occupierNameEnglishError ? 'border-red-300 focus:border-red-500' : ''}`}
              onFocus={() => onFocusField('occupierNameEnglish')}
              onKeyDown={preventEnterSubmit}
              onBlur={() => {
                onBlurField();
                setFormData((prev) => ({
                  ...prev,
                  occupierNameEnglish: capitalizeEachWordKycSociety(
                    (prev.occupierNameEnglish ?? '').trim().replace(/\s+/g, ' '),
                    true
                  ),
                }));
              }}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                const val = e.target.value;
                const start = e.target.selectionStart ?? val.length;
                const isAtEnd = start >= val.length;
                const sanitized = sanitizeName(val);
                const finalVal = isAtEnd
                  ? capitalizeEachWordKycSociety(sanitized, false)
                  : sanitized;
                if (finalVal.length <= KYC_VALIDATION_RULES.NAME_MAX_LENGTH) {
                  setFormData((prev) => ({ ...prev, occupierNameEnglish: finalVal }));
                }
              }}
            />
            {occupierNameEnglishError && (
              <span className="text-xs text-red-500">{t('kyc.validation.invalidName')}</span>
            )}
          </div>

          {/* Shop Name Regional */}
          <div className="col-span-12 sm:col-span-6 md:col-span-3 space-y-1.5">
              <Label htmlFor="kyc-shopname" className="text-xs font-semibold text-gray-700">
                {t('kyc.shopNameMarathi')}
              </Label>
              <PTISTransliteratedInput
                type="text"
                id="kyc-shopname"
                placeholder={t('kyc.enterShopNameMarathi')}
                value={formData.flatOrShopName ?? ''}
                maxLength={KYC_VALIDATION_RULES.SHOP_NAME_MAX_LENGTH}
                className={`h-9 text-sm border-gray-300 focus:border-gray-600 focus:ring-2 focus:ring-gray-200 ${shopNameError ? 'border-red-300 focus:border-red-500' : ''}`}
                onFocus={() => onFocusField('flatOrShopName')}
                onKeyDown={preventEnterSubmit}
                onBlur={() => {
                  onBlurField();
                  setFormData((prev) => ({
                    ...prev,
                    flatOrShopName: capitalizeEachWordKycSociety(
                      (prev.flatOrShopName ?? '').trim().replace(/\s+/g, ' '),
                      true
                    ),
                  }));
                }}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  const val = e.target.value;
                  const start = e.target.selectionStart ?? val.length;
                  const isAtEnd = start >= val.length;
                  const sanitized = sanitizeShopName(val);
                  const finalVal = isAtEnd
                    ? capitalizeEachWordKycSociety(sanitized, false)
                    : sanitized;
                  if (finalVal.length <= KYC_VALIDATION_RULES.SHOP_NAME_MAX_LENGTH) {
                    setFormData((prev) => ({ ...prev, flatOrShopName: finalVal }));
                  }
                }}
              />
              {shopNameError && (
                <span className="text-xs text-red-500">{t('kyc.validation.invalidName')}</span>
              )}
            </div>

          {/* Shop Name English */}
          <div className="col-span-12 sm:col-span-6 md:col-span-3 space-y-1.5">
              <Label htmlFor="kyc-shopname-english" className="text-xs font-semibold text-gray-700">
                {t('kyc.shopNameEnglish')}
              </Label>
              <Input
                type="text"
                id="kyc-shopname-english"
                placeholder={t('kyc.enterShopNameEnglish')}
                value={formData.flatOrShopNameEnglish ?? ''}
                maxLength={KYC_VALIDATION_RULES.SHOP_NAME_MAX_LENGTH}
                className={`h-9 text-sm border-gray-300 focus:border-gray-600 focus:ring-2 focus:ring-gray-200 ${shopNameEnglishError ? 'border-red-300 focus:border-red-500' : ''}`}
                onFocus={() => onFocusField('flatOrShopNameEnglish')}
                onKeyDown={preventEnterSubmit}
                onBlur={() => {
                  onBlurField();
                  setFormData((prev) => ({
                    ...prev,
                    flatOrShopNameEnglish: capitalizeEachWordKycSociety(
                      (prev.flatOrShopNameEnglish ?? '').trim().replace(/\s+/g, ' '),
                      true
                    ),
                  }));
                }}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  const val = e.target.value;
                  const start = e.target.selectionStart ?? val.length;
                  const isAtEnd = start >= val.length;
                  const sanitized = sanitizeShopName(val);
                  const finalVal = isAtEnd
                    ? capitalizeEachWordKycSociety(sanitized, false)
                    : sanitized;
                  if (finalVal.length <= KYC_VALIDATION_RULES.SHOP_NAME_MAX_LENGTH) {
                    setFormData((prev) => ({ ...prev, flatOrShopNameEnglish: finalVal }));
                  }
                }}
              />
              {shopNameEnglishError && (
                <span className="text-xs text-red-500">{t('kyc.validation.invalidName')}</span>
              )}
            </div>
        </>
      )}


      {(!section || section === 'address-email-pincode') && (
        <>
          {/* Email ID */}
          <div className="col-span-12 sm:col-span-6 md:col-span-2 space-y-1.5">
            <Label htmlFor="kyc-email" className="text-xs font-semibold text-gray-700">
              {t('kyc.emailId')}
            </Label>
            <Tooltip content={formData.emailId ?? ''} placement="top">
              <Input
                id="kyc-email"
                type="email"
                placeholder={t('kyc.enterEmailId')}
                value={formData.emailId ?? ''}
                maxLength={KYC_VALIDATION_RULES.EMAIL_MAX_LENGTH}
                className={`h-9 text-sm border-gray-300 focus:border-gray-600 focus:ring-2 focus:ring-gray-200 ${emailIdError ? 'border-red-300 focus:border-red-500' : ''}`}
                onFocus={() => onFocusField('emailId')}
                onKeyDown={preventEnterSubmit}
                onBlur={onBlurField}
                onChange={(e) => {
                  const sanitized = sanitizeEmailStrict(e.target.value);
                  setFormData((prev) => ({ ...prev, emailId: sanitized }));
                }}
              />
            </Tooltip>
            {emailIdError && (
              <span className="text-xs text-red-500">{t('kyc.validation.invalidEmail')}</span>
            )}
          </div>

          {/* Address Regional */}
          <div className="col-span-12 sm:col-span-6 md:col-span-4 space-y-1.5">
            <Label htmlFor="kyc-address" className="text-xs font-semibold text-gray-700">
              {t('kyc.addressMarathi')}
            </Label>
            <PTISTransliteratedInput
              type="text"
              id="kyc-address"
              placeholder={t('kyc.enterAddressMarathi')}
              value={formData.address ?? ''}
              maxLength={KYC_VALIDATION_RULES.ADDRESS_MAX_LENGTH}
              className={`h-9 text-sm border-gray-300 focus:border-gray-600 focus:ring-2 focus:ring-gray-200 ${addressError ? 'border-red-300 focus:border-red-500' : ''}`}
              onFocus={() => onFocusField('address')}
              onKeyDown={preventEnterSubmit}
              onBlur={onBlurField}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                // Sanitize to remove invalid characters immediately
                const sanitized = sanitizeAddress(e.target.value);
                setFormData((prev) => ({
                  ...prev,
                  address: sanitized.slice(0, KYC_VALIDATION_RULES.ADDRESS_MAX_LENGTH),
                }));
              }}
            />
            {addressError && (
              <span className="text-xs text-red-500">{t('kyc.validation.invalidAddress')}</span>
            )}
          </div>

          {/* Address English */}
          <div className="col-span-12 sm:col-span-6 md:col-span-4 space-y-1.5">
            <Label htmlFor="kyc-address-english" className="text-xs font-semibold text-gray-700">
              {t('kyc.addressEnglish')}
            </Label>
            <Tooltip content={formData.addressEnglish ?? ''} placement="top">
              <Input
                type="text"
                id="kyc-address-english"
                placeholder={t('kyc.enterAddressEnglish')}
                value={formData.addressEnglish ?? ''}
                maxLength={KYC_VALIDATION_RULES.ADDRESS_MAX_LENGTH}
                className={`h-9 text-sm border-gray-300 focus:border-gray-600 focus:ring-2 focus:ring-gray-200 ${addressEnglishError ? 'border-red-300 focus:border-red-500' : ''}`}
                onFocus={() => onFocusField('addressEnglish')}
                onKeyDown={preventEnterSubmit}
                onBlur={onBlurField}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  // Sanitize to remove invalid characters immediately
                  const sanitized = sanitizeAddress(e.target.value);
                  setFormData((prev) => ({
                    ...prev,
                    addressEnglish: sanitized.slice(0, KYC_VALIDATION_RULES.ADDRESS_MAX_LENGTH),
                  }));
                }}
              />
            </Tooltip>
            {addressEnglishError && (
              <span className="text-xs text-red-500">{t('kyc.validation.invalidAddress')}</span>
            )}
          </div>

          {/* Pin Code */}
          <div className="col-span-12 sm:col-span-6 md:col-span-2 space-y-1.5">
            <Label htmlFor="kyc-pincode" className="text-xs font-bold text-gray-700">
              {t('kyc.pinCode')}
            </Label>
            <AnimatedDigitInput
              id="kyc-pincode"
              placeholder={t('kyc.enterPinCode')}
              value={String(formData.pinCode || '')}
              maxLength={6}
              className={
                pinCodeError
                  ? 'border-red-300 focus-within:border-red-500 focus-within:ring-red-300'
                  : ''
              }
              onFocus={() => onFocusField('pinCode')}
              onKeyDown={preventEnterSubmit}
              onBlur={onBlurField}
              onChange={(val) => {
                setFormData((prev) => ({ ...prev, pinCode: val }));
              }}
            />
            {pinCodeError && (
              <span className="text-xs text-red-500">
                {String(formData.pinCode || '').startsWith('0')
                  ? t('kyc.validation.pinCodeCannotStartWithZero') || 'PIN code cannot start with 0'
                  :  kycValidators.hasRepeatedSequence(String(formData.pinCode || '').trim(), 6)
                  ? t('kyc.validation.invalidRepeatedSequence') || 'Cannot enter repeated numbers'
                  : t('kyc.validation.invalidPinCode') || 'Please enter a valid 6-digit PIN code.'}
              </span>
            )}
          </div>
        </>
      )}
    </>
  );
};
