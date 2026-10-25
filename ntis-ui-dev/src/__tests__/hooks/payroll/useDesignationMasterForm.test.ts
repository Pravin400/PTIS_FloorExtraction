import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useDesignationMasterForm } from '@/hooks/payroll/useDesignationMasterForm';
import type { DesignationMasterItem } from '@/types/payroll/MasterModule';

const translations: Record<string, string> = {
  'form.validation.designationCodeRequired': 'Designation Code is required',
  'form.validation.designationCodeFormat':
    'Designation Code must only contain letters, numbers, hyphens, and underscores',
  'form.validation.designationNameRequired': 'Designation Name is required',
  'form.validation.designationNameMinLength': 'Designation name must be at least 5 characters',
  'form.validation.designationNameFormat':
    'Designation Name can only contain letters, spaces, and valid punctuation (. - / & ())',
  'form.validation.designationLocalRequired': 'Designation Name in Marathi is required',
  'form.validation.designationLocalMinLength':
    'Designation name (Regional) must be at least 5 characters',
  'form.validation.designationLocalFormat':
    'Designation Name (Regional) can only contain valid characters and punctuation (. - / & ())',
  'form.validation.codeUnique': 'This Designation Code already exists. Codes must be unique.',
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

const mockItem: DesignationMasterItem = {
  id: 1,
  designationId: 'DESIG-1',
  designationCode: 'OFFICER',
  designationName: 'Section Officer',
  designationNameMarathi: 'विभाग अधिकारी',
  departmentId: 101,
  description: 'Supervises desk',
  isActive: true,
};

describe('useDesignationMasterForm', () => {
  const mockOnSave = vi.fn();
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes with empty form in create mode', () => {
    const { result } = renderHook(() =>
      useDesignationMasterForm({
        isOpen: true,
        initialItem: null,
        onSave: mockOnSave,
        onClose: mockOnClose,
      })
    );

    expect(result.current.isEdit).toBe(false);
    expect(result.current.form.designationCode).toBe('');
    expect(result.current.form.designationName).toBe('');
    expect(result.current.form.designationNameMarathi).toBe('');
    expect(result.current.form.departmentId).toBeNull();
    expect(result.current.form.description).toBe('');
    expect(result.current.form.isActive).toBe(true);
    expect(result.current.errors).toEqual({});
  });

  it('populates form with initialItem in edit mode', () => {
    const { result } = renderHook(() =>
      useDesignationMasterForm({
        isOpen: true,
        initialItem: mockItem,
        onSave: mockOnSave,
        onClose: mockOnClose,
      })
    );

    expect(result.current.isEdit).toBe(true);
    expect(result.current.form.designationCode).toBe('OFFICER');
    expect(result.current.form.designationName).toBe('Section Officer');
    expect(result.current.form.designationNameMarathi).toBe('विभाग अधिकारी');
    expect(result.current.form.departmentId).toBe(101);
    expect(result.current.form.description).toBe('Supervises desk');
    expect(result.current.form.isActive).toBe(true);
  });

  it('updates form fields and clears associated field error when setField is called', () => {
    const { result } = renderHook(() =>
      useDesignationMasterForm({
        isOpen: true,
        initialItem: null,
        onSave: mockOnSave,
        onClose: mockOnClose,
      })
    );

    act(() => {
      result.current.setField('designationCode', 'CLERK');
    });

    expect(result.current.form.designationCode).toBe('CLERK');
  });

  it('validates required fields on submission and shows errors', async () => {
    const { result } = renderHook(() =>
      useDesignationMasterForm({
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

    expect(result.current.errors.designationCode).toBe('Designation Code is required');
    expect(result.current.errors.designationName).toBe('Designation Name is required');
    expect(result.current.errors.designationNameMarathi).toBe(
      'Designation Name in Marathi is required'
    );
    expect(mockOnSave).not.toHaveBeenCalled();
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('validates code format rejecting invalid special characters', async () => {
    const { result } = renderHook(() =>
      useDesignationMasterForm({
        isOpen: true,
        initialItem: null,
        onSave: mockOnSave,
        onClose: mockOnClose,
      })
    );

    act(() => {
      result.current.setField('designationCode', 'DESIG@123');
      result.current.setField('designationName', 'Clerk');
      result.current.setField('designationNameMarathi', 'लिपिक');
    });

    const fakeEvent = { preventDefault: vi.fn() } as unknown as React.FormEvent;

    await act(async () => {
      await result.current.handleSubmit(fakeEvent);
    });

    expect(result.current.errors.designationCode).toBe(
      'Designation Code must only contain letters, numbers, hyphens, and underscores'
    );
    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it('validates designationName and designationNameMarathi format rejecting invalid characters and numbers', async () => {
    const { result } = renderHook(() =>
      useDesignationMasterForm({
        isOpen: true,
        initialItem: null,
        onSave: mockOnSave,
        onClose: mockOnClose,
      })
    );

    act(() => {
      result.current.setField('designationCode', 'DESIG_VALID');
      result.current.setField('designationName', 'Clerk 123');
      result.current.setField('designationNameMarathi', 'लिपिक १२३');
    });

    const fakeEvent = { preventDefault: vi.fn() } as unknown as React.FormEvent;

    await act(async () => {
      await result.current.handleSubmit(fakeEvent);
    });

    expect(result.current.errors.designationName).toBe(
      'Designation Name can only contain letters, spaces, and valid punctuation (. - / & ())'
    );
    expect(result.current.errors.designationNameMarathi).toBe(
      'Designation Name (Regional) can only contain valid characters and punctuation (. - / & ())'
    );
    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it('validates designationName and designationNameMarathi min length of 5 characters', async () => {
    const { result } = renderHook(() =>
      useDesignationMasterForm({
        isOpen: true,
        initialItem: null,
        onSave: mockOnSave,
        onClose: mockOnClose,
      })
    );

    act(() => {
      result.current.setField('designationCode', 'DESIG_VALID');
      result.current.setField('designationName', 'Head');
      result.current.setField('designationNameMarathi', 'लिप');
    });

    const fakeEvent = { preventDefault: vi.fn() } as unknown as React.FormEvent;

    await act(async () => {
      await result.current.handleSubmit(fakeEvent);
    });

    expect(result.current.errors.designationName).toBe(
      'Designation name must be at least 5 characters'
    );
    expect(result.current.errors.designationNameMarathi).toBe(
      'Designation name (Regional) must be at least 5 characters'
    );
    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it('enforces uniqueness check when code already exists in existingCodes array', async () => {
    const existingCodes = ['CLERK', 'OFFICER'];
    const { result } = renderHook(() =>
      useDesignationMasterForm({
        isOpen: true,
        initialItem: null,
        existingCodes,
        onSave: mockOnSave,
        onClose: mockOnClose,
      })
    );

    act(() => {
      result.current.setField('designationCode', 'CLERK');
      result.current.setField('designationName', 'Clerk');
      result.current.setField('designationNameMarathi', 'लिपिक');
    });

    const fakeEvent = { preventDefault: vi.fn() } as unknown as React.FormEvent;

    await act(async () => {
      await result.current.handleSubmit(fakeEvent);
    });

    expect(result.current.errors.designationCode).toBe(
      'This Designation Code already exists. Codes must be unique.'
    );
    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it('immediately flags duplicate code error on handleBlur before submitting', () => {
    const existingCodes = ['CLERK', 'OFFICER'];
    const { result } = renderHook(() =>
      useDesignationMasterForm({
        isOpen: true,
        initialItem: null,
        existingCodes,
        onSave: mockOnSave,
        onClose: mockOnClose,
      })
    );

    act(() => {
      result.current.setField('designationCode', 'CLERK');
    });

    expect(result.current.errors.designationCode).toBeUndefined();

    act(() => {
      result.current.handleBlur('designationCode');
    });

    expect(result.current.errors.designationCode).toBe(
      'This Designation Code already exists. Codes must be unique.'
    );
  });

  it('submits successfully when form is valid and calls onSave with departmentId and onClose', async () => {
    mockOnSave.mockResolvedValueOnce(undefined);

    const { result } = renderHook(() =>
      useDesignationMasterForm({
        isOpen: true,
        initialItem: null,
        onSave: mockOnSave,
        onClose: mockOnClose,
      })
    );

    act(() => {
      result.current.setField('designationCode', 'ENG_HEAD');
      result.current.setField('designationName', 'Engineering Head');
      result.current.setField('designationNameMarathi', 'अभियांत्रिकी प्रमुख');
      result.current.setField('departmentId', 101);
      result.current.setField('description', 'Lead engineer');
      result.current.setField('isActive', true);
    });

    const fakeEvent = { preventDefault: vi.fn() } as unknown as React.FormEvent;

    await act(async () => {
      await result.current.handleSubmit(fakeEvent);
    });

    expect(mockOnSave).toHaveBeenCalledWith({
      designationCode: 'ENG_HEAD',
      designationName: 'Engineering Head',
      designationNameMarathi: 'अभियांत्रिकी प्रमुख',
      departmentId: 101,
      description: 'Lead engineer',
      isActive: true,
    });
    expect(mockOnClose).toHaveBeenCalled();
  });
});
