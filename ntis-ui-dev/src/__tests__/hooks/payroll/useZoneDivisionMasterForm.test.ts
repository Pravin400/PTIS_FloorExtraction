import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useZoneDivisionMasterForm } from '@/hooks/payroll/useZoneDivisionMasterForm';
import type { ZoneDivisionMasterItem } from '@/types/payroll/MasterModule';

const translations: Record<string, string> = {
  'drawer.validation.officeCodeRequired': 'Office Code is required.',
  'drawer.validation.officeCodeMinLength': 'Office code must be at least 3 characters',
  'drawer.validation.officeCodeMaxLength': 'Office code must not exceed 20 characters',
  'drawer.validation.officeCodeFormat':
    'Code must contain only letters, numbers, hyphens, and underscores',
  'drawer.validation.codeUnique': 'This Office Code already exists. Codes must be unique.',
  'drawer.validation.officeNameRequired': 'Office Name is required.',
  'drawer.validation.officeNameMinLength': 'Office name must be at least 3 characters',
  'drawer.validation.officeNameMaxLength': 'Office name must not exceed 100 characters',
  'drawer.validation.officeNameDuplicate': 'This office name already exists.',
  'drawer.validation.officeNameRegionalRequired': 'Office Name (Regional) is required.',
  'drawer.validation.officeNameRegionalMinLength':
    'Office name (Regional) must be at least 2 characters',
  'drawer.validation.officeNameRegionalMaxLength':
    'Office name (Regional) must not exceed 100 characters',
  'drawer.validation.addressRequired': 'Physical Address is required.',
  'drawer.validation.addressMinLength': 'Physical address must be at least 5 characters',
  'drawer.validation.addressMaxLength': 'Physical address must not exceed 250 characters',
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

const mockItem: ZoneDivisionMasterItem = {
  zoneDivisionId: 'ZONE-001',
  zoneDivisionCode: 'DIV-EAST',
  zoneDivisionName: 'East Division Administrative Office',
  zoneDivisionNameRegional: 'पूर्व विभाग प्रशासकीय कार्यालय',
  address: 'Near Shivaji Statue, Old Agra Road',
  isActive: true,
};

describe('useZoneDivisionMasterForm', () => {
  const mockOnSave = vi.fn();
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes with empty form in create mode', () => {
    const { result } = renderHook(() =>
      useZoneDivisionMasterForm({
        isOpen: true,
        initialItem: null,
        onSave: mockOnSave,
        onClose: mockOnClose,
      })
    );

    expect(result.current.isEdit).toBe(false);
    expect(result.current.form.zoneDivisionCode).toBe('');
    expect(result.current.form.zoneDivisionName).toBe('');
    expect(result.current.form.zoneDivisionNameRegional).toBe('');
    expect(result.current.form.address).toBe('');
    expect(result.current.form.isActive).toBe(true);
    expect(result.current.errors).toEqual({});
  });

  it('populates form with initialItem in edit mode', () => {
    const { result } = renderHook(() =>
      useZoneDivisionMasterForm({
        isOpen: true,
        initialItem: mockItem,
        onSave: mockOnSave,
        onClose: mockOnClose,
      })
    );

    expect(result.current.isEdit).toBe(true);
    expect(result.current.form.zoneDivisionCode).toBe('DIV-EAST');
    expect(result.current.form.zoneDivisionName).toBe('East Division Administrative Office');
    expect(result.current.form.zoneDivisionNameRegional).toBe('पूर्व विभाग प्रशासकीय कार्यालय');
    expect(result.current.form.address).toBe('Near Shivaji Statue, Old Agra Road');
    expect(result.current.form.isActive).toBe(true);
  });

  it('updates form fields and formats code to uppercase alphanumeric', () => {
    const { result } = renderHook(() =>
      useZoneDivisionMasterForm({
        isOpen: true,
        initialItem: null,
        onSave: mockOnSave,
        onClose: mockOnClose,
      })
    );

    act(() => {
      result.current.handleCodeChange('div-east_01@test');
    });
    expect(result.current.form.zoneDivisionCode).toBe('DIV-EAST_01TEST');

    act(() => {
      result.current.handleNameChange('North Zone Office');
    });
    expect(result.current.form.zoneDivisionName).toBe('North Zone Office');

    act(() => {
      result.current.handleRegionalNameChange('उत्तर विभाग कार्यालय');
    });
    expect(result.current.form.zoneDivisionNameRegional).toBe('उत्तर विभाग कार्यालय');

    act(() => {
      result.current.handleAddressChange('Sector 12, Main Road');
    });
    expect(result.current.form.address).toBe('Sector 12, Main Road');

    act(() => {
      result.current.handleStatusToggle(false);
    });
    expect(result.current.form.isActive).toBe(false);
  });

  it('sets validation errors when submitting an empty form', async () => {
    const { result } = renderHook(() =>
      useZoneDivisionMasterForm({
        isOpen: true,
        initialItem: null,
        onSave: mockOnSave,
        onClose: mockOnClose,
      })
    );

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as unknown as React.FormEvent);
    });

    expect(result.current.errors.zoneDivisionCode).toBeDefined();
    expect(result.current.errors.zoneDivisionName).toBeDefined();
    expect(result.current.errors.zoneDivisionNameRegional).toBeDefined();
    expect(result.current.errors.address).toBeDefined();
    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it('detects duplicate code from existingCodes Set', async () => {
    const { result } = renderHook(() =>
      useZoneDivisionMasterForm({
        isOpen: true,
        initialItem: null,
        existingCodes: new Set(['DIV-EAST']),
        onSave: mockOnSave,
        onClose: mockOnClose,
      })
    );

    act(() => {
      result.current.handleCodeChange('DIV-EAST');
      result.current.handleNameChange('New East Office');
      result.current.handleRegionalNameChange('नवीन पूर्व कार्यालय');
      result.current.handleAddressChange('Some valid street address');
    });

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as unknown as React.FormEvent);
    });

    expect(result.current.errors.zoneDivisionCode).toBe(
      'This Office Code already exists. Codes must be unique.'
    );
    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it('submits successfully when form data is valid', async () => {
    mockOnSave.mockResolvedValueOnce(true);

    const { result } = renderHook(() =>
      useZoneDivisionMasterForm({
        isOpen: true,
        initialItem: null,
        onSave: mockOnSave,
        onClose: mockOnClose,
      })
    );

    act(() => {
      result.current.handleCodeChange('HQ-MAIN');
      result.current.handleNameChange('Main Headquarters');
      result.current.handleRegionalNameChange('मुख्य मुख्यालय');
      result.current.handleAddressChange('123 Municipal Complex');
    });

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as unknown as React.FormEvent);
    });

    expect(mockOnSave).toHaveBeenCalledWith({
      zoneDivisionCode: 'HQ-MAIN',
      zoneDivisionName: 'Main Headquarters',
      zoneDivisionNameRegional: 'मुख्य मुख्यालय',
      address: '123 Municipal Complex',
      isActive: true,
      officeType: undefined,
    });
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('displays duplicate office code error immediately upon blur without waiting for submit', () => {
    const { result } = renderHook(() =>
      useZoneDivisionMasterForm({
        isOpen: true,
        initialItem: null,
        existingCodes: new Set(['DIV-EAST']),
        onSave: mockOnSave,
        onClose: mockOnClose,
      })
    );

    act(() => {
      result.current.handleCodeChange('DIV-EAST');
    });

    expect(result.current.showError('zoneDivisionCode')).toBe(false);

    act(() => {
      result.current.handleBlur('zoneDivisionCode');
    });

    expect(result.current.errors.zoneDivisionCode).toBe(
      'This Office Code already exists. Codes must be unique.'
    );
    expect(result.current.showError('zoneDivisionCode')).toBe(true);
  });

  it('resets form state when resetForm is called', () => {
    const { result } = renderHook(() =>
      useZoneDivisionMasterForm({
        isOpen: true,
        initialItem: null,
        onSave: mockOnSave,
        onClose: mockOnClose,
      })
    );

    act(() => {
      result.current.handleCodeChange('DIRTY-ZONE');
      result.current.handleNameChange('Dirty Office');
      result.current.handleAddressChange('Dirty Address');
    });

    expect(result.current.form.zoneDivisionCode).toBe('DIRTY-ZONE');

    act(() => {
      result.current.resetForm();
    });

    expect(result.current.form.zoneDivisionCode).toBe('');
    expect(result.current.form.zoneDivisionName).toBe('');
    expect(result.current.form.address).toBe('');
    expect(result.current.errors).toEqual({});
  });
});
