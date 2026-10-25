import { useState } from "react";

interface FormErrors {
  zone: string;
  useGroup: string;
  assessmentYear: string;
}

interface UseRateValidationProps {
  selectedZone: string;
  selectedUseGroup: string;
  assessmentYear: string;
  initialExistingRatesCheck?: boolean;
  isOpenPlot?: boolean;
}

/**
 * Hook for managing form validation state
 */
export function useRateValidation({
  selectedZone,
  selectedUseGroup,
  assessmentYear,
  initialExistingRatesCheck,
  isOpenPlot = false,
}: UseRateValidationProps) {
  // Form validation errors
  const [errors, setErrors] = useState<FormErrors>({
    zone: "",
    useGroup: "",
    assessmentYear: "",
  });

  // State for tracking existing rates
  const [existingRateFound, setExistingRateFound] = useState(initialExistingRatesCheck ?? false);
  const [isCheckingRates, setIsCheckingRates] = useState(false);

  // Check if all filters are selected
  const allFiltersSelected = isOpenPlot
    ? (!!selectedZone && !!assessmentYear)
    : (!!selectedZone && !!selectedUseGroup && !!assessmentYear);

  // Validate a single field
  const validateField = (field: keyof FormErrors, value: string): string => {
    if (!value || value === "" || value === "ALL") {
      switch (field) {
        case "zone":
          return "Please select a rate section";
        case "useGroup":
          return isOpenPlot ? "" : "Please select a use group";
        case "assessmentYear":
          return "Please select an assessment year";
        default:
          return "";
      }
    }
    return "";
  };

  // Validate all fields
  const validateAll = (): boolean => {
    const newErrors: FormErrors = {
      zone: validateField("zone", selectedZone),
      useGroup: isOpenPlot ? "" : validateField("useGroup", selectedUseGroup),
      assessmentYear: validateField("assessmentYear", assessmentYear),
    };
    setErrors(newErrors);
    return !Object.values(newErrors).some(error => error !== "");
  };

  // Clear a specific error
  const clearError = (field: keyof FormErrors) => {
    setErrors(prev => ({ ...prev, [field]: "" }));
  };

  // Clear all errors
  const clearAllErrors = () => {
    setErrors({ zone: "", useGroup: "", assessmentYear: "" });
  };

  return {
    errors,
    setErrors,
    existingRateFound,
    setExistingRateFound,
    isCheckingRates,
    setIsCheckingRates,
    allFiltersSelected,
    validateField,
    validateAll,
    clearError,
    clearAllErrors,
  };
}
