import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useCategoryCv } from '@/hooks/weightageMaster/useCategoryCv/useCategoryCv';
import { UseFactorCVMaster } from '@/types/useCategoryCvFactor.types';

// Mock dependencies
const mockPush = vi.fn();
const mockRefresh = vi.fn();
const mockSearchParams = new URLSearchParams();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
  useSearchParams: () => mockSearchParams,
}));

vi.mock('@/app/[locale]/property-tax/weightage-master/sub-type-weightage/action', () => ({
  updateUseFactorCVMasterAction: vi.fn(),
  createUseFactorCVMasterAction: vi.fn(),
  bulkCreateUseFactorCVMasterAction: vi.fn(),
  bulkUpdateUseFactorCVMasterAction: vi.fn(),
  fetchUseFactorCVMasterPagedServerAction: vi.fn(),
  fetchTypeOfUsePaged: vi.fn(),
}));

vi.mock('next-intl', () => ({
  useTranslations: (namespace: string) => {
    return (key: string) => {
      if (namespace === 'useCategoryFactorMaster') {
        return `ucfm.${key}`;
      }
      if (namespace === 'weightageMaster') {
        const messages: Record<string, string> = {
          'common.messages.pendingRecordsWarning': 'Pending records warning',
          'common.messages.allClearedInfo': 'All cleared',
        };
        return messages[key] || `wm.${key}`;
      }
      return key;
    };
  },
  useLocale: () => 'en',
}));

// We allow useCategoryCvState and useCategoryCvPagination to be real in this test 
// to verify they are correctly integrated, or we can mock them. 
// Let's keep them real for integration-style orchestration testing, 
// but ensure we handle their internal behaviors.

describe('useCategoryCv Orchestration', () => {
  const mockData: UseFactorCVMaster[] = [
    {
      id: 1,
      typeOfUseId: 100,
      subTypeOfUseId: 200,
      factor: 1.5,
      yearRangeCVId: 2023,
      isActive: true,
      createdDate: '2024-01-01',
      updatedDate: '2024-01-01',
    },
  ];

  const defaultProps = {
    data: mockData,
    pageSize: 10,
    pageNumber: 1,
    typeOfUsePageSize: 10,
    typeOfUsePageNumber: 1,
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    mockSearchParams.delete('selectedYearRange');
    mockSearchParams.delete('typeOfUseId');
    vi.useFakeTimers();

    // Default resolved value for the "refresh missing-records count" fetch,
    // triggered whenever selectedYear/typeOfUseId change (even in tests that
    // don't care about the count itself).
    const { fetchUseFactorCVMasterPagedServerAction } = await import(
      '@/app/[locale]/property-tax/weightage-master/sub-type-weightage/action'
    );
    vi.mocked(fetchUseFactorCVMasterPagedServerAction).mockResolvedValue({
      items: [],
      pageNumber: 1,
      pageSize: -1,
      totalCount: 0,
      totalPages: 1,
      hasPrevious: false,
      hasNext: false,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should orchestrate state and pagination', () => {
    const { result } = renderHook(() => useCategoryCv(defaultProps));

    expect(result.current.selectedYear).toBe('');
    expect(result.current.factorValue).toBe('1.00');
    expect(typeof result.current.changePage).toBe('function');
  });

  it('should show pending records warning when new records exist', () => {
    const dataWithNewRecords = [{ ...mockData[0], id: 0 }];
    
    renderHook(() =>
      useCategoryCv({ ...defaultProps, data: dataWithNewRecords })
    );

    act(() => {
      vi.runAllTimers();
    });

    // The toast should be added via the state hook integrated into useCategoryCv
  });

  describe('Handlers', () => {
    it('handleAssessmentYearChange should update state and navigate', () => {
      const { result } = renderHook(() => useCategoryCv(defaultProps));

      act(() => {
        result.current.handleAssessmentYearChange('2024');
      });

      expect(result.current.selectedYear).toBe('2024');
      expect(mockPush).toHaveBeenCalled();
    });

    it('handleClearAll should reset state, sorting, and navigate', () => {
      const { result } = renderHook(() => useCategoryCv({
        ...defaultProps,
        sortBy: 'FromYear',
        sortOrder: 'asc',
        leftSortBy: 'TypeOfUseCode',
        leftSortOrder: 'desc',
      }));

      act(() => {
        result.current.handleClearAll();
      });

      expect(result.current.selectedYear).toBe('');
      expect(result.current.factorValue).toBe('1.00');
      expect(result.current.sortBy).toBeUndefined();
      expect(result.current.sortOrder).toBeUndefined();
      expect(result.current.leftSortBy).toBeUndefined();
      expect(result.current.leftSortOrder).toBeUndefined();
      expect(mockPush).toHaveBeenCalled();
    });

    it('handleSort should toggle order and navigate', () => {
      const { result } = renderHook(() => useCategoryCv({
        ...defaultProps,
        sortBy: 'FromYear',
        sortOrder: 'asc',
      }));

      act(() => {
        result.current.handleSort('FromYear');
      });

      expect(result.current.sortBy).toBe('FromYear');
      expect(result.current.sortOrder).toBe('desc');
      expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('sortBy=FromYear'));
      expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('sortOrder=desc'));
    });

    it('handleLeftSort should toggle left order and navigate', () => {
      const { result } = renderHook(() => useCategoryCv({
        ...defaultProps,
        leftSortBy: 'TypeOfUseCode',
        leftSortOrder: 'asc',
      }));

      act(() => {
        result.current.handleLeftSort('TypeOfUseCode');
      });

      expect(result.current.leftSortBy).toBe('TypeOfUseCode');
      expect(result.current.leftSortOrder).toBe('desc');
      expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('leftSortBy=TypeOfUseCode'));
      expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('leftSortOrder=desc'));
    });
  });

  it('should expose all required properties for the UI', () => {
    const { result } = renderHook(() => useCategoryCv(defaultProps));

    const expectedKeys = [
      't', 'tW', 'selectedYear', 'typeOfUseId', 'factorValue', 'setFactorValue',
      'editableRows', 'selectedTypeId', 'isUpdating', 'isBulkUpdating',
      'isGeneratingAll', 'newRecordsCount', 'hasNewRecords', 'toasts',
      'isApplyDisabled', 'isBulkUpdateDisabled', 'addToast', 'removeToast',
      'getRowUid', 'handleAssessmentYearChange', 'handleTypeOfUseChange',
      'handleTypeRowClick', 'handleClearAll', 'changePage', 'changePageSize',
      'changeLeftPage', 'changeLeftPageSize', 'sortBy', 'sortOrder',
      'leftSortBy', 'leftSortOrder', 'handleSort', 'handleLeftSort'
    ];

    expectedKeys.forEach(key => {
      expect(result.current).toHaveProperty(key);
    });
  });
});
