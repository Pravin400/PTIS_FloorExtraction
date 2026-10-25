import { translateDevanagariDigits } from '@/lib/utils/input-sanitization';

/**
 * Input validation and sanitization utilities for Old Taxation form
 * Ensures data quality and consistency
 */

/**
 * Sanitizes alphanumeric input with allowed special characters
 * Allows: letters, numbers, spaces, hyphens, forward slashes, and Devanagari (Marathi/Hindi) characters
 */
export const sanitizeAlphanumeric = (value: string): string => {
  return value.replace(/[^A-Za-z0-9\s\-\/ऀ-ॿ]/g, '');
};

/**
 * Sanitizes alphanumeric input without spaces
 * Allows: letters, numbers, hyphens, forward slashes only
 */
export const sanitizeAlphanumericNoSpaces = (value: string): string => {
  return value.replace(/[^A-Za-z0-9\-\/ऀ-ॿ]/g, '');
};

/**
 * Validates and sanitizes decimal input with custom max length
 * Allows up to the specified number of digits (excluding the decimal point) and up to 4 decimal places
 */
export const sanitizeDecimalWithMaxLength = (value: string, maxLength: number): string => {
  if (value === '') return '';
  
  // Remove any non-numeric characters except decimal point
  const cleaned = value.replace(/[^0-9०-९.]/g, '');
  
  // Ensure only one decimal point
  const parts = cleaned.split('.');
  if (parts.length > 2) return '';
  
  // Check if pattern is valid (digits with optional decimal and up to 4 decimal places)
  if (!/^[0-9०-९]*(\.[0-9०-९]{0,4})?$/.test(cleaned)) return '';
  
  // Check total length (excluding decimal point)
  const totalDigits = cleaned.replace('.', '').length;
  if (totalDigits > maxLength) return '';
  
  return cleaned;
};

/**
 * Validates and sanitizes decimal input for area fields (max 12 digits)
 */
export const sanitizeAreaDecimal = (value: string): string => {
  return sanitizeDecimalWithMaxLength(value, 12);
};

/**
 * Validates and sanitizes decimal input for tax fields (max 15 digits)
 */
export const sanitizeTaxDecimal = (value: string): string => {
  return sanitizeDecimalWithMaxLength(value, 15);
};

/**
 * Validates and sanitizes decimal input
 * Allows up to 15 total digits and 4 decimal places
 */
export const sanitizeDecimal = (value: string): string => {
  if (value === '' || /^[0-9०-९]{0,15}(\.[0-9०-९]{0,4})?$/.test(value)) {
    return value;
  }
  return '';
};

/**
 * Checks if a string field value is valid (non-empty after trimming)
 */
export const isValidStringField = (value: string): boolean => {
  return value.trim().length > 0;
};

/**
 * Checks if a decimal field value is valid (non-empty and greater than 0)
 * Supports Devanagari digits by translating them to standard English digits first.
 */
export const isValidDecimalField = (value: string | number): boolean => {
  const cleanValue = typeof value === 'string' ? translateDevanagariDigits(value) : value;
  const numValue = typeof cleanValue === 'string' ? parseFloat(cleanValue) : cleanValue;
  return !isNaN(numValue) && numValue > 0;
};

/**
 * Prevents invalid numeric key input
 */
export const preventInvalidNumericKeys = (e: React.KeyboardEvent): void => {
  if (['-', 'e', 'E', '+'].includes(e.key)) {
    e.preventDefault();
  }
};
