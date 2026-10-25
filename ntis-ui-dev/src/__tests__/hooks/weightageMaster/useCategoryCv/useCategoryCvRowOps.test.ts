import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useCategoryCvRowOps } from '@/hooks/weightageMaster/useCategoryCv/useCategoryCvRowOps';
import { UseFactorCVMaster } from '@/types/useCategoryCvFactor.types';
import * as actions from '@/app/[locale]/property-tax/weightage-master/sub-type-weightage/action';

vi.mock('@/app/[locale]/property-tax/weightage-master/sub-type-weightage/action', () => ({
  updateUseFactorCVMasterAction: vi.fn(),
  createUseFactorCVMasterAction: vi.fn(),
}));

describe('useCategoryCvRowOps', () => {
  const mockRow: UseFactorCVMaster = {
    id: 1,
    typeOfUseId: 100,
    subTypeOfUseId: 200,
    factor: 1.5,
    yearRangeCVId: 2023,
    isActive: true,
    createdDate: '2024-01-01',
    updatedDate: '2024-01-01',
  };

  const mockNewRow: UseFactorCVMaster = {
    id: 0,
    typeOfUseId: 101,
    subTypeOfUseId: 201,
    factor: 2.0,
    yearRangeCVId: 2023,
    isActive: true,
    createdDate: '2024-01-01',
    updatedDate: '2024-01-01',
  };

  const getRowUid = (row: UseFactorCVMaster) => 
    `${row.id}-${row.typeOfUseId}-${row.subTypeOfUseId}-${row.yearRangeCVId || 'noYear'}`;

  const mockFindRowByUid = vi.fn((uid: string) => {
    if (uid === getRowUid(mockRow)) return mockRow;
    if (uid === getRowUid(mockNewRow)) return mockNewRow;
    return undefined;
  });

  const mockAddToast = vi.fn();
  const mockRefreshPage = vi.fn();
  const mockSetEditableRows = vi.fn();
  const mockSetIsUpdating = vi.fn();
  const mockTw = vi.fn((key: string) => {
    const messages: Record<string, string> = {
      'common.messages.negativeValuesNotAllowed': 'Negative values not allowed',
      'common.messages.valueExceedsMax': 'Value exceeds maximum',
      'common.messages.noChangesToUpdate': 'No changes to update',
      'common.messages.noChangesDetected': 'No changes detected',
      'common.messages.recordCreatedSuccess': 'Record created successfully',
      'common.messages.recordUpdatedSuccess': 'Record updated successfully',
      'common.messages.createFailed': 'Failed to create record',
      'common.messages.updateFailed': 'Failed to update record',
      'common.messages.failedToSaveRow': 'Failed to save row',
      'common.messages.changesDiscarded': 'Changes discarded',
    };
    return messages[key] || key;
  });

  const mockOnDataChanged = vi.fn();

  const defaultProps = {
    editableRows: {},
    setEditableRows: mockSetEditableRows,
    setIsUpdating: mockSetIsUpdating,
    getRowUid,
    findRowByUid: mockFindRowByUid,
    addToast: mockAddToast,
    refreshPage: mockRefreshPage,
    tW: mockTw,
    onDataChanged: mockOnDataChanged,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('handleCellChange', () => {
    it('should update editable rows with valid positive value', () => {
      const { result } = renderHook(() => useCategoryCvRowOps(defaultProps));
      const rowId = getRowUid(mockRow);

      act(() => {
        result.current.handleCellChange(rowId, 'factor', 2.5);
      });

      expect(mockSetEditableRows).toHaveBeenCalled();
      const setterFn = mockSetEditableRows.mock.calls[0][0];
      const newState = setterFn({});
      expect(newState[rowId].factor).toBe(2.5);
      expect(mockAddToast).not.toHaveBeenCalled();
    });

    it('should reject negative values and show error toast', () => {
      const { result } = renderHook(() => useCategoryCvRowOps(defaultProps));
      const rowId = getRowUid(mockRow);

      act(() => {
        result.current.handleCellChange(rowId, 'factor', -1);
      });

      expect(mockAddToast).toHaveBeenCalledWith('error', 'Negative values not allowed');
      expect(mockSetEditableRows).not.toHaveBeenCalled();
    });

    it('should reject values exceeding maximum and show error toast', () => {
      const { result } = renderHook(() => useCategoryCvRowOps(defaultProps));
      const rowId = getRowUid(mockRow);

      act(() => {
        result.current.handleCellChange(rowId, 'factor', 1000000);
      });

      expect(mockAddToast).toHaveBeenCalledWith('error', 'Value exceeds maximum');
      expect(mockSetEditableRows).not.toHaveBeenCalled();
    });

    it('should merge with existing editable row data', () => {
      const rowId = getRowUid(mockRow);
      const existingEditableRows = {
        [rowId]: { ...mockRow, factor: 2.0 },
      };

      const { result } = renderHook(() =>
        useCategoryCvRowOps({
          ...defaultProps,
          editableRows: existingEditableRows,
        })
      );

      act(() => {
        result.current.handleCellChange(rowId, 'factor', 3.0);
      });

      expect(mockSetEditableRows).toHaveBeenCalled();
      const setterFn = mockSetEditableRows.mock.calls[0][0];
      const newState = setterFn(existingEditableRows);
      expect(newState[rowId].factor).toBe(3.0);
    });

    it('should not update when original row is not found', () => {
      const { result } = renderHook(() => useCategoryCvRowOps(defaultProps));

      act(() => {
        result.current.handleCellChange('non-existent-id', 'factor', 2.5);
      });

      expect(mockSetEditableRows).toHaveBeenCalled();
      const setterFn = mockSetEditableRows.mock.calls[0][0];
      const newState = setterFn({});
      expect(newState).toEqual({});
    });
  });

  describe('handleUpdate', () => {
    it('should show warning when no editable data exists', async () => {
      const { result } = renderHook(() => useCategoryCvRowOps(defaultProps));

      await act(async () => {
        await result.current.handleUpdate(mockRow);
      });

      expect(mockAddToast).toHaveBeenCalledWith('warning', 'No changes to update');
      expect(mockSetIsUpdating).not.toHaveBeenCalled();
    });

    it('should show warning when no changes detected', async () => {
      const rowId = getRowUid(mockRow);
      const editableRows = {
        [rowId]: { ...mockRow }, // Same values
      };

      const { result } = renderHook(() =>
        useCategoryCvRowOps({
          ...defaultProps,
          editableRows,
        })
      );

      await act(async () => {
        await result.current.handleUpdate(mockRow);
      });

      expect(mockAddToast).toHaveBeenCalledWith('warning', 'No changes detected');
      expect(mockSetIsUpdating).not.toHaveBeenCalled();
    });

    it('should create new record when id is 0', async () => {
      vi.mocked(actions.createUseFactorCVMasterAction).mockResolvedValue({
        success: true,
      });

      const rowId = getRowUid(mockNewRow);
      const editableRows = {
        [rowId]: { ...mockNewRow, factor: 3.0 },
      };

      const { result } = renderHook(() =>
        useCategoryCvRowOps({
          ...defaultProps,
          editableRows,
        })
      );

      await act(async () => {
        await result.current.handleUpdate(mockNewRow);
      });

      expect(mockSetIsUpdating).toHaveBeenCalledWith(true);
      expect(actions.createUseFactorCVMasterAction).toHaveBeenCalledWith({
        isActive: true,
        typeOfUseId: 101,
        subTypeOfUseId: 201,
        factor: 3.0,
        yearRangeCVId: 2023,
      });
      expect(mockAddToast).toHaveBeenCalledWith('success', 'Record created successfully');
      expect(mockSetEditableRows).toHaveBeenCalled();
      expect(mockSetIsUpdating).toHaveBeenCalledWith(false);
    });

    it('should update existing record when id > 0', async () => {
      vi.mocked(actions.updateUseFactorCVMasterAction).mockResolvedValue({
        success: true,
      });

      const rowId = getRowUid(mockRow);
      const editableRows = {
        [rowId]: { ...mockRow, factor: 2.5 },
      };

      const { result } = renderHook(() =>
        useCategoryCvRowOps({
          ...defaultProps,
          editableRows,
        })
      );

      await act(async () => {
        await result.current.handleUpdate(mockRow);
      });

      expect(mockSetIsUpdating).toHaveBeenCalledWith(true);
      expect(actions.updateUseFactorCVMasterAction).toHaveBeenCalledWith(1, {
        isActive: true,
        typeOfUseId: 100,
        subTypeOfUseId: 200,
        factor: 2.5,
        yearRangeCVId: 2023,
      });
      expect(mockAddToast).toHaveBeenCalledWith('success', 'Record updated successfully');
      expect(mockSetEditableRows).toHaveBeenCalled();
      expect(mockSetIsUpdating).toHaveBeenCalledWith(false);
    });

    it('should handle create failure', async () => {
      vi.mocked(actions.createUseFactorCVMasterAction).mockResolvedValue({
        success: false,
        message: 'Duplicate entry',
      });

      const rowId = getRowUid(mockNewRow);
      const editableRows = {
        [rowId]: { ...mockNewRow, factor: 3.0 },
      };

      const { result } = renderHook(() =>
        useCategoryCvRowOps({
          ...defaultProps,
          editableRows,
        })
      );

      await act(async () => {
        await result.current.handleUpdate(mockNewRow);
      });

      expect(mockAddToast).toHaveBeenCalledWith('error', 'Duplicate entry');
      expect(mockSetIsUpdating).toHaveBeenCalledWith(false);
    });

    it('should handle update failure', async () => {
      vi.mocked(actions.updateUseFactorCVMasterAction).mockResolvedValue({
        success: false,
        message: 'Server error',
      });

      const rowId = getRowUid(mockRow);
      const editableRows = {
        [rowId]: { ...mockRow, factor: 2.5 },
      };

      const { result } = renderHook(() =>
        useCategoryCvRowOps({
          ...defaultProps,
          editableRows,
        })
      );

      await act(async () => {
        await result.current.handleUpdate(mockRow);
      });

      expect(mockAddToast).toHaveBeenCalledWith('error', 'Server error');
      expect(mockSetIsUpdating).toHaveBeenCalledWith(false);
    });

    it('should handle unexpected errors', async () => {
      vi.mocked(actions.updateUseFactorCVMasterAction).mockRejectedValue(
        new Error('Network error')
      );

      const rowId = getRowUid(mockRow);
      const editableRows = {
        [rowId]: { ...mockRow, factor: 2.5 },
      };

      const { result } = renderHook(() =>
        useCategoryCvRowOps({
          ...defaultProps,
          editableRows,
        })
      );

      await act(async () => {
        await result.current.handleUpdate(mockRow);
      });

      expect(mockAddToast).toHaveBeenCalledWith('error', 'Failed to save row');
      expect(mockSetIsUpdating).toHaveBeenCalledWith(false);
    });

    it('should clear editable row from state after successful update', async () => {
      vi.mocked(actions.updateUseFactorCVMasterAction).mockResolvedValue({
        success: true,
      });

      const rowId = getRowUid(mockRow);
      const editableRows = {
        [rowId]: { ...mockRow, factor: 2.5 },
      };

      const { result } = renderHook(() =>
        useCategoryCvRowOps({
          ...defaultProps,
          editableRows,
        })
      );

      await act(async () => {
        await result.current.handleUpdate(mockRow);
      });

      expect(mockSetEditableRows).toHaveBeenCalled();
      const setterFn = mockSetEditableRows.mock.calls[0][0];
      const newState = setterFn(editableRows);
      expect(newState[rowId]).toBeUndefined();
    });

    it('should refresh page after successful update', async () => {
      vi.mocked(actions.updateUseFactorCVMasterAction).mockResolvedValue({
        success: true,
      });
      vi.useFakeTimers();

      const rowId = getRowUid(mockRow);
      const editableRows = {
        [rowId]: { ...mockRow, factor: 2.5 },
      };

      const { result } = renderHook(() =>
        useCategoryCvRowOps({
          ...defaultProps,
          editableRows,
        })
      );

      await act(async () => {
        await result.current.handleUpdate(mockRow);
        vi.advanceTimersByTime(1000);
      });

      expect(mockRefreshPage).toHaveBeenCalled();
      vi.useRealTimers();
    });
  });

  describe('handleCancel', () => {
    it('should remove row from editable rows', () => {
      const rowId = getRowUid(mockRow);
      const editableRows = {
        [rowId]: { ...mockRow, factor: 2.5 },
      };

      const { result } = renderHook(() =>
        useCategoryCvRowOps({
          ...defaultProps,
          editableRows,
        })
      );

      act(() => {
        result.current.handleCancel(mockRow);
      });

      expect(mockSetEditableRows).toHaveBeenCalled();
      const setterFn = mockSetEditableRows.mock.calls[0][0];
      const newState = setterFn(editableRows);
      expect(newState[rowId]).toBeUndefined();
    });

    it('should show info toast when changes are discarded', () => {
      const rowId = getRowUid(mockRow);
      const editableRows = {
        [rowId]: { ...mockRow, factor: 2.5 },
      };

      const { result } = renderHook(() =>
        useCategoryCvRowOps({
          ...defaultProps,
          editableRows,
        })
      );

      act(() => {
        result.current.handleCancel(mockRow);
      });

      expect(mockAddToast).toHaveBeenCalledWith('info', 'Changes discarded');
    });

    it('should handle cancel for non-existent editable row', () => {
      const { result } = renderHook(() => useCategoryCvRowOps(defaultProps));

      act(() => {
        result.current.handleCancel(mockRow);
      });

      expect(mockSetEditableRows).toHaveBeenCalled();
      expect(mockAddToast).toHaveBeenCalledWith('info', 'Changes discarded');
    });
  });
});
