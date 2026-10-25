import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useDataEntrySameAs } from '@/components/modules/property-tax/ptis/QuickDataEntry/floorSubmission/hooks/useDataEntrySameAs';
import {
  applyDataEntrySameAsAction,
  fetchDataEntrySameAsAction,
  getPropertyBasicDetailsAction,
} from '@/app/[locale]/property-tax/ptis/QuickDataEntry/[propertyId]/FloorSubmission/actions';
import { updatePropertyBasicDetailsAction } from '@/app/[locale]/property-tax/ptis/QuickDataEntry/[propertyId]/Property/action';
import { getWardListAction } from '@/app/[locale]/property-tax/ptis/actions';
import type { SelectableProperty } from '@/types/floor-details.types';

vi.mock('next/navigation', () => ({
  useParams: () => ({ locale: 'en' }),
}));

vi.mock('@/components/common', () => ({
  useConfirm: () => ({ confirm: vi.fn() }),
}));

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

vi.mock('@/app/[locale]/property-tax/ptis/QuickDataEntry/[propertyId]/FloorSubmission/actions', () => ({
  fetchDataEntrySameAsAction: vi.fn(),
  applyDataEntrySameAsAction: vi.fn(),
  getPropertyBasicDetailsAction: vi.fn(),
  clearDataEntrySameAsCache: vi.fn(),
}));

vi.mock('@/app/[locale]/property-tax/ptis/QuickDataEntry/[propertyId]/Property/action', () => ({
  updatePropertyBasicDetailsAction: vi.fn(),
}));

vi.mock('@/app/[locale]/property-tax/ptis/actions', () => ({
  getWardListAction: vi.fn(),
}));

describe('useDataEntrySameAs preloading', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads property and ward data before opening and reuses it on first open', async () => {
    const properties: SelectableProperty[] = [
      {
        id: '755397-1',
        propertyId: 755397,
        wardId: 18,
        wardNo: 'UT1',
        propertyNo: '1',
        partitionNo: 'A2',
        categoryName: 'Apartment',
        type: 1,
        wing: '-',
        flatNo: '-',
      },
    ];

    vi.mocked(fetchDataEntrySameAsAction).mockResolvedValue(properties);
    vi.mocked(getWardListAction).mockResolvedValue({
      success: true,
      data: [{ wardId: 18, wardNo: 'UT1', zoneId: 1, description: 'Ward UT1' }],
    });

    const { result, rerender } = renderHook(
      ({ isOpen }) =>
        useDataEntrySameAs({
          isOpen,
          wardId: 18,
          propertyNo: '1',
          partitionNo: 'A2',
          initialPropertyID: 755397,
          categoryName: 'Apartment',
          t: (key) => key,
        }),
      { initialProps: { isOpen: false } }
    );

    await waitFor(() => {
      expect(fetchDataEntrySameAsAction).toHaveBeenCalledTimes(1);
      expect(getWardListAction).toHaveBeenCalledTimes(1);
      expect(result.current.isFetchingWards).toBe(false);
      expect(result.current.selectableProperties).toEqual(properties);
    });

    act(() => {
      rerender({ isOpen: true });
    });

    await waitFor(() => {
      expect(result.current.selectableProperties).toEqual(properties);
      expect(result.current.isLoadingProperties).toBe(false);
    });

    expect(fetchDataEntrySameAsAction).toHaveBeenCalledTimes(1);
    expect(result.current.wardOptions).toEqual([{ label: 'UT1', value: '18' }]);
  });

  it('uses the current property as source and copies its submission details', async () => {
    const properties: SelectableProperty[] = [
      {
        id: '3895103-11-21--FLAT-101',
        propertyId: 3895103,
        wardId: 5330,
        wardNo: 'NK9',
        propertyNo: '301',
        partitionNo: 'A1',
        categoryName: 'Apartment',
        type: 1,
        wing: '-',
        flatNo: 'FLAT-101',
      },
      {
        id: '3895104-12-22--FLAT-201',
        propertyId: 3895104,
        wardId: 5330,
        wardNo: 'NK9',
        propertyNo: '301',
        partitionNo: 'A2',
        categoryName: 'Apartment',
        type: 1,
        wing: '-',
        flatNo: 'FLAT-201',
      },
      {
        id: '3895105-13-23--FLAT-301',
        propertyId: 3895105,
        wardId: 5330,
        wardNo: 'NK9',
        propertyNo: '301',
        partitionNo: 'A3',
        categoryName: 'Apartment',
        type: 1,
        wing: '-',
        flatNo: 'FLAT-301',
      },
    ];

    vi.mocked(fetchDataEntrySameAsAction).mockResolvedValue(properties);
    vi.mocked(getWardListAction).mockResolvedValue({ success: true, data: [] });
    vi.mocked(applyDataEntrySameAsAction).mockResolvedValue({
      success: false,
      error: 'test response',
    });

    const { result } = renderHook(() =>
      useDataEntrySameAs({
        isOpen: true,
        wardId: 5330,
        propertyNo: '301',
        partitionNo: 'A1',
        initialPropertyID: 3895103,
        categoryName: 'Apartment',
        t: (key) => key,
      })
    );

    await waitFor(() => {
      expect(result.current.selectableProperties).toEqual(properties);
      expect(result.current.currentPropertyType).toBe('1');
    });

    act(() => {
      result.current.handleTogglePropertySelection('3895104-12-22--FLAT-201');
      result.current.handleTogglePropertySelection('3895105-13-23--FLAT-301');
    });

    await act(async () => {
      await result.current.handleApplyTypeSubmission();
    });

    expect(applyDataEntrySameAsAction).toHaveBeenCalledWith(
      {
        sourcePropertyId: 3895103,
        destinationPropertyIds: [3895104, 3895105],
        filterType: 'PROPERTYWISE',
        type: '1',
      },
      'en'
    );
  });

  it('does not send or change the property type when applying parking', async () => {
    const properties: SelectableProperty[] = [
      {
        id: '3895103-11-21--FLAT-101',
        propertyId: 3895103,
        wardId: 5330,
        wardNo: 'NK9',
        propertyNo: '301',
        partitionNo: 'A1',
        categoryName: 'Apartment',
        type: 1,
        wing: '-',
        flatNo: 'FLAT-101',
        parkingCarpetAreaSqFeet: 8611.2,
        parkingCarpetAreaSqMeter: 800,
      },
      {
        id: '3895104-12-22--FLAT-201',
        propertyId: 3895104,
        wardId: 5330,
        wardNo: 'NK9',
        propertyNo: '301',
        partitionNo: 'A2',
        categoryName: 'Apartment',
        type: 1,
        wing: '-',
        flatNo: 'FLAT-201',
        parkingCarpetAreaSqFeet: 0,
        parkingCarpetAreaSqMeter: 0,
      },
    ];

    vi.mocked(fetchDataEntrySameAsAction).mockResolvedValue(properties);
    vi.mocked(getWardListAction).mockResolvedValue({ success: true, data: [] });
    vi.mocked(applyDataEntrySameAsAction).mockResolvedValue({
      success: false,
      error: 'test response',
    });

    const { result } = renderHook(() =>
      useDataEntrySameAs({
        isOpen: true,
        wardId: 5330,
        propertyNo: '301',
        partitionNo: 'A1',
        initialPropertyID: 3895103,
        initialTab: 'parking',
        categoryName: 'Apartment',
        t: (key) => key,
      })
    );

    await waitFor(() => {
      expect(result.current.selectableProperties).toEqual(properties);
    });

    act(() => {
      result.current.handleTogglePropertySelection('3895103-11-21--FLAT-101');
      result.current.handleTogglePropertySelection('3895104-12-22--FLAT-201');
    });

    await act(async () => {
      await result.current.handleApplySameAsDetails();
    });

    expect(applyDataEntrySameAsAction).toHaveBeenCalledWith(
      {
        sourcePropertyId: 3895103,
        destinationPropertyIds: [3895104],
        filterType: 'PARKING',
      },
      'en'
    );
    expect(getPropertyBasicDetailsAction).not.toHaveBeenCalled();
    expect(updatePropertyBasicDetailsAction).not.toHaveBeenCalled();
  });

  it('clears selected properties after applying a type successfully', async () => {
    const properties: SelectableProperty[] = [
      {
        id: '3895103-11-21--FLAT-101',
        propertyId: 3895103,
        wardId: 5330,
        wardNo: 'NK9',
        propertyNo: '301',
        partitionNo: 'A1',
        categoryName: 'Apartment',
        type: 1,
        wing: '-',
        flatNo: 'FLAT-101',
      },
      {
        id: '3895104-12-22--FLAT-201',
        propertyId: 3895104,
        wardId: 5330,
        wardNo: 'NK9',
        propertyNo: '301',
        partitionNo: 'A2',
        categoryName: 'Apartment',
        type: 1,
        wing: '-',
        flatNo: 'FLAT-201',
      },
    ];

    vi.mocked(fetchDataEntrySameAsAction).mockResolvedValue(properties);
    vi.mocked(getWardListAction).mockResolvedValue({ success: true, data: [] });
    vi.mocked(applyDataEntrySameAsAction).mockResolvedValue({ success: true });

    const { result } = renderHook(() =>
      useDataEntrySameAs({
        isOpen: true,
        wardId: 5330,
        propertyNo: '301',
        partitionNo: 'A1',
        initialPropertyID: 3895103,
        initialTab: 'type-wise',
        categoryName: 'Apartment',
        t: (key) => key,
      })
    );

    await waitFor(() => {
      expect(result.current.selectableProperties).toEqual(properties);
    });

    act(() => {
      result.current.setChangeTypeInput('2');
      result.current.handleTogglePropertySelection('3895103-11-21--FLAT-101');
      result.current.handleTogglePropertySelection('3895104-12-22--FLAT-201');
    });

    await act(async () => {
      await result.current.handleApplySameAsDetails();
    });

    expect(applyDataEntrySameAsAction).toHaveBeenCalledWith(
      {
        sourcePropertyId: 3895103,
        destinationPropertyIds: [3895103, 3895104],
        filterType: 'TYPEWISE',
        type: '2',
      },
      'en'
    );
    expect(result.current.selectedPropertyIds.size).toBe(0);
  });
});
