import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSubmoduleConfig } from '@/hooks/configuration-settings/department-activation/useSubmoduleConfig';
import type { Department, Module } from '@/types/departmentActivation.types';

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({ refresh: vi.fn() })),
}));

vi.mock('next-intl', () => ({
  useTranslations: vi.fn(() => (key: string) => key),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  },
}));

vi.mock('@/app/[locale]/configuration-settings/department-activation/action', () => ({
  updateModuleStatusAction: vi.fn().mockResolvedValue({ success: true }),
}));

import { updateModuleStatusAction } from '@/app/[locale]/configuration-settings/department-activation/action';

const department: Department = {
  departmentId: 1,
  departmentCode: 'PTIS',
  departmentName: 'Property Tax',
  departmentNameLocal: '',
  departmentIcon: '',
  departmentDescription: '',
  isActive: true,
};

const modules: Module[] = [
  {
    moduleId: 1,
    departmentId: 1,
    departmentName: 'Property Tax',
    moduleCode: 'M1',
    moduleName: 'Module 1',
    moduleNameLocal: '',
    moduleIcon: '',
    moduleLabel: '',
    moduleDescription: '',
    isActive: true,
  },
  {
    moduleId: 2,
    departmentId: 1,
    departmentName: 'Property Tax',
    moduleCode: 'M2',
    moduleName: 'Module 2',
    moduleNameLocal: '',
    moduleIcon: '',
    moduleLabel: '',
    moduleDescription: '',
    isActive: false,
  },
];

describe('useSubmoduleConfig', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('tracks draft changes without saving immediately', () => {
    const { result } = renderHook(() =>
      useSubmoduleConfig({
        initialModules: modules,
        selectedDepartment: department,
        isOpen: true,
      })
    );

    expect(result.current.hasUnsavedChanges).toBe(false);

    act(() => {
      result.current.toggleModuleDraft(modules[1]);
    });

    expect(result.current.hasUnsavedChanges).toBe(true);
    expect(result.current.draftModules[1].isActive).toBe(true);
    expect(updateModuleStatusAction).not.toHaveBeenCalled();
  });

  it('saves only changed modules when saveChanges is called', async () => {
    const { result } = renderHook(() =>
      useSubmoduleConfig({
        initialModules: modules,
        selectedDepartment: department,
        isOpen: true,
      })
    );

    act(() => {
      result.current.toggleModuleDraft(modules[1]);
    });

    await act(async () => {
      await result.current.saveChanges();
    });

    expect(updateModuleStatusAction).toHaveBeenCalledTimes(1);
    expect(result.current.hasUnsavedChanges).toBe(false);
  });
});
