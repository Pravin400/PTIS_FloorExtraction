import { describe, it, expect, vi, beforeEach } from 'vitest';
import { revenueDashboardService } from '@/lib/api/assets/dashboard/revenue-dashboard/revenue-dashboard.service';
import { apiClient } from '@/services/api.service';
import {
  normalizeOverview,
  normalizeRevenueListResult,
} from '@/lib/api/assets/dashboard/revenue-dashboard/revenue-dashboard.mappers';

vi.mock('@/services/api.service', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

vi.mock('@/lib/api/assets/dashboard/revenue-dashboard/revenue-dashboard.mappers', () => ({
  normalizeOverview: vi.fn(),
  normalizeRevenueListResult: vi.fn(),
}));

describe('revenueDashboardService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getOverview', () => {
    it('should call api with correct url and query params', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ success: true, data: {} });
      vi.mocked(normalizeOverview).mockReturnValue({ summary: {} } as unknown as ReturnType<typeof normalizeOverview>);

      const result = await revenueDashboardService.getOverview({ year: 2024, zoneId: 1 });
      
      expect(apiClient.get).toHaveBeenCalledWith('/RevenueDashboard/overview?Year=2024&ZoneId=1');
      expect(normalizeOverview).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ summary: {} });
    });

    it('should handle api error response', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ success: false, statusCode: 500 });
      
      const result = await revenueDashboardService.getOverview();
      
      expect(apiClient.get).toHaveBeenCalledWith('/RevenueDashboard/overview');
      expect(normalizeOverview).not.toHaveBeenCalled();
      expect(result.success).toBe(false);
    });
  });

  describe('getRevenueList', () => {
    it('should call api with correct list query params', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ success: true, data: {} });
      vi.mocked(normalizeRevenueListResult).mockReturnValue({ items: [] } as unknown as ReturnType<typeof normalizeRevenueListResult>);

      const result = await revenueDashboardService.getRevenueList({
        pageNumber: 1,
        pageSize: 10,
        searchTerm: 'test ',
        zoneId: 2,
        leaseType: 'Rent',
      });
      
      expect(apiClient.get).toHaveBeenCalledWith(
        '/RevenueDashboard?PageNumber=1&PageSize=10&SearchTerm=test&ZoneId=2&LeaseType=Rent'
      );
      expect(normalizeRevenueListResult).toHaveBeenCalled();
      expect(result.success).toBe(true);
    });

    it('should return error response directly if api call fails', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ success: false, statusCode: 400 });
      
      const result = await revenueDashboardService.getRevenueList({ pageNumber: 2, pageSize: 20 });
      
      expect(apiClient.get).toHaveBeenCalledWith('/RevenueDashboard?PageNumber=2&PageSize=20');
      expect(result.success).toBe(false);
    });
  });
});
