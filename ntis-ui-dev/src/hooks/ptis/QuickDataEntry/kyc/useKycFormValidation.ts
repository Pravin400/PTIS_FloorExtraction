import { useCallback, useMemo } from 'react';
import { KycDetails, KycFormData } from '@/types/property-kyc.types';
import { kycValidators, enhancedKycValidators } from '@/lib/utils/kyc-validation/kyc-validation.constants';
import { useDigitInputs } from '@/hooks/useDigitInputs';
import { extractCountryCode } from '@/lib/utils/kyc-validation/country-code.utils';

/**
 * Hook for KYC form validation logic
 * 
 * Handles:
 * - Change detection (comparing current form data with original)
 * - Form validation (checking if all required fields are valid)
 * 
 * @param formData - Current form data
 * @param mobileInput - Mobile number digit input hook instance
 * @param aadharInput - Aadhar number digit input hook instance
 * @param KycDetailsData - Original KYC details for change comparison
 * @returns Validation state and functions
 */
export const useKycFormValidation = (
  formData: KycFormData,
  mobileInput: ReturnType<typeof useDigitInputs>,
  alternateMobileInput: ReturnType<typeof useDigitInputs>,
  aadharInput: ReturnType<typeof useDigitInputs>,
  KycDetailsData?: KycDetails | null
) => {
  /**
   * Detects if form data has changed from original values
   * Used to enable/disable save button
   */
  const hasChanges = useMemo(() => {
    const cleanStr = (val?: string | null): string => {
      if (!val || val === '.' || val === '-') return '';
      return val.trim();
    };
    const isAsciiText = (val?: string | null): boolean => {
      if (!val) return false;
      return /^[\x00-\x7F]+$/.test(val.trim());
    };
    const normalizeEmail = (val?: string | null): string => {
      if (!val) return '';
      return val.trim().toLowerCase();
    };

    const initialOwnerName = cleanStr(KycDetailsData?.ownerName);
    const initialOwnerNameEnglish = cleanStr(KycDetailsData?.ownerNameEnglish) ||
      (isAsciiText(KycDetailsData?.ownerName) ? cleanStr(KycDetailsData?.ownerName) : '');

    const initialOccupierName = cleanStr(KycDetailsData?.occupierName);
    const initialOccupierNameEnglish = cleanStr(KycDetailsData?.occupierNameEnglish);

    const initialFlatOrShopName = cleanStr(KycDetailsData?.flatOrShopName);
    const initialFlatOrShopNameEnglish = cleanStr(KycDetailsData?.flatOrShopNameEnglish);

    const initialAddress = cleanStr(KycDetailsData?.address);
    const initialAddressEnglish = cleanStr(KycDetailsData?.addressEnglish);

    return (
      (formData.ownerTypeId ?? null) !== (KycDetailsData?.ownerTypeId ?? null) ||
      (formData.ownerTitle ?? '') !== (KycDetailsData?.ownerTitle ?? '') ||
      cleanStr(formData.ownerName) !== initialOwnerName ||
      cleanStr(formData.ownerNameEnglish) !== initialOwnerNameEnglish ||
      cleanStr(formData.occupierName) !== initialOccupierName ||
      cleanStr(formData.occupierNameEnglish) !== initialOccupierNameEnglish ||
      cleanStr(formData.flatOrShopName) !== initialFlatOrShopName ||
      cleanStr(formData.flatOrShopNameEnglish) !== initialFlatOrShopNameEnglish ||
      normalizeEmail(formData.emailId) !== normalizeEmail(KycDetailsData?.emailId) ||
      cleanStr(formData.address) !== initialAddress ||
      cleanStr(formData.addressEnglish) !== initialAddressEnglish ||
      (formData.location ?? '') !== (KycDetailsData?.location ?? '') ||
      String(formData.pinCode ?? '') !== String(KycDetailsData?.pinCode ?? '') ||
      (formData.mobileCountryCode ?? '91') !== extractCountryCode(KycDetailsData?.mobileNo).countryCode ||
      mobileInput.value !== extractCountryCode(KycDetailsData?.mobileNo).mobileNo ||
      (formData.alternateMobileCountryCode ?? '91') !== extractCountryCode(KycDetailsData?.alternateMobileNo).countryCode ||
      alternateMobileInput.value !== extractCountryCode(KycDetailsData?.alternateMobileNo).mobileNo ||
      aadharInput.value !== ((KycDetailsData?.adharCardNo ?? KycDetailsData?.aadharCardNo) ?? '').replace(/\D/g, '')
    );
  }, [formData, mobileInput.value, alternateMobileInput.value, aadharInput.value, KycDetailsData]);

  /**
   * Validates all required form fields
   * Returns true if form can be submitted
   * Checks for valid email, name, address, mobile, aadhar, shop name, and occupier name formats
   */
  const canSubmit = useCallback(() => {
    const ownerName = formData.ownerName ?? '';
    const ownerNameEnglish = formData.ownerNameEnglish ?? '';
    const email = formData.emailId ?? '';
    const address = formData.address ?? '';
    const addressEnglish = formData.addressEnglish ?? '';
    const shopName = formData.flatOrShopName ?? '';
    const shopNameEnglish = formData.flatOrShopNameEnglish ?? '';
    const occupierName = formData.occupierName ?? '';
    const occupierNameEnglish = formData.occupierNameEnglish ?? '';
    const pinCode = formData.pinCode ?? '';

    // Check if owner name exists and is valid
    const isOwnerNameValid = ownerName.trim().length > 0 && kycValidators.isValidName(ownerName);
    const isOwnerNameEnglishValid = ownerNameEnglish.trim().length > 0 && kycValidators.isValidName(ownerNameEnglish);

    // Check if email is either empty (optional) or valid with enhanced validation (strict)
    const isEmailValid = enhancedKycValidators.isValidEmail(email, true);

    // Check if address is valid (can be empty or valid)
    const isAddressValid = enhancedKycValidators.isValidAddress(address);
    const isAddressEnglishValid = enhancedKycValidators.isValidAddress(addressEnglish);

    // Check if shop name is valid (can be empty or valid, must not contain numbers)
    const isShopNameValid = enhancedKycValidators.isValidShopName(shopName);
    const isShopNameEnglishValid = enhancedKycValidators.isValidShopName(shopNameEnglish);

    // Check if occupier name is valid (can be empty or valid, must not contain numbers)
    const isOccupierNameValid = enhancedKycValidators.isValidOccupierName(occupierName);
    const isOccupierNameEnglishValid = enhancedKycValidators.isValidOccupierName(occupierNameEnglish);

    // Check if pinCode is valid (optional, but if provided must be exactly 6 digits without repeated digits)
    const isPinCodeValid = kycValidators.isValidPinCode(pinCode);

    // Check mobile and aadhar validity
    const isMobileValid = kycValidators.isValidMobile(mobileInput.value) && (!mobileInput.value || (formData.mobileCountryCode || '91').length === 2);
    const isAlternateMobileValid = kycValidators.isValidMobile(alternateMobileInput.value) && (!alternateMobileInput.value || (formData.alternateMobileCountryCode || '91').length === 2);
    const isAadharValid = kycValidators.isValidAadhar(aadharInput.value);

    return (
      isOwnerNameValid &&
      isOwnerNameEnglishValid &&
      isEmailValid &&
      isAddressValid &&
      isAddressEnglishValid &&
      isShopNameValid &&
      isShopNameEnglishValid &&
      isOccupierNameValid &&
      isOccupierNameEnglishValid &&
      isPinCodeValid &&
      isMobileValid &&
      isAlternateMobileValid &&
      isAadharValid
    );
  }, [formData, mobileInput.value, alternateMobileInput.value, aadharInput.value]);

  return {
    hasChanges,
    canSubmit,
  };
};
