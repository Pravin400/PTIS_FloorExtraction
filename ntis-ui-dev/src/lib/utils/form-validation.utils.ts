import { KycFormData } from '@/types/property-kyc.types';
import type { useDigitInputs } from '@/hooks/useDigitInputs';

/**
 * Utility for determining if a form field should display an error state
 * 
 * @param field - The field name to check (can be a KycFormData key or special fields like 'mobile' or 'aadhar')
 * @param isValid - Whether the field's value is currently valid
 * @param formData - The current form data object
 * @param digitInputs - Object containing digit input helpers (mobile and aadhar)
 * @param isSubmitted - Whether the form has been submitted (shows all errors if true)
 * @returns boolean - true if the error should be displayed, false otherwise
 * 
 * @example
 * ```tsx
 * const shouldShowError = getFieldErrorState(
 *   'ownerName',
 *   kycValidators.isValidName(formData.ownerName ?? ''),
 *   formData,
 *   { mobile: mobileInput, aadhar: aadharInput },
 *   isSubmitted
 * );
 * ```
 */
export const getFieldErrorState = (
  field: keyof KycFormData | 'mobile' | 'alternateMobile' | 'aadhar',
  isValid: boolean,
  formData: KycFormData,
  digitInputs: {
    mobile: ReturnType<typeof useDigitInputs>;
    alternateMobile: ReturnType<typeof useDigitInputs>;
    aadhar: ReturnType<typeof useDigitInputs>;
  },
  isSubmitted: boolean = false
): boolean => {
  // If form is submitted, show all validation errors
  if (isSubmitted) return !isValid;

  // For digit inputs (mobile/alternateMobile/aadhar), show error only if:
  // - the input has been blurred (isFocused is false) and has some content, OR
  // - the input is active (isFocused is true) and is nearly complete (length >= input length - 2)
  if (field === 'mobile' || field === 'alternateMobile' || field === 'aadhar') {
    const input = digitInputs[field];
    if (!input) return false;
    const len = input.digits.length;
    return !isValid && (
      (!input.isFocused && input.value.length > 0) ||
      (input.isFocused && input.value.length >= len - 2)
    );
  }

  // For regular form fields, show error only if field has been touched (has value)
  const value = formData[field as keyof KycFormData];
  return !!value && !isValid;
};

/**
 * Factory function to create a showError helper bound to specific form context
 * 
 * @param formData - The current form data
 * @param digitInputs - Object containing digit input helpers
 * @param isSubmitted - Whether the form has been submitted
 * @returns A function that checks if a specific field should show an error
 * 
 * @example
 * ```tsx
 * const showError = createShowErrorHelper(formData, { mobile: mobileInput, alternateMobile: alternateMobileInput, aadhar: aadharInput }, isSubmitted);
 * const hasNameError = showError('ownerName', kycValidators.isValidName(formData.ownerName ?? ''));
 * ```
 */
export const createShowErrorHelper = (
  formData: KycFormData,
  digitInputs: {
    mobile: ReturnType<typeof useDigitInputs>;
    alternateMobile: ReturnType<typeof useDigitInputs>;
    aadhar: ReturnType<typeof useDigitInputs>;
  },
  isSubmitted: boolean = false
) => {
  return (field: keyof KycFormData | 'mobile' | 'alternateMobile' | 'aadhar', isValid: boolean): boolean => {
    return getFieldErrorState(field, isValid, formData, digitInputs, isSubmitted);
  };
};
