import { describe, it, expect, vi, beforeEach } from 'vitest';
import { subAssetDetailNewService } from '@/lib/api/asset/municipal-Asset/sub-asset-detail.service';
import { apiClient } from '@/services/api.service';
import { mapSubAssetToUI } from '@/lib/api/asset/municipal-Asset/sub-asset-detail.mapper';

vi.mock('@/services/api.service', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

vi.mock('@/lib/api/asset/municipal-Asset/sub-asset-detail.mapper', () => ({
  mapSubAssetToUI: vi.fn(),
}));

vi.mock('@/lib/api/asset/municipal-Asset/asset-detail-new.mapper', () => ({
  mapDocumentsToUI: vi.fn(() => []),
  mapPhotosToUI: vi.fn(() => []),
}));

describe('subAssetDetailNewService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchSubAssetDetails', () => {
    it('returns an error if an invalid subAssetId is provided', async () => {
      const result = await subAssetDetailNewService.fetchSubAssetDetails(NaN);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid Sub-Asset ID provided to service.');
    });

    it('returns an error if the API request fails', async () => {
      vi.mocked(apiClient.get)
        .mockResolvedValueOnce({ success: false, error: 'API Error' })
        .mockResolvedValueOnce({ success: true, data: [] })
        .mockResolvedValueOnce({ success: true, data: [] });
      
      const result = await subAssetDetailNewService.fetchSubAssetDetails(123);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('API Error');
    });

    it('returns an error if data fails type guard validation', async () => {
      const mockRawData = { someOtherField: 123 }; // Missing assetId/id
      vi.mocked(apiClient.get)
        .mockResolvedValueOnce({ success: true, data: mockRawData })
        .mockResolvedValueOnce({ success: true, data: [] })
        .mockResolvedValueOnce({ success: true, data: [] });

      const result = await subAssetDetailNewService.fetchSubAssetDetails(123);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid sub-asset data format received from server.');
    });

    it('returns mapped data on success', async () => {
      const mockRawData = { assetId: 123, subAssetShopNo: 'Shop A' };
      vi.mocked(apiClient.get)
        .mockResolvedValueOnce({ success: true, data: mockRawData })
        .mockResolvedValueOnce({ success: true, data: [] })
        .mockResolvedValueOnce({ success: true, data: [] });
      
      vi.mocked(mapSubAssetToUI).mockReturnValue({
        subAssetId: '123',
        shopName: 'Shop A',
      } as unknown as import('@/types/asset/municipal-Asset/sub-asset-detail-ui.types').SubAssetDetailData);

      const result = await subAssetDetailNewService.fetchSubAssetDetails(123);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data?.subAssetId).toBe('123');
      }
    });
  });

  describe('fetchCollectionHistory', () => {
    it('returns an error if an invalid subAssetId is provided', async () => {
      const result = await subAssetDetailNewService.fetchCollectionHistory(NaN);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid Sub-Asset ID provided to service.');
    });

    it('returns formatted history items and totals on success', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        success: true,
        data: {
          items: [{ receiptNo: '123' }],
          totals: { collection: 1000 },
        },
      });

      const result = await subAssetDetailNewService.fetchCollectionHistory(123);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data?.items).toHaveLength(1);
        expect(result.data?.totals?.collection).toBe(1000);
      }
    });
  });
});
