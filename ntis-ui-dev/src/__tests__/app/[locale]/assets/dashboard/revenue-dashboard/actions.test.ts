import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getRevenueDashboardAction } from '@/app/[locale]/assets/dashboard/revenue-dashboard/actions';
import { revenueDashboardService } from '@/lib/api/assets/dashboard/revenue-dashboard/revenue-dashboard.service';

vi.mock('@/lib/api/assets/dashboard/revenue-dashboard/revenue-dashboard.service', () => ({
  revenueDashboardService: {
    getOverview: vi.fn(),
    getFilterOptions: vi.fn(),
  },
}));
import type { RevenueDashboardOverview } from '@/types/assets/dashboard/revenue-dashboard/revenue-dashboard.types';

describe('getRevenueDashboardAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return successful dashboard data when both services succeed', async () => {
    const mockOverview = {
      summary: { totalLeasedAssets: 10 },
      categoryDistribution: [],
    } as unknown as RevenueDashboardOverview;
    
    vi.mocked(revenueDashboardService.getOverview).mockResolvedValue({
      success: true,
      data: mockOverview,
    });
    
    vi.mocked(revenueDashboardService.getFilterOptions).mockResolvedValue({
      zones: [{ id: 1, label: 'Zone 1' }],
      wards: [{ id: 101, label: 'Ward 101' }],
    });

    const result = await getRevenueDashboardAction({ year: 2024, zoneId: 1, wardId: null });

    expect(revenueDashboardService.getOverview).toHaveBeenCalledWith({ year: 2024, zoneId: 1, wardId: undefined });
    expect(revenueDashboardService.getFilterOptions).toHaveBeenCalledWith(1);
    
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data?.overview).toEqual(mockOverview);
    expect(result.data?.zones.length).toBe(1);
    expect(result.data?.wards.length).toBe(1);
    expect(result.data?.selectedZoneId).toBe(1);
    expect(result.data?.selectedWardId).toBeNull();
  });

  it('should return error if getOverview fails', async () => {
    vi.mocked(revenueDashboardService.getOverview).mockResolvedValue({
      success: false,
      statusCode: 404,
      message: 'Overview not found',
    });
    
    vi.mocked(revenueDashboardService.getFilterOptions).mockResolvedValue({ zones: [], wards: [] });

    const result = await getRevenueDashboardAction({});

    expect(result.success).toBe(false);
    expect(result.statusCode).toBe(404);
    expect(result.message).toBe('Overview not found');
  });

  it('should catch exceptions and return 500 error', async () => {
    vi.mocked(revenueDashboardService.getOverview).mockRejectedValue(new Error('Unexpected error'));

    const result = await getRevenueDashboardAction();

    expect(result.success).toBe(false);
    expect(result.statusCode).toBe(500);
    expect(result.message).toContain('Unexpected error');
  });
});
