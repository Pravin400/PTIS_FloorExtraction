/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchDashboardData } from '@/app/[locale]/assets/dashboard/master-dashboard/actions';
import * as assetDashboardService from '@/lib/api/assets/dashboard/master-dashboard/asset-dashboard.service';
import { wardService, zoneService } from '@/lib/api/assets/dashboard/master-dashboard/asset-dashboard.service';

// Mock the services
vi.mock('@/lib/api/assets/dashboard/master-dashboard/asset-dashboard.service');
// (wardService and zoneService are now inside asset-dashboard.service, so they are covered by the mock above)

const mockDashboardData = {
  summary: {
    totalAssetsCount: 10,
    totalAssetsValue: 50000,
    assetCountCardDetails: [
      { id: 1, category: 'Land', count: 5, totalValue: 25000, color: '#f00', isActive: true },
      { id: 2, category: 'Building', count: 5, totalValue: 25000, color: '#0f0', isActive: false }
    ]
  },
  types: [],
  locations: [
    { id: 100, name: 'Test Asset', marketValue: 25000, latitude: 19.1, longitude: 72.1, categoryName: 'Land' }
  ]
};

describe('actions - fetchDashboardData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should map raw API responses into DashboardDataPayload successfully', async () => {
    vi.mocked(assetDashboardService.getAllDashboardData).mockResolvedValue(mockDashboardData as any);
    vi.mocked(zoneService.getZones).mockResolvedValue({ success: true, data: [{ zoneId: 1, zoneName: 'North' }] } as any);
    vi.mocked(wardService.getWards).mockResolvedValue({ success: true, data: [{ wardId: 2, wardName: 'Ward A' }] } as any);

    const result = (await fetchDashboardData()) as any;

    expect(result).toBeDefined();
    
    expect(result.data?.stats).toBeDefined();
    
    // Filtered assets mapping from locations
    expect(result.data?.filteredAssets).toHaveLength(1);
    expect(result.data?.filteredAssets[0].id).toBe('100');
    expect(result.data?.filteredAssets[0].name).toBe('Test Asset');
    
    // Categories should filter out isActive === false
    expect(result.data?.categories).toHaveLength(1);
    expect(result.data?.categories[0].name).toBe('Land');
    expect(result.data?.categories[0].isActive).toBe(true);
    
    // Master data
    expect(result.data?.allZones).toHaveLength(1);
    expect(result.data?.allWards).toHaveLength(1);
  });

  it('should gracefully handle missing or null arrays from backend services', async () => {
    vi.mocked(assetDashboardService.getAllDashboardData).mockResolvedValue({
      summary: null,
      types: null,
      locations: null
    } as any);
    vi.mocked(zoneService.getZones).mockResolvedValue({ success: true, data: null } as any);
    vi.mocked(wardService.getWards).mockResolvedValue({ success: true, data: null } as any);

    const result = (await fetchDashboardData()) as any;

    expect(result.data?.filteredAssets).toEqual([]);
    expect(result.data?.categories).toEqual([]);
    expect(result.data?.fetchedTypes).toEqual([]);
    expect(result.data?.fetchedAssets).toEqual([]);
    expect(result.data?.allZones).toEqual([]);
    expect(result.data?.allWards).toEqual([]);
  });

  it('should gracefully handle API failures', async () => {
    vi.mocked(assetDashboardService.getAllDashboardData).mockRejectedValue(new Error('Failed to fetch dashboard data'));
    
    vi.mocked(zoneService.getZones).mockResolvedValue({ success: false, data: null } as any);
    vi.mocked(wardService.getWards).mockResolvedValue({ success: false, data: null } as any);

    const result = (await fetchDashboardData()) as any;

    expect(result.success).toBe(false);
    expect(result.data).toBeUndefined();
  });
});
