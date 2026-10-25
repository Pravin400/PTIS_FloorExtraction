import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  fetchMunicipalAssetDashboardStats,
  fetchAssetsByFilter,
  fetchSubUnitsByAsset,
  fetchAssetsByTypeDetails,
  fetchAssetCategoryTypeDetails,
} from '@/app/[locale]/assets/municipal-Asset/actions';
import { apiClient } from '@/services/api.service';
import * as dashboardService from '@/lib/api/asset/municipal-Asset/asset-dashboard.service';

vi.mock('@/services/api.service', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

vi.mock('@/lib/api/asset/municipal-Asset/asset-dashboard.service', () => ({
  getMunicipalDashboardStats: vi.fn(),
  getAssetsByTypeDetails: vi.fn(),
  getAssetCategoryTypeDetails: vi.fn(),
}));

describe('municipal-Asset actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('fetchMunicipalAssetDashboardStats', () => {
    it('should return stats on success', async () => {
      const mockStats = { totalAssets: 10, totalCategories: 2, categoryStats: [] };
      vi.mocked(dashboardService.getMunicipalDashboardStats).mockResolvedValue(mockStats);

      const result = await fetchMunicipalAssetDashboardStats();

      expect(dashboardService.getMunicipalDashboardStats).toHaveBeenCalled();
      expect(result).toEqual(mockStats);
    });

    it('should return null on failure', async () => {
      vi.mocked(dashboardService.getMunicipalDashboardStats).mockResolvedValue(null);
      const result = await fetchMunicipalAssetDashboardStats();
      expect(result).toBeNull();
    });

    it('should return null and log error on exception', async () => {
      const err = new Error('Network error');
      vi.mocked(dashboardService.getMunicipalDashboardStats).mockRejectedValue(err);
      const result = await fetchMunicipalAssetDashboardStats();
      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalledWith('fetchMunicipalAssetDashboardStats failed:', err);
    });
  });

  describe('fetchAssetsByFilter', () => {
    it('should fetch assets and map them to paged response format', async () => {
      const mockItems = [{ id: 1, assetName: 'Asset 1' }];
      vi.mocked(apiClient.get).mockResolvedValue({ success: true, data: { items: mockItems, totalCount: 1 } });

      const result = await fetchAssetsByFilter({ zoneId: 1, search: 'test', pageSize: 10, pageNumber: 2 });

      expect(apiClient.get).toHaveBeenCalledWith('/AssetMaster?zoneId=1&search=test&pageSize=10&pageNumber=2');
      expect(result).toEqual({ success: true, data: mockItems, totalCount: 1 });
    });

    it('should gracefully return error state on API failure', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ success: false });

      const result = await fetchAssetsByFilter({});

      expect(result).toEqual({ success: false, data: [], totalCount: 0, error: 'Failed to fetch assets' });
    });

    it('should gracefully return error state and log error on exception', async () => {
      const err = new Error('Network error');
      vi.mocked(apiClient.get).mockRejectedValue(err);

      const result = await fetchAssetsByFilter({});

      expect(result).toEqual({ success: false, data: [], totalCount: 0, error: 'Failed to fetch assets' });
      expect(console.error).toHaveBeenCalledWith('fetchAssetsByFilter failed:', err);
    });
  });

  describe('fetchSubUnitsByAsset', () => {
    it('should fetch subunits successfully', async () => {
      const mockItems = [{ id: 1 }];
      vi.mocked(apiClient.get).mockResolvedValue({ success: true, data: { success: true, items: mockItems, message: 'OK' } });

      const result = await fetchSubUnitsByAsset(42);

      expect(apiClient.get).toHaveBeenCalledWith('/ManageSubUnits/by-asset/42');
      expect(result).toEqual({ success: true, items: mockItems, message: 'OK' });
    });

    it('should handle API failure', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ success: false, error: 'API Error' });

      const result = await fetchSubUnitsByAsset(42);

      expect(result).toEqual({ success: false, items: [], error: 'API Error' });
    });

    it('should handle exception and log error', async () => {
      const err = new Error('Network error');
      vi.mocked(apiClient.get).mockRejectedValue(err);

      const result = await fetchSubUnitsByAsset(42);

      expect(result).toEqual({ success: false, items: [], error: 'Failed to fetch sub-units' });
      expect(console.error).toHaveBeenCalledWith('fetchSubUnitsByAsset failed:', err);
    });
  });

  describe('fetchAssetsByTypeDetails', () => {
    it('should call getAssetsByTypeDetails service and return wrapped data', async () => {
      const mockData = { totalCount: 5, items: [] };
      vi.mocked(dashboardService.getAssetsByTypeDetails).mockResolvedValue(mockData as unknown as Awaited<ReturnType<typeof dashboardService.getAssetsByTypeDetails>>);

      const result = await fetchAssetsByTypeDetails(10, 1, 10);

      expect(dashboardService.getAssetsByTypeDetails).toHaveBeenCalledWith(10, 1, 10);
      expect(result).toEqual({ success: true, data: mockData });
    });

    it('should return error response and log error on exception', async () => {
      const err = new Error('Service Failed');
      vi.mocked(dashboardService.getAssetsByTypeDetails).mockRejectedValue(err);

      const result = await fetchAssetsByTypeDetails(10, 1, 10);

      expect(result).toEqual({ success: false, error: 'Service Failed', data: null });
      expect(console.error).toHaveBeenCalledWith('fetchAssetsByTypeDetails failed:', err);
    });
  });

  describe('fetchAssetCategoryTypeDetails', () => {
    it('should call getAssetCategoryTypeDetails service and return wrapped data', async () => {
      const mockData = {
        assetCategoryId: 1,
        types: [
          {
            assetTypeId: 10,
            assetTypeName: 'Municipal School',
            assetCount: 5,
            totalCapitalValue: 1000000,
          },
        ],
      };
      vi.mocked(dashboardService.getAssetCategoryTypeDetails).mockResolvedValue(mockData);

      const result = await fetchAssetCategoryTypeDetails(1);

      expect(dashboardService.getAssetCategoryTypeDetails).toHaveBeenCalledWith(1);
      expect(result).toEqual({ success: true, data: mockData });
    });

    it('should return error response and log error on exception', async () => {
      const err = new Error('Category Details Failed');
      vi.mocked(dashboardService.getAssetCategoryTypeDetails).mockRejectedValue(err);

      const result = await fetchAssetCategoryTypeDetails(1);

      expect(result).toEqual({ success: false, error: 'Category Details Failed', data: null });
      expect(console.error).toHaveBeenCalledWith('fetchAssetCategoryTypeDetails failed:', err);
    });
  });
});

