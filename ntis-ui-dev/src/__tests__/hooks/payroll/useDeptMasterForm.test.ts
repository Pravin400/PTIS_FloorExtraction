import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useDeptMasterForm } from '@/hooks/payroll/useDeptMasterForm';
import type { DeptMasterItem } from '@/types/payroll/MasterModule';

const translations: Record<string, string> = {
  'form.validation.departmentCodeRequired': 'Department Code is required',
  'form.validation.departmentCodeFormat':
    'Department Code must only contain letters, numbers, hyphens, and underscores',
  'form.validation.departmentNameRequired': 'Department Name is required',
  'form.validation.departmentNameMinLength': 'Department name must be at least 5 characters',
  'form.validation.departmentNameFormat':
    'Department Name can only contain letters, spaces, and valid punctuation (. - / & ())',
  'form.validation.departmentNameMarathiRequired': 'Department Name in Marathi is required',
  'form.validation.departmentNameMarathiMinLength':
    'Department name (Regional) must be at least 5 characters',
  'form.validation.departmentNameMarathiFormat':
    'Department Name (Regional) can only contain valid characters and punctuation (. - / & ())',
  'form.validation.codeUnique': 'This Department Code already exists. Codes must be unique.',
};

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => translations[key] ?? key,
}));

vi.mock('@/hooks/payroll/useTransliteration', () => ({
  useTransliteration: (
    _lang: string,
    _value: string,
    _onTransliterated: (val: string) => void
  ) => ({
    scheduleAutoTransliterate: vi.fn(),
    handleBlurTransliterate: vi.fn(),
  }),
}));

const mockItem: DeptMasterItem = {
  id: 1,
  departmentId: 'DEPT-1',
  departmentCode: 'GEN_ADMIN',
  departmentName: 'General Administration',
  departmentNameMarathi: 'सामान्य प्रशासन',
  description: 'General Administration Dept',
  isActive: true,
};

describe('useDeptMasterForm', () => {
  const mockOnSave = vi.fn();
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes with empty form in create mode', () => {
    const { result } = renderHook(() =>
      useDeptMasterForm({
        isOpen: true,
        initialItem: null,
        onSave: mockOnSave,
        onClose: mockOnClose,
      })
    );

    expect(result.current.isEdit).toBe(false);
    expect(result.current.form.departmentCode).toBe('');
    expect(result.current.form.departmentName).toBe('');
    expect(result.current.form.departmentNameMarathi).toBe('');
    expect(result.current.form.description).toBe('');
    expect(result.current.form.isActive).toBe(true);
    expect(result.current.errors).toEqual({});
  });

  it('populates form with initialItem in edit mode', () => {
    const { result } = renderHook(() =>
      useDeptMasterForm({
        isOpen: true,
        initialItem: mockItem,
        onSave: mockOnSave,
        onClose: mockOnClose,
      })
    );

    expect(result.current.isEdit).toBe(true);
    expect(result.current.form.departmentCode).toBe('GEN_ADMIN');
    expect(result.current.form.departmentName).toBe('General Administration');
    expect(result.current.form.departmentNameMarathi).toBe('सामान्य प्रशासन');
    expect(result.current.form.description).toBe('General Administration Dept');
    expect(result.current.form.isActive).toBe(true);
  });

  it('updates form fields and clears associated field error when setField is called', () => {
    const { result } = renderHook(() =>
      useDeptMasterForm({
        isOpen: true,
        initialItem: null,
        onSave: mockOnSave,
        onClose: mockOnClose,
      })
    );

    act(() => {
      result.current.setField('departmentCode', 'FINANCE');
    });

    expect(result.current.form.departmentCode).toBe('FINANCE');
  });

  it('validates required fields on submission and shows errors', async () => {
    const { result } = renderHook(() =>
      useDeptMasterForm({
        isOpen: true,
        initialItem: null,
        onSave: mockOnSave,
        onClose: mockOnClose,
      })
    );

    const fakeEvent = { preventDefault: vi.fn() } as unknown as React.FormEvent;

    await act(async () => {
      await result.current.handleSubmit(fakeEvent);
    });

    expect(result.current.errors.departmentCode).toBe('Department Code is required');
    expect(result.current.errors.departmentName).toBe('Department Name is required');
    expect(result.current.errors.departmentNameMarathi).toBe(
      'Department Name in Marathi is required'
    );
    expect(mockOnSave).not.toHaveBeenCalled();
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('validates code format rejecting invalid special characters', async () => {
    const { result } = renderHook(() =>
      useDeptMasterForm({
        isOpen: true,
        initialItem: null,
        onSave: mockOnSave,
        onClose: mockOnClose,
      })
    );

    act(() => {
      result.current.setField('departmentCode', 'DEPT@123');
      result.current.setField('departmentName', 'Department');
      result.current.setField('departmentNameMarathi', 'विभाग');
    });

    const fakeEvent = { preventDefault: vi.fn() } as unknown as React.FormEvent;

    await act(async () => {
      await result.current.handleSubmit(fakeEvent);
    });

    expect(result.current.errors.departmentCode).toBe(
      'Department Code must only contain letters, numbers, hyphens, and underscores'
    );
    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it('validates departmentName and departmentNameMarathi format rejecting invalid characters and numbers', async () => {
    const { result } = renderHook(() =>
      useDeptMasterForm({
        isOpen: true,
        initialItem: null,
        onSave: mockOnSave,
        onClose: mockOnClose,
      })
    );

    act(() => {
      result.current.setField('departmentCode', 'DEPT_VALID');
      result.current.setField('departmentName', 'Education 123');
      result.current.setField('departmentNameMarathi', 'शिक्षण १२३');
    });

    const fakeEvent = { preventDefault: vi.fn() } as unknown as React.FormEvent;

    await act(async () => {
      await result.current.handleSubmit(fakeEvent);
    });

    expect(result.current.errors.departmentName).toBe(
      'Department Name can only contain letters, spaces, and valid punctuation (. - / & ())'
    );
    expect(result.current.errors.departmentNameMarathi).toBe(
      'Department Name (Regional) can only contain valid characters and punctuation (. - / & ())'
    );
    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it('validates departmentName and departmentNameMarathi min length of 5 characters', async () => {
    const { result } = renderHook(() =>
      useDeptMasterForm({
        isOpen: true,
        initialItem: null,
        onSave: mockOnSave,
        onClose: mockOnClose,
      })
    );

    act(() => {
      result.current.setField('departmentCode', 'DEPT_VALID');
      result.current.setField('departmentName', 'Dept');
      result.current.setField('departmentNameMarathi', 'विभा');
    });

    const fakeEvent = { preventDefault: vi.fn() } as unknown as React.FormEvent;

    await act(async () => {
      await result.current.handleSubmit(fakeEvent);
    });

    expect(result.current.errors.departmentName).toBe(
      'Department name must be at least 5 characters'
    );
    expect(result.current.errors.departmentNameMarathi).toBe(
      'Department name (Regional) must be at least 5 characters'
    );
    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it('enforces uniqueness check when code already exists', async () => {
    const existingCodes = new Set(['FINANCE']);
    const { result } = renderHook(() =>
      useDeptMasterForm({
        isOpen: true,
        initialItem: null,
        existingCodes,
        onSave: mockOnSave,
        onClose: mockOnClose,
      })
    );

    act(() => {
      result.current.setField('departmentCode', 'FINANCE');
      result.current.setField('departmentName', 'Finance');
      result.current.setField('departmentNameMarathi', 'वित्त');
    });

    const fakeEvent = { preventDefault: vi.fn() } as unknown as React.FormEvent;

    await act(async () => {
      await result.current.handleSubmit(fakeEvent);
    });

    expect(result.current.errors.departmentCode).toBe(
      'This Department Code already exists. Codes must be unique.'
    );
    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it('immediately flags duplicate code error on handleBlur before submitting', () => {
    const existingCodes = new Set(['FINANCE']);
    const { result } = renderHook(() =>
      useDeptMasterForm({
        isOpen: true,
        initialItem: null,
        existingCodes,
        onSave: mockOnSave,
        onClose: mockOnClose,
      })
    );

    act(() => {
      result.current.setField('departmentCode', 'FINANCE');
    });

    expect(result.current.errors.departmentCode).toBeUndefined();

    act(() => {
      result.current.handleBlur('departmentCode');
    });

    expect(result.current.errors.departmentCode).toBe(
      'This Department Code already exists. Codes must be unique.'
    );
  });

  it('submits successfully when form is valid and calls onSave and onClose', async () => {
    mockOnSave.mockResolvedValueOnce(undefined);

    const { result } = renderHook(() =>
      useDeptMasterForm({
        isOpen: true,
        initialItem: null,
        onSave: mockOnSave,
        onClose: mockOnClose,
      })
    );

    act(() => {
      result.current.setField('departmentCode', 'HR-DEPT');
      result.current.setField('departmentName', 'Human Resources');
      result.current.setField('departmentNameMarathi', 'मानव संसाधन');
      result.current.setField('description', 'HR operations');
      result.current.setField('isActive', true);
    });

    const fakeEvent = { preventDefault: vi.fn() } as unknown as React.FormEvent;

    await act(async () => {
      await result.current.handleSubmit(fakeEvent);
    });

    expect(mockOnSave).toHaveBeenCalledWith({
      departmentCode: 'HR-DEPT',
      departmentName: 'Human Resources',
      departmentNameMarathi: 'मानव संसाधन',
      description: 'HR operations',
      isActive: true,
    });
    expect(mockOnClose).toHaveBeenCalled();
  });
});
