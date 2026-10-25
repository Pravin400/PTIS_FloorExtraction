import { useCallback } from 'react';
import {
  PERSON_NAME_REGEX,
  OWNER_NAME_REGEX,
  EMAIL_REGEX,
  MOBILE_10_REGEX,
  YEAR_REGEX,
  CODE_REGEX,
  TEXT_ALLOWED,
} from '@/lib/utils/validation-rules';
import {
  DrawerFormData,
  DrawerFormErrors,
  DrawerFloorDataRow,
} from '../../types/propertyEditScreenDrawer.types';

interface UsePropertyEditScreenValidationArgs {
  formData: DrawerFormData;
  floorData: DrawerFloorDataRow[];
  setFormErrors: React.Dispatch<React.SetStateAction<DrawerFormErrors>>;
}

/**
 * Hook for form and floor QC validation
 */
export function usePropertyEditScreenValidation({
  formData,
  floorData,
  setFormErrors,
}: UsePropertyEditScreenValidationArgs) {
  // Validate a single field
  const validateField = useCallback((field: string, value: string): string => {
    switch (field) {
      case 'ownerName':
        if (!value.trim()) return 'Owner name is required';
        if (value.trim() && !OWNER_NAME_REGEX.test(value.trim())) return 'Invalid name format';
        break;
      case 'occupierName':
        if (!value.trim()) return 'Occupier name is required';
        if (value.trim() && !PERSON_NAME_REGEX.test(value.trim())) return 'Invalid name format';
        break;
      case 'renterName':
        if (value.trim() && !PERSON_NAME_REGEX.test(value.trim())) return 'Invalid name format';
        break;
      case 'mobileNo':
        if (value.trim() && !MOBILE_10_REGEX.test(value.trim()))
          return 'Enter valid 10-digit mobile';
        break;
      case 'emailId': {
        const email = value.trim();

        if (!email) break;

        if (!EMAIL_REGEX.test(email)) {
          return 'Enter valid email address';
        }
        break;
      }
      case 'flatOrShopNo':
        if (!value.trim()) return 'Flat/Shop No. is required';
        break;
      case 'wingName':
        if (value.trim() && !CODE_REGEX.test(value.trim())) return 'Invalid wing format';
        break;
      case 'oldPropertyNo':
        // Old property no allows digits, / and -
        break;
      case 'bhk':
       // if (!value.trim()) return 'BHK is required';
        // if (!ONE_TO_NINETY_NINE_REGEX.test(value.trim()))
        //   return 'BHK must be a number between 1 and 99';
        break;
      case 'flatOrShopName':
        if (value.trim() && !TEXT_ALLOWED.test(value.trim())) return 'Invalid shop name format';
        break;
    }
    return '';
  }, []);

  // Validate all form fields
  const validateForm = useCallback((): boolean => {
    const errors: DrawerFormErrors = {};

    errors.ownerName = validateField('ownerName', formData.ownerName) || undefined;
    errors.occupierName = validateField('occupierName', formData.occupierName) || undefined;
    errors.renterName = validateField('renterName', formData.renterName) || undefined;
    errors.mobileNo = validateField('mobileNo', formData.mobileNo) || undefined;
    errors.emailId = validateField('emailId', formData.emailId) || undefined;
    errors.flatOrShopNo = validateField('flatOrShopNo', formData.flatOrShopNo) || undefined;
    errors.wingName = validateField('wingName', formData.wingName) || undefined;
    errors.oldPropertyNo = validateField('oldPropertyNo', formData.oldPropertyNo) || undefined;
    errors.bhk = validateField('bhk', formData.bhk) || undefined;
    errors.flatOrShopName = validateField('flatOrShopName', formData.flatOrShopName) || undefined;

    // Remove undefined errors
    const filteredErrors = Object.fromEntries(
      Object.entries(errors).filter(([, v]) => v !== undefined)
    ) as DrawerFormErrors;

    setFormErrors(filteredErrors);
    return Object.keys(filteredErrors).length === 0;
  }, [formData, validateField, setFormErrors]);

  // Validate year (4 digits, reasonable range)
  const validateYear = useCallback((year: string): string => {
    if (!year.trim()) return '';
    if (!YEAR_REGEX.test(year)) return 'Enter 4-digit year';
    const yearNum = parseInt(year, 10);
    if (yearNum < 1900 || yearNum > 2100) return 'Year out of range';
    return '';
  }, []);

  // Validate floor data years
  const validateFloorYears = useCallback((): string[] => {
    const yearErrors: string[] = [];
    floorData.forEach((row, index) => {
      const conYearError = validateYear(row.conYear);
      const asstYearError = validateYear(row.asstYear);
      if (conYearError) yearErrors.push(`Row ${index + 1}: Construction Year - ${conYearError}`);
      if (asstYearError) yearErrors.push(`Row ${index + 1}: Assessment Year - ${asstYearError}`);
    });
    return yearErrors;
  }, [floorData, validateYear]);

  // Handler for field blur validation
  const handleFieldBlur = useCallback(
    (field: keyof DrawerFormErrors) => {
      const value = formData[field as keyof DrawerFormData] || '';
      const error = validateField(field, value);
      setFormErrors((prev) => ({ ...prev, [field]: error || undefined }));
    },
    [formData, validateField, setFormErrors]
  );

  return {
    validateField,
    validateForm,
    validateYear,
    validateFloorYears,
    handleFieldBlur,
  };
}
