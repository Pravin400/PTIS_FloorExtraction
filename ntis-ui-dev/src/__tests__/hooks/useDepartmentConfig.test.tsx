import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDepartmentConfig } from '@/hooks/useDepartmentConfig';

const saveAction = vi.fn();
const toastSuccess = vi.fn();
const toastError = vi.fn();

vi.mock('next-intl', () => ({ useTranslations: () => (k: string) => k }));
vi.mock('@/components/common', () => ({ useToast: () => ({ success: toastSuccess, error: toastError }) }));
vi.mock('@/app/[locale]/configuration-settings/config-master/actions', () => ({
  saveDepartmentConfigurationAction: (...args: unknown[]) => saveAction(...args),
}));

const initial = [
  {
    id: 1,
    name: 'Dept',
    code: 'D1',
    isEnabled: false,
    value: '',
    configValueId: 0,
    submoduleCount: 1,
    submodules: [{ id: 2, title: 'Sub', code: 'S', desc: '', isEnabled: false, value: '', configValueId: 0 }],
  },
] as never;

describe('useDepartmentConfig', () => {
  beforeEach(() => vi.clearAllMocks());

  it('toggles department and submodule, populating default value on toggle-on', () => {
    const onSuccess = vi.fn();
    const { result } = renderHook(() => useDepartmentConfig(initial, 1, onSuccess, 'DEF'));

    act(() => {
      result.current.handleToggleDept(1);
      result.current.handleToggleSubmodule(1, 2);
    });

    expect(result.current.departments[0].isEnabled).toBe(true);
    expect(result.current.departments[0].submodules[0].isEnabled).toBe(true);
    expect(result.current.departments[0].submodules[0].value).toBe('DEF');
  });

  it('does not populate default value on untoggled/disabled submodules', () => {
    const multiSubInitial = [
      {
        id: 1,
        name: 'Dept',
        code: 'D1',
        isEnabled: true,
        value: '',
        configValueId: 0,
        submoduleCount: 2,
        submodules: [
          { id: 2, title: 'Sub 1', code: 'S1', desc: '', isEnabled: false, value: '', configValueId: 0 },
          { id: 3, title: 'Sub 2', code: 'S2', desc: '', isEnabled: false, value: '', configValueId: 0 },
        ],
      },
    ] as never;

    const onSuccess = vi.fn();
    const { result } = renderHook(() => useDepartmentConfig(multiSubInitial, 1, onSuccess, '21'));

    // Toggle only Sub 1 on
    act(() => {
      result.current.handleToggleSubmodule(1, 2);
    });

    // Sub 1 should have default value 21
    expect(result.current.departments[0].submodules[0].isEnabled).toBe(true);
    expect(result.current.departments[0].submodules[0].value).toBe('21');

    // Sub 2 (untoggled) should stay empty and disabled
    expect(result.current.departments[0].submodules[1].isEnabled).toBe(false);
    expect(result.current.departments[0].submodules[1].value).toBe('');
  });

  it('only saves toggled-on submodules and ignores untoggled submodules with configValueId=0', async () => {
    const multiSubInitial = [
      {
        id: 1,
        name: 'Dept',
        code: 'D1',
        isEnabled: true,
        value: '',
        configValueId: 0,
        submoduleCount: 2,
        submodules: [
          { id: 2, title: 'Sub 1', code: 'S1', desc: '', isEnabled: false, value: '', configValueId: 0 },
          { id: 3, title: 'Sub 2', code: 'S2', desc: '', isEnabled: false, value: '', configValueId: 0 },
        ],
      },
    ] as never;

    const onSuccess = vi.fn();
    saveAction.mockResolvedValue({ success: true });
    const { result } = renderHook(() => useDepartmentConfig(multiSubInitial, 1, onSuccess, '21'));

    // Enable Sub 1
    act(() => {
      result.current.handleToggleSubmodule(1, 2);
    });

    await act(async () => {
      await result.current.handleSaveAll();
    });

    expect(saveAction).toHaveBeenCalledWith({
      configKeyId: 1,
      updates: [
        {
          departmentId: 1,
          moduleId: 2,
          isEnabled: true,
          value: '21',
          configValueId: 0,
        },
      ],
    });
    expect(toastSuccess).toHaveBeenCalled();
    expect(onSuccess).toHaveBeenCalled();
  });

  it('saves updates successfully', async () => {
    const onSuccess = vi.fn();
    saveAction.mockResolvedValue({ success: true });
    const { result } = renderHook(() => useDepartmentConfig(initial, 1, onSuccess, 'DEF'));

    act(() => {
      result.current.handleToggleDept(1);
      result.current.handleToggleSubmodule(1, 2);
    });

    await act(async () => {
      await result.current.handleSaveAll();
    });

    expect(saveAction).toHaveBeenCalled();
    expect(toastSuccess).toHaveBeenCalled();
    expect(onSuccess).toHaveBeenCalled();
  });

  it('auto-expands department when toggling to enabled (ON) while collapsing others', () => {
    const onSuccess = vi.fn();
    const { result } = renderHook(() => useDepartmentConfig(initial, 1, onSuccess, 'DEF'));

    expect(result.current.expandedDepts).toEqual([]);

    act(() => {
      result.current.handleToggleDept(1);
    });

    expect(result.current.departments[0].isEnabled).toBe(true);
    expect(result.current.expandedDepts).toEqual([1]);
  });

  it('correctly calculates isSaveDisabled when department is ON with 0 active submodules', () => {
    const onSuccess = vi.fn();
    const { result } = renderHook(() => useDepartmentConfig(initial, 1, onSuccess, 'DEF'));

    // Initially dept is disabled, so isSaveDisabled is false
    expect(result.current.isSaveDisabled).toBe(false);

    // Toggle dept ON (submodule is still disabled/inactive)
    act(() => {
      result.current.handleToggleDept(1);
    });

    // Dept is ON but 0 submodules active -> save should be disabled
    expect(result.current.isSaveDisabled).toBe(true);

    // Enable submodule
    act(() => {
      result.current.handleToggleSubmodule(1, 2);
    });

    // Dept is ON and 1 submodule active -> save should be enabled
    expect(result.current.isSaveDisabled).toBe(false);
  });

  it('handles save failure', async () => {
    const onSuccess = vi.fn();
    saveAction.mockResolvedValue({ success: false, error: 'bad' });
    const { result } = renderHook(() => useDepartmentConfig(initial, 1, onSuccess, 'DEF'));

    act(() => {
      result.current.handleToggleDept(1);
      result.current.handleToggleSubmodule(1, 2);
    });

    await act(async () => {
      await result.current.handleSaveAll();
    });

    expect(toastError).toHaveBeenCalled();
  });
});
