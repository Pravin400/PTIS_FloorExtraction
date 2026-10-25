/* eslint-disable @typescript-eslint/no-explicit-any */
import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useFieldRegistryForm } from '@/hooks/commonDetailsUpdate/useFieldRegistryForm';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { addBulkUpdateDefinitionAction } from '@/app/[locale]/property-tax/common-details-update/actions';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
  usePathname: vi.fn(),
}));

// Mock next-intl
vi.mock('next-intl', () => ({
  useLocale: vi.fn(() => 'en'),
  useTranslations: vi.fn(() => vi.fn((key) => key)),
}));

const mockToast = {
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
  info: vi.fn(),
  toast: vi.fn(),
};
const toast = mockToast;

// Mock @/components/common
vi.mock('@/components/common', () => ({
  useToast: () => mockToast,
}));

// Mock server actions
vi.mock('@/app/[locale]/property-tax/common-details-update/actions', () => ({
  addBulkUpdateDefinitionAction: vi.fn(),
  getSourceTablesAction: vi.fn().mockResolvedValue({ success: true, data: [] }),
  getSourceTableFieldsAction: vi.fn().mockResolvedValue({ success: true, data: [] }),
}));

// Mock React useTransition
vi.mock('react', async () => {
  const actual = await vi.importActual('react');
  return {
    ...actual,
    useTransition: () => [false, (cb: () => void) => cb()],
  };
});

describe('useFieldRegistryForm', () => {
  const mockRouter = {
    replace: vi.fn(),
    push: vi.fn(),
    refresh: vi.fn(),
  };

  const mockRefreshList = vi.fn().mockResolvedValue(true);

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue(mockRouter as any);
    vi.mocked(useSearchParams).mockReturnValue({
      get: vi.fn().mockReturnValue(null),
      toString: vi.fn().mockReturnValue(''),
    } as any);
    vi.mocked(usePathname).mockReturnValue('/mock-path');
    vi.mocked(usePathname).mockReturnValue('/mock-path');

    // Mock window.location and history
    Object.defineProperty(window, 'location', {
      value: { search: '' },
      writable: true
    });
    vi.spyOn(window.history, 'replaceState').mockImplementation(() => {});
  });

  const emptyFields: any[] = [];
  const emptySchemas: any[] = [];
  const emptyTables: any[] = [];
  const emptyTableFields: any[] = [];
  const emptyObject = {};

  it('should initialize with default state', async () => {
    const { result } = renderHook(() => useFieldRegistryForm(emptyFields, mockRefreshList, emptySchemas, emptyTables, emptyTableFields, emptyObject));

    await waitFor(() => {
      expect(result.current.sourceModule).toBe('');
      expect(result.current.sourceTable).toBe('');
      expect(result.current.fieldConfigs.length).toBe(1);
      expect(result.current.fieldConfigs[0].fieldName).toEqual([]);
      expect(result.current.tables).toEqual([]);
    });
  });

  it('should load tables if action provided', async () => {
    const mockGetTables = vi.fn().mockResolvedValue({
      success: true,
      data: [{ id: 1, name: 'Table A' }],
    });

    const { result } = renderHook(() => 
      useFieldRegistryForm(emptyFields, mockRefreshList, emptySchemas, emptyTables, emptyTableFields, { getSourceTablesAction: mockGetTables })
    );

    await waitFor(() => {
      expect(result.current.tables).toEqual([{ id: 1, name: 'Table A' }]);
    });
    expect(mockGetTables).toHaveBeenCalled();
  });

  it('should add and remove field configs', async () => {
    const { result } = renderHook(() => useFieldRegistryForm(emptyFields, mockRefreshList, emptySchemas, emptyTables, emptyTableFields, emptyObject));

    await waitFor(() => {
      expect(result.current.fieldConfigs.length).toBe(1);
    });

    act(() => {
      result.current.addFieldConfig();
    });
    expect(result.current.fieldConfigs.length).toBe(2);

    act(() => {
      result.current.deleteFieldConfig(0);
    });
    expect(result.current.fieldConfigs.length).toBe(1);
  });

  it('should validate before submitting and show error if missing fields', async () => {
    const { result } = renderHook(() => useFieldRegistryForm(emptyFields, mockRefreshList, emptySchemas, emptyTables, emptyTableFields, emptyObject));

    await waitFor(() => {
      expect(result.current.fieldConfigs.length).toBe(1);
    });

    await act(async () => {
      await result.current.handleAddFieldToRegistry();
    });

    expect(toast.error).toHaveBeenCalledWith('messages.fillRequiredMasterFields');
  });

  it('should submit successfully when all fields provided', async () => {
    vi.mocked(addBulkUpdateDefinitionAction).mockResolvedValue({ success: true } as any);
    
    const mockFields = [{ id: 10, tableFieldName: 'col1' }] as any;
    const mockGetTableFields = vi.fn().mockResolvedValue({ success: true, data: mockFields }) as any;
    const mockActions = {
      getSourceTableFieldsAction: mockGetTableFields,
    };

    const { result } = renderHook(() => 
      useFieldRegistryForm(emptyFields, mockRefreshList, emptySchemas, emptyTables, emptyTableFields, mockActions)
    );

    act(() => {
      result.current.setSourceModule('Mod1');
      result.current.setSourceTable('100');
      result.current.setUpdateCode('TEST_CODE');
      result.current.updateFieldConfig(0, { fieldName: ['col1'] });
    });

    await waitFor(() => {
      expect(result.current.sourceTableFields.length).toBeGreaterThan(0);
    });

    await act(async () => {
      await result.current.handleAddFieldToRegistry();
    });

    expect(addBulkUpdateDefinitionAction).toHaveBeenCalledWith({
      updateName: 'TEST_CODE',
      tableId: 100,
      tableFieldIds: [10],
      isApprovalRequired: false,
    });
    expect(toast.success).toHaveBeenCalledWith('messages.fieldSavedSuccessfully');
    expect(mockRefreshList).toHaveBeenCalled();
  });
});
