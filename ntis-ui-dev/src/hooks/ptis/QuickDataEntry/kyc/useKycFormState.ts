import { useState, useMemo } from 'react';
import {
  KycDetails,
  KycFormData,
  OwnerTypeApiItem
} from '@/types/property-kyc.types';
import { KYC_VALIDATION_RULES } from '@/lib/utils/kyc-validation/kyc-validation.constants';
import { useDigitInputs } from '@/hooks/useDigitInputs';
import { extractCountryCode } from '@/lib/utils/kyc-validation/country-code.utils';


const cleanString = (val?: string | null): string => {
  if (!val || val === '.' || val === '-') return '';
  return val;
};

const isAsciiText = (val?: string | null): boolean => {
  if (!val) return false;
  return /^[\x00-\x7F]+$/.test(val.trim());
};

const createInitialKycFormData = (data?: KycDetails | null): KycFormData => {
  const mobile = extractCountryCode(data?.mobileNo);
  const altMobile = extractCountryCode(data?.alternateMobileNo);
  return {
    ownerTypeId: data?.ownerTypeId != null && data?.ownerTypeId !== undefined
      ? data.ownerTypeId
      : null,
    ownerTitle: data?.ownerTitle ?? '',
    ownerName: cleanString(data?.ownerName),
    ownerNameEnglish: cleanString(data?.ownerNameEnglish) || (isAsciiText(data?.ownerName) ? cleanString(data?.ownerName) : ''),
    occupierName: cleanString(data?.occupierName),
    occupierNameEnglish: cleanString(data?.occupierNameEnglish),
    flatOrShopName: cleanString(data?.flatOrShopName),
    flatOrShopNameEnglish: cleanString(data?.flatOrShopNameEnglish),
    emailId: cleanString(data?.emailId),
    address: cleanString(data?.address),
    addressEnglish: cleanString(data?.addressEnglish),
    location: cleanString(data?.location),
    pinCode: cleanString(data?.pinCode),
    mobileCountryCode: mobile.countryCode,
    alternateMobileCountryCode: altMobile.countryCode,
  };
};

/**
 * Hook for managing KYC form state
 * 
 * Handles:
 * - Form data initialization and state management
 * - Digit inputs (mobile and Aadhar)
 * - Owner type options preparation
 * 
 * @param KycDetailsData - Initial KYC details data
 * @param OwnerTypeMasterList - List of available owner types
 * @returns Form state and setters
 */
export const useKycFormState = (
  KycDetailsData?: KycDetails | null,
  OwnerTypeMasterList: OwnerTypeApiItem[] = []
) => {
  const [isSubmitted, setIsSubmitted] = useState(false);

  const parsedMobile = extractCountryCode(KycDetailsData?.mobileNo);
  const parsedAlternateMobile = extractCountryCode(KycDetailsData?.alternateMobileNo);

  const [formData, setFormData] = useState<KycFormData>(() => createInitialKycFormData(KycDetailsData));

  // Digit inputs for mobile and Aadhar card numbers
  const mobileInput = useDigitInputs(
    KYC_VALIDATION_RULES.MOBILE_LENGTH,
    parsedMobile.mobileNo
  );

  const alternateMobileInput = useDigitInputs(
    KYC_VALIDATION_RULES.MOBILE_LENGTH,
    parsedAlternateMobile.mobileNo
  );

  const aadharInput = useDigitInputs(
    KYC_VALIDATION_RULES.AADHAR_LENGTH,
    KycDetailsData?.adharCardNo ?? KycDetailsData?.aadharCardNo ?? ''
  );

  // Prepare owner type options for select dropdown
  const ownerTypeOptions = useMemo(() =>
    OwnerTypeMasterList.map((item) => ({
      label: item.ownerType,
      value: item.id != null && item.id !== undefined
        ? String(item.id)
        : '',
    })),
    [OwnerTypeMasterList]
  );

  return {
    formData,
    setFormData,
    mobileInput,
    alternateMobileInput,
    aadharInput,
    isSubmitted,
    setIsSubmitted,
    ownerTypeOptions,
  };
};
