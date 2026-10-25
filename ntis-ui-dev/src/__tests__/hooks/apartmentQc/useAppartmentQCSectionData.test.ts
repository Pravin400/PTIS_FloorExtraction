import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAppartmentQCSectionData } from '@/hooks/apartmentQc/useAppartmentQCSectionData';
import {
  fetchApartmentQCDetailsSafeAction,
  fetchFloorQCByPropertyIdSafeAction,
  fetchAllPropertyTypesAction,
  fetchApartmentPropertyTaxDetailsByTabAction,
  fetchApartmentPropertyTaxDetailsCvByTabAction,
} from '@/app/[locale]/property-tax/ptis/appartmentQC/action';
import type { ApartmentTaxDetailsItems, ApartmentQCDetail } from '@/types/apartmentQC.types';

vi.mock('@/app/[locale]/property-tax/ptis/appartmentQC/action', () => ({
  fetchApartmentQCDetailsSafeAction: vi.fn(),
  fetchFloorQCByPropertyIdSafeAction: vi.fn(),
  fetchAllPropertyTypesAction: vi.fn(),
  fetchApartmentPropertyTaxDetailsByTabAction: vi.fn(),
  fetchApartmentPropertyTaxDetailsCvByTabAction: vi.fn(),
  fetchDualMethodTaxDetailsByTabAction: vi.fn(),
}));

describe('useAppartmentQCSectionData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const defaultProps = {
    wardId: '1',
    propertyNo: 'PROP1',
    partitionNo: '0',
    activeMainTab: 'residential',
    activeSubTab: 'rateable',
    drawerOpen: false,
    selectedPropertyId: null,
  };

  it('should fetch tax details for rateable tab', async () => {
    const mockData = { propertyId: 1, propertyCount: 1, taxAmounts: [] };
    vi.mocked(fetchApartmentPropertyTaxDetailsByTabAction).mockResolvedValue({
      success: true,
      data: mockData as unknown as ApartmentTaxDetailsItems,
      message: 'success'
    });

    const { result } = renderHook(() => useAppartmentQCSectionData(defaultProps));

    await waitFor(() => {
      expect(result.current.taxDetails).toEqual(mockData);
    });

    expect(fetchApartmentPropertyTaxDetailsByTabAction).toHaveBeenCalledWith(
      '1', 'PROP1', 'residential', '0'
    );
  });

  it('should fetch tax details for capital tab', async () => {
    const mockData = { propertyId: 1, propertyCount: 1, taxAmounts: [] };
    vi.mocked(fetchApartmentPropertyTaxDetailsCvByTabAction).mockResolvedValue({
      success: true,
      data: mockData as unknown as ApartmentTaxDetailsItems,
      message: 'success'
    });

    const { result } = renderHook(() => useAppartmentQCSectionData({
      ...defaultProps,
      activeSubTab: 'capital'
    }));

    await waitFor(() => {
      expect(result.current.taxDetails).toEqual(mockData);
    });

    expect(fetchApartmentPropertyTaxDetailsCvByTabAction).toHaveBeenCalledWith(
      '1', 'PROP1', 'residential', '0'
    );
  });

  it('should fetch drawer local data when drawer is open', async () => {
    vi.mocked(fetchApartmentQCDetailsSafeAction).mockResolvedValue([{ id: 1 } as unknown as ApartmentQCDetail]);
    vi.mocked(fetchFloorQCByPropertyIdSafeAction).mockResolvedValue([{ id: 2 } as unknown as ApartmentQCDetail]);
    vi.mocked(fetchAllPropertyTypesAction).mockResolvedValue({ success: true, data: [{ label: 'L', value: 'V' }], message: 'success' });

    const { result } = renderHook(() => useAppartmentQCSectionData({
      ...defaultProps,
      drawerOpen: true,
      selectedPropertyId: '10'
    }));

    await waitFor(() => {
      expect(result.current.drawerLocalData).not.toBeNull();
    });

    expect(fetchApartmentQCDetailsSafeAction).toHaveBeenCalledWith({ propertyId: '10', pageSize: 1 });
    expect(fetchFloorQCByPropertyIdSafeAction).toHaveBeenCalledWith(10, 'rateable');
    expect(fetchAllPropertyTypesAction).toHaveBeenCalled();

    expect(result.current.drawerLocalData).toEqual({
      basicInfo: { id: 1 },
      floorQCData: [{ id: 2 }],
      propertyTypes: [{ label: 'L', value: 'V' }]
    });
  });

  it('should handle errors silently for tax details', async () => {
    vi.mocked(fetchApartmentPropertyTaxDetailsByTabAction).mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useAppartmentQCSectionData(defaultProps));

    await waitFor(() => {
      expect(fetchApartmentPropertyTaxDetailsByTabAction).toHaveBeenCalled();
      expect(result.current.taxDetailsLoading).toBe(false);
    });

    expect(result.current.taxDetails).toBeNull();
  });
});
