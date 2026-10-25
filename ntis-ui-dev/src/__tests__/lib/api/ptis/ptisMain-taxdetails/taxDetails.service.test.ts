import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getPtisMainTaxDetailsByPropertyId,
  getPtisMainTaxDetailsCvByPropertyId,
} from '@/lib/api/ptis/ptisMain-taxdetails/taxDetails.service';
import { apiClient } from '@/services/api.service';
import type {
  PtisMainTaxDetailsApiResponse,
  TaxDetailsData,
} from '@/types/ptisMain-taxdetails.types';
import type { ApiResponse } from '@/types/common.types';

// Mock the api service
vi.mock('@/services/api.service', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

describe('Tax Details Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockTaxDetailsData: TaxDetailsData = {
    propertyId: 12345,
    policies: [
      {
        policyCode: 'POL001',
        taxAmounts: [
          { taxName: 'Property Tax', taxAmount: 5000 },
          { taxName: 'Water Tax', taxAmount: 500 },
        ],
        taxTotal: 5500,
      },
    ],
  };

  describe('getPtisMainTaxDetailsByPropertyId', () => {
    it('should successfully fetch tax details with top-level items', async () => {
      const mockResponse: ApiResponse<PtisMainTaxDetailsApiResponse> = {
        success: true,
        data: {
          success: true,
          message: 'Success',
          items: mockTaxDetailsData,
          errors: null,
          correlationId: 'test-correlation-id',
        },
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const result = await getPtisMainTaxDetailsByPropertyId(12345);

      expect(apiClient.get).toHaveBeenCalledWith(
        '/Property/12345/tax-details',
        { cache: 'no-store' }
      );
      expect(result).toEqual(mockTaxDetailsData);
    });

    it('should successfully fetch tax details with nested items structure', async () => {
      const mockResponse: ApiResponse<PtisMainTaxDetailsApiResponse> = {
        success: true,
        data: {
          success: true,
          message: 'Success',
          errors: null,
          correlationId: 'test-correlation-id',
          data: {
            success: true,
            message: 'Nested success',
            items: mockTaxDetailsData,
            errors: null,
            correlationId: 'nested-correlation-id',
          },
        },
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const result = await getPtisMainTaxDetailsByPropertyId(12345);

      expect(result).toEqual(mockTaxDetailsData);
    });

    it('should throw error when transport-level success is false', async () => {
      const mockResponse: ApiResponse<PtisMainTaxDetailsApiResponse> = {
        success: false,
        error: 'Network error',
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      await expect(getPtisMainTaxDetailsByPropertyId(12345)).rejects.toThrow('Network error');
    });

    it('should throw error when API response has no data', async () => {
      const mockResponse: ApiResponse<PtisMainTaxDetailsApiResponse> = {
        success: false,
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      await expect(getPtisMainTaxDetailsByPropertyId(12345)).rejects.toThrow('Failed to fetch data from tax-details API');
    });

    it('should throw error when backend payload success is false with error array', async () => {
      const mockResponse: ApiResponse<PtisMainTaxDetailsApiResponse> = {
        success: true,
        data: {
          success: false,
          message: 'Backend error',
          errors: ['Property not found', 'Invalid property ID'],
          correlationId: 'error-correlation-id',
        },
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      await expect(getPtisMainTaxDetailsByPropertyId(12345)).rejects.toThrow('Property not found');
    });

    it('should throw error when backend payload success is false with message fallback', async () => {
      const mockResponse: ApiResponse<PtisMainTaxDetailsApiResponse> = {
        success: true,
        data: {
          success: false,
          message: 'Custom error message',
          errors: null,
          correlationId: 'error-correlation-id',
        },
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      await expect(getPtisMainTaxDetailsByPropertyId(12345)).rejects.toThrow('Custom error message');
    });

    it('should throw error when backend payload success is false without errors or message', async () => {
      const mockResponse: ApiResponse<PtisMainTaxDetailsApiResponse> = {
        success: true,
        data: {
          success: false,
          message: '',
          errors: null,
          correlationId: 'error-correlation-id',
        },
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      await expect(getPtisMainTaxDetailsByPropertyId(12345)).rejects.toThrow('Backend error from tax-details API');
    });

    it('should throw error when nested data success is false', async () => {
      const mockResponse: ApiResponse<PtisMainTaxDetailsApiResponse> = {
        success: true,
        data: {
          success: true,
          message: 'Top-level success',
          errors: null,
          correlationId: 'test-correlation-id',
          data: {
            success: false,
            message: 'Nested error',
            errors: ['Nested validation error'],
            items: mockTaxDetailsData,
            correlationId: 'nested-correlation-id',
          },
        },
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      await expect(getPtisMainTaxDetailsByPropertyId(12345)).rejects.toThrow('Nested validation error');
    });

    it('should throw error when nested data success is false with message fallback', async () => {
      const mockResponse: ApiResponse<PtisMainTaxDetailsApiResponse> = {
        success: true,
        data: {
          success: true,
          message: 'Top-level success',
          errors: null,
          correlationId: 'test-correlation-id',
          data: {
            success: false,
            message: 'Nested custom error',
            errors: null,
            items: mockTaxDetailsData,
            correlationId: 'nested-correlation-id',
          },
        },
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      await expect(getPtisMainTaxDetailsByPropertyId(12345)).rejects.toThrow('Nested custom error');
    });

    it('should throw error when items is not present in response', async () => {
      const mockResponse: ApiResponse<PtisMainTaxDetailsApiResponse> = {
        success: true,
        data: {
          success: true,
          message: 'Success',
          errors: null,
          correlationId: 'test-correlation-id',
        },
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      await expect(getPtisMainTaxDetailsByPropertyId(12345)).rejects.toThrow('Invalid response structure from tax-details API');
    });

    it('should prioritize top-level items over nested items', async () => {
      const nestedData: TaxDetailsData = {
        propertyId: 99999,
        policies: [],
      };

      const mockResponse: ApiResponse<PtisMainTaxDetailsApiResponse> = {
        success: true,
        data: {
          success: true,
          message: 'Success',
          items: mockTaxDetailsData,
          errors: null,
          correlationId: 'test-correlation-id',
          data: {
            success: true,
            message: 'Nested success',
            items: nestedData,
            errors: null,
            correlationId: 'nested-correlation-id',
          },
        },
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const result = await getPtisMainTaxDetailsByPropertyId(12345);

      // Should return top-level items, not nested
      expect(result).toEqual(mockTaxDetailsData);
      expect(result.propertyId).toBe(12345);
    });
  });

  describe('getPtisMainTaxDetailsCvByPropertyId', () => {
    it('should successfully fetch capital value tax details', async () => {
      const mockResponse: ApiResponse<PtisMainTaxDetailsApiResponse> = {
        success: true,
        data: {
          success: true,
          message: 'Success',
          items: mockTaxDetailsData,
          errors: null,
          correlationId: 'test-correlation-id',
        },
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const result = await getPtisMainTaxDetailsCvByPropertyId(12345);

      expect(apiClient.get).toHaveBeenCalledWith(
        '/Property/12345/tax-details-cv',
        { cache: 'no-store' }
      );
      expect(result).toEqual(mockTaxDetailsData);
    });

    it('should successfully fetch CV tax details with nested items structure', async () => {
      const mockResponse: ApiResponse<PtisMainTaxDetailsApiResponse> = {
        success: true,
        data: {
          success: true,
          message: 'Success',
          errors: null,
          correlationId: 'test-correlation-id',
          data: {
            success: true,
            message: 'Nested success',
            items: mockTaxDetailsData,
            errors: null,
            correlationId: 'nested-correlation-id',
          },
        },
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const result = await getPtisMainTaxDetailsCvByPropertyId(12345);

      expect(result).toEqual(mockTaxDetailsData);
    });

    it('should throw error when transport-level fails for CV endpoint', async () => {
      const mockResponse: ApiResponse<PtisMainTaxDetailsApiResponse> = {
        success: false,
        error: 'CV endpoint unavailable',
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      await expect(getPtisMainTaxDetailsCvByPropertyId(12345)).rejects.toThrow('CV endpoint unavailable');
    });

    it('should throw error when backend returns error for CV endpoint', async () => {
      const mockResponse: ApiResponse<PtisMainTaxDetailsApiResponse> = {
        success: true,
        data: {
          success: false,
          message: 'CV calculation failed',
          errors: ['Invalid capital value data'],
          correlationId: 'error-correlation-id',
        },
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      await expect(getPtisMainTaxDetailsCvByPropertyId(12345)).rejects.toThrow('Invalid capital value data');
    });

    it('should throw error when nested CV data has validation error', async () => {
      const mockResponse: ApiResponse<PtisMainTaxDetailsApiResponse> = {
        success: true,
        data: {
          success: true,
          message: 'Top-level success',
          errors: null,
          correlationId: 'test-correlation-id',
          data: {
            success: false,
            message: '',
            errors: ['CV nested validation failed'],
            items: mockTaxDetailsData,
            correlationId: 'nested-correlation-id',
          },
        },
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      await expect(getPtisMainTaxDetailsCvByPropertyId(12345)).rejects.toThrow('CV nested validation failed');
    });

    it('should throw error when CV response has invalid structure', async () => {
      const mockResponse: ApiResponse<PtisMainTaxDetailsApiResponse> = {
        success: true,
        data: {
          success: true,
          message: 'Success',
          errors: null,
          correlationId: 'test-correlation-id',
        },
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      await expect(getPtisMainTaxDetailsCvByPropertyId(12345)).rejects.toThrow('Invalid response structure from tax-details-cv API');
    });
  });

  describe('Edge cases and data variations', () => {
    it('should handle empty policies array', async () => {
      const emptyPoliciesData: TaxDetailsData = {
        propertyId: 12345,
        policies: [],
      };

      const mockResponse: ApiResponse<PtisMainTaxDetailsApiResponse> = {
        success: true,
        data: {
          success: true,
          message: 'Success',
          items: emptyPoliciesData,
          errors: null,
          correlationId: 'test-correlation-id',
        },
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const result = await getPtisMainTaxDetailsByPropertyId(12345);

      expect(result.policies).toEqual([]);
    });

    it('should handle multiple policies with varying tax amounts', async () => {
      const multiPolicyData: TaxDetailsData = {
        propertyId: 12345,
        policies: [
          {
            policyCode: 'POL001',
            taxAmounts: [
              { taxName: 'Property Tax', taxAmount: 5000 },
              { taxName: 'Water Tax', taxAmount: 500 },
            ],
            taxTotal: 5500,
          },
          {
            policyCode: 'POL002',
            taxAmounts: [
              { taxName: 'Sewerage Tax', taxAmount: 300 },
            ],
            taxTotal: 300,
          },
        ],
      };

      const mockResponse: ApiResponse<PtisMainTaxDetailsApiResponse> = {
        success: true,
        data: {
          success: true,
          message: 'Success',
          items: multiPolicyData,
          errors: null,
          correlationId: 'test-correlation-id',
        },
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const result = await getPtisMainTaxDetailsByPropertyId(12345);

      expect(result.policies).toHaveLength(2);
      expect(result.policies[0].taxTotal).toBe(5500);
      expect(result.policies[1].taxTotal).toBe(300);
    });

    it('should handle zero tax amounts', async () => {
      const zeroTaxData: TaxDetailsData = {
        propertyId: 12345,
        policies: [
          {
            policyCode: 'POL001',
            taxAmounts: [
              { taxName: 'Property Tax', taxAmount: 0 },
            ],
            taxTotal: 0,
          },
        ],
      };

      const mockResponse: ApiResponse<PtisMainTaxDetailsApiResponse> = {
        success: true,
        data: {
          success: true,
          message: 'Success',
          items: zeroTaxData,
          errors: null,
          correlationId: 'test-correlation-id',
        },
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const result = await getPtisMainTaxDetailsByPropertyId(12345);

      expect(result.policies[0].taxTotal).toBe(0);
      expect(result.policies[0].taxAmounts[0].taxAmount).toBe(0);
    });
  });
});
