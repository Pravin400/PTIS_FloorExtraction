import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getMaxTypeForSociety, getExistingTypesForSociety } from '@/lib/api/property-type.service';
import { apiClient } from '@/services/api.service';

vi.mock('server-only', () => ({}));
vi.mock('@/services/api.service', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

describe('property-type.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getMaxTypeForSociety', () => {
    it('should call apiClient.get with correct society endpoint', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        success: true,
        data: { maxType: 5 },
      });

      const response = await getMaxTypeForSociety(123);

      expect(apiClient.get).toHaveBeenCalledWith('/society/123/max-type');
      expect(response).toEqual({
        success: true,
        data: { maxType: 5 },
      });
    });
  });

  describe('getExistingTypesForSociety', () => {
    it('should call apiClient.get without wing query if wingDetailId is omitted', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        success: true,
        data: ['A', 'B'],
      });

      const response = await getExistingTypesForSociety(123);

      expect(apiClient.get).toHaveBeenCalledWith('/society/123/types');
      expect(response).toEqual({
        success: true,
        data: ['A', 'B'],
      });
    });

    it('should call apiClient.get with wing query when wingDetailId is provided', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        success: true,
        data: ['A', 'B', 'C'],
      });

      const response = await getExistingTypesForSociety(123, 456);

      expect(apiClient.get).toHaveBeenCalledWith('/society/123/types?wingDetailId=456');
      expect(response).toEqual({
        success: true,
        data: ['A', 'B', 'C'],
      });
    });
  });
});
