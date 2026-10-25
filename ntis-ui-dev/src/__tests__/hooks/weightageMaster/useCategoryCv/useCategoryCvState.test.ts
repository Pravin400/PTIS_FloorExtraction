import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useCategoryCvState } from '@/hooks/weightageMaster/useCategoryCv/useCategoryCvState';

describe('useCategoryCvState', () => {
  const currentSelectedYear = '2023-2024';
  const currentTypeOfUse = '100';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with provided values', () => {
    const { result } = renderHook(() => useCategoryCvState(currentSelectedYear, currentTypeOfUse));

    expect(result.current.selectedYear).toBe(currentSelectedYear);
    expect(result.current.typeOfUseId).toBe(currentTypeOfUse);
    expect(result.current.selectedTypeId).toBe(100);
    expect(result.current.factorValue).toBe('1.00');
    expect(result.current.editableRows).toEqual({});
    expect(result.current.isUpdating).toBe(false);
    expect(result.current.isBulkUpdating).toBe(false);
    expect(result.current.isGeneratingAll).toBe(false);
    expect(result.current.toasts).toEqual([]);
  });

  it('should initialize with empty values when not provided', () => {
    const { result } = renderHook(() => useCategoryCvState('', ''));

    expect(result.current.selectedYear).toBe('');
    expect(result.current.typeOfUseId).toBe('');
    expect(result.current.selectedTypeId).toBeNull();
  });

  it('should update state values correctly', () => {
    const { result } = renderHook(() => useCategoryCvState('', ''));

    act(() => {
      result.current.setSelectedYear('2024-2025');
      result.current.setTypeOfUseId('200');
      result.current.setSelectedTypeId(200);
      result.current.setFactorValue('1.5');
      result.current.setIsUpdating(true);
    });

    expect(result.current.selectedYear).toBe('2024-2025');
    expect(result.current.typeOfUseId).toBe('200');
    expect(result.current.selectedTypeId).toBe(200);
    expect(result.current.factorValue).toBe('1.5');
    expect(result.current.isUpdating).toBe(true);
  });

  describe('Toast management', () => {
    it('should add success toast', () => {
      const { result } = renderHook(() => useCategoryCvState('', ''));

      act(() => {
        result.current.addToast('success', 'Operation completed');
      });

      expect(result.current.toasts).toHaveLength(1);
      expect(result.current.toasts[0]).toMatchObject({
        type: 'success',
        message: 'Operation completed'
      });
      expect(result.current.toasts[0].id).toBeDefined();
    });

    it('should add multiple toasts and remove them by ID', () => {
      const { result } = renderHook(() => useCategoryCvState('', ''));

      act(() => {
        result.current.addToast('info', 'First');
        result.current.addToast('error', 'Second');
      });

      expect(result.current.toasts).toHaveLength(2);
      const firstId = result.current.toasts[0].id;

      act(() => {
        result.current.removeToast(firstId);
      });

      expect(result.current.toasts).toHaveLength(1);
      expect(result.current.toasts[0].message).toBe('Second');
    });
  });

  describe('Warning Ref', () => {
    it('should initialize hasShownWarningRef as false', () => {
      const { result } = renderHook(() => useCategoryCvState('', ''));
      expect(result.current.hasShownWarningRef.current).toBe(false);
    });

    it('should allow updating hasShownWarningRef', () => {
      const { result } = renderHook(() => useCategoryCvState('', ''));
      
      act(() => {
        result.current.hasShownWarningRef.current = true;
      });

      expect(result.current.hasShownWarningRef.current).toBe(true);
    });
  });
});
