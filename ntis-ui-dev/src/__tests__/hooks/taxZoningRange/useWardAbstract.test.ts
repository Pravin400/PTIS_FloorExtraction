import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWardAbstract } from '@/hooks/taxZoningRange/useWardAbstract';
import type { WardZoningAbstractRow } from '@/types/taxZoningRange.types';

const mockData: WardZoningAbstractRow[] = [
  {
    wardId: 1,
    wardNo: 'W1',
    totalProperties: 100,
    coveredProperties: 60,
    pendingProperties: 40,
    coveragePercent: 60,
    zoneCounts: [
      { taxZoneId: 1, taxZoneNo: '1', count: 30 },
      { taxZoneId: 2, taxZoneNo: '2', count: 30 },
    ],
  },
  {
    wardId: 2,
    wardNo: 'W2',
    totalProperties: 0,
    coveredProperties: 0,
    pendingProperties: 0,
    coveragePercent: 0,
    zoneCounts: [],
  },
  {
    wardId: 3,
    wardNo: 'W3',
    totalProperties: 50,
    coveredProperties: 0,
    pendingProperties: 50,
    coveragePercent: 0,
    zoneCounts: [{ taxZoneId: 1, taxZoneNo: '1', count: 0 }],
  },
];

describe('useWardAbstract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with viewMode "full" and unfiltered data', () => {
    const { result } = renderHook(() => useWardAbstract(mockData));
    expect(result.current.viewMode).toBe('full');
    expect(result.current.filteredData).toEqual(mockData);
  });

  it('should compute totals correctly', () => {
    const { result } = renderHook(() => useWardAbstract(mockData));
    expect(result.current.totals.totalProperties).toBe(150);
    expect(result.current.totals.coveredProperties).toBe(60);
    expect(result.current.totals.pendingProperties).toBe(90);
    expect(result.current.totals.coveragePercent).toBeCloseTo((60 / 150) * 100);
  });

  it('should set coveragePercent to 0 when totalProperties is 0', () => {
    const emptyData: WardZoningAbstractRow[] = [
      { wardId: 1, wardNo: 'W1', totalProperties: 0, coveredProperties: 0, pendingProperties: 0, coveragePercent: 0, zoneCounts: [] },
    ];
    const { result } = renderHook(() => useWardAbstract(emptyData));
    expect(result.current.totals.coveragePercent).toBe(0);
  });

  describe('setViewMode / filteredData', () => {
    it('should filter to rows with totalProperties > 0 for "total"', () => {
      const { result } = renderHook(() => useWardAbstract(mockData));
      act(() => { result.current.setViewMode('total'); });
      expect(result.current.viewMode).toBe('total');
      expect(result.current.filteredData.map((d) => d.wardNo)).toEqual(['W1', 'W3']);
    });

    it('should filter to rows with coveredProperties > 0 for "covered"', () => {
      const { result } = renderHook(() => useWardAbstract(mockData));
      act(() => { result.current.setViewMode('covered'); });
      expect(result.current.filteredData.map((d) => d.wardNo)).toEqual(['W1']);
    });

    it('should filter to rows with pendingProperties > 0 for "pending"', () => {
      const { result } = renderHook(() => useWardAbstract(mockData));
      act(() => { result.current.setViewMode('pending'); });
      expect(result.current.filteredData.map((d) => d.wardNo)).toEqual(['W1', 'W3']);
    });

    it('should return all rows for "full"', () => {
      const { result } = renderHook(() => useWardAbstract(mockData));
      act(() => { result.current.setViewMode('pending'); });
      act(() => { result.current.setViewMode('full'); });
      expect(result.current.filteredData).toEqual(mockData);
    });
  });
});
