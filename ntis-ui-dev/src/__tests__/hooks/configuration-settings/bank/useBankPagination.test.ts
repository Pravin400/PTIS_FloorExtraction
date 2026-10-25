import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useBankPagination } from '@/hooks/configuration-settings/bank/useBankPagination';

const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => new URLSearchParams(),
}));

function makeStartTransition() {
  return vi.fn((cb: () => void) => cb());
}

function makeProps(overrides = {}) {
  return {
    pageNumber: 1,
    pageSize: 10,
    totalCount: 50,
    locale: 'en',
    currentSearchTerm: '',
    filterState: undefined,
    startTransition: makeStartTransition(),
    ...overrides,
  };
}

describe('useBankPagination', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('buildUrl', () => {
    it('should build a URL with page and pageSize', () => {
      const { result } = renderHook(() => useBankPagination(makeProps()));
      const url = result.current.buildUrl(2, 10);
      expect(url).toContain('/en/configuration-settings/bank-master');
      expect(url).toContain('page=2');
      expect(url).toContain('pageSize=10');
    });

    it('should include search term when provided', () => {
      const { result } = renderHook(() => useBankPagination(makeProps()));
      const url = result.current.buildUrl(1, 10, 'hdfc');
      expect(url).toContain('search=hdfc');
    });

    it('should omit search param when searchTerm is empty', () => {
      const { result } = renderHook(() => useBankPagination(makeProps()));
      const url = result.current.buildUrl(1, 10, '');
      expect(url).not.toContain('search=');
    });

    it('should include state filter when not "all"', () => {
      const { result } = renderHook(() => useBankPagination(makeProps()));
      const url = result.current.buildUrl(1, 10, '', 'Maharashtra');
      expect(url).toContain('state=Maharashtra');
    });

    it('should omit state param when value is "all"', () => {
      const { result } = renderHook(() => useBankPagination(makeProps()));
      const url = result.current.buildUrl(1, 10, '', 'all');
      expect(url).not.toContain('state=');
    });
  });

  describe('changePage', () => {
    it('should call router.push with the correct URL for a given page', () => {
      const startTransition = makeStartTransition();
      const { result } = renderHook(() => useBankPagination(makeProps({ startTransition })));

      act(() => {
        result.current.changePage(3);
      });

      expect(mockPush).toHaveBeenCalledOnce();
      expect(mockPush.mock.calls[0][0]).toContain('page=3');
    });

    it('should preserve current search term when changing page', () => {
      const startTransition = makeStartTransition();
      const { result } = renderHook(() =>
        useBankPagination(makeProps({ startTransition, currentSearchTerm: 'icici' }))
      );

      act(() => {
        result.current.changePage(2);
      });

      expect(mockPush.mock.calls[0][0]).toContain('search=icici');
    });
  });

  describe('handlePageSizeChange', () => {
    it('should reset to page 1 when page size changes', () => {
      const startTransition = makeStartTransition();
      const { result } = renderHook(() =>
        useBankPagination(makeProps({ pageNumber: 3, startTransition }))
      );

      act(() => {
        result.current.handlePageSizeChange('25');
      });

      const calledUrl = mockPush.mock.calls[0][0];
      expect(calledUrl).toContain('page=1');
      expect(calledUrl).toContain('pageSize=25');
    });
  });

  describe('paginationInfo', () => {
    it('should compute start/end/total correctly for first page', () => {
      const { result } = renderHook(() =>
        useBankPagination(makeProps({ pageNumber: 1, pageSize: 10, totalCount: 50 }))
      );

      expect(result.current.paginationInfo.start).toBe(1);
      expect(result.current.paginationInfo.end).toBe(10);
      expect(result.current.paginationInfo.total).toBe(50);
    });

    it('should compute start/end correctly for a middle page', () => {
      const { result } = renderHook(() =>
        useBankPagination(makeProps({ pageNumber: 3, pageSize: 10, totalCount: 50 }))
      );

      expect(result.current.paginationInfo.start).toBe(21);
      expect(result.current.paginationInfo.end).toBe(30);
    });

    it('should cap end at totalCount on the last partial page', () => {
      const { result } = renderHook(() =>
        useBankPagination(makeProps({ pageNumber: 5, pageSize: 10, totalCount: 47 }))
      );

      expect(result.current.paginationInfo.start).toBe(41);
      expect(result.current.paginationInfo.end).toBe(47);
    });

    it('should return start=0 and end=0 when totalCount is 0', () => {
      const { result } = renderHook(() =>
        useBankPagination(makeProps({ pageNumber: 1, pageSize: 10, totalCount: 0 }))
      );

      expect(result.current.paginationInfo.start).toBe(0);
      expect(result.current.paginationInfo.total).toBe(0);
    });
  });
});
