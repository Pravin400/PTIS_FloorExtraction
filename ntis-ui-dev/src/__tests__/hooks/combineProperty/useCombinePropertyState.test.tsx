import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useCombinePropertyState } from '@/hooks/combineProperty/useCombinePropertyState';
import { PropertyCombineDetails } from '@/types/combine-property.types';

describe('useCombinePropertyState', () => {
  it('initializes with default values', () => {
    const { result } = renderHook(() => useCombinePropertyState());

    expect(result.current.reviewData).toEqual([]);
    expect(result.current.isReviewing).toBe(false);
    expect(result.current.remark).toBe('');
    expect(result.current.remarkError).toBe(false);
    expect(result.current.selectedPropertyType).toBe('');
    expect(result.current.showPropertyTypeDropdown).toBe(false);
    expect(result.current.checkedPropertyIds.size).toBe(0);
  });

  it('handles remark changes correctly', () => {
    const { result } = renderHook(() => useCombinePropertyState());

    act(() => {
      result.current.setRemarkError(true);
      result.current.handleRemarkChange('test');
    });

    expect(result.current.remark).toBe('test');
    expect(result.current.remarkError).toBe(false);
  });

  it('handles toggling property check', () => {
    const { result } = renderHook(() => useCombinePropertyState());

    act(() => {
      result.current.togglePropertyCheck(1);
    });
    expect(result.current.checkedPropertyIds.has(1)).toBe(true);
    expect(result.current.checkedCount).toBe(1);

    act(() => {
      result.current.togglePropertyCheck(1);
    });
    expect(result.current.checkedPropertyIds.has(1)).toBe(false);
    expect(result.current.checkedCount).toBe(0);
  });

  it('handles toggling all properties', () => {
    const { result } = renderHook(() => useCombinePropertyState());
    
    const mockData = [
      { propertyId: 1, ownerName: 'A' },
      { propertyId: 2, ownerName: 'A' }
    ] as unknown as PropertyCombineDetails[];

    act(() => {
      result.current.setReviewData(mockData);
    });

    act(() => {
      result.current.toggleAllProperties();
    });
    
    expect(result.current.checkedCount).toBe(2);

    act(() => {
      result.current.toggleAllProperties();
    });

    expect(result.current.checkedCount).toBe(0);
  });

  it('detects different owners', () => {
    const { result } = renderHook(() => useCombinePropertyState());
    
    const mockData = [
      { propertyId: 1, ownerName: 'A', wardNo: 'W1', propertyNo: 'P1' },
      { propertyId: 2, ownerName: 'B', wardNo: 'W2', propertyNo: 'P2' }
    ] as unknown as PropertyCombineDetails[];

    act(() => {
      result.current.setReviewData(mockData);
    });

    act(() => {
      result.current.toggleAllProperties();
    });

    expect(result.current.hasDifferentOwners).toBe(true);
    expect(result.current.differentOwnerProps).toBe('PROPERTY NO.: W2-P2');
  });

  it('clears state correctly', () => {
    const { result } = renderHook(() => useCombinePropertyState());

    act(() => {
      result.current.setIsReviewing(true);
      result.current.handleRemarkChange('test');
      result.current.clearState();
    });

    expect(result.current.isReviewing).toBe(false);
    expect(result.current.remark).toBe('');
  });
});
