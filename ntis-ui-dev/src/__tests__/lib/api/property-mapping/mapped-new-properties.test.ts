import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getMappedNewProperties, getMappedOldProperties } from '@/lib/api/property-mapping/property-mapping.service';
import { apiClient } from '@/services/api.service';

vi.mock('@/services/api.service', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('property-mapping.service - getMappedNewProperties & getMappedOldProperties', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getMappedNewProperties', () => {
    it('should call /PropertyMapMaster/mapped-new-properties with OldPropertyId query parameter', async () => {
      const mockApiResponse = {
        success: true,
        data: {
          items: [
            {
              id: 2078970,
              propertyNo: '116',
              flatOrShopNo: '1',
              ownerName: 'The Holder',
              rateableValue: 0,
              newTaxTotal: 0,
            },
          ],
          totalCount: 1,
          pageNumber: 1,
          pageSize: 10,
          totalPages: 1,
          hasPrevious: false,
          hasNext: false,
        },
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockApiResponse);

      const result = await getMappedNewProperties({
        oldPropertyId: 2565750,
        pageSize: 10,
      });

      expect(apiClient.get).toHaveBeenCalledWith(
        '/PropertyMapMaster/mapped-new-properties?OldPropertyId=2565750&PageSize=10',
        { cache: 'no-store' }
      );
      expect(result).not.toBeNull();
      expect(result?.items.length).toBe(1);
      expect(result?.items[0].id).toBe(2078970);
      expect(result?.items[0].flatOrShopNo).toBe('1');
    });

    it('should include WingDetailsId query parameter when wingDetailsId is passed', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        success: true,
        data: { items: [], totalCount: 0, pageNumber: 1, pageSize: 25, totalPages: 0, hasPrevious: false, hasNext: false },
      });

      await getMappedNewProperties({
        oldPropertyId: 2565750,
        wingDetailsId: 4321,
        pageSize: 25,
      });

      expect(apiClient.get).toHaveBeenCalledWith(
        '/PropertyMapMaster/mapped-new-properties?OldPropertyId=2565750&WingDetailsId=4321&PageSize=25',
        { cache: 'no-store' }
      );
    });

    it('should gracefully handle API failure without throwing', async () => {
      vi.mocked(apiClient.get).mockRejectedValue(new Error('Network error'));

      const result = await getMappedNewProperties({ oldPropertyId: 99999 });
      expect(result).toBeNull();
    });
  });

  describe('getMappedOldProperties', () => {
    it('should call /PropertyMapMaster/mapped-old-properties with PropertyId query parameter', async () => {
      const mockApiResponse = {
        success: true,
        data: {
          items: [
            {
              id: 2565750,
              propertyNo: '8071629',
              oldPropertyNo: '8071629',
              rateableValue: 69152,
              totalTax: 72305,
            },
          ],
          totalCount: 1,
          pageNumber: 1,
          pageSize: 10,
          totalPages: 1,
          hasPrevious: false,
          hasNext: false,
        },
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockApiResponse);

      const result = await getMappedOldProperties({
        propertyId: 2078970,
        pageSize: 10,
      });

      expect(apiClient.get).toHaveBeenCalledWith(
        '/PropertyMapMaster/mapped-old-properties?PropertyId=2078970&PageSize=10',
        { cache: 'no-store' }
      );
      expect(result).not.toBeNull();
      expect(result?.items.length).toBe(1);
      expect(result?.items[0].id).toBe(2565750);
      expect(result?.items[0].rateableValue).toBe(69152);
    });

    it('should gracefully handle API failure without throwing', async () => {
      vi.mocked(apiClient.get).mockRejectedValue(new Error('Network error'));

      const result = await getMappedOldProperties({ propertyId: 99999 });
      expect(result).toBeNull();
    });
  });
});

