import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useCombinePropertyFilters, compareSubProperty } from '@/hooks/combineProperty/useCombinePropertyFilters';
import { CombinePropertyItem } from '@/types/combine-property.types';
import { toast } from 'sonner';

const mockPush = vi.fn();
const mockReplace = vi.fn();
let mockSearchParamsData = new URLSearchParams();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
  usePathname: () => '/test-path',
  useSearchParams: () => mockSearchParamsData,
}));

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
  },
}));

describe('useCombinePropertyFilters', () => {
  const mockBaseList = [
    { id: 1, wardId: 10, wardNo: 'W1', propertyNo: 'P1' } as CombinePropertyItem
  ];
  const mockSubList = [
    { id: 2, fromProperty: 'P2', propertyNo: 'P2' } as CombinePropertyItem,
    { id: 3, fromProperty: 'P3', propertyNo: 'P3' } as CombinePropertyItem,
    { id: 4, fromProperty: 'P4', propertyNo: 'P4' } as CombinePropertyItem
  ];
  const mockT = vi.fn((k) => k);
  const mockOnClearReview = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParamsData = new URLSearchParams();
  });

  it('initializes with default values', () => {
    const { result } = renderHook(() => 
      useCombinePropertyFilters(mockBaseList, mockSubList, mockT, mockOnClearReview)
    );

    expect(result.current.selectionMethod).toBe('range');
    expect(result.current.rangeFrom).toBe('');
    expect(result.current.rangeTo).toBe('');
    expect(result.current.selectedProperties).toEqual([]);
    expect(result.current.selectedCount).toBe(0);
    expect(result.current.isRangeInvalid).toBe(false);
  });

  it('handles base property change', () => {
    const { result } = renderHook(() => 
      useCombinePropertyFilters(mockBaseList, mockSubList, mockT, mockOnClearReview)
    );

    act(() => {
      result.current.handleBasePropertyChange('baseProperty', '1');
    });

    expect(mockOnClearReview).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith('/test-path?basePropertyId=1&wardId=10&wardNo=W1&propertyNo=P1');
  });

  it('handles method change', () => {
    const { result } = renderHook(() => 
      useCombinePropertyFilters(mockBaseList, mockSubList, mockT, mockOnClearReview)
    );

    act(() => {
      result.current.handleMethodChange('individual');
    });

    expect(mockOnClearReview).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith('/test-path?method=individual');
  });

  it('handles range changes and calculates properties correctly', () => {
    const { result, rerender } = renderHook(() => 
      useCombinePropertyFilters(mockBaseList, mockSubList, mockT, mockOnClearReview)
    );

    act(() => {
      result.current.handleRangeFromChange('from', '2');
    });
    
    expect(mockReplace).toHaveBeenCalledWith('/test-path?from=2&showHistory=false', { scroll: false });
    expect(mockOnClearReview).toHaveBeenCalled();

    // Now pretend searchParams updated
    mockSearchParamsData = new URLSearchParams('from=2');
    rerender();
    
    act(() => {
      result.current.handleRangeToChange('to', '4');
    });

    expect(mockReplace).toHaveBeenCalledWith('/test-path?from=2&to=4&showHistory=false', { scroll: false });
    
    // Update searchParams to simulate the final URL state
    mockSearchParamsData = new URLSearchParams('from=2&to=4');
    rerender();

    expect(result.current.computedCombinePartitionNo).toBe('P2,P3,P4');
    expect(result.current.computedPropertyNos).toBe('P2,P3,P4');
  });

  it('does not clobber locally selected rangeTo when URL resolves an updated from param', () => {
    const { result, rerender } = renderHook(() =>
      useCombinePropertyFilters(mockBaseList, mockSubList, mockT, mockOnClearReview)
    );

    act(() => {
      result.current.handleRangeFromChange('from', '2');
      result.current.handleRangeToChange('to', '3');
    });

    expect(result.current.rangeTo).toBe('3');

    // Simulate router resolving 'from=2' while 'to' has not yet updated in searchParams
    mockSearchParamsData = new URLSearchParams('from=2');
    rerender();

    // Local rangeTo must still be '3', not clobbered back to ''
    expect(result.current.rangeFrom).toBe('2');
    expect(result.current.rangeTo).toBe('3');
  });

  it('shows error if range is invalid', () => {
    mockSearchParamsData = new URLSearchParams('from=4');
    const { result } = renderHook(() => 
      useCombinePropertyFilters(mockBaseList, mockSubList, mockT, mockOnClearReview)
    );

    act(() => {
      result.current.handleRangeToChange('to', '2');
    });

    expect(toast.error).toHaveBeenCalledWith('rangeInvalidError');
  });

  it('handles individual changes', () => {
    mockSearchParamsData = new URLSearchParams('method=individual');
    const { result, rerender } = renderHook(() => 
      useCombinePropertyFilters(mockBaseList, mockSubList, mockT, mockOnClearReview)
    );

    act(() => {
      result.current.handleIndividualChange(['2', '4']);
    });

    expect(mockReplace).toHaveBeenCalledWith('/test-path?method=individual&showHistory=false', { scroll: false });
    
    // Simulate re-render to verify computed properties
    rerender();
    expect(result.current.individualSelection).toEqual(['2', '4']);
    expect(result.current.computedCombinePartitionNo).toBe('P2,P4');
    expect(result.current.computedPropertyNos).toBe('P2,P4');
  });

  it('clears filters correctly', () => {
    mockSearchParamsData = new URLSearchParams('basePropertyId=1&wardId=10&method=individual&individual=2');
    const { result } = renderHook(() =>
      useCombinePropertyFilters(mockBaseList, mockSubList, mockT, mockOnClearReview)
    );

    act(() => {
      result.current.clearFilters();
    });

    expect(mockPush).toHaveBeenCalledWith('/test-path?basePropertyId=1&wardId=10&method=individual');
  });

  // Regression coverage for a reported bug: Base Property "12-1" (propertyNo "12", partition "1")
  // as From and "13" (propertyNo "13", no partition) as To was incorrectly flagged invalid,
  // because the old sort ordered candidates by partition alone — an empty partition sorts before
  // any non-empty one, so "13" ranked ahead of "12-1" regardless of the real property numbers.
  describe('range validation with mixed partitioned/un-partitioned properties', () => {
    const mixedList = [
      { id: 100, propertyNo: '12', fromProperty: '1' } as CombinePropertyItem, // "12-1"
      { id: 101, propertyNo: '13', fromProperty: '' } as CombinePropertyItem, // "13"
    ];

    it('does not flag "12-1" -> "13" as invalid', () => {
      mockSearchParamsData = new URLSearchParams('from=100');
      const { result } = renderHook(() =>
        useCombinePropertyFilters(mockBaseList, mixedList, mockT, mockOnClearReview)
      );

      act(() => {
        result.current.handleRangeToChange('to', '101');
      });

      expect(toast.error).not.toHaveBeenCalled();
    });

    it('still flags a genuinely reversed range ("13" -> "12-1") as invalid', () => {
      mockSearchParamsData = new URLSearchParams('from=101');
      const { result } = renderHook(() =>
        useCombinePropertyFilters(mockBaseList, mixedList, mockT, mockOnClearReview)
      );

      act(() => {
        result.current.handleRangeToChange('to', '100');
      });

      expect(toast.error).toHaveBeenCalledWith('rangeInvalidError');
    });
  });
});

describe('compareSubProperty', () => {
  const item = (propertyNo: string, fromProperty: string) =>
    ({ propertyNo, fromProperty } as CombinePropertyItem);

  it('orders a partitioned property before a higher, un-partitioned one (the reported bug case)', () => {
    expect(compareSubProperty(item('12', '1'), item('13', ''))).toBeLessThan(0);
    expect(compareSubProperty(item('13', ''), item('12', '1'))).toBeGreaterThan(0);
  });

  it('falls back to comparing the partition when property numbers match', () => {
    expect(compareSubProperty(item('12', '1'), item('12', '2'))).toBeLessThan(0);
    expect(compareSubProperty(item('12', '2'), item('12', '1'))).toBeGreaterThan(0);
  });

  it('sorts property numbers numerically, not lexicographically', () => {
    expect(compareSubProperty(item('2', ''), item('10', ''))).toBeLessThan(0);
  });

  it('returns 0 for identical property/partition values', () => {
    expect(compareSubProperty(item('12', '1'), item('12', '1'))).toBe(0);
  });
});
