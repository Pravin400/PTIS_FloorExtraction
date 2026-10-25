import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTaxZoning } from '@/hooks/taxZoning/useTaxZoning';
import type { TaxZoningPageProps, TaxZone, Ward } from '@/types/taxzoning.types';

// Mock next/navigation
let mockSearchParams = new URLSearchParams();
const mockReplace = vi.fn((url: string) => {
  const queryStr = url.split('?')[1];
  if (queryStr) {
    mockSearchParams = new URLSearchParams(queryStr);
  }
});

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: mockReplace,
    refresh: vi.fn(),
  }),
  useSearchParams: () => mockSearchParams,
}));

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => 'en',
}));

// Mock sub-hooks to isolate useTaxZoning logic
const mockBulkUpdateAction = vi.fn();
const mockHandleUpdate = vi.fn();
vi.mock('@/hooks/taxZoning/useTaxZoningActions', () => ({
  useTaxZoningActions: () => ({
    saving: false,
    handleUpdate: mockHandleUpdate,
    handleBulkUpdate: mockBulkUpdateAction,
  }),
}));

const mockHandleExportCSV = vi.fn();
const mockHandleImportFile = vi.fn();
const mockHandleClearImported = vi.fn();
const mockSetImportedChanges = vi.fn();
const mockSetHasImportedData = vi.fn();

vi.mock('@/hooks/taxZoning/useTaxZoningFile', () => ({
  useTaxZoningFile: () => ({
    importedChanges: [],
    hasImportedData: false,
    handleExportCSV: mockHandleExportCSV,
    handleImportFile: mockHandleImportFile,
    handleClearImported: mockHandleClearImported,
    setImportedChanges: mockSetImportedChanges,
    setHasImportedData: mockSetHasImportedData,
  }),
}));

const mockTaxZones = {
  items: [
    { id: 1, taxZoneNo: '1', taxZoneType: 'R', remark: null, createdDate: '', updatedDate: null, isActive: true },
    { id: 2, taxZoneNo: '2', taxZoneType: 'C', remark: null, createdDate: '', updatedDate: null, isActive: true },
  ] as TaxZone[],
  pageNumber: 1,
  pageSize: 10,
  totalCount: 2,
  totalPages: 1,
  hasPrevious: false,
  hasNext: false,
};

const mockWardsData = {
  items: [
    { id: 89, wardNo: 'MM11', zoneNo: '1', description: null, descriptionEnglish: null, sequenceNo: null, isActive: true, createdBy: null, createdDate: '', updatedBy: null, updatedDate: null },
  ] as Ward[],
  pageNumber: 1,
  pageSize: 10,
  totalCount: 1,
  totalPages: 1,
  hasPrevious: false,
  hasNext: false,
};

const baseProps: TaxZoningPageProps = {
  data: [
    { 
      taxZoneId: 1, 
      wardId: 89, 
      taxZone: '1', 
      wardNo: 'MM11', 
      propertyNo: '16', 
      fromProperty: '10', 
      toProperty: '20', 
      isActive: true, 
      createdDate: null, 
      updatedDate: null 
    },
  ],
  pageNumber: 1,
  pageSize: 10,
  totalCount: 1,
  totalPages: 1,
  taxZones: mockTaxZones,
  wardsData: mockWardsData,
  allProperties: { 
    success: true, 
    data: { 
      items: [
        { taxZoneId: 0, wardId: 89, taxZone: '', wardNo: 'MM11', propertyNo: '10', fromProperty: '', toProperty: '', isActive: true, createdDate: null, updatedDate: null },
        { taxZoneId: 0, wardId: 89, taxZone: '', wardNo: 'MM11', propertyNo: '15', fromProperty: '', toProperty: '', isActive: true, createdDate: null, updatedDate: null },
        { taxZoneId: 0, wardId: 89, taxZone: '', wardNo: 'MM11', propertyNo: '20', fromProperty: '', toProperty: '', isActive: true, createdDate: null, updatedDate: null },
        { taxZoneId: 0, wardId: 89, taxZone: '', wardNo: 'MM11', propertyNo: '100', fromProperty: '', toProperty: '', isActive: true, createdDate: null, updatedDate: null },
        { taxZoneId: 0, wardId: 89, taxZone: '', wardNo: 'MM11', propertyNo: '101', fromProperty: '', toProperty: '', isActive: true, createdDate: null, updatedDate: null },
        { taxZoneId: 0, wardId: 89, taxZone: '', wardNo: 'MM11', propertyNo: '102', fromProperty: '', toProperty: '', isActive: true, createdDate: null, updatedDate: null },
      ], 
      totalCount: 6, pageNumber: 1, pageSize: 10, totalPages: 1, hasPrevious: false, hasNext: false 
    } 
  },
};

describe('useTaxZoning', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams = new URLSearchParams();
  });

  it('should initialize with values from searchParams', () => {
    mockSearchParams.set('taxZoneId', '1');
    mockSearchParams.set('wardId', '89');
    
    const { result } = renderHook(() => useTaxZoning(baseProps));
    
    expect(result.current.zone).toBe('1');
    expect(result.current.ward).toEqual(['89']);
  });

  it('should compute zoneOptions and wardOptions correctly', () => {
    const { result } = renderHook(() => useTaxZoning(baseProps));
    
    expect(result.current.zoneOptions).toHaveLength(2);
    expect(result.current.zoneOptions[0]).toEqual({ label: '1', value: '1' });
    
    // wardOptions should be empty if no zone is selected
    expect(result.current.wardOptions).toHaveLength(0);
    
    act(() => {
      result.current.setZone('1');
    });
    
    expect(result.current.wardOptions).toHaveLength(1);
    expect(result.current.wardOptions[0]).toEqual({ label: 'MM11', value: '89' });
  });

  it('should handle pagination changes', () => {
    const { result } = renderHook(() => useTaxZoning(baseProps));
    
    act(() => {
      result.current.changePage(2);
    });
    
    expect(mockReplace).toHaveBeenCalledWith(expect.stringContaining('page=2'));
    
    act(() => {
      result.current.changePageSize(50);
    });
    
    expect(mockReplace).toHaveBeenCalledWith(expect.stringContaining('pageSize=50'));
    expect(mockReplace).toHaveBeenCalledWith(expect.stringContaining('page=1'));
  });

  it('should handle sorting', () => {
    const { result } = renderHook(() => useTaxZoning(baseProps));
    
    act(() => {
      const wardColumn = result.current.columns.find(c => c.key === 'wardNo');
      // @ts-expect-error - label is a React element
      wardColumn?.label?.props?.onSort?.('wardNo');
    });
    
    expect(mockReplace).toHaveBeenCalledWith(expect.stringContaining('sortBy=wardNo'));
    expect(mockReplace).toHaveBeenCalledWith(expect.stringContaining('sortOrder=asc'));
  });

  it('should generate preview data when all fields are set', () => {
    const { result } = renderHook(() => useTaxZoning(baseProps));
    
    act(() => {
      result.current.setZone('1');
      result.current.setWard(['89']);
      result.current.setFromProps('100');
      result.current.setToProps('102');
    });
    
    expect(result.current.previewData).toHaveLength(3);
    expect(result.current.previewData[0]).toEqual({
      taxZoneNo: '1',
      oldTaxZoneNo: '-',
      wardNo: 'MM11',
      propertyNo: '100',
    });
  });

  it('should validate form correctly', () => {
    const { result } = renderHook(() => useTaxZoning(baseProps));
    
    expect(result.current.isFormValid).toBe(false);
    
    act(() => {
      result.current.setZone('1');
      result.current.setWard(['89', '90']); // multiple wards, property range not needed
    });
    
    expect(result.current.isFormValid).toBe(true);
    
    act(() => {
      result.current.setWard(['89']); // single ward, property range needed
    });
    
    expect(result.current.isFormValid).toBe(false);
    
    act(() => {
      result.current.setFromProps('10');
      result.current.setToProps('20');
    });
    
    expect(result.current.isFormValid).toBe(true);
  });

  it('should handle form submission', () => {
    const { result } = renderHook(() => useTaxZoning(baseProps));
    
    act(() => {
      result.current.setZone('1');
      result.current.setWard(['89']);
      result.current.setFromProps('10');
      result.current.setToProps('20');
    });
    
    act(() => {
      result.current.handleSubmit({ preventDefault: vi.fn() } as unknown as React.FormEvent);
    });
    
    expect(mockHandleUpdate).toHaveBeenCalledWith(expect.objectContaining({
      zone: '1',
      ward: ['89'],
    }));
  });

  it('should handle bulk update', () => {
    const { result } = renderHook(() => useTaxZoning(baseProps));
    
    act(() => {
      result.current.handleBulkUpdate();
    });
    
    expect(mockBulkUpdateAction).toHaveBeenCalled();
  });

  it('should clear form on onFormClear', () => {
    const { result } = renderHook(() => useTaxZoning(baseProps));
    
    act(() => {
      result.current.setZone('1');
      result.current.setWard(['89']);
      result.current.onFormClear();
    });
    
    expect(result.current.zone).toBe('');
    expect(result.current.ward).toEqual([]);
    expect(mockReplace).toHaveBeenCalled();
  });
});
