import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { FloorInformationFormData } from "@/types/OldDetails/property-old-details.types";
import { oldDetailsValidations } from "@/lib/utils/validation-schemas";
import { translateDevanagariDigits } from "@/lib/utils/input-sanitization";

const MIN_YEAR = 1700;
const MAX_YEAR = 2026;

/**
 * Hook to manage Floor Information Form validation.
 * Handles validation logic, error state, and visibility.
 */
export function useFloorFormValidation(hasSubUseOptions = true) {
  const t = useTranslations('quickDataEntry');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showErrors, setShowErrors] = useState(false);

  /**
   * Validates year range in real-time (1700-2026).
   */
  const validateYearField = useCallback((field: 'oldConstructionYear' | 'oldAssessmentYear', value: string) => {
    const translated = translateDevanagariDigits(value);
    // Clear error if field is empty or less than 4 digits
    if (!translated || translated.length < 4) {
      setErrors(prev => {
        const copy = { ...prev };
        delete copy[field];
        return copy;
      });
      return;
    }

    // Validate when exactly 4 digits are entered
    if (translated.length === 4) {
      const year = parseInt(translated, 10);
      if (isNaN(year)) {
        const errorMessage = field === 'oldConstructionYear'
          ? 'Invalid construction year format'
          : 'Invalid assessment year format';
        setErrors(prev => ({ ...prev, [field]: errorMessage }));
        return;
      }

      // Check year range
      if (year < MIN_YEAR || year > MAX_YEAR) {
        const errorMessage = field === 'oldConstructionYear'
          ? t('property.validation.constructionYearRange') || `Construction year must be between ${MIN_YEAR} and ${MAX_YEAR}`
          : t('property.validation.assessmentYearRange') || `Assessment year must be between ${MIN_YEAR} and ${MAX_YEAR}`;
        
        setErrors(prev => ({ ...prev, [field]: errorMessage }));
      } else {
        // Valid year - clear error
        setErrors(prev => {
          const copy = { ...prev };
          delete copy[field];
          return copy;
        });
      }
    }
  }, [t]);

  /**
   * Validates the form data and updates error state.
   * @returns Record of errors found.
   */
  const validate = useCallback((formData: FloorInformationFormData) => {
    const newErrors = oldDetailsValidations.validateFloorInformation(formData, t, hasSubUseOptions);
    setErrors(newErrors);
    setShowErrors(true);
    return newErrors;
  }, [t, hasSubUseOptions]);

  /**
   * Resets validation state.
   */
  const resetValidation = useCallback(() => {
    setErrors({});
    setShowErrors(false);
  }, []);

  /**
   * Clears error for a specific field.
   */
  const clearError = useCallback((field: string) => {
    setErrors(prev => {
      if (prev[field]) {
        const copy = { ...prev };
        delete copy[field];
        return copy;
      }
      return prev;
    });
  }, []);

  /**
   * Helper to determine if an error should be shown for a specific field.
   * Year fields show errors immediately during typing.
   */
  const showError = useCallback((field: string) => {
    // Show year field errors immediately during typing
    if (field === 'oldConstructionYear' || field === 'oldAssessmentYear') {
      return !!errors[field];
    }
    // Other fields show errors only after submit attempt
    return showErrors && !!errors[field];
  }, [errors, showErrors]);

  return {
    errors,
    showErrors,
    validate,
    validateYearField,
    resetValidation,
    showError,
    clearError
  };
}
