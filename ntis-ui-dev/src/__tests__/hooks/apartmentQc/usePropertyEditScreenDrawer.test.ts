import { describe, it, expect, vi, beforeEach, beforeAll, afterAll, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePropertyEditScreenDrawer } from '@/hooks/apartmentQc/usePropertyEditScreenDrawer';
import type { ApartmentQCDetail } from '@/types/apartmentQC.types';

// Mock logger to prevent console logs during teardown
vi.mock('@/lib/utils/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

// Mock all server actions to prevent real API calls during tests
vi.mock('@/app/[locale]/property-tax/ptis/appartmentQC/action', () => ({
  fetchAllFloorsAction: vi.fn().mockResolvedValue({ success: true, data: [] }),
  fetchAllConstructionTypesAction: vi.fn().mockResolvedValue({ success: true, data: [] }),
  fetchAllUseTypesAction: vi.fn().mockResolvedValue({ success: true, data: [] }),
  fetchAllSubTypesAction: vi.fn().mockResolvedValue({ success: true, data: [] }),
  fetchAllPropertyTypesAction: vi.fn().mockResolvedValue({ success: true, data: [] }),
  fetchFloorQCByPropertyIdSafeAction: vi.fn().mockResolvedValue([]),
  updateBasicDetailsAction: vi.fn().mockResolvedValue({ success: true }),
  updateFloorQCDetailsBulkAction: vi.fn().mockResolvedValue({ success: true }),
  syncRoomsForPropertyDetailsAction: vi.fn().mockResolvedValue({ success: true }),
}));

// Mock Next.js navigation
const mockReplace = vi.fn();
const mockSearchParams = new URLSearchParams();
const mockPathname = '/property-tax/ptis';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: mockReplace,
  }),
  useSearchParams: () => mockSearchParams,
  usePathname: () => mockPathname,
}));

describe('usePropertyEditScreenDrawer', () => {
  // Mock console methods to prevent teardown errors
  beforeAll(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  const mockPropertyData: ApartmentQCDetail = {
    id: 550296,
    propertyId: 550296,
    ownerName: 'John Doe',
    occupierName: 'Jane Doe',
    renterName: '',
    flatOrShopNo: 'A-101',
  } as unknown as ApartmentQCDetail;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams.delete('roomDrawer');
    mockSearchParams.delete('roomPdnId');
    mockSearchParams.delete('roomPropertyId');
  });

  afterEach(async () => {
    // Wait for any pending async operations
    await vi.waitFor(() => {}, { timeout: 100 }).catch(() => {});
    vi.useRealTimers();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() =>
      usePropertyEditScreenDrawer({
        open: true,
        onClose: vi.fn(),
        propertyData: mockPropertyData,
        subTabProp: 'rateable',
      })
    );

    // Both collapsible sections default to OPEN (expanded) per design.
    expect(result.current.isBasicInfoOpen).toBe(true);
    expect(result.current.isFloorQCOpen).toBe(true);
    expect(result.current.dualMethodTab).toBe('rateable');
    expect(result.current.roomDrawerOpen).toBe(false);
  });

  it('should toggle Basic Info section', () => {
    const { result } = renderHook(() =>
      usePropertyEditScreenDrawer({
        open: true,
        onClose: vi.fn(),
        propertyData: mockPropertyData,
        subTabProp: 'rateable',
      })
    );

    act(() => {
      result.current.setIsBasicInfoOpen(true);
    });

    expect(result.current.isBasicInfoOpen).toBe(true);
  });

  it('should toggle Floor QC section', () => {
    const { result } = renderHook(() =>
      usePropertyEditScreenDrawer({
        open: true,
        onClose: vi.fn(),
        propertyData: mockPropertyData,
        subTabProp: 'rateable',
      })
    );

    act(() => {
      result.current.setIsFloorQCOpen(true);
    });

    expect(result.current.isFloorQCOpen).toBe(true);
  });

  it('should update form field', () => {
    const { result } = renderHook(() =>
      usePropertyEditScreenDrawer({
        open: true,
        onClose: vi.fn(),
        propertyData: mockPropertyData,
        subTabProp: 'rateable',
      })
    );

    act(() => {
      result.current.updateFormField('ownerName', 'New Owner');
    });

    expect(result.current.formData.ownerName).toBe('New Owner');
  });

  it('should handle room submission drawer opening', async () => {
    const { result } = renderHook(() =>
      usePropertyEditScreenDrawer({
        open: true,
        onClose: vi.fn(),
        propertyData: mockPropertyData,
        subTabProp: 'rateable',
      })
    );

    const mockRow = {
      id: '1',
      pdnId: 206142,
      floorDescription: 'Ground Floor',
    } as unknown as Parameters<typeof result.current.handleOpenRoomSubmission>[0];

    await act(async () => {
      await result.current.handleOpenRoomSubmission(mockRow);
    });

    expect(mockReplace).toHaveBeenCalled();
    const callArgs = mockReplace.mock.calls[0][0];
    expect(callArgs).toContain('roomDrawer=open');
    expect(callArgs).toContain('roomPdnId=206142');
  });

  it('should handle room submission drawer closing', () => {
    // Set initial URL params
    mockSearchParams.set('roomDrawer', 'open');
    mockSearchParams.set('roomPdnId', '206142');
    mockSearchParams.set('roomPropertyId', '550296');

    const { result } = renderHook(() =>
      usePropertyEditScreenDrawer({
        open: true,
        onClose: vi.fn(),
        propertyData: mockPropertyData,
        subTabProp: 'rateable',
      })
    );

    act(() => {
      result.current.handleCloseRoomDrawer();
    });

    expect(mockReplace).toHaveBeenCalled();
    const callArgs = mockReplace.mock.calls[0][0];
    expect(callArgs).not.toContain('roomDrawer');
    expect(callArgs).not.toContain('roomPdnId');
    expect(callArgs).not.toContain('roomPropertyId');
  });

  it('should switch dual method tab', () => {
    const { result } = renderHook(() =>
      usePropertyEditScreenDrawer({
        open: true,
        onClose: vi.fn(),
        propertyData: mockPropertyData,
        subTabProp: 'dual-method',
      })
    );

    act(() => {
      result.current.setDualMethodTab('capital');
    });

    expect(result.current.dualMethodTab).toBe('capital');
  });

  it('should call onClose when handleClose is called', () => {
    const mockOnClose = vi.fn();

    const { result } = renderHook(() =>
      usePropertyEditScreenDrawer({
        open: true,
        onClose: mockOnClose,
        propertyData: mockPropertyData,
        subTabProp: 'rateable',
      })
    );

    act(() => {
      result.current.handleClose();
    });

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should accept initialFloorQCData', () => {
    const mockFloorData: ApartmentQCDetail[] = [
      {
        id: 1,
        pdnId: 206142,
        floorDescription: 'Ground Floor',
      } as unknown as ApartmentQCDetail,
    ];

    const { result } = renderHook(() =>
      usePropertyEditScreenDrawer({
        open: true,
        onClose: vi.fn(),
        propertyData: mockPropertyData,
        subTabProp: 'rateable',
        initialFloorQCData: mockFloorData,
      })
    );

    expect(result.current.floorData).toHaveLength(1);
  });

  it('should accept initialPropertyTypes', () => {
    const mockPropertyTypes = [
      { value: '1', label: 'Residential' },
      { value: '2', label: 'Commercial' },
    ];

    const { result } = renderHook(() =>
      usePropertyEditScreenDrawer({
        open: true,
        onClose: vi.fn(),
        propertyData: mockPropertyData,
        subTabProp: 'rateable',
        initialPropertyTypes: mockPropertyTypes,
      })
    );

    expect(result.current.propertyTypeOptions).toHaveLength(2);
  });
});
