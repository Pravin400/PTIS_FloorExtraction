import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTaxZoningFile } from '@/hooks/taxZoning/useTaxZoningFile';
import type { ZoningRecord, TaxZone, Ward } from '@/types/taxzoning.types';
import type { PagedResponse } from '@/types/common.types';

// Mock server action using vi.hoisted
const mockGetTaxZoningPagedAction = vi.hoisted(() => vi.fn());
vi.mock('@/app/[locale]/property-tax/taxzone-master/taxzoning/actions', () => ({
  getTaxZoningPagedAction: (...args: unknown[]) => mockGetTaxZoningPagedAction(...args),
}));

const mockToast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() }));
vi.mock('sonner', () => ({ toast: mockToast }));
vi.mock('xlsx', () => ({ read: vi.fn(), utils: { sheet_to_json: vi.fn() } }));

const t = (key: string) => key;
const REQUIRED_HEADERS = ['wardno', 'fromproperty', 'toproperty', 'taxzoneno'];

const mockWards: PagedResponse<Ward> = {
  items: [
    { id: 89, wardNo: 'MM11', zoneNo: '1', description: null, descriptionEnglish: null, sequenceNo: null, isActive: true, createdBy: null, createdDate: '', updatedBy: null, updatedDate: null },
  ],
  pageNumber: 1, pageSize: 10, totalCount: 1, totalPages: 1, hasPrevious: false, hasNext: false,
};

const mockTaxZones: PagedResponse<TaxZone> = {
  items: [
    { id: 1, taxZoneNo: '1', taxZoneType: 'R', remark: null, createdDate: '', updatedDate: null, isActive: true },
    { id: 2, taxZoneNo: '2', taxZoneType: 'C', remark: null, createdDate: '', updatedDate: null, isActive: true },
  ],
  pageNumber: 1, pageSize: 10, totalCount: 2, totalPages: 1, hasPrevious: false, hasNext: false,
};

const mockRecords: ZoningRecord[] = [
  { taxZoneId: 1, taxZoneNo: '1', wardId: 89, wardNo: 'MM11', fromProperty: '3', toProperty: '3', status: 'Active' },
];

describe('useTaxZoningFile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with empty state', () => {
    const { result } = renderHook(() => useTaxZoningFile(t, REQUIRED_HEADERS, mockRecords, mockWards, mockTaxZones));
    expect(result.current.importedChanges).toEqual([]);
    expect(result.current.hasImportedData).toBe(false);
  });

  describe('handleExportCSV', () => {
    it('should show error toast when no records to export', () => {
      const { result } = renderHook(() => useTaxZoningFile(t, REQUIRED_HEADERS, [], mockWards, mockTaxZones));
      act(() => { result.current.handleExportCSV([]); });
      expect(mockToast.error).toHaveBeenCalledWith('messages.noRecordsToExport');
    });

    it('should create CSV blob and trigger download', () => {
      const mockCreateObjectURL = vi.fn(() => 'blob:test');
      const mockRevokeObjectURL = vi.fn();
      global.URL.createObjectURL = mockCreateObjectURL;
      global.URL.revokeObjectURL = mockRevokeObjectURL;

      const { result } = renderHook(() => useTaxZoningFile(t, REQUIRED_HEADERS, mockRecords, mockWards, mockTaxZones));
      act(() => { result.current.handleExportCSV(mockRecords); });

      expect(mockToast.success).toHaveBeenCalledWith('messages.csvExportSuccess');
      expect(mockCreateObjectURL).toHaveBeenCalled();
      expect(mockRevokeObjectURL).toHaveBeenCalled();
    });
  });

  describe('handleClearImported', () => {
    it('should clear imported data and show info toast', () => {
      const { result } = renderHook(() => useTaxZoningFile(t, REQUIRED_HEADERS, mockRecords, mockWards, mockTaxZones));

      act(() => { result.current.setImportedChanges([mockRecords[0]]); });
      act(() => { result.current.setHasImportedData(true); });
      expect(result.current.hasImportedData).toBe(true);

      act(() => { result.current.handleClearImported(); });
      expect(result.current.importedChanges).toEqual([]);
      expect(result.current.hasImportedData).toBe(false);
      expect(mockToast.info).toHaveBeenCalledWith('messages.importedDataCleared');
    });
  });

  describe('handleImportFile', () => {
    it('should reject invalid file types', () => {
      const { result } = renderHook(() => useTaxZoningFile(t, REQUIRED_HEADERS, mockRecords, mockWards, mockTaxZones));
      const mockEvent = {
        target: { files: [new File([''], 'test.txt', { type: 'text/plain' })], value: '' },
      } as unknown as React.ChangeEvent<HTMLInputElement>;

      act(() => { result.current.handleImportFile(mockEvent); });
      expect(mockToast.error).toHaveBeenCalledWith('messages.invalidFileType');
    });

    it('should accept CSV files and trigger FileReader', async () => {
      mockGetTaxZoningPagedAction.mockResolvedValue({
        success: true,
        data: {
          items: [{ wardId: 89, taxZoneId: 1, fromProperty: '3', toProperty: '3', wardNo: 'MM11', isActive: true }],
          totalCount: 1,
        },
      });

      const { result } = renderHook(() => useTaxZoningFile(t, REQUIRED_HEADERS, mockRecords, mockWards, mockTaxZones));

      const csvContent = 'WardNo,FromProperty,ToProperty,TaxZoneNo\nMM11,3,3,2';
      const file = new File([csvContent], 'test.csv', { type: 'text/csv' });
      const event = { target: { files: [file], value: '' } } as unknown as React.ChangeEvent<HTMLInputElement>;

      await act(async () => {
        result.current.handleImportFile(event);
        await new Promise(resolve => setTimeout(resolve, 200));
      });

      expect(mockGetTaxZoningPagedAction).toHaveBeenCalledWith(1, 10000, undefined, undefined, 'ward');
    });

    it('should do nothing when no file is selected', () => {
      const { result } = renderHook(() => useTaxZoningFile(t, REQUIRED_HEADERS, mockRecords, mockWards, mockTaxZones));
      const mockEvent = { target: { files: [] } } as unknown as React.ChangeEvent<HTMLInputElement>;
      act(() => { result.current.handleImportFile(mockEvent); });
      expect(mockToast.error).not.toHaveBeenCalled();
    });
  });

  describe('setImportedChanges / setHasImportedData', () => {
    it('should allow direct state updates', () => {
      const { result } = renderHook(() => useTaxZoningFile(t, REQUIRED_HEADERS, mockRecords, mockWards, mockTaxZones));

      const newData: ZoningRecord[] = [{ taxZoneId: 2, taxZoneNo: '2', wardId: 89, wardNo: 'MM11', fromProperty: '3', toProperty: '3', status: 'Updated' }];
      act(() => { result.current.setImportedChanges(newData); });
      expect(result.current.importedChanges).toEqual(newData);

      act(() => { result.current.setHasImportedData(true); });
      expect(result.current.hasImportedData).toBe(true);
    });
  });
});
