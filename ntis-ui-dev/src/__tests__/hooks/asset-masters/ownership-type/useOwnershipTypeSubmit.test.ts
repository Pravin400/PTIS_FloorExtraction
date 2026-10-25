/* eslint-disable @typescript-eslint/no-explicit-any */
import { act, renderHook } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { vi, describe, it, expect } from 'vitest';
import { useOwnershipTypeSubmit } from '@/hooks/asset-masters/ownership-type/useOwnershipTypeSubmit';

vi.mock('@/app/[locale]/assets/configuration/master-data/ownership-type/actions', () => ({
  createOwnershipTypeAction: vi.fn(),
  updateOwnershipTypeAction: vi.fn(),
  saveOwnershipTypeAction: vi.fn()
}));
vi.mock('next/navigation', () => ({ useRouter: vi.fn() }));
vi.mock('react-hot-toast', () => ({ default: { success: vi.fn(), error: vi.fn() } }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('next-intl', () => ({ useTranslations: () => (key: string) => key }));

describe('useOwnershipTypeSubmit', () => {
  it('initializes', () => {
    const props = {} as any;
    const { result } = renderHook(() => useOwnershipTypeSubmit(props));
    expect(result.current.handleSubmit).toBeDefined();
  });

  it('sets field error and shows toast on duplicate error response', async () => {
    const { createOwnershipTypeAction } = await import('@/app/[locale]/assets/configuration/master-data/ownership-type/actions');
    (createOwnershipTypeAction as any).mockResolvedValueOnce({ success: false, error: 'duplicate' });

    const setErrors = vi.fn();
    const setTouched = vi.fn();
    const setOpen = vi.fn();
    const validate = vi.fn().mockReturnValue({});
    const mockT = vi.fn((key: string) => {
      if (key === 'configuration.masterData.form.errors.nameDuplicate') return 'This name already exists';
      return key;
    });
    const mockTCommon = vi.fn((key: string) => key);

    const props = {
      isEdit: false,
      locale: 'en',
      formData: { ownershipTypeName: 'Existing Type', description: '', isActive: true },
      validate,
      setErrors,
      setTouched,
      setOpen,
      t: mockT,
      tCommon: mockTCommon,
    } as any;

    const { result } = renderHook(() => useOwnershipTypeSubmit(props));
    const fakeEvent = { preventDefault: vi.fn() } as any;

    await (await import('@testing-library/react')).act(async () => {
      await result.current.handleSubmit(fakeEvent);
    });

    expect(setErrors).toHaveBeenCalledWith(expect.any(Function));
    const stateUpdater = setErrors.mock.calls[setErrors.mock.calls.length - 1][0];
    const newErrors = stateUpdater({});
    expect(newErrors.ownershipTypeName).toBe('This name already exists');
    expect(setTouched).toHaveBeenCalledWith(expect.any(Function));
  });

  it('puts the deactivate reference error on isActive', async () => {
    const { updateOwnershipTypeAction } = await import('@/app/[locale]/assets/configuration/master-data/ownership-type/actions');
    const { toast } = await import('sonner');
    (updateOwnershipTypeAction as any).mockResolvedValueOnce({
      success: false,
      error: 'This Ownership Type cannot be deactivated because it is in use.',
      statusCode: 400,
    });
    (useRouter as any).mockReturnValue({ push: vi.fn(), refresh: vi.fn() });

    const setErrors = vi.fn();
    const props = {
      isEdit: true,
      locale: 'en',
      formData: { id: 1, ownershipTypeName: 'Owned', description: '', isActive: false },
      validate: vi.fn().mockReturnValue({}),
      setErrors,
      setTouched: vi.fn(),
      setOpen: vi.fn(),
      t: (key: string) => key,
      tCommon: (key: string) => key,
    } as any;

    const { result } = renderHook(() => useOwnershipTypeSubmit(props));
    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as any);
    });

    const stateUpdater = setErrors.mock.calls[setErrors.mock.calls.length - 1][0];
    expect(stateUpdater({})).toEqual({ isActive: 'apiErrors.referenceBlocked.ownershipType.deactivateInUse' });
    expect(toast.error).toHaveBeenCalledWith('apiErrors.referenceBlocked.ownershipType.deactivateInUse');
  });
});
