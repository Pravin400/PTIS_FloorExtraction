import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useScreenAccessPagination } from '@/hooks/configuration-settings/screenAccess/useScreenAccessPagination';

const mockUpdateQueries = vi.fn();
vi.mock('@/hooks/useQueryTransition', () => ({
  useQueryTransition: () => ({
    isPending: false,
    updateQueries: mockUpdateQueries,
  }),
}));

describe('useScreenAccessPagination', () => {
  beforeEach(() => {
    mockUpdateQueries.mockClear();
  });

  it('should handle page change correctly', () => {
    const { result } = renderHook(() => useScreenAccessPagination());

    act(() => {
      result.current.handlePageChange(2);
    });
    expect(mockUpdateQueries).toHaveBeenCalledWith({ page: 2 });

    act(() => {
      result.current.handlePageChange(1);
    });
    expect(mockUpdateQueries).toHaveBeenCalledWith({ page: null });
  });

  it('should handle custom parameter keys', () => {
    const { result } = renderHook(() =>
      useScreenAccessPagination({
        pageParamKey: 'p',
        pageSizeParamKey: 'size',
      })
    );

    act(() => {
      result.current.handlePageChange(3);
    });
    expect(mockUpdateQueries).toHaveBeenCalledWith({ p: 3 });

    act(() => {
      result.current.handlePageSizeChange(50);
    });
    expect(mockUpdateQueries).toHaveBeenCalledWith(
      { size: 50 },
      { resetPage: true, pageParamKey: 'p' }
    );
  });

  it('should handle page size change and reset page', () => {
    const { result } = renderHook(() => useScreenAccessPagination());

    act(() => {
      result.current.handlePageSizeChange(25);
    });
    expect(mockUpdateQueries).toHaveBeenCalledWith(
      { pageSize: 25 },
      { resetPage: true, pageParamKey: 'page' }
    );
  });
});
