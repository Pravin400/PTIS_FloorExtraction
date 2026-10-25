/**
 * Old Taxation Validation Constants and Utilities
 * 
 * This module provides validation rules and helper functions for Old Taxation
 * form fields including zone names, ward numbers, property numbers, areas,
 * tax values, and related fields.
 * 
 * @module old-taxation-validation
 */

/**
 * Old Taxation validation rules and constraints
 * Used across Old Taxation form components for consistent validation
 */
import { translateDevanagariDigits } from '../input-sanitization';

export const OLD_TAXATION_VALIDATION_RULES = {
  /** Maximum length for zone name (100 characters) */
  ZONE_NAME_MAX_LENGTH: 100,
  /** Maximum length for ward number (50 characters) */
  WARD_NO_MAX_LENGTH: 50,
  /** Maximum length for property number (50 characters) */
  PROPERTY_NO_MAX_LENGTH: 50,
  /** Maximum length for partition number (50 characters) */
  PARTITION_NO_MAX_LENGTH: 50,
  /** Maximum length for e-governance number (50 characters) */
  EGOV_NO_MAX_LENGTH: 50,
  /** Maximum length for plot number (50 characters) */
  PLOT_NO_MAX_LENGTH: 50,
  /** Maximum total digits for area fields (15 digits) */
  AREA_MAX_DIGITS: 15,
  /** Maximum decimal places for area fields (4 decimals) */
  AREA_MAX_DECIMALS: 4,
  /** Maximum total digits for tax/value fields (15 digits) */
  TAX_MAX_DIGITS: 15,
  /** Maximum decimal places for tax/value fields (2 decimals) */
  TAX_MAX_DECIMALS: 2,
  /** Minimum length for text fields (1 character) */
  TEXT_MIN_LENGTH: 1,
  /** Regex pattern for text fields (alphanumeric, spaces, hyphen, slash) */
  TEXT_FIELD_REGEX: /^[A-Za-z0-9\u0900-\u097F\s\-\/]+$/,
  /** Regex pattern for e-gov field (alphanumeric, hyphen, slash - no spaces) */
  EGOV_FIELD_REGEX: /^[A-Za-z0-9\u0900-\u097F\-\/]+$/,
  /** Regex pattern for area fields (positive decimals with 4 decimal places) */
  AREA_FIELD_REGEX: /^[0-9०-९]{0,15}(\.[0-9०-९]{0,4})?$/,
  /** Regex pattern for tax/value fields (positive decimals with 2 decimal places) */
  TAX_FIELD_REGEX: /^[0-9०-९]{0,15}(\.[0-9०-९]{0,2})?$/,
} as const;

/**
 * Old Taxation validation helper functions
 * Provides reusable validators for old taxation form fields
 */
export const oldTaxationValidators = {
  /**
   * Validate text field (zone name, ward no, property no, partition no, plot no)
   * Allows only alphanumeric characters, spaces, hyphens, and slashes
   * Must not be only spaces
   * @param value - Value to validate
   * @param maxLength - Maximum allowed length
   * @param isRequired - Whether field is required
   * @returns True if valid
   */
  isValidTextField: (value: string, maxLength: number, isRequired: boolean = false): boolean => {
    if (!value || value.trim().length === 0) {
      return !isRequired;
    }
    
    const trimmed = value.trim();
    
    // Must not contain invalid characters
    if (!OLD_TAXATION_VALIDATION_RULES.TEXT_FIELD_REGEX.test(trimmed)) {
      return false;
    }
    
    // Check length constraints
    return trimmed.length >= OLD_TAXATION_VALIDATION_RULES.TEXT_MIN_LENGTH &&
           trimmed.length <= maxLength;
  },

  /**
   * Validate zone name (required field)
   * @param zoneName - Zone name to validate
   * @returns True if valid
   */
  isValidZoneName: (zoneName: string): boolean => {
    return oldTaxationValidators.isValidTextField(
      zoneName,
      OLD_TAXATION_VALIDATION_RULES.ZONE_NAME_MAX_LENGTH,
      true
    );
  },

  /**
   * Validate ward number (required field)
   * @param wardNo - Ward number to validate
   * @returns True if valid
   */
  isValidWardNo: (wardNo: string): boolean => {
    return oldTaxationValidators.isValidTextField(
      wardNo,
      OLD_TAXATION_VALIDATION_RULES.WARD_NO_MAX_LENGTH,
      true
    );
  },

  /**
   * Validate property number (required field)
   * @param propertyNo - Property number to validate
   * @returns True if valid
   */
  isValidPropertyNo: (propertyNo: string): boolean => {
    return oldTaxationValidators.isValidTextField(
      propertyNo,
      OLD_TAXATION_VALIDATION_RULES.PROPERTY_NO_MAX_LENGTH,
      true
    );
  },

  /**
   * Validate partition number (optional field)
   * @param partitionNo - Partition number to validate
   * @returns True if valid
   */
  isValidPartitionNo: (partitionNo: string): boolean => {
    return oldTaxationValidators.isValidTextField(
      partitionNo,
      OLD_TAXATION_VALIDATION_RULES.PARTITION_NO_MAX_LENGTH,
      false
    );
  },

  /**
   * Validate plot number (optional field)
   * @param plotNo - Plot number to validate
   * @returns True if valid
   */
  isValidPlotNo: (plotNo: string): boolean => {
    return oldTaxationValidators.isValidTextField(
      plotNo,
      OLD_TAXATION_VALIDATION_RULES.PLOT_NO_MAX_LENGTH,
      false
    );
  },

  /**
   * Validate e-governance number (optional field)
   * Allows only alphanumeric characters, hyphens, and slashes (no spaces)
   * @param egovNo - E-governance number to validate
   * @returns True if valid
   */
  isValidEgovNo: (egovNo: string): boolean => {
    if (!egovNo || egovNo.trim().length === 0) {
      return true; // Optional field
    }

    const trimmed = egovNo.trim();

    // Must not contain invalid characters (no spaces allowed)
    if (!OLD_TAXATION_VALIDATION_RULES.EGOV_FIELD_REGEX.test(trimmed)) {
      return false;
    }

    // Check length constraints
    return trimmed.length <= OLD_TAXATION_VALIDATION_RULES.EGOV_NO_MAX_LENGTH;
  },

  /**
   * Validate area field (plot area, construction area)
   * Allows only positive decimal numbers with up to 4 decimal places
   * Maximum 15 total digits
   * @param value - Area value to validate
   * @returns True if valid
   */
  isValidAreaField: (value: string | number): boolean => {
    if (value === '' || value === null || value === undefined) {
      return true; // Optional field
    }

    const strValue = String(value);

    // Must match area field regex (positive decimal with max 4 decimal places)
    if (!OLD_TAXATION_VALIDATION_RULES.AREA_FIELD_REGEX.test(strValue)) {
      return false;
    }

    // Additional validation: must not be negative
    const numValue = parseFloat(translateDevanagariDigits(strValue));
    return !isNaN(numValue) && numValue >= 0;
  },

  /**
   * Validate tax/value field (RV, ALV, property tax, total tax)
   * Allows only positive decimal numbers with up to 2 decimal places
   * Maximum 15 total digits
   * @param value - Tax/value to validate
   * @returns True if valid
   */
  isValidTaxField: (value: string | number): boolean => {
    if (value === '' || value === null || value === undefined) {
      return true; // Optional field
    }

    const strValue = String(value);

    // Must match tax field regex (positive decimal with max 2 decimal places)
    if (!OLD_TAXATION_VALIDATION_RULES.TAX_FIELD_REGEX.test(strValue)) {
      return false;
    }

    // Additional validation: must not be negative
    const numValue = parseFloat(translateDevanagariDigits(strValue));
    return !isNaN(numValue) && numValue >= 0;
  },

  /**
   * Sanitize text field input
   * Removes all characters except alphanumeric, spaces, hyphens, and slashes
   * @param value - Value to sanitize
   * @returns Sanitized value
   */
  sanitizeTextField: (value: string): string => {
    return value.replace(/[^A-Za-z0-9\u0900-\u097F\s\-\/]/g, '');
  },

  /**
   * Sanitize e-governance field input
   * Removes all characters except alphanumeric, hyphens, and slashes (no spaces)
   * @param value - Value to sanitize
   * @returns Sanitized value
   */
  sanitizeEgovField: (value: string): string => {
    return value.replace(/[^A-Za-z0-9\u0900-\u097F\-\/]/g, '');
  },

  /**
   * Validate and format area input
   * Ensures proper decimal format with max 4 decimal places
   * @param value - Area value to validate and format
   * @returns Formatted value or original if invalid
   */
  formatAreaInput: (value: string): string => {
    if (!value) return '';
    
    // Remove leading zeros except for "0" or "0."
    const formatted = value.replace(/^[0०]+(?=[0-9०-९])/, '');
    
    // Ensure it matches the area regex pattern
    if (OLD_TAXATION_VALIDATION_RULES.AREA_FIELD_REGEX.test(formatted)) {
      return formatted;
    }
    
    return value;
  },

  /**
   * Validate and format tax input
   * Ensures proper decimal format with max 2 decimal places
   * @param value - Tax value to validate and format
   * @returns Formatted value or original if invalid
   */
  formatTaxInput: (value: string): string => {
    if (!value) return '';
    
    // Remove leading zeros except for "0" or "0."
    const formatted = value.replace(/^[0०]+(?=[0-9०-९])/, '');
    
    // Ensure it matches the tax regex pattern
    if (OLD_TAXATION_VALIDATION_RULES.TAX_FIELD_REGEX.test(formatted)) {
      return formatted;
    }
    
    return value;
  },

  areRequiredFieldsFilled: (formData: {
    oldZoneNo: string;
    oldWardNo: string;
    oldPropertyNo: string;
    oldPlotArea: string | number;
  }): boolean => {
    return (
      oldTaxationValidators.isValidZoneName(formData.oldZoneNo) &&
      oldTaxationValidators.isValidWardNo(formData.oldWardNo) &&
      oldTaxationValidators.isValidPropertyNo(formData.oldPropertyNo) &&
      oldTaxationValidators.isValidAreaField(formData.oldPlotArea) &&
      String(formData.oldPlotArea).trim().length > 0
    );
  },
} as const;

/**
 * Validation error messages for Old Taxation fields
 */
export const OLD_TAXATION_ERROR_MESSAGES = {
  ZONE_NAME_REQUIRED: 'Zone Name is required',
  ZONE_NAME_INVALID: 'Zone Name must contain only letters, numbers, spaces, hyphens, and slashes',
  ZONE_NAME_MAX_LENGTH: `Zone Name must not exceed ${OLD_TAXATION_VALIDATION_RULES.ZONE_NAME_MAX_LENGTH} characters`,
  WARD_NO_REQUIRED: 'Ward No is required',
  WARD_NO_INVALID: 'Ward No must contain only letters, numbers, spaces, hyphens, and slashes',
  WARD_NO_MAX_LENGTH: `Ward No must not exceed ${OLD_TAXATION_VALIDATION_RULES.WARD_NO_MAX_LENGTH} characters`,
  PROPERTY_NO_REQUIRED: 'Property No is required',
  PROPERTY_NO_INVALID: 'Property No must contain only letters, numbers, spaces, hyphens, and slashes',
  PROPERTY_NO_MAX_LENGTH: `Property No must not exceed ${OLD_TAXATION_VALIDATION_RULES.PROPERTY_NO_MAX_LENGTH} characters`,
  PARTITION_NO_INVALID: 'Partition No must contain only letters, numbers, spaces, hyphens, and slashes',
  PARTITION_NO_MAX_LENGTH: `Partition No must not exceed ${OLD_TAXATION_VALIDATION_RULES.PARTITION_NO_MAX_LENGTH} characters`,
  EGOV_NO_INVALID: 'E-Governance No must contain only letters, numbers, hyphens, and slashes (no spaces)',
  EGOV_NO_MAX_LENGTH: `E-Governance No must not exceed ${OLD_TAXATION_VALIDATION_RULES.EGOV_NO_MAX_LENGTH} characters`,
  PLOT_NO_INVALID: 'Plot No must contain only letters, numbers, spaces, hyphens, and slashes',
  PLOT_NO_MAX_LENGTH: `Plot No must not exceed ${OLD_TAXATION_VALIDATION_RULES.PLOT_NO_MAX_LENGTH} characters`,
  AREA_INVALID: 'Area must be a positive number with up to 4 decimal places',
  AREA_MAX_DIGITS: `Area must not exceed ${OLD_TAXATION_VALIDATION_RULES.AREA_MAX_DIGITS} total digits`,
  TAX_INVALID: 'Tax value must be a positive number with up to 2 decimal places',
  TAX_MAX_DIGITS: `Tax value must not exceed ${OLD_TAXATION_VALIDATION_RULES.TAX_MAX_DIGITS} total digits`,
  NEGATIVE_VALUE_NOT_ALLOWED: 'Negative values are not allowed',
} as const;
