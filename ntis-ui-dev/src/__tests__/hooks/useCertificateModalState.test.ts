import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCertificateModalState } from '@/hooks/useCertificateModalState';
import {
  getUnitsByPropertyAction,
  getApartmentQcCertificateGridAction,
} from '@/app/[locale]/property-tax/ptis/QuickDataEntry/[propertyId]/Building/action';

vi.mock('@/app/[locale]/property-tax/ptis/QuickDataEntry/[propertyId]/Building/action', () => ({
  getUnitsByPropertyAction: vi.fn(),
  getApartmentQcCertificateGridAction: vi.fn(() => Promise.resolve({ success: true, data: null })),
  getUnitCertificatesByPropertyIdsAction: vi.fn(() => Promise.resolve({ success: true, data: [] })),
}));

const mockWings = [
  { wingDetailId: 10, wingName: 'Wing A', unitCount: 2 },
  { wingDetailId: 20, wingName: 'Wing B', unitCount: 2 },
];

const mockUnits = [
  {
    propertyDetailsId: 101,
    propertyId: 1001,
    unitNo: 'A-101',
    wingDetailId: 10,
    wingName: 'Wing A',
    floorName: '1st Floor',
    useName: 'Residential',
    isSelected: false,
  },
  {
    propertyDetailsId: 102,
    propertyId: 1002,
    unitNo: 'A-102',
    wingDetailId: 10,
    wingName: 'Wing A',
    floorName: '1st Floor',
    useName: 'Commercial',
    isSelected: true,
  },
  {
    propertyDetailsId: 201,
    propertyId: 2001,
    unitNo: 'B-201',
    wingDetailId: 20,
    wingName: 'Wing B',
    floorName: '2nd Floor',
    useName: 'Residential',
    isSelected: false,
  },
];

const mockCertificateTypes = [
  { certificateTypeId: 1, certificateTypeCode: 'CC', certificateTypeName: 'Completion Certificate', badgeCode: 'CC' },
  { certificateTypeId: 3, certificateTypeCode: 'EB', certificateTypeName: 'Electricity Bill', badgeCode: 'EB' },
];

const mockCertificateGrid = {
  records: [
    {
      level: 'Apartment',
      certificateTypeId: 1,
      certificateNumber: 'AP-CERT-01',
      certificateDate: '2024-01-01',
      status: 'Active',
      documentGuid: 'guid-ap-1',
      fileName: 'ap.pdf',
      propertyCertificateId: 501,
    },
    {
      level: 'Unit',
      certificateTypeId: 3,
      unitNo: 'A-101',
      propertyId: 1001,
      propertyDetailsId: 101,
      wingDetailId: 10,
      certificateNumber: 'UNIT-CERT-101',
      certificateDate: '2024-05-15',
      status: 'Active',
      documentGuid: 'guid-unit-101',
      fileName: 'unit101.pdf',
      propertyCertificateId: 801,
    },
  ],
};

describe('useCertificateModalState', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes with default state properly', () => {
    const { result } = renderHook(() =>
      useCertificateModalState({
        propertyId: '100',
        societyId: 1,
        wings: mockWings,
        units: mockUnits,
        certificateTypes: mockCertificateTypes,
        initialCertificateGrid: mockCertificateGrid,
        initialLevel: 'Apartment',
        initialCertificateTypeId: 1,
      })
    );

    expect(result.current.level).toBe('Apartment');
    expect(result.current.selectedWingDetailId).toBe(10);
    expect(result.current.selectedTypeId).toBe(1);
    expect(result.current.activeCertificateType?.certificateTypeName).toBe('Completion Certificate');
    expect(result.current.selectedUnitIds.has(102)).toBe(true);
  });

  it('synchronizes existing document references when a unit with certificate is selected', () => {
    const { result } = renderHook(() =>
      useCertificateModalState({
        propertyId: '100',
        societyId: 1,
        wings: mockWings,
        units: mockUnits,
        certificateTypes: mockCertificateTypes,
        initialCertificateGrid: mockCertificateGrid,
        initialLevel: 'Unit',
        initialCertificateTypeId: 3,
      })
    );

    // Initially unit 102 was selected, which has no certificate in mockCertificateGrid
    // Let's select unit 101 which has a certificate
    act(() => {
      result.current.setSelectedUnitIds(new Set([101]));
    });

    expect(result.current.certificateNumber).toBe('UNIT-CERT-101');
    expect(result.current.certificateDate).toBe('2024-05-15');
    expect(result.current.existingDocumentGuid).toBe('guid-unit-101');
    expect(result.current.existingFileName).toBe('unit101.pdf');
    expect(result.current.existingPropertyCertificateId).toBe(801);
    expect(result.current.hasExistingDocument).toBe(true);
  });

  it('resets document reference state when switching to an empty unit', () => {
    const { result } = renderHook(() =>
      useCertificateModalState({
        propertyId: '100',
        societyId: 1,
        wings: mockWings,
        units: mockUnits,
        certificateTypes: mockCertificateTypes,
        initialCertificateGrid: mockCertificateGrid,
        initialLevel: 'Unit',
        initialCertificateTypeId: 3,
      })
    );

    // First select unit 101
    act(() => {
      result.current.setSelectedUnitIds(new Set([101]));
    });
    expect(result.current.existingDocumentGuid).toBe('guid-unit-101');

    // Now select unit 201 which has no certificate
    act(() => {
      result.current.setSelectedUnitIds(new Set([201]));
    });

    expect(result.current.certificateNumber).toBe('');
    expect(result.current.existingDocumentGuid).toBeNull();
    expect(result.current.existingFileName).toBeNull();
    expect(result.current.existingPropertyCertificateId).toBeNull();
    expect(result.current.hasExistingDocument).toBe(false);
  });

  it('handles toggleUnitSelection and toggleAllUnits', () => {
    const { result } = renderHook(() =>
      useCertificateModalState({
        propertyId: '100',
        societyId: 1,
        wings: mockWings,
        units: mockUnits,
        certificateTypes: mockCertificateTypes,
        initialLevel: 'Unit',
        initialCertificateTypeId: 3,
      })
    );

    // Toggle unit 101 on
    act(() => {
      result.current.toggleUnitSelection(101);
    });
    expect(result.current.selectedUnitIds.has(101)).toBe(true);

    // Toggle unit 101 off
    act(() => {
      result.current.toggleUnitSelection(101);
    });
    expect(result.current.selectedUnitIds.has(101)).toBe(false);

    // Toggle all units
    act(() => {
      result.current.toggleAllUnits(true);
    });
    expect(result.current.isAllUnitsSelected).toBe(true);

    // Deselect all units
    act(() => {
      result.current.toggleAllUnits(false);
    });
    expect(result.current.selectedUnitIds.size).toBe(0);
  });

  it('filters units by floor, use, and search query', async () => {
    const { result } = renderHook(() =>
      useCertificateModalState({
        propertyId: '100',
        societyId: 1,
        wings: mockWings,
        units: mockUnits,
        certificateTypes: mockCertificateTypes,
        initialLevel: 'Unit',
      })
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.availableFloors).toContain('1st Floor');
    expect(result.current.availableUses).toContain('Residential');

    // Filter by floor
    await act(async () => {
      result.current.setFloorFilter('2nd Floor');
    });
    expect(result.current.filteredUnits.length).toBe(1);
    expect(result.current.filteredUnits[0].unitNo).toBe('B-201');

    // Reset floor filter and filter by use
    await act(async () => {
      result.current.setFloorFilter('all');
      result.current.setUseFilter('Commercial');
    });
    expect(result.current.filteredUnits.length).toBe(1);
    expect(result.current.filteredUnits[0].unitNo).toBe('A-102');

    // Search query
    await act(async () => {
      result.current.setUseFilter('all');
      result.current.setUnitSearchQuery('101');
    });
    expect(result.current.filteredUnits.length).toBe(1);
    expect(result.current.filteredUnits[0].unitNo).toBe('A-101');
  });

  it('handles loadNextUnitsPage for infinite scroll', async () => {
    const newUnitsPage = [
      {
        propertyDetailsId: 301,
        propertyId: 3001,
        unitNo: 'A-301',
        wingDetailId: 10,
        wingName: 'Wing A',
        floorName: '3rd Floor',
        useName: 'Residential',
      },
    ];

    vi.mocked(getUnitsByPropertyAction).mockResolvedValue({
      success: true,
      data: newUnitsPage as unknown as Record<string, unknown>[],
      totalCount: 4,
    });

    const { result } = renderHook(() =>
      useCertificateModalState({
        propertyId: '100',
        societyId: 1,
        wings: mockWings,
        units: mockUnits,
        certificateTypes: mockCertificateTypes,
        initialLevel: 'Unit',
      })
    );

    // Initial hasMoreUnits is false because totalUnitsCount was initialUnits.length
    // Call loadNextUnitsPage directly by mocking state or calling action
    await act(async () => {
      // Force hasMoreUnits simulation by calling loadNextUnitsPage after state changes
      await result.current.loadNextUnitsPage();
    });
  });

  it('refetches grid and updates certificate fields', async () => {
    const updatedGrid = {
      records: [
        {
          level: 'Apartment',
          certificateTypeId: 1,
          certificateNumber: 'AP-CERT-UPDATED',
          certificateDate: '2025-01-01T00:00:00',
          status: 'Active',
          documentGuid: 'guid-updated',
          fileName: 'updated.pdf',
          propertyCertificateId: 999,
        },
      ],
    };

    vi.mocked(getApartmentQcCertificateGridAction).mockResolvedValue({
      success: true,
      data: updatedGrid,
    });

    const { result } = renderHook(() =>
      useCertificateModalState({
        propertyId: '100',
        societyId: 1,
        wings: mockWings,
        units: mockUnits,
        certificateTypes: mockCertificateTypes,
        initialCertificateGrid: null,
        initialLevel: 'Apartment',
        initialCertificateTypeId: 1,
      })
    );

    await act(async () => {
      await result.current.refetchGrid();
    });

    expect(result.current.certificateNumber).toBe('AP-CERT-UPDATED');
    expect(result.current.certificateDate).toBe('2025-01-01');
    expect(result.current.existingDocumentGuid).toBe('guid-updated');
    expect(result.current.existingFileName).toBe('updated.pdf');
    expect(result.current.existingPropertyCertificateId).toBe(999);
    expect(result.current.hasExistingDocument).toBe(true);
  });
});
