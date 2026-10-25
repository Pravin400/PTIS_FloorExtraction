"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import { updatePropertyTypeValidationsAction } from "@/app/[locale]/property-tax/propertytype/action";
import { UseType } from "@/types/typeOfUse.types";
import { logger } from "@/lib/utils/logger";

interface UseTypeOfUseValidationsProps {
  initialTypeOfUseIds?: number[];
  typeOfUseList: UseType[];
  t: (key: string, values?: Record<string, string | number | Date>) => string;
  typeOfUseLabel?: string;
}

/**
 * Hook for managing Type of Use validation state and submission
 * 
 * Handles:
 * - Type of Use selection state
 * - Toggle, select all, clear all actions
 * - Persisting validations to API
 * 
 * @param props - Hook configuration
 * @returns State and handlers for Type of Use validations
 */
export function useTypeOfUseValidations({
  initialTypeOfUseIds = [],
  typeOfUseList,
  t,
  typeOfUseLabel,
}: UseTypeOfUseValidationsProps) {
  const [initialIds] = useState<Set<number>>(new Set(initialTypeOfUseIds));
  const [selectedTypeOfUseIds, setSelectedTypeOfUseIds] = useState<Set<number>>(
    new Set(initialTypeOfUseIds)
  );

  // Track createdId from successful creation in add mode to avoid re-creating on validation save failure
  const [persistedPropertyTypeId, setPersistedPropertyTypeId] = useState<number | null>(null);

  const toggleTypeOfUse = useCallback((touId: number) => {
    setSelectedTypeOfUseIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(touId)) {
        newSet.delete(touId);
      } else {
        newSet.add(touId);
      }
      return newSet;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    const newSet = new Set(selectedTypeOfUseIds);
    for (const item of typeOfUseList) {
      newSet.add(item.typeOfUseId);
    }
    setSelectedTypeOfUseIds(newSet);
  }, [selectedTypeOfUseIds, typeOfUseList]);

  const handleClearAll = useCallback(() => {
    setSelectedTypeOfUseIds(new Set());
  }, []);

  /**
   * Save type of use validations to API
   * @param propertyTypeId - The property type ID to save validations for
   * @param isEdit - Whether this is an edit operation
   * @returns Object with success status and optional warning
   */
  const saveValidations = async (
    propertyTypeId: number | null | undefined,
    isEdit: boolean
  ): Promise<{ success: boolean; warning?: boolean }> => {
    const typeOfUse = typeOfUseLabel || t("aliasFallback.typeOfUse");
    const hasSelectionsToSave = selectedTypeOfUseIds.size > 0;
    const shouldSaveValidations = propertyTypeId && (isEdit || hasSelectionsToSave);

    if (shouldSaveValidations) {
      try {
        const result = await updatePropertyTypeValidationsAction(
          propertyTypeId,
          Array.from(selectedTypeOfUseIds)
        );
        if (!result.success) {
          toast.error(result.message || t("form.typeOfUseSection.saveFailed", { typeOfUse }));
          return { success: false };
        }
      } catch (error) {
        logger.error("Error saving type of use validations", { 
          error: error instanceof Error ? error : undefined,
          propertyTypeId,
          selectedCount: selectedTypeOfUseIds.size 
        });
        toast.error(t("form.typeOfUseSection.saveFailed", { typeOfUse }));
        return { success: false };
      }
    } else if (!isEdit && hasSelectionsToSave && !propertyTypeId) {
      // Add mode: property type created but couldn't get ID to save type of use
      // This is a rare edge case - warn user but don't block
      logger.warn("Property type created but ID not available for type of use assignment", {
        hasSelectionsToSave,
        selectedCount: selectedTypeOfUseIds.size
      });
      toast.warning(t("form.typeOfUseSection.saveWarning", { typeOfUse }));
      return { success: true, warning: true };
    }

    return { success: true };
  };

  return {
    selectedTypeOfUseIds,
    initialTypeOfUseIds: initialIds,
    persistedPropertyTypeId,
    setPersistedPropertyTypeId,
    toggleTypeOfUse,
    handleSelectAll,
    handleClearAll,
    saveValidations,
  };
}
