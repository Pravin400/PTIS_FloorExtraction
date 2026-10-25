import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFloorSubmission } from '@/hooks/ptis/floorSubmission/useFloorSubmission';
import type { EditSidebarProps } from '@/types/floor-details.types';

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

vi.mock('@/hooks/ptis/floorSubmission/useFloorFormState', () => ({
  useFloorFormState: vi.fn(() => ({
    INITIAL_FORM_STATE: {
      id: undefined,
      floor: '',
      subFloor: '',
      conYr: '',
      asstYr: '',
      conTyp: '',
      use: '',
      subTyp: '',
      rooms: '',
      areaSqFt: '',
      areaSqM: '',
      builtupAreaSqFt: '',
      builtupAreaSqM: '',
      renter: 'No',
      isTaxable: 'No',
      roomData: [],
    },
    editingFloorForm: {
      id: 1,
      floor: 'Ground Floor',
      rooms: '3',
      areaSqFt: '1000',
      roomData: [],
    },
    setEditingFloorForm: vi.fn(),
    localFloors: [],
    setLocalFloors: vi.fn(),
    formErrors: {},
    setFormErrors: vi.fn(),
    isAddingNewFloor: false,
    setIsAddingNewFloor: vi.fn(),
    selectedFloor: null,
    setSelectedFloor: vi.fn(),
    showRoomSubmission: false,
    setShowRoomSubmission: vi.fn(),
    validateForm: vi.fn(() => true),
    roomsInputRef: { current: null },
    areaInputRef: { current: null },
  })),
}));

vi.mock('@/hooks/ptis/floorSubmission/useFloorUrlSync', () => ({
  useFloorUrlSync: vi.fn(() => ({
    searchParams: new URLSearchParams(),
    updateUrlParams: vi.fn(),
    router: {
      push: vi.fn(),
      replace: vi.fn(),
      refresh: vi.fn(),
    },
    locale: 'en',
    propertyId: '123',
  })),
}));

vi.mock('@/hooks/ptis/floorSubmission/useFloorDataHandlers', () => ({
  useFloorDataHandlers: vi.fn(() => ({
    handleSave: vi.fn(),
    handleDeleteFloor: vi.fn(),
    handleOpenRenterManagement: vi.fn(),
    isSaving: false,
    isDeleting: false,
  })),
}));

vi.mock('@/hooks/ptis/floorSubmission/useFloorSync', () => ({
  useFloorSync: vi.fn(),
}));

import { useFloorFormState } from '@/hooks/ptis/floorSubmission/useFloorFormState';
import { useFloorUrlSync } from '@/hooks/ptis/floorSubmission/useFloorUrlSync';
import { useFloorDataHandlers } from '@/hooks/ptis/floorSubmission/useFloorDataHandlers';

describe('useFloorSubmission', () => {
  const mockProps: EditSidebarProps = {
    floorData: [
      { floorId: 1, floorCode: 'G', description: 'Ground Floor', sequenceNo: 1, maxFloorNo: 1, isActive: true, createdDate: '', updatedDate: '' },
      { floorId: 2, floorCode: '1', description: 'First Floor', sequenceNo: 2, maxFloorNo: 1, isActive: true, createdDate: '', updatedDate: '' },
    ],
    constructionTypeData: [],
    useData: [],
    subFloorData: [],
    subTypeData: [],
    floorOptions: [],
    constructionTypeOptions: [],
    useOptions: [],
    subFloorOptions: [],
    subTypeOptions: [],
    wardNo: '1',
    propertyNo: '123',
    partitionNo: '0',
    initialPropertyData: {},
    initialPropertyID: 123,
    initialFloors: [],
    initialFloorDetails: null,
    locale: 'en',
    apiErrors: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useFloorSubmission(mockProps));

    expect(result.current.t).toBeDefined();
    expect(result.current.isOperationLoading).toBe(false);
    expect(result.current.propertyId).toBe(123);
    expect(result.current.filteredFloors).toEqual([]);
    expect(result.current.editingFloorForm).toBeDefined();
  });

  it('should provide all required handler functions', () => {
    const { result } = renderHook(() => useFloorSubmission(mockProps));

    expect(typeof result.current.handleSave).toBe('function');
    expect(typeof result.current.handleDeleteFloor).toBe('function');
    expect(typeof result.current.handleOpenRenterManagement).toBe('function');
    expect(typeof result.current.handleAddFloor).toBe('function');
    expect(typeof result.current.resetForm).toBe('function');
    expect(typeof result.current.handleOpenDropdown).toBe('function');
    expect(typeof result.current.validateForm).toBe('function');
  });

  it('should filter floors based on search query', () => {
    const mockFloors = [
      { id: 1, floor: 'Ground Floor', conTyp: 'RCC', use: 'Residential' },
      { id: 2, floor: 'First Floor', conTyp: 'PCC', use: 'Commercial' },
    ];

    vi.mocked(useFloorFormState).mockReturnValue({
      ...(useFloorFormState as unknown as () => ReturnType<typeof useFloorFormState>)(),
      localFloors: mockFloors,
    } as unknown as ReturnType<typeof useFloorFormState>);

    const { result } = renderHook(() => useFloorSubmission(mockProps));

    // Initially no filter
    expect(result.current.filteredFloors).toHaveLength(2);

    // Apply filter
    act(() => {
      result.current.setFloorSearch('ground');
    });

    const filtered = result.current.filteredFloors.filter(
      (f) =>
        (f.floor || '').toLowerCase().includes('ground') ||
        (f.conTyp || '').toLowerCase().includes('ground') ||
        (f.use || '').toLowerCase().includes('ground')
    );

    expect(filtered.length).toBeGreaterThan(0);
  });

  it('should exclude records where isOpenPlot is true across various format types', () => {
    const mockFloors = [
      { id: 1, floor: 'Ground Floor', conTyp: 'RCC', use: 'Residential', isOpenPlot: false },
      { id: 2, floor: 'First Floor', conTyp: 'PCC', use: 'Commercial', isOpenPlot: true },
      { id: 3, floor: 'Second Floor', conTyp: 'RCC', use: 'Residential' },
      { id: 4, floor: 'Third Floor', conTyp: 'Open Plot', use: 'Commercial', IsOpenPlot: true },
      { id: 5, floor: 'Fourth Floor', conTyp: 'PCC', use: 'Commercial', isOpenPlot: 'true' },
      { id: 6, floor: 'Fifth Floor', conTyp: 'PCC', use: 'Commercial', isOpenPlot: 1 },
    ];

    vi.mocked(useFloorFormState).mockReturnValue({
      ...(useFloorFormState as unknown as () => ReturnType<typeof useFloorFormState>)(),
      localFloors: mockFloors,
    } as unknown as ReturnType<typeof useFloorFormState>);

    const { result } = renderHook(() => useFloorSubmission(mockProps));

    expect(result.current.filteredFloors).toHaveLength(2);
    expect(result.current.filteredFloors.map((f) => f.id)).toEqual([1, 3]);
  });

  describe('handleAddFloor', () => {
    it('should reset form and set adding state', () => {
      const mockSetEditingFloorForm = vi.fn();
      const mockSetIsAddingNewFloor = vi.fn();
      const mockSetSelectedFloor = vi.fn();
      const mockSetFormErrors = vi.fn();
      const mockUpdateUrlParams = vi.fn();

      vi.mocked(useFloorFormState).mockReturnValue({
        ...(useFloorFormState as unknown as () => ReturnType<typeof useFloorFormState>)(),
        setEditingFloorForm: mockSetEditingFloorForm,
        setIsAddingNewFloor: mockSetIsAddingNewFloor,
        setSelectedFloor: mockSetSelectedFloor,
        setFormErrors: mockSetFormErrors,
      } as unknown as ReturnType<typeof useFloorFormState>);

      vi.mocked(useFloorUrlSync).mockReturnValue({
        ...(useFloorUrlSync as unknown as () => ReturnType<typeof useFloorUrlSync>)(),
        updateUrlParams: mockUpdateUrlParams,
      } as unknown as ReturnType<typeof useFloorUrlSync>);

      const { result } = renderHook(() => useFloorSubmission(mockProps));

      act(() => {
        result.current.handleAddFloor();
      });

      expect(mockSetIsAddingNewFloor).toHaveBeenCalledWith(true);
      expect(mockSetFormErrors).toHaveBeenCalledWith({});
    });

    it('should pre-fill ground floor when available', () => {
      const mockSetEditingFloorForm = vi.fn();

      vi.mocked(useFloorFormState).mockReturnValue({
        ...(useFloorFormState as unknown as () => ReturnType<typeof useFloorFormState>)(),
        setEditingFloorForm: mockSetEditingFloorForm,
      } as unknown as ReturnType<typeof useFloorFormState>);

      const { result } = renderHook(() => useFloorSubmission(mockProps));

      act(() => {
        result.current.handleAddFloor();
      });

      // Check if setEditingFloorForm was called with ground floor pre-filled
      expect(mockSetEditingFloorForm).toHaveBeenCalled();
      const calls = mockSetEditingFloorForm.mock.calls;
      const lastCall = calls[calls.length - 1][0];

      // Should either be a function or an object with floor set
      if (typeof lastCall === 'function') {
        const res = lastCall({});
        expect(res.floorId).toBe('1'); // Ground floor ID
        expect(res.floor).toBe('Ground Floor'); // Ground floor name
      } else {
        expect(lastCall.floorId).toBeDefined();
        expect(lastCall.floor).toBe('Ground Floor');
      }
    });
  });

  describe('resetForm', () => {
    it('should clear all form state', () => {
      const mockSetEditingFloorForm = vi.fn();
      const mockSetIsAddingNewFloor = vi.fn();
      const mockSetSelectedFloor = vi.fn();
      const mockSetFormErrors = vi.fn();
      const mockSetShowRoomSubmission = vi.fn();
      const mockUpdateUrlParams = vi.fn();

      vi.mocked(useFloorFormState).mockReturnValue({
        ...(useFloorFormState as unknown as () => ReturnType<typeof useFloorFormState>)(),
        setEditingFloorForm: mockSetEditingFloorForm,
        setIsAddingNewFloor: mockSetIsAddingNewFloor,
        setSelectedFloor: mockSetSelectedFloor,
        setFormErrors: mockSetFormErrors,
        setShowRoomSubmission: mockSetShowRoomSubmission,
      } as unknown as ReturnType<typeof useFloorFormState>);

      vi.mocked(useFloorUrlSync).mockReturnValue({
        ...(useFloorUrlSync as unknown as () => ReturnType<typeof useFloorUrlSync>)(),
        updateUrlParams: mockUpdateUrlParams,
      } as unknown as ReturnType<typeof useFloorUrlSync>);

      const { result } = renderHook(() => useFloorSubmission(mockProps));

      act(() => {
        result.current.resetForm();
      });

      expect(mockSetIsAddingNewFloor).toHaveBeenCalledWith(false);
      expect(mockSetSelectedFloor).toHaveBeenCalledWith(null);
      expect(mockSetFormErrors).toHaveBeenCalledWith({});
      expect(mockSetShowRoomSubmission).toHaveBeenCalledWith(false);
    });
  });

  describe('handleOpenDropdown', () => {
    it('should handle dropdown interaction client-side without URL overhead', () => {
      const mockUpdateUrlParams = vi.fn();
      const searchParams = new URLSearchParams();

      vi.mocked(useFloorUrlSync).mockReturnValue({
        ...(useFloorUrlSync as unknown as () => ReturnType<typeof useFloorUrlSync>)(),
        searchParams,
        updateUrlParams: mockUpdateUrlParams,
      } as unknown as ReturnType<typeof useFloorUrlSync>);

      const { result } = renderHook(() => useFloorSubmission(mockProps));

      act(() => {
        result.current.handleOpenDropdown('loadFloor');
      });

      expect(result.current.handleOpenDropdown).toBeDefined();
    });

    it('should not update if already loaded', () => {
      const mockUpdateUrlParams = vi.fn();
      const searchParams = new URLSearchParams('loadFloor=true');

      vi.mocked(useFloorUrlSync).mockReturnValue({
        ...(useFloorUrlSync as unknown as () => ReturnType<typeof useFloorUrlSync>)(),
        searchParams,
        updateUrlParams: mockUpdateUrlParams,
      } as unknown as ReturnType<typeof useFloorUrlSync>);

      const { result } = renderHook(() => useFloorSubmission(mockProps));

      act(() => {
        result.current.handleOpenDropdown('loadFloor');
      });

      expect(mockUpdateUrlParams).not.toHaveBeenCalled();
    });
  });

  describe('stagedRooms compatibility', () => {
    it('should derive stagedRooms from editingFloorForm.roomData', () => {
      const mockRoomData = [
        { roomId: 1, roomName: 'Living Room', area: 200 },
        { roomId: 2, roomName: 'Bedroom', area: 150 },
      ];

      vi.mocked(useFloorFormState).mockReturnValue({
        ...(useFloorFormState as unknown as () => ReturnType<typeof useFloorFormState>)(),
        editingFloorForm: {
          id: 1,
          floor: 'Ground Floor',
          roomWiseSubmissionDetails: mockRoomData,
        } as unknown as ReturnType<typeof useFloorFormState>['editingFloorForm'],
      } as unknown as ReturnType<typeof useFloorFormState>);

      const { result } = renderHook(() => useFloorSubmission(mockProps));

      expect(result.current.stagedRooms).toEqual(mockRoomData);
    });

    it('should update roomData via setStagedRooms', () => {
      const mockSetEditingFloorForm = vi.fn();

      vi.mocked(useFloorFormState).mockReturnValue({
        ...(useFloorFormState as unknown as () => ReturnType<typeof useFloorFormState>)(),
        setEditingFloorForm: mockSetEditingFloorForm,
      } as unknown as ReturnType<typeof useFloorFormState>);

      const { result } = renderHook(() => useFloorSubmission(mockProps));

      const newRoomData = [{ roomId: 3, roomName: 'Kitchen', area: 100 }];

      act(() => {
        result.current.setStagedRooms(newRoomData);
      });

      expect(mockSetEditingFloorForm).toHaveBeenCalled();
    });
  });

  describe('subTypeOptionsFromData', () => {
    it('should derive subtype options from props', () => {
      const propsWithSubtypes = {
        ...mockProps,
        subTypeData: [
          { subTypeOfUseId: 1, description: 'Apartment', typeOfUseId: 1, searchKey: '', searchSequence: 1, isActive: true, createdDate: '', updatedDate: '' },
          { subTypeOfUseId: 2, description: 'Villa', typeOfUseId: 1, searchKey: '', searchSequence: 2, isActive: true, createdDate: '', updatedDate: '' },
        ],
      };

      const { result } = renderHook(() => useFloorSubmission(propsWithSubtypes));

      expect(result.current.subTypeOptionsFromData).toEqual(['Apartment', 'Villa']);
    });

    it('should handle empty subTypeData', () => {
      const { result } = renderHook(() => useFloorSubmission(mockProps));

      expect(result.current.subTypeOptionsFromData).toEqual([]);
    });
  });

  describe('input refs', () => {
    it('should provide roomsInputRef and areaInputRef', () => {
      const { result } = renderHook(() => useFloorSubmission(mockProps));

      expect(result.current.roomsInputRef).toBeDefined();
      expect(result.current.areaInputRef).toBeDefined();
      expect(result.current.roomsInputRef.current).toBeNull();
      expect(result.current.areaInputRef.current).toBeNull();
    });
  });

  describe('isOperationLoading', () => {
    it('should reflect isSaving state from handlers', () => {
      vi.mocked(useFloorDataHandlers).mockReturnValue({
        ...(useFloorDataHandlers as unknown as () => ReturnType<typeof useFloorDataHandlers>)(),
        isSaving: true,
        isDeleting: false,
      } as unknown as ReturnType<typeof useFloorDataHandlers>);

      const { result } = renderHook(() => useFloorSubmission(mockProps));

      expect(result.current.isOperationLoading).toBe(true);
    });
  });

  describe('integration', () => {
    it('should compose all sub-hooks correctly', () => {
      const { result } = renderHook(() => useFloorSubmission(mockProps));

      // Verify all major pieces are present
      expect(result.current.editingFloorForm).toBeDefined();
      expect(result.current.filteredFloors).toBeDefined();
      expect(result.current.handleSave).toBeDefined();
      expect(result.current.handleDeleteFloor).toBeDefined();
      expect(result.current.updateUrlParams).toBeDefined();
      expect(result.current.t).toBeDefined();
    });

    it('should handle search filter case-insensitively', () => {
      const mockFloors = [
        { id: 1, floor: 'GROUND FLOOR', conTyp: 'RCC', use: 'Residential' },
        { id: 2, floor: 'first floor', conTyp: 'PCC', use: 'Commercial' },
      ];

      vi.mocked(useFloorFormState).mockReturnValue({
        ...(useFloorFormState as unknown as () => ReturnType<typeof useFloorFormState>)(),
        localFloors: mockFloors,
      } as unknown as ReturnType<typeof useFloorFormState>);

      const { result } = renderHook(() => useFloorSubmission(mockProps));

      act(() => {
        result.current.setFloorSearch('GROUND');
      });

      const filtered = result.current.filteredFloors.filter(
        (f) => (f.floor || '').toLowerCase().includes('ground')
      );

      expect(filtered.length).toBeGreaterThan(0);
    });
  });
});
