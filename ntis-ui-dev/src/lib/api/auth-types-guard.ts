import type { AuthLoginApiBody, UlbConfigApiBody } from '@/types/login.types';

/**
 * Type guards and normalization utilities for authentication API responses.
 * 
 * Following the pattern from construction-types-guard.ts for consistent
 * type safety across the application.
 * 
 * @module auth-types-guard
 */

// ---------------------------------------------------------------------------
// Type Guards
// ---------------------------------------------------------------------------

/**
 * Type guard for AuthLoginApiBody - validates structure before normalization
 * @param value - Unknown value to validate
 * @returns True if value has the expected shape of an auth login response
 */
export function isAuthLoginResponseShape(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const obj = value as Record<string, unknown>;
  // Must have a success field (the primary indicator of auth response)
  return 'success' in obj && typeof obj.success === 'boolean';
}

/**
 * Type guard for UlbConfigApiBody - validates ULB configuration response
 * @param value - Unknown value to validate
 * @returns True if value has the expected shape of a ULB config response
 */
export function isUlbConfigResponseShape(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const obj = value as Record<string, unknown>;
  
  // Check for ulbId in either camelCase or PascalCase
  const ulbIdRaw = obj.ulbId ?? obj.UlbId;
  if (ulbIdRaw === undefined) return false;
  
  const ulbId = typeof ulbIdRaw === 'number' ? ulbIdRaw : Number(ulbIdRaw);
  return Number.isFinite(ulbId) && ulbId > 0;
}

// ---------------------------------------------------------------------------
// Normalization Functions
// ---------------------------------------------------------------------------

/**
 * Safely converts a value to a trimmed string or undefined
 */
function toOptionalString(value: unknown): string | undefined {
  if (value == null) return undefined;
  const str = String(value).trim();
  return str.length > 0 ? str : undefined;
}

/**
 * Safely converts a value to a trimmed string or null
 */
function toNullableString(value: unknown): string | null {
  if (value == null) return null;
  const str = String(value).trim();
  return str.length > 0 ? str : null;
}

/**
 * Safely converts a value to a positive number or undefined
 */
function toPositiveNumber(value: unknown): number | undefined {
  if (value == null) return undefined;
  const num = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(num) && num > 0 ? num : undefined;
}

/**
 * Safely converts a value to a non-negative number or undefined
 */
function toNonNegativeNumber(value: unknown): number | undefined {
  if (value == null) return undefined;
  const num = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(num) && num >= 0 ? num : undefined;
}

/**
 * Normalizes and validates an auth login response.
 * Ensures all fields have the correct types and safe defaults.
 * 
 * @param data - Raw data from API response
 * @returns Normalized AuthLoginApiBody with validated types
 */
export function normalizeAuthLoginResponse(data: Record<string, unknown>): AuthLoginApiBody {
  const success = Boolean(data.success);
  
  // Token fields - critical for session
  const token = toOptionalString(data.token);
  const refreshToken = toOptionalString(data.refreshToken);
  
  // User identification
  const userId = toPositiveNumber(data.userId);
  const username = toOptionalString(data.username);
  
  // User profile fields - nullable strings
  const firstName = toNullableString(data.firstName);
  const middleName = toNullableString(data.middleName);
  const lastName = toNullableString(data.lastName);
  
  // Status fields
  const message = toOptionalString(data.message);
  const expiresAt = toOptionalString(data.expiresAt);
  const requiresPasswordChange = Boolean(data.requiresPasswordChange);

  // Two-factor challenge fields (present only when requiresTwoFactor is true)
  const requiresTwoFactor = Boolean(data.requiresTwoFactor);
  const rawMethod = toOptionalString(data.twoFactorMethod)?.toLowerCase();
  const twoFactorMethod: 'totp' | 'otp' | undefined =
    rawMethod === 'otp' ? 'otp' : rawMethod === 'totp' ? 'totp' : undefined;
  const challengeId = toOptionalString(data.challengeId);
  const challengeExpiresAt = toOptionalString(data.challengeExpiresAt);
  const requiresTwoFactorSetup = Boolean(data.requiresTwoFactorSetup);
  const remainingLoginAttempts = toNonNegativeNumber(data.remainingLoginAttempts);

  return {
    success,
    token,
    refreshToken,
    userId,
    username,
    firstName,
    middleName,
    lastName,
    message,
    expiresAt,
    requiresPasswordChange,
    requiresTwoFactor,
    twoFactorMethod,
    challengeId,
    challengeExpiresAt,
    requiresTwoFactorSetup,
    remainingLoginAttempts,
  };
}

/**
 * True when the response is a valid, still-actionable 2FA challenge: `requiresTwoFactor` is set
 * and a non-empty `challengeId` was returned alongside it.
 */
export function hasPendingTwoFactorChallenge(auth: AuthLoginApiBody): boolean {
  return Boolean(auth.requiresTwoFactor && auth.challengeId && auth.challengeId.length > 0);
}

/**
 * Normalizes and validates a ULB config response.
 * Handles both camelCase and PascalCase field names from the API.
 * 
 * @param data - Raw data from API response
 * @returns Normalized UlbConfigApiBody or null if invalid
 */
export function normalizeUlbConfigResponse(data: Record<string, unknown>): UlbConfigApiBody | null {
  // Helper to read field in camelCase or PascalCase
  const readField = (camel: string, pascal: string): unknown => {
    if (Object.prototype.hasOwnProperty.call(data, camel) && data[camel] != null) {
      return data[camel];
    }
    if (Object.prototype.hasOwnProperty.call(data, pascal) && data[pascal] != null) {
      return data[pascal];
    }
    return undefined;
  };

  // Validate required ulbId
  const ulbIdRaw = readField('ulbId', 'UlbId');
  const ulbId = typeof ulbIdRaw === 'number' ? ulbIdRaw : Number(ulbIdRaw);
  if (!Number.isFinite(ulbId) || ulbId < 1) {
    return null;
  }

  // Required string fields
  const ulbCode = String(readField('ulbCode', 'UlbCode') ?? '').trim();
  const ulbName = String(readField('ulbName', 'UlbName') ?? '').trim();
  
  if (!ulbCode || !ulbName) {
    return null;
  }

  return {
    ulbId,
    ulbCode,
    ulbName,
    ulbNameLocal: toNullableString(readField('ulbNameLocal', 'UlbNameLocal')),
    ulbLogo: toNullableString(readField('ulbLogo', 'UlbLogo')),
    emailId: toNullableString(readField('emailId', 'EmailId')),
    mobileNo: toNullableString(readField('mobileNo', 'MobileNo')),
    websiteUrl: toNullableString(readField('websiteUrl', 'WebsiteUrl')),
    ulbAddress: toNullableString(readField('ulbAddress', 'UlbAddress')),
    state: toNullableString(readField('state', 'State')),
    district: toNullableString(readField('district', 'District')),
  };
}

/**
 * Validates that the auth response contains valid session tokens.
 * @param auth - Normalized auth login response
 * @returns True if the response contains valid tokens for establishing a session
 */
export function hasValidSessionTokens(auth: AuthLoginApiBody): boolean {
  return Boolean(
    auth.success &&
    auth.token &&
    auth.token.length > 0 &&
    auth.refreshToken &&
    auth.refreshToken.length > 0
  );
}

/**
 * Extracts display name from auth response with fallback to username.
 * @param auth - Normalized auth login response
 * @param fallbackUsername - Username to use if no name fields are available
 * @returns User's display name
 */
export function extractUserDisplayName(auth: AuthLoginApiBody, fallbackUsername: string): string {
  const parts = [auth.firstName, auth.middleName, auth.lastName]
    .filter((p): p is string => typeof p === 'string' && p.length > 0);
  
  if (parts.length > 0) {
    return parts.join(' ');
  }
  
  if (auth.username && auth.username.length > 0) {
    return auth.username;
  }
  
  return fallbackUsername.trim() || 'User';
}
