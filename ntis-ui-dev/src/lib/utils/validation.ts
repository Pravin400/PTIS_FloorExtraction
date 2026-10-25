/**
 * Common validation functions for forms
 *
 * @module validation
 *
 * @deprecated This file is kept for backward compatibility.
 * New code should import from the specific modules:
 * - validation-rules.ts for regex and sanitization patterns
 * - validation-helpers.ts for utility functions
 * - validation-schemas.ts for validators and schema factories
 *
 * ## Exports
 *
 * ### Constants (Regex & Sanitization)
 * - `CODE_REGEX` - Validates alphanumeric and underscore (A-Z, a-z, 0-9, _) - underscore only in between
 * - `CODE_SANITIZE` - Removes invalid characters for code fields
 * - `DESCRIPTION_REGEX` - Validates multilingual text with punctuation (&, -, /, etc.) - special chars only in between, single space only
 * - `DESCRIPTION_SANITIZE` - Removes invalid characters for descriptions
 * - `TEXT_SANITIZE` - Generic text sanitization
 * - `TEXT_ALLOWED` - Generic text validation - single space only
 * - `SEARCH_KEY_REGEX` - Search key validation
 *
 * ### Functions
 * - `validateForm(data, schema)` - Generic form validation function
 * - `hasErrors(errors)` - Check if validation errors exist
 * - `createMasterValidationSchema(t, isEdit, config)` - Factory for master form validators
 *
 * ### Validators (commonValidations)
 * - `masterCode(t, maxLength, messageKeys)` - Generic code validation for all masters
 * - `masterDescription(t, maxLength, messageKeys)` - Generic description validation for all masters
 * - `masterSearchSequence(t, messageKey)` - Generic search sequence validation
 * - `masterActiveStatus(t, isEdit, messageKey)` - Generic active status validation
 *
 * ### Helpers
 * - `constructionValidators` - Backward compatibility helpers for construction module
 */

// Re-export from validation-rules.ts
export {
  CODE_REGEX,
  CODE_SANITIZE,
  CODE_WITH_DECIMAL_REGEX,
  CODE_WITH_DECIMAL_SANITIZE,
  DESCRIPTION_REGEX,
  DESCRIPTION_SANITIZE,
  DESCRIPTION_ENGLISH_REGEX,
  DESCRIPTION_ENGLISH_SANITIZE,
  TEXT_SANITIZE,
  TEXT_ALLOWED,
  SEARCH_KEY_REGEX,
  PERSON_NAME_REGEX,
  PERSON_NAME_SANITIZE,
  EMAIL_REGEX,
  EMAIL_LOWERCASE_RESTRICTED_REGEX,
  MOBILE_10_REGEX,
  PINCODE_6_REGEX,
  PINCODE_SANITIZE,
  CITY_NAME_REGEX,
  POSITIVE_DECIMAL_INVALID_KEYS,
  isAllZeros,
  YEAR_REGEX,
  HAS_LETTER_REGEX,
  UPLOAD_COUNT_REGEX,
  UPLOAD_COUNT_SANITIZE,
  UPLOAD_COUNT_MIN,
  UPLOAD_COUNT_MAX,
  sanitizeUploadCount,
} from './validation-rules';

// Re-export from validation-helpers.ts
export type { Validator } from './validation-helpers';
export { validateForm, hasErrors } from './validation-helpers';
export { sanitizePositiveDecimal } from './validation-helpers'; // Export sanitizePositiveDecimal for global access

// Re-export from validation-schemas.ts
export {
  commonValidations,
  createMasterValidationSchema,
  constructionValidators,
  societyValidations,
  propertyValidations,
  officeValidations,
  oldDetailsValidations,
} from './validation-schemas';
export { userManagementValidations } from './user-management-validation';

// Re-export Old Taxation validation constants and utilities
export {
  OLD_TAXATION_VALIDATION_RULES,
  oldTaxationValidators,
  OLD_TAXATION_ERROR_MESSAGES,
} from './OldDetails/old-taxation-validation.constants';


