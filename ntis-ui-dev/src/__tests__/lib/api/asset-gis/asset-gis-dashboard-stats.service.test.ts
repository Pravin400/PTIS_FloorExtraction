import { describe, it, expect, vi, beforeEach } from 'vitest';
import { gisDashboardStatsService, GisDashboardApi } from '@/lib/api/asset-gis/asset-gis-dashboard-stats.service';
import { apiClient } from '@/services/api.service';

vi.mock('server-only', () => ({}));
vi.mock('@/services/api.service', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

describe('GisDashboardStatsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches dashboard KPI counts successfully', async () => {
    const mockData = { totalProperties: 12500, totalWards: 12 };
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      success: true,
      statusCode: 200,
      data: mockData,
    });

    const result = await gisDashboardStatsService.getDashboardStats('1', '2');
    expect(result.success).toBe(true);
    expect(result.data).toEqual(mockData);
    expect(apiClient.get).toHaveBeenCalledWith('/AssetDashboard/dashboard-stats?zoneId=1&wardId=2', { cache: 'no-store' });
  });

  it('handles API failure gracefully with fallback error response', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      success: false,
      statusCode: 500,
      error: 'Network error',
    });
    const result = await GisDashboardApi.getDashboardStats();
    expect(result.success).toBe(false);
    expect(result.statusCode).toBe(500);
  });
});
