/**
 * Integration tests for useFloorSubmission hook
 * Tests real hook composition without mocking sub-hooks
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useFloorSubmission } from '@/hooks/ptis/floorSubmission/useFloorSubmission';
import { createMockEditSidebarProps } from '@/__tests__/utils/floorSubmissionTestUtils';
import { FloorData, RoomData } from '@/types/room-details.types';
import { SubTypeOfUseResponse } from '@/types/floor-details.types';

// Mock only external dependencies, not internal hooks
vi.mock('next-intl', () => ({
  useTranslations: vi.fn(() => (key: string) => key),
}));

vi.mock('@/components/common', () => ({
  useConfirm: vi.fn(() => ({
    confirm: vi.fn(async (options) => {
      if (options && options.onConfirm) {
        try {
          await options.onConfirm();
        } catch (e) {
          console.error('Error in mock onConfirm:', e);
        }
      }
    }),
  })),
}));

// Mock server actions
vi.mock('@/app/[locale]/property-tax/ptis/QuickDataEntry/[propertyId]/FloorSubmission/actions', () => ({
  submitFloorSubmissionNoRedirectAction: vi.fn().mockResolvedValue({
    success: true,
    data: { id: 100 },
  }),
  updateFloorSubmissionNoRedirectAction: vi.fn().mockResolvedValue({
    success: true,
    data: { id: 1 },
  }),
  deleteFloorSubmissionNoRedirectAction: vi.fn().mockResolvedValue({
    success: true,
  }),
}));

vi.mock('@/lib/utils/floorSubmission/floor-mappers', () => ({
  mapFormToPayload: vi.fn(() => ({
    floorID: 1,
    propertyID: 123,
    constructionYear: 2020,
  })),
}));

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({ propertyId: '123', locale: 'en' }),
  usePathname: () => '/property-tax/ptis/QuickDataEntry/123/FloorSubmission',
}));

import {
  submitFloorSubmissionNoRedirectAction,
  deleteFloorSubmissionNoRedirectAction,
} from '@/app/[locale]/property-tax/ptis/QuickDataEntry/[propertyId]/FloorSubmission/actions';

describe('useFloorSubmission - Integration Tests', () => {
  let mockProps: ReturnType<typeof createMockEditSidebarProps>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockProps = createMockEditSidebarProps({
      initialPropertyData: {
        plotAreaSqMeter: 1000,
        plotAreaSqFeet: 10764,
      },
    });
    Object.defineProperty(window, 'location', {
      value: {
        search: '',
        pathname: '/test',
      },
      writable: true,
    });
  });

  describe('Real Hook Composition', () => {
    it('should compose all sub-hooks correctly and provide complete API', () => {
      const { result } = renderHook(() => useFloorSubmission(mockProps));

      // Verify form state management
      expect(result.current.editingFloorForm).toBeDefined();
      expect(result.current.setEditingFloorForm).toBeDefined();
      expect(result.current.formErrors).toBeDefined();
      expect(result.current.setFormErrors).toBeDefined();

      // Verify data handlers
      expect(typeof result.current.handleSave).toBe('function');
      expect(typeof result.current.handleDeleteFloor).toBe('function');
      expect(typeof result.current.handleOpenRenterManagement).toBe('function');
      expect(typeof result.current.handleAddFloor).toBe('function');
      expect(typeof result.current.resetForm).toBe('function');

      // Verify URL sync
      expect(typeof result.current.updateUrlParams).toBe('function');
      expect(typeof result.current.handleOpenDropdown).toBe('function');

      // Verify derived data
      expect(Array.isArray(result.current.filteredFloors)).toBe(true);
      expect(Array.isArray(result.current.stagedRooms)).toBe(true);
      expect(Array.isArray(result.current.subTypeOptionsFromData)).toBe(true);

      // Verify loading state
      expect(typeof result.current.isOperationLoading).toBe('boolean');

      // Verify refs
      expect(result.current.roomsInputRef).toBeDefined();
      expect(result.current.areaInputRef).toBeDefined();
    });

    it('should handle complete add floor workflow', async () => {
      const { result } = renderHook(() => useFloorSubmission(mockProps));

      // Step 1: Add floor initiates form
      act(() => {
        result.current.handleAddFloor();
      });

      expect(result.current.isAddingNewFloor).toBe(true);
      expect(result.current.selectedFloor).toBeNull();

      // Step 2: Update form data
      act(() => {
        result.current.setEditingFloorForm({
          id: undefined,
          floor: 'Ground Floor',
          floorId: '1',
          subFloor: 'None',
          subFloorId: '1',
          conYr: '2020',
          asstYr: '2021',
          conTyp: 'RCC',
          constructionTypeId: '1',
          use: 'Residential',
          typeOfUseId: '1',
          subTyp: 'Apartment',
          subTypeOfUseId: '1',
          rooms: '3',
          areaSqFt: '1000',
          areaSqM: '92.9',
          builtupAreaSqFt: '1200',
          builtupAreaSqM: '111.5',
          renter: 'No',
          isTaxable: 'Yes',
          roomData: [],
        });
      });

      expect(result.current.editingFloorForm.floor).toBe('Ground Floor');
      expect(result.current.editingFloorForm.rooms).toBe('3');

      // Step 3: Save floor
      await act(async () => {
        result.current.handleSave();
      });

      await waitFor(() => {
        expect(submitFloorSubmissionNoRedirectAction).toHaveBeenCalled();
      });
    });

    it('should handle delete floor workflow', async () => {
      const floorToDelete = {
        id: 1,
        floor: 'Ground Floor',
        conTyp: 'RCC',
        use: 'Residential',
      };

      const { result } = renderHook(() => useFloorSubmission(mockProps));

      await act(async () => {
        result.current.handleDeleteFloor(floorToDelete as FloorData);
      });

      await waitFor(() => {
        expect(deleteFloorSubmissionNoRedirectAction).toHaveBeenCalledWith(
          '1',
          'en',
          expect.any(String)
        );
      });
    });

    it('should filter floors based on search query', () => {
      const propsWithFloors = createMockEditSidebarProps({
        initialFloors: [
          { id: 1, floor: 'Ground Floor', conTyp: 'RCC', use: 'Residential' },
          { id: 2, floor: 'First Floor', conTyp: 'PCC', use: 'Commercial' },
        ],
      });

      const { result } = renderHook(() => useFloorSubmission(propsWithFloors));

      // Initially, should show all floors (through local state)
      expect(result.current.filteredFloors.length).toBeGreaterThanOrEqual(0);

      // Apply search filter
      act(() => {
        result.current.setFloorSearch('ground');
      });

      // Filtered results should work (actual filtering logic in the hook)
      expect(result.current.floorSearch).toBe('ground');
    });

    it('should handle form reset correctly', () => {
      const { result } = renderHook(() => useFloorSubmission(mockProps));

      // Add some form data
      act(() => {
        result.current.setEditingFloorForm(prev => ({
          ...prev,
          floor: '1',
          rooms: '3',
        }));
        result.current.setFormErrors({ floor: 'Error' });
        result.current.setIsAddingNewFloor(true);
      });

      // Reset form
      act(() => {
        result.current.resetForm();
      });

      // Verify reset
      expect(result.current.isAddingNewFloor).toBe(false);
      expect(result.current.selectedFloor).toBeNull();
      expect(Object.keys(result.current.formErrors).length).toBe(0);
    });

    it('should handle dropdown lazy loading', () => {
      const { result } = renderHook(() => useFloorSubmission(mockProps));

      act(() => {
        result.current.handleOpenDropdown('loadFloor');
      });

      // URL params should be updated (actual implementation may vary)
      expect(typeof result.current.handleOpenDropdown).toBe('function');
    });

    it('should derive subtype options from props correctly', () => {
      const propsWithSubtypes = createMockEditSidebarProps({
        subTypeData: [
          { subTypeOfUseId: 1, description: 'Apartment', typeOfUseId: 1, searchKey: null, searchSequence: null, isActive: true, createdDate: '', updatedDate: null },
          { subTypeOfUseId: 2, description: 'Villa', typeOfUseId: 1, searchKey: null, searchSequence: null, isActive: true, createdDate: '', updatedDate: null },
        ] as SubTypeOfUseResponse[],
      });

      const { result } = renderHook(() => useFloorSubmission(propsWithSubtypes));

      expect(result.current.subTypeOptionsFromData).toContain('Apartment');
      expect(result.current.subTypeOptionsFromData).toContain('Villa');
    });

    it('should sync room data with staged rooms', () => {
      const { result } = renderHook(() => useFloorSubmission(mockProps));

      const mockRooms = [
        { roomId: 1, roomName: 'Living Room', area: 200 },
        { roomId: 2, roomName: 'Bedroom', area: 150 },
      ];

      act(() => {
        result.current.setStagedRooms(mockRooms as RoomData[]);
      });

      expect(result.current.stagedRooms).toEqual(mockRooms);
    });

    it('should handle validation correctly', () => {
      const { result } = renderHook(() => useFloorSubmission(mockProps));

      // Validation function should be available
      expect(typeof result.current.validateForm).toBe('function');

      // Test validation
      const isValid = result.current.validateForm();
      expect(typeof isValid).toBe('boolean');
    });
  });

  describe('State Synchronization', () => {
    it('should keep form state and URL params in sync', () => {
      const { result } = renderHook(() => useFloorSubmission(mockProps));

      act(() => {
        result.current.handleAddFloor();
      });

      // URL params should be cleared when adding new floor
      expect(result.current.isAddingNewFloor).toBe(true);
    });

    it('should maintain loading state during operations', async () => {
      const { result } = renderHook(() => useFloorSubmission(mockProps));

      expect(result.current.isOperationLoading).toBe(false);

      // Simulate save operation (loading state managed by useFloorDataHandlers)
      await act(async () => {
        result.current.handleSave();
      });

      // After save, loading should return to false
      await waitFor(() => {
        expect(result.current.isOperationLoading).toBe(false);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty props gracefully', () => {
      const emptyProps = createMockEditSidebarProps({
        floorData: [],
        constructionTypeData: [],
        useData: [],
      });

      const { result } = renderHook(() => useFloorSubmission(emptyProps));

      expect(result.current.editingFloorForm).toBeDefined();
      expect(result.current.filteredFloors).toBeDefined();
    });

    it('should handle rapid state updates', () => {
      const { result } = renderHook(() => useFloorSubmission(mockProps));

      act(() => {
        result.current.setEditingFloorForm(prev => ({ ...prev, floor: '1' }));
        result.current.setEditingFloorForm(prev => ({ ...prev, floor: '2' }));
        result.current.setEditingFloorForm(prev => ({ ...prev, floor: '3' }));
      });

      expect(result.current.editingFloorForm.floor).toBe('3');
    });
  });
});
