import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useSocialAttributePagination } from '@/hooks/social-attribute-master/useSocialAttributePagination';
import { useRouter } from 'next/navigation';

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

describe('useSocialAttributePagination', () => {
  const mockPush = vi.fn();
  const mockStartTransition = vi.fn((cb) => cb());

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue({
      push: mockPush,
    } as unknown as ReturnType<typeof useRouter>);
  });

  const defaultProps = {
    pageNumber: 1,
    pageSize: 10,
    totalCount: 25,
    locale: 'en',
    currentSearchTerm: '',
    startTransition: mockStartTransition,
  };

  it('should calculate pagination info correctly', () => {
    const { result } = renderHook(() => useSocialAttributePagination(defaultProps));

    expect(result.current.paginationInfo).toEqual({
      start: 1,
      end: 10,
      total: 25,
    });
  });

  it('should calculate pagination info correctly for other pages', () => {
    const { result } = renderHook(() =>
      useSocialAttributePagination({ ...defaultProps, pageNumber: 3 })
    );

    expect(result.current.paginationInfo).toEqual({
      start: 21,
      end: 25,
      total: 25,
    });
  });

  it('should build URL correctly', () => {
    const { result } = renderHook(() => useSocialAttributePagination(defaultProps));
    const url = result.current.buildUrl(2, 20, 'test', 'socialAttributeCode', 'asc');
    expect(url).toContain('/en/property-tax/social-attribute-master');
    expect(url).toContain('page=2');
    expect(url).toContain('pageSize=20');
    expect(url).toContain('q=test');
    expect(url).toContain('sortBy=socialAttributeCode');
    expect(url).toContain('sortOrder=asc');
  });

  it('should change page and preserve params', () => {
    const { result } = renderHook(() =>
      useSocialAttributePagination({
        ...defaultProps,
        currentSearchTerm: 'query',
        sortBy: 'socialAttributeName',
        sortOrder: 'desc',
      })
    );

    act(() => {
      result.current.changePage(2);
    });

    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('page=2'));
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('q=query'));
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('sortBy=socialAttributeName'));
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('sortOrder=desc'));
  });

  it('should handle page size change', () => {
    const { result } = renderHook(() => useSocialAttributePagination(defaultProps));

    act(() => {
      result.current.handlePageSizeChange('50');
    });

    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('pageSize=50'));
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('page=1'));
  });
});
