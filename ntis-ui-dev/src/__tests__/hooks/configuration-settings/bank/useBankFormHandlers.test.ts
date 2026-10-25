import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useBankFormHandlers } from '@/hooks/configuration-settings/bank/useBankFormHandlers';
import type { BankMasterFormData } from '@/types/bank-master.types';

function makeDefaultFormData(overrides: Partial<BankMasterFormData> = {}): BankMasterFormData {
  return {
    bankCode: '',
    bankName: '',
    branchName: '',
    ifscCode: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    isActive: true,
    ...overrides,
  };
}

function makeChangeEvent(name: string, value: string): React.ChangeEvent<HTMLInputElement> {
  return { target: { name, value } } as React.ChangeEvent<HTMLInputElement>;
}

function makeBlurEvent(name: string, value: string): React.FocusEvent<HTMLInputElement> {
  return { target: { name, value } } as React.FocusEvent<HTMLInputElement>;
}

describe('useBankFormHandlers', () => {
  it('should update a plain text field on change', () => {
    const setFormData = vi.fn();
    const setErrors = vi.fn();
    const formData = makeDefaultFormData();

    const { result } = renderHook(() => useBankFormHandlers({ formData, setFormData, setErrors }));

    act(() => {
      result.current.handleChange(makeChangeEvent('bankName', 'HDFC Bank'));
    });

    expect(setFormData).toHaveBeenCalled();
    const updater = setFormData.mock.calls[0][0];
    const updated = updater(formData);
    expect(updated.bankName).toBe('HDFC Bank');
  });

  it('should uppercase bankCode on change', () => {
    const setFormData = vi.fn();
    const setErrors = vi.fn();
    const formData = makeDefaultFormData();

    const { result } = renderHook(() => useBankFormHandlers({ formData, setFormData, setErrors }));

    act(() => {
      result.current.handleChange(makeChangeEvent('bankCode', 'sbi001'));
    });

    const updater = setFormData.mock.calls[0][0];
    const updated = updater(formData);
    expect(updated.bankCode).toBe('SBI001');
  });

  it('should uppercase ifscCode on change', () => {
    const setFormData = vi.fn();
    const setErrors = vi.fn();
    const formData = makeDefaultFormData();

    const { result } = renderHook(() => useBankFormHandlers({ formData, setFormData, setErrors }));

    act(() => {
      result.current.handleChange(makeChangeEvent('ifscCode', 'sbin0001234'));
    });

    const updater = setFormData.mock.calls[0][0];
    const updated = updater(formData);
    expect(updated.ifscCode).toBe('SBIN0001234');
  });

  it('should NOT uppercase other fields on change', () => {
    const setFormData = vi.fn();
    const setErrors = vi.fn();
    const formData = makeDefaultFormData();

    const { result } = renderHook(() => useBankFormHandlers({ formData, setFormData, setErrors }));

    act(() => {
      result.current.handleChange(makeChangeEvent('city', 'mumbai'));
    });

    const updater = setFormData.mock.calls[0][0];
    const updated = updater(formData);
    expect(updated.city).toBe('mumbai');
  });

  it('should call setFormData and setErrors on blur', () => {
    const setFormData = vi.fn();
    const setErrors = vi.fn();
    const formData = makeDefaultFormData({ bankCode: 'SBI001' });

    const { result } = renderHook(() => useBankFormHandlers({ formData, setFormData, setErrors }));

    act(() => {
      result.current.handleBlur(makeBlurEvent('bankCode', 'SBI001'));
    });

    expect(setFormData).toHaveBeenCalled();
    expect(setErrors).toHaveBeenCalled();
  });

  it('handleBlur should apply validation errors on a blank required field', () => {
    const setFormData = vi.fn();
    const actualErrors: Record<string, string> = {};
    const setErrors = vi.fn((errorsOrUpdater) => {
      const result =
        typeof errorsOrUpdater === 'function' ? errorsOrUpdater(actualErrors) : errorsOrUpdater;
      Object.assign(actualErrors, result);
    });

    const formData = makeDefaultFormData({ bankCode: '' });

    const { result } = renderHook(() => useBankFormHandlers({ formData, setFormData, setErrors }));

    act(() => {
      result.current.handleBlur(makeBlurEvent('bankCode', ''));
    });

    expect(setErrors).toHaveBeenCalled();
  });

  it('handleToggleStatus should flip isActive from true to false', () => {
    const setFormData = vi.fn();
    const setErrors = vi.fn();
    const formData = makeDefaultFormData({ isActive: true });

    const { result } = renderHook(() => useBankFormHandlers({ formData, setFormData, setErrors }));

    act(() => {
      result.current.handleToggleStatus();
    });

    const updater = setFormData.mock.calls[0][0];
    const updated = updater(formData);
    expect(updated.isActive).toBe(false);
  });

  it('handleToggleStatus should flip isActive from false to true', () => {
    const setFormData = vi.fn();
    const setErrors = vi.fn();
    const formData = makeDefaultFormData({ isActive: false });

    const { result } = renderHook(() => useBankFormHandlers({ formData, setFormData, setErrors }));

    act(() => {
      result.current.handleToggleStatus();
    });

    const updater = setFormData.mock.calls[0][0];
    const updated = updater(formData);
    expect(updated.isActive).toBe(true);
  });
});
