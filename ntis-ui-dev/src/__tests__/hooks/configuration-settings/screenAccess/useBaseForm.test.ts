import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useBaseForm } from '@/hooks/configuration-settings/screenAccess/useBaseForm';

const { mockRouter, mockToast, mockConfirm } = vi.hoisted(() => ({
  mockRouter: {
    push: vi.fn(),
    refresh: vi.fn(),
  },
  mockToast: {
    success: vi.fn(),
    error: vi.fn(),
  },
  mockConfirm: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
}));

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => 'en',
}));

vi.mock('sonner', () => ({
  toast: mockToast,
}));

vi.mock('@/components/common/ConfirmProvider', () => ({
  useConfirm: () => ({
    confirm: mockConfirm,
  }),
}));

vi.mock('@/hooks/useLoading', () => ({
  useLoading: () => ({
    isLoading: false,
    startLoading: vi.fn(),
    stopLoading: vi.fn(),
  }),
}));

describe('useBaseForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  const mockSaveAction = vi.fn();
  const baseProps = {
    initialData: { name: 'test', isActive: true },
    validationSchema: {
      name: (val: unknown) => (val ? undefined : 'Required'),
    },
    saveAction: mockSaveAction,
    successMessageKey: 'success',
    redirectPath: '/test',
  };

  it('should initialize with form data', () => {
    const { result } = renderHook(() => useBaseForm(baseProps));
    expect(result.current.formData.name).toBe('test');
    expect(result.current.formData.isActive).toBe(true); // default from hook
  });

  it('should handle field change and update state', () => {
    const { result } = renderHook(() => useBaseForm(baseProps));

    act(() => {
      result.current.handleChange('name', 'updated');
    });

    expect(result.current.formData.name).toBe('updated');
  });

  it('should validate on blur and show error', () => {
    const { result } = renderHook(() => useBaseForm(baseProps));

    act(() => {
      result.current.handleChange('name', '');
    });

    act(() => {
      result.current.handleBlur('name');
    });

    expect(result.current.errors.name).toBe('Required');
    expect(result.current.showError('name')).toBe(true);
  });

  it('should submit successfully if validation passes', async () => {
    mockSaveAction.mockResolvedValueOnce({ success: true });

    const { result } = renderHook(() => useBaseForm(baseProps));

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as unknown as React.FormEvent);
    });

    expect(mockSaveAction).toHaveBeenCalledWith({ name: 'test', isActive: true });
    expect(mockToast.success).toHaveBeenCalled();
    expect(mockRouter.refresh).toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(300); // UI_TRANSITION_DURATION
    });
    expect(mockRouter.push).toHaveBeenCalledWith('/en/test');
  });

  it('should prevent submission if validation fails', async () => {
    const { result } = renderHook(() =>
      useBaseForm({
        ...baseProps,
        initialData: { name: '', isActive: true },
      })
    );

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as unknown as React.FormEvent);
    });

    expect(result.current.errors.name).toBe('Required');
    expect(mockSaveAction).not.toHaveBeenCalled();
    expect(mockToast.error).not.toHaveBeenCalled();
  });

  it('should call handleCancel directly if there are no unsaved changes', () => {
    const { result } = renderHook(() => useBaseForm(baseProps));

    act(() => {
      result.current.handleCancel();
    });

    expect(mockConfirm).not.toHaveBeenCalled();
    expect(result.current.open).toBe(false);

    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(mockRouter.push).toHaveBeenCalledWith('/en/test');
  });

  it('should prompt user on handleCancel if there are unsaved changes', () => {
    const { result } = renderHook(() => useBaseForm(baseProps));

    act(() => {
      result.current.handleChange('name', 'changed');
    });

    act(() => {
      result.current.handleCancel();
    });

    expect(mockConfirm).toHaveBeenCalled();
    const confirmArg = mockConfirm.mock.calls[0][0];
    expect(confirmArg.variant).toBe('warning');

    // Trigger onConfirm
    act(() => {
      confirmArg.onConfirm();
    });

    expect(result.current.open).toBe(false);

    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(mockRouter.push).toHaveBeenCalledWith('/en/test');
  });
});
