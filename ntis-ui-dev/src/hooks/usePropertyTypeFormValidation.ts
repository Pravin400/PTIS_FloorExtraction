"use client";

import { useCallback } from "react";
import { PropertyTypeFormModel } from "@/types/property-type.types";
import {
  validateForm,
  commonValidations,
  isAllZeros
} from "@/lib/utils/validation";
import {
  PROPERTY_DESCRIPTION_MAX,
  DESCRIPTION_ENGLISH_MAX,
  TYPE_MAX
} from "@/components/modules/property-tax/property-type-master/constants";

interface UsePropertyTypeFormValidationProps {
  isEdit: boolean;
  submittedOnce: boolean;
  touched: Record<string, boolean>;
  errors: Partial<Record<keyof PropertyTypeFormModel, string>>;
  t: (key: string, values?: Record<string, string | number | Date>) => string;
  categoryLabel?: string;
}

/**
 * Hook for PropertyType form validation logic
 * 
 * Handles:
 * - Form validation schema definition
 * - Error display logic
 * 
 * @param props - Validation configuration
 * @returns Validation functions
 */
export function usePropertyTypeFormValidation({
  isEdit,
  submittedOnce,
  touched,
  errors,
  t,
  categoryLabel,
}: UsePropertyTypeFormValidationProps) {
  const validate = useCallback(
    (data: PropertyTypeFormModel): Partial<Record<keyof PropertyTypeFormModel, string>> => {
      const category = categoryLabel || t('aliasFallback.category');
      const schema = {
        descriptionEnglish: commonValidations.masterDescriptionEnglish(t, DESCRIPTION_ENGLISH_MAX, {
          required: 'form.validation.descriptionEnglishRequired',
          maxLength: 'form.validation.propertyDescriptionMaxLength',
          allZeros: 'form.validation.descriptionEnglishAllZeros',
          englishOnly: 'form.validation.englishOnly',
        }),
        propertyDescription: (value: unknown) => {
          // First run standard master description validation
          const standardError = commonValidations.masterDescription(t, PROPERTY_DESCRIPTION_MAX, {
            required: 'form.validation.propertyDescriptionRequired',
            format: 'form.validation.propertyDescriptionFormat',
            maxLength: 'form.validation.propertyDescriptionMaxLength',
          })(value);
          
          if (standardError) return standardError;
          
          // Check for all zeros
          const strVal = String(value ?? "").trim();
          if (isAllZeros(strVal)) {
            return t('form.validation.propertyDescriptionFormat');
          }
          
          return undefined;
        },
        type: (value: unknown) => {
          const strVal = String(value ?? "").trim();
          const validTypes = ["R", "C", "I", "N", "R-C", "I-C"];
          
          if (!strVal) {
            return t('form.validation.typeRequired');
          }
          if (strVal.length > TYPE_MAX) {
            return t('form.validation.typeMaxLength', { count: TYPE_MAX });
          }
          // Allow specific preset values or validate against CODE_REGEX pattern
          if (!validTypes.includes(strVal) && !/^[A-Za-z0-9]+([A-Za-z0-9_]*[A-Za-z0-9]+)*$/.test(strVal)) {
            return t('form.validation.typeFormat');
          }
          return undefined;
        },
        /*
        propertyTypeGroup: (value: unknown) => {
          // First run standard master description validation
          const standardError = commonValidations.masterDescription(t, PROPERTY_TYPE_GROUP_MAX, {
            required: 'form.validation.propertyTypeGroupRequired',
            format: 'form.validation.propertyDescriptionFormat',
            maxLength: 'form.validation.propertyTypeGroupMaxLength',
          })(value);
          
          if (standardError) return standardError;
          
          // Check for all zeros
          const strVal = String(value ?? "").trim();
          if (isAllZeros(strVal)) {
            return t('form.validation.propertyDescriptionFormat');
          }
          
          return undefined;
        },
        */
        searchSequence: commonValidations.masterSearchSequence(t, 'form.validation.sequenceInvalid'),
        propertyTypeCategoryId: (value: unknown) => {
          const numValue = Number(value);
          if (!numValue || numValue === 0) {
            return t('form.validation.categoryRequired', { category });
          }
          return undefined;
        },
        isActive: commonValidations.masterActiveStatus(t, isEdit, 'form.validation.mustBeActive'),
      };
      return validateForm(data, schema);
    },
    [t, isEdit, categoryLabel]
  );

  const showError = useCallback((field: keyof PropertyTypeFormModel): boolean =>
    (submittedOnce || touched[field]) && !!errors[field],
    [submittedOnce, touched, errors]
  );

  return {
    validate,
    showError,
  };
}
