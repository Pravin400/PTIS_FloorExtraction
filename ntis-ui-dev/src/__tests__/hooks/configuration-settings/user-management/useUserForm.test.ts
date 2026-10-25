import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { useUserForm } from '@/hooks/configuration-settings/user-management/useUserForm';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { User } from '@/types/user-management';

// Mock the actions
vi.mock('@/app/[locale]/configuration-settings/user-management/actions.mutations', () => ({
  createUserAction: vi.fn(() =>
    Promise.resolve({ success: true, data: { id: '3', name: 'New User' } })
  ),
  updateUserAction: vi.fn(() =>
    Promise.resolve({ success: true, data: { id: '1', name: 'John Updated' } })
  ),
}));

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

// Mock sonner
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockUser: User = {
  id: '1',
  userId: 1,
  userName: 'johndoe',
  firstName: 'John',
  middleName: '',
  lastName: 'Doe',
  email: 'john@example.com',
  mobileNo: '1234567890',
  isActive: true,
  twoFactorEnabled: false,
  twoFactorRequired: false,
  departmentNames: ['Dept 1'],
  departmentIds: ['1'],
  moduleNames: [],
  moduleIds: [],
  roles: [],
  userRoleIds: [1],
  roleAccess: { '1': [1] },
  status: 'Active',
  moduleAccess: {},
  rawDepartments: [],
  rawModuleAccess: [],
  rawRoleAllocations: [],
};

describe('useUserForm', () => {
  const onSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with default values in create mode', () => {
    const { result } = renderHook(() => useUserForm(onSuccess));

    expect(result.current.formData.userName).toBe('');
    expect(result.current.currentTab).toBe('basic');
  });

  it('should initialize with initialData in edit mode', () => {
    const { result } = renderHook(() => useUserForm(onSuccess, mockUser));

    expect(result.current.formData.userName).toBe('johndoe');
    expect(result.current.formData.firstName).toBe('John');
    expect(result.current.formData.userRoleIds).toContain(1);
  });

  it('should handle navigation steps correctly', () => {
    const { result } = renderHook(() => useUserForm(onSuccess, mockUser));

    expect(result.current.currentTab).toBe('basic');
    expect(result.current.isFirstStep).toBe(true);

    act(() => {
      result.current.handleNext();
    });
    expect(result.current.currentTab).toBe('departments');

    act(() => {
      result.current.handleNext();
    });
    expect(result.current.currentTab).toBe('modules');
    expect(result.current.isLastStep).toBe(true);

    act(() => {
      result.current.handlePrevious();
    });
    expect(result.current.currentTab).toBe('departments');
  });

  it('should toggle departments correctly', () => {
    const { result } = renderHook(() => useUserForm(onSuccess));

    act(() => {
      result.current.toggleDepartment('1');
    });
    expect(result.current.formData.departmentIds).toContain('1');

    act(() => {
      result.current.toggleDepartment('1');
    });
    expect(result.current.formData.departmentIds).not.toContain('1');
  });

  it('should handle form submission correctly in create mode', async () => {
    const { result } = renderHook(() => useUserForm(onSuccess));

    act(() => {
      result.current.setFormData({
        ...result.current.formData,
        userName: 'newuser',
        firstName: 'New',
        lastName: 'User',
        email: 'new@example.com',
        mobileNo: '1234567890',
        departmentIds: ['1'],
        roleAccess: { '1': [1] },
      });
    });

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as unknown as React.FormEvent);
    });

    const { createUserAction } =
      await import('@/app/[locale]/configuration-settings/user-management/actions.mutations');
    expect(createUserAction).toHaveBeenCalled();
    expect(onSuccess).toHaveBeenCalled();
  });

  it('should handle form submission correctly in edit mode', async () => {
    const { result } = renderHook(() => useUserForm(onSuccess, mockUser));

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as unknown as React.FormEvent);
    });

    const { updateUserAction } =
      await import('@/app/[locale]/configuration-settings/user-management/actions.mutations');
    expect(updateUserAction).toHaveBeenCalledWith(1, expect.anything());
    expect(onSuccess).toHaveBeenCalled();
  });
});
