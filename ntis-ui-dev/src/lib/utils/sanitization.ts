/**
 * Form Sanitization Utilities
 * 
 * Provides common sanitization functions for form inputs
 * to ensure clean, valid data entry.
 */

import { CODE_SANITIZE, TEXT_SANITIZE, DESCRIPTION_SANITIZE } from './validation-rules';

/**
 * Sanitize code input (alphanumeric only)
 * Removes non-alphanumeric characters and enforces max length
 * 
 * @param value - The input value to sanitize
 * @param maxLength - Maximum allowed length (default: 10)
 * @returns Sanitized code string
 */
export const sanitizeCode = (value: string, maxLength: number = 10): string => {
  return value.replace(CODE_SANITIZE, '').slice(0, maxLength);
};

/**
 * Sanitize text input (alphanumeric + spaces and common punctuation)
 * Removes disallowed characters and enforces max length
 * 
 * @param value - The input value to sanitize
 * @param maxLength - Maximum allowed length (default: 100)
 * @returns Sanitized text string
 */
export const sanitizeText = (value: string, maxLength: number = 100): string => {
  return value.replace(TEXT_SANITIZE, '').slice(0, maxLength);
};

/**
 * Sanitize description input (multilingual with punctuation)
 * Removes disallowed characters and enforces max length
 * 
 * @param value - The input value to sanitize
 * @param maxLength - Maximum allowed length (default: 100)
 * @returns Sanitized description string
 */
export const sanitizeDescription = (value: string, maxLength: number = 100): string => {
  return value.replace(DESCRIPTION_SANITIZE, '').slice(0, maxLength);
};

/**
 * Normalize string for comparison (lowercase and trim)
 * 
 * @param value - The string to normalize
 * @returns Normalized string
 */
export const normalize = (value: string): string => {
  return value.trim().toLowerCase();
};
