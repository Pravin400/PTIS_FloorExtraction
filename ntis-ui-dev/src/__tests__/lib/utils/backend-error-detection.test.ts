import { describe, it, expect } from 'vitest';
import {
  isBackendErrorMessage,
  isDuplicateError,
  getErrorStatusCode,
  translateBackendMessage,
} from '@/lib/utils/backend-error-detection';

describe('backend-error-detection', () => {
  describe('isBackendErrorMessage', () => {
    it('should return true for messages with error keywords', () => {
      expect(isBackendErrorMessage('Operation failed')).toBe(true);
      expect(isBackendErrorMessage('Error occurred')).toBe(true);
      expect(isBackendErrorMessage('Invalid input')).toBe(true);
      expect(isBackendErrorMessage('Record already exists')).toBe(true);
      expect(isBackendErrorMessage('Duplicate entry found')).toBe(true);
    });

    it('should be case-insensitive', () => {
      expect(isBackendErrorMessage('OPERATION FAILED')).toBe(true);
      expect(isBackendErrorMessage('Error')).toBe(true);
      expect(isBackendErrorMessage('INVALID')).toBe(true);
    });

    it('should return false for success messages', () => {
      expect(isBackendErrorMessage('Operation successful')).toBe(false);
      expect(isBackendErrorMessage('Record created')).toBe(false);
      expect(isBackendErrorMessage('Success')).toBe(false);
    });

    it('should return false for null or undefined', () => {
      expect(isBackendErrorMessage(null)).toBe(false);
      expect(isBackendErrorMessage(undefined)).toBe(false);
      expect(isBackendErrorMessage('')).toBe(false);
    });
  });

  describe('isDuplicateError', () => {
    it('should return true for duplicate error messages', () => {
      expect(isDuplicateError('Record already exists')).toBe(true);
      expect(isDuplicateError('Duplicate entry found')).toBe(true);
      expect(isDuplicateError('This item already exists in the database')).toBe(true);
    });

    it('should be case-insensitive', () => {
      expect(isDuplicateError('ALREADY EXISTS')).toBe(true);
      expect(isDuplicateError('Duplicate')).toBe(true);
    });

    it('should return false for non-duplicate errors', () => {
      expect(isDuplicateError('Operation failed')).toBe(false);
      expect(isDuplicateError('Invalid input')).toBe(false);
      expect(isDuplicateError('Error occurred')).toBe(false);
    });

    it('should return false for null or undefined', () => {
      expect(isDuplicateError(null)).toBe(false);
      expect(isDuplicateError(undefined)).toBe(false);
      expect(isDuplicateError('')).toBe(false);
    });
  });

  describe('getErrorStatusCode', () => {
    it('should return 409 for duplicate errors', () => {
      expect(getErrorStatusCode('Record already exists')).toBe(409);
      expect(getErrorStatusCode('Duplicate entry')).toBe(409);
    });

    it('should return 500 for other errors', () => {
      expect(getErrorStatusCode('Operation failed')).toBe(500);
      expect(getErrorStatusCode('Invalid input')).toBe(500);
      expect(getErrorStatusCode('Error occurred')).toBe(500);
    });

    it('should return 500 for null or undefined', () => {
      expect(getErrorStatusCode(null)).toBe(500);
      expect(getErrorStatusCode(undefined)).toBe(500);
      expect(getErrorStatusCode('')).toBe(500);
    });
  });

  describe('translateBackendMessage', () => {
    const mockTCommon = (key: string) => `translated.${key}`;

    it('should translate unexpected response messages', () => {
      expect(translateBackendMessage('An unexpected response was received from the server.', mockTCommon))
        .toBe('translated.errors.generic');
      expect(translateBackendMessage('Unexpected response', mockTCommon))
        .toBe('translated.errors.generic');
    });

    it('should translate network and timeout messages', () => {
      expect(translateBackendMessage('Network error occurred', mockTCommon))
        .toBe('translated.errors.network');
      expect(translateBackendMessage('Failed to fetch data', mockTCommon))
        .toBe('translated.errors.network');
    });

    it('should translate auth errors', () => {
      expect(translateBackendMessage('Unauthorized: Please login', mockTCommon))
        .toBe('translated.errors.unauthorized');
      expect(translateBackendMessage('Forbidden: Access denied', mockTCommon))
        .toBe('translated.errors.noAccess');
    });

    it('should translate other generic server errors', () => {
      expect(translateBackendMessage('Internal server error', mockTCommon))
        .toBe('translated.errors.serverError');
      expect(translateBackendMessage('Save failed', mockTCommon))
        .toBe('translated.errors.saveFailed');
      expect(translateBackendMessage('Operation failed', mockTCommon))
        .toBe('translated.errors.operationFailed');
    });

    it('should translate success messages', () => {
      expect(translateBackendMessage('Saved successfully', mockTCommon))
        .toBe('translated.messages.success');
      expect(translateBackendMessage('Operation successful', mockTCommon))
        .toBe('translated.messages.success');
    });

    it('should return original message if no match found', () => {
      expect(translateBackendMessage('Some custom business error message', mockTCommon))
        .toBe('Some custom business error message');
      expect(translateBackendMessage('', mockTCommon)).toBe('');
      expect(translateBackendMessage(null, mockTCommon)).toBe('');
      expect(translateBackendMessage(undefined, mockTCommon)).toBe('');
    });
  });
});
