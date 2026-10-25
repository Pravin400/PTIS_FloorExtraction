import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useModuleFormHandlers } from '@/hooks/configuration-settings/module-master/useModuleFormHandlers';
import { ModuleMasterFormData } from '@/types/moduleMaster.types';

describe('useModuleFormHandlers', () => {
  it('handles field changes correctly, capitalizing moduleCode', () => {
    let formData: ModuleMasterFormData = {
      departmentId: 0,
      moduleCode: '',
      moduleName: '',
      moduleNameLocal: '',
      moduleIcon: '',
      moduleLabel: '',
      moduleDescription: '',
      isActive: true,
    };
    const setFormData = vi.fn().mockImplementation((fn) => {
      formData = fn(formData);
    });
    const setErrors = vi.fn();

    const { result } = renderHook(() =>
      useModuleFormHandlers({
        formData,
        setFormData,
        setErrors,
        existingModules: [],
        isEdit: false,
        moduleId: null,
      })
    );

    const event = {
      target: {
        name: 'moduleCode',
        value: 'abc',
      },
    } as unknown as React.ChangeEvent<HTMLInputElement>;

    act(() => {
      result.current.handleChange(event);
    });

    expect(setFormData).toHaveBeenCalled();
    expect(formData.moduleCode).toBe('ABC');
  });

  it('handles select changes, parsing departmentId to a number', () => {
    let formData: ModuleMasterFormData = {
      departmentId: 0,
      moduleCode: '',
      moduleName: '',
      moduleNameLocal: '',
      moduleIcon: '',
      moduleLabel: '',
      moduleDescription: '',
      isActive: true,
    };
    const setFormData = vi.fn().mockImplementation((fn) => {
      formData = fn(formData);
    });
    const setErrors = vi.fn();

    const { result } = renderHook(() =>
      useModuleFormHandlers({
        formData,
        setFormData,
        setErrors,
        existingModules: [],
        isEdit: false,
        moduleId: null,
      })
    );

    const event = {} as React.ChangeEvent<HTMLSelectElement>;

    act(() => {
      result.current.handleSelectChange(event, '15');
    });

    expect(setFormData).toHaveBeenCalled();
    expect(formData.departmentId).toBe(15);
  });

  it('toggles isActive status', () => {
    let formData: ModuleMasterFormData = {
      departmentId: 0,
      moduleCode: '',
      moduleName: '',
      moduleNameLocal: '',
      moduleIcon: '',
      moduleLabel: '',
      moduleDescription: '',
      isActive: true,
    };
    const setFormData = vi.fn().mockImplementation((fn) => {
      formData = fn(formData);
    });
    const setErrors = vi.fn();

    const { result } = renderHook(() =>
      useModuleFormHandlers({
        formData,
        setFormData,
        setErrors,
        existingModules: [],
        isEdit: false,
        moduleId: null,
      })
    );

    act(() => {
      result.current.handleToggleStatus();
    });

    expect(setFormData).toHaveBeenCalled();
    expect(formData.isActive).toBe(false);
  });
});
