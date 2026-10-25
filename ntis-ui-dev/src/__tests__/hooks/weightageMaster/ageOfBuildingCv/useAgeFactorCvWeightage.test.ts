import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAgeFactorCvWeightage } from '@/hooks/weightageMaster/ageFactorCv/useAgeFactorCvWeightage';
import * as ageFactorCvValidation from '@/lib/utils/weightageMaster/ageFactorCv/ageFactorCvValidation';

const mockAddToast = vi.fn();
const mockSetUserAddedAgeRanges = vi.fn();
const mockSetSelectedAgeRange = vi.fn();
const mockSetIsAgeRangeAdded = vi.fn();
const mockSetAgeFrom = vi.fn();
const mockSetAgeTo = vi.fn();

// Create a factory for filter mock state
const createFiltersMock = (ageFrom = '', ageTo = '') => ({
  selectedYear: '2024',
  constructionType: [] as string[],
  factorValue: '0.00',
  setFactorValue: vi.fn(),
  ageFrom,
  setAgeFrom: mockSetAgeFrom,
  ageTo,
  setAgeTo: mockSetAgeTo,
  selectedAgeRange: [] as string[],
  setSelectedAgeRange: mockSetSelectedAgeRange,
  setUserAddedAgeRanges: mockSetUserAddedAgeRanges,
  ageRangeOptions: [
    { label: '0-5', value: '0-5' },
    { label: '11-15', value: '11-15' },
  ],
  isAgeRangeAdded: false,
  setIsAgeRangeAdded: mockSetIsAgeRangeAdded,
  clearFilters: vi.fn(),
  handleAgeRangeChange: vi.fn(),
  handleAssessmentYearChange: vi.fn(),
  handleConstructionTypeChange: vi.fn(),
  changePage: vi.fn(),
  changePageSize: vi.fn(),
  handleClearAll: vi.fn(),
  getMissingRecordsCount: () => 5,
});

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string, params?: Record<string, unknown>) => {
    if (params) {
      return `${key}_${JSON.stringify(params)}`;
    }
    return key;
  },
  useLocale: () => 'en',
}));

// Mock sub-hooks to test orchestration
vi.mock('@/hooks/weightageMaster/ageFactorCv/useAgeFactorCvToasts', () => ({
  useAgeFactorCvToasts: () => ({ 
    toasts: [], 
    addToast: mockAddToast, 
    removeToast: vi.fn() 
  }),
}));

const mockFiltersHook = vi.fn(() => createFiltersMock());

vi.mock('@/hooks/weightageMaster/ageFactorCv/useAgeFactorCvFilters', () => ({
  useAgeFactorCvFilters: () => mockFiltersHook(),
}));

vi.mock('@/hooks/weightageMaster/ageFactorCv/useAgeFactorCvRowOps', () => ({
  useAgeFactorCvRowOps: () => ({ 
    isUpdating: false, 
    handleUpdate: vi.fn(), 
    handleCancelRow: vi.fn() 
  }),
}));

vi.mock('@/hooks/weightageMaster/ageFactorCv/useAgeFactorCvBulkOps', () => ({
  useAgeFactorCvBulkOps: () => ({ 
    isBulkUpdating: false, 
    isGeneratingAll: false, 
    handleApplyFilter: vi.fn(), 
    handleBulkUpdate: vi.fn(), 
    handleGenerateAll: vi.fn() 
  }),
}));

vi.mock('@/hooks/weightageMaster/ageFactorCv/useAgeFactorCvSessionTracking', () => ({
  useAgeFactorCvSessionTracking: () => ({ 
    editableRows: {}, 
    setEditableRows: vi.fn(), 
    sessionCreatedUids: new Set(), 
    setSessionCreatedUids: vi.fn(), 
    getRowUid: vi.fn(() => '1'), 
    findRowByUid: vi.fn() 
  }),
}));

describe('useAgeFactorCvWeightage', () => {
  const defaultProps = {
    paginationData: {
      data: [],
      pageNumber: 1,
      pageSize: 10,
      totalCount: 0,
      totalPages: 0,
    },
    options: {
      constructionTypeOptions: [],
      initialAgeRangeOptions: [
        { label: '0-5', value: '0-5' },
        { label: '11-15', value: '11-15' },
      ],
    },
    allAgeFactors: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockFiltersHook.mockReturnValue(createFiltersMock());
  });

  it('should initialize and expose sub-hook states', () => {
    const { result } = renderHook(() => useAgeFactorCvWeightage(defaultProps));

    expect(result.current).toHaveProperty('editableRows');
    expect(result.current).toHaveProperty('toasts');
    expect(result.current.selectedYear).toBe('2024');
  });



  describe('handleAddAgeRange', () => {
    it('should show warning when ageFrom is missing', () => {
      mockFiltersHook.mockReturnValue(createFiltersMock('', ''));
      const { result } = renderHook(() => useAgeFactorCvWeightage(defaultProps));

      act(() => {
        result.current.handleAddAgeRange();
      });

      expect(mockAddToast).toHaveBeenCalledWith('warning', 'messages.provideBothAges');
    });

    it('should show warning when ageTo is missing', () => {
      mockFiltersHook.mockReturnValue(createFiltersMock('5', ''));
      const { result } = renderHook(() => useAgeFactorCvWeightage(defaultProps));

      act(() => {
        result.current.handleAddAgeRange();
      });

      expect(mockAddToast).toHaveBeenCalledWith('warning', 'messages.provideBothAges');
    });

    it('should show error when fromAge is greater than toAge', () => {
      mockFiltersHook.mockReturnValue(createFiltersMock('10', '5'));
      const { result } = renderHook(() => useAgeFactorCvWeightage(defaultProps));

      act(() => {
        result.current.handleAddAgeRange();
      });

      expect(mockAddToast).toHaveBeenCalledWith('error', 'messages.fromAgeGreaterError');
    });

    it('should show info when exact age range already exists', () => {
      mockFiltersHook.mockReturnValue(createFiltersMock('0', '5'));
      const { result } = renderHook(() => useAgeFactorCvWeightage(defaultProps));

      act(() => {
        result.current.handleAddAgeRange();
      });

      expect(mockAddToast).toHaveBeenCalledWith('info', 'messages.ageRangeExists');
    });

    it('should detect and prevent overlapping ranges (complete overlap within existing)', () => {
      const checkOverlapSpy = vi.spyOn(ageFactorCvValidation, 'checkAgeRangeOverlap');
      checkOverlapSpy.mockReturnValue({ hasOverlap: true, overlappingRange: '0-5' });

      mockFiltersHook.mockReturnValue(createFiltersMock('2', '4'));
      const { result } = renderHook(() => useAgeFactorCvWeightage(defaultProps));

      act(() => {
        result.current.handleAddAgeRange();
      });

      expect(checkOverlapSpy).toHaveBeenCalledWith(2, 4, ['0-5', '11-15']);
      expect(mockAddToast).toHaveBeenCalledWith(
        'error',
        expect.stringContaining('messages.ageRangeOverlap')
      );
      
      checkOverlapSpy.mockRestore();
    });

    it('should detect and prevent overlapping ranges (partial overlap)', () => {
      const checkOverlapSpy = vi.spyOn(ageFactorCvValidation, 'checkAgeRangeOverlap');
      checkOverlapSpy.mockReturnValue({ hasOverlap: true, overlappingRange: '0-5' });

      mockFiltersHook.mockReturnValue(createFiltersMock('3', '10'));
      const { result } = renderHook(() => useAgeFactorCvWeightage(defaultProps));

      act(() => {
        result.current.handleAddAgeRange();
      });

      expect(checkOverlapSpy).toHaveBeenCalledWith(3, 10, ['0-5', '11-15']);
      expect(mockAddToast).toHaveBeenCalledWith(
        'error',
        expect.stringContaining('messages.ageRangeOverlap')
      );
      
      checkOverlapSpy.mockRestore();
    });

    it('should allow adding non-overlapping range between existing ranges', () => {
      const checkOverlapSpy = vi.spyOn(ageFactorCvValidation, 'checkAgeRangeOverlap');
      checkOverlapSpy.mockReturnValue({ hasOverlap: false });

      mockFiltersHook.mockReturnValue(createFiltersMock('6', '10'));
      const { result } = renderHook(() => useAgeFactorCvWeightage(defaultProps));

      act(() => {
        result.current.handleAddAgeRange();
      });

      expect(checkOverlapSpy).toHaveBeenCalledWith(6, 10, ['0-5', '11-15']);
      expect(mockSetUserAddedAgeRanges).toHaveBeenCalled();
      expect(mockSetSelectedAgeRange).toHaveBeenCalledWith(['6-10']);
      expect(mockAddToast).toHaveBeenCalledWith(
        'success',
        expect.stringContaining('messages.ageRangeAdded')
      );
      expect(mockSetIsAgeRangeAdded).toHaveBeenCalledWith(true);
      
      checkOverlapSpy.mockRestore();
    });

    it('should allow adding range after all existing ranges', () => {
      const checkOverlapSpy = vi.spyOn(ageFactorCvValidation, 'checkAgeRangeOverlap');
      checkOverlapSpy.mockReturnValue({ hasOverlap: false });

      mockFiltersHook.mockReturnValue(createFiltersMock('20', '25'));
      const { result } = renderHook(() => useAgeFactorCvWeightage(defaultProps));

      act(() => {
        result.current.handleAddAgeRange();
      });

      expect(checkOverlapSpy).toHaveBeenCalledWith(20, 25, ['0-5', '11-15']);
      expect(mockSetUserAddedAgeRanges).toHaveBeenCalled();
      expect(mockAddToast).toHaveBeenCalledWith(
        'success',
        expect.stringContaining('messages.ageRangeAdded')
      );
      
      checkOverlapSpy.mockRestore();
    });

    it('should clear inputs after successful addition', () => {
      const checkOverlapSpy = vi.spyOn(ageFactorCvValidation, 'checkAgeRangeOverlap');
      checkOverlapSpy.mockReturnValue({ hasOverlap: false });

      mockFiltersHook.mockReturnValue(createFiltersMock('6', '10'));
      const { result } = renderHook(() => useAgeFactorCvWeightage(defaultProps));

      act(() => {
        result.current.handleAddAgeRange();
      });

      expect(mockSetAgeFrom).toHaveBeenCalledWith('');
      expect(mockSetAgeTo).toHaveBeenCalledWith('');
      
      checkOverlapSpy.mockRestore();
    });

    it('should allow range before all existing ranges', () => {
      const checkOverlapSpy = vi.spyOn(ageFactorCvValidation, 'checkAgeRangeOverlap');
      checkOverlapSpy.mockReturnValue({ hasOverlap: false });

      mockFiltersHook.mockReturnValue(createFiltersMock('-5', '-1'));
      const { result } = renderHook(() => useAgeFactorCvWeightage(defaultProps));

      act(() => {
        result.current.handleAddAgeRange();
      });

      expect(checkOverlapSpy).toHaveBeenCalledWith(-5, -1, ['0-5', '11-15']);
      expect(mockSetUserAddedAgeRanges).toHaveBeenCalled();
      expect(mockAddToast).toHaveBeenCalledWith(
        'success',
        expect.stringContaining('messages.ageRangeAdded')
      );
      
      checkOverlapSpy.mockRestore();
    });
  });
});
