import {
  Priority,
  EscalationLevel,
} from '@/types/grievance-category-master/grievanceCategory.types';

/**
 * Raw form data input type for server-side validation
 * Accepts string | null values from FormData
 */
export interface GrievanceCategoryValidationInput {
  categoryCode: string | null;
  categoryName: string | null;
  departmentId: string | number | null | undefined;
  priority: string | Priority | null;
  resolutionSla: string | null;
  escalationLevel: string | EscalationLevel | null;
  description: string | null;
  isActive: boolean;
}

/**
 * Translator options for validation messages
 */
export interface ValidationTranslatorOptions {
  errors: Record<string, string>;
  fields: Record<string, string>;
}

/**
 * Functional translator type
 */
export type ValidationTranslator = (key: string, replacements?: Record<string, unknown>) => string;

/**
 * Creates a translator function for grievance category validation
 */
export const createGrievanceCategoryValidationTranslator = (
  options: ValidationTranslatorOptions
): ValidationTranslator => {
  return (key: string, replacements?: Record<string, unknown>) => {
    // Strip "errors." prefix for lookup in options.errors if present
    const lookupKey = key.startsWith('errors.') ? key.substring(7) : key;
    let message = options.errors[lookupKey] || options.fields[lookupKey] || key;

    if (replacements) {
      Object.entries(replacements).forEach(([k, v]) => {
        message = message.replace(`{${k}}`, String(v));
      });
    }
    return message;
  };
};

/**
 * Resolves server errors into localized messages
 * Accepts optional rawResponse for fallback to backend message
 */
export const resolveGrievanceCategoryServerError = (
  error: string | undefined,
  errorTranslations: Record<string, string>,
  rawResponse?: { message?: string }
): string => {
  if (!error) return errorTranslations['unexpected'] || 'An unexpected error occurred';

  // Handle cases like "errors.duplicateCode"
  const key = error.includes('.') ? error.split('.').pop()! : error;

  // If no specific translation found, fall back to raw response message or original error
  if (!errorTranslations[key]) {
    return rawResponse?.message || error;
  }

  return (
    errorTranslations[key] || errorTranslations['unexpected'] || 'An unexpected error occurred'
  );
};
