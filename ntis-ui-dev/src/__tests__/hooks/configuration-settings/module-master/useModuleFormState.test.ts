import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useModuleFormState } from '@/hooks/configuration-settings/module-master/useModuleFormState';
import { ModuleMaster } from '@/types/moduleMaster.types';

describe('useModuleFormState', () => {
  it('initializes with default state when no initialData is provided', () => {
    const { result } = renderHook(() => useModuleFormState());

    expect(result.current.formData).toEqual({
      departmentId: 0,
      moduleCode: '',
      moduleName: '',
      moduleNameLocal: '',
      moduleIcon: '',
      moduleLabel: '',
      moduleDescription: '',
      isActive: true,
    });
    expect(result.current.errors).toEqual({});
    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.open).toBe(true);
  });

  it('initializes with mapped state when initialData is provided', () => {
    const mockData: ModuleMaster = {
      moduleId: 45,
      departmentId: 12,
      moduleCode: 'TEST_CODE',
      moduleName: 'Test Name',
      moduleNameLocal: 'स्थानिक नाव',
      moduleIcon: 'icon-class',
      moduleLabel: 'Label',
      moduleDescription: 'Description of module',
      isActive: false,
    };

    const { result } = renderHook(() => useModuleFormState(mockData));

    expect(result.current.formData).toEqual({
      departmentId: 12,
      moduleCode: 'TEST_CODE',
      moduleName: 'Test Name',
      moduleNameLocal: 'स्थानिक नाव',
      moduleIcon: 'icon-class',
      moduleLabel: 'Label',
      moduleDescription: 'Description of module',
      isActive: false,
    });
  });

  it('allows updating form state manually', () => {
    const { result } = renderHook(() => useModuleFormState());

    act(() => {
      result.current.setFormData((prev) => ({ ...prev, moduleName: 'New Val' }));
      result.current.setErrors({ moduleCode: 'moduleCodeRequired' });
      result.current.setIsSubmitting(true);
      result.current.setOpen(false);
    });

    expect(result.current.formData.moduleName).toBe('New Val');
    expect(result.current.errors.moduleCode).toBe('moduleCodeRequired');
    expect(result.current.isSubmitting).toBe(true);
    expect(result.current.open).toBe(false);
  });
});
