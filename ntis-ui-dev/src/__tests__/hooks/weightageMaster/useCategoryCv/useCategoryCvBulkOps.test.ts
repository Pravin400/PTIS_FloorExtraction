import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useCategoryCvBulkOps } from '@/hooks/weightageMaster/useCategoryCv/useCategoryCvBulkOps';
import { UseFactorCVMaster } from '@/types/useCategoryCvFactor.types';
import * as actions from '@/app/[locale]/property-tax/weightage-master/sub-type-weightage/action';
import * as bulkHandler from '@/hooks/weightageMaster/useCategoryCv/useBulkOperationHandler';

vi.mock('@/app/[locale]/property-tax/weightage-master/sub-type-weightage/action', () => ({
  bulkCreateUseFactorCVMasterAction: vi.fn(),
  bulkUpdateUseFactorCVMasterAction: vi.fn(),
  fetchUseFactorCVMasterPagedServerAction: vi.fn(),
}));

vi.mock('@/hooks/weightageMaster/useCategoryCv/useBulkOperationHandler', () => ({
  processBulkOperations: vi.fn(),
}));

describe('useCategoryCvBulkOps', () => {
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
    {
      id: 2,
      typeOfUseId: 101,
      subTypeOfUseId: 201,
      factor: 2.0,
      yearRangeCVId: 2023,
      isActive: true,
      createdDate: '2024-01-01',
      updatedDate: '2024-01-01',
    },
    {
      id: 0,
      typeOfUseId: 102,
      subTypeOfUseId: 202,
      factor: 1.0,
      yearRangeCVId: 2023,
      isActive: true,
      createdDate: '2024-01-01',
      updatedDate: '2024-01-01',
    },
  ];

  const getRowUid = (row: UseFactorCVMaster) =>
    `${row.id}-${row.typeOfUseId}-${row.subTypeOfUseId}-${row.yearRangeCVId || 'noYear'}`;

  const mockFindRowByUid = vi.fn((uid: string) => {
    return mockData.find((row) => getRowUid(row) === uid);
  });

  const mockAddToast = vi.fn();
  const mockRefreshPage = vi.fn();
  const mockSetEditableRows = vi.fn();
  const mockSetIsBulkUpdating = vi.fn();
  const mockSetIsGeneratingAll = vi.fn();
  const mockOnDataChanged = vi.fn();

  const mockTw = vi.fn((key: string, values?: Record<string, unknown>) => {
    const messages: Record<string, string> = {
      'common.messages.validFactorRequired': 'Valid factor required',
      'common.messages.factorApplied': `Factor ${values?.factor} applied to ${values?.count} records`,
      'common.messages.noRecordsMatch': 'No records match',
      'common.messages.noRecordsToUpdate': 'No records to update',
      'common.messages.bulkOperationSuccess': 'Bulk operation successful',
      'common.messages.bulkOperationPartialSuccess': 'Partial success',
      'common.messages.bulkOperationFailed': 'Operation failed',
      'common.messages.noChangesDetectedBulk': 'No changes detected',
      'common.messages.bulkActionFailed': 'Bulk action failed',
      'common.messages.recordsGeneratedSuccess': `${values?.count} records generated successfully`,
      'common.messages.generationFailed': 'Generation failed',
      'common.messages.generateAllFailed': 'Generate all failed',
      'common.messages.allRecordsExist': 'All records already exist',
    };
    return messages[key] || key;
  });

  const defaultProps = {
    data: mockData,
    editableRows: {},
    setEditableRows: mockSetEditableRows,
    setIsBulkUpdating: mockSetIsBulkUpdating,
    setIsGeneratingAll: mockSetIsGeneratingAll,
    selectedYear: '2023',
    typeOfUseId: '',
    factorValue: '2.5',
    getRowUid,
    findRowByUid: mockFindRowByUid,
    addToast: mockAddToast,
    refreshPage: mockRefreshPage,
    tW: mockTw,
    onDataChanged: mockOnDataChanged,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    // Default: the lazy "fetch everything" call used by handleGenerateAll returns the
    // same rows as the current page, unless a test overrides it.
    vi.mocked(actions.fetchUseFactorCVMasterPagedServerAction).mockResolvedValue({
      items: mockData,
      pageNumber: 1,
      pageSize: -1,
      totalCount: mockData.length,
      totalPages: 1,
      hasPrevious: false,
      hasNext: false,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('handleApplyFilter', () => {
    it('should apply factor to all rows that differ from the new factor', () => {
      const { result } = renderHook(() => useCategoryCvBulkOps(defaultProps));

      act(() => {
        result.current.handleApplyFilter();
      });

      expect(mockSetEditableRows).toHaveBeenCalled();
      expect(mockAddToast).toHaveBeenCalledWith(
        'success',
        expect.stringContaining('Factor 2.5 applied')
      );
    });

    it('should show warning for invalid factor value (empty)', () => {
      const { result } = renderHook(() =>
        useCategoryCvBulkOps({ ...defaultProps, factorValue: '' })
      );

      act(() => {
        result.current.handleApplyFilter();
      });

      expect(mockAddToast).toHaveBeenCalledWith('warning', 'Valid factor required');
      expect(mockSetEditableRows).not.toHaveBeenCalled();
    });

    it('should show warning for invalid factor value (NaN)', () => {
      const { result } = renderHook(() =>
        useCategoryCvBulkOps({ ...defaultProps, factorValue: 'abc' })
      );

      act(() => {
        result.current.handleApplyFilter();
      });

      expect(mockAddToast).toHaveBeenCalledWith('warning', 'Valid factor required');
      expect(mockSetEditableRows).not.toHaveBeenCalled();
    });

    it('should show warning for negative factor value', () => {
      const { result } = renderHook(() =>
        useCategoryCvBulkOps({ ...defaultProps, factorValue: '-1.5' })
      );

      act(() => {
        result.current.handleApplyFilter();
      });

      expect(mockAddToast).toHaveBeenCalledWith('warning', 'Valid factor required');
      expect(mockSetEditableRows).not.toHaveBeenCalled();
    });

    it('should show warning when no records need updating', () => {
      // Create data where all rows have the same factor
      const uniformData: UseFactorCVMaster[] = mockData.map(row => ({ ...row, factor: 2.5 }));
      
      const { result } = renderHook(() =>
        useCategoryCvBulkOps({ ...defaultProps, data: uniformData, factorValue: '2.5' })
      );

      act(() => {
        result.current.handleApplyFilter();
      });

      expect(mockAddToast).toHaveBeenCalledWith('warning', 'No records match');
    });

    it('should merge with existing editable rows', () => {
      const existingEditableRows = {
        [getRowUid(mockData[0])]: { ...mockData[0], factor: 3.0 },
      };

      const { result } = renderHook(() =>
        useCategoryCvBulkOps({
          ...defaultProps,
          editableRows: existingEditableRows,
          factorValue: '4.0',
        })
      );

      act(() => {
        result.current.handleApplyFilter();
      });

      expect(mockSetEditableRows).toHaveBeenCalled();
      const setterFn = mockSetEditableRows.mock.calls[0][0];
      const newState = setterFn(existingEditableRows);
      
      // All rows should have factor 4.0
      (Object.values(newState) as UseFactorCVMaster[]).forEach((row) => {
        expect(row.factor).toBe(4.0);
      });
    });

    it('should only update rows where factor differs', () => {
      const { result } = renderHook(() =>
        useCategoryCvBulkOps({ ...defaultProps, factorValue: '2.0' })
      );

      act(() => {
        result.current.handleApplyFilter();
      });

      expect(mockSetEditableRows).toHaveBeenCalled();
      const setterFn = mockSetEditableRows.mock.calls[0][0];
      const newState = setterFn({});

      // Should only have rows that changed (not the one already with factor 2.0)
      expect(Object.keys(newState).length).toBeLessThan(mockData.length);
    });
  });

  describe('handleBulkUpdate', () => {
    it('should call processBulkOperations and handle complete success', async () => {
      vi.mocked(bulkHandler.processBulkOperations).mockResolvedValue({
        success: true,
        createdCount: 1,
        updatedCount: 1,
        errorCount: 0,
        message: 'Success',
      });

      const { result } = renderHook(() => useCategoryCvBulkOps(defaultProps));

      await act(async () => {
        await result.current.handleBulkUpdate();
      });

      expect(mockSetIsBulkUpdating).toHaveBeenCalledWith(true);
      expect(bulkHandler.processBulkOperations).toHaveBeenCalled();
      expect(mockAddToast).toHaveBeenCalledWith('success', 'Success');
      expect(mockSetEditableRows).toHaveBeenCalledWith({});
      
      act(() => {
        vi.advanceTimersByTime(1500);
      });
      
      expect(mockRefreshPage).toHaveBeenCalled();
      expect(mockSetIsBulkUpdating).toHaveBeenCalledWith(false);
    });

    it('should handle no records to update', async () => {
      vi.mocked(bulkHandler.processBulkOperations).mockResolvedValue({
        success: false,
        createdCount: 0,
        updatedCount: 0,
        errorCount: 0,
        message: 'No records to update',
      });

      const { result } = renderHook(() => useCategoryCvBulkOps(defaultProps));

      await act(async () => {
        await result.current.handleBulkUpdate();
      });

      expect(mockAddToast).toHaveBeenCalledWith('warning', 'No records to update');
      expect(mockSetIsBulkUpdating).toHaveBeenCalledWith(false);
    });

    it('should handle partial success', async () => {
      vi.mocked(bulkHandler.processBulkOperations).mockResolvedValue({
        success: true,
        createdCount: 1,
        updatedCount: 1,
        errorCount: 1,
        message: 'Partial success',
      });

      const { result } = renderHook(() => useCategoryCvBulkOps(defaultProps));

      await act(async () => {
        await result.current.handleBulkUpdate();
      });

      expect(mockAddToast).toHaveBeenCalledWith('warning', 'Partial success');
      expect(mockSetIsBulkUpdating).toHaveBeenCalledWith(false);
    });

    it('should handle complete failure', async () => {
      vi.mocked(bulkHandler.processBulkOperations).mockResolvedValue({
        success: false,
        createdCount: 0,
        updatedCount: 0,
        errorCount: 2,
        message: 'Operation failed',
      });

      const { result } = renderHook(() => useCategoryCvBulkOps(defaultProps));

      await act(async () => {
        await result.current.handleBulkUpdate();
      });

      expect(mockAddToast).toHaveBeenCalledWith('error', 'Operation failed');
      expect(mockSetIsBulkUpdating).toHaveBeenCalledWith(false);
    });

    it('should handle no changes detected', async () => {
      vi.mocked(bulkHandler.processBulkOperations).mockResolvedValue({
        success: false,
        createdCount: 0,
        updatedCount: 0,
        errorCount: 0,
        message: 'No changes detected',
      });

      const { result } = renderHook(() => useCategoryCvBulkOps(defaultProps));

      await act(async () => {
        await result.current.handleBulkUpdate();
      });

      // When success is false with all counts at 0, it shows warning (no records to update case)
      expect(mockAddToast).toHaveBeenCalledWith('warning', 'No changes detected');
      expect(mockSetIsBulkUpdating).toHaveBeenCalledWith(false);
    });

    it('should handle exceptions during bulk update', async () => {
      vi.mocked(bulkHandler.processBulkOperations).mockRejectedValue(
        new Error('Network error')
      );

      const { result } = renderHook(() => useCategoryCvBulkOps(defaultProps));

      await act(async () => {
        await result.current.handleBulkUpdate();
      });

      expect(mockAddToast).toHaveBeenCalledWith('error', 'Bulk action failed');
      expect(mockSetIsBulkUpdating).toHaveBeenCalledWith(false);
    });
  });

  describe('handleGenerateAll', () => {
    it('should do nothing when no new records exist', async () => {
      const dataWithoutNewRecords = mockData.filter((row) => row.id !== 0);
      vi.mocked(actions.fetchUseFactorCVMasterPagedServerAction).mockResolvedValue({
        items: dataWithoutNewRecords,
        pageNumber: 1,
        pageSize: -1,
        totalCount: dataWithoutNewRecords.length,
        totalPages: 1,
        hasPrevious: false,
        hasNext: false,
      });

      const { result } = renderHook(() => useCategoryCvBulkOps(defaultProps));

      await act(async () => {
        await result.current.handleGenerateAll();
      });

      expect(mockAddToast).toHaveBeenCalledWith('info', expect.any(String));
      expect(actions.bulkCreateUseFactorCVMasterAction).not.toHaveBeenCalled();
      expect(mockSetIsGeneratingAll).toHaveBeenCalledWith(true);
      expect(mockSetIsGeneratingAll).toHaveBeenCalledWith(false);
    });

    it('should generate all new records successfully', async () => {
      vi.mocked(actions.bulkCreateUseFactorCVMasterAction).mockResolvedValue({
        success: true,
      });

      const { result } = renderHook(() => useCategoryCvBulkOps(defaultProps));

      await act(async () => {
        await result.current.handleGenerateAll();
      });

      expect(mockSetIsGeneratingAll).toHaveBeenCalledWith(true);
      expect(actions.bulkCreateUseFactorCVMasterAction).toHaveBeenCalledWith([
        {
          isActive: true,
          typeOfUseId: 102,
          subTypeOfUseId: 202,
          factor: 1.0,
          yearRangeCVId: 2023,
        },
      ]);
      expect(mockAddToast).toHaveBeenCalledWith(
        'success',
        expect.stringContaining('1 records generated successfully')
      );
      expect(mockSetEditableRows).toHaveBeenCalledWith({});
      
      act(() => {
        vi.advanceTimersByTime(1500);
      });
      
      expect(mockRefreshPage).toHaveBeenCalled();
      expect(mockSetIsGeneratingAll).toHaveBeenCalledWith(false);
    });

    it('should use edited factor values if available', async () => {
      vi.mocked(actions.bulkCreateUseFactorCVMasterAction).mockResolvedValue({
        success: true,
      });

      const editableRows = {
        [getRowUid(mockData[2])]: { ...mockData[2], factor: 5.0 },
      };

      const { result } = renderHook(() =>
        useCategoryCvBulkOps({ ...defaultProps, editableRows })
      );

      await act(async () => {
        await result.current.handleGenerateAll();
      });

      expect(actions.bulkCreateUseFactorCVMasterAction).toHaveBeenCalledWith([
        expect.objectContaining({
          factor: 5.0,
        }),
      ]);
    });

    it('should handle generation failure', async () => {
      vi.mocked(actions.bulkCreateUseFactorCVMasterAction).mockResolvedValue({
        success: false,
        message: 'Validation error',
      });

      const { result } = renderHook(() => useCategoryCvBulkOps(defaultProps));

      await act(async () => {
        await result.current.handleGenerateAll();
      });

      expect(mockAddToast).toHaveBeenCalledWith('error', 'Validation error');
      expect(mockSetEditableRows).not.toHaveBeenCalled();
      expect(mockRefreshPage).not.toHaveBeenCalled();
      expect(mockSetIsGeneratingAll).toHaveBeenCalledWith(false);
    });

    it('should handle exceptions during generation', async () => {
      vi.mocked(actions.bulkCreateUseFactorCVMasterAction).mockRejectedValue(
        new Error('Network error')
      );

      const { result } = renderHook(() => useCategoryCvBulkOps(defaultProps));

      await act(async () => {
        await result.current.handleGenerateAll();
      });

      expect(mockAddToast).toHaveBeenCalledWith('error', 'Generate all failed');
      expect(mockSetIsGeneratingAll).toHaveBeenCalledWith(false);
    });

    it('should generate multiple new records', async () => {
      vi.mocked(actions.bulkCreateUseFactorCVMasterAction).mockResolvedValue({
        success: true,
      });

      const dataWithMultipleNew: UseFactorCVMaster[] = [
        ...mockData,
        {
          id: 0,
          typeOfUseId: 103,
          subTypeOfUseId: 203,
          factor: 2.5,
          yearRangeCVId: 2023,
          isActive: true,
          createdDate: '2024-01-01',
          updatedDate: '2024-01-01',
        },
      ];

      vi.mocked(actions.fetchUseFactorCVMasterPagedServerAction).mockResolvedValue({
        items: dataWithMultipleNew,
        pageNumber: 1,
        pageSize: -1,
        totalCount: dataWithMultipleNew.length,
        totalPages: 1,
        hasPrevious: false,
        hasNext: false,
      });

      const { result } = renderHook(() => useCategoryCvBulkOps(defaultProps));

      await act(async () => {
        await result.current.handleGenerateAll();
      });

      const callArgs = vi.mocked(actions.bulkCreateUseFactorCVMasterAction).mock.calls[0][0];
      expect(callArgs).toHaveLength(2);
      expect(mockAddToast).toHaveBeenCalledWith(
        'success',
        expect.stringContaining('2 records generated successfully')
      );
    });
  });

  describe('Return values', () => {
    it('should return all handler functions', () => {
      const { result } = renderHook(() => useCategoryCvBulkOps(defaultProps));

      expect(result.current).toHaveProperty('handleApplyFilter');
      expect(result.current).toHaveProperty('handleBulkUpdate');
      expect(result.current).toHaveProperty('handleGenerateAll');
      expect(typeof result.current.handleApplyFilter).toBe('function');
      expect(typeof result.current.handleBulkUpdate).toBe('function');
      expect(typeof result.current.handleGenerateAll).toBe('function');
    });
  });
});
