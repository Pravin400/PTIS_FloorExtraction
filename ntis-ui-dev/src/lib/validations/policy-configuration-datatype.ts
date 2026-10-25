/**
 * Policy Configuration Data Type Validation
 * 
 * Provides validation functions for Default Value and Policy Value fields
 * based on the selected Data Type.
 */

export type PolicyDataType = 'BIT' | 'INT' | 'DECIMAL' | 'VARCHAR' | 'DATE' | 'TIME' | 'URL';

export const POLICY_DATA_TYPES: { label: string; value: PolicyDataType }[] = [
  { label: 'BIT', value: 'BIT' },
  { label: 'INT', value: 'INT' },
  { label: 'DECIMAL', value: 'DECIMAL' },
  { label: 'VARCHAR', value: 'VARCHAR' },
  { label: 'DATE', value: 'DATE' },
  { label: 'TIME', value: 'TIME' },
  { label: 'URL', value: 'URL' },
];

/**
 * BIT data type ke liye Enable/Disable dropdown options
 * Jab allowedValues empty ho toh fallback ke taur pe use hota hai
 */
export const BIT_OPTIONS: { label: string; value: string }[] = [
  { label: 'Enable', value: 'Enable' },
  { label: 'Disable', value: 'Disable' },
];


export type PolicyCategory = 'CALCULATION' | 'TAXATION' | 'ASSESSMENT' | 'PENALTY' | 'DISCOUNT' | 'INTEGRATION' | 'SECURITY' | 'BILLING';

export const POLICY_CATEGORIES: { label: string; value: PolicyCategory }[] = [
  { label: 'Calculation', value: 'CALCULATION' },
  { label: 'Taxation', value: 'TAXATION' },
  { label: 'Assessment', value: 'ASSESSMENT' },
  { label: 'Penalty', value: 'PENALTY' },
  { label: 'Discount', value: 'DISCOUNT' },
  { label: 'Integration', value: 'INTEGRATION' },
  { label: 'Security', value: 'SECURITY' },
  { label: 'Billing', value: 'BILLING' },
];

/**
 * Validation patterns for each data type
 */
const VALIDATION_PATTERNS = {
  BIT: /^[01]$/,
  INT: /^\d{1,6}$/,
  DECIMAL: /^\d{1,6}(\.\d{1,2})?$/,
  DATE: /^\d{4}-\d{2}-\d{2}$/,
  TIME: /^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/,
  URL: /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/i,
};

/**
 * Validates a value based on the selected data type
 * @param value - The value to validate
 * @param dataType - The selected data type
 * @returns null if valid, error message key if invalid
 */
export function validateValueByDataType(
  value: string,
  dataType: string
): string | null {
  if (!value || !dataType) {
    return null; // Let required field validation handle empty values
  }

  const normalizedDataType = dataType.toUpperCase() as PolicyDataType;

  switch (normalizedDataType) {
    case 'BIT':
      if (!VALIDATION_PATTERNS.BIT.test(value)) {
        return 'form.validation.bitInvalid';
      }
      break;

    case 'INT':
      if (!VALIDATION_PATTERNS.INT.test(value)) {
        return 'form.validation.intInvalid';
      }
      break;

    case 'DECIMAL':
      if (!VALIDATION_PATTERNS.DECIMAL.test(value)) {
        return 'form.validation.decimalInvalid';
      }
      break;

    case 'VARCHAR':
      // VARCHAR accepts any string value up to 40 characters
      if (value.length > 40) {
        return 'form.validation.varcharMaxLength';
      }
      return null;

    case 'DATE':
      if (!VALIDATION_PATTERNS.DATE.test(value)) {
        return 'form.validation.dateInvalid';
      }
      // Additional check for valid calendar date (rejects e.g. 2026-02-30)
      const [y, m, d] = value.split("-").map(Number);
      const dateValue = new Date(Date.UTC(y, m - 1, d));
      if (dateValue.getUTCFullYear() !== y || dateValue.getUTCMonth() + 1 !== m || dateValue.getUTCDate() !== d) {
        return 'form.validation.dateInvalid';
      }
      break;

    case 'TIME':
      if (!VALIDATION_PATTERNS.TIME.test(value)) {
        return 'form.validation.timeInvalid';
      }
      break;

    case 'URL':
      if (!VALIDATION_PATTERNS.URL.test(value)) {
        return 'form.validation.urlInvalid';
      }
      // Additional URL validation using URL constructor
      try {
        // If the value doesn't have a protocol, add one for validation
        const urlToTest = value.startsWith('http') ? value : `https://${value}`;
        new URL(urlToTest);
      } catch {
        return 'form.validation.urlInvalid';
      }
      break;

    default:
      // Unknown data type, skip validation
      return null;
  }

  return null;
}

/**
 * Gets the input type hint for a data type
 * @param dataType - The selected data type
 * @returns The appropriate HTML input type
 */
export function getInputTypeForDataType(dataType: string): string {
  const normalizedDataType = dataType?.toUpperCase();
  
  switch (normalizedDataType) {
    case 'DATE':
      return 'date';
    case 'TIME':
      return 'time';
    case 'URL':
      return 'url';
    case 'INT':
    case 'DECIMAL':
      return 'text'; // Use text to allow custom validation
    default:
      return 'text';
  }
}

/**
 * Gets the placeholder text for a data type
 * @param dataType - The selected data type
 * @returns Appropriate placeholder text
 */
export function getPlaceholderForDataType(dataType: string): string {
  const normalizedDataType = dataType?.toUpperCase();
  
  switch (normalizedDataType) {
    case 'BIT':
      return '0 or 1';
    case 'INT':
      return 'e.g. 123456';
    case 'DECIMAL':
      return 'e.g. 123456.12';
    case 'VARCHAR':
      return 'Enter text value';
    case 'DATE':
      return 'YYYY-MM-DD';
    case 'TIME':
      return 'HH:mm or HH:mm:ss';
    case 'URL':
      return 'https://example.com';
    default:
      return 'Enter value';
  }
}

/**
 * Sanitizes input based on data type
 * @param value - The input value
 * @param dataType - The selected data type
 * @returns Sanitized value
 */
export function sanitizeValueByDataType(value: string, dataType: string): string {
  const normalizedDataType = dataType?.toUpperCase();
  
  switch (normalizedDataType) {
    case 'BIT':
      // Only allow 0 or 1
      return value.replace(/[^01]/g, '').substring(0, 1);
    case 'INT':
      // Allow only digits, max 6 characters
      return value.replace(/[^\d]/g, '').substring(0, 6);
    case 'DECIMAL':
      // Allow digits and one decimal point
      let sanitized = value.replace(/[^\d.]/g, '');
      // Keep only first decimal point
      const initialParts = sanitized.split('.');
      if (initialParts.length > 2) {
        sanitized = initialParts[0] + '.' + initialParts.slice(1).join('');
      }
      // Limit to 6 digits before decimal and 2 after
      const finalParts = sanitized.split('.');
      if (finalParts.length === 2) {
        const beforeDecimal = finalParts[0].substring(0, 6);
        const afterDecimal = finalParts[1].substring(0, 2);
        sanitized = beforeDecimal + '.' + afterDecimal;
      } else {
        sanitized = sanitized.substring(0, 6);
      }
      return sanitized;
    case 'VARCHAR':
      // Limit to 40 characters
      return value.substring(0, 40);
    case 'TIME':
      // Allow digits and colons
      return value.replace(/[^\d:]/g, '');
    default:
      return value;
  }
}
