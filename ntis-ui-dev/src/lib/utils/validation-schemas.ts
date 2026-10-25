/**
 * Validation Schemas - Reusable validators for master forms
 *
 * @module validation-schemas
 *
 * ## Exports
 *
 * ### Common Validators (commonValidations)
 * - `masterCode(t, maxLength, messageKeys)` - Generic code validation for all masters
 * - `masterDescription(t, maxLength, messageKeys)` - Generic description validation for all masters
 * - `masterSearchSequence(t, messageKey)` - Generic search sequence validation
 * - `masterActiveStatus(t, isEdit, messageKey)` - Generic active status validation
 *
 * ### Schema Factory
 * - `createMasterValidationSchema(t, isEdit, config)` - Factory for master form validators
 *
 * ### Backward Compatibility
 * - `constructionValidators` - Construction-specific validators
 */
import {
  CODE_REGEX,
  CODE_WITH_DECIMAL_REGEX,
  DESCRIPTION_REGEX,
  DESCRIPTION_ENGLISH_REGEX,
  isAllZeros,
  PERSON_NAME_REGEX,
  EMAIL_REGEX,
  MOBILE_10_REGEX,
  YEAR_REGEX,
  PINCODE_6_REGEX,
  UPLOAD_COUNT_REGEX,
  UPLOAD_COUNT_MIN,
  UPLOAD_COUNT_MAX,
} from './validation-rules';
import { validateForm } from './validation-helpers';
import { DateUtils } from './date-helpers';
import { translateDevanagariDigits } from './input-sanitization';
import { PROPERTY_VALIDATION_RULES, kycValidators } from './kyc-validation/kyc-validation.constants';
import { societyValidators } from './society-validation/society-validation';
import type { Validator } from './validation-helpers';
import type { OfficeFormModel } from '@/types/office.types';
import type {
  FloorInformationFormData,
  PropertyOldDetailsApiItem,
  SaveOldFloorDetailPayload,
  OldTaxesDetails,
  OldTaxYear,
  OldTaxItem,
} from '@/types/OldDetails/property-old-details.types';

/**
 * Common validation rules for Master Forms
 * These validators are generic and can be used across all master forms (Construction, Tax Zone, etc.)
 */
export const commonValidations = {
  /**
   * Generic master code validation (alphanumeric and underscore)
   * Underscore (_) must be in between alphanumeric characters, not at start/end
   * Used for: Construction Code, Tax Zone Code, etc.
   *
   * @param t - Translation function
   * @param maxLength - Maximum allowed length
   * @param messageKeys - Custom translation keys for errors
   */
  masterCode:
    (
      t: (key: string, values?: Record<string, string | number | Date>) => string,
      maxLength: number = 50,
      messageKeys?: {
        required?: string;
        format?: string;
        maxLength?: string;
      }
    ): Validator =>
      (fieldValue: unknown) => {
        const strVal = String(fieldValue ?? '').trim();

        const keys = {
          required: messageKeys?.required || 'form.validation.codeRequired',
          format: messageKeys?.format || 'form.validation.codeFormat',
          maxLength: messageKeys?.maxLength || 'form.validation.codeMaxLength',
        };

        if (!strVal) return t(keys.required);
        if (strVal.length > maxLength) return t(keys.maxLength, { count: maxLength });
        if (!CODE_REGEX.test(strVal)) return t(keys.format);
        return undefined;
      },

  /**
   * Master code validation with decimal support (alphanumeric, underscore, and decimal point)
   * Allows decimal numbers (e.g. 12.5, 0.5, M001.1) and standard codes
   * Used for: Mouja Number, or any master code field allowing decimal values
   *
   * @param t - Translation function
   * @param maxLength - Maximum allowed length
   * @param messageKeys - Custom translation keys for errors
   */
  masterCodeWithDecimal:
    (
      t: (key: string, values?: Record<string, string | number | Date>) => string,
      maxLength: number = 50,
      messageKeys?: {
        required?: string;
        format?: string;
        maxLength?: string;
      }
    ): Validator =>
      (fieldValue: unknown) => {
        const strVal = String(fieldValue ?? '').trim();

        const keys = {
          required: messageKeys?.required || 'form.validation.codeRequired',
          format: messageKeys?.format || 'form.validation.codeFormat',
          maxLength: messageKeys?.maxLength || 'form.validation.codeMaxLength',
        };

        if (!strVal) return t(keys.required);
        if (strVal.length > maxLength) return t(keys.maxLength, { count: maxLength });
        if (!CODE_WITH_DECIMAL_REGEX.test(strVal)) return t(keys.format);
        return undefined;
      },

  /**
   * Generic master description validation (multilingual support)
   * Special characters (&, -, /, etc.) must be in between other characters, not at start/end
   * Only single space allowed between words, no consecutive spaces
   * Used for: Construction Description, Tax Zone Description, etc.
   *
   * @param t - Translation function
   * @param maxLength - Maximum allowed length
   * @param messageKeys - Custom translation keys for errors
   */
  masterDescription:
    (
      t: (key: string, values?: Record<string, string | number | Date>) => string,
      maxLength: number = 100,
      messageKeys?: {
        required?: string;
        format?: string;
        maxLength?: string;
      }
    ): Validator =>
      (fieldValue: unknown) => {
        const strVal = String(fieldValue ?? '').trim();

        const keys = {
          required: messageKeys?.required || 'form.validation.descriptionRequired',
          format: messageKeys?.format || 'form.validation.descriptionFormat',
          maxLength: messageKeys?.maxLength || 'form.validation.descriptionMaxLength',
        };

        if (!strVal) return t(keys.required);
        if (strVal.length > maxLength) return t(keys.maxLength, { count: maxLength });
        if (!DESCRIPTION_REGEX.test(strVal)) return t(keys.format);
        return undefined;
      },

  /**
   * Generic master English description validation
   * Only English characters (A-Za-z), numbers, single spaces, and basic punctuation (&, -, /, etc.)
   * Validates required, max length, all zeros, and English regex pattern.
   *
   * @param t - Translation function
   * @param maxLength - Maximum allowed length
   * @param messageKeys - Custom translation keys for errors
   */
  masterDescriptionEnglish:
    (
      t: (key: string, values?: Record<string, string | number | Date>) => string,
      maxLength: number = 100,
      messageKeys?: {
        required?: string;
        format?: string;
        maxLength?: string;
        allZeros?: string;
        englishOnly?: string;
      }
    ): Validator =>
      (fieldValue: unknown) => {
        const strVal = String(fieldValue ?? '').trim();

        const keys = {
          required: messageKeys?.required || 'form.validation.descriptionEnglishRequired',
          format: messageKeys?.format || 'form.validation.descriptionFormat',
          maxLength: messageKeys?.maxLength || 'form.validation.descriptionMaxLength',
          allZeros: messageKeys?.allZeros || 'form.validation.descriptionEnglishAllZeros',
          englishOnly: messageKeys?.englishOnly || 'form.validation.englishOnly',
        };

        if (!strVal) return t(keys.required);
        if (strVal.length > maxLength) return t(keys.maxLength, { count: maxLength });
        if (isAllZeros(strVal)) return t(keys.allZeros);
        if (!DESCRIPTION_ENGLISH_REGEX.test(strVal)) return t(keys.englishOnly);
        return undefined;
      },

  /**
   * Generic search sequence validation
   * Used across all master forms
   *
   * @param t - Translation function
   * @param messageKey - Custom translation key for invalid sequence error
   */
  masterSearchSequence:
    (
      t: (key: string, values?: Record<string, string | number | Date>) => string,
      messageKey?: string
    ): Validator =>
      (fieldValue: unknown) => {
        const numVal = Number(fieldValue);
        const key = messageKey || 'form.validation.sequenceInvalid';

        if (!Number.isFinite(numVal) || numVal <= 0) {
          return t(key);
        }
        return undefined;
      },

  /**
   * Generic active status validation
   * Used across all master forms (new records must be active)
   *
   * @param t - Translation function
   * @param isEdit - Whether this is an edit operation
   * @param messageKey - Custom translation key for must be active error
   */
  masterActiveStatus:
    (
      t: (key: string, values?: Record<string, string | number | Date>) => string,
      isEdit: boolean,
      messageKey?: string
    ): Validator =>
      (fieldValue: unknown) => {
        // ✅ Explicitly parse boolean values - handles both boolean and string types
        // Common with HTML inputs/FormData which store booleans as strings
        const isActive = fieldValue === true || fieldValue === 'true';
        const key = messageKey || 'form.validation.mustBeActive';

        if (!isActive && !isEdit) {
          return t(key);
        }
        return undefined;
      },

  /**
   * Generic email validation
   *
   * @param t - Translation function
   * @param messageKey - Custom translation key for invalid email error
   */
  email:
    (
      t: (key: string, values?: Record<string, string | number | Date>) => string,
      messageKey?: string
    ): Validator =>
      (fieldValue: unknown) => {
        const strVal = String(fieldValue ?? '').trim();
        if (!strVal) return undefined; // Optional field, use required check if needed

        const key = messageKey || 'form.validation.invalidEmail';
        if (!EMAIL_REGEX.test(strVal)) {
          return t(key);
        }
        return undefined;
      },

  /**
   * Generic mobile number validation (10 digits)
   *
   * @param t - Translation function
   * @param messageKey - Custom translation key for invalid mobile error
   */
  mobile:
    (
      t: (key: string, values?: Record<string, string | number | Date>) => string,
      messageKey?: string
    ): Validator =>
      (fieldValue: unknown) => {
        const strVal = String(fieldValue ?? '').trim();
        if (!strVal) return undefined; // Optional field

        const key = messageKey || 'form.validation.invalidMobile';
        if (!MOBILE_10_REGEX.test(strVal)) {
          return t(key);
        }
        return undefined;
      },

  /**
   * Generic pincode validation (6 digits starting with 1-9)
   *
   * @param t - Translation function
   * @param messageKey - Custom translation key for invalid pincode error
   */
  pincode:
    (
      t: (key: string, values?: Record<string, string | number | Date>) => string,
      messageKey?: string
    ): Validator =>
      (fieldValue: unknown) => {
        const strVal = String(fieldValue ?? '').trim();
        if (!strVal) return undefined; // Optional field

        const key = messageKey || 'form.validation.invalidPincode';
        // Note: PINCODE_6_REGEX checks for exactly 6 digits starting with 1-9
        if (!PINCODE_6_REGEX.test(strVal)) {
          return t(key);
        }
        return undefined;
      },

  /**
   * Upload count validation (only positive whole numbers between min and max, no leading zeros)
   * Disallows alphabets, negative numbers, decimals, special characters, and numbers starting with 0.
   *
   * @param t - Translation function
   * @param min - Minimum allowed value (default 1)
   * @param max - Maximum allowed value (default 200000)
   * @param messageKeys - Custom translation keys for errors
   */
  uploadCount:
    (
      t: (key: string, values?: Record<string, string | number | Date>) => string,
      min: number = UPLOAD_COUNT_MIN,
      max: number = UPLOAD_COUNT_MAX,
      messageKeys?: {
        required?: string;
        format?: string;
        min?: string;
        max?: string;
      }
    ): Validator =>
      (fieldValue: unknown) => {
        const strVal = String(fieldValue ?? '').trim();

        const keys = {
          required: messageKeys?.required || 'uploadDownloadDrawer.validation.uploadCountRequired',
          format: messageKeys?.format || 'uploadDownloadDrawer.validation.uploadCountNumeric',
          min: messageKeys?.min || 'uploadDownloadDrawer.validation.uploadCountMin',
          max: messageKeys?.max || 'uploadDownloadDrawer.validation.uploadCountMax',
        };

        if (!strVal) return t(keys.required);

        // Check if contains non-digits or starts with 0
        if (!UPLOAD_COUNT_REGEX.test(strVal)) {
          return t(keys.format);
        }

        const numVal = Number(strVal);
        if (!Number.isFinite(numVal) || numVal < min) {
          return t(keys.min, { min });
        }
        if (numVal > max) {
          return t(keys.max, { max });
        }

        return undefined;
      },
};

/**
 * Helper factory to create master form validation schema
 * Simplifies creating validators for master forms with consistent naming
 *
 * @example
 * // For Construction Type Master - map to actual form field names
 * const schema = createMasterValidationSchema(t, isEdit, {
 *   code: { maxLength: 7, messageKeys: {
 *     required: 'form.validation.constructionCodeRequired',
 *     format: 'form.validation.constructionCodeFormat',
 *     maxLength: 'form.validation.constructionCodeMaxLength'
 *   }},
 *   description: { maxLength: 100, messageKeys: {
 *     required: 'form.validation.descriptionRequired',
 *     format: 'form.validation.descriptionFormat',
 *     maxLength: 'form.validation.descriptionMaxLength'
 *   }},
 *   searchSequence: { messageKey: 'form.validation.sequenceInvalid' },
 *   activeStatus: { messageKey: 'form.validation.mustBeActive' }
 * });
 * // Then map schema keys to form model field names:
 * // constructionCode: schema.code, description: schema.description, etc.
 */
export const createMasterValidationSchema = (
  t: (key: string, values?: Record<string, string | number | Date>) => string,
  isEdit: boolean,
  config: {
    code?: {
      maxLength?: number;
      messageKeys?: {
        required?: string;
        format?: string;
        maxLength?: string;
      };
    };
    description?: {
      maxLength?: number;
      messageKeys?: {
        required?: string;
        format?: string;
        maxLength?: string;
      };
    };
    searchSequence?: boolean | { messageKey?: string };
    activeStatus?: boolean | { messageKey?: string };
  }
) => {
  const schema: Record<string, Validator> = {};

  if (config.code) {
    schema.code = commonValidations.masterCode(t, config.code.maxLength, config.code.messageKeys);
  }

  if (config.description) {
    schema.description = commonValidations.masterDescription(
      t,
      config.description.maxLength,
      config.description.messageKeys
    );
  }

  if (config.searchSequence) {
    const messageKey =
      typeof config.searchSequence === 'object' ? config.searchSequence.messageKey : undefined;
    schema.searchSequence = commonValidations.masterSearchSequence(t, messageKey);
  }

  if (config.activeStatus) {
    const messageKey =
      typeof config.activeStatus === 'object' ? config.activeStatus.messageKey : undefined;
    schema.isActive = commonValidations.masterActiveStatus(t, isEdit, messageKey);
  }

  return schema;
};

/**
 * Backward compatibility - Construction-specific validators
 * These use the generic master validators with construction-specific message keys
 */
export const constructionValidators = {
  code: (
    t: (key: string, values?: Record<string, string | number | Date>) => string,
    maxLength: number = 7
  ) =>
    commonValidations.masterCode(t, maxLength, {
      required: 'form.validation.constructionCodeRequired',
      format: 'form.validation.constructionCodeFormat',
      maxLength: 'form.validation.constructionCodeMaxLength',
    }),

  description: (
    t: (key: string, values?: Record<string, string | number | Date>) => string,
    maxLength: number = 100
  ) =>
    commonValidations.masterDescription(t, maxLength, {
      required: 'form.validation.descriptionRequired',
      format: 'form.validation.descriptionFormat',
      maxLength: 'form.validation.descriptionMaxLength',
    }),

  searchSequence: (t: (key: string, values?: Record<string, string | number | Date>) => string) =>
    commonValidations.masterSearchSequence(t, 'form.validation.sequenceInvalid'),

  activeStatus: (
    t: (key: string, values?: Record<string, string | number | Date>) => string,
    isEdit: boolean
  ) => commonValidations.masterActiveStatus(t, isEdit, 'form.validation.mustBeActive'),
};

/**
 * Society form validations
 */
export const societyValidations = {
  personName:
    (
      label: string,
      t: (key: string, values?: Record<string, string | number | Date>) => string
    ): Validator =>
      (value: unknown) => {
        const strVal = String(value ?? '').trim();
        if (!strVal) return undefined; // optional field
        if (!PERSON_NAME_REGEX.test(strVal)) {
          return t(`society.validation.${label}`);
        }
        return undefined;
      },

  email:
    (
      label: string,
      t: (key: string, values?: Record<string, string | number | Date>) => string
    ): Validator =>
      (value: unknown) => {
        const strVal = String(value ?? '').trim();
        if (!strVal) return undefined; // optional field
        if (!societyValidators.isValidEmail(strVal, true)) {
          return t(`society.validation.${label}`);
        }
        return undefined;
      },

  mobile10:
    (
      _label: string,
      t: (key: string, values?: Record<string, string | number | Date>) => string
    ): Validator =>
      (value: unknown) => {
        const strVal = String(value ?? '').trim();
        if (!strVal) return undefined; // optional field
        const digits = strVal.replace(/\D/g, '');
        if (digits.length !== 10) {
          return t('society.validation.invalidMobile');
        }
        if (!/^[6-9]/.test(digits)) {
          return t('society.validation.invalidMobileStart');
        }
        if (kycValidators.hasRepeatedSequence(digits, 5)) {
          return t('society.validation.invalidRepeatedSequence');
        }
        return undefined;
      },
};

/**
 * Property form validations
 */
export const propertyValidations = {
  required:
    (
      label: string,
      t: (key: string, values?: Record<string, string | number | Date>) => string
    ): Validator =>
      (value: unknown) => {
        const strVal = String(value ?? '').trim();
        if (!strVal) {
          return t(`property.validation.${label}Required`);
        }
        return undefined;
      },

  number:
    (
      label: string,
      t: (key: string, values?: Record<string, string | number | Date>) => string,
      min: number = 0
    ): Validator =>
      (value: unknown) => {
        const numVal = Number(value);
        if (value === null || value === undefined || value === '') return undefined; // optional
        if (!Number.isFinite(numVal) || numVal < min) {
          return t(`property.validation.${label}Invalid`, { min });
        }
        return undefined;
      },

  pattern:
    (
      label: string,
      pattern: RegExp,
      t: (key: string, values?: Record<string, string | number | Date>) => string
    ): Validator =>
      (value: unknown) => {
        const strVal = String(value ?? '').trim();
        if (!strVal) return undefined; // optional
        if (!pattern.test(strVal)) {
          return t(`property.validation.${label}Invalid`);
        }
        return undefined;
      },

  year:
    (
      label: string,
      t: (key: string, values?: Record<string, string | number | Date>) => string,
      pattern: RegExp = YEAR_REGEX
    ): Validator =>
      (value: unknown) => {
        const requiredError = propertyValidations.required(label, t)(value);
        if (requiredError) return requiredError;
        return propertyValidations.pattern(label, pattern, t)(value);
      },
};

/**
 * Office form validations
 */
export const officeValidations = {
  validate: (
    data: Partial<OfficeFormModel>,
    t: (key: string, params?: Record<string, string | number | Date>) => string,
    isEdit: boolean,
    tCommon?: (key: string, params?: Record<string, string | number | Date>) => string
  ) => {
    const errors: Record<string, string> = {};
    const tx = tCommon || t;

    const isGibberish = (val: string): boolean => {
      const lower = val.toLowerCase();
      const keyboardPatterns = ["qwerty", "asdfgh", "zxcvbn"];
      const hasKeyboard = keyboardPatterns.some((pat) => lower.includes(pat));
      const hasRepeatedChar = /([a-z0-9])\1{3,}/i.test(lower);
      const hasRepeatedSeq =
        /([a-z0-9]{2})\1{2,}/i.test(lower) || /([a-z0-9]{3,})\1+/i.test(lower);

      const words = lower.split(/[^a-z]+/);
      let hasGibberishWord = false;
      for (const word of words) {
        if (word.length >= 4 && !/[aeiouy]/.test(word)) {
          hasGibberishWord = true;
          break;
        }
        if (/[bcdfghjklmnpqrstvwxz]{6,}/.test(word)) {
          hasGibberishWord = true;
          break;
        }
      }

      return hasKeyboard || hasRepeatedChar || hasRepeatedSeq || hasGibberishWord;
    };

    // 1. Office Code
    const rawOfficeCode = data.officeCode;
    if (rawOfficeCode === undefined || rawOfficeCode === null || String(rawOfficeCode).trim() === "") {
      errors.officeCode = "Office Code is required.";
    } else {
      const codeStr = String(rawOfficeCode);
      if (codeStr.length !== 6) {
        errors.officeCode = "Office Code must be exactly 6 digits.";
      } else if (!/^[0-9]+$/.test(codeStr)) {
        errors.officeCode = "Only numeric values are allowed.";
      }
    }

    // 2. Office Name
    const rawOfficeName = data.officeName;
    if (rawOfficeName === undefined || rawOfficeName === null || String(rawOfficeName).trim() === "") {
      errors.officeName = "Office Name is required.";
    } else {
      const nameStr = String(rawOfficeName);
      if (nameStr.length < 3 || nameStr.length > 100) {
        errors.officeName = "Office Name must be between 3 and 100 characters.";
      } else if (!/^[A-Za-z0-9&-]+(?:\s[A-Za-z0-9&-]+)*$/.test(nameStr)) {
        errors.officeName = "Please enter a valid Office Name.";
      } else {
        // Smart Keyboard Pattern and Meaningless Repeats Validation
        const lowerName = nameStr.toLowerCase();
        const keyboardPatterns = ["qwerty", "asdfgh", "zxcvbn"];
        const hasKeyboard = keyboardPatterns.some((pat) => lowerName.includes(pat));
        const hasRepeatedChar = /([A-Za-z0-9&-])\1{3,}/i.test(lowerName);
        const hasRepeatedSeq =
          /([A-Za-z0-9&-]{2})\1{2,}/i.test(lowerName) || /([A-Za-z0-9&-]{3,})\1+/i.test(lowerName);

        if (hasKeyboard || hasRepeatedChar || hasRepeatedSeq) {
          errors.officeName = "Random or repeated characters are not allowed.";
        }
      }
    }

    // 3. Type
    if (!data.type || String(data.type).trim() === "") {
      errors.type = "Please select Office Type.";
    }

    // 4. Established Date
    if (data.establishedDate) {
      const dateStr = String(data.establishedDate).trim();
      const validation = DateUtils.validate(dateStr);
      if (!validation.valid) {
        if (validation.error === "futureDate") {
          errors.establishedDate = "Established Date cannot be a future date.";
        } else {
          errors.establishedDate = "Invalid date format.";
        }
      }
    }

    // 5. Email ID
    if (data.emailId) {
      const emailStr = String(data.emailId);
      if (emailStr.length > 100) {
        errors.emailId = "Email ID cannot exceed 100 characters.";
      } else if (
        !/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(emailStr)
      ) {
        errors.emailId = "Please enter a valid Email ID.";
      }
    }

    // 6. Phone
    if (data.phone) {
      const phoneStr = String(data.phone);
      if (phoneStr.length !== 10) {
        errors.phone = "Phone number must be 10 digits.";
      } else if (!/^[6-9]\d{9}$/.test(phoneStr)) {
        errors.phone = "Please enter a valid mobile number.";
      }
    }

    // 7. City
    if (data.city) {
      const cityStr = String(data.city);
      if (cityStr.length > 50) {
        errors.city = "City cannot exceed 50 characters.";
      } else if (
        cityStr.length < 2 ||
        !/^[A-Za-z]+(?:\s[A-Za-z]+)*$/.test(cityStr)
      ) {
        errors.city = "City should contain only alphabets and spaces.";
      } else if (isGibberish(cityStr)) {
        errors.city = "Random or repeated characters are not allowed.";
      }
    }

    // 8. Pincode
    if (data.pincode) {
      const pincodeStr = String(data.pincode);
      if (pincodeStr.length !== 6) {
        errors.pincode = "Pincode must be 6 digits.";
      } else if (!/^[1-9][0-9]{5}$/.test(pincodeStr)) {
        errors.pincode = "Please enter a valid Pincode.";
      }
    }

    // 9. Address
    if (data.address) {
      const addressStr = String(data.address);
      const trimmed = addressStr.trim();
      if (addressStr.length > 250) {
        errors.address = "Address cannot exceed 250 characters.";
      } else if (
        trimmed.length < 5 ||
        !/^[A-Za-z0-9,\-.\/\s]+$/.test(addressStr) ||
        /\s{2,}/.test(addressStr)
      ) {
        errors.address = "Please enter a valid Address.";
      } else if (isGibberish(addressStr)) {
        errors.address = "Random or repeated characters are not allowed.";
      }
    }

    const isActiveError = commonValidations.masterActiveStatus(tx, isEdit)(data.isActive);
    if (isActiveError) {
      errors.isActive = isActiveError;
    }

    return errors;
  },

  sanitizeCode: (value: string): string => {
    let sanitized = value.replace(/[^a-zA-Z0-9_]/g, '');
    if (sanitized.length > 20) {
      sanitized = sanitized.substring(0, 20);
    }
    return sanitized;
  },
};

/**
 * Old Details form validations
 */
export const oldDetailsValidations = {
  /**
   * Validates the floor information form data.
   *
   * @param formData - The floor form state
   * @param t - Translation function
   * @param hasSubUseOptions - Whether sub-use options are available (optional)
   * @returns Object containing validation errors
   */
  validateFloorInformation: (
    formData: FloorInformationFormData,
    t: (key: string, values?: Record<string, string | number | Date>) => string,
    hasSubUseOptions = true
  ) => {
    const validationData = {
      oldFloorId: formData.oldFloorId,
      oldSubFloorId: formData.oldSubFloorId,
      oldConstructionYear: formData.oldConstructionYear,
      oldAssessmentYear: formData.oldAssessmentYear,
      oldConstructionTypeId: formData.oldConstructionTypeId,
      oldTypeOfUseId: formData.oldTypeOfUseId,
      oldSubTypeOfUseId: formData.oldSubTypeOfUseId,
      oldAreaSqMeter: formData.oldAreaSqMeter,
      oldCarpetAreaSqFeet: formData.oldCarpetAreaSqFeet,
    };

    const validationRules: Record<string, Validator> = {
      oldFloorId: propertyValidations.required('floor', t),
      oldSubFloorId: propertyValidations.required('subFloor', t),
      oldConstructionYear: propertyValidations.year('constructionYear', t),
      oldAssessmentYear: propertyValidations.year('assessmentYear', t),
      oldConstructionTypeId: propertyValidations.required('constructionType', t),
      oldTypeOfUseId: propertyValidations.required('typeOfUse', t),
      oldAreaSqMeter: propertyValidations.required('carpetArea', t),
      oldCarpetAreaSqFeet: propertyValidations.required('carpetArea', t),
    };

    // Only require Sub Type if options are available
    if (hasSubUseOptions) {
      validationRules.oldSubTypeOfUseId = propertyValidations.required('subTypeOfUse', t);
    }

    const errors = validateForm(validationData, validationRules);

    // Additional validation for carpet area - must be a valid finite number > 0
    if (formData.oldAreaSqMeter) {
      const areaValue = Number(translateDevanagariDigits(String(formData.oldAreaSqMeter)));
      if (!Number.isFinite(areaValue) || areaValue <= 0) {
        errors.oldAreaSqMeter = t('property.validation.invalidCarpetArea') || 'Carpet area must be a valid number greater than 0';
      }
    }

    if (formData.oldCarpetAreaSqFeet) {
      const areaValue = Number(translateDevanagariDigits(String(formData.oldCarpetAreaSqFeet)));
      if (!Number.isFinite(areaValue) || areaValue <= 0) {
        errors.oldCarpetAreaSqFeet = t('property.validation.invalidCarpetArea') || 'Carpet area must be a valid number greater than 0';
      }
    }

    // Additional validation for construction year range (1700-2026)
    if (formData.oldConstructionYear) {
      const year = parseInt(translateDevanagariDigits(String(formData.oldConstructionYear)), 10);
      if (!isNaN(year) && (year < PROPERTY_VALIDATION_RULES.MIN_CONSTRUCTION_YEAR || year > PROPERTY_VALIDATION_RULES.MAX_CONSTRUCTION_YEAR)) {
        errors.oldConstructionYear = t('property.validation.constructionYearRange') || 'Construction year must be between 1700 and 2026';
      }
    }

    // Additional validation for assessment year range (1700-2026)
    if (formData.oldAssessmentYear) {
      const year = parseInt(translateDevanagariDigits(String(formData.oldAssessmentYear)), 10);
      if (!isNaN(year) && (year < PROPERTY_VALIDATION_RULES.MIN_CONSTRUCTION_YEAR || year > PROPERTY_VALIDATION_RULES.MAX_CONSTRUCTION_YEAR)) {
        errors.oldAssessmentYear = t('property.validation.assessmentYearRange') || 'Assessment year must be between 1700 and 2026';
      }
    }

    return errors;
  },

  /**
   * Validates old property taxation details.
   *
   * @param data - The taxation details payload
   * @param t - Translation function
   * @returns Object containing validation errors
   */
  validateOldPropertyDetails: (
    data: Partial<PropertyOldDetailsApiItem>,
    t: (key: string, values?: Record<string, string | number | Date>) => string
  ) => {
    const errors: Record<string, string> = {};

    // Numeric fields validation (must be non-negative numbers)
    const numericFields = [
      'oldPlotArea',
      'oldRV',
      'oldALV',
      'oldTotalTax',
      'oldGeneralTax',
      'oldConstructionArea',
      'oldCarpetAreaSqFeet',
      'oldCarpetAreaSqMeter',
      'oldConstructionTypeId',
      'oldTypeOfUseId',
    ] as const;

    numericFields.forEach((field) => {
      const val = data[field];
      if (val !== undefined && val !== null && String(val) !== '') {
        const numVal = Number(val);
        if (isNaN(numVal) || numVal < 0) {
          errors[field] = t(`property.validation.${field}Invalid`);
        }
      }
    });


    // String length and required validations
    if (data.oldZoneNo !== undefined) {
      const val = String(data.oldZoneNo).trim();
      if (val.length === 0) {
        errors.oldZoneNo = t('oldDetails.validation.zoneNameRequired');
      } else if (val.length > 20) {
        errors.oldZoneNo = t('oldDetails.validation.zoneNameMaxLength');
      }
    }
    if (data.oldWardNo !== undefined) {
      const val = String(data.oldWardNo).trim();
      if (val.length === 0) {
        errors.oldWardNo = t('oldDetails.validation.wardNoRequired');
      } else if (val.length > 10) {
        errors.oldWardNo = t('oldDetails.validation.wardNoMaxLength');
      }
    }
    if (data.oldPropertyNo !== undefined) {
      const val = String(data.oldPropertyNo).trim();
      if (val.length === 0) {
        errors.oldPropertyNo = t('oldDetails.validation.propertyNoRequired');
      } else if (val.length > 10) {
        errors.oldPropertyNo = t('oldDetails.validation.propertyNoMaxLength');
      }
    }
    if (data.oldPartitionNo !== undefined && data.oldPartitionNo !== null) {
      const val = String(data.oldPartitionNo).trim();
      if (val.length > 10) {
        errors.oldPartitionNo = t('oldDetails.validation.partitionNoMaxLength');
      }
    }
    if (data.oldEgovNo !== undefined && data.oldEgovNo !== null) {
      const val = String(data.oldEgovNo).trim();
      if (val.length > 10) {
        errors.oldEgovNo = t('oldDetails.validation.egovNoMaxLength');
      }
    }
    if (data.oldPlotNo !== undefined && data.oldPlotNo !== null) {
      const val = String(data.oldPlotNo).trim();
      if (val.length > 20) {
        errors.oldPlotNo = t('oldDetails.validation.plotNoMaxLength');
      }
    }

    // Construction Year validation (must be 4 digits)
    if (data.oldConstructionYear) {
      if (!YEAR_REGEX.test(data.oldConstructionYear)) {
        errors.oldConstructionYear = t('property.validation.constructionYearInvalid');
      }
    }

    return errors;
  },

  /**
   * Sanitizes old property taxation details.
   * Trims strings and ensures consistency.
   *
   * @param data - The taxation details payload
   * @returns Sanitized payload
   */
  sanitizeOldPropertyDetails: (
    data: Partial<PropertyOldDetailsApiItem>
  ): Partial<PropertyOldDetailsApiItem> => {
    const sanitized: Record<string, unknown> = { ...data };

    // Trim string fields
    const stringFields = [
      'oldWardNo',
      'oldPropertyNo',
      'oldPartitionNo',
      'oldEgovNo',
      'oldPlotNo',
      'oldZoneNo',
      'oldCSN',
    ] as const;

    stringFields.forEach((field) => {
      const val = sanitized[field];
      if (typeof val === 'string') {
        sanitized[field] = val.trim() || null;
      }
    });

    return sanitized as Partial<PropertyOldDetailsApiItem>;
  },

  /**
   * Validates old floor detail payload.
   *
   * @param data - The floor detail payload
   * @param t - Translation function
   * @returns Object containing validation errors
   */
  validateOldFloorDetails: (
    data: SaveOldFloorDetailPayload,
    t: (key: string, values?: Record<string, string | number | Date>) => string
  ) => {
    const errors: Record<string, string> = {};

    // Required numeric fields
    const requiredNumeric = {
      oldFloorId: 'floor',
      oldConstructionTypeId: 'constructionType',
      oldTypeOfUseId: 'typeOfUse',
    } as const;

    Object.entries(requiredNumeric).forEach(([field, label]) => {
      const val = data[field as keyof SaveOldFloorDetailPayload];
      if (!val || Number(val) <= 0) {
        errors[field] = t(`property.validation.${label}Required`);
      }
    });

    // Carpet area validation (required, positive)
    if (!data.oldCarpetAreaSqFeet || Number(data.oldCarpetAreaSqFeet) <= 0) {
      errors.oldCarpetAreaSqFeet = t('property.validation.carpetAreaInvalid');
    }

    // Construction Year validation (required, 4 digits)
    if (!data.oldConstructionYear) {
      errors.oldConstructionYear = t('property.validation.constructionYearRequired');
    } else if (!YEAR_REGEX.test(data.oldConstructionYear)) {
      errors.oldConstructionYear = t('property.validation.constructionYearInvalid');
    }

    return errors;
  },

  /**
   * Sanitizes old floor detail payload.
   *
   * @param data - The floor detail payload
   * @returns Sanitized payload
   */
  sanitizeOldFloorDetails: (data: SaveOldFloorDetailPayload): SaveOldFloorDetailPayload => {
    return {
      ...data,
      oldFloorId: Number(data.oldFloorId),
      oldSubFloorId: data.oldSubFloorId ? Number(data.oldSubFloorId) : null,
      oldConstructionTypeId: Number(data.oldConstructionTypeId),
      oldTypeOfUseId: Number(data.oldTypeOfUseId),
      oldSubTypeOfUseId: data.oldSubTypeOfUseId ? Number(data.oldSubTypeOfUseId) : null,
      oldCarpetAreaSqFeet: Number(data.oldCarpetAreaSqFeet),
      oldConstructionYear: String(data.oldConstructionYear).trim(),
    };
  },

  /**
   * Validates old taxes details payload.
   *
   * @param data - The taxes details payload
   * @param t - Translation function
   * @returns Object containing validation errors
   */
  validateOldTaxesDetails: (
    data: OldTaxesDetails,
    t: (key: string, values?: Record<string, string | number | Date>) => string
  ) => {
    const errors: Record<string, string> = {};

    if (!data.propertyId || data.propertyId <= 0) {
      errors.propertyId = t('property.validation.propertyIdRequired');
    }

    if (!data.taxYears || !Array.isArray(data.taxYears) || data.taxYears.length === 0) {
      errors.taxYears = t('property.validation.taxYearsRequired');
    } else {
      data.taxYears.forEach((year: OldTaxYear, index: number) => {
        if (!year.financeYearId || year.financeYearId <= 0) {
          errors[`taxYears.${index}.financeYearId`] = t('property.validation.financeYearRequired');
        }

        // Validate individual tax amounts
        if (year.taxes && Array.isArray(year.taxes)) {
          year.taxes.forEach((tax: OldTaxItem, taxIndex: number) => {
            const taxAmount = Number(tax.taxAmount);

            // Check for NaN
            if (isNaN(taxAmount)) {
              errors[`taxYears.${index}.taxes.${taxIndex}.taxAmount`] = t('property.validation.invalidTaxAmount');
            }
            // Check for negative values
            else if (taxAmount < 0) {
              errors[`taxYears.${index}.taxes.${taxIndex}.taxAmount`] = t('property.validation.negativeNotAllowed');
            }
          });
        }
      });
    }

    return errors;
  },

  /**
   * Sanitizes old taxes details payload.
   *
   * @param data - The taxes details payload
   * @returns Sanitized payload
   */
  sanitizeOldTaxesDetails: (data: OldTaxesDetails): OldTaxesDetails => {
    return {
      ...data,
      propertyId: Number(data.propertyId),
      taxYears: (data.taxYears || []).map((year: OldTaxYear) => ({
        ...year,
        financeYearId: Number(year.financeYearId),
        year: Number(year.year),
        taxes: (year.taxes || []).map((tax: OldTaxItem) => ({
          ...tax,
          taxId: Number(tax.taxId),
          taxAmount: Number(tax.taxAmount || 0),
        })),
      })),
    };
  },
};
