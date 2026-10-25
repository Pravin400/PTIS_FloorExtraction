import { useCallback, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import type { ApartmentQCDetail } from "@/types/apartmentQC.types";
import type { Floor } from "@/types/floor.types";
import type { ConstructionType } from "@/types/construction.types";
import type { UseType, UseSubType } from "@/types/typeOfUse.types";
import { logger } from "@/lib/utils/logger";
import { usePropertyEditScreenState } from "./usePropertyEditScreenState";
import { usePropertyEditScreenDropdowns } from "./usePropertyEditScreenDropdowns";
import { usePropertyEditScreenFloorQC } from "./usePropertyEditScreenFloorQC";
import { usePropertyEditScreenValidation } from "./usePropertyEditScreenValidation";
import { usePropertyEditScreenSubmission } from "./usePropertyEditScreenSubmission";
import type { DrawerFloorDataRow } from "../../types/propertyEditScreenDrawer.types";

interface UsePropertyEditScreenDrawerArgs {
  open: boolean;
  onClose?: () => void;
  onSaveOrClose?: () => void;
  propertyData?: ApartmentQCDetail | null;
  subTabProp?: string;
  floors?: Floor[];
  constructionTypes?: ConstructionType[];
  useTypes?: UseType[];
  allSubTypes?: UseSubType[];
  initialFloorQCData?: ApartmentQCDetail[];
  initialPropertyTypes?: Array<{ value: string; label: string }>;
}

/**
 * Main orchestrator hook for Property Edit Screen Drawer
 * Composes all sub-hooks for state, dropdowns, floor QC, validation, and submission
 */
export function usePropertyEditScreenDrawer({
  open,
  onClose,
  onSaveOrClose,
  propertyData,
  subTabProp = "rateable",
  floors = [],
  constructionTypes = [],
  useTypes = [],
  allSubTypes = [],
  initialFloorQCData,
  initialPropertyTypes,
}: UsePropertyEditScreenDrawerArgs) {
  // ── State hook ──────────────────────────────────────────────────────────────
  const stateHook = usePropertyEditScreenState({ open, propertyData });

  // ── Dropdowns hook ──────────────────────────────────────────────────────────
  const dropdownsHook = usePropertyEditScreenDropdowns({
    floors,
    constructionTypes,
    useTypes,
    allSubTypes,
    initialPropertyTypes,
    setLoadedFloorOptions: stateHook.setLoadedFloorOptions,
    setLoadedConTypeOptions: stateHook.setLoadedConTypeOptions,
    setLoadedUseTypeOptions: stateHook.setLoadedUseTypeOptions,
    setLoadedSubTypeOptions: stateHook.setLoadedSubTypeOptions,
    setIsLoadingFloors: stateHook.setIsLoadingFloors,
    setIsLoadingConTypes: stateHook.setIsLoadingConTypes,
    setIsLoadingUseTypes: stateHook.setIsLoadingUseTypes,
    setPropertyTypeOptions: stateHook.setPropertyTypeOptions,
    setIsLoadingPropertyTypes: stateHook.setIsLoadingPropertyTypes,
    loadedFloorOptions: stateHook.loadedFloorOptions,
    loadedConTypeOptions: stateHook.loadedConTypeOptions,
    loadedUseTypeOptions: stateHook.loadedUseTypeOptions,
    loadedSubTypeOptions: stateHook.loadedSubTypeOptions,
    prePopulatedFloors: stateHook.prePopulatedFloors,
    prePopulatedConstTypes: stateHook.prePopulatedConstTypes,
    prePopulatedUseTypes: stateHook.prePopulatedUseTypes,
    prePopulatedSubTypes: stateHook.prePopulatedSubTypes,
    isLoadingFloors: stateHook.isLoadingFloors,
    isLoadingConTypes: stateHook.isLoadingConTypes,
    isLoadingUseTypes: stateHook.isLoadingUseTypes,
    propertyTypesLoadedRef: stateHook.propertyTypesLoadedRef,
  });

  // ── Floor QC hook ───────────────────────────────────────────────────────────
  const floorQCHook = usePropertyEditScreenFloorQC({
    open,
    propertyData,
    subTabProp,
    initialFloorQCData,
    setFloorData: stateHook.setFloorData,
    setIsLoadingFloorQCData: stateHook.setIsLoadingFloorQCData,
    setPrePopulatedFloors: stateHook.setPrePopulatedFloors,
    setPrePopulatedConstTypes: stateHook.setPrePopulatedConstTypes,
    setPrePopulatedUseTypes: stateHook.setPrePopulatedUseTypes,
    setPrePopulatedSubTypes: stateHook.setPrePopulatedSubTypes,
    floorDataInitializedRef: stateHook.floorDataInitializedRef,
    prevFloorQCParamsRef: stateHook.prevFloorQCParamsRef,
    loadedFloorOptions: stateHook.loadedFloorOptions,
    loadedConTypeOptions: stateHook.loadedConTypeOptions,
    loadedUseTypeOptions: stateHook.loadedUseTypeOptions,
    loadedSubTypeOptions: stateHook.loadedSubTypeOptions,
  });

  // ── Validation hook ─────────────────────────────────────────────────────────
  const validationHook = usePropertyEditScreenValidation({
    formData: stateHook.formData,
    floorData: stateHook.floorData,
    setFormErrors: stateHook.setFormErrors,
  });

  // ── Submission hook ─────────────────────────────────────────────────────────
  const submissionHook = usePropertyEditScreenSubmission({
    propertyData,
    formData: stateHook.formData,
    validateForm: validationHook.validateForm,
    validateFloorYears: validationHook.validateFloorYears,
    onSaveOrClose,
  });

  // ── Room Submission Management ──────────────────────────────────────────────
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  
  const roomDrawerOpen = searchParams.get('roomDrawer') === 'open';
  const roomPdnId = searchParams.get('roomPdnId');
  const roomPropertyId = searchParams.get('roomPropertyId'); // Read from URL params

  const handleOpenRoomSubmission = useCallback(async (row: DrawerFloorDataRow) => {
    const propertyId = propertyData?.id;
    if (!row.pdnId || !propertyId) {
      logger.error('[Room Submission] Missing pdnId or propertyId');
      return;
    }

    // Update URL params to show room drawer
    const params = new URLSearchParams(searchParams.toString());
    params.set('roomDrawer', 'open');
    params.set('roomPdnId', String(row.pdnId));
    params.set('roomPropertyId', String(propertyId));
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });

    // API call will be handled by RoomWiseSubmission component on mount
  }, [propertyData?.id, searchParams, pathname, router]);

  const handleCloseRoomDrawer = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('roomDrawer');
    params.delete('roomPdnId');
    params.delete('roomPropertyId');
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [searchParams, pathname, router]);

  // ── Photo Viewer State ──────────────────────────────────────────────────────
  const [photoViewerOpen, setPhotoViewerOpen] = useState(false);
  
  const handleOpenPhotoViewer = useCallback(() => {
    setPhotoViewerOpen(true);
  }, []);

  const handleClosePhotoViewer = useCallback(() => {
    setPhotoViewerOpen(false);
  }, []);


  // ── Close handler ───────────────────────────────────────────────────────────
  const handleClose = () => {
    setPhotoViewerOpen(false);
    onClose?.();
  };

  return {
    // Photo Viewer
    photoViewerOpen,
    handleOpenPhotoViewer,
    handleClosePhotoViewer,
    // State
    isBasicInfoOpen: stateHook.isBasicInfoOpen,
    setIsBasicInfoOpen: stateHook.setIsBasicInfoOpen,
    isFloorQCOpen: stateHook.isFloorQCOpen,
    setIsFloorQCOpen: stateHook.setIsFloorQCOpen,
    dualMethodTab: stateHook.dualMethodTab,
    setDualMethodTab: stateHook.setDualMethodTab,
    formData: stateHook.formData,
    formErrors: stateHook.formErrors,
    updateFormField: stateHook.updateFormField,
    floorData: stateHook.floorData,
    updateFloorRow: stateHook.updateFloorRow,
    isLoadingFloorQCData: stateHook.isLoadingFloorQCData,
    isSavingFloorQC: stateHook.isSavingFloorQC,
    propertyTypeOptions: stateHook.propertyTypeOptions,
    isLoadingPropertyTypes: stateHook.isLoadingPropertyTypes,
    // Dropdowns
    floorOptions: dropdownsHook.mergedFloorOptions,
    conTypeOptions: dropdownsHook.mergedConTypeOptions,
    useTypeOptions: dropdownsHook.mergedUseTypeOptions,
    getSubTypeOptionsForUseType: dropdownsHook.getSubTypeOptionsForUseType,
    handleFloorDropdownClick: dropdownsHook.handleFloorDropdownClick,
    handleConTypeDropdownClick: dropdownsHook.handleConTypeDropdownClick,
    handleUseTypeDropdownClick: dropdownsHook.handleUseTypeDropdownClick,
    isLoadingFloors: stateHook.isLoadingFloors,
    isLoadingConTypes: stateHook.isLoadingConTypes,
    isLoadingUseTypes: stateHook.isLoadingUseTypes,
    // Floor QC
    subTab: floorQCHook.subTab,
    updateFloorRowArea: floorQCHook.updateFloorRowArea,
    updateFloorRowCount: floorQCHook.updateFloorRowCount,
    refetchFloorQC: floorQCHook.refetchFloorQC,
    // Dropdowns (expose loaded options for label resolution)
    loadedFloorOptions: stateHook.loadedFloorOptions,
    loadedConTypeOptions: stateHook.loadedConTypeOptions,
    loadedUseTypeOptions: stateHook.loadedUseTypeOptions,
    loadedSubTypeOptions: stateHook.loadedSubTypeOptions,
    // Validation
    validateField: validationHook.validateField,
    handleFieldBlur: validationHook.handleFieldBlur,
    // Submission
    handleSave: submissionHook.handleSave,
    // Actions
    handleClose,
    // Room Submission
    roomDrawerOpen,
    roomPdnId,
    roomPropertyId,
    handleOpenRoomSubmission,
    handleCloseRoomDrawer,
  };
}
