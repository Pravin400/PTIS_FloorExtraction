
/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAssetMasterDashboard } from '@/hooks/assets/dashboard/master-dashboard/useAssetMasterDashboard';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  usePathname: vi.fn(),
  useSearchParams: vi.fn(),
}));

describe('useAssetMasterDashboard', () => {
  const mockRouter = { push: vi.fn() };
  const mockPathname = '/dashboard';
  
  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockRouter);
    (usePathname as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockPathname);
    (useSearchParams as unknown as ReturnType<typeof vi.fn>).mockReturnValue(new URLSearchParams());
  });

  const mockData = {
    filteredAssets: [{ id: '1', name: 'Asset 1', zone: 'zone1', ward: 'ward1' }],
    categories: [{ categoryId: 1, name: 'Building' }],
    allZones: ['zone1', 'zone2'],
    allWards: [{ wardNo: 'ward1', zoneNo: 'zone1' }, { wardNo: 'ward2', zoneNo: 'zone2' }],
  };

  it('should initialize with data correctly', () => {
    const { result } = renderHook(() => useAssetMasterDashboard(mockData));
    expect(result.current.data).toEqual(mockData);
    expect(result.current.visibleAssets).toEqual(mockData.filteredAssets);
  });

  it('should handle zone change', () => {
    const { result } = renderHook(() => useAssetMasterDashboard(mockData));
    act(() => {
      result.current.handleZoneChange('zone1');
    });
    expect(mockRouter.push).toHaveBeenCalled();
    const pushArg = mockRouter.push.mock.calls[0][0];
    expect(pushArg).toContain('zone=zone1');
  });

  it('should handle category filters correctly', () => {
    (useSearchParams as unknown as ReturnType<typeof vi.fn>).mockReturnValue(new URLSearchParams('cats=1'));
    const { result } = renderHook(() => useAssetMasterDashboard(mockData));
    expect(result.current.catFilters).toEqual(['building']);
  });
});
