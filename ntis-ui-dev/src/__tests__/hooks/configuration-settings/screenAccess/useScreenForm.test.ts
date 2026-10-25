import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useScreenForm } from '@/hooks/configuration-settings/screenAccess/useScreenForm';
import * as mutations from '@/app/[locale]/configuration-settings/screenAccess/action.mutations';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => 'en',
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('@/hooks/useLoading', () => ({
  useLoading: () => ({ isLoading: false, startLoading: vi.fn(), stopLoading: vi.fn() }),
}));

vi.mock('@/components/common/ConfirmProvider', () => ({
  useConfirm: () => ({
    confirm: vi.fn(),
  }),
}));

vi.mock('@/app/[locale]/configuration-settings/screenAccess/action.mutations', () => ({
  createScreenAction: vi.fn(),
  updateScreenAction: vi.fn(),
}));

describe('useScreenForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should identify create mode', () => {
    const { result } = renderHook(() => useScreenForm({}));
    expect(result.current.isEdit).toBe(false);
  });

  it('should identify edit mode from initialData', () => {
    const { result } = renderHook(() => useScreenForm({ initialData: { screenMasterId: 123 } }));
    expect(result.current.isEdit).toBe(true);
  });

  it('should call createScreenAction on submit in create mode', async () => {
    const mockAction = vi.mocked(mutations.createScreenAction);
    mockAction.mockResolvedValueOnce({ success: true });

    const { result } = renderHook(() =>
      useScreenForm({
        initialData: {
          screenCode: 'SCR01',
          screenName: 'Test Screen',
          screenGroupId: 1,
          departmentMasterId: 1,
          moduleId: 1,
          routePath: '/test',
          isActive: true,
        },
      })
    );

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as unknown as React.FormEvent);
    });

    expect(mockAction).toHaveBeenCalled();
  });

  it('should call updateScreenAction on submit in edit mode', async () => {
    const mockAction = vi.mocked(mutations.updateScreenAction);
    mockAction.mockResolvedValueOnce({ success: true });

    const { result } = renderHook(() =>
      useScreenForm({
        initialData: {
          screenMasterId: 123,
          screenCode: 'SCR01',
          screenName: 'Test Screen',
          screenGroupId: 1,
          departmentMasterId: 1,
          moduleId: 1,
          routePath: '/test',
          isActive: true,
        },
      })
    );

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as unknown as React.FormEvent);
    });

    expect(mockAction).toHaveBeenCalledWith(123, expect.anything());
  });
});
