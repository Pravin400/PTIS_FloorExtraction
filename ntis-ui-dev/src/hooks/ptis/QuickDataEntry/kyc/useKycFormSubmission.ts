import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { updatePropertyKycAction } from '@/app/[locale]/property-tax/ptis/QuickDataEntry/[propertyId]/Kyc/action';
import { KycDetails, KycFormData, OwnerTypeApiItem } from '@/types/property-kyc.types';
import type { ConfirmContextType } from '@/components/common/ConfirmProvider';
import type { useDigitInputs } from '@/hooks/useDigitInputs';
import { validateKycForm } from '@/lib/utils/kyc-validation/kyc-validation.constants';
import { useQdeSaveTracker } from '@/hooks/ptis/QuickDataEntry/useQdeSaveTracker';
interface UseKycFormSubmissionProps {
  formData: KycFormData;
  mobileInput: ReturnType<typeof useDigitInputs>;
  alternateMobileInput: ReturnType<typeof useDigitInputs>;
  aadharInput: ReturnType<typeof useDigitInputs>;
  KycDetailsData?: KycDetails | null;
  OwnerTypeMasterList: OwnerTypeApiItem[];
  locale: string;
  canSubmit: () => boolean;
  setIsSubmitted: (value: boolean) => void;
  hasChanges: boolean;
}

/**
 * Hook for KYC form submission logic
 * 
 * Handles:
 * - Form submission with validation
 * - Confirmation dialog integration
 * - API calls and error handling
 * - Loading states during submission
 * - Success/error toast notifications
 * 
 * @param props - Submission configuration and dependencies
 * @param t - Translation function
 * @param confirm - Confirmation dialog function
 * @param router - Next.js router for page refresh
 * @returns Submission handler and loading state
 */
export const useKycFormSubmission = (
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
  }: UseKycFormSubmissionProps,
  t: (key: string) => string,
  confirm: ConfirmContextType['confirm'],
  router: { refresh: () => void }
) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { markChangesSaved } = useQdeSaveTracker(KycDetailsData?.propertyId);

  /**
   * Handles form submission with validation and confirmation
   */
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // ✅ RACE CONDITION GUARD: Prevent concurrent submissions
    if (isUpdating || isPending) {
      return;
    }

    setIsSubmitted(true);

    // Validate property ID
    if (!KycDetailsData?.propertyId) {
      toast.error(t('kyc.propertyIdMissing'));
      return;
    }

    // Guard 1: Require changes before allowing submit
    if (!hasChanges) {
      return;
    }

    // Guard 2: Validate form data with specific schema rules
    const validationError = validateKycForm(formData, mobileInput.value, alternateMobileInput.value, aadharInput.value, t);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    // Final safety check
    if (!canSubmit()) {
      toast.error(t('kyc.validation.pleaseFixErrors'));
      return;
    }

    // Show confirmation dialog before submitting
    confirm({
      variant: 'update',
      meta: {
        name: formData.ownerName || t('kyc.recordLabel'),
      },
      onConfirm: async () => {
        startTransition(async () => {
          setIsUpdating(true);
          try {
            // Find selected owner type name
            const selectedOwnerType =
              formData.ownerTypeId === null
                ? null
                : OwnerTypeMasterList.find(
                  (item) => item.id === formData.ownerTypeId
                )?.ownerType ?? null;

            // Build API payload
            const payload: KycDetails = {
              propertyId: KycDetailsData.propertyId,
              ownerTypeId: formData.ownerTypeId ?? null,
              ownerType: selectedOwnerType,
              adharCardNo: aadharInput.value || null,
              /** @deprecated Use adharCardNo instead. Retained for backward compatibility. */
              aadharCardNo: aadharInput.value || null,
              mobileNo: mobileInput.value ? `+${formData.mobileCountryCode || '91'}${mobileInput.value}` : null,
              alternateMobileNo: alternateMobileInput.value ? `+${formData.alternateMobileCountryCode || '91'}${alternateMobileInput.value}` : null,
              emailId: formData.emailId?.trim() || null,
              ownerTitle: formData.ownerTitle?.trim() || null,
              ownerName: formData.ownerName?.trim() || null,
              ownerNameRegional: formData.ownerName?.trim() || null,
              ownerTitleEnglish: KycDetailsData.ownerTitleEnglish ?? null,
              ownerNameEnglish: formData.ownerNameEnglish?.trim() || null,
              occupierTitle: KycDetailsData.occupierTitle ?? null,
              occupierName: formData.occupierName?.trim() || null,
              occupierNameRegional: formData.occupierName?.trim() || null,
              occupierTitleEnglish: KycDetailsData.occupierTitleEnglish ?? null,
              occupierNameEnglish: formData.occupierNameEnglish?.trim() || null,
              flatOrShopName: formData.flatOrShopName?.trim() || null,
              flatOrShopNameEnglish: formData.flatOrShopNameEnglish?.trim() || null,
              flatOrShopNo: KycDetailsData.flatOrShopNo ?? null,
              flatOrShopNoEnglish: KycDetailsData.flatOrShopNoEnglish ?? null,
              address: formData.address?.trim() || null,
              addressRegional: formData.address?.trim() || null,
              location: formData.location?.trim() || null,
              addressEnglish: formData.addressEnglish?.trim() || null,
              locationEnglish: KycDetailsData.locationEnglish ?? null,
              pinCode: formData.pinCode?.trim() || null,
            };

            // Validate propertyId before API call
            if (KycDetailsData.propertyId == null) {
              throw new Error('Invalid propertyId');
            }

            // Call API to update KYC details
            const res = await updatePropertyKycAction(
              KycDetailsData.propertyId,
              payload,
              locale
            );

            if (res.success) {
              markChangesSaved();
              toast.success(res.message);
              setIsSubmitted(false);
              router.refresh();
            } else {
              // Parse error message from API response
              let errorMessage = res.error || t('kyc.unexpectedError');
              try {
                const parsedError = JSON.parse(res.error || '');
                if (parsedError.errors) {
                  errorMessage = Object.values(parsedError.errors).flat().join('\n');
                } else if (parsedError.title) {
                  errorMessage = parsedError.title;
                }
              } catch (_error) {
                // Not a JSON string, use as is
              }
              toast.error(errorMessage);
            }
          } catch (_error) {
            toast.error(t('kyc.unexpectedError'));
          } finally {
            setIsUpdating(false);
          }
        });
      },
    });
  };

  return {
    handleSubmit,
    isUpdating: isUpdating || isPending,
  };
};
