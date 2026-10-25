"use client";

import { createContext, useContext, useState, ReactNode, useEffect, useCallback, useMemo } from "react";

import type {
  AssetFormContextType,
  AssetFormData,
  ExtraBasicInfoFileItem,
} from "@/types/asset/municipal-Asset/new-add-new-asset/asset-wizard.types";
import type { AssetDocumentListItem } from "@/types/asset/municipal-Asset/new-add-new-asset/detail-tabs.types";
import { useSearchParams } from "next/navigation";
import { useAssetFormHandlers } from "@/hooks/asset/municipal-Asset/new-add-new-asset/useAssetFormHandlers";

export const DEFAULT_ASSET_MODULE_ID = 2;

// NA = NewAddNewAsset — independent copy of AssetFormContext
export const NAAssetFormContext = createContext<AssetFormContextType | undefined>(undefined);

export function NAAssetFormProvider({
  children,
  initialFallbackModuleId = DEFAULT_ASSET_MODULE_ID,
}: {
  children: ReactNode;
  initialFallbackModuleId?: number;
}) {
  const searchParams = useSearchParams();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submittedOnce, setSubmittedOnce] = useState(false);
  const [onSubmitHook, setOnSubmitHook] = useState<(() => Promise<boolean>) | null>(null);
  const [stagedFiles, setStagedFiles] = useState<Record<number, { file: File; definition: AssetDocumentListItem }>>({});
  const [basicInfoFiles, setBasicInfoFiles] = useState<{ frontPhoto?: File; buildingPlan?: File }>({});
  const [extraBasicInfoFiles, setExtraBasicInfoFiles] = useState<Record<string, ExtraBasicInfoFileItem[]>>({});
  const [subunitFiles, setSubunitFiles] = useState<Record<number, { photoFile?: File | null; planFile?: File | null }>>({});
  const [isDataLoading, setIsDataLoading] = useState(true);

  const registerSubmitHook = useCallback((hook: (() => Promise<boolean>) | null) => {
    setOnSubmitHook(() => hook);
  }, []);

  const [formData, setFormData] = useState<AssetFormData>(() => {
    const assetIdStr = searchParams.get("assetId") || searchParams.get("id") || "0";
    const urlAssetId = Number(assetIdStr);

    if (typeof window !== "undefined") {
      try {
        const savedSession = sessionStorage.getItem("naAssetFormData");
          if (urlAssetId > 0) {
            sessionStorage.removeItem("naAssetFormData");
          } else if (!urlAssetId && savedSession) {
            return JSON.parse(savedSession);
          }
      } catch {
        // Malformed session storage value — silently discard and fall through to default state
      }
    }

    const category = searchParams.get("category") || searchParams.get("categoryId") || "BUILDING";
    const assetType = searchParams.get("assetType") || searchParams.get("typeId") || "";
    const categoryIdStr = searchParams.get("categoryId") || "1";
    const typeIdStr = searchParams.get("typeId") || "1";
    const assetCodeStr = searchParams.get("assetCode") || "";
    const parsedAssetId = urlAssetId;

    const categoryKey = category ? category.toUpperCase() : "BUILDING";
    const isBuilding = categoryKey.includes("BUILDING");

    return {
      category: isBuilding ? "Building Assets" : categoryKey,
      isMovableCategory: undefined,
      hasFloorDetails: undefined,
      hasInventory: undefined,
      isInventoryMandatory: undefined,
      hasLegalCompliance: undefined,
      assetType: assetType || (isBuilding ? "Municipal Office" : ""),
      categoryId: categoryIdStr ? Number(categoryIdStr) : 1,
      typeId: typeIdStr ? Number(typeIdStr) : 1,
      id: parsedAssetId,
      assetId: parsedAssetId,
      assetCode: assetCodeStr || "",
      parentBuildingId: null,
      selectedParentFloorId: null,
      attributes: {},
      documents: [],
      assetName: "",
      assetNameRegional: "",
      propertyNumber: "",
      upicId: "",
      surveyNumber: "",
      plotNumber: "",
      mpmsNo: "",
      pTaxId: "",
      zone: "",
      zoneId: "",
      ward: "",
      wardId: "",
      department: "",
      departmentId: "",
      status: "Active",
      condition: "",
      isRevenueGenerating: "No",
      operationalControl: "",
      inChargeName: "",
      inChargeDesignation: "",
      inChargeMobile: "",
      inChargeEmail: "",
      officeExtension: "",
      fullAddress: "",
      locality: "",
      landmark: "",
      pinCode: "",
      latitude: "",
      longitude: "",
      surveyedBy: "Admin User",
      ownershipType: "",
      acquisitionMethod: "",
      possessionDate: "",
      agreementNumber: "",
      officeTables: 0,
      executiveChairs: 0,
      landValue: 0,
      buildingValue: 0,
      totalValue: 0,
      floors: []
    };
  });

  // Auto-save to sessionStorage on change — uses "naAssetFormData" key (separate from old "newAssetFormData")
  useEffect(() => {
    if (typeof window === "undefined" || !formData) return;
    const timer = setTimeout(() => {
      sessionStorage.setItem("naAssetFormData", JSON.stringify(formData));
    }, 300);
    return () => clearTimeout(timer);
  }, [formData]);

  const [lastSavedFormData, setLastSavedFormData] = useState<AssetFormData | null>(null);

  const updateFormData = useCallback((data: Partial<AssetFormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  }, []);

  const { handleInputChange, handleToggleChange, handleAttributeChange } = useAssetFormHandlers({ setFormData });

  const contextValue = useMemo<AssetFormContextType>(() => ({
    formData,
    setFormData,
    updateFormData,
    handleInputChange,
    handleToggleChange,
    handleAttributeChange,
    errors,
    setErrors,
    submittedOnce,
    setSubmittedOnce,
    lastSavedFormData,
    setLastSavedFormData,
    onSubmitHook,
    registerSubmitHook,
    stagedFiles,
    setStagedFiles,
    basicInfoFiles,
    setBasicInfoFiles,
    extraBasicInfoFiles,
    setExtraBasicInfoFiles,
    subunitFiles,
    setSubunitFiles,
    isDataLoading,
    setIsDataLoading,
    fallbackModuleId: initialFallbackModuleId,
  }), [
    formData,
    updateFormData,
    handleInputChange,
    handleToggleChange,
    handleAttributeChange,
    errors,
    submittedOnce,
    lastSavedFormData,
    onSubmitHook,
    registerSubmitHook,
    stagedFiles,
    basicInfoFiles,
    extraBasicInfoFiles,
    subunitFiles,
    isDataLoading,
    initialFallbackModuleId,
  ]);

  return (
    <NAAssetFormContext.Provider value={contextValue}>
      {children}
    </NAAssetFormContext.Provider>
  );
}

export function useNAAssetForm() {
  const context = useContext(NAAssetFormContext);
  if (context === undefined) {
    throw new Error("useNAAssetForm must be used within a NAAssetFormProvider");
  }
  return context;
}
