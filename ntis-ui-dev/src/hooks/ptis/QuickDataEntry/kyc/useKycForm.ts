import { useRef } from 'react';
import { OwnerTypeApiItem, KycDetails } from '@/types/property-kyc.types';
import type { ConfirmContextType } from '@/components/common/ConfirmProvider';
import { useKycFormState } from './useKycFormState';
import { useKycFormValidation } from './useKycFormValidation';
import { useKycFormSubmission } from './useKycFormSubmission';

interface UseKycFormProps {
  KycDetailsData?: KycDetails | null;
  OwnerTypeMasterList?: OwnerTypeApiItem[];
  locale: string;
}

/**
 * Main KYC form hook - orchestrates state, validation, and submission
 * 
 * This hook composes three smaller focused hooks:
 * - useKycFormState: Form state management and initialization
 * - useKycFormValidation: Change detection and validation logic
 * - useKycFormSubmission: Form submission and API integration
 * 
 * @param config - Configuration object with KYC data, owner types, and locale
 * @param t - Translation function
 * @param confirm - Confirmation dialog function
 * @param router - Next.js router for page refresh
 * @returns Complete form interface (state, validation, handlers)
 * 
 * @example
 * ```tsx
 * const kycForm = useKycForm(
 *   { KycDetailsData, OwnerTypeMasterList, locale },
 *   t,
 *   confirm,
 *   router
 * );
 * 
 * return (
 *   <form ref={kycForm.formRef} onSubmit={kycForm.handleSubmit}>
 *     <KycFormFields {...kycForm} />
 *     <button disabled={!kycForm.hasChanges}>Save</button>
 *   </form>
 * );
 * ```
 */
export const useKycForm = (
  { KycDetailsData, OwnerTypeMasterList = [], locale }: UseKycFormProps,
  t: (key: string) => string,
  confirm: ConfirmContextType['confirm'],
  router: { refresh: () => void }
) => {
  const formRef = useRef<HTMLFormElement>(null);

  // State management hook
  const {
    formData,
    setFormData,
    mobileInput,
    alternateMobileInput,
    aadharInput,
    isSubmitted,
    setIsSubmitted,
    ownerTypeOptions,
  } = useKycFormState(KycDetailsData, OwnerTypeMasterList);

  // Validation hook
  const { hasChanges, canSubmit } = useKycFormValidation(
    formData,
    mobileInput,
    alternateMobileInput,
    aadharInput,
    KycDetailsData
  );

  // Submission hook
  const { handleSubmit, isUpdating } = useKycFormSubmission(
    {
      formData,
      mobileInput,
      alternateMobileInput,
      aadharInput,
      KycDetailsData,
      OwnerTypeMasterList,
      locale,
      canSubmit,
      setIsSubmitted,
      hasChanges,
    },
    t,
    confirm,
    router
  );

  return {
    formRef,
    formData,
    setFormData,
    mobileInput,
    alternateMobileInput,
    aadharInput,
    isUpdating,
    hasChanges,
    isSubmitted,
    ownerTypeOptions,
    canSubmit,
    handleSubmit,
  };
};