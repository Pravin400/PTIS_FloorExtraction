/* eslint-disable @typescript-eslint/no-explicit-any */
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useFloorFormApi } from '@/hooks/ptis/QuickDataEntry/Olddetails/useFloorFormApi';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { 
  saveOldFloorDetailsAction, 
  updateOldFloorDetailsAction,
  deleteOldFloorDetailsAction 
} from '@/app/[locale]/property-tax/ptis/QuickDataEntry/[propertyId]/OldDetails/floor-information/action';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    refresh: vi.fn(),
  })),
}));

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('@/app/[locale]/property-tax/ptis/QuickDataEntry/[propertyId]/OldDetails/floor-information/action', () => ({
  saveOldFloorDetailsAction: vi.fn(),
  updateOldFloorDetailsAction: vi.fn(),
  deleteOldFloorDetailsAction: vi.fn(),
}));

vi.mock('@/components/common', () => ({
  useConfirm: vi.fn(() => ({
    confirm: vi.fn(({ onConfirm }) => onConfirm()),
  })),
}));

describe('useFloorFormApi', () => {
  const mockRefresh = vi.fn();
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue({ refresh: mockRefresh } as unknown as ReturnType<typeof useRouter>);
  });

  it('should call saveOldFloorDetailsAction when no ID is provided', async () => {
    (saveOldFloorDetailsAction as any).mockResolvedValue({ success: true });
    const { result } = renderHook(() => useFloorFormApi(123, 'en'));

    await act(async () => {
      await result.current.handleSave({ oldFloorId: '1' } as any, mockOnSuccess);
    });

    expect(saveOldFloorDetailsAction).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalled();
    expect(mockOnSuccess).toHaveBeenCalled();
  });

  it('should call updateOldFloorDetailsAction when ID is provided', async () => {
    (updateOldFloorDetailsAction as any).mockResolvedValue({ success: true });
    const { result } = renderHook(() => useFloorFormApi(123, 'en'));

    await act(async () => {
      await result.current.handleSave({ id: 1, oldFloorId: '1' } as any, mockOnSuccess);
    });

    expect(updateOldFloorDetailsAction).toHaveBeenCalled();
  });

  it('should call deleteOldFloorDetailsAction', async () => {
    (deleteOldFloorDetailsAction as any).mockResolvedValue({ success: true });
    const { result } = renderHook(() => useFloorFormApi(123, 'en'));

    await act(async () => {
      await result.current.handleDelete(1);
    });

    expect(deleteOldFloorDetailsAction).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalled();
  });

  it('should translate Marathi/Devanagari digits to standard digits in the payload', async () => {
    (saveOldFloorDetailsAction as any).mockResolvedValue({ success: true });
    const { result } = renderHook(() => useFloorFormApi(123, 'en'));

    const devanagariFormData = {
      oldFloorId: '1',
      oldSubFloorId: '2',
      oldConstructionYear: '२०२०',
      oldAssessmentYear: '२०२१',
      oldConstructionTypeId: '3',
      oldTypeOfUseId: '4',
      oldSubTypeOfUseId: '5',
      oldAreaSqMeter: '१५.५',
      oldCarpetAreaSqFeet: '१६६.८४',
      oldBuiltupAreaSqFeet: '२००.२१',
      oldBuiltupAreaSqMeter: '१८.६',
    };

    await act(async () => {
      await result.current.handleSave(devanagariFormData as any, mockOnSuccess);
    });

    expect(saveOldFloorDetailsAction).toHaveBeenCalledWith(
      123,
      {
        propertyId: 123,
        oldFloorId: 1,
        oldSubFloorId: 2,
        oldConstructionYear: '2020',
        oldAssessmentYear: '2021',
        oldConstructionTypeId: 3,
        oldTypeOfUseId: 4,
        oldSubTypeOfUseId: 5,
        oldCarpetAreaSqMeter: 15.5,
        oldCarpetAreaSqFeet: 166.84,
        oldBuiltupAreaSqMeter: 18.6,
        oldBuiltupAreaSqFeet: 200.21,
      },
      'en'
    );
  });
});
