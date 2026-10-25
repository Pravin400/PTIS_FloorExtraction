import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useBankFormState } from '@/hooks/configuration-settings/bank/useBankFormState';
import type { BankMasterData } from '@/types/bank-master.types';

const makeBankData = (overrides: Partial<BankMasterData> = {}): BankMasterData => ({
  id: '1',
  bankCode: 'SBI001',
  bankName: 'State Bank of India',
  branchName: 'Main Branch',
  ifscCode: 'SBIN0001234',
  address: '123 MG Road',
  city: 'Mumbai',
  state: 'Maharashtra',
  pincode: '400001',
  isActive: true,
  ...overrides,
});

describe('useBankFormState', () => {
  describe('default initial state (no initialData)', () => {
    it('should initialise formData with empty strings and isActive=true', () => {
      const { result } = renderHook(() => useBankFormState());

      const { formData } = result.current;
      expect(formData.bankCode).toBe('');
      expect(formData.bankName).toBe('');
      expect(formData.branchName).toBe('');
      expect(formData.ifscCode).toBe('');
      expect(formData.address).toBe('');
      expect(formData.city).toBe('');
      expect(formData.state).toBe('');
      expect(formData.pincode).toBe('');
      expect(formData.isActive).toBe(true);
    });

    it('should initialise errors as an empty object', () => {
      const { result } = renderHook(() => useBankFormState());
      expect(result.current.errors).toEqual({});
    });

    it('should initialise isSubmitting to false', () => {
      const { result } = renderHook(() => useBankFormState());
      expect(result.current.isSubmitting).toBe(false);
    });

    it('should initialise open to true', () => {
      const { result } = renderHook(() => useBankFormState());
      expect(result.current.open).toBe(true);
    });
  });

  describe('hydration from initialData', () => {
    it('should populate formData from BankMasterData', () => {
      const data = makeBankData();
      const { result } = renderHook(() => useBankFormState(data));

      const { formData } = result.current;
      expect(formData.bankCode).toBe('SBI001');
      expect(formData.bankName).toBe('State Bank of India');
      expect(formData.branchName).toBe('Main Branch');
      expect(formData.ifscCode).toBe('SBIN0001234');
      expect(formData.address).toBe('123 MG Road');
      expect(formData.city).toBe('Mumbai');
      expect(formData.state).toBe('Maharashtra');
      expect(formData.pincode).toBe('400001');
      expect(formData.isActive).toBe(true);
    });

    it('should default nullable fields to empty string when undefined', () => {
      const data = makeBankData({ branchName: undefined, address: undefined, city: undefined });
      const { result } = renderHook(() => useBankFormState(data));

      expect(result.current.formData.branchName).toBe('');
      expect(result.current.formData.address).toBe('');
      expect(result.current.formData.city).toBe('');
    });

    it('should respect isActive=false from initialData', () => {
      const data = makeBankData({ isActive: false });
      const { result } = renderHook(() => useBankFormState(data));
      expect(result.current.formData.isActive).toBe(false);
    });
  });

  describe('state setters', () => {
    it('setFormData should update formData', () => {
      const { result } = renderHook(() => useBankFormState());

      act(() => {
        result.current.setFormData((prev) => ({ ...prev, bankName: 'HDFC Bank' }));
      });

      expect(result.current.formData.bankName).toBe('HDFC Bank');
    });

    it('setErrors should store validation errors', () => {
      const { result } = renderHook(() => useBankFormState());

      act(() => {
        result.current.setErrors({ bankCode: 'bankCodeRequired' });
      });

      expect(result.current.errors).toEqual({ bankCode: 'bankCodeRequired' });
    });

    it('setIsSubmitting should toggle submitting state', () => {
      const { result } = renderHook(() => useBankFormState());

      act(() => {
        result.current.setIsSubmitting(true);
      });
      expect(result.current.isSubmitting).toBe(true);

      act(() => {
        result.current.setIsSubmitting(false);
      });
      expect(result.current.isSubmitting).toBe(false);
    });

    it('setOpen should toggle dialog open state', () => {
      const { result } = renderHook(() => useBankFormState());

      act(() => {
        result.current.setOpen(false);
      });
      expect(result.current.open).toBe(false);

      act(() => {
        result.current.setOpen(true);
      });
      expect(result.current.open).toBe(true);
    });
  });
});
