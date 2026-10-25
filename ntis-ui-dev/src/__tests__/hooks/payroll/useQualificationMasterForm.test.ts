import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useQualificationMasterForm } from '@/hooks/payroll/useQualificationMasterForm';
import type { QualificationMasterItem } from '@/types/payroll/MasterModule';

const translations: Record<string, string> = {
  'form.validation.qualificationCodeRequired': 'Qualification Code is required.',
  'form.validation.qualificationCodeFormat':
    'Code must contain only letters, numbers, underscores, and hyphens',
  'form.validation.qualificationNameRequired': 'Qualification Name is required.',
  'form.validation.qualificationNameMinLength': 'Qualification name must be at least 2 characters',
  'form.validation.qualificationNameRegionalRequired': 'Qualification Name (Regional) is required.',
  'form.validation.qualificationNameRegionalMinLength':
    'Qualification name (Regional) must be at least 2 characters',
  'form.validation.codeUnique': 'This Qualification Code already exists. Codes must be unique.',
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

const mockItem: QualificationMasterItem = {
  id: 1,
  qualificationId: 'QUAL-1',
  qualificationCode: 'BCOM',
  qualificationName: 'Bachelor of Commerce',
  qualificationNameRegional: 'वाणिज्य पदवी',
  sequenceNo: 1,
  isActive: true,
};

describe('useQualificationMasterForm', () => {
  const mockOnSave = vi.fn();
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes with empty form in create mode', () => {
    const { result } = renderHook(() =>
      useQualificationMasterForm({
        isOpen: true,
        initialItem: null,
        onSave: mockOnSave,
        onClose: mockOnClose,
      })
    );

    expect(result.current.isEdit).toBe(false);
    expect(result.current.form.qualificationCode).toBe('');
    expect(result.current.form.qualificationName).toBe('');
    expect(result.current.form.qualificationNameRegional).toBe('');
    expect(result.current.form.sequenceNo).toBe(null);
    expect(result.current.form.isActive).toBe(true);
    expect(result.current.errors).toEqual({});
  });

  it('populates form with initialItem in edit mode', () => {
    const { result } = renderHook(() =>
      useQualificationMasterForm({
        isOpen: true,
        initialItem: mockItem,
        onSave: mockOnSave,
        onClose: mockOnClose,
      })
    );

    expect(result.current.isEdit).toBe(true);
    expect(result.current.form.qualificationCode).toBe('BCOM');
    expect(result.current.form.qualificationName).toBe('Bachelor of Commerce');
    expect(result.current.form.qualificationNameRegional).toBe('वाणिज्य पदवी');
    expect(result.current.form.sequenceNo).toBe(1);
    expect(result.current.form.isActive).toBe(true);
  });

  it('updates form fields and clears associated field error when setField is called', () => {
    const { result } = renderHook(() =>
      useQualificationMasterForm({
        isOpen: true,
        initialItem: null,
        onSave: mockOnSave,
        onClose: mockOnClose,
      })
    );

    act(() => {
      result.current.setField('qualificationCode', 'MSC');
    });

    expect(result.current.form.qualificationCode).toBe('MSC');
  });

  it('fails validation when submitting an empty form', async () => {
    const { result } = renderHook(() =>
      useQualificationMasterForm({
        isOpen: true,
        initialItem: null,
        onSave: mockOnSave,
        onClose: mockOnClose,
      })
    );

    await act(async () => {
      const e = { preventDefault: vi.fn() } as unknown as React.FormEvent;
      await result.current.handleSubmit(e);
    });

    expect(mockOnSave).not.toHaveBeenCalled();
    expect(result.current.errors.qualificationCode).toBeDefined();
    expect(result.current.errors.qualificationName).toBeDefined();
    expect(result.current.errors.qualificationNameRegional).toBeDefined();
  });

  it('enforces code uniqueness against existingCodes set', async () => {
    const existingCodes = new Set(['BCOM', 'BE']);
    const { result } = renderHook(() =>
      useQualificationMasterForm({
        isOpen: true,
        initialItem: null,
        existingCodes,
        onSave: mockOnSave,
        onClose: mockOnClose,
      })
    );

    act(() => {
      result.current.setField('qualificationCode', 'BCOM');
      result.current.setField('qualificationName', 'Bachelor of Commerce');
      result.current.setField('qualificationNameRegional', 'वाणिज्य पदवी');
    });

    await act(async () => {
      const e = { preventDefault: vi.fn() } as unknown as React.FormEvent;
      await result.current.handleSubmit(e);
    });

    expect(mockOnSave).not.toHaveBeenCalled();
    expect(result.current.errors.qualificationCode).toBe(
      'This Qualification Code already exists. Codes must be unique.'
    );
  });

  it('immediately flags duplicate code error on handleBlur before submitting', () => {
    const existingCodes = new Set(['BCOM', 'BE']);
    const { result } = renderHook(() =>
      useQualificationMasterForm({
        isOpen: true,
        initialItem: null,
        existingCodes,
        onSave: mockOnSave,
        onClose: mockOnClose,
      })
    );

    act(() => {
      result.current.setField('qualificationCode', 'BCOM');
    });

    expect(result.current.errors.qualificationCode).toBeUndefined();

    act(() => {
      result.current.handleBlur('qualificationCode');
    });

    expect(result.current.errors.qualificationCode).toBe(
      'This Qualification Code already exists. Codes must be unique.'
    );
  });

  it('allows same code during edit mode for the current item', async () => {
    const existingCodes = new Set(['BCOM', 'BE']);
    mockOnSave.mockResolvedValue(true);

    const { result } = renderHook(() =>
      useQualificationMasterForm({
        isOpen: true,
        initialItem: mockItem,
        existingCodes,
        onSave: mockOnSave,
        onClose: mockOnClose,
      })
    );

    await act(async () => {
      const e = { preventDefault: vi.fn() } as unknown as React.FormEvent;
      await result.current.handleSubmit(e);
    });

    expect(mockOnSave).toHaveBeenCalledWith({
      qualificationCode: 'BCOM',
      qualificationName: 'Bachelor of Commerce',
      qualificationNameRegional: 'वाणिज्य पदवी',
      sequenceNo: 1,
      isActive: true,
    });
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('validates qualificationName and qualificationNameRegional min length of 2 characters', async () => {
    const { result } = renderHook(() =>
      useQualificationMasterForm({
        isOpen: true,
        initialItem: null,
        onSave: mockOnSave,
        onClose: mockOnClose,
      })
    );

    act(() => {
      result.current.setField('qualificationCode', 'QUAL1');
      result.current.setField('qualificationName', 'B');
      result.current.setField('qualificationNameRegional', 'अ');
    });

    const fakeEvent = { preventDefault: vi.fn() } as unknown as React.FormEvent;

    await act(async () => {
      await result.current.handleSubmit(fakeEvent);
    });

    expect(result.current.errors.qualificationName).toBe(
      'Qualification name must be at least 2 characters'
    );
    expect(result.current.errors.qualificationNameRegional).toBe(
      'Qualification name (Regional) must be at least 2 characters'
    );
    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it('validates min length on field blur', () => {
    const { result } = renderHook(() =>
      useQualificationMasterForm({
        isOpen: true,
        initialItem: null,
        onSave: mockOnSave,
        onClose: mockOnClose,
      })
    );

    act(() => {
      result.current.setField('qualificationName', 'A');
    });

    act(() => {
      result.current.handleBlur('qualificationName');
    });

    expect(result.current.errors.qualificationName).toBe(
      'Qualification name must be at least 2 characters'
    );

    act(() => {
      result.current.setField('qualificationNameRegional', 'अ');
    });

    act(() => {
      result.current.handleBlur('qualificationNameRegional');
    });

    expect(result.current.errors.qualificationNameRegional).toBe(
      'Qualification name (Regional) must be at least 2 characters'
    );
  });
});
