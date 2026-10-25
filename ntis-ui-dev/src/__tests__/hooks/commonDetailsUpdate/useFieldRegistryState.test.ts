/* eslint-disable @typescript-eslint/no-explicit-any */
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useFieldRegistryState } from '@/hooks/commonDetailsUpdate/useFieldRegistryState';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
  usePathname: vi.fn(),
}));

// Mock next-intl
vi.mock('next-intl', () => ({
  useLocale: vi.fn(() => 'en'),
  useTranslations: vi.fn(() => (key: string) => key),
}));

// Mock @/components/common
vi.mock('@/components/common', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
    toast: vi.fn(),
  }),
}));

// Mock useFieldRegistryForm to isolate state tests
vi.mock('@/hooks/commonDetailsUpdate/useFieldRegistryForm', () => ({
  useFieldRegistryForm: vi.fn(() => ({
    mockFormState: true,
  })),
}));

describe('useFieldRegistryState', () => {
  const mockRouter = {
    push: vi.fn(),
    replace: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue(mockRouter as any);
    vi.mocked(useSearchParams).mockReturnValue({
      get: vi.fn().mockReturnValue(null),
      toString: vi.fn().mockReturnValue(''),
    } as any);
    vi.mocked(usePathname).mockReturnValue('/mock-path');
  });

  const emptyArray1: any[] = [];
  const emptyArray2: any[] = [];
  const emptyArray3: any[] = [];
  const emptyArray4: any[] = [];
  const emptyObject = {};

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useFieldRegistryState(emptyArray1, emptyArray2, emptyArray3, emptyArray4, emptyObject));
    
    expect(result.current.fields).toEqual([]);
    expect(result.current.totalCount).toBe(0);
    expect(result.current.statusFilter).toBe('all');
    expect(result.current.searchTerm).toBe('');
    expect(result.current.pageNumber).toBe(1);
    expect(result.current.pageSize).toBe(10);
  });

  it('should initialize with provided initial fields array', () => {
    const mockFields = [{ id: 1, fieldName: 'test' }] as any;
    const { result } = renderHook(() => useFieldRegistryState(mockFields, emptyArray2, emptyArray3, emptyArray4, emptyObject));
    
    expect(result.current.fields).toEqual(mockFields);
    expect(result.current.totalCount).toBe(1);
  });

  it('should initialize with provided initial fields object', () => {
    const mockFieldsObj = {
      items: [{ id: 1, fieldName: 'test' }],
      totalCount: 5,
    } as any;
    const { result } = renderHook(() => useFieldRegistryState(mockFieldsObj, emptyArray2, emptyArray3, emptyArray4, emptyObject));
    
    expect(result.current.fields).toEqual((mockFieldsObj as any).items);
    expect(result.current.totalCount).toBe(5);
  });

  it('should update URL when search term changes', () => {
    const { result } = renderHook(() => useFieldRegistryState(emptyArray1, emptyArray2, emptyArray3, emptyArray4, emptyObject));
    
    act(() => {
      result.current.setSearchTerm('new search');
    });

    expect(result.current.searchTerm).toBe('new search');
    expect(mockRouter.replace).toHaveBeenCalledWith(
      '/mock-path?searchTerm=new+search&pageNumber=1',
      { scroll: false }
    );
  });

  it('should update URL when page number changes', () => {
    const { result } = renderHook(() => useFieldRegistryState(emptyArray1, emptyArray2, emptyArray3, emptyArray4, emptyObject));
    
    act(() => {
      result.current.setPageNumber(2);
    });

    expect(result.current.pageNumber).toBe(2);
    expect(mockRouter.replace).toHaveBeenCalledWith(
      '/mock-path?pageNumber=2&pageSize=10',
      { scroll: false }
    );
  });

  it('should update URL and reset page number when page size changes', () => {
    const { result } = renderHook(() => useFieldRegistryState(emptyArray1, emptyArray2, emptyArray3, emptyArray4, emptyObject));
    
    act(() => {
      // First change page number to verify it gets reset
      result.current.setPageNumber(2);
    });
    
    act(() => {
      result.current.setPageSize(20);
    });

    expect(result.current.pageSize).toBe(20);
    expect(result.current.pageNumber).toBe(1);
    expect(mockRouter.replace).toHaveBeenCalledWith(
      '/mock-path?pageSize=20&pageNumber=1',
      { scroll: false }
    );
  });

  it('should refresh fields list using provided action', async () => {
    const mockAction = vi.fn().mockResolvedValue({
      success: true,
      data: {
        items: [{ id: 2, fieldName: 'refreshed' }],
        totalCount: 1,
      },
    });

    const mockActions = { getFieldRegistriesAction: mockAction };
    const { result } = renderHook(() => 
      useFieldRegistryState(emptyArray1, emptyArray2, emptyArray3, emptyArray4, mockActions)
    );

    await act(async () => {
      await result.current.refreshFieldsList();
    });

    expect(mockAction).toHaveBeenCalledWith(1, -1, undefined, undefined);
    expect(result.current.fields).toEqual([{ id: 2, fieldName: 'refreshed' }]);
    expect(result.current.totalCount).toBe(1);
  });
});
