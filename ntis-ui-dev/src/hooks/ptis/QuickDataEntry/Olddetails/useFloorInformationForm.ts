import { useCallback, useEffect, useRef, useTransition } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { UseFloorInformationFormProps } from "@/types/OldDetails/property-old-details.types";
import { hasErrors } from "@/lib/utils/validation";
import { useFloorFormState } from "./useFloorFormState";
import { useFloorFormValidation } from "./useFloorFormValidation";
import { useFloorFormApi } from "./useFloorFormApi";
import { translateDevanagariDigits } from "@/lib/utils/input-sanitization";

/**
 * Orchestrator hook to manage Floor Information Form.
 * Composes smaller hooks for state, validation, and API operations.
 */
export function useFloorInformationForm({
  propertyId,
  locale,
  initialSubUseTypeOptions
}: UseFloorInformationFormProps) {
  const t = useTranslations('quickDataEntry');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  // 1. Manage Form State
  const {
    formData,
    setFormData,
    initialEditValues,
    handleUseTypeChange,
    handleEdit,
    handleReset: stateReset
  } = useFloorFormState();

  // Lazy loading dropdown focus triggers using transition router revalidation
  const handleOpenDropdown = useCallback(
    (key: 'loadFloor' | 'loadSubFloor' | 'loadConstruction' | 'loadUsage' | 'loadSubType') => {
      if (searchParams.get(key) === 'true') return;
      startTransition(() => {
        const urlParams = new URLSearchParams(searchParams.toString());
        urlParams.set(key, 'true');
        const queryString = urlParams.toString();
        router.replace(`${pathname}?${queryString}`, { scroll: false });
      });
    },
    [searchParams, pathname, router]
  );

  // Check if subUseOptions are available
  const hasSubUseOptions = initialSubUseTypeOptions && initialSubUseTypeOptions.length > 0;

  // 2. Manage Validation
  const {
    errors,
    validate,
    validateYearField,
    resetValidation,
    showError,
    clearError
  } = useFloorFormValidation(hasSubUseOptions);

  // 3. Manage API Calls
  const {
    isSubmitting,
    handleSave: apiSave,
    handleDelete
  } = useFloorFormApi(propertyId, locale);

  // Clear errors for modified fields dynamically
  // Skip auto-clear for year fields as they have real-time validation
  const lastFormDataRef = useRef(formData);
  useEffect(() => {
    Object.keys(formData).forEach((key) => {
      const k = key as keyof typeof formData;
      // Don't auto-clear year field errors - let validateYearField handle them
      if (k !== 'oldConstructionYear' && k !== 'oldAssessmentYear' && formData[k] !== lastFormDataRef.current[k]) {
        clearError(k);
      }
    });
    lastFormDataRef.current = formData;
  }, [formData, clearError]);

  const isChanged = initialEditValues ? (
    formData.oldFloorId !== initialEditValues.oldFloorId ||
    formData.oldSubFloorId !== initialEditValues.oldSubFloorId ||
    translateDevanagariDigits(formData.oldConstructionYear) !== translateDevanagariDigits(initialEditValues.oldConstructionYear) ||
    translateDevanagariDigits(formData.oldAssessmentYear || "") !== translateDevanagariDigits(initialEditValues.oldAssessmentYear || "") ||
    formData.oldConstructionTypeId !== initialEditValues.oldConstructionTypeId ||
    formData.oldTypeOfUseId !== initialEditValues.oldTypeOfUseId ||
    formData.oldSubTypeOfUseId !== initialEditValues.oldSubTypeOfUseId ||
    translateDevanagariDigits(formData.oldAreaSqMeter || "") !== translateDevanagariDigits(initialEditValues.oldAreaSqMeter || "") ||
    translateDevanagariDigits(formData.oldCarpetAreaSqFeet || "") !== translateDevanagariDigits(initialEditValues.oldCarpetAreaSqFeet || "")
  ) : false;

  /**
   * Combined reset for state and validation.
   */
  const handleReset = useCallback(() => {
    stateReset();
    resetValidation();
  }, [stateReset, resetValidation]);

  /**
   * Validates and then triggers the API save.
   */
  const handleSave = useCallback(async () => {
    const newErrors = validate(formData);

    if (hasErrors(newErrors)) {
      toast.error(t('floor.fillRequiredFields'));
      return;
    }

    await apiSave(formData, handleReset);
  }, [formData, validate, apiSave, handleReset, t]);

  return {
    formData,
    setFormData,
    subUseTypeOptions: initialSubUseTypeOptions,
    hasSubUseOptions,
    isSubmitting,
    errors,
    showError,
    validateYearField,
    handleUseTypeChange,
    handleEdit,
    handleReset,
    handleSave,
    handleDelete,
    isChanged,
    handleOpenDropdown
  };
}
