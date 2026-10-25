/* eslint-disable @typescript-eslint/no-explicit-any */
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useFloorFormState } from '@/hooks/ptis/QuickDataEntry/Olddetails/useFloorFormState';
import { useRouter, useSearchParams } from 'next/navigation';

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    replace: vi.fn(),
  })),
  useSearchParams: vi.fn(() => new URLSearchParams()),
  usePathname: vi.fn(() => '/test-path'),
}));

describe('useFloorFormState', () => {
  const mockReplace = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue({ replace: mockReplace } as any);
    vi.mocked(useSearchParams).mockReturnValue(new URLSearchParams() as any);
  });

  it('should initialize with default empty state', () => {
    const { result } = renderHook(() => useFloorFormState());

    expect(result.current.formData.oldFloorId).toBe('');
    expect(result.current.formData.oldConstructionYear).toBe('');
  });

  it('should update state when handleEdit is called', () => {
    const { result } = renderHook(() => useFloorFormState());
    const mockRow = {
      id: 1,
      oldFloorId: 10,
      oldSubFloorId: 20,
      oldConstructionYear: '2020',
      oldConstructionTypeId: 2,
      oldTypeOfUseId: 3,
      oldSubTypeOfUseId: 4,
      oldCarpetAreaSqFeet: 100,
    };

    act(() => {
      result.current.handleEdit(mockRow as any);
    });

    expect(result.current.formData.id).toBe(1);
    expect(result.current.formData.oldFloorId).toBe('10');
    expect(mockReplace).toHaveBeenCalledWith(expect.stringContaining('typeOfUseId=3'), expect.any(Object));
  });

  it('should sync oldTypeOfUseId to URL search params', () => {
    const { result } = renderHook(() => useFloorFormState());

    act(() => {
      result.current.handleUseTypeChange('5');
    });

    expect(result.current.formData.oldTypeOfUseId).toBe('5');
    expect(mockReplace).toHaveBeenCalledWith(expect.stringContaining('typeOfUseId=5'), expect.any(Object));
  });

  it('should reset state and sync URL when handleReset is called', () => {
    // Mock searchParams with an existing value
    const searchParams = new URLSearchParams('typeOfUseId=5');
    (useSearchParams as any).mockReturnValue(searchParams);

    const { result } = renderHook(() => useFloorFormState());

    act(() => {
      result.current.setFormData({ oldFloorId: '1' } as any);
      result.current.handleReset();
    });

    expect(result.current.formData.oldFloorId).toBe('');
    expect(mockReplace).toHaveBeenCalled();
  });
});
