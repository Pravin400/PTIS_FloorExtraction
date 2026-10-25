/**
 * Server-side validation utilities for authentication.
 * 
 * Following the pattern from construction-validation.ts for consistent
 * validation across the application.
 * 
 * @module auth-validation
 */

import { AUTH_CONSTRAINTS } from '@/components/modules/login/constants';

// ---------------------------------------------------------------------------
// Validation Error Class
// ---------------------------------------------------------------------------

export class AuthValidationError extends Error {
  constructor(
    public code: string,
    message: string
  ) {
    super(message);
    this.name = 'AuthValidationError';
  }
}

// ---------------------------------------------------------------------------
// Input Validators
// ---------------------------------------------------------------------------

/**
 * Validates and sanitizes username for API submission.
 * @param username - Raw username input
 * @returns Sanitized username string
 * @throws AuthValidationError if validation fails
 */
export function validateUsername(username: unknown): string {
  if (typeof username !== 'string') {
    throw new AuthValidationError('USERNAME_INVALID_TYPE', 'Username must be a string');
  }
  
  const trimmed = username.trim();
  
  if (trimmed.length === 0) {
    throw new AuthValidationError('USERNAME_REQUIRED', 'Username is required');
  }
  
  if (trimmed.length < AUTH_CONSTRAINTS.USERNAME_MIN_LENGTH) {
    throw new AuthValidationError(
      'USERNAME_TOO_SHORT',
      `Username must be at least ${AUTH_CONSTRAINTS.USERNAME_MIN_LENGTH} characters`
    );
  }
  
  if (trimmed.length > AUTH_CONSTRAINTS.USERNAME_MAX_LENGTH) {
    throw new AuthValidationError(
      'USERNAME_TOO_LONG',
      `Username cannot exceed ${AUTH_CONSTRAINTS.USERNAME_MAX_LENGTH} characters`
    );
  }
  
  return trimmed;
}

/**
 * Validates password for API submission.
 * Note: Actual password policy validation is done by the backend.
 * This only ensures the password is present and within safe bounds.
 * 
 * @param password - Raw password input
 * @returns Password string (not trimmed - spaces may be intentional)
 * @throws AuthValidationError if validation fails
 */
export function validatePassword(password: unknown): string {
  if (typeof password !== 'string') {
    throw new AuthValidationError('PASSWORD_INVALID_TYPE', 'Password must be a string');
  }
  
  if (password.length === 0) {
    throw new AuthValidationError('PASSWORD_REQUIRED', 'Password is required');
  }
  
  if (password.length > AUTH_CONSTRAINTS.PASSWORD_MAX_LENGTH) {
    throw new AuthValidationError(
      'PASSWORD_TOO_LONG',
      `Password cannot exceed ${AUTH_CONSTRAINTS.PASSWORD_MAX_LENGTH} characters`
    );
  }
  
  // Remove zero-width and control characters that could cause issues
  const sanitized = password.replace(/[\u200B-\u200D\uFEFF\u0000-\u001F]/g, '');
  
  if (sanitized.length === 0) {
    throw new AuthValidationError('PASSWORD_REQUIRED', 'Password is required');
  }
  
  return sanitized;
}

/**
 * Validates both credentials together.
 * @param username - Raw username input
 * @param password - Raw password input
 * @returns Object with validated credentials
 * @throws AuthValidationError if validation fails
 */
export function validateCredentials(
  username: unknown,
  password: unknown
): { username: string; password: string } {
  return {
    username: validateUsername(username),
    password: validatePassword(password),
  };
}

// ---------------------------------------------------------------------------
// Error Code Mapping
// ---------------------------------------------------------------------------

/**
 * Maps HTTP status codes and error messages to user-friendly error codes.
 * These codes are used to look up translated error messages in the UI.
 * 
 * @param statusCode - HTTP status code from API response
 * @param message - Optional error message from API
 * @returns Standardized error code for translation lookup
 */
export function mapAuthErrorToCode(statusCode: number | undefined, message?: string): string {
  // Check message patterns first for more specific errors
  const lowerMessage = (message || '').toLowerCase();
  
  if (lowerMessage.includes('locked') || lowerMessage.includes('blocked')) {
    return 'ACCOUNT_LOCKED';
  }
  if (
    lowerMessage.includes('verification') ||
    lowerMessage.includes('code') ||
    lowerMessage.includes('totp') ||
    lowerMessage.includes('otp')
  ) {
    return 'VERIFICATION_FAILED';
  }
  if (lowerMessage.includes('expired')) {
    return 'SESSION_EXPIRED';
  }
  if (lowerMessage.includes('not found') || lowerMessage.includes('does not exist')) {
    return 'USER_NOT_FOUND';
  }
  if (lowerMessage.includes('invalid') && lowerMessage.includes('credentials')) {
    return 'INVALID_CREDENTIALS';
  }
  if (lowerMessage.includes('too many') || lowerMessage.includes('rate limit')) {
    return 'TOO_MANY_ATTEMPTS';
  }
  if (lowerMessage.includes('password') && lowerMessage.includes('change')) {
    return 'PASSWORD_CHANGE_REQUIRED';
  }
  if (lowerMessage.includes('inactive') || lowerMessage.includes('disabled')) {
    return 'ACCOUNT_INACTIVE';
  }
  
  // Fall back to status code mapping
  const statusCodeMap: Record<number, string> = {
    400: 'INVALID_REQUEST',
    401: 'INVALID_CREDENTIALS',
    403: 'ACCOUNT_LOCKED',
    404: 'USER_NOT_FOUND',
    408: 'REQUEST_TIMEOUT',
    423: 'ACCOUNT_LOCKED',
    429: 'TOO_MANY_ATTEMPTS',
    500: 'SERVICE_UNAVAILABLE',
    502: 'SERVICE_UNAVAILABLE',
    503: 'SERVICE_UNAVAILABLE',
    504: 'REQUEST_TIMEOUT',
  };
  
  return statusCodeMap[statusCode ?? 0] || 'LOGIN_FAILED';
}

/**
 * Maps AuthValidationError codes to user-facing error codes.
 * @param error - AuthValidationError from validation
 * @returns Error code for translation lookup
 */
export function mapValidationErrorToCode(error: AuthValidationError): string {
  const codeMap: Record<string, string> = {
    USERNAME_REQUIRED: 'CREDENTIALS_REQUIRED',
    USERNAME_INVALID_TYPE: 'CREDENTIALS_REQUIRED',
    USERNAME_TOO_SHORT: 'USERNAME_TOO_SHORT',
    USERNAME_TOO_LONG: 'USERNAME_TOO_LONG',
    PASSWORD_REQUIRED: 'CREDENTIALS_REQUIRED',
    PASSWORD_INVALID_TYPE: 'CREDENTIALS_REQUIRED',
    PASSWORD_TOO_LONG: 'PASSWORD_TOO_LONG',
  };
  
  return codeMap[error.code] || 'CREDENTIALS_REQUIRED';
}

// ---------------------------------------------------------------------------
// Session Validation
// ---------------------------------------------------------------------------

/**
 * Validates session ID format.
 * @param sessionId - Session ID to validate
 * @returns True if the session ID appears valid
 */
export function isValidSessionId(sessionId: unknown): sessionId is string {
  if (typeof sessionId !== 'string') return false;
  // UUID format check (basic)
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(sessionId);
}

/**
 * Validates token format (basic check).
 * @param token - Token to validate
 * @returns True if the token appears valid
 */
export function isValidToken(token: unknown): token is string {
  if (typeof token !== 'string') return false;
  // JWT format check (basic - three base64 segments separated by dots)
  return token.length > 20 && /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(token);
}
