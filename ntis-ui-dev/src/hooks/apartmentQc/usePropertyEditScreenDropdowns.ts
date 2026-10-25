import { useCallback, useEffect, useMemo } from "react";
import {
  fetchAllFloorsAction,
  fetchAllConstructionTypesAction,
  fetchAllUseTypesAction,
  fetchAllSubTypesAction,
  fetchAllPropertyTypesAction,
} from "@/app/[locale]/property-tax/ptis/appartmentQC/action";
import type { Floor } from "@/types/floor.types";
import type { ConstructionType } from "@/types/construction.types";
import type { UseType, UseSubType } from "@/types/typeOfUse.types";
import {
  DrawerDropdownOption,
  DrawerSubTypeOption,
} from "../../types/propertyEditScreenDrawer.types";

interface UsePropertyEditScreenDropdownsArgs {
  // Props passed from parent
  floors?: Floor[];
  constructionTypes?: ConstructionType[];
  useTypes?: UseType[];
  allSubTypes?: UseSubType[];
  initialPropertyTypes?: Array<{ value: string; label: string }>;
  // State setters from state hook
  setLoadedFloorOptions: React.Dispatch<React.SetStateAction<DrawerDropdownOption[]>>;
  setLoadedConTypeOptions: React.Dispatch<React.SetStateAction<DrawerDropdownOption[]>>;
  setLoadedUseTypeOptions: React.Dispatch<React.SetStateAction<DrawerDropdownOption[]>>;
  setLoadedSubTypeOptions: React.Dispatch<React.SetStateAction<DrawerSubTypeOption[]>>;
  setIsLoadingFloors: React.Dispatch<React.SetStateAction<boolean>>;
  setIsLoadingConTypes: React.Dispatch<React.SetStateAction<boolean>>;
  setIsLoadingUseTypes: React.Dispatch<React.SetStateAction<boolean>>;
  setPropertyTypeOptions: React.Dispatch<React.SetStateAction<DrawerDropdownOption[]>>;
  setIsLoadingPropertyTypes: React.Dispatch<React.SetStateAction<boolean>>;
  // Loaded options
  loadedFloorOptions: DrawerDropdownOption[];
  loadedConTypeOptions: DrawerDropdownOption[];
  loadedUseTypeOptions: DrawerDropdownOption[];
  loadedSubTypeOptions: DrawerSubTypeOption[];
  // Pre-populated options (temporary display text until master data loads)
  prePopulatedFloors: DrawerDropdownOption[];
  prePopulatedConstTypes: DrawerDropdownOption[];
  prePopulatedUseTypes: DrawerDropdownOption[];
  prePopulatedSubTypes: DrawerDropdownOption[];
  // Loading states
  isLoadingFloors: boolean;
  isLoadingConTypes: boolean;
  isLoadingUseTypes: boolean;
  // Refs
  propertyTypesLoadedRef: React.MutableRefObject<boolean>;
}

/**
 * Hook for managing dropdown data loading (on-demand via URL params)
 * Supports SSR-provided initialPropertyTypes to eliminate client-side fetching
 */
export function usePropertyEditScreenDropdowns({
  floors,
  constructionTypes,
  useTypes,
  allSubTypes,
  initialPropertyTypes,
  setLoadedFloorOptions,
  setLoadedConTypeOptions,
  setLoadedUseTypeOptions,
  setLoadedSubTypeOptions,
  setIsLoadingFloors,
  setIsLoadingConTypes,
  setIsLoadingUseTypes,
  setPropertyTypeOptions,
  setIsLoadingPropertyTypes,
  loadedFloorOptions,
  loadedConTypeOptions,
  loadedUseTypeOptions,
  loadedSubTypeOptions,
  prePopulatedFloors,
  prePopulatedConstTypes,
  prePopulatedUseTypes,
  prePopulatedSubTypes,
  isLoadingFloors,
  isLoadingConTypes,
  isLoadingUseTypes,
  propertyTypesLoadedRef,
}: UsePropertyEditScreenDropdownsArgs) {

  // ── Load property types - use SSR data if available, otherwise fetch on mount ────────────
  useEffect(() => {
    // If SSR provided property types (defined, even if empty), use them directly (no fetch needed)
    // undefined = no SSR attempted, so we should fetch
    // [] = SSR attempted but no data, so skip fetch and show empty dropdown
    if (initialPropertyTypes !== undefined) {
      if (!propertyTypesLoadedRef.current) {
        propertyTypesLoadedRef.current = true;
        setPropertyTypeOptions(initialPropertyTypes);
      }
      return;
    }
    
    // Fallback: fetch property types if not provided via SSR (initialPropertyTypes is undefined)
    if (!propertyTypesLoadedRef.current) {
      propertyTypesLoadedRef.current = true;
      setIsLoadingPropertyTypes(true);
      fetchAllPropertyTypesAction()
        .then((result) => {
          if (result.success && result.data) {
            setPropertyTypeOptions(result.data);
          }
        })
        .finally(() => setIsLoadingPropertyTypes(false));
    }
  }, [initialPropertyTypes, propertyTypesLoadedRef, setPropertyTypeOptions, setIsLoadingPropertyTypes]);

  // ── Merged floor options (pre-populated text + loaded master data) ────────
  const mergedFloorOptions: DrawerDropdownOption[] = useMemo(() => {
    // Priority: SSR data > Loaded master data > Pre-populated text values
    if (floors?.length) return floors.map((f) => ({ value: String(f.id), label: f.description || f.floorCode }));
    if (loadedFloorOptions.length > 0) return loadedFloorOptions;
    // Always return pre-populated options (even if empty) to ensure initial values display
    return prePopulatedFloors;
  }, [floors, loadedFloorOptions, prePopulatedFloors]);

  // ── Merged construction type options ────────────────────────────────────────
  const mergedConTypeOptions: DrawerDropdownOption[] = useMemo(() => {
    // Priority: SSR data > Loaded master data > Pre-populated text values
    if (constructionTypes?.length) return constructionTypes.map((c) => ({ value: String(c.id), label: c.description || c.constructionCode }));
    if (loadedConTypeOptions.length > 0) return loadedConTypeOptions;
    // Always return pre-populated options (even if empty) to ensure initial values display
    return prePopulatedConstTypes;
  }, [constructionTypes, loadedConTypeOptions, prePopulatedConstTypes]);

  // ── Merged use type options ─────────────────────────────────────────────────
  const mergedUseTypeOptions: DrawerDropdownOption[] = useMemo(() => {
    // Priority: SSR data > Loaded master data > Pre-populated text values
    if (useTypes?.length) return useTypes.map((u) => ({ value: String(u.typeOfUseId), label: u.description || u.typeOfUseCode }));
    if (loadedUseTypeOptions.length > 0) return loadedUseTypeOptions;
    // Always return pre-populated options (even if empty) to ensure initial values display
    return prePopulatedUseTypes;
  }, [useTypes, loadedUseTypeOptions, prePopulatedUseTypes]);

  // ── Merged sub type options ─────────────────────────────────────────────────
  const mergedSubTypeOptions: DrawerSubTypeOption[] = useMemo(() => {
    // Priority: SSR data > Loaded master data > Pre-populated text values
    if (allSubTypes?.length) {
      return allSubTypes.map((s) => ({
        value: String(s.subTypeOfUseId),
        label: s.description,
        typeOfUseId: String(s.typeOfUseId),
      }));
    }
    if (loadedSubTypeOptions.length > 0) return loadedSubTypeOptions;
    // Convert pre-populated sub types (no typeOfUseId mapping available)
    return prePopulatedSubTypes.map((s) => ({ ...s, typeOfUseId: "" }));
  }, [allSubTypes, loadedSubTypeOptions, prePopulatedSubTypes]);

  // ── Get sub-type options for a specific use type ────────────────────────────
  const getSubTypeOptionsForUseType = useCallback(
    (typeOfUseId: string): DrawerDropdownOption[] => {
      if (!typeOfUseId) return [];
      return mergedSubTypeOptions
        .filter((s) => s.typeOfUseId === typeOfUseId)
        .map((s) => ({ value: s.value, label: s.label }));
    },
    [mergedSubTypeOptions]
  );

  // Eager preloading has been removed to improve initial drawer load time.
  // Dropdown data will now be fetched on-demand when the user clicks the respective dropdowns in the Edit Drawer.

  // ── Trigger floor dropdown load (direct action call — no URL change) ────────
  const handleFloorDropdownClick = useCallback(() => {
    if (loadedFloorOptions.length > 0 || isLoadingFloors || floors?.length) return;
    setIsLoadingFloors(true);
    fetchAllFloorsAction()
      .then((result) => {
        if (result.success && result.data) setLoadedFloorOptions(result.data);
      })
      .finally(() => setIsLoadingFloors(false));
  }, [loadedFloorOptions.length, isLoadingFloors, floors, setLoadedFloorOptions, setIsLoadingFloors]);

  // ── Trigger construction type dropdown load (direct action call) ────────────
  const handleConTypeDropdownClick = useCallback(() => {
    if (loadedConTypeOptions.length > 0 || isLoadingConTypes || constructionTypes?.length) return;
    setIsLoadingConTypes(true);
    fetchAllConstructionTypesAction()
      .then((result) => {
        if (result.success && result.data) setLoadedConTypeOptions(result.data);
      })
      .finally(() => setIsLoadingConTypes(false));
  }, [loadedConTypeOptions.length, isLoadingConTypes, constructionTypes, setLoadedConTypeOptions, setIsLoadingConTypes]);

  // ── Trigger use type + sub type dropdown load (direct action calls) ─────────
  const handleUseTypeDropdownClick = useCallback(() => {
    if (loadedUseTypeOptions.length > 0 || isLoadingUseTypes || useTypes?.length) return;
    setIsLoadingUseTypes(true);
    Promise.all([fetchAllUseTypesAction(), fetchAllSubTypesAction()])
      .then(([useTypesResult, subTypesResult]) => {
        if (useTypesResult.success && useTypesResult.data) {
          setLoadedUseTypeOptions(useTypesResult.data);
        }
        if (subTypesResult.success && subTypesResult.data) {
          setLoadedSubTypeOptions(
            subTypesResult.data.map((s) => ({
              value: s.value,
              label: s.label,
              typeOfUseId: s.typeOfUseId,
            }))
          );
        }
      })
      .finally(() => setIsLoadingUseTypes(false));
  }, [loadedUseTypeOptions.length, isLoadingUseTypes, useTypes, setLoadedUseTypeOptions, setLoadedSubTypeOptions, setIsLoadingUseTypes]);

  return {
    mergedFloorOptions,
    mergedConTypeOptions,
    mergedUseTypeOptions,
    mergedSubTypeOptions,
    getSubTypeOptionsForUseType,
    handleFloorDropdownClick,
    handleConTypeDropdownClick,
    handleUseTypeDropdownClick,
  };
}
