import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { usePayrollMasterFilters } from '@/hooks/payroll/usePayrollMasterFilters';

const mockReplace = vi.fn();
let currentSearchParams = new URLSearchParams('');

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: mockReplace,
    push: vi.fn(),
    refresh: vi.fn(),
  }),
  useSearchParams: () => currentSearchParams,
  usePathname: () => '/payroll/organisation-masters/department-master',
}));

describe('usePayrollMasterFilters', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    currentSearchParams = new URLSearchParams('');
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('initializes with default values when search params are empty', () => {
    const { result } = renderHook(() => usePayrollMasterFilters());

    expect(result.current.pageNumber).toBe(1);
    expect(result.current.pageSize).toBe(10);
    expect(result.current.search).toBe('');
    expect(result.current.statusFilter).toBe('all');
    expect(result.current.isPending).toBe(false);
  });

  it('parses valid search params from URL', () => {
    currentSearchParams = new URLSearchParams('page=3&pageSize=25&q=Admin&status=active');

    const { result } = renderHook(() => usePayrollMasterFilters());

    expect(result.current.pageNumber).toBe(3);
    expect(result.current.pageSize).toBe(25);
    expect(result.current.search).toBe('Admin');
    expect(result.current.statusFilter).toBe('active');
  });

  it('normalizes status and handles invalid search params gracefully', () => {
    currentSearchParams = new URLSearchParams('page=-5&pageSize=abc&status=INACTIVE');

    const { result } = renderHook(() => usePayrollMasterFilters({ defaultPageSize: 15 }));

    expect(result.current.pageNumber).toBe(1);
    expect(result.current.pageSize).toBe(15);
    expect(result.current.statusFilter).toBe('inactive');
  });

  it('debounces search input changes and updates URL params', () => {
    const { result } = renderHook(() => usePayrollMasterFilters({ debounceMs: 400 }));

    act(() => {
      result.current.handleSearchChange('Finance');
    });

    expect(result.current.search).toBe('Finance');
    expect(mockReplace).not.toHaveBeenCalled();

    // Fast-forward time before debounceMs
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(mockReplace).not.toHaveBeenCalled();

    // Fast-forward past debounceMs
    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(mockReplace).toHaveBeenCalledWith(
      '/payroll/organisation-masters/department-master?q=Finance',
      { scroll: false }
    );
  });

  it('updates status filter and resets page to 1 immediately', () => {
    currentSearchParams = new URLSearchParams('page=4');
    const { result } = renderHook(() => usePayrollMasterFilters());

    act(() => {
      result.current.handleStatusChange('active');
    });

    expect(result.current.statusFilter).toBe('active');
    expect(mockReplace).toHaveBeenCalledWith(
      '/payroll/organisation-masters/department-master?status=active',
      { scroll: false }
    );
  });

  it('handles page navigation changes', () => {
    const { result } = renderHook(() => usePayrollMasterFilters());

    act(() => {
      result.current.handlePageChange(2);
    });

    expect(mockReplace).toHaveBeenCalledWith(
      '/payroll/organisation-masters/department-master?page=2',
      { scroll: false }
    );
  });

  it('handles page size changes and resets page to 1', () => {
    currentSearchParams = new URLSearchParams('page=3');
    const { result } = renderHook(() => usePayrollMasterFilters());

    act(() => {
      result.current.handlePageSizeChange(20);
    });

    expect(mockReplace).toHaveBeenCalledWith(
      '/payroll/organisation-masters/department-master?pageSize=20',
      { scroll: false }
    );
  });

  it('cycles through sort order (asc -> desc -> none)', () => {
    const { result } = renderHook(() => usePayrollMasterFilters());

    // First click -> asc
    act(() => {
      result.current.handleSort('departmentName');
    });
    expect(mockReplace).toHaveBeenCalledWith(
      '/payroll/organisation-masters/department-master?sortBy=departmentName&sortOrder=asc',
      { scroll: false }
    );

    // Second click -> desc
    currentSearchParams = new URLSearchParams('sortBy=departmentName&sortOrder=asc');
    const { result: result2 } = renderHook(() => usePayrollMasterFilters());
    act(() => {
      result2.current.handleSort('departmentName');
    });
    expect(mockReplace).toHaveBeenCalledWith(
      '/payroll/organisation-masters/department-master?sortBy=departmentName&sortOrder=desc',
      { scroll: false }
    );

    // Third click -> cleared
    currentSearchParams = new URLSearchParams('sortBy=departmentName&sortOrder=desc');
    const { result: result3 } = renderHook(() => usePayrollMasterFilters());
    act(() => {
      result3.current.handleSort('departmentName');
    });
    expect(mockReplace).toHaveBeenCalledWith(
      '/payroll/organisation-masters/department-master',
      { scroll: false }
    );
  });
});
