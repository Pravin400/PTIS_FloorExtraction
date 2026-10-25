import { useCallback, useTransition } from "react";
import { toast } from "sonner";
import { getUserIdFromCookie } from "@/lib/utils/cookie";
import {
  updateBasicDetailsAction,
  BasicDetailsUpdatePayload,
} from "@/app/[locale]/property-tax/ptis/appartmentQC/action";
import type { ApartmentQCDetail } from "@/types/apartmentQC.types";
import { DrawerFormData } from "../../types/propertyEditScreenDrawer.types";


interface UsePropertyEditScreenSubmissionArgs {
  propertyData?: ApartmentQCDetail | null;
  formData: DrawerFormData;
  validateForm: () => boolean;
  validateFloorYears: () => string[];
  onSaveOrClose?: () => void;
}

/**
 * Hook for handling form submission (basic details + floor QC)
 */
export function usePropertyEditScreenSubmission({
  propertyData,
  formData,
  validateForm,
  validateFloorYears,
  onSaveOrClose,
}: UsePropertyEditScreenSubmissionArgs) {
  const [, startTransition] = useTransition();

  const handleSave = useCallback(async () => {
    if (!propertyData?.id) {
      toast.error("Property ID is missing");
      return;
    }

    // Validate basic details form
    if (!validateForm()) {
      toast.error("Please fix validation errors before saving");
      return;
    }

    // Validate floor QC years
    const yearErrors = validateFloorYears();
    if (yearErrors.length > 0) {
      toast.error(`Floor QC validation errors: ${yearErrors[0]}`);
      return;
    }

    startTransition(async () => {
      let basicDetailsSuccess = false;

      // 1. Save Basic Details
      const basicPayload: BasicDetailsUpdatePayload = {
        ownerName: formData.ownerName || undefined,
        occupierName: formData.occupierName || undefined,
        renterName: formData.renterName || undefined,
        propertyType: formData.propertyTypeId ? parseInt(formData.propertyTypeId, 10) : undefined,
        bhk: formData.bhk || undefined,
        mobileNo: formData.mobileNo || undefined,
        emailId: formData.emailId || undefined,
        wing: formData.wingName || undefined,
        flatOrShopNo: formData.flatOrShopNo || undefined,
        flatOrShopName: formData.flatOrShopName || undefined,
        oldPropertyNo: formData.oldPropertyNo || undefined,
        updatedBy: getUserIdFromCookie() || 1,
      };

      const basicResult = await updateBasicDetailsAction(propertyData.id, basicPayload);

      if (basicResult.success) {
        basicDetailsSuccess = true;
      } else {
        toast.error(basicResult.error || "Failed to update basic details");
      }

      // Show success message
      if (basicDetailsSuccess) {
        toast.success("Basic details updated successfully");
        onSaveOrClose?.();
      }
    });
  }, [
    propertyData,
    formData,
    validateForm,
    validateFloorYears,
    onSaveOrClose,
  ]);

  return { handleSave };
}
