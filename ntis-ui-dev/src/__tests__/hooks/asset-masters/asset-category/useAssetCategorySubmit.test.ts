/* eslint-disable @typescript-eslint/no-explicit-any */
import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useAssetCategorySubmit } from '@/hooks/asset-masters/asset-category/useAssetCategorySubmit';
import { saveAssetCategoryAction } from '@/app/[locale]/assets/configuration/master-data/asset-category/actions';
import { toast } from 'sonner';

vi.mock('@/app/[locale]/assets/configuration/master-data/asset-category/actions', () => ({
  saveAssetCategoryAction: vi.fn()
}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() })
}));
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() }
}));

describe('useAssetCategorySubmit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const baseProps: any = {
    isEdit: false,
    locale: 'en',
    formData: {
      code: 'CAT01',
      name: 'Category Name',
      description: 'Desc',
      isMovable: false,
      hasFloorDetails: false,
      hasInventory: false,
      isInventoryMandatory: false,
      hasLegalCompliance: false,
      valuationType: 'FIXED_ASSET',
      isActive: true,
    },
    validate: vi.fn(() => ({})),
    setErrors: vi.fn(),
    setTouched: vi.fn(),
    setSubmittedOnce: vi.fn(),
    setOpen: vi.fn(),
    t: (key: string) => key,
    tCommon: (key: string) => key,
  };

  it('initializes correctly', () => {
    const { result } = renderHook(() => useAssetCategorySubmit(baseProps));
    expect(result.current.handleSubmit).toBeDefined();
    expect(result.current.isSubmitting).toBe(false);
  });

  it('handles code-specific duplicate error', async () => {
    vi.mocked(saveAssetCategoryAction).mockResolvedValue({
      ok: false,
      error: 'duplicate',
      field: 'code',
    } as any);

    const { result } = renderHook(() => useAssetCategorySubmit(baseProps));

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as any);
    });

    expect(baseProps.setErrors).toHaveBeenCalledWith({
      code: 'validation.codeDuplicate',
    });
    expect(toast.error).toHaveBeenCalled();
  });

  it('handles name-specific duplicate error', async () => {
    vi.mocked(saveAssetCategoryAction).mockResolvedValue({
      ok: false,
      error: 'duplicate',
      field: 'name',
    } as any);

    const { result } = renderHook(() => useAssetCategorySubmit(baseProps));

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as any);
    });

    expect(baseProps.setErrors).toHaveBeenCalledWith({
      name: 'validation.nameDuplicate',
    });
    expect(toast.error).toHaveBeenCalled();
  });

  it('handles generic duplicate error by marking both code and name', async () => {
    vi.mocked(saveAssetCategoryAction).mockResolvedValue({
      ok: false,
      error: 'duplicate',
      field: 'both',
    } as any);

    const { result } = renderHook(() => useAssetCategorySubmit(baseProps));

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as any);
    });

    expect(baseProps.setErrors).toHaveBeenCalledWith({
      code: 'validation.codeDuplicate',
      name: 'validation.nameDuplicate',
    });
    expect(toast.error).toHaveBeenCalled();
  });
});
