"use client";

import { useState, useCallback } from "react";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { submitAssetForm } from "@/app/[locale]/assets/municipal-Asset/new-add-new-asset/submit/action";
import { buildAssetSubmitFormData } from "@/hooks/asset/municipal-Asset/new-add-new-asset/useAssetSubmit.utils";
import { validateBuildingBasicInfo } from "@/lib/validation/asset/new-add-new-asset";
import type { AssetFormData } from "@/types/asset/municipal-Asset/new-add-new-asset/asset-wizard.types";
import type { UseNASaveActionsParams } from "@/types/asset/municipal-Asset/new-add-new-asset/form-orchestrator.types";

export type { UseNASaveActionsParams };

export function useNASaveActions({
  formData,
  basicInfoFiles,
  extraBasicInfoFiles,
  setContextSubmittedOnce,
  setContextErrors,
  contextUpdateFormData,
  setLastSavedFormData,
}: UseNASaveActionsParams) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const executeSave = useCallback(
    async (isDraft: boolean, onSuccess?: () => void) => {
      setIsSubmitting(true);
      try {
        const clientFormData = buildAssetSubmitFormData(
          formData,
          basicInfoFiles,
          extraBasicInfoFiles
        );
        const result = await submitAssetForm(clientFormData);

        if (result.success) {
          const newAssetId = result.assetId || formData.id;
          const newAssetCode =
            result.assetCode ||
            result.data?.assetCode ||
            result.data?.assetNo ||
            formData.assetCode;

          const updates: Partial<AssetFormData> = {};
          if (newAssetId) {
            updates.id = newAssetId;
            updates.assetId = newAssetId;
          }
          if (newAssetCode) updates.assetCode = newAssetCode;

          if (Object.keys(updates).length > 0) {
            contextUpdateFormData(updates);
          }

          if (!isDraft && setLastSavedFormData) {
            setLastSavedFormData(
              JSON.parse(JSON.stringify({ ...formData, ...updates })) as AssetFormData
            );
          }

          const nextParams = new URLSearchParams(searchParams.toString());
          if (newAssetId) {
            nextParams.set("id", String(newAssetId));
            nextParams.set("assetId", String(newAssetId));
          }
          if (newAssetCode) {
            nextParams.set("assetCode", String(newAssetCode));
          }

          toast.success(
            isDraft
              ? "Draft saved successfully."
              : "Asset details saved successfully."
          );

          if (onSuccess) {
            onSuccess();
          } else {
            router.replace(`${pathname}?${nextParams.toString()}`, { scroll: false });
          }
        } else {
          const rawError = String(result.error || result.message || "Unknown error");
          const isDuplicateMpms = /(?:mpms.*(?:duplicate|unique|already exist)|(?:duplicate|unique|already exist).*mpms|ix_[\s]*mpms)/i.test(rawError);

          if (isDuplicateMpms && setContextErrors) {
            setContextErrors({
              mpmsNo: `Asset with MPMS No. "${formData.mpmsNo || ""}" already exists in database. Please enter a unique MPMS No.`,
            });
            if (setContextSubmittedOnce) {
              setContextSubmittedOnce(true);
            }
          }

          toast.error(
            isDuplicateMpms
              ? `Don't Enter Duplicate MPMSNo "${formData.mpmsNo || ""}"  (${rawError})`
              : `Failed to save${isDraft ? " draft" : ""}: ${rawError}`
          );
        }
      } catch (_err) {
        toast.error(
          `An unexpected error occurred while saving ${isDraft ? "the draft" : "the asset"
          }.`
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      formData,
      basicInfoFiles,
      extraBasicInfoFiles,
      contextUpdateFormData,
      setLastSavedFormData,
      searchParams,
      pathname,
      setContextErrors,
      setContextSubmittedOnce,
      router,
    ]
  );

  const handleSaveAndNext = useCallback(
    async (onSuccess: () => void) => {
      setContextSubmittedOnce?.(true);
      const validationErrors = validateBuildingBasicInfo(formData);
      setContextErrors?.(validationErrors as Record<string, string>);

      if (Object.keys(validationErrors).length > 0) {
        toast.error("Please fill in all required fields before proceeding.");
        return;
      }

      await executeSave(false, onSuccess);
    },
    [setContextSubmittedOnce, setContextErrors, formData, executeSave]
  );

  const handleSaveAsDraft = useCallback(async () => {
    await executeSave(true);
  }, [executeSave]);

  return {
    isSubmitting,
    handleSaveAndNext,
    handleSaveAsDraft,
  };
}
