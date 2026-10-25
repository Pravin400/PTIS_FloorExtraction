import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useScreenGroupForm } from '@/hooks/configuration-settings/screenAccess/useScreenGroupForm';
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
  createScreenGroupAction: vi.fn(),
  updateScreenGroupAction: vi.fn(),
}));

describe('useScreenGroupForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should identify create mode', () => {
    const { result } = renderHook(() => useScreenGroupForm({}));
    expect(result.current.isEdit).toBe(false);
  });

  it('should identify edit mode from initialData', () => {
    const { result } = renderHook(() =>
      useScreenGroupForm({ initialData: { screenGroupId: 123 } })
    );
    expect(result.current.isEdit).toBe(true);
  });

  it('should call createScreenGroupAction on submit in create mode', async () => {
    const mockAction = vi.mocked(mutations.createScreenGroupAction);
    mockAction.mockResolvedValueOnce({ success: true });

    const { result } = renderHook(() =>
      useScreenGroupForm({
        initialData: {
          screenGroupCode: 'GRP01',
          screenGroupName: 'Test Group',
          displayOrder: 1,
          isActive: true,
        },
      })
    );

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as unknown as React.FormEvent);
    });

    expect(mockAction).toHaveBeenCalled();
  });

  it('should call updateScreenGroupAction on submit in edit mode', async () => {
    const mockAction = vi.mocked(mutations.updateScreenGroupAction);
    mockAction.mockResolvedValueOnce({ success: true });

    const { result } = renderHook(() =>
      useScreenGroupForm({
        initialData: {
          screenGroupId: 123,
          screenGroupCode: 'GRP01',
          screenGroupName: 'Test Group',
          displayOrder: 1,
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
