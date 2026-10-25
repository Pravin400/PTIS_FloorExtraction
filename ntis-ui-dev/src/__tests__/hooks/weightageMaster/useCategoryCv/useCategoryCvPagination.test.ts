import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useCategoryCvPagination } from '@/hooks/weightageMaster/useCategoryCv/useCategoryCvPagination';

// Mock dependencies
const mockPush = vi.fn();
const mockSearchParams = new URLSearchParams('existing=param');

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useSearchParams: () => mockSearchParams,
}));

vi.mock('next-intl', () => ({
  useLocale: () => 'en',
}));

describe('useCategoryCvPagination', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams.set('existing', 'param');
  });

  it('should build URL with existing parameters preserved', () => {
    const { result } = renderHook(() => useCategoryCvPagination(1, 10, 1, 10));
    
    const url = result.current.buildUrl({ page: 2 });
    
    expect(url).toContain('existing=param');
    expect(url).toContain('page=2');
    expect(url).toContain('pageSize=10');
  });

  it('should set default values if missing in current search params', () => {
    const { result } = renderHook(() => useCategoryCvPagination(1, 10, 2, 20));
    
    const url = result.current.buildUrl({ searchTerm: 'test' });
    
    expect(url).toContain('page=1');
    expect(url).toContain('pageSize=10');
    expect(url).toContain('leftPage=2');
    expect(url).toContain('leftPageSize=20');
    expect(url).toContain('searchTerm=test');
  });

  it('should handle changing main table page', () => {
    const { result } = renderHook(() => useCategoryCvPagination(1, 10, 1, 10));
    
    act(() => {
      result.current.changePage(5);
    });
    
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('page=5'));
  });

  it('should handle changing page size and reset main page to 1', () => {
    const { result } = renderHook(() => useCategoryCvPagination(3, 10, 1, 10));
    
    act(() => {
      result.current.changePageSize(50);
    });
    
    const calledUrl = mockPush.mock.calls[0][0];
    expect(calledUrl).toContain('page=1');
    expect(calledUrl).toContain('pageSize=50');
  });

  it('should handle changing left table page', () => {
    const { result } = renderHook(() => useCategoryCvPagination(1, 10, 1, 10));
    
    act(() => {
      result.current.changeLeftPage(2);
    });
    
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('leftPage=2'));
  });

  it('should handle changing left page size and reset left page to 1', () => {
    const { result } = renderHook(() => useCategoryCvPagination(1, 10, 5, 10));
    
    act(() => {
      result.current.changeLeftPageSize(100);
    });
    
    const calledUrl = mockPush.mock.calls[0][0];
    expect(calledUrl).toContain('leftPage=1');
    expect(calledUrl).toContain('leftPageSize=100');
  });

  it('should remove parameter when value is empty string or undefined', () => {
    mockSearchParams.set('extra', 'value');
    const { result } = renderHook(() => useCategoryCvPagination(1, 10, 1, 10));
    
    const url = result.current.buildUrl({ extra: '', searchTerm: undefined });
    
    expect(url).not.toContain('extra=');
    expect(url).not.toContain('searchTerm=');
  });
});
