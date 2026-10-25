import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useEmpClassMasterForm } from '@/hooks/payroll/useEmpClassMasterForm';
import type { EmpClassMasterItem } from '@/types/payroll/MasterModule';

const translations: Record<string, string> = {
  'drawer.validation.classCodeRequired': 'Class Code is required.',
  'drawer.validation.classCodeMinLength': 'Class code must be at least 3 characters',
  'drawer.validation.classCodeMaxLength': 'Class code must not exceed 20 characters',
  'drawer.validation.classCodeFormat': 'Code must contain only letters, underscores, and hyphens',
  'drawer.validation.codeUnique': 'This Class Code already exists. Codes must be unique.',
  'drawer.validation.classNameRequired': 'Employee Class name is required.',
  'drawer.validation.classNameMaxLength': 'Class name must not exceed 100 characters',
  'drawer.validation.classNameDuplicate': 'This employee class name already exists.',
  'drawer.validation.classNameMarathiRequired': 'Employee Class name (Marathi) is required.',
  'drawer.validation.classNameMarathiMaxLength': 'Class name (Marathi) must not exceed 100 characters',
  'drawer.validation.descriptionMaxLength': 'Description must not exceed 250 characters.',
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

const mockItem: EmpClassMasterItem = {
  employeeClassId: 'CLASS-001',
  classCode: 'CLASS-I',
  className: 'Class Group A',
  classNameMarathi: 'गट अ',
  description: 'Senior executives',
  isActive: true,
};

describe('useEmpClassMasterForm', () => {
  const mockOnSave = vi.fn();
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes with empty form in create mode', () => {
    const { result } = renderHook(() =>
      useEmpClassMasterForm({
        isOpen: true,
        initialItem: null,
        onSave: mockOnSave,
        onClose: mockOnClose,
      })
    );

    expect(result.current.isEdit).toBe(false);
    expect(result.current.form.classCode).toBe('');
    expect(result.current.form.className).toBe('');
    expect(result.current.form.classNameMarathi).toBe('');
    expect(result.current.form.description).toBe('');
    expect(result.current.form.isActive).toBe(true);
    expect(result.current.errors).toEqual({});
  });

  it('populates form with initialItem in edit mode', () => {
    const { result } = renderHook(() =>
      useEmpClassMasterForm({
        isOpen: true,
        initialItem: mockItem,
        onSave: mockOnSave,
        onClose: mockOnClose,
      })
    );

    expect(result.current.isEdit).toBe(true);
    expect(result.current.form.classCode).toBe('CLASS-I');
    expect(result.current.form.className).toBe('Class Group A');
    expect(result.current.form.classNameMarathi).toBe('गट अ');
    expect(result.current.form.description).toBe('Senior executives');
    expect(result.current.form.isActive).toBe(true);
  });

  it('updates form fields and strips invalid characters', () => {
    const { result } = renderHook(() =>
      useEmpClassMasterForm({
        isOpen: true,
        initialItem: null,
        onSave: mockOnSave,
        onClose: mockOnClose,
      })
    );

    act(() => {
      result.current.handleCodeChange('class-123_grp#$');
    });
    expect(result.current.form.classCode).toBe('CLASS-123_GRP');

    act(() => {
      result.current.handleNameChange('Class 100 Group');
    });
    expect(result.current.form.className).toBe('Class 100 Group');
  });

  it('validates required fields on submission', async () => {
    const { result } = renderHook(() =>
      useEmpClassMasterForm({
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

    expect(result.current.submittedOnce).toBe(true);
    expect(result.current.errors.classCode).toBeDefined();
    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it('submits valid data successfully and closes drawer', async () => {
    mockOnSave.mockResolvedValueOnce(true);

    const { result } = renderHook(() =>
      useEmpClassMasterForm({
        isOpen: true,
        initialItem: null,
        onSave: mockOnSave,
        onClose: mockOnClose,
      })
    );

    act(() => {
      result.current.handleCodeChange('CLASS-A');
      result.current.handleNameChange('Class Group A');
      result.current.handleMarathiNameChange('वर्ग अ');
    });

    const fakeEvent = { preventDefault: vi.fn() } as unknown as React.FormEvent;
    await act(async () => {
      await result.current.handleSubmit(fakeEvent);
    });

    expect(mockOnSave).toHaveBeenCalledWith({
      classCode: 'CLASS-A',
      className: 'Class Group A',
      classNameMarathi: 'वर्ग अ',
      description: undefined,
      isActive: true,
    });
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('displays duplicate code error immediately upon blur without waiting for submit', () => {
    const { result } = renderHook(() =>
      useEmpClassMasterForm({
        isOpen: true,
        initialItem: null,
        existingCodes: new Set(['CLASS-I']),
        onSave: mockOnSave,
        onClose: mockOnClose,
      })
    );

    act(() => {
      result.current.handleCodeChange('CLASS-I');
    });

    expect(result.current.showError('classCode')).toBe(false);

    act(() => {
      result.current.handleBlur('classCode');
    });

    expect(result.current.errors.classCode).toBe('This Class Code already exists. Codes must be unique.');
    expect(result.current.showError('classCode')).toBe(true);
  });

  it('resets form state when resetForm is called', () => {
    const { result } = renderHook(() =>
      useEmpClassMasterForm({
        isOpen: true,
        initialItem: null,
        onSave: mockOnSave,
        onClose: mockOnClose,
      })
    );

    act(() => {
      result.current.handleCodeChange('DIRTY-CODE');
      result.current.handleNameChange('Dirty Name');
    });

    expect(result.current.form.classCode).toBe('DIRTY-CODE');

    act(() => {
      result.current.resetForm();
    });

    expect(result.current.form.classCode).toBe('');
    expect(result.current.form.className).toBe('');
    expect(result.current.errors).toEqual({});
  });
});
