/**
 * KYC Validation Constants and Utilities
 * 
 * This module provides validation rules and helper functions for KYC (Know Your Customer)
 * form fields including Aadhar card numbers, mobile numbers, email addresses, and names.
 * 
 * @module kyc-validation
 */

import { translateDevanagariDigits } from '../input-sanitization';
import { EMAIL_REGEX, VALID_TLD_REGEX } from '../validation-rules';
import type { KycFormData } from '@/types/property-kyc.types';

/**
 * KYC validation rules and constraints
 * Used across KYC form components for consistent validation
 */
export const KYC_VALIDATION_RULES = {
  /** Required length for Aadhar card number (12 digits) */
  AADHAR_LENGTH: 12,
  /** Required length for mobile number (10 digits) */
  MOBILE_LENGTH: 10,
  /** Minimum length for names (2 characters) */
  NAME_MIN_LENGTH: 2,
  /** Maximum length for Property Holder Name and Occupier Name (1000 characters) */
  NAME_MAX_LENGTH: 1000,
  /** Email validation regex pattern */
  EMAIL_REGEX,
  /** Maximum length for address fields (500 characters) */
  ADDRESS_MAX_LENGTH: 500,
  /** Maximum length for shop name (200 characters) */
  SHOP_NAME_MAX_LENGTH: 200,
  /** Maximum length for email fields (100 characters) */
  EMAIL_MAX_LENGTH: 100,
} as const;


/**
 * Title options for KYC form owner/occupier selection
 * Includes English and commonly used romanized honorific options
 */
export const KYC_TITLE_OPTIONS = [
  { label: 'Mr', value: 'Mr' },
  { label: 'Mrs', value: 'Mrs' },
  { label: 'Ms', value: 'Ms' },
  { label: 'Dr', value: 'Dr' },
  { label: 'Prof', value: 'Prof' },
  { label: 'Shri', value: 'Shri' },
  { label: 'Smt', value: 'Smt' },
  { label: 'Kumari', value: 'Kumari' },
] as const;

/**
 * KYC validation helper functions
 * Provides reusable validators for common KYC form fields
 */
export const kycValidators = {
  /**
   * Validate email address format
   * @param email - Email address to validate
   * @returns True if valid or empty, false if invalid format
   */
  isValidEmail: (email: string): boolean => {
    const trimmedEmail = email.trim();
    return !trimmedEmail || KYC_VALIDATION_RULES.EMAIL_REGEX.test(trimmedEmail);
  },

  /**
   * Validate name length and format
   * Names must NOT contain any numbers (0-9)
   * @param name - Name to validate
   * @returns True if name meets minimum and maximum length requirements and doesn't contain numbers
   */
  isValidName: (name: string): boolean => {
    const trimmed = name.trim();

    // Check if name contains any numbers (0-9) - REJECT if found
    if (/\d/.test(trimmed)) return false;

    // A valid name must contain at least one letter
    const hasValidChars = /[\p{L}]/u.test(trimmed);
    if (!hasValidChars) return false;

    return (
      trimmed.length >= KYC_VALIDATION_RULES.NAME_MIN_LENGTH &&
      trimmed.length <= KYC_VALIDATION_RULES.NAME_MAX_LENGTH
    );
  },

  /**
   * Check if a number contains repeated or invalid sequences
   * Rejects patterns like 00000, 111111, 222222, etc.
   * @param digits - Digit string to validate
   * @param minLength - Minimum consecutive repetitions to reject (default: 5)
   * @returns True if number contains invalid repeated sequences
   */
  hasRepeatedSequence: (digits: string, minLength: number = 5): boolean => {
    if (!digits || digits.length < minLength) return false;

    // Check for consecutive repeated digits (e.g., 00000, 11111, 22222)
    for (let i = 0; i <= digits.length - minLength; i++) {
      const char = digits[i];
      let count = 1;
      for (let j = i + 1; j < digits.length && digits[j] === char; j++) {
        count++;
        if (count >= minLength) return true;
      }
    }
    return false;
  },

  /**
   * Get validation message for repeated sequences
   * @returns Validation error message
   */
  getRepeatedSequenceMessage: (): string => {
    return 'Repeated number sequences are not allowed';
  },

  /**
   * Validate mobile number (10 digits)
   * Allows empty values or exactly 10 digits
   * Rejects repeated sequences like 0000000000, 1111111111, etc.
   * @param mobile - Mobile number string (can include non-digit characters)
   * @returns True if valid (empty or exactly 10 digits without repeated sequences)
   */
  isValidMobile: (mobile: string): boolean => {
    const digits = mobile.replace(/\D/g, '');
    if (digits.length === 0) return true;
    if (digits.length !== KYC_VALIDATION_RULES.MOBILE_LENGTH) return false;
    if (!/^[6-9]/.test(digits)) return false;

    // Check for repeated sequences
    return !kycValidators.hasRepeatedSequence(digits, 5);
  },

  /**
   * Validate Aadhar card number (12 digits)
   * Allows empty values or exactly 12 digits
   * Rejects repeated sequences like 000000000000, 111111111111, etc.
   * @param aadhar - Aadhar number string (can include non-digit characters)
   * @returns True if valid (empty or exactly 12 digits without repeated sequences)
   */
  isValidAadhar: (aadhar: string): boolean => {
    const digits = aadhar.replace(/\D/g, '');
    if (digits.length === 0) return true;
    if (digits.length !== KYC_VALIDATION_RULES.AADHAR_LENGTH) return false;
    if (digits.startsWith('0') || digits.startsWith('1')) return false;

    // Check for repeated sequences
    return !kycValidators.hasRepeatedSequence(digits, 5);
  },

  /**
   * Validate Pin Code (6 digits)
   * Allows empty values or exactly 6 digits
   * Rejects repeated sequences like 000000, 111111, etc.
   * @param pinCode - Pin code string
   * @returns True if valid (empty or exactly 6 digits without repeated sequences)
   */
  isValidPinCode: (pinCode: string): boolean => {
    if (!pinCode) return true;
    const trimmed = pinCode.trim();
    if (trimmed.length === 0) return true;
    
    if (!/^[1-9][0-9]{5}$/.test(trimmed)) return false;
    if (kycValidators.hasRepeatedSequence(trimmed, 6)) return false;

    return true;
  },
} as const;


/**
 * Property validation rules and constraints
 */
export const PROPERTY_VALIDATION_RULES = {
  /** Maximum length for flat/shop number (10 characters, allows - and /) */
  FLAT_SHOP_NO_MAX_LENGTH: 10,
  /** Maximum length for plot number (10 characters, allows - and /) */
  PLOT_NO_MAX_LENGTH: 10,
  /** Maximum digits for plot area (15 digits, 4 decimals) */
  PLOT_AREA_MAX_DIGITS: 15,
  /** Maximum decimal places for plot area */
  PLOT_AREA_MAX_DECIMALS: 4,
  /** Maximum length for survey number (allows - and /) */
  SURVEY_NO_MAX_LENGTH: 50,
  /** Maximum length for sub zone number (allows - and /) */
  SUB_ZONE_NO_MAX_LENGTH: 50,
  /** Maximum length for tax zone number (allows a-z, 0-9, -, /) */
  TAX_ZONE_NO_MAX_LENGTH: 50,
  /** Maximum length for residential toilet count (2 digits) */
  RESIDENTIAL_TOILET_MAX_LENGTH: 2,
  /** Maximum length for commercial toilet count (2 digits) */
  COMMERCIAL_TOILET_MAX_LENGTH: 2,
  /** Minimum construction year */
  MIN_CONSTRUCTION_YEAR: 1700,
  /** Maximum construction year (current year) */
  MAX_CONSTRUCTION_YEAR: 2026,
} as const;

/**
 * Property field validation helper functions
 * Provides reusable validators for property form fields
 */
export const propertyValidators = {
  /**
   * Check if value contains only invalid special characters
   * @param value - Value to check
   * @returns True if value is invalid (only special characters)
   */
  isOnlyInvalidCharacters: (value: string): boolean => {
    if (!value || !value.trim()) return false;
    // Check if string contains only invalid characters and no valid alphanumerics (including Devanagari)
    const hasValidChars = /[a-zA-Z0-9\u0900-\u097F]/g.test(value);
    return !hasValidChars;
  },

  /**
   * Validate flat/shop number format
   * Allows alphanumeric (including Devanagari), hyphen (-), and forward slash (/)
   * @param value - Flat/shop number to validate
   * @returns True if valid format
   */

  isValidFlatShopNo: (value: string): boolean => {
    if (!value) return true; // Empty is valid (optional field)
    const trimmed = value.trim();
    if (trimmed.length === 0) return true;
    if (trimmed.length > PROPERTY_VALIDATION_RULES.FLAT_SHOP_NO_MAX_LENGTH) return false;

    // Check for only invalid characters
    if (propertyValidators.isOnlyInvalidCharacters(trimmed)) return false;

    // Allow alphanumeric (including Devanagari), hyphen, and forward slash
    // Value must start and end with alphanumeric, containing allowed separators in between
    const validPattern = /^[a-zA-Z0-9\u0900-\u097F]+([a-zA-Z0-9\u0900-\u097F/-]*[a-zA-Z0-9\u0900-\u097F]+)?$/;
    return validPattern.test(trimmed);
  },

  /**
   * Validate flat/shop number format
   * Allows letters, numbers, hyphen (-), and forward slash (/)
   * Hyphen and slash must be between letters/numbers.
   */
  // isValidFlatShopNo: (value: string): boolean => {
  //   if (!value) return true; // Optional field

  //   const trimmed = value.trim();

  //   if (trimmed.length === 0) return true;

  //   if (trimmed.length > PROPERTY_VALIDATION_RULES.FLAT_SHOP_NO_MAX_LENGTH) {
  //     return false;
  //   }

  //   // Must contain at least one letter or number
  //   if (!/[a-zA-Z0-9]/.test(trimmed)) {
  //     return false;
  //   }

  // Valid examples: A101, A-101, A/101, A-101/B
  // Invalid examples: -A101, A101-, A--101, A//101
  //   const validPattern = /^[a-zA-Z0-9]+([-/][a-zA-Z0-9]+)*$/;

  //   return validPattern.test(trimmed);
  // },


  /**
   * Validate plot number format
   * Allows alphanumeric (including Devanagari), hyphen (-), and forward slash (/)
   * @param value - Plot number to validate
   * @returns True if valid format
   */
  isValidPlotNo: (value: string): boolean => {
    if (!value) return true; // Empty is valid (optional field)
    const trimmed = value.trim();
    if (trimmed.length === 0) return true;
    if (trimmed.length > PROPERTY_VALIDATION_RULES.PLOT_NO_MAX_LENGTH) return false;

    // Check for only invalid characters
    if (propertyValidators.isOnlyInvalidCharacters(trimmed)) return false;

    // Allow alphanumeric (including Devanagari), hyphen, and forward slash
    const validPattern = /^[a-zA-Z0-9\u0900-\u097F]+([a-zA-Z0-9\u0900-\u097F/-]*[a-zA-Z0-9\u0900-\u097F]+)?$/;
    return validPattern.test(trimmed);
  },

  /**
   * Validate plot area format
   * Allows max 15 digits with up to 4 decimal places
   * @param value - Plot area to validate
   * @returns True if valid format
   */
  isValidPlotArea: (value: string | number | null | undefined): boolean => {
    if (value === null || value === undefined || value === '') return true;
    const str = translateDevanagariDigits(String(value));
    const num = Number(str);

    // Must be a valid positive number
    if (isNaN(num) || num < 0 || !isFinite(num)) return false;

    // Check decimal places
    const parts = str.split('.');
    if (parts.length > 2) return false; // More than one decimal point

    // Check integer part (max 15 digits total, accounting for decimals)
    const integerPart = parts[0];
    const decimalPart = parts[1] || '';

    // Max 4 decimal places
    if (decimalPart.length > PROPERTY_VALIDATION_RULES.PLOT_AREA_MAX_DECIMALS) return false;

    // Total digits (integer + decimal) should not exceed 15
    const totalDigits = integerPart.replace(/^0+/, '').length + decimalPart.length;
    return totalDigits <= PROPERTY_VALIDATION_RULES.PLOT_AREA_MAX_DIGITS;
  },

  /**
   * Validate numeric field (like plot area, toilet count)
   * Only allows positive numbers, no negative values
   * @param value - Numeric value to validate
   * @returns True if valid (empty or positive number)
   */
  isValidPositiveNumber: (value: string | number | null | undefined): boolean => {
    if (value === null || value === undefined || value === '') return true; // Empty is valid
    const str = translateDevanagariDigits(String(value));
    const num = Number(str);
    return !isNaN(num) && num >= 0 && isFinite(num);
  },

  /**
   * Validate survey number format
   * Allows alphanumeric and common survey number separators (/, -)
   * @param value - Survey number to validate
   * @returns True if valid format
   */
  isValidSurveyNo: (value: string): boolean => {
    if (!value) return true; // Empty is valid (optional field)
    const trimmed = value.trim();
    if (trimmed.length === 0) return true;

    // Check for only invalid characters
    if (propertyValidators.isOnlyInvalidCharacters(trimmed)) return false;

    // Allow alphanumeric (including Devanagari) and / or - as separators
    const validPattern = /^[a-zA-Z0-9\u0900-\u097F]+([a-zA-Z0-9\u0900-\u097F/-]*[a-zA-Z0-9\u0900-\u097F]+)?$/;
    return validPattern.test(trimmed);
  },

  /**
   * Validate sub zone number format
   * Allows alphanumeric, hyphen, and forward slash
   * @param value - Sub zone number to validate
   * @returns True if valid format
   */
  isValidSubZoneNo: (value: string): boolean => {
    if (!value) return true; // Empty is valid (optional field)
    const trimmed = value.trim();
    if (trimmed.length === 0) return true;

    // Check for only invalid characters
    if (propertyValidators.isOnlyInvalidCharacters(trimmed)) return false;

    // Allow alphanumeric (including Devanagari), hyphen, and forward slash
    const validPattern = /^[a-zA-Z0-9\u0900-\u097F]+([a-zA-Z0-9\u0900-\u097F/-]*[a-zA-Z0-9\u0900-\u097F]+)?$/;
    return validPattern.test(trimmed);
  },

  /**
   * Validate tax zone number format
   * Allows alphanumeric (a-z, 0-9), hyphen (-), and forward slash (/)
   * @param value - Tax zone number to validate
   * @returns True if valid format
   */
  isValidTaxZoneNo: (value: string): boolean => {
    if (!value) return true; // Empty is valid (optional field)
    const trimmed = value.trim();
    if (trimmed.length === 0) return true;

    // Check for only invalid characters
    if (propertyValidators.isOnlyInvalidCharacters(trimmed)) return false;

    // Allow alphanumeric, hyphen, and forward slash only
    const validPattern = /^[a-zA-Z0-9]+([a-zA-Z0-9/-]*[a-zA-Z0-9]+)?$/;
    return validPattern.test(trimmed);
  },

  /**
   * Validate construction year
   * Only allows years between 1700 and 2026
   * @param year - Year to validate
   * @returns True if valid year
   */
  isValidConstructionYear: (year: string | number | null | undefined): boolean => {
    if (year === null || year === undefined || year === '') return true;
    const yearNum = Number(year);
    return (
      !isNaN(yearNum) &&
      yearNum >= PROPERTY_VALIDATION_RULES.MIN_CONSTRUCTION_YEAR &&
      yearNum <= PROPERTY_VALIDATION_RULES.MAX_CONSTRUCTION_YEAR
    );
  },

  /**
   * Validate address field - should not contain only special characters
   * @param value - Address to validate
   * @returns True if valid (contains valid characters)
   */
  isValidAddress: (value: string): boolean => {
    if (!value) return true; // Empty is valid (optional field)
    const trimmed = value.trim();
    if (trimmed.length === 0) return true;

    // Check if address contains at least some valid characters
    const hasValidChars = /[\p{L}\p{N}]/u.test(trimmed);
    return hasValidChars;
  },
} as const;

/**
 * Enhanced KYC validators with stricter email validation
 */
export const enhancedKycValidators = {
  /**
   * Enhanced email validation - only allows letters, numbers, periods, and @ symbol
   * Rejects underscores, hyphens, plus signs, and all other special characters
   * Allows incomplete emails while typing (e.g., xyz@gmail.) but validates final format
   * @param email - Email address to validate
   * @returns True if valid or empty, false if invalid format
   */
  isValidEmail: (email: string, isStrict = false): boolean => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) return true;

    // Only allow letters, numbers, periods, and @
    if (/[^a-zA-Z0-9@.]/.test(trimmedEmail)) return false;

    // Reject consecutive periods (..)
    if (/\.{2,}/.test(trimmedEmail)) return false;

    // Reject emails starting with period
    if (/^\./.test(trimmedEmail)) return false;

    // Reject period immediately before @
    if (/\.@/.test(trimmedEmail)) return false;

    // Ensure there's exactly one @ symbol
    if ((trimmedEmail.match(/@/g) || []).length !== 1) return false;

    // If email doesn't contain @, it's incomplete but not invalid yet
    if (!trimmedEmail.includes('@')) return !isStrict;

    // Check for valid domain structure - must have at least one dot after @
    const atIndex = trimmedEmail.indexOf('@');
    const domain = trimmedEmail.substring(atIndex + 1);

    // If domain is empty or doesn't have content, it's incomplete (allow while typing)
    if (!domain || domain.length < 2) return !isStrict;

    // If domain has a dot, check for valid TLD format
    if (domain.includes('.')) {
      const domainParts = domain.split('.');
      // Must have at least 2 parts (domain.tld)
      if (domainParts.length < 2) return false;
      // Last part (TLD) must be a standard/valid extension
      const tld = domainParts[domainParts.length - 1];
      if (!tld || tld.length < 2 || !VALID_TLD_REGEX.test(tld)) return false;
    } else {
      // Domain has no dot yet - allow while typing (e.g., xyz@gmail)
      return !isStrict;
    }

    // Strict email validation pattern for complete emails
    const validEmailPattern = EMAIL_REGEX;

    return validEmailPattern.test(trimmedEmail) && trimmedEmail.length <= KYC_VALIDATION_RULES.EMAIL_MAX_LENGTH;
  },

  /**
   * Validate address - should not contain only special characters and respects length limits
   * @param address - Address to validate
   * @returns True if valid
   */
  isValidAddress: (address: string): boolean => {
    if (!address) return true;
    const trimmed = address.trim();
    if (trimmed.length === 0) return true;

    // Allow any sequence of hyphens like "-", "--", "---", etc.
    if (/^-+$/.test(trimmed)) return true;

    // Check if address contains at least some valid letters or numbers
    const hasValidChars = /[\p{L}\p{N}]/u.test(trimmed);
    if (!hasValidChars) return false;

    return trimmed.length <= KYC_VALIDATION_RULES.ADDRESS_MAX_LENGTH;
  },

  /**
   * Validate flat/shop number - allows alphanumeric characters and respects length limits
   * @param name - Flat/shop number to validate
   * @returns True if valid
   */
  isValidShopName: (name: string): boolean => {
    if (!name) return true;
    const trimmed = name.trim();
    if (trimmed.length === 0) return true;

    // Check if contains at least some valid letters or numbers
    const hasValidChars = /[\p{L}\p{N}]/u.test(trimmed);
    if (!hasValidChars) return false;

    return (
      trimmed.length >= KYC_VALIDATION_RULES.NAME_MIN_LENGTH &&
      trimmed.length <= KYC_VALIDATION_RULES.SHOP_NAME_MAX_LENGTH
    );
  },

  /**
   * Validate occupier name - must NOT contain numbers (0-9) and respects length limits
   * @param name - Occupier name to validate
   * @returns True if valid (no numbers, not only special characters)
   */
  isValidOccupierName: (name: string): boolean => {
    if (!name) return true;
    const trimmed = name.trim();
    if (trimmed.length === 0) return true;

    // Check if name contains any numbers (0-9) - REJECT if found
    if (/\d/.test(trimmed)) return false;

    // Check if contains at least some valid letters
    const hasValidChars = /[\p{L}]/u.test(trimmed);
    if (!hasValidChars) return false;

    return (
      trimmed.length >= KYC_VALIDATION_RULES.NAME_MIN_LENGTH &&
      trimmed.length <= KYC_VALIDATION_RULES.NAME_MAX_LENGTH
    );
  },
} as const;

export const MAX_PROPERTY_ID = 2147483647; // Maximum value for a signed 32-bit integer

/**
 * Schema-based validator for the KYC form.
 * Checks each field individually and returns the first error message, or null if all fields are valid.
 */
export const validateKycForm = (
  formData: KycFormData,
  mobileValue: string,
  alternateMobileValue: string,
  aadharValue: string,
  t: (key: string) => string
): string | null => {
  const ownerName = formData.ownerName ?? '';
  const ownerNameEnglish = formData.ownerNameEnglish ?? '';
  const email = formData.emailId ?? '';
  const address = formData.address ?? '';
  const addressEnglish = formData.addressEnglish ?? '';
  const shopName = formData.flatOrShopName ?? '';
  const shopNameEnglish = formData.flatOrShopNameEnglish ?? '';
  const occupierName = formData.occupierName ?? '';
  const occupierNameEnglish = formData.occupierNameEnglish ?? '';
  const pinCode = formData.pinCode ?? '';

  // Owner Name Regional
  if (ownerName.trim().length === 0) {
    return t('kyc.errors.ownerNameRequired');
  }
  if (!kycValidators.isValidName(ownerName)) {
    return t('kyc.validation.invalidName');
  }
  if (ownerName.trim().length < KYC_VALIDATION_RULES.NAME_MIN_LENGTH || ownerName.trim().length > KYC_VALIDATION_RULES.NAME_MAX_LENGTH) {
    return t('society.validation.invalidNameLength') || 'Invalid name length';
  }

  // Owner Name English
  if (ownerNameEnglish.trim().length === 0) {
    return t('kyc.errors.ownerNameRequired');
  }
  if (!kycValidators.isValidName(ownerNameEnglish)) {
    return t('kyc.validation.invalidName');
  }
  if (ownerNameEnglish.trim().length < KYC_VALIDATION_RULES.NAME_MIN_LENGTH || ownerNameEnglish.trim().length > KYC_VALIDATION_RULES.NAME_MAX_LENGTH) {
    return t('society.validation.invalidNameLength') || 'Invalid name length';
  }

  // Email
  if (email.trim().length > 0 && !enhancedKycValidators.isValidEmail(email, true)) {
    return t('kyc.validation.invalidEmail');
  }

  // Address Regional
  if (address.trim().length > 0 && !enhancedKycValidators.isValidAddress(address)) {
    return t('kyc.validation.invalidAddress');
  }

  // Address English
  if (addressEnglish.trim().length > 0 && !enhancedKycValidators.isValidAddress(addressEnglish)) {
    return t('kyc.validation.invalidAddress');
  }

  // Shop Name Regional
  if (shopName.trim().length > 0 && !enhancedKycValidators.isValidShopName(shopName)) {
    return t('kyc.validation.invalidName');
  }

  // Shop Name English
  if (shopNameEnglish.trim().length > 0 && !enhancedKycValidators.isValidShopName(shopNameEnglish)) {
    return t('kyc.validation.invalidName');
  }

  // Occupier Name Regional
  if (occupierName.trim().length > 0 && !enhancedKycValidators.isValidOccupierName(occupierName)) {
    return t('kyc.validation.invalidName');
  }

  // Occupier Name English
  if (occupierNameEnglish.trim().length > 0 && !enhancedKycValidators.isValidOccupierName(occupierNameEnglish)) {
    return t('kyc.validation.invalidName');
  }

  // Pin Code
  if (pinCode.trim().length > 0) {
    if (pinCode.trim().startsWith('0')) {
      return t('kyc.validation.pinCodeCannotStartWithZero') || "PIN code cannot start with 0";
    }
    if (kycValidators.hasRepeatedSequence(pinCode.trim(), 6)) {
      return t('kyc.validation.invalidRepeatedSequence') || "Cannot enter repeated numbers";
    }
    if (!/^[1-9][0-9]{5}$/.test(pinCode.trim())) {
      return t('kyc.validation.invalidPinCode') || "Please enter a valid 6-digit PIN code.";
    }
  }

  // Mobile Number
  if (mobileValue.trim().length > 0) {
    const mobileDigits = mobileValue.replace(/\D/g, '');
    if (mobileDigits.length !== 10) {
      return t('kyc.validation.invalidMobile');
    }
    if (!/^[6-9]/.test(mobileDigits)) {
      return t('kyc.validation.invalidMobileStart');
    }
    if (kycValidators.hasRepeatedSequence(mobileDigits, 5)) {
      return t('kyc.validation.invalidRepeatedSequence');
    }
  }

  // Alternate Mobile Number
  if (alternateMobileValue.trim().length > 0) {
    const altDigits = alternateMobileValue.replace(/\D/g, '');
    if (altDigits.length !== 10) {
      return t('kyc.validation.invalidMobile');
    }
    if (!/^[6-9]/.test(altDigits)) {
      return t('kyc.validation.invalidMobileStart');
    }
    if (kycValidators.hasRepeatedSequence(altDigits, 5)) {
      return t('kyc.validation.invalidRepeatedSequence');
    }
  }

  // Aadhar Number
  if (aadharValue.trim().length > 0) {
    const aadharDigits = aadharValue.replace(/\D/g, '');
    if (aadharDigits.length !== 12) {
      return t('kyc.validation.invalidAadhar');
    }
    if (aadharDigits.startsWith('0') || aadharDigits.startsWith('1')) {
      return t('kyc.validation.invalidAadharStart');
    }
    if (kycValidators.hasRepeatedSequence(aadharDigits, 5)) {
      return t('kyc.validation.invalidRepeatedSequence');
    }
  }

  return null;
};
