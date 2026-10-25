import { useMemo, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getPropertyTypeByIdAction } from '@/app/[locale]/property-tax/propertytype/action';
import { logger } from '@/lib/utils/logger';
import { usePropertyEditFormState } from './usePropertyEditFormState';
import { usePropertyEditFormValidation } from './usePropertyEditFormValidation';
import { usePropertyEditFormSubmission } from './usePropertyEditFormSubmission';
import { useRoomSubmissionSidebar } from './useRoomSubmissionSidebar';
import type { ApartmentQCDetail } from '@/types/apartmentQC.types';
import type { Floor } from '@/types/floor.types';
import type { ConstructionType } from '@/types/construction.types';
import type { UseType, UseSubType } from '@/types/typeOfUse.types';
import type {
  PropertyTypeOption,
  DropdownOption,
  PropertyEditFormCopy,
  PropertyBasicInfoFormData,
} from '@/types/propertyEdit.types';

interface UsePropertyEditFormArgs {
  propertyData: ApartmentQCDetail;
  floorQCData: ApartmentQCDetail[];
  floors: Floor[];
  constructionTypes: ConstructionType[];
  useTypes: UseType[];
  allSubTypes: UseSubType[];
  propertyTypes: PropertyTypeOption[];
  copy: PropertyEditFormCopy;
}

/**
 * Main property edit form hook - orchestrates state, validation, and submission
 * 
 * This hook composes four smaller focused hooks:
 * - usePropertyEditFormState: Form state management and initialization
 * - usePropertyEditFormValidation: Field and form validation logic
 * - usePropertyEditFormSubmission: Form submission and API integration
 * - useRoomSubmissionSidebar: Room submission sidebar management
 * 
 * Following the UI_REVIEW_GUIDELINES pattern where the orchestrator hook owns
 * Next.js hooks (useRouter) and passes them to sub-hooks.
 */
export function usePropertyEditForm({
  propertyData,
  floorQCData,
  floors,
  constructionTypes,
  useTypes,
  allSubTypes,
  propertyTypes,
  copy,
}: UsePropertyEditFormArgs) {
  const router = useRouter();

  // ── Dropdown options ────────────────────────────────────────────────────────
  const floorOptions: DropdownOption[] = useMemo(() =>
    floors.map(f => ({ value: String(f.id), label: String(f.name || f.code || '') })),
    [floors]
  );

  const conTypeOptions: DropdownOption[] = useMemo(() =>
    constructionTypes.map(c => ({ value: String(c.id), label: String(c.name || c.code || '') })),
    [constructionTypes]
  );

  const useTypeOptions: DropdownOption[] = useMemo(() =>
    useTypes.map(u => ({ value: String(u.id), label: String(u.name || u.code || '') })),
    [useTypes]
  );

  const propertyTypeOptions: DropdownOption[] = useMemo(() =>
    propertyTypes.map(p => ({ value: String(p.id), label: p.propertyDescription || p.code })),
    [propertyTypes]
  );

  // ── State hook ──────────────────────────────────────────────────────────────
  const stateHook = usePropertyEditFormState({
    propertyData,
    floorQCData,
  });

  const {
    formData,
    setFormData,
    floorData,
    setFloorData,
    isBasicInfoOpen,
    setIsBasicInfoOpen,
    isFloorQCOpen,
    setIsFloorQCOpen,
    dualMethodTab,
    setDualMethodTab,
    updateFormField,
    updateFloorRow,
  } = stateHook;

  // ── Validation hook ─────────────────────────────────────────────────────────
  const validationHook = usePropertyEditFormValidation({
    formData,
    floorData,
    basicInfoCopy: copy.basicInfo,
    floorQCCopy: copy.floorQC,
  });

  const {
    errors,
    validateForm,
    validateFloorData,
    showError,
    handleBlur,
    clearFieldError,
  } = validationHook;

  // ── Submission hook ─────────────────────────────────────────────────────────
  const submissionHook = usePropertyEditFormSubmission(
    {
      propertyId: propertyData?.id,
      formData,
      floorData,
      floorOptions,
      conTypeOptions,
      useTypeOptions,
      allSubTypes,
      validateForm,
      validateFloorData,
      copy,
    },
    router
  );

  const { handleSave, isUpdating } = submissionHook;

  // ── Room submission sidebar hook ────────────────────────────────────────────
  const handleAreaUpdate = useCallback((rowId: string, newArea: string) => {
    setFloorData(prev => prev.map(row =>
      row.id === rowId ? { ...row, area: newArea } : row
    ));
  }, [setFloorData]);

  const roomSidebarHook = useRoomSubmissionSidebar({
    propertyId: propertyData?.id,
    onAreaUpdate: handleAreaUpdate,
    copy,
  });

  // ── Fetch property type description on mount ────────────────────────────────
  useEffect(() => {
    const propertyTypeId = (propertyData as unknown as Record<string, unknown>).propertyType as number;
    if (propertyTypeId && typeof propertyTypeId === 'number' && propertyTypeId > 0) {
      getPropertyTypeByIdAction(propertyTypeId)
        .then((propertyType) => {
          if (propertyType?.propertyDescription) {
            setFormData(prev => ({
              ...prev,
              propertyDescription: propertyType.propertyDescription,
            }));
          }
        })
        .catch((err) => {
          logger.error('[usePropertyEditForm] Failed to fetch property type description', { error: err as Error });
        });
    }
  }, [propertyData, setFormData]);

  // ── Field change handler with error clearing ────────────────────────────────
  const handleFieldChange = useCallback((
    field: keyof PropertyBasicInfoFormData,
    value: string
  ) => {
    updateFormField(field, value);
    clearFieldError(field as keyof typeof errors);
  }, [updateFormField, clearFieldError]);

  // ── Property type change handler (also updates description) ─────────────────
  const handlePropertyTypeChange = useCallback((value: string) => {
    handleFieldChange('propertyTypeId', value);
    const selected = propertyTypeOptions.find(opt => opt.value === value);
    handleFieldChange('propertyDescription', selected?.label || '');
  }, [handleFieldChange, propertyTypeOptions]);

  // ── Get sub-type options for a type of use ──────────────────────────────────
  const getSubTypeOptions = useCallback((typeOfUseId: string): DropdownOption[] => {
    if (!typeOfUseId) return [];
    return allSubTypes
      .filter(st => String(st.typeOfUseId) === String(typeOfUseId))
      .map((st: unknown) => {
        const subType = st as Record<string, unknown>;
        return { value: String(subType.id), label: String(subType.name || subType.code || '') };
      });
  }, [allSubTypes]);

  // ── Toggle handlers ─────────────────────────────────────────────────────────
  const toggleBasicInfo = useCallback(() => {
    setIsBasicInfoOpen(prev => !prev);
  }, [setIsBasicInfoOpen]);

  const toggleFloorQC = useCallback(() => {
    setIsFloorQCOpen(prev => !prev);
  }, [setIsFloorQCOpen]);

  // ── Back handler ────────────────────────────────────────────────────────────
  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  return {
    // State
    formData,
    floorData,
    errors,
    isBasicInfoOpen,
    isFloorQCOpen,
    dualMethodTab,
    isUpdating,

    // Dropdown options
    floorOptions,
    conTypeOptions,
    useTypeOptions,
    propertyTypeOptions,
    getSubTypeOptions,

    // Handlers
    handleFieldChange,
    handlePropertyTypeChange,
    handleBlur,
    showError,
    updateFloorRow,
    toggleBasicInfo,
    toggleFloorQC,
    setDualMethodTab,
    handleSave,
    handleBack,

    // Room submission sidebar
    roomSidebar: roomSidebarHook,
  };
}
