import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useScreenAccessSearch } from '@/hooks/configuration-settings/screenAccess/useScreenAccessSearch';

const mockUpdateQueries = vi.fn();
vi.mock('@/hooks/useQueryTransition', () => ({
  useQueryTransition: () => ({
    isPending: false,
    updateQueries: mockUpdateQueries,
  }),
}));

describe('useScreenAccessSearch', () => {
  beforeEach(() => {
    mockUpdateQueries.mockClear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should initialize with provided search term', () => {
    const { result } = renderHook(() => useScreenAccessSearch({ initialSearchTerm: 'test' }));
    expect(result.current.searchTerm).toBe('test');
  });

  it('should update search term when external term changes', () => {
    const { result, rerender } = renderHook((props) => useScreenAccessSearch(props), {
      initialProps: { initialSearchTerm: 'initial' },
    });
    expect(result.current.searchTerm).toBe('initial');

    rerender({ initialSearchTerm: 'updated' });
    expect(result.current.searchTerm).toBe('updated');
  });

  it('should debounce search updates and reset page', () => {
    const { result } = renderHook(() => useScreenAccessSearch());

    act(() => {
      result.current.handleSearch('new search');
    });

    expect(result.current.searchTerm).toBe('new search');
    expect(mockUpdateQueries).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(mockUpdateQueries).toHaveBeenCalledWith(
      { search: 'new search' },
      { resetPage: true, pageParamKey: 'page' }
    );
  });

  it('should use custom param keys', () => {
    const { result } = renderHook(() =>
      useScreenAccessSearch({
        searchParamKey: 'q',
        pageParamKey: 'p',
      })
    );

    act(() => {
      result.current.handleSearch('query');
    });

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(mockUpdateQueries).toHaveBeenCalledWith(
      { q: 'query' },
      { resetPage: true, pageParamKey: 'p' }
    );
  });
});
