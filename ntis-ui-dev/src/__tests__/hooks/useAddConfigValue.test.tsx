import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAddConfigValue } from '@/hooks/useAddConfigValue';
import type { AddConfigValueModalProps, ConfigCategory, ConfigItem } from '@/types/configMaster.types';

const mockRefresh = vi.fn();
const mockSuccess = vi.fn();
const mockError = vi.fn();
const mockConfirm = vi.fn();
const createAction = vi.fn();

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: mockRefresh }) }));
vi.mock('next-intl', () => ({ useTranslations: () => (k: string) => k }));
vi.mock('@/components/common', () => ({
  useToast: () => ({ success: mockSuccess, error: mockError }),
  useConfirm: () => ({ confirm: mockConfirm }),
}));
vi.mock('@/app/[locale]/configuration-settings/config-master/actions', () => ({
  createConfigValueAction: (...args: unknown[]) => createAction(...args),
}));

describe('useAddConfigValue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const baseProps: Pick<AddConfigValueModalProps, 'onClose' | 'onSuccess' | 'categories' | 'configItems'> = {
    onClose: vi.fn(),
    onSuccess: vi.fn(),
    categories: [{
      id: '1',
      name: 'General',
      code: 'GEN',
      displayOrder: 1,
      isActive: true,
      color: 'rose',
      icon: 'Shield',
      count: 0,
      total: 0,
    } satisfies ConfigCategory],
    configItems: [{
      id: '1',
      configKeyId: 1,
      configValueId: 0,
      categoryId: 1,
      name: 'Key A',
      configCode: 'KA',
      description: '',
      value: '',
      defaultValue: 'v',
      isEnabled: true,
      category: '1',
      type: 'text',
      controlType: 'text',
      dataType: 'string',
      stats: { deptOverrides: 0, userOverrides: 0, totalDepts: 0, totalUsers: 0 },
      hasTag: false,
    } satisfies ConfigItem],
  };

  it('submits valid form and triggers success flow', async () => {
    createAction.mockResolvedValue({ success: true });
    const { result } = renderHook(() => useAddConfigValue(baseProps));

    act(() => {
      result.current.handleChange('configKeyId', '1');
      result.current.handleChange('value', 'abc');
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(mockSuccess).toHaveBeenCalled();
    expect(mockRefresh).toHaveBeenCalled();
    expect(baseProps.onClose).toHaveBeenCalled();
  });

  it('shows error when submit fails', async () => {
    createAction.mockResolvedValue({ success: false, error: 'x' });
    const { result } = renderHook(() => useAddConfigValue(baseProps));

    act(() => {
      result.current.handleChange('configKeyId', '1');
      result.current.handleChange('value', 'abc');
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(mockError).toHaveBeenCalled();
  });

  it('opens confirm when closing dirty form', () => {
    const { result } = renderHook(() => useAddConfigValue(baseProps));

    act(() => {
      result.current.handleChange('value', 'abc');
    });

    act(() => {
      result.current.handleClose();
    });

    expect(mockConfirm).toHaveBeenCalled();
  });
});
