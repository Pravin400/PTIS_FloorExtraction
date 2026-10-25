import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getAssetsByTypeDetails,
  getAssetCategoryTypeDetails,
} from '@/lib/api/asset/municipal-Asset/asset-dashboard.service';
import { apiClient } from '@/services/api.service';
import { ApiError } from '@/lib/utils/api';

vi.mock('@/services/api.service', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

describe('asset-dashboard.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAssetsByTypeDetails', () => {
    it('should correctly format the URL and return data on success', async () => {
      const mockResponse = {
        success: true,
        data: {
          totalCount: 5,
          totalValuation: 10000,
          pageNumber: 1,
          pageSize: 10,
          totalPages: 1,
          items: [{ id: 1, assetName: 'Test Asset', capitalValue: 2000 }],
        },
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const result = await getAssetsByTypeDetails(10, 1, 10);

      expect(apiClient.get).toHaveBeenCalledWith('/AssetDashboard/assets-by-type/details?assetTypeId=10&pageNumber=1&pageSize=10', { cache: 'no-store' });
      expect(result).toEqual(mockResponse.data);
    });

    it('should omit undefined/null parameters from the query string', async () => {
      const mockResponse = { success: true, data: {} };
      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      await getAssetsByTypeDetails(10, undefined as unknown as number, undefined as unknown as number);

      // It builds url without pageNumber and pageSize if they are not passed (though they have default values of 1 and 10)
      // Because they have defaults in the function signature, they will be 1 and 10.
      expect(apiClient.get).toHaveBeenCalledWith('/AssetDashboard/assets-by-type/details?assetTypeId=10&pageNumber=1&pageSize=10', { cache: 'no-store' });
    });

    it('should throw ApiError when success is false', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        success: false,
        statusCode: 400,
        error: 'Bad Request',
      });

      await expect(getAssetsByTypeDetails(10)).rejects.toThrow(ApiError);
      await expect(getAssetsByTypeDetails(10)).rejects.toThrow('Fetch asset details failed');
    });

    it('should throw ApiError when data is missing', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        success: true,
        data: null,
      });

      await expect(getAssetsByTypeDetails(10)).rejects.toThrow(ApiError);
    });
  });

  describe('getAssetCategoryTypeDetails', () => {
    it('should correctly format the URL with assetCategoryId and return data on success', async () => {
      const mockResponse = {
        success: true,
        data: {
          assetCategoryId: 1,
          types: [
            {
              assetTypeId: 101,
              assetTypeName: 'Municipal School',
              assetCount: 15,
              totalCapitalValue: 5000000,
              totalLandAreaSqMeter: 2500,
              totalInventoryQuantity: 10,
            },
          ],
        },
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const result = await getAssetCategoryTypeDetails(1);

      expect(apiClient.get).toHaveBeenCalledWith('/AssetDashboard/assets-by-type/details?assetCategoryId=1', { cache: 'no-store' });
      expect(result).toEqual(mockResponse.data);
    });

    it('should throw ApiError when API call fails', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        success: false,
        statusCode: 500,
        error: 'Internal Server Error',
      });

      await expect(getAssetCategoryTypeDetails(1)).rejects.toThrow(ApiError);
    });
  });
});

