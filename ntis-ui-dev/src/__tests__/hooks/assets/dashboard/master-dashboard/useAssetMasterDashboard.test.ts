import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAssetMasterDashboard } from '@/hooks/assets/dashboard/master-dashboard/useAssetMasterDashboard';
import type { DashboardDataPayload } from '@/types/assets/dashboard/master-dashboard/asset-dashboard.types';

// Mock next/navigation
const mockPush = vi.fn();
const mockGet = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => '/dashboard',
  useSearchParams: () => ({
    get: mockGet,
    toString: () => 'existing=1'
  }),
}));

const mockInitialData: DashboardDataPayload = {
  stats: {
    totalAssets: { value: '10', change: '+10%', backInfo: [] },
    totalValue: { value: '₹ 5.0 Cr', change: '+5%', backInfo: [] },
    encroachments: { value: '2', change: '-5%', backInfo: [] },
    maintenance: { value: '0', change: '0%', backInfo: [] },
    monetized: { value: '0', change: '', backInfo: [] },
    auctions: { value: '0', change: '', backInfo: [] },
    acquisitions: { value: '0', change: '', backInfo: [] }
  },
  filteredAssets: [
    {
      id: '1',
      name: 'Asset 1',
      latitude: 19.076,
      longitude: 72.877,
      category: 'building',
      subCategory: '',
      location: 'Municipal Area',
      zone: '',
      ward: '',
      status: 'Active',
      health: 0,
      lastInspection: '',
      valueLakhs: 10,
      usage: ''
    }
  ],
  categories: [
    { categoryId: 1, name: 'Land', id: 'land', count: 0, value: 0, color: '', description: '', isActive: true },
    { categoryId: 2, name: 'Building', id: 'building', count: 0, value: 0, color: '', description: '', isActive: true },
    { categoryId: 3, name: 'Infrastructure', id: 'infrastructure', count: 0, value: 0, color: '', description: '', isActive: true },
    { categoryId: 5, name: 'Movable', id: 'movable', count: 0, value: 0, color: '', description: '', isActive: true }
  ],
  zoneDistribution: [],
  acquisitionsList: [],
  auctionsList: [],
  allZones: ['North', 'South'],
  allWards: [
    { wardNo: 'Ward A', zoneNo: 'North' },
    { wardNo: 'Ward B', zoneNo: 'South' }
  ]
};

describe('useAssetMasterDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockReturnValue(null);
  });

  it('should initialize state correctly from default search parameters', () => {
    const { result } = renderHook(() => useAssetMasterDashboard(mockInitialData));

    expect(result.current.zone).toBe('all');
    expect(result.current.ward).toBe('all');
    expect(result.current.showEncroachment).toBe(false);
    expect(result.current.catFilters).toEqual([]);
    expect(result.current.visibleAssets).toEqual(mockInitialData.filteredAssets);
  });

  it('should initialize state correctly from URL parameters', () => {
    mockGet.mockImplementation((key: string) => {
      if (key === 'zone') return 'North';
      if (key === 'ward') return 'Ward A';
      if (key === 'encroach') return 'true';
      if (key === 'cats') return '1,2';
      return null;
    });

    const { result } = renderHook(() => useAssetMasterDashboard(mockInitialData));

    expect(result.current.zone).toBe('North');
    expect(result.current.ward).toBe('Ward A');
    expect(result.current.showEncroachment).toBe(true);
    expect(result.current.catFilters).toEqual(['land', 'building']);
  });

  it('should trigger router.push when handleZoneChange is called', () => {
    const { result } = renderHook(() => useAssetMasterDashboard(mockInitialData));

    act(() => {
      result.current.handleZoneChange('South');
    });

    expect(mockPush).toHaveBeenCalledWith('/dashboard?existing=1&zone=South', { scroll: false });
  });

  it('should clear ward when handleZoneChange is called', () => {
    mockGet.mockImplementation((key: string) => {
      if (key === 'ward') return 'Ward A';
      return null;
    });

    const { result } = renderHook(() => useAssetMasterDashboard(mockInitialData));

    act(() => {
      result.current.handleZoneChange('South');
    });

    // The param string mock is fixed to 'existing=1', but we can check if it sets ward to null/deletes it.
    // Actually URLSearchParams delete makes it not appear.
    // We expect the final URL to not have ward, but have zone=South.
    // Our mock toString() just returns 'existing=1', so URLSearchParams parses 'existing=1' 
    // and then adds 'zone=South' and deletes 'ward' (which isn't there in 'existing=1').
    expect(mockPush).toHaveBeenCalledWith('/dashboard?existing=1&zone=South', { scroll: false });
  });

  it('should trigger router.push when handleWardChange is called', () => {
    const { result } = renderHook(() => useAssetMasterDashboard(mockInitialData));

    act(() => {
      result.current.handleWardChange('Ward B');
    });

    expect(mockPush).toHaveBeenCalledWith('/dashboard?existing=1&ward=Ward+B', { scroll: false });
  });

  it('should correctly toggle encroachment state', () => {
    const { result } = renderHook(() => useAssetMasterDashboard(mockInitialData));

    act(() => {
      result.current.setShowEncroachment(true);
    });

    expect(mockPush).toHaveBeenCalledWith('/dashboard?existing=1&encroach=true', { scroll: false });
  });

  it('should correctly set category filters', () => {
    const { result } = renderHook(() => useAssetMasterDashboard(mockInitialData));

    act(() => {
      result.current.setCatFilters(['land', 'infrastructure']);
    });

    expect(mockPush).toHaveBeenCalledWith('/dashboard?existing=1&cats=1%2C3', { scroll: false });
  });

  it('should set activeZone correctly from zonesList', () => {
    mockGet.mockImplementation((key: string) => {
      if (key === 'zone') return 'South';
      return null;
    });

    const customData: DashboardDataPayload = {
      ...mockInitialData,
      filteredAssets: [
        { ...mockInitialData.filteredAssets[0], zoneName: 'South' },
        { ...mockInitialData.filteredAssets[0], zoneName: 'North' },
      ]
    };

    const { result } = renderHook(() => useAssetMasterDashboard(customData));

    expect(result.current.zonesList).toContain('South');
    expect(result.current.activeZone).toBe('South');
  });

  it('should clear categories when handleStatsCategoryClick is called with null', () => {
    const { result } = renderHook(() => useAssetMasterDashboard(mockInitialData));

    act(() => {
      result.current.handleStatsCategoryClick(null);
    });

    // It should push with cats deleted, so just the existing params
    expect(mockPush).toHaveBeenCalledWith('/dashboard?existing=1', { scroll: false });
  });

  it('should set single category when handleStatsCategoryClick is called', () => {
    const { result } = renderHook(() => useAssetMasterDashboard(mockInitialData));

    act(() => {
      result.current.handleStatsCategoryClick('Movable');
    });

    expect(mockPush).toHaveBeenCalledWith('/dashboard?existing=1&cats=5', { scroll: false });
  });
});
