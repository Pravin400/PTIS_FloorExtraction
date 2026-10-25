import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useFloorDataHandlers } from '@/hooks/ptis/floorSubmission/useFloorDataHandlers';
import { toast } from 'sonner';
import type { FloorData } from '@/types/room-details.types';
import {
  createMockFloorData,
  createDefaultFloorDataHandlersParams,
} from '@/__tests__/utils/floorSubmissionTestUtils';

// Mock dependencies
vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  }),
}));

vi.mock('@/app/[locale]/property-tax/ptis/QuickDataEntry/[propertyId]/FloorSubmission/actions', () => ({
  submitFloorSubmissionNoRedirectAction: vi.fn(),
  updateFloorSubmissionNoRedirectAction: vi.fn(),
  deleteFloorSubmissionNoRedirectAction: vi.fn(),
}));

vi.mock('@/lib/utils/floorSubmission/floor-mappers', () => ({
  mapFormToPayload: vi.fn(() => ({
    floorID: 1,
    propertyID: 123,
    constructionYear: 2020,
  })),
}));

import {
  submitFloorSubmissionNoRedirectAction,
  updateFloorSubmissionNoRedirectAction,
  deleteFloorSubmissionNoRedirectAction,
} from '@/app/[locale]/property-tax/ptis/QuickDataEntry/[propertyId]/FloorSubmission/actions';

describe('useFloorDataHandlers', () => {
  // Store mocks for assertions
  let testParams: ReturnType<typeof createDefaultFloorDataHandlersParams>;

  beforeEach(() => {
    vi.clearAllMocks();
    testParams = createDefaultFloorDataHandlersParams();

    // Mock window.location.reload to prevent JSDOM errors
    Object.defineProperty(window, 'location', {
      writable: true,
      value: {
        ...window.location,
        reload: vi.fn(),
      },
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  const getDefaultParams = (overrides = {}) => ({
    ...testParams,
    ...overrides,
  });

  describe('handleSave', () => {
    it('should save a new floor successfully', async () => {
      vi.mocked(submitFloorSubmissionNoRedirectAction).mockResolvedValue({
        success: true,
        data: { id: 100 },
      });

      const { result } = renderHook(() => useFloorDataHandlers(getDefaultParams({
        isAddingNewFloor: true,
      })));

      await act(async () => {
        result.current.handleSave();
      });

      await waitFor(() => {
        expect(testParams.confirm).toHaveBeenCalledWith(
          expect.objectContaining({
            variant: 'add',
            title: 'floor.addConfirmTitle',
          })
        );
      });

      await waitFor(() => {
        expect(submitFloorSubmissionNoRedirectAction).toHaveBeenCalled();
        expect(toast.success).toHaveBeenCalledWith('floor.floorAddSuccess');
        expect(testParams.setIsAddingNewFloor).toHaveBeenCalledWith(true);
        expect(testParams.setSelectedFloor).toHaveBeenCalledWith(null);
      });
    });

    it('should update an existing floor successfully', async () => {
      vi.mocked(updateFloorSubmissionNoRedirectAction).mockResolvedValue({
        success: true,
        data: { id: 1 },
      });

      const selectedFloor = createMockFloorData({ id: 1 });

      const { result } = renderHook(() => useFloorDataHandlers(getDefaultParams({
        isAddingNewFloor: false,
        selectedFloor,
      })));

      await act(async () => {
        result.current.handleSave();
      });

      await waitFor(() => {
        expect(testParams.confirm).toHaveBeenCalledWith(
          expect.objectContaining({
            variant: 'update',
            title: 'floor.updateConfirmTitle',
          })
        );
      });

      await waitFor(() => {
        expect(updateFloorSubmissionNoRedirectAction).toHaveBeenCalled();
        expect(toast.success).toHaveBeenCalledWith('floor.floorUpdateSuccess');
      });
    });

    it('should not attach sequence error to new candidate floor if error belongs to existing floor in table', async () => {
      vi.mocked(submitFloorSubmissionNoRedirectAction).mockResolvedValue({
        success: true,
        data: { id: 200 },
      });

      // Existing table has ground floor (2020) and 1st floor (2019) -> 1st floor has pre-existing error
      const localFloors: FloorData[] = [
        createMockFloorData({ id: 1, floor: '0', floorDescription: 'तळमजला', conYr: '2020' }),
        createMockFloorData({ id: 2, floor: '1', floorDescription: 'पहिला मजला', conYr: '2019' }),
      ];

      // Adding 2nd floor with 2022 -> valid relative to lower floors
      const editingFloorForm = createMockFloorData({
        id: 3,
        floor: '2',
        floorDescription: 'दुसरा मजला',
        conYr: '2022',
      });

      const setFormErrorsMock = vi.fn();

      const { result } = renderHook(() =>
        useFloorDataHandlers(
          getDefaultParams({
            isAddingNewFloor: true,
            localFloors,
            editingFloorForm,
            setFormErrors: setFormErrorsMock,
          })
        )
      );

      await act(async () => {
        result.current.handleSave();
      });

      // Verification: setFormErrors should NOT have received conYr error from 1st floor
      expect(setFormErrorsMock).not.toHaveBeenCalledWith(
        expect.objectContaining({
          conYr: expect.stringContaining('पहिला मजला'),
        })
      );
    });

    it('should trigger sequence warning when updating lower floor to a year greater than upper floor', async () => {
      const localFloors: FloorData[] = [
        createMockFloorData({ id: 1, floor: '0', floorDescription: 'तळमजला', conYr: '2020' }),
        createMockFloorData({ id: 2, floor: '1', floorDescription: 'पहिला मजला', conYr: '2021' }),
        createMockFloorData({ id: 3, floor: '2', floorDescription: 'दुसरा मजला', conYr: '2020' }),
      ];

      // Updating 1st floor to 2024 (which is greater than 2nd floor's 2020)
      const selectedFloor = localFloors[1];
      const editingFloorForm: FloorData = {
        ...selectedFloor,
        conYr: '2024',
        constructionYear: '2024',
      };

      const setFormErrorsMock = vi.fn();

      const { result } = renderHook(() =>
        useFloorDataHandlers(
          getDefaultParams({
            isAddingNewFloor: false,
            selectedFloor,
            editingFloorForm,
            localFloors,
            setFormErrors: setFormErrorsMock,
          })
        )
      );

      await act(async () => {
        result.current.handleSave();
      });

      // Verification: confirm modal should be called with warning variant and sequence warning title
      expect(testParams.confirm).toHaveBeenCalledWith(
        expect.objectContaining({
          variant: 'warning',
          title: expect.stringMatching(/Floor Sequence Warning|floor\.sequenceWarningTitle/),
        })
      );

      // setFormErrors should be called to set error state
      expect(setFormErrorsMock).toHaveBeenCalled();
    });

    it('should handle API errors during save', async () => {
      vi.mocked(submitFloorSubmissionNoRedirectAction).mockResolvedValue({
        success: false,
        error: 'Database error',
      });

      const localFloors = [createMockFloorData()];

      const { result } = renderHook(() => useFloorDataHandlers(getDefaultParams({
        isAddingNewFloor: true,
        localFloors,
      })));

      await act(async () => {
        result.current.handleSave();
      });

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled();
        expect(testParams.setLocalFloors).toHaveBeenCalledWith(localFloors);
      });
    });

    it('should prevent double-click race condition', async () => {
      vi.useFakeTimers();

      vi.mocked(submitFloorSubmissionNoRedirectAction).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ success: true, data: {} }), 100))
      );

      const { result } = renderHook(() => useFloorDataHandlers(getDefaultParams({
        isAddingNewFloor: true,
      })));

      act(() => {
        result.current.handleSave();
      });

      act(() => {
        result.current.handleSave();
      });

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      expect(submitFloorSubmissionNoRedirectAction).toHaveBeenCalledTimes(1);

      vi.useRealTimers();
    });
  });

  describe('handleDeleteFloor', () => {
    it('should delete a floor successfully', async () => {
      vi.mocked(deleteFloorSubmissionNoRedirectAction).mockResolvedValue({
        success: true,
      });

      const floorToDelete = createMockFloorData({ id: 1 });
      const localFloors = [floorToDelete, createMockFloorData({ id: 2 })];

      const { result } = renderHook(() => useFloorDataHandlers(getDefaultParams({
        localFloors,
      })));

      await act(async () => {
        result.current.handleDeleteFloor(floorToDelete);
      });

      await waitFor(() => {
        expect(testParams.confirm).toHaveBeenCalledWith(
          expect.objectContaining({
            variant: 'delete',
            title: 'floor.deleteConfirmTitle',
          })
        );
      });

      await waitFor(() => {
        expect(deleteFloorSubmissionNoRedirectAction).toHaveBeenCalledWith(expect.anything(), 'en', '123');
        expect(toast.success).toHaveBeenCalledWith('floor.floorDeletedSuccess');
      });
    });

    it('should handle floor deletion failure', async () => {
      vi.mocked(deleteFloorSubmissionNoRedirectAction).mockResolvedValue({
        success: false,
        error: 'Cannot delete last floor',
      });

      const floorToDelete = createMockFloorData({ id: 1 });
      const localFloors = [floorToDelete];

      const { result } = renderHook(() => useFloorDataHandlers(getDefaultParams({
        localFloors,
      })));

      await act(async () => {
        result.current.handleDeleteFloor(floorToDelete);
      });

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled();
        expect(testParams.setLocalFloors).toHaveBeenCalledWith(localFloors);
      });
    });
  });

  describe('handleOpenRenterManagement', () => {
    it('should show toast error when no floor is selected during add mode', async () => {
      const { result } = renderHook(() => useFloorDataHandlers(getDefaultParams({
        selectedFloor: null,
        isAddingNewFloor: true,
        editingFloorForm: { ...createMockFloorData(), floor: '' },
      })));

      await act(async () => {
        result.current.handleOpenRenterManagement();
      });

      expect(toast.error).toHaveBeenCalledWith('floor.selectFloorFirst');
    });

    it('should navigate to renter management screen when floor is selected', async () => {
      const selectedFloor = createMockFloorData({ id: 1, floor: '1' });

      const { result } = renderHook(() => useFloorDataHandlers(getDefaultParams({
        selectedFloor,
        isAddingNewFloor: false,
        editingFloorForm: selectedFloor,
      })));

      await act(async () => {
        result.current.handleOpenRenterManagement();
      });

      expect(testParams.router.push).toHaveBeenCalledWith(
        expect.stringContaining('/property-tax/ptis/QuickDataEntry/123/FloorSubmission/Renter?floorId=1')
      );
    });
  });

  describe('isSaving state', () => {
    it('should track saving state correctly', async () => {
      vi.useFakeTimers();

      vi.mocked(submitFloorSubmissionNoRedirectAction).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ success: true, data: {} }), 50))
      );

      const { result } = renderHook(() => useFloorDataHandlers(getDefaultParams({
        isAddingNewFloor: true,
      })));

      expect(result.current.isSaving).toBe(false);

      act(() => {
        result.current.handleSave();
      });

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      expect(result.current.isSaving).toBe(false);
      expect(testParams.setIsAddingNewFloor).toHaveBeenCalledWith(true);

      vi.useRealTimers();
    });
  });

  describe('edge cases', () => {
    it('should handle undefined floor ID gracefully', async () => {
      const floorWithoutId: FloorData = createMockFloorData({ id: undefined });

      const { result } = renderHook(() => useFloorDataHandlers(getDefaultParams({
        localFloors: [floorWithoutId],
      })));

      await act(async () => {
        result.current.handleDeleteFloor(floorWithoutId);
      });

      expect(testParams.confirm).toHaveBeenCalled();
    });

    it('should handle network errors gracefully', async () => {
      vi.mocked(submitFloorSubmissionNoRedirectAction).mockRejectedValue(
        new Error('Network error')
      );

      const { result } = renderHook(() => useFloorDataHandlers(getDefaultParams({
        isAddingNewFloor: true,
      })));

      await act(async () => {
        result.current.handleSave();
      });

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled();
      });
    });

    it('should handle API timeout errors', async () => {
      vi.mocked(updateFloorSubmissionNoRedirectAction).mockRejectedValue(
        new Error('Request timeout')
      );

      const selectedFloor = createMockFloorData({ id: 1 });

      const { result } = renderHook(() => useFloorDataHandlers(getDefaultParams({
        isAddingNewFloor: false,
        selectedFloor,
      })));

      await act(async () => {
        result.current.handleSave();
      });

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled();
      });
    });
  });
});
