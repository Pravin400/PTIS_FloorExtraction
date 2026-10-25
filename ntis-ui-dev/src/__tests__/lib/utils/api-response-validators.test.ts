import { describe, it, expect } from 'vitest';
import {
  validateTransportSuccess,
  validateBackendSuccess,
  validateNestedDataSuccess,
  extractItems,
  validateItemsExist,
  validateAndExtractApiResponse,
  ApiResponseValidationError,
} from '@/lib/utils/api-response-validators';
import type { ApiResponse } from '@/types/common.types';

describe('API Response Validators', () => {
  describe('validateTransportSuccess', () => {
    it('should pass for successful response', () => {
      const response: ApiResponse<{ success: true }> = {
        success: true,
        data: { success: true },
      };

      expect(() => validateTransportSuccess(response, 'test-endpoint')).not.toThrow();
    });

    it('should throw for failed transport', () => {
      const response: ApiResponse<unknown> = {
        success: false,
        error: 'Network error',
      };

      expect(() => validateTransportSuccess(response, 'test-endpoint')).toThrow(
        ApiResponseValidationError
      );
      expect(() => validateTransportSuccess(response, 'test-endpoint')).toThrow(
        'Network error'
      );
    });

    it('should throw when data is missing', () => {
      const response: ApiResponse<unknown> = {
        success: true,
      };

      expect(() => validateTransportSuccess(response, 'test-endpoint')).toThrow(
        'Failed to fetch data from test-endpoint API'
      );
    });
  });

  describe('validateBackendSuccess', () => {
    it('should pass for successful backend response', () => {
      const response = { success: true };

      expect(() => validateBackendSuccess(response, 'test-endpoint')).not.toThrow();
    });

    it('should throw when success is false with error message', () => {
      const response = {
        success: false,
        message: 'Backend validation failed',
      };

      expect(() => validateBackendSuccess(response, 'test-endpoint')).toThrow(
        'Backend validation failed'
      );
    });

    it('should throw when success is false with errors array', () => {
      const response = {
        success: false,
        errors: ['Validation error 1', 'Validation error 2'],
      };

      expect(() => validateBackendSuccess(response, 'test-endpoint')).toThrow(
        'Validation error 1'
      );
    });

    it('should use default message when no error details', () => {
      const response = { success: false };

      expect(() => validateBackendSuccess(response, 'test-endpoint')).toThrow(
        'Backend error from test-endpoint API'
      );
    });
  });

  describe('validateNestedDataSuccess', () => {
    it('should pass for successful nested data', () => {
      const response = {
        success: true,
        data: { success: true },
      };

      expect(() => validateNestedDataSuccess(response, 'test-endpoint')).not.toThrow();
    });

    it('should throw when nested success is false', () => {
      const response = {
        success: true,
        data: {
          success: false,
          message: 'Nested validation failed',
        },
      };

      expect(() => validateNestedDataSuccess(response, 'test-endpoint')).toThrow(
        'Nested validation failed'
      );
    });
  });

  describe('extractItems', () => {
    it('should extract items from flat structure', () => {
      const response = {
        items: { propertyId: 123, data: 'test' },
      };

      const result = extractItems(response);
      expect(result).toEqual({ propertyId: 123, data: 'test' });
    });

    it('should extract items from nested structure', () => {
      const response = {
        data: {
          items: { propertyId: 456, data: 'nested test' },
        },
      };

      const result = extractItems(response);
      expect(result).toEqual({ propertyId: 456, data: 'nested test' });
    });

    it('should return null when items not found', () => {
      const response = { success: true };

      const result = extractItems(response);
      expect(result).toBeNull();
    });
  });

  describe('validateItemsExist', () => {
    it('should pass when items exist', () => {
      const items = { propertyId: 123 };

      expect(() => validateItemsExist(items, 'test-endpoint')).not.toThrow();
    });

    it('should throw when items are null', () => {
      expect(() => validateItemsExist(null, 'test-endpoint')).toThrow(
        'Invalid response structure from test-endpoint API'
      );
    });
  });

  describe('validateAndExtractApiResponse (Integration)', () => {
    it('should successfully validate and extract items', () => {
      const apiResponse: ApiResponse<{
        success: boolean;
        items: { propertyId: number; policies: [] };
      }> = {
        success: true,
        data: {
          success: true,
          items: { propertyId: 123, policies: [] },
        },
      };

      const result = validateAndExtractApiResponse(apiResponse, 'tax-details');
      expect(result).toEqual({ propertyId: 123, policies: [] });
    });

    it('should handle nested structure', () => {
      const apiResponse: ApiResponse<{
        success: boolean;
        data: { success: boolean; items: { propertyId: number } };
      }> = {
        success: true,
        data: {
          success: true,
          data: {
            success: true,
            items: { propertyId: 456 },
          },
        },
      };

      const result = validateAndExtractApiResponse(apiResponse, 'tax-details-cv');
      expect(result).toEqual({ propertyId: 456 });
    });

    it('should throw on transport failure', () => {
      const apiResponse: ApiResponse<unknown> = {
        success: false,
        error: 'Connection timeout',
      };

      expect(() => validateAndExtractApiResponse(apiResponse as unknown as Parameters<typeof validateAndExtractApiResponse>[0], 'tax-details')).toThrow(
        'Connection timeout'
      );
    });

    it('should throw on backend failure', () => {
      const apiResponse: ApiResponse<{ success: boolean; message: string }> = {
        success: true,
        data: {
          success: false,
          message: 'Property not found',
        },
      };

      expect(() => validateAndExtractApiResponse(apiResponse, 'tax-details')).toThrow(
        'Property not found'
      );
    });

    it('should throw on missing items', () => {
      const apiResponse: ApiResponse<{ success: boolean }> = {
        success: true,
        data: {
          success: true,
        },
      };

      expect(() => validateAndExtractApiResponse(apiResponse, 'tax-details')).toThrow(
        'Invalid response structure from tax-details API'
      );
    });
  });
});
