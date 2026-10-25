import { useState, useCallback, useTransition } from 'react';
import {
  updateFloorQCDetailsBulkAction,
  updateBasicDetailsAction,
} from '@/app/[locale]/property-tax/ptis/appartmentQC/action';
import type { FloorQCBulkUpdateItem, BasicDetailsUpdatePayload } from '@/app/[locale]/property-tax/ptis/appartmentQC/action';
import type {
  PropertyBasicInfoFormData,
  FloorDataRow,
  DropdownOption,
  PropertyEditFormCopy,
  FloorQCValidationError,
} from '@/types/propertyEdit.types';
import type { UseSubType } from '@/types/typeOfUse.types';
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { toast } from 'sonner';
import { logger } from '@/lib/utils/logger';
import { getUserIdFromCookie } from '@/lib/utils/cookie';

interface UsePropertyEditFormSubmissionArgs {
  propertyId: number;
  formData: PropertyBasicInfoFormData;
  floorData: FloorDataRow[];
  floorOptions: DropdownOption[];
  conTypeOptions: DropdownOption[];
  useTypeOptions: DropdownOption[];
  allSubTypes: UseSubType[];
  validateForm: () => boolean;
  validateFloorData: () => FloorQCValidationError[];
  copy: PropertyEditFormCopy;
}

/**
 * Hook for managing property edit form submission
 * 
 * Handles:
 * - Basic details update API call
 * - Floor QC bulk update API call
 * - Loading states
 * - Success/error toasts
 */
export function usePropertyEditFormSubmission(
  {
    propertyId,
    formData,
    floorData,
    floorOptions,
    conTypeOptions,
    useTypeOptions,
    allSubTypes,
    validateForm,
    validateFloorData,
    copy,
  }: UsePropertyEditFormSubmissionArgs,
  router: AppRouterInstance
) {
  const [isPending, startTransition] = useTransition();
  const [isSaving, setIsSaving] = useState(false);

  /**
   * Builds the basic details payload from form data
   */
  const buildBasicPayload = useCallback((): BasicDetailsUpdatePayload => {
    return {
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
  }, [formData]);

  /**
   * Builds the floor QC items payload from floor data
   */
  const buildFloorQCPayload = useCallback((): FloorQCBulkUpdateItem[] => {
    const rowsWithPdnId = floorData.filter(row => row.pdnId);
    
    return rowsWithPdnId.map(row => {
      // Find option by label or value match
      const findOption = (options: DropdownOption[], fieldValue: string) =>
        options.find(opt => opt.label === fieldValue || opt.value === fieldValue);
      
      const floorOption = findOption(floorOptions, row.floorId);
      const conTypeOption = findOption(conTypeOptions, row.constructionTypeId);
      const useTypeOption = findOption(useTypeOptions, row.typeOfUseId);
      
      // Get sub-type options for this row's use type
      const subTypeOptions = allSubTypes
        .filter(st => String(st.typeOfUseId) === String(row.typeOfUseId))
        .map((st: unknown) => {
          const subType = st as Record<string, unknown>;
          return { value: String(subType.id), label: String(subType.name || subType.code || '') };
        });
      const subTypeOption = findOption(subTypeOptions, row.subTypeOfUseId);

      return {
        detailId: row.pdnId!,
        floorId: floorOption ? parseInt(floorOption.value, 10) : undefined,
        constructionTypeId: conTypeOption ? parseInt(conTypeOption.value, 10) : undefined,
        typeOfUseId: useTypeOption ? parseInt(useTypeOption.value, 10) : undefined,
        subTypeOfUseId: subTypeOption ? parseInt(subTypeOption.value, 10) : undefined,
        constructionYear: row.conYear || undefined,
        assessmentYear: row.asstYear || undefined,
        updatedBy: getUserIdFromCookie() || 1,
      };
    });
  }, [floorData, floorOptions, conTypeOptions, useTypeOptions, allSubTypes]);

  /**
   * Main save handler
   */
  const handleSave = useCallback(async () => {
    // Validate property ID
    if (!propertyId) {
      toast.error(copy.messages.propertyIdMissing);
      return;
    }

    // Validate basic info form
    if (!validateForm()) {
      toast.error(copy.messages.validationErrors);
      return;
    }

    // Validate floor QC data
    const floorErrors = validateFloorData();
    if (floorErrors.length > 0) {
      const firstError = floorErrors[0];
      toast.error(`${copy.messages.floorQCValidationError}: Row ${firstError.rowIndex + 1} - ${firstError.message}`);
      return;
    }

    // Guard against concurrent submissions
    if (isSaving || isPending) return;

    startTransition(async () => {
      setIsSaving(true);
      let basicDetailsSuccess = false;
      let floorQCSuccess = false;

      try {
        // Update basic details
        const basicPayload = buildBasicPayload();
        const basicResult = await updateBasicDetailsAction(propertyId, basicPayload);

        if (basicResult.success) {
          basicDetailsSuccess = true;
        } else {
          toast.error(basicResult.error || copy.messages.basicDetailsUpdateFailed);
        }

        // Update floor QC details (only rows with pdnId)
        const floorQCItems = buildFloorQCPayload();
        
        if (floorQCItems.length > 0) {
          const floorQCResult = await updateFloorQCDetailsBulkAction(propertyId, floorQCItems);

          if (floorQCResult.success) {
            floorQCSuccess = true;
          } else {
            toast.error(floorQCResult.error || copy.messages.floorQCUpdateFailed);
          }
        } else {
          // No floor rows to update
          floorQCSuccess = true;
        }

        // Show success message based on what was updated
        if (basicDetailsSuccess && floorQCSuccess) {
          toast.success(copy.messages.allChangesSaved);
          router.refresh();
        } else if (basicDetailsSuccess) {
          toast.success(copy.messages.basicDetailsUpdated);
        }
      } catch (error) {
        logger.error('[PropertyEditFormSubmission] Save failed', { error: error as Error });
        toast.error(copy.messages.floorQCUpdateFailed);
      } finally {
        setIsSaving(false);
      }
    });
  }, [
    propertyId,
    validateForm,
    validateFloorData,
    isSaving,
    isPending,
    buildBasicPayload,
    buildFloorQCPayload,
    copy.messages,
    router,
  ]);

  return {
    handleSave,
    isSaving,
    isUpdating: isSaving || isPending,
  };
}
