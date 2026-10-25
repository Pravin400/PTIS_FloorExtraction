import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useOffsetActions } from '@/hooks/ptis/RoomSubmission/useOffsetActions';
import type { RoomSubmissionState } from '@/hooks/ptis/RoomSubmission/useRoomSubmissionState';
import type { OffsetData } from '@/types/offset-details.types';
import type { RoomData } from '@/types/room-details.types';
import * as roomSubmissionUtils from '@/lib/utils/RoomSubmission/room-submission.utils';
import * as roomCalculation from '@/lib/utils/RoomSubmission/room-calculation.util';

// Mock dependencies
vi.mock('next-intl', () => ({
  useTranslations: vi.fn(() => (key: string) => key),
}));

vi.mock('@/components/common', () => ({
  useConfirm: vi.fn(() => ({
    confirm: vi.fn((options) => {
      if (options.onConfirm) options.onConfirm();
    }),
  })),
}));

vi.mock('react', async () => {
  const actual = await vi.importActual('react');
  return {
    ...actual,
    useCallback: (fn: unknown) => fn,
  };
});

describe('useOffsetActions', () => {
  let mockState: RoomSubmissionState;
  let mockHandleEdit: (idx: number, room?: RoomData | undefined) => void;

  beforeEach(() => {
    vi.clearAllMocks();

    mockHandleEdit = vi.fn();

    mockState = {
      offsetList: [],
      setOffsetList: vi.fn(),
      offsetData: {
        length: '5',
        width: '5',
        area: 25,
        shape: 'Rectangle',
        shapeType: 'Rectangle',
        operation: 'subtract',
      } as OffsetData,
      setOffsetData: vi.fn(),
      selectedOperation: 'subtract' as const,
      setSelectedOperation: vi.fn(),
      setIsShakingSubtract: vi.fn(),
      setOffsetValidationError: vi.fn(),
      selectedShape: 'Rectangle',
      setSelectedShape: vi.fn(),
      setOffsetModalOpen: vi.fn(),
      setCurrentRoomOffsets: vi.fn(),
      setFormData: vi.fn(),
      rooms: [
        {
          roomNo: '1',
          area: 100,
          total: 100,
          offsets: [],
        },
      ],
      setRooms: vi.fn(),
      editingIndex: 0,
      pendingOffsetModalOpenRef: { current: false },
      formData: {
        roomNo: '1',
        length: '10',
        width: '10',
        roomCount: '1',
        offsetMinus: 'No',
        outer: 'No',
        remark: '',
        utilities: '',
        shape: 'Rectangle',
      },
      shapeParameters: {
        length: '10',
        width: '10',
        radius: '',
        base: '',
        height: '',
        side: '',
        base1: '',
        base2: '',
      },
      setPendingDeletions: vi.fn(),
    } as unknown as RoomSubmissionState;
  });

  describe('calculateAdjustedRoomTotal', () => {
    it('should calculate room total with no offsets', () => {
      vi.spyOn(roomSubmissionUtils, 'calculateRoomArea').mockReturnValue(100);
      vi.spyOn(roomCalculation, 'calculateNetAdjustment').mockReturnValue(0);

      const { result } = renderHook(() =>
        useOffsetActions(mockState, mockHandleEdit)
      );

      const total = result.current.calculateAdjustedRoomTotal();
      expect(total).toBe(100);
    });

    it('should calculate room total with subtract offsets', () => {
      const stateWithOffsets = {
        ...mockState,
        offsetList: [
          { area: 10, operation: 'subtract' as const },
          { area: 5, operation: 'subtract' as const },
        ] as OffsetData[],
      } as unknown as RoomSubmissionState;

      vi.spyOn(roomSubmissionUtils, 'calculateRoomArea').mockReturnValue(100);
      vi.spyOn(roomCalculation, 'calculateNetAdjustment').mockReturnValue(-15);

      const { result } = renderHook(() =>
        useOffsetActions(stateWithOffsets, mockHandleEdit)
      );

      const total = result.current.calculateAdjustedRoomTotal();
      expect(total).toBe(85); // 100 - 15
    });

    it('should calculate room total with add offsets', () => {
      const stateWithOffsets = {
        ...mockState,
        offsetList: [
          { area: 10, operation: 'add' as const },
        ] as OffsetData[],
      } as unknown as RoomSubmissionState;

      vi.spyOn(roomSubmissionUtils, 'calculateRoomArea').mockReturnValue(100);
      vi.spyOn(roomCalculation, 'calculateNetAdjustment').mockReturnValue(10);

      const { result } = renderHook(() =>
        useOffsetActions(stateWithOffsets, mockHandleEdit)
      );

      const total = result.current.calculateAdjustedRoomTotal();
      expect(total).toBe(110); // 100 + 10
    });

    it('should calculate room total with mixed offsets', () => {
      const stateWithOffsets = {
        ...mockState,
        offsetList: [
          { area: 20, operation: 'add' as const },
          { area: 10, operation: 'subtract' as const },
          { area: 5, operation: 'subtract' as const },
        ] as OffsetData[],
      } as unknown as RoomSubmissionState;

      vi.spyOn(roomSubmissionUtils, 'calculateRoomArea').mockReturnValue(100);
      vi.spyOn(roomCalculation, 'calculateNetAdjustment').mockReturnValue(5); // +20 -10 -5 = +5

      const { result } = renderHook(() =>
        useOffsetActions(stateWithOffsets, mockHandleEdit)
      );

      const total = result.current.calculateAdjustedRoomTotal();
      expect(total).toBe(105);
    });
  });

  describe('handleSubtractClick', () => {
    it('should allow subtract when result is positive', () => {
      vi.spyOn(roomSubmissionUtils, 'calculateRoomArea').mockReturnValue(100);
      vi.spyOn(roomCalculation, 'calculateNetAdjustment').mockReturnValue(0);

      const stateWithSmallOffset = {
        ...mockState,
        offsetData: { ...mockState.offsetData, area: 25 },
      } as unknown as RoomSubmissionState;

      const { result } = renderHook(() =>
        useOffsetActions(stateWithSmallOffset, mockHandleEdit)
      );

      act(() => {
        result.current.handleSubtractClick();
      });

      expect(stateWithSmallOffset.setOffsetValidationError).toHaveBeenCalledWith('');
      expect(stateWithSmallOffset.setSelectedOperation).toHaveBeenCalledWith('subtract');
    });

    it('should prevent subtract when result would be negative', () => {
      vi.spyOn(roomSubmissionUtils, 'calculateRoomArea').mockReturnValue(100);
      vi.spyOn(roomCalculation, 'calculateNetAdjustment').mockReturnValue(0);

      const stateWithLargeOffset = {
        ...mockState,
        offsetData: { ...mockState.offsetData, area: 150 }, // Larger than room
      } as unknown as RoomSubmissionState;

      const { result } = renderHook(() =>
        useOffsetActions(stateWithLargeOffset, mockHandleEdit)
      );

      act(() => {
        result.current.handleSubtractClick();
      });

      expect(stateWithLargeOffset.setOffsetValidationError).toHaveBeenCalledWith('offsetValidation.negative');
      expect(stateWithLargeOffset.setIsShakingSubtract).toHaveBeenCalledWith(true);
      expect(stateWithLargeOffset.setSelectedOperation).not.toHaveBeenCalled();
    });

    it('should allow subtract when result is exactly zero', () => {
      vi.spyOn(roomSubmissionUtils, 'calculateRoomArea').mockReturnValue(100);
      vi.spyOn(roomCalculation, 'calculateNetAdjustment').mockReturnValue(0);

      const stateWithExactOffset = {
        ...mockState,
        offsetData: { ...mockState.offsetData, area: 100 }, // Exactly room size
        selectedOperation: 'subtract' as const,
      } as unknown as RoomSubmissionState;

      const { result } = renderHook(() =>
        useOffsetActions(stateWithExactOffset, mockHandleEdit)
      );

      act(() => {
        result.current.handleSubtractClick();
      });

      // Zero result is allowed (only negative is prevented)
      expect(stateWithExactOffset.setOffsetValidationError).toHaveBeenCalledWith('');
      expect(stateWithExactOffset.setSelectedOperation).toHaveBeenCalledWith('subtract');
    });
  });

  describe('handleOffsetInputChange', () => {
    it('should update offset data when field changes', () => {
      let callbackFn: ((prev: OffsetData) => OffsetData) | undefined;
      
      const setOffsetDataMock = vi.fn((fn) => {
        if (typeof fn === 'function') {
          callbackFn = fn;
        }
      });
      
      const testState = {
        ...mockState,
        setOffsetData: setOffsetDataMock,
      } as unknown as RoomSubmissionState;

      const { result } = renderHook(() =>
        useOffsetActions(testState, mockHandleEdit)
      );

      act(() => {
        result.current.handleOffsetInputChange('length', '6');
      });

      expect(setOffsetDataMock).toHaveBeenCalled();
      
      // Verify the callback updates the field correctly
      if (callbackFn) {
        const updated = callbackFn(mockState.offsetData);
        expect(updated.length).toBe('6');
      }
    });

    it('should update offset data when width changes', () => {
      let callbackFn: ((prev: OffsetData) => OffsetData) | undefined;
      
      const setOffsetDataMock = vi.fn((fn) => {
        if (typeof fn === 'function') {
          callbackFn = fn;
        }
      });

      const testState = {
        ...mockState,
        setOffsetData: setOffsetDataMock,
      } as unknown as RoomSubmissionState;

      const { result } = renderHook(() =>
        useOffsetActions(testState, mockHandleEdit)
      );

      act(() => {
        result.current.handleOffsetInputChange('width', '8');
      });

      expect(setOffsetDataMock).toHaveBeenCalled();
      
      if (callbackFn) {
        const updated = callbackFn(mockState.offsetData);
        expect(updated.width).toBe('8');
      }
    });

    it('should update offset data for Circle shape radius', () => {
      const stateWithCircle = {
        ...mockState,
        selectedShape: 'Circle',
      } as unknown as RoomSubmissionState;

      const { result } = renderHook(() =>
        useOffsetActions(stateWithCircle, mockHandleEdit)
      );

      act(() => {
        result.current.handleOffsetInputChange('radius', '5');
      });

      expect(stateWithCircle.setOffsetData).toHaveBeenCalled();
    });

    it('should update offset data for Triangle shape base', () => {
      const stateWithTriangle = {
        ...mockState,
        selectedShape: 'Triangle',
      } as unknown as RoomSubmissionState;

      const { result } = renderHook(() =>
        useOffsetActions(stateWithTriangle, mockHandleEdit)
      );

      act(() => {
        result.current.handleOffsetInputChange('base', '10');
      });

      expect(stateWithTriangle.setOffsetData).toHaveBeenCalled();
    });
  });

  describe('handleShapeChange', () => {
    it('should change shape and reset offset data', () => {
      const { result } = renderHook(() =>
        useOffsetActions(mockState, mockHandleEdit)
      );

      act(() => {
        result.current.handleShapeChange('Circle');
      });

      expect(mockState.setSelectedShape).toHaveBeenCalledWith('Circle');
      expect(mockState.setOffsetData).toHaveBeenCalled();
      expect(mockState.setOffsetValidationError).toHaveBeenCalledWith('');
    });
  });

  describe('handleAddOffset', () => {
    it('should add valid offset to list', () => {
      vi.spyOn(roomSubmissionUtils, 'isOffsetValid').mockReturnValue(true);
      vi.spyOn(roomSubmissionUtils, 'calculateRoomArea').mockReturnValue(100);
      vi.spyOn(roomCalculation, 'calculateNetAdjustment').mockReturnValue(0);

      const { result } = renderHook(() =>
        useOffsetActions(mockState, mockHandleEdit)
      );

      act(() => {
        result.current.handleAddOffset();
      });

      expect(mockState.setOffsetList).toHaveBeenCalled();
      expect(mockState.setOffsetData).toHaveBeenCalled();
    });

    it('should not add invalid offset', () => {
      vi.spyOn(roomSubmissionUtils, 'isOffsetValid').mockReturnValue(false);

      const { result } = renderHook(() =>
        useOffsetActions(mockState, mockHandleEdit)
      );

      act(() => {
        result.current.handleAddOffset();
      });

      expect(mockState.setOffsetList).not.toHaveBeenCalled();
    });

    it('should not add offset if no operation selected', () => {
      const stateWithoutOperation = {
        ...mockState,
        selectedOperation: null,
      } as unknown as RoomSubmissionState;

      vi.spyOn(roomSubmissionUtils, 'isOffsetValid').mockReturnValue(true);

      const { result } = renderHook(() =>
        useOffsetActions(stateWithoutOperation, mockHandleEdit)
      );

      act(() => {
        result.current.handleAddOffset();
      });

      expect(mockState.setOffsetList).not.toHaveBeenCalled();
    });

    it('should prevent adding offset that would make area negative', () => {
      vi.spyOn(roomSubmissionUtils, 'isOffsetValid').mockReturnValue(true);
      vi.spyOn(roomSubmissionUtils, 'calculateRoomArea').mockReturnValue(100);
      vi.spyOn(roomCalculation, 'calculateNetAdjustment').mockReturnValue(0);

      const stateWithLargeOffset = {
        ...mockState,
        offsetData: { ...mockState.offsetData, area: 150 },
        selectedOperation: 'subtract' as const,
      } as unknown as RoomSubmissionState;

      const { result } = renderHook(() =>
        useOffsetActions(stateWithLargeOffset, mockHandleEdit)
      );

      act(() => {
        result.current.handleAddOffset();
      });

      expect(stateWithLargeOffset.setOffsetValidationError).toHaveBeenCalledWith('offsetValidation.negative');
      expect(mockState.setOffsetList).not.toHaveBeenCalled();
    });
  });

  describe('handleDeleteOffset', () => {
    it('should delete offset with confirmation', async () => {
      const confirmMock = vi.fn((options) => {
        if (options.onConfirm) options.onConfirm();
      });
      
      const { useConfirm } = await import('@/components/common');
      vi.mocked(useConfirm).mockReturnValue({
        confirm: confirmMock,
      });

      const stateWithOffsets = {
        ...mockState,
        offsetList: [
          { id: 1, area: 10, operation: 'subtract' as const },
          { id: 2, area: 5, operation: 'subtract' as const },
        ] as OffsetData[],
      } as unknown as RoomSubmissionState;

      const { result } = renderHook(() =>
        useOffsetActions(stateWithOffsets, mockHandleEdit)
      );

      act(() => {
        result.current.handleDeleteOffset(0);
      });

      expect(confirmMock).toHaveBeenCalled();
      expect(confirmMock.mock.calls[0][0]).toMatchObject({
        variant: 'delete',
      });
    });

    it('should stage persisted offset for deletion', async () => {
      const confirmMock = vi.fn((options) => {
        if (options.onConfirm) options.onConfirm();
      });
      
      const { useConfirm } = await import('@/components/common');
      vi.mocked(useConfirm).mockReturnValue({
        confirm: confirmMock,
      });

      const stateWithPersistedOffset = {
        ...mockState,
        offsetList: [
          { id: 123, roomWiseMinusId: 123, area: 10, operation: 'subtract' as const },
        ] as OffsetData[],
      } as unknown as RoomSubmissionState;

      const { result } = renderHook(() =>
        useOffsetActions(stateWithPersistedOffset, mockHandleEdit)
      );

      act(() => {
        result.current.handleDeleteOffset(0);
      });

      expect(confirmMock).toHaveBeenCalled();
      expect(stateWithPersistedOffset.setPendingDeletions).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero offset area', () => {
      const stateWithZeroOffset = {
        ...mockState,
        offsetData: { ...mockState.offsetData, area: 0 },
      } as unknown as RoomSubmissionState;

      vi.spyOn(roomSubmissionUtils, 'isOffsetValid').mockReturnValue(false);

      const { result } = renderHook(() =>
        useOffsetActions(stateWithZeroOffset, mockHandleEdit)
      );

      act(() => {
        result.current.handleAddOffset();
      });

      expect(mockState.setOffsetList).not.toHaveBeenCalled();
    });

    it('should handle very large offset values', () => {
      vi.spyOn(roomSubmissionUtils, 'isOffsetValid').mockReturnValue(true);
      vi.spyOn(roomSubmissionUtils, 'calculateRoomArea').mockReturnValue(10000);
      vi.spyOn(roomCalculation, 'calculateNetAdjustment').mockReturnValue(0);

      const stateWithLargeOffset = {
        ...mockState,
        offsetData: { ...mockState.offsetData, area: 5000 },
      } as unknown as RoomSubmissionState;

      const { result } = renderHook(() =>
        useOffsetActions(stateWithLargeOffset, mockHandleEdit)
      );

      act(() => {
        result.current.handleAddOffset();
      });

      expect(mockState.setOffsetList).toHaveBeenCalled();
    });

    it('should handle decimal offset areas', () => {
      vi.spyOn(roomSubmissionUtils, 'isOffsetValid').mockReturnValue(true);
      vi.spyOn(roomSubmissionUtils, 'calculateRoomArea').mockReturnValue(100.55);
      vi.spyOn(roomCalculation, 'calculateNetAdjustment').mockReturnValue(0);

      const stateWithDecimalOffset = {
        ...mockState,
        offsetData: { ...mockState.offsetData, area: 25.75 },
      } as unknown as RoomSubmissionState;

      const { result } = renderHook(() =>
        useOffsetActions(stateWithDecimalOffset, mockHandleEdit)
      );

      act(() => {
        result.current.handleAddOffset();
      });

      expect(mockState.setOffsetList).toHaveBeenCalled();
    });
  });
});
