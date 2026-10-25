"use client";

import { toast } from "sonner";
import { PropertyTypeFormModel } from "@/types/property-type.types";

interface SubmitResult {
  success: boolean;
  createdId?: number;
}

interface ValidationResult {
  success: boolean;
  warning?: boolean;
}

interface UsePropertyTypeSubmitProps {
  /** Whether this is an edit operation */
  isEdit: boolean;
  /** The property type ID (for edit mode) */
  id: number | null;
  /** Current form data */
  formData: PropertyTypeFormModel;
  /** Persisted ID from a previous add attempt (for retry scenarios) */
  persistedPropertyTypeId: number | null;
  /** Setter to persist the created ID */
  setPersistedPropertyTypeId: (id: number | null) => void;
  /** The original submit handler from usePropertyTypeForm */
  originalHandleSubmit: (e: React.FormEvent<HTMLFormElement>) => Promise<SubmitResult>;
  /** Handler to save type of use validations */
  saveValidations: (
    propertyTypeId: number | null | undefined,
    isEdit: boolean
  ) => Promise<ValidationResult>;
  /** Handler to refresh and close the form */
  refreshAndClose: () => void;
  /** Translation function for property type messages */
  t: (key: string, values?: Record<string, string>) => string;
}

/**
 * Hook that encapsulates the multi-step submission pattern for PropertyType forms.
 *
 * Handles the complex dual-save logic:
 * 1. Submit main property type form (with retry protection using persistedPropertyTypeId)
 * 2. Save type of use validations
 * 3. Display appropriate toast messages based on validation results
 *
 * This pattern is needed because:
 * - Property type must be created/updated first to get the ID
 * - Type of use validations depend on the property type ID
 * - Retry scenarios must not re-create the property type
 *
 * @param props - Submit handler configuration
 * @returns Enhanced submit handler for the form
 */
export function usePropertyTypeSubmit({
  isEdit,
  id,
  formData,
  persistedPropertyTypeId,
  setPersistedPropertyTypeId,
  originalHandleSubmit,
  saveValidations,
  refreshAndClose,
  t,
}: UsePropertyTypeSubmitProps) {
  /**
   * Enhanced submit handler that orchestrates the two-phase save:
   * 1. Property type creation/update
   * 2. Type of use validation mapping
   */
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // --- Phase 1: Submit the main property type form ---
    // In edit mode: always submit to update the property type
    // In add mode: skip if already created (persistedPropertyTypeId exists)
    let createdId: number | undefined;
    if (isEdit || !persistedPropertyTypeId) {
      const result = await originalHandleSubmit(e);
      if (!result.success) return; // Validation failed or API error — don't proceed
      createdId = result.createdId;

      // Persist the created ID in add mode so we don't re-create on retry
      if (!isEdit && createdId) {
        setPersistedPropertyTypeId(createdId);
      }
    }

    // --- Phase 2: Determine property type ID for validations ---
    // Edit mode: use existing id
    // Add mode: use persisted ID first (from previous attempt), then createdId
    const propertyTypeId = isEdit ? id : (persistedPropertyTypeId ?? createdId);

    // --- Phase 3: Save type of use validations ---
    const validationResult = await saveValidations(propertyTypeId, isEdit);

    // --- Phase 4: Display results and close form ---
    // Only show success and close if everything is saved successfully
    if (validationResult.success && !validationResult.warning) {
      toast.success(
        isEdit
          ? t("success.updated", { description: formData.propertyDescription })
          : t("success.created", { description: formData.propertyDescription })
      );
      refreshAndClose();
    } else if (validationResult.warning) {
      // Show success for property type creation even if type of use had warning
      toast.success(
        isEdit
          ? t("success.updated", { description: formData.propertyDescription })
          : t("success.created", { description: formData.propertyDescription })
      );
      refreshAndClose();
    }
  };

  return { handleSubmit };
}
