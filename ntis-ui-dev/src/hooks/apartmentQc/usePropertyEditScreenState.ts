import { useState, useRef, useEffect, useCallback } from "react";
import type { ApartmentQCDetail } from "@/types/apartmentQC.types";
import { getPropertyTypeByIdAction } from "@/app/[locale]/property-tax/propertytype/action";
import { DrawerFormData, DrawerFormErrors, DrawerFloorDataRow, DrawerDropdownOption, DrawerSubTypeOption, INITIAL_DRAWER_FORM_DATA } from "../../types/propertyEditScreenDrawer.types";
import { OWNER_NAME_SANITIZE, TEXT_SANITIZE, limitOldPropertyNo } from "@/lib/utils/validation-rules";

interface UsePropertyEditScreenStateArgs { open: boolean; propertyData?: ApartmentQCDetail | null; }

/**
 * Hook for managing Property Edit Screen Drawer state
 */
export function usePropertyEditScreenState({ open, propertyData }: UsePropertyEditScreenStateArgs) {
  // UI State
  const [isBasicInfoOpen, setIsBasicInfoOpen] = useState(true);
  const [isFloorQCOpen, setIsFloorQCOpen] = useState(true);
  const [dualMethodTab, setDualMethodTab] = useState<"rateable" | "capital">("rateable");
  // Form State
  const [formData, setFormData] = useState<DrawerFormData>(INITIAL_DRAWER_FORM_DATA);
  const [formErrors, setFormErrors] = useState<DrawerFormErrors>({});
  // Floor QC Data
  const [floorData, setFloorData] = useState<DrawerFloorDataRow[]>([]);
  const [isLoadingFloorQCData, setIsLoadingFloorQCData] = useState(false);
  // Dropdown States
  const [loadedFloorOptions, setLoadedFloorOptions] = useState<DrawerDropdownOption[]>([]);
  const [loadedConTypeOptions, setLoadedConTypeOptions] = useState<DrawerDropdownOption[]>([]);
  const [loadedUseTypeOptions, setLoadedUseTypeOptions] = useState<DrawerDropdownOption[]>([]);
  const [loadedSubTypeOptions, setLoadedSubTypeOptions] = useState<DrawerSubTypeOption[]>([]);
  const [isLoadingFloors, setIsLoadingFloors] = useState(false);
  const [isLoadingConTypes, setIsLoadingConTypes] = useState(false);
  const [isLoadingUseTypes, setIsLoadingUseTypes] = useState(false);
  const [prePopulatedFloors, setPrePopulatedFloors] = useState<DrawerDropdownOption[]>([]);
  const [prePopulatedConstTypes, setPrePopulatedConstTypes] = useState<DrawerDropdownOption[]>([]);
  const [prePopulatedUseTypes, setPrePopulatedUseTypes] = useState<DrawerDropdownOption[]>([]);
  const [prePopulatedSubTypes, setPrePopulatedSubTypes] = useState<DrawerDropdownOption[]>([]);
  const [propertyTypeOptions, setPropertyTypeOptions] = useState<DrawerDropdownOption[]>([]);
  const [isLoadingPropertyTypes, setIsLoadingPropertyTypes] = useState(false);
  const [isSavingFloorQC, setIsSavingFloorQC] = useState(false);
  // Refs
  const formInitializedRef = useRef(false);
  const prevPropertyIdRef = useRef<string | number | null>(null);
  const floorDataInitializedRef = useRef(false);
  const prevFloorQCParamsRef = useRef<{ propertyId: number | null; type: string }>({ propertyId: null, type: "" });
  const propertyTypesLoadedRef = useRef(false);
  const loadedDropdownsRef = useRef<Set<string>>(new Set());

  // Reset everything when the drawer's `open` flips. We run resets in the
  // effect cleanup (rather than the body) so React's `set-state-in-effect`
  // rule isn't tripped — cleanups are exempt and fire on the next run too.
  useEffect(() => {
    if (open) return;
    // Snapshot the ref's current Set so the cleanup doesn't reference
    // a possibly-newer value at cleanup time (react-hooks/exhaustive-deps).
    const dropdownsSet = loadedDropdownsRef.current;
    return () => {
      setLoadedFloorOptions([]);
      setLoadedConTypeOptions([]);
      setLoadedUseTypeOptions([]);
      setLoadedSubTypeOptions([]);
      setIsLoadingFloors(false);
      setIsLoadingConTypes(false);
      setIsLoadingUseTypes(false);
      setFloorData([]);
      setIsLoadingFloorQCData(false);
      floorDataInitializedRef.current = false;
      prevFloorQCParamsRef.current = { propertyId: null, type: "" };
      dropdownsSet.clear();
      setPrePopulatedFloors([]);
      setPrePopulatedConstTypes([]);
      setPrePopulatedUseTypes([]);
      setPrePopulatedSubTypes([]);
    };
  }, [open]);

  // Initialize form from propertyData
  useEffect(() => {
    const currentId = propertyData?.id;
    if (currentId !== prevPropertyIdRef.current) { 
      prevPropertyIdRef.current = currentId || null; 
      formInitializedRef.current = false; 
    }
    if (propertyData && !formInitializedRef.current) {
      formInitializedRef.current = true;
      setFormData({
        ownerName: propertyData.ownerName || "",
        occupierName: propertyData.occupierName || "",
        renterName: propertyData.renterName || "",
        propertyDescription: "",
        propertyTypeId: propertyData.propertyType ? String(propertyData.propertyType) : "",
        bhk: String(propertyData.bhk || ""),
        mobileNo: propertyData.mobileNo || "",
        emailId: propertyData.emailId || "",
        flatOrShopName: propertyData.flatOrShopName || "",
        wingName: propertyData.wing || "",
        flatOrShopNo: propertyData.flatOrShopNo || "",
        oldPropertyNo: propertyData.oldPropertyNo || "",
        remark: String(propertyData.remark || ""),
        oldRV: propertyData.oldRV != null ? String(propertyData.oldRV) : "",
        newRV: propertyData.rVorCVValue != null ? String(propertyData.rVorCVValue) : "",
        oldTax: propertyData.oldTotalTax != null ? String(propertyData.oldTotalTax) : "",
        newTax: propertyData.newTaxTotal != null ? String(propertyData.newTaxTotal) : "",
        oldArea: propertyData.oldConstructionArea != null ? String(propertyData.oldConstructionArea) : "",
        newArea: propertyData.carpetASqMtr != null ? String(propertyData.carpetASqMtr) : (propertyData.builtupASqMtr != null ? String(propertyData.builtupASqMtr) : ""),
        oldUseType: propertyData.oldUseType || "",
        oldConstructionType: propertyData.oldConstructionType || "",
        oldCSN: propertyData.oldCSN || "",
        oldConstructionYear: propertyData.oldConstructionYear || "",
      });
      if (propertyData.propertyType && typeof propertyData.propertyType === "number") {
        getPropertyTypeByIdAction(propertyData.propertyType).then((res) => {
          if (res?.propertyDescription) setFormData((prev) => ({ ...prev, propertyDescription: res.propertyDescription }));
        }).catch(() => {});
      }
    }
  }, [propertyData]);

  const updateFormField = useCallback((field: keyof DrawerFormData, value: string) => {
    let sanitizedValue = value;
    
    // Sanitize input based on field type (like ConstructionTypeForm)
    switch (field) {
      // Person name fields - allow only letters, spaces, period, comma, apostrophe, hyphen
      case "ownerName":
      case "occupierName":
      case "renterName":
        sanitizedValue = value.replace(OWNER_NAME_SANITIZE, "");
        break;
      // Code/identifier fields - allow only alphanumeric and underscore
      case "wingName":
      case "oldPropertyNo":
        sanitizedValue = limitOldPropertyNo(value);
        break;
      // Text fields - allow letters, numbers, spaces, basic punctuation
      case "flatOrShopName":
        sanitizedValue = value.replace(TEXT_SANITIZE, "");
        break;
      // BHK - only digits
      case "bhk":
        sanitizedValue = value.replace(/[^0-9]/g, "");
        break;
      // Mobile - only digits, max 10
      case "mobileNo":
        sanitizedValue = value.replace(/[^0-9]/g, "").substring(0, 10);
        break;
      // FlatOrShopNo - alphanumeric with some special chars
      case "flatOrShopNo":
        sanitizedValue = value.replace(/[^\p{L}\p{M}\p{N}\s\-\/]/gu, "");
        break;
      // Default - no sanitization
      default:
        break;
    }
    
    setFormData((prev) => ({ ...prev, [field]: sanitizedValue }));
    setFormErrors((prev) => ({ ...prev, [field]: undefined }));
  }, []);

  const updateFloorRow = useCallback((id: string, field: keyof DrawerFloorDataRow, value: string) => {
    setFloorData((prev) => prev.map((row) => row.id === id ? { ...row, [field]: value, ...(field === "typeOfUseId" ? { subTypeOfUseId: "" } : {}) } : row));
  }, []);

  useEffect(() => {
    const dropdownsSet = loadedDropdownsRef.current;
    return () => {
      formInitializedRef.current = false;
      floorDataInitializedRef.current = false;
      prevPropertyIdRef.current = null;
      dropdownsSet.clear();
    };
  }, [floorDataInitializedRef, formInitializedRef, loadedDropdownsRef, prevPropertyIdRef]);

  return {
    isBasicInfoOpen, setIsBasicInfoOpen, isFloorQCOpen, setIsFloorQCOpen, dualMethodTab, setDualMethodTab,
    formData, setFormData, formErrors, setFormErrors, updateFormField,
    floorData, setFloorData, updateFloorRow, isLoadingFloorQCData, setIsLoadingFloorQCData,
    loadedFloorOptions, setLoadedFloorOptions, loadedConTypeOptions, setLoadedConTypeOptions,
    loadedUseTypeOptions, setLoadedUseTypeOptions, loadedSubTypeOptions, setLoadedSubTypeOptions,
    prePopulatedFloors, setPrePopulatedFloors, prePopulatedConstTypes, setPrePopulatedConstTypes,
    prePopulatedUseTypes, setPrePopulatedUseTypes, prePopulatedSubTypes, setPrePopulatedSubTypes,
    isLoadingFloors, setIsLoadingFloors, isLoadingConTypes, setIsLoadingConTypes, isLoadingUseTypes, setIsLoadingUseTypes,
    propertyTypeOptions, setPropertyTypeOptions, isLoadingPropertyTypes, setIsLoadingPropertyTypes, propertyTypesLoadedRef,
    isSavingFloorQC, setIsSavingFloorQC, loadedDropdownsRef, floorDataInitializedRef, prevFloorQCParamsRef,
  };
}
