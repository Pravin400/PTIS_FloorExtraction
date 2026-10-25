/**
 * Shared constants for Zone and Ward forms
 * Uses common validation rules from validation-rules.ts
 */
import { CODE_REGEX, CODE_SANITIZE, DESCRIPTION_SANITIZE } from "@/lib/utils/validation-rules";

// Re-export common patterns for backward compatibility
export { CODE_REGEX as ZONE_WARD_NO_REGEX, CODE_SANITIZE as ZONE_WARD_NO_SANITIZE };

// Field length constraints
export const ZONE_WARD_NO_MAX_LENGTH = 10;
export const ZONE_NAME_MAX_LENGTH = 100;
export const ZONE_WARD_NAME_MAX_LENGTH = 50;

// Description/Name sanitization
export { DESCRIPTION_SANITIZE as ZONE_WARD_NAME_SANITIZE };

// English Description: Only English characters (A-Za-z), numbers, single spaces, and basic punctuation (&, -, /, etc.)
export const DESCRIPTION_ENGLISH_REGEX = /^(?!.*?\s{2})[A-Za-z0-9][A-Za-z0-9\s\/,.\-()&]*$/;
export const DESCRIPTION_ENGLISH_SANITIZE = /[^A-Za-z0-9\s\/,.\-()&]/g;
