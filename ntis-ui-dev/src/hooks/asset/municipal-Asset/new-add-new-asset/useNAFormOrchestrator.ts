"use client";

import { useMemo } from "react";
import { useNABuildingBasicInfoForm } from "@/hooks/asset/municipal-Asset/new-add-new-asset/building-basic-info/useNABuildingBasicInfoForm";
import { useNAAssetForm } from "@/components/modules/assets/municipal-Asset/NewAddNewAsset/NAAssetFormContext";
import { useNADynamicFields } from "./useNADynamicFields";
import { useNASaveActions } from "./useNASaveActions";
import { useNACascadeDropdowns } from "./useNACascadeDropdowns";
import { calcFloorSummary } from "@/lib/utils/asset-utils/new-add-new-asset/floor-summary.utils";
import type {
  FloorSummary,
  CascadeState,
  UseNAFormOrchestratorReturn,
} from "@/types/asset/municipal-Asset/new-add-new-asset/form-orchestrator.types";
import type {
  Zone,
  Department,
  Mouja,
  OwnershipType,
  AssetConditionOption,
  Ward,
  SubZone,
  Designation,
} from "@/types/asset/municipal-Asset/new-add-new-asset/master-data.types";
import type { ProcessedField } from "@/types/asset/municipal-Asset/new-add-new-asset/basic-info-actions.types";
import type { AssetFloorDetailItem } from "@/types/asset/municipal-Asset/new-add-new-asset/detail-tabs.types";

export type { FloorSummary, CascadeState, UseNAFormOrchestratorReturn };

export function useNAFormOrchestrator(initialLookups?: {
  zones?: Zone[];
  departments?: Department[];
  moujas?: Mouja[];
  ownershipTypes?: OwnershipType[];
  assetConditions?: AssetConditionOption[];
  wards?: Ward[];
  subzones?: SubZone[];
  designations?: Designation[];
  prefetchedFields?: ProcessedField[];
}): UseNAFormOrchestratorReturn {
  const {
    formData: contextFormData,
    basicInfoFiles,
    extraBasicInfoFiles,
    setErrors: setContextErrors,
    setSubmittedOnce: setContextSubmittedOnce,
    setLastSavedFormData,
    updateFormData: contextUpdateFormData,
  } = useNAAssetForm();

  const {
    formData,
    errors,
    showError,
    handleChange: baseHandleChange,
    handleBlur,
    handleAttributeChange,
    updateFormData,
  } = useNABuildingBasicInfoForm();

  const categoryId = Number(contextFormData.categoryId) || 0;
  const typeId = Number(contextFormData.typeId) || 0;

  const { fields: dynamicFields, loading: isDynamicLoading } = useNADynamicFields(
    categoryId,
    typeId,
    initialLookups?.prefetchedFields
  );

  const { cascade, handleChange } = useNACascadeDropdowns({
    initialLookups,
    baseHandleChange,
    updateFormData,
  });

  const floors: AssetFloorDetailItem[] = useMemo(
    () => (Array.isArray(contextFormData.floors) ? contextFormData.floors : []),
    [contextFormData.floors]
  );

  const summary = useMemo(
    () => calcFloorSummary(floors, contextFormData.capitalValue ?? undefined),
    [floors, contextFormData.capitalValue]
  );

  const assetId = Number(contextFormData.id || contextFormData.assetId) || 0;
  const assetTypeStr = contextFormData.assetType || "";
  const categoryStr = contextFormData.category || "";

  const { isSubmitting, handleSaveAndNext, handleSaveAsDraft } = useNASaveActions({
    formData,
    basicInfoFiles,
    extraBasicInfoFiles,
    setContextSubmittedOnce,
    setContextErrors,
    contextUpdateFormData,
    setLastSavedFormData,
  });

  return {
    formData,
    errors,
    showError,
    handleChange,
    handleBlur,
    handleAttributeChange,
    updateFormData,
    dynamicFields,
    isDynamicLoading,
    cascade,
    floors,
    summary,
    assetId,
    categoryId,
    typeId,
    categoryStr,
    assetTypeStr,
    isSubmitting,
    handleSaveAndNext,
    handleSaveAsDraft,
    updateContextFormData: contextUpdateFormData,
  };
}
