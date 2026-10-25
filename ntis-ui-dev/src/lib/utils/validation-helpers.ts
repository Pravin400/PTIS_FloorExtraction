/**
 * Validation Helpers - Utility functions for form validation
 * 
 * @module validation-helpers
 * 
 * ## Exports
 * 
 * ### Types
 * - `Validator` - Function type for field validators
 * 
 * ### Functions
 * - `validateForm(data, schema)` - Generic form validation function
 * - `hasErrors(errors)` - Check if validation errors exist
 * - `validateRequiredStringFromFormData(formData, fieldName)` - Extract and validate required string from FormData
 * - `getOptionalStringFromFormData(formData, fieldName)` - Safely extract optional string from FormData
 * - `getBooleanFromFormData(formData, fieldName)` - Safely extract boolean from FormData
 */

export type Validator = (value: unknown) => string | undefined;

/**
 * Validate and extract a required string from FormData
 * Generic validator that can be used for locale, name, or any required string field
 * 
 * @param formData - The FormData object
 * @param fieldName - The name of the field to extract (e.g., "locale", "name")
 * @returns The validated non-empty string
 * @throws Error if field is missing, not a string, or empty
 * 
 * @example
 * const locale = validateRequiredStringFromFormData(formData, "locale");
 * const name = validateRequiredStringFromFormData(formData, "name");
 */
export const validateRequiredStringFromFormData = (
  formData: FormData,
  fieldName: string
): string => {
  const value = formData.get(fieldName);

  if (!value || typeof value !== "string" || value.trim() === "") {
    throw new Error(`Invalid or missing ${fieldName}`);
  }

  return value.trim();
};

/**
 * Safely extract an optional string from FormData
 * Returns trimmed string or empty string if missing/invalid
 * 
 * @param formData - The FormData object
 * @param fieldName - The name of the field to extract
 * @returns Trimmed string value or empty string
 * 
 * @example
 * const remark = getOptionalStringFromFormData(formData, "remark");
 */
export const getOptionalStringFromFormData = (
  formData: FormData,
  fieldName: string
): string => {
  const value = formData.get(fieldName);
  
  if (!value || typeof value !== "string") {
    return "";
  }
  
  return value.trim();
};

/**
 * Safely extract a boolean from FormData
 * Checks if the field value equals "true" (case-sensitive)
 * 
 * @param formData - The FormData object
 * @param fieldName - The name of the field to extract
 * @returns Boolean value
 * 
 * @example
 * const isActive = getBooleanFromFormData(formData, "isActive");
 */
export const getBooleanFromFormData = (
  formData: FormData,
  fieldName: string
): boolean => {
  const value = formData.get(fieldName);
  return typeof value === "string" && value === "true";
};

/**
 * Generic form validation function
 * 
 * @param data - Plain object with form field values (not FormData)
 * @param schema - Validation schema (field name -> validator function)
 * @returns Object with validation errors (field name -> error message)
 * 
 * @example
 * const schema = {
 *   code: (value) => !value ? "Code is required" : undefined,
 *   description: (value) => !value ? "Description is required" : undefined,
 * };
 * const errors = validateForm({ code: "ABC", description: "" }, schema);
 */
export const validateForm = (
  data: unknown,
  schema: Record<string, Validator>
): Record<string, string> => {
  const errors: Record<string, string> = {};
  const formData = (typeof data === 'object' && data !== null) ? data as Record<string, unknown> : {};

  Object.keys(schema).forEach((key) => {
    const validator = schema[key];
    if (validator) {
      const error = validator(formData[key]);
      if (error) errors[key] = error;
    }
  });

  return errors;
};

/**
 * Check if a form has any errors
 * 
 * @param errors - Errors object from validateForm
 * @returns True if there are any errors, false otherwise
 * 
 * @example
 * const errors = validateForm(formData, schema);
 * if (hasErrors(errors)) {
 *   // Show error message
 * }
 */
export const hasErrors = (errors: Record<string, string>): boolean =>
  Object.keys(errors).length > 0;

/**
 * Sanitize input to allow only positive decimal numbers
 * Removes any invalid characters and ensures value is positive
 * @param value - The input value
 * @param maxDecimals - Optional maximum number of decimal places allowed
 * @returns Sanitized positive decimal value or empty string
 */
export const sanitizePositiveDecimal = (value: string, maxDecimals?: number): string => {
  // Remove all non-numeric characters except dot
  let sanitized = value.replace(/[^\d.]/g, '');

  // Return empty string for just a decimal point
  if (sanitized === '.') {
    return '';
  }

  // Allow only one decimal point
  const parts = sanitized.split('.');
  if (parts.length > 2) {
    sanitized = parts[0] + '.' + parts.slice(1).join('');
  }

  // Restrict decimal places if maxDecimals is provided
  if (maxDecimals !== undefined && sanitized.includes('.')) {
    const [integerPart, decimalPart] = sanitized.split('.');
    if (decimalPart.length > maxDecimals) {
      sanitized = `${integerPart}.${decimalPart.slice(0, maxDecimals)}`;
    }
  }

  // Prepend 0 to values starting with decimal point (e.g., ".5" → "0.5")
  if (sanitized.startsWith('.')) {
    sanitized = '0' + sanitized;
  }

  // Remove leading zeros (except for decimals like 0.5)
  if (sanitized.startsWith('0') && sanitized.length > 1 && !sanitized.startsWith('0.')) {
    sanitized = sanitized.replace(/^0+/, '');
  }

  return sanitized;
};
