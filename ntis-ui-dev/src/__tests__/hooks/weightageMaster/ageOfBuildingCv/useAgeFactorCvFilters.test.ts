import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAgeFactorCvFilters } from '@/hooks/weightageMaster/ageFactorCv/useAgeFactorCvFilters';
import { AgeFactorCVMaster } from '@/types/ageFactorCv.types';

const mockPush = vi.fn();
const mockSearchParamGet = vi.fn();
const mockSearchParamToString = vi.fn(() => '');

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useSearchParams: () => ({
    get: (key: string) => mockSearchParamGet(key),
    toString: () => mockSearchParamToString(),
  }),
}));

vi.mock('next-intl', () => ({
  useLocale: () => 'en',
}));

describe('useAgeFactorCvFilters', () => {
  const initialAgeRangeOptions = [
    { label: '0-5', value: '0-5' },
    { label: '6-10', value: '6-10' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParamGet.mockImplementation(() => null);
    mockSearchParamToString.mockReturnValue('');
  });

  it('should initialize with default states', () => {
    const { result } = renderHook(() =>
      useAgeFactorCvFilters({
        initialAgeRangeOptions,
      })
    );

    expect(result.current.selectedYear).toBe('');
    expect(result.current.constructionType).toEqual([]);
    expect(result.current.factorValue).toBe('1.00');
    expect(result.current.ageFrom).toBe('');
    expect(result.current.ageTo).toBe('');
    expect(result.current.selectedAgeRange).toEqual([]);
    expect(result.current.ageRangeOptions).toEqual(initialAgeRangeOptions);
  });

  it('should initialize with search param values', () => {
    mockSearchParamGet.mockImplementation((key) => {
      if (key === 'selectedYearRange') return '2024';
      if (key === 'constructionType') return '101';
      return null;
    });

    const { result } = renderHook(() =>
      useAgeFactorCvFilters({
        initialAgeRangeOptions,
      })
    );

    expect(result.current.selectedYear).toBe('2024');
    expect(result.current.constructionType).toEqual(['101']);
  });

  it('should clear filters', () => {
    const { result } = renderHook(() =>
      useAgeFactorCvFilters({
        initialAgeRangeOptions,
      })
    );

    act(() => {
      result.current.setFactorValue('1.50');
      result.current.setConstructionType(['101']);
      result.current.setSelectedYear('2024');
      result.current.setAgeFrom('0');
      result.current.setAgeTo('5');
      result.current.setSelectedAgeRange(['0-5']);
      result.current.setIsAgeRangeAdded(true);
    });

    expect(result.current.factorValue).toBe('1.50');

    act(() => {
      result.current.clearFilters();
    });

    expect(result.current.factorValue).toBe('1.00');
    expect(result.current.constructionType).toEqual([]);
    expect(result.current.selectedYear).toBe('');
    expect(result.current.ageFrom).toBe('');
    expect(result.current.ageTo).toBe('');
    expect(result.current.selectedAgeRange).toEqual([]);
    expect(result.current.isAgeRangeAdded).toBe(false);
  });

  it('should handle age range change', () => {
    const { result } = renderHook(() =>
      useAgeFactorCvFilters({
        initialAgeRangeOptions,
      })
    );

    act(() => {
      result.current.handleAgeRangeChange(['0-5']);
    });

    expect(result.current.selectedAgeRange).toEqual(['0-5']);
    expect(result.current.ageFrom).toBe('0');
    expect(result.current.ageTo).toBe('5');

    act(() => {
      result.current.handleAgeRangeChange([]);
    });

    expect(result.current.selectedAgeRange).toEqual([]);
    expect(result.current.ageFrom).toBe('');
    expect(result.current.ageTo).toBe('');
  });

  it('should push route on assessment year change', () => {
    mockSearchParamToString.mockReturnValue('q=rcc');
    const { result } = renderHook(() =>
      useAgeFactorCvFilters({
        initialAgeRangeOptions,
      })
    );

    act(() => {
      result.current.handleAssessmentYearChange('2024');
    });

    expect(result.current.selectedYear).toBe('2024');
    expect(mockPush).toHaveBeenCalledWith(
      '/en/property-tax/weightage-master/age-weightage?q=rcc&page=1&selectedYearRange=2024'
    );
  });

  it('should push route on construction type change', () => {
    mockSearchParamToString.mockReturnValue('selectedYearRange=2024');
    const { result } = renderHook(() =>
      useAgeFactorCvFilters({
        initialAgeRangeOptions,
      })
    );

    act(() => {
      result.current.handleConstructionTypeChange(['101']);
    });

    expect(result.current.constructionType).toEqual(['101']);
    expect(mockPush).toHaveBeenCalledWith(
      '/en/property-tax/weightage-master/age-weightage?selectedYearRange=2024&page=1&constructionType=101'
    );
  });

  it('should push route on sort', () => {
    const { result } = renderHook(() =>
      useAgeFactorCvFilters({
        initialAgeRangeOptions,
        initialSortBy: 'AgeFrom',
        initialSortOrder: 'asc',
      })
    );

    act(() => {
      result.current.handleSort('AgeFrom');
    });

    expect(result.current.sortBy).toBe('AgeFrom');
    expect(result.current.sortOrder).toBe('desc');
    expect(mockPush).toHaveBeenCalledWith(
      '/en/property-tax/weightage-master/age-weightage?page=1&sortBy=AgeFrom&sortOrder=desc'
    );
  });

  it('should change page', () => {
    mockSearchParamGet.mockImplementation((key) => {
      if (key === 'q') return 'rcc';
      return null;
    });

    const { result } = renderHook(() =>
      useAgeFactorCvFilters({
        initialAgeRangeOptions,
        initialSortBy: 'AgeFrom',
        initialSortOrder: 'asc',
      })
    );

    act(() => {
      result.current.setSelectedYear('2024');
      result.current.setConstructionType(['101']);
    });

    act(() => {
      result.current.changePage(2, 10);
    });

    expect(mockPush).toHaveBeenCalledWith(
      '/en/property-tax/weightage-master/age-weightage?page=2&pageSize=10&q=rcc&selectedYearRange=2024&constructionType=101&sortBy=AgeFrom&sortOrder=asc'
    );
  });

  it('should change page size', () => {
    const { result } = renderHook(() =>
      useAgeFactorCvFilters({
        initialAgeRangeOptions,
      })
    );

    act(() => {
      result.current.changePageSize(20);
    });

    expect(mockPush).toHaveBeenCalledWith(
      '/en/property-tax/weightage-master/age-weightage?page=1&pageSize=20'
    );
  });

  it('should handle clear all', () => {
    const mockAddToast = vi.fn();
    const mockTW = vi.fn((key) => key);
    const { result } = renderHook(() =>
      useAgeFactorCvFilters({
        initialAgeRangeOptions,
        initialSortBy: 'AgeFrom',
        initialSortOrder: 'asc',
      })
    );

    act(() => {
      result.current.handleClearAll(mockAddToast, mockTW);
    });

    expect(result.current.sortBy).toBeUndefined();
    expect(result.current.sortOrder).toBeUndefined();
    expect(mockPush).toHaveBeenCalledWith('/en/property-tax/weightage-master/age-weightage');
    expect(mockAddToast).toHaveBeenCalledWith('info', 'common.messages.allClearedInfo');
  });

  it('should return missing records count', () => {
    const constructionTypeOptions = [
      { label: 'RCC', value: '101' },
      { label: 'WOOD', value: '102' },
    ];
    const allAgeFactors: AgeFactorCVMaster[] = [
      { id: 1, constructionTypeId: 101, yearRangeCVId: 2024, ageFrom: 0, ageTo: 5, factor: 1.0, isActive: true },
    ];

    const { result } = renderHook(() =>
      useAgeFactorCvFilters({
        initialAgeRangeOptions,
      })
    );

    // If year is not selected, should be 0
    expect(result.current.getMissingRecordsCount(constructionTypeOptions, allAgeFactors)).toBe(0);

    act(() => {
      result.current.setSelectedYear('2024');
    });

    // Both ranges (0-5, 6-10) for both types (101, 102). 
    // RCC 0-5 exists. So 2 * 2 - 1 = 3 missing.
    expect(result.current.getMissingRecordsCount(constructionTypeOptions, allAgeFactors)).toBe(3);
  });
});
